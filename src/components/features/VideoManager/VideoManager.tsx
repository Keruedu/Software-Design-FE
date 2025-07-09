import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { 
  FiPlay, 
  FiEdit2, 
  FiTrash2, 
  FiMoreVertical, 
  FiShare2, 
  FiDownload
} from 'react-icons/fi';
import { Video } from '../../../mockdata/videos';
import { Modal } from '../../common/Modal/Modal';
import { Button } from '../../common/Button/Button';
import { useVideoThumbnailSimple } from '../../../hooks/useVideoThumbnail';

interface VideoManagerProps {
  videos: Video[];
  onDelete?: (videoId: string) => void;
  isLoading?: boolean;
}

// Video Card Component with thumbnail hook
const VideoCard: React.FC<{ 
  video: Video; 
  onDelete?: (videoId: string) => void;
  onDropdownToggle: (id: string) => void;
  activeDropdown: string | null;
}> = ({ video, onDelete, onDropdownToggle, activeDropdown }) => {
  const { thumbnailUrl, isLoading: thumbnailLoading } = useVideoThumbnailSimple(
    video.videoUrl || video.url,
    video.thumbnailUrl
  );

  return (
    <div key={video.id} className="bg-white rounded-lg shadow overflow-hidden">
      <div 
        className="relative h-40 bg-gray-200 bg-cover bg-center cursor-pointer" 
        style={{ backgroundImage: `url(${thumbnailUrl})` }}
      >
        {thumbnailLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        <Link 
          href={`/dashboard/video/${video.id}`} 
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="bg-black bg-opacity-40 rounded-full p-3 hover:bg-opacity-60 transition">
            <FiPlay className="text-white h-6 w-6" />
          </div>
        </Link>
        {video.status === 'processing' && (
          <div className="absolute top-0 inset-x-0 bg-blue-500 text-white text-xs font-medium text-center p-1">
            Processing
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <Link 
            href={`/dashboard/video/${video.id}`}
            className="font-medium text-gray-900 hover:text-blue-600 truncate block"
          >
            {video.title}
          </Link>
          
          <div className="relative">
            <button 
              onClick={() => onDropdownToggle(video.id)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <FiMoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            
            {activeDropdown === video.id && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <Link 
                    href={`/dashboard/video/${video.id}`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiPlay className="mr-2 h-4 w-4" />
                    View
                  </Link>
                  <Link 
                    href={`/dashboard/video/${video.id}/edit`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiEdit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiShare2 className="mr-2 h-4 w-4" />
                    Share
                  </button>
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiDownload className="mr-2 h-4 w-4" />
                    Download
                  </button>
                  <button 
                    onClick={() => onDelete?.(video.id)}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <FiTrash2 className="mr-2 h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-1 truncate">{video.description}</p>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
          <span>{video.views} views</span>
        </div>
      </div>
    </div>
  );
};

const VideoManager: React.FC<VideoManagerProps> = ({ 
  videos, 
  onDelete,
  isLoading = false
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [downloadingVideo, setDownloadingVideo] = useState<string | null>(null);
  
  const handleDeleteClick = (video: Video) => {
    setSelectedVideo(video);
    setShowDeleteModal(true);
  };

  const sanitizeFileName = (filename: string): string => {
    return filename
      .replace(/[<>:"/\\|?*]/g, '') 
      .replace(/\s+/g, ' ') 
      .trim(); 
  };

  const handleDownload = async (video: Video) => {
    try {
      setDownloadingVideo(video.id);
      
      // Get video URL
      const videoUrl = video.videoUrl || video.url;
      if (!videoUrl) {
        toast.error('Video URL not available');
        return;
      }

      const fileName = `${sanitizeFileName(video.title)}.mp4`;

      if ('showSaveFilePicker' in window) {
        try {
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

          // Fetch video and write to selected location
          const response = await fetch(videoUrl);
          if (!response.ok) {
            throw new Error('Failed to fetch video');
          }

          const writable = await fileHandle.createWritable();
          await response.body?.pipeTo(writable);

          toast.success(`"${video.title}" download successfully`, {
            position: 'bottom-right',
            autoClose: 3000
          });
        } catch (filePickerError: any) {
          if (filePickerError.name !== 'AbortError') {
            console.warn('File picker failed, falling back to regular download:', filePickerError);
            await fallbackDownload(videoUrl, fileName, video.title);
          }
        }
      } else {
        await fallbackDownload(videoUrl, fileName, video.title);
      }
      
      setActiveDropdown(null);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download video. Please try again.', {
        position: 'bottom-right',
        autoClose: 3000
      });
    } finally {
      setDownloadingVideo(null);
    }
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
  
  const confirmDelete = async () => {
    if (selectedVideo && onDelete) {
      await onDelete(selectedVideo.id);
      setShowDeleteModal(false);
      setSelectedVideo(null);
    }
  };
  
  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeDropdown && !target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [activeDropdown]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
        <p className="text-gray-500 mb-6">You haven't created any videos yet.</p>
        <Link href="/create">
          <Button variant="primary">Create Your First Video</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="bg-white rounded-lg shadow relative">
            <div 
              className="relative h-40 bg-gray-200 bg-cover bg-center cursor-pointer rounded-t-lg overflow-hidden" 
              style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
            >
              <Link 
                href={`/dashboard/video/${video.id}`} 
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="bg-black bg-opacity-40 rounded-full p-3 hover:bg-opacity-60 transition">
                  <FiPlay className="text-white h-6 w-6" />
                </div>
              </Link>
              {video.status === 'processing' && (
                <div className="absolute top-0 inset-x-0 bg-blue-500 text-white text-xs font-medium text-center p-1">
                  Processing
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start">
                <Link 
                  href={`/dashboard/video/${video.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                >
                  {video.title}
                </Link>
                
                <div className="relative dropdown-container">
                  <button 
                    onClick={() => toggleDropdown(video.id)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <FiMoreVertical className="h-5 w-5 text-gray-500" />
                  </button>
                  
                  {activeDropdown === video.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200">
                      <Link 
                        href={`/dashboard/video/${video.id}`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <FiPlay className="mr-3 h-4 w-4" />
                        View Video
                      </Link>
                        <button
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDownload(video)}
                          disabled={downloadingVideo === video.id}
                        >
                          {downloadingVideo === video.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-3"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <FiDownload className="mr-3 h-4 w-4" />
                              Download
                            </>
                          )}
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            handleDeleteClick(video);
                            setActiveDropdown(null);
                          }}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                        >
                          <FiTrash2 className="mr-3 h-4 w-4" />
                          Delete
                        </button>
                      </div>
                  )}
                </div>
              </div>
              
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <p>
                  {new Date(video.createdAt).toLocaleDateString()}
                  &nbsp;&bull;&nbsp;
                  {video.duration} sec
                </p>
              </div>
                <div className="mt-3 flex flex-wrap gap-1">
                {video.tags && video.tags.length > 0 ? (
                  <>
                    {video.tags.slice(0, 2).map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {video.tags.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        +{video.tags.length - 2}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                    No tags
                  </span>
                )}
              </div>
            </div>
          </div>
          // <VideoCard
          //   key={video.id}
          //   video={video}
          //   onDelete={(videoId) => {
          //     handleDeleteClick(video);
          //     setActiveDropdown(null);
          //   }}
          //   onDropdownToggle={toggleDropdown}
          //   activeDropdown={activeDropdown}
          // />
        ))}
      </div>
      
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Video"
      >
        <div className="p-6">
          <p className="mb-4">
            Are you sure you want to delete &quot;{selectedVideo?.title}&quot;?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Video
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VideoManager;
