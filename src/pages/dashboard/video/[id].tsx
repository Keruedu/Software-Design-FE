import { useRouter } from 'next/router';
import { useEffect, useState, useRef, use } from 'react';
import { FiDownload, FiShare2, FiTrash2, FiArrowLeft, FiChevronDown, FiEye, FiHeart, FiMessageCircle, FiRefreshCw } from 'react-icons/fi';
import { FaYoutube, FaFacebook, FaInstagram, FaThumbsUp, FaShare } from 'react-icons/fa';
import ReactPlayer from 'react-player';
import { Layout } from '../../../components/layout/Layout';
import { Button } from '../../../components/common/Button/Button';
import { VideoService } from '../../../services/video.service';
import { Video, VideoWithDetails } from '../../../mockdata/videos';
import { Modal } from '../../../components/common/Modal/Modal';
import { toast } from 'react-toastify';
import { SocialService } from '@/services/social.service';
import { useAuth } from '@/context/AuthContext';
import { platform } from 'os';

// Interface for social media statistics
interface YouTubeStats {
  platform: 'google';
  title: string;
  description: string;
  platform_url: string;
  created_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
}

interface FacebookStats {
  platform: 'facebook';
  title: string;
  description: string;
  platform_url: string;
  created_at: string;
  view_count: number;
  reaction_count: {
    LIKE: number;
    LOVE: number;
    WOW: number;
    HAHA: number;
    SAD: number;
    ANGRY: number;
  };
  share_count: number;
  comment_count: number;
}

type SocialMediaStats = YouTubeStats | FacebookStats;
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
  const { id } = router.query;
  const [video, setVideo] = useState<VideoWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [listVideoFacebook, setListVideoFacebook] = useState<Array<{ video_url: string; page_id: string }>>([]);
  const [listVideoYoutube, setListVideoYoutube] = useState<Array<string>>([]);
  // Social media statistics state
  const [socialStats, setSocialStats] = useState<SocialMediaStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Facebook upload states
  const [fbTitle, setFbTitle] = useState('');
  const [fbDesc, setFbDesc] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');
  const [isUploadingFb, setIsUploadingFb] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  
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
    };
    
    fetchVideo();
  }, [id]);

useEffect(() => {
  if (!id) return;

  const fetchListVideoSocial = async () => {
    if (typeof id !=="string") return;
    try {
      setLoadingStats(true);
      const facebookVideos = await VideoService.getListVideoSocial('facebook',id);
      setListVideoFacebook(facebookVideos);

      const youtubeVideos = await VideoService.getListVideoSocial('google',id);
      setListVideoYoutube(youtubeVideos);
    } catch (err) {
      setError('Failed to load video details');
      console.error(err);
    }
    finally {
      setLoadingStats(false);
    }
  };
  console.log("Fetching social videos for ID:", id, "Facebook:", listVideoFacebook, "YouTube:", listVideoYoutube);
  fetchListVideoSocial();
}, [id]);

