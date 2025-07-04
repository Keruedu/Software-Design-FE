import React, { useState } from 'react';
import Link from 'next/link';
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
  
  const handleDeleteClick = (video: Video) => {
    setSelectedVideo(video);
    setShowDeleteModal(true);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onDelete={(videoId) => {
              handleDeleteClick(video);
              setActiveDropdown(null);
            }}
            onDropdownToggle={toggleDropdown}
            activeDropdown={activeDropdown}
          />
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
