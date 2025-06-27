import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { FiDownload, FiShare2, FiTrash2, FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import { FaYoutube, FaFacebook, FaInstagram } from 'react-icons/fa';
import ReactPlayer from 'react-player';
import { Layout } from '../../../components/layout/Layout';
import { Button } from '../../../components/common/Button/Button';
import { VideoService } from '../../../services/video.service';
import { Video, VideoWithDetails } from '../../../mockdata/videos';
import { Modal } from '../../../components/common/Modal/Modal';
import { toast } from 'react-toastify';
import { SocialService } from '@/services/social.service';
import { useAuth } from '@/context/AuthContext';

interface FacebookPage {
  page_id: string;
  page_name: string;
  page_access_token: string;
  category?: string;
  about?: string;
  picture_url?: string;
  is_published: boolean;
}

interface FacebookPageSelectorProps {
  onPageSelect: (page: FacebookPage | null) => void;
  selectedPageId?: string;
}

const FacebookPageSelector: React.FC<FacebookPageSelectorProps> = ({
  onPageSelect,
  selectedPageId
}) => {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const { auth } = useAuth();

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/facebook-pages/`, {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPages(data.pages || []);
        }
      } catch (err) {
        console.error('Failed to fetch Facebook pages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [auth.token]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading Facebook Pages...</div>;
  }

  if (pages.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
        No Facebook Pages found. Make sure you have pages you can manage.
      </div>
    );
  }

  return (
    <select
      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-800"
      value={selectedPageId || ''}
      onChange={(e) => {
        const selected = pages.find(p => p.page_id === e.target.value);
        onPageSelect(selected || null);
      }}
    >
      <option value="">Select a Facebook Page</option>
      {pages.map((page) => (
        <option key={page.page_id} value={page.page_id}>
          {page.page_name} {page.category ? `(${page.category})` : ''}
        </option>
      ))}
    </select>
  );
};

const VideoDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;  const [video, setVideo] = useState<VideoWithDetails | null>(null);  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { auth } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const shareDropdownRef = useRef<HTMLDivElement>(null);
  const [ytTitle, setYtTitle] = useState('');
  const [ytDesc, setYtDesc] = useState('');
  const [ytTags, setYtTags] = useState('');
  const [ytPrivacy, setYtPrivacy] = useState<'public'|'private'|'unlisted'>('public');
  
  // Facebook upload states
  const [fbTitle, setFbTitle] = useState('');
  const [fbDesc, setFbDesc] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');
  const [isUploadingFb, setIsUploadingFb] = useState(false);
  
  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const fetchedVideo = await VideoService.getVideoById(id as string);
        setVideo(fetchedVideo);
        setError('');
      } catch (err) {
        setError('Failed to load video details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };    fetchVideo();  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
        setShowShareDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    try {
      await VideoService.deleteVideo(id as string);
      setShowDeleteModal(false);
      toast.success('Video deleted successfully',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to delete video:', err);
      toast.error('Failed to delete video',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
      setError('Failed to delete video');
    }
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/video/download/${id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );
      if (!res.ok) throw new Error('Cannot download video');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${video?.title || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Video download failed!',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
    }
  };
  const handleShare = () => {
    setShowShareDropdown(!showShareDropdown);
  };

  const handleShareToYoutube = () => {
    if (!auth.user?.social_credentials?.google) {
      toast.error('You need to link your Google account first!');
      setTimeout(() => {
        window.location.href = '/auth/linkGoogle';
      }, 1200);
      return;
    }
    handleOpenUploadModal();
    setShowShareDropdown(false);
  };

  const handleShareToFacebook = () => {
    if (!auth.user?.social_credentials?.facebook) {
      toast.error('You need to link your Facebook account first!',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
      setTimeout(() => {
        window.location.href = '/auth/linkFacebook';
      }, 1200);
      return;
    }
    handleOpenFacebookModal();
    setShowShareDropdown(false);
  };

  const handleShareToInstagram = () => {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/video/${id}`);
    toast.success('Link copied! Paste it in your Instagram post or story');
    setShowShareDropdown(false);
  };
  
  const handleOpenUploadModal = () => {
    setYtTitle(video?.title || '');
    setYtDesc(video?.description || '');
    setYtTags((video?.tags || []).join(', '));
    setYtPrivacy('public');
    setShowUploadModal(true);
  };
  
  const handleOpenFacebookModal = () => {
    setFbTitle(video?.title || '');
    setFbDesc(video?.description || '');
    setShowFacebookModal(true);
  };
  
  const handleUploadToYouTube = async () => {
    if (!video) return;
    if (!auth.user?.social_credentials?.google) {
      toast.error('You need to link your Google account before uploading to YouTube!',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
      setTimeout(() => {
        window.location.href = '/auth/linkGoogle';
      }, 1200);
      return;
    }
    try {
      setIsUploading(true);
      const tagsArr = ytTags.split(',').map(tag => tag.trim()).filter(Boolean);
      const youtubeUrl = await SocialService.uploadVideoToYouTube(
        video.id,
        ytTitle,
        ytDesc,
        tagsArr,
        ytPrivacy
      );
      const cleanUrl = youtubeUrl.replace(/^"|"$/g, '');
      toast.success('Successfully uploaded to YouTube!',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
      window.open(cleanUrl, '_blank');
      setShowUploadModal(false);
    } catch (err: any) {
      toast.error('YouTube upload failed: ' + err.message,
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleUploadToFacebook = async () => {
    if (!video || !selectedPageId) return;
    
    if (!auth.user?.social_credentials?.facebook) {
      toast.error('You need to link your Facebook account before uploading!',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
      setTimeout(() => {
        window.location.href = '/auth/linkFacebook';
      }, 1200);
      return;
    }

    try {
      setIsUploadingFb(true);
      
      const uploadData = {
        media_id: video.id,
        platform: 'facebook',
        page_id: selectedPageId,
        title: fbTitle,
        description: fbDesc,
        privacy_status: 'public'
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/facebook-pages/upload-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Facebook upload failed');
      }

      const result = await response.json();
      
      toast.success('Successfully uploaded to Facebook Page!',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
      
      setShowFacebookModal(false);
      
    } catch (err: any) {
      toast.error('Facebook upload failed: ' + err.message,
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
    } finally {
      setIsUploadingFb(false);
    }
  };
  
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !video) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500 mb-4">{error || 'Video not found'}</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            icon={<FiArrowLeft />}
            className="mb-6 bg-white/80 backdrop-blur-sm hover:bg-white border-slate-200 text-slate-700 shadow-sm"
          >
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>
          
          {/* Video Header */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6 mb-6">
            <h1 className="text-2xl font-bold mb-3 text-slate-800">{video.title}</h1>
            <div className="flex items-center gap-6 text-slate-600 text-sm mb-4">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Created {new Date(video.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {video.duration} seconds
              </span>
            </div>
            
            {(video.tags && Array.isArray(video.tags) && video.tags.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-full border border-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-3">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 overflow-hidden mb-6">
                <div className="aspect-video w-full">
                  <ReactPlayer
                    url={video.url}
                    width="100%"
                    height="100%"
                    controls
                    className="rounded-lg"
                  />
                </div>
              </div>

              {/* Video Details */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6">
                <h2 className="text-lg font-semibold mb-4 text-slate-800">
                  Video Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-600 mb-2">Description</h3>
                    <p className="text-slate-800 text-sm leading-relaxed">{video.description}</p>
                  </div>
                  <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-600 mb-2">Duration</h3>
                    <p className="text-slate-800 text-sm">{video.duration} seconds</p>
                  </div>
                  <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-600 mb-2">Voice</h3>
                    <p className="text-slate-800 text-sm">{video.voiceName || 'Default'}</p>
                  </div>
                  <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-600 mb-2">Background</h3>
                    <p className="text-slate-800 text-sm">{video.backgroundName || 'Default'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-5 sticky top-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">Actions</h3>
                <div className="space-y-3">
                  <Button 
                    onClick={handleDownload} 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-0 text-sm"
                    icon={<FiDownload />}
                  >
                    Download Video
                  </Button>                  
                  <div className="relative" ref={shareDropdownRef}>
                    <Button 
                      onClick={handleShare}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm border-0 text-sm flex items-center justify-center gap-2"
                    >
                      <FiShare2 />
                      Share Video
                      <FiChevronDown />
                    </Button>
                    
                    {showShareDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                        <div className="py-1">
                          <button
                            onClick={handleShareToYoutube}
                            className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 text-slate-700 hover:text-red-600 text-sm transition-colors"
                          >
                            <FaYoutube className="text-red-500" />
                            YouTube
                          </button>
                          <button
                            onClick={handleShareToFacebook}
                            className="w-full px-4 py-2.5 text-left hover:bg-blue-50 flex items-center gap-3 text-slate-700 hover:text-blue-600 text-sm transition-colors"
                          >
                            <FaFacebook className="text-blue-500" />
                            Facebook
                          </button>
                          <button
                            onClick={handleShareToInstagram}
                            className="w-full px-4 py-2.5 text-left hover:bg-pink-50 flex items-center gap-3 text-slate-700 hover:text-pink-600 text-sm transition-colors"
                          >
                            <FaInstagram className="text-pink-500" />
                            Instagram
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => setShowDeleteModal(true)}
                    variant="danger"
                    className="w-full bg-red-500 hover:bg-red-600 text-white shadow-sm border-0 text-sm"
                    icon={<FiTrash2 />}
                  >
                    Delete Video
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>      
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Video"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FiTrash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Delete Video</h3>
            <p className="text-slate-600">Are you sure you want to delete <strong>"{video.title}"</strong>?</p>
            <p className="text-slate-500 text-sm mt-1">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteModal(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Facebook Upload Modal */}
      <Modal
        isOpen={showFacebookModal}
        onClose={() => setShowFacebookModal(false)}
        title="Upload to Facebook Page"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <FaFacebook className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Upload to Facebook Page</h3>
            <p className="text-slate-600 text-sm">Choose a Facebook Page and customize your video information</p>
          </div>
          
          {/* Facebook Page Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Facebook Page</label>
            <FacebookPageSelector 
              selectedPageId={selectedPageId}
              onPageSelect={(page: FacebookPage | null) => setSelectedPageId(page?.page_id || '')}
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-800"
                value={fbTitle}
                onChange={e => setFbTitle(e.target.value)}
                placeholder="Enter video title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-800"
                rows={3}
                value={fbDesc}
                onChange={e => setFbDesc(e.target.value)}
                placeholder="Enter video description"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <Button 
              variant="outline" 
              onClick={() => setShowFacebookModal(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadToFacebook} 
              disabled={isUploadingFb || !selectedPageId || !fbTitle.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white border-0"
            >
              {isUploadingFb ? 'Uploading...' : 'Upload to Facebook'}
            </Button>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload to YouTube"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <FaYoutube className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Upload to YouTube</h3>
            <p className="text-slate-600 text-sm">Customize your video information before uploading</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-800"
                value={ytTitle}
                onChange={e => setYtTitle(e.target.value)}
                placeholder="Enter video title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-800"
                rows={3}
                value={ytDesc}
                onChange={e => setYtDesc(e.target.value)}
                placeholder="Enter video description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-800"
                value={ytTags}
                onChange={e => setYtTags(e.target.value)}
                placeholder="Enter tags separated by commas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Privacy</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-800"
                value={ytPrivacy}
                onChange={e => setYtPrivacy(e.target.value as 'public'|'private'|'unlisted')}
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <Button 
              variant="outline" 
              onClick={() => setShowUploadModal(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadToYouTube} 
              disabled={isUploading}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
            >
              {isUploading ? 'Uploading...' : 'Upload to YouTube'}
            </Button>
          </div>
        </div>
      </Modal>
      
    </Layout>
  );
};

export default VideoDetailPage;