useEffect(() => {
  if (!id) return;

  const fetchSocialStats = async () => {
    if (!id) return;
    try {
      setLoadingStats(true);
      const newStats: SocialMediaStats[] = [];

      for (const video of listVideoYoutube) {
        const response = await VideoService.getStatVideoSocial("google", video);
        if (response) {
          newStats.push(response);
        }
      }

      for (const video of listVideoFacebook) {
        const response = await VideoService.getStatVideoSocial("facebook", video.video_url, video.page_id);
        if (response) {
          newStats.push(response);
        }
      }

      setSocialStats(newStats);
    } catch (err) {
      setError("Failed to load video details");
      console.error(err);
    }
    finally {
      setLoadingStats(false);
    }
  };

  fetchSocialStats();
}, [id, listVideoFacebook, listVideoYoutube]);

  
  // // Fetch social media statistics
  // useEffect(() => {
  //   const fetchSocialStats = async () => {
  //     if (!id) return;
      
  //     try {
  //       setLoadingStats(true);
  //       // Replace with actual API endpoint
  //       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/video/${id}/social-stats`, {
  //         headers: {
  //           Authorization: `Bearer ${auth.token}`,
  //         },
  //       });
        
  //       if (response.ok) {
  //         const stats = await response.json();
  //         setSocialStats(stats);
  //       }
  //     } catch (err) {
  //       console.error('Failed to fetch social media statistics:', err);
  //     } finally {
  //       setLoadingStats(false);
  //     }
  //   };
    
  //   fetchSocialStats();
  // }, [id, auth.token]);


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

  // Helper function to sanitize filename while preserving Vietnamese characters
  const sanitizeFileName = (filename: string): string => {
    // Remove only characters that are invalid in file names on Windows/Mac/Linux
    // Keep Vietnamese characters, spaces, and other unicode characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid file name characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing spaces
  };

  // Fallback download function for older browsers
  const fallbackDownload = async (videoUrl: string, fileName: string, videoTitle: string) => {
    try {
      const response = await fetch(videoUrl);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        
        toast.success(`"${videoTitle}" downloaded`, {
          position: 'bottom-right',
          autoClose: 3000
        });
      } else {
        // Final fallback: open in new tab
        const link = document.createElement('a');
        link.href = videoUrl;
        link.target = '_blank';
        link.click();
        
        toast.info('Video opened in new tab - right-click to save', {
          position: 'bottom-right',
          autoClose: 4000
        });
      }
    } catch (fetchError) {
      // Final fallback: open in new tab
      const link = document.createElement('a');
      link.href = videoUrl;
      link.target = '_blank';
      link.click();
      
      toast.info('Video opened in new tab - right-click to save', {
        position: 'bottom-right',
        autoClose: 4000
      });
    }
  };

  const handleDownload = async () => {
    if (!id || !video) return;
    
    try {
      setDownloadLoading(true);
      
      // Get video URL
      const videoUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/video/download/${id}`;
      
      // Sanitize filename
      const fileName = `${sanitizeFileName(video.title || 'video')}.mp4`;

      // Check if browser supports File System Access API
      if ('showSaveFilePicker' in window) {
        try {
          // Use File System Access API for modern browsers
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'Video files',
              accept: {
                'video/mp4': ['.mp4'],
                'video/*': ['.mp4', '.mov', '.avi']
              }
            }]
          });

          // Fetch video with auth headers and write to selected location
          const response = await fetch(videoUrl, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch video');
          }

          const writable = await fileHandle.createWritable();
          await response.body?.pipeTo(writable);

          toast.success(`"${video.title}" downloaded successfully`, {
            position: 'bottom-right',
            autoClose: 3000
          });
        } catch (filePickerError: any) {
          // User cancelled or API failed, fallback to regular download
          if (filePickerError.name !== 'AbortError') {
            console.warn('File picker failed, falling back to regular download:', filePickerError);
            // Create authenticated video URL for fallback
            const response = await fetch(videoUrl, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${auth.token}`,
              },
            });
            if (!response.ok) throw new Error('Cannot download video');
            const blob = await response.blob();
            const authenticatedUrl = URL.createObjectURL(blob);
            await fallbackDownload(authenticatedUrl, fileName, video.title);
            // Clean up
            setTimeout(() => URL.revokeObjectURL(authenticatedUrl), 100);
          }
          // If AbortError, user cancelled - do nothing
        }
      } else {
        // Fallback for older browsers
        const response = await fetch(videoUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        if (!response.ok) throw new Error('Cannot download video');
        const blob = await response.blob();
        const authenticatedUrl = URL.createObjectURL(blob);
        await fallbackDownload(authenticatedUrl, fileName, video.title);
        // Clean up
        setTimeout(() => URL.revokeObjectURL(authenticatedUrl), 100);
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download video. Please try again.', {
        position: 'bottom-right',
        autoClose: 3000
      });
    } finally {
      setDownloadLoading(false);
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

      const response = await SocialService.uploadVideoToFacebook(
        video.id,
        fbTitle,
        fbDesc,
        selectedPageId
      )

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
                Created {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'Unknown date'}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {video.duration ? 
                  `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 
                  'Duration unknown'
                }
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

              {/* Video Statistics from Social Networks */}
              {loadingStats && (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6">
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-slate-600">Loading statistics...</span>
                  </div>
                </div>
              )}
              
              {socialStats.length > 0 &&!loadingStats && (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6">
                  
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {socialStats.map((stat, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4">
                        {stat.platform === 'google' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                              <FaYoutube className="text-red-500 text-xl" />
                              <div>
                                <h4 className="font-semibold text-slate-800">YouTube</h4>
                                <p className="text-xs text-slate-600">
                                  Published: {new Date(stat.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                                  <FiEye className="text-sm" />
                                  <span className="text-xs font-medium">Views</span>
                                </div>
                                <div className="text-lg font-bold text-slate-800">
                                  {stat.view_count.toLocaleString()}
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-red-600 mb-1">
                                  <FiHeart className="text-sm" />
                                  <span className="text-xs font-medium">Likes</span>
                                </div>
                                <div className="text-lg font-bold text-slate-800">
                                  {stat.like_count.toLocaleString()}
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                                  <FiMessageCircle className="text-sm" />
                                  <span className="text-xs font-medium">Comments</span>
                                </div>
                                <div className="text-lg font-bold text-slate-800">
                                  {stat.comment_count.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="pt-3 border-t border-slate-200">
                              <a
                                href={stat.platform_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                              >
                                View on YouTube →
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {stat.platform === 'facebook' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                              <FaFacebook className="text-blue-500 text-xl" />
                              <div>
                                <h4 className="font-semibold text-slate-800">Facebook</h4>
                                <p className="text-xs text-slate-600">
                                  Published: {new Date(stat.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                                  <FiEye className="text-sm" />
                                  <span className="text-xs font-medium">Views</span>
                                </div>
                                <div className="text-lg font-bold text-slate-800">
                                  {stat.view_count.toLocaleString()}
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-purple-600 mb-1">
                                  <FaShare className="text-sm" />
                                  <span className="text-xs font-medium">Shares</span>
                                </div>
                                <div className="text-lg font-bold text-slate-800">
                                  {stat.share_count.toLocaleString()}
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                                  <FiMessageCircle className="text-sm" />
                                  <span className="text-xs font-medium">Comments</span>
                                </div>
                                <div className="text-lg font-bold text-slate-800">
                                  {stat.comment_count.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3">
                              <h5 className="text-sm font-medium text-slate-700 mb-2">Reactions</h5>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="text-blue-500">👍</span>
                                  <span className="text-slate-600">Like: {stat.reaction_count.LIKE}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-red-500">❤️</span>
                                  <span className="text-slate-600">Love: {stat.reaction_count.LOVE}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">😮</span>
                                  <span className="text-slate-600">Wow: {stat.reaction_count.WOW}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">😂</span>
                                  <span className="text-slate-600">Haha: {stat.reaction_count.HAHA}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">😢</span>
                                  <span className="text-slate-600">Sad: {stat.reaction_count.SAD}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-red-500">😠</span>
                                  <span className="text-slate-600">Angry: {stat.reaction_count.ANGRY}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="pt-3 border-t border-slate-200">
                              <a
                                href={stat.platform_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                              >
                                View on Facebook →
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!loadingStats && socialStats.length === 0 && (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6">
                  <div className="text-center py-8">
                    <FiShare2 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No Social Media Statistics</h3>
                    <p className="text-slate-600">
                      Upload your video to YouTube or Facebook to see statistics here.
                    </p>
                  </div>
                </div>
              )}
              
            </div>

            {/* Action Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-5 sticky top-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">Actions</h3>
                <div className="space-y-3">
                  <Button 
                    onClick={handleDownload} 
                    disabled={downloadLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white shadow-sm border-0 text-sm"
                    icon={downloadLoading ? <FiRefreshCw className="animate-spin" /> : <FiDownload />}
                  >
                    {downloadLoading ? 'Downloading...' : 'Download Video'}
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
                          {/* <button
                            onClick={handleShareToInstagram}
                            className="w-full px-4 py-2.5 text-left hover:bg-pink-50 flex items-center gap-3 text-slate-700 hover:text-pink-600 text-sm transition-colors"
                          >
                            <FaInstagram className="text-pink-500" />
                            Instagram
                          </button> */}
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
