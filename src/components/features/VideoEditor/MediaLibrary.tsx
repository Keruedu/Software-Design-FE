import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaImage, FaMusic, FaVideo, FaUpload, FaFolder, FaTrash, FaTimes } from 'react-icons/fa';

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  uploadedAt: Date;
}

interface MediaLibraryProps {
  onAddMedia: (media: MediaItem) => void;
  onDeleteMedia?: (mediaId: string) => void;
  mediaItems?: MediaItem[];
  setMediaItems?: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  showHeader?: boolean;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ 
  onAddMedia, 
  onDeleteMedia,
  mediaItems: externalMediaItems, 
  setMediaItems: setExternalMediaItems,
  showHeader = true,
  showNotification
}) => {
  const [internalMediaItems, setInternalMediaItems] = useState<MediaItem[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use external media items if provided, otherwise use internal state
  const mediaItems = externalMediaItems || internalMediaItems;
  const setMediaItems = setExternalMediaItems || setInternalMediaItems;

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const mediaType = file.type.startsWith('image/') ? 'image' : 
                         file.type.startsWith('video/') ? 'video' : 'audio';
        
        const newMedia: MediaItem = {
          id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: mediaType,
          url,
          size: file.size,
          uploadedAt: new Date()
        };

        // Create thumbnail for images and videos
        if (mediaType === 'image') {
          newMedia.thumbnail = url;
        } else if (mediaType === 'video') {
          // Create video thumbnail
          const video = document.createElement('video');
          video.src = url;
          video.currentTime = 1; // Get frame at 1 second
          video.addEventListener('loadedmetadata', () => {
            newMedia.duration = video.duration;
          });
          video.addEventListener('seeked', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            newMedia.thumbnail = canvas.toDataURL();
            if (setExternalMediaItems) {
              setExternalMediaItems(prev => 
                prev.map(item => item.id === newMedia.id ? newMedia : item)
              );
            } else {
              setInternalMediaItems(prev => 
                prev.map(item => item.id === newMedia.id ? newMedia : item)
              );
            }
          });
        } else if (mediaType === 'audio') {
          // Get audio duration
          const audio = document.createElement('audio');
          audio.src = url;
          audio.addEventListener('loadedmetadata', () => {
            newMedia.duration = audio.duration;
            if (setExternalMediaItems) {
              setExternalMediaItems(prev => 
                prev.map(item => item.id === newMedia.id ? newMedia : item)
              );
            } else {
              setInternalMediaItems(prev => 
                prev.map(item => item.id === newMedia.id ? newMedia : item)
              );
            }
          });
        }

        if (setExternalMediaItems) {
          setExternalMediaItems(prev => [...prev, newMedia]);
        } else {
          setInternalMediaItems(prev => [...prev, newMedia]);
        }
        onAddMedia(newMedia);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const related = e.relatedTarget as HTMLElement;
    if (!related || !target.contains(related)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer?.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const filteredMedia = mediaItems.filter(item => 
    selectedType === 'all' || item.type === selectedType
  );

  const getMediaIcon = (type: MediaItem['type']) => {
    switch (type) {
      case 'image': return <FaImage className="w-4 h-4" />;
      case 'video': return <FaVideo className="w-4 h-4" />;
      case 'audio': return <FaMusic className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle delete media
  const handleDeleteMedia = (item: MediaItem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDeleteMedia = () => {
    if (itemToDelete) {
      // Remove from local state
      const updatedItems = mediaItems.filter(item => item.id !== itemToDelete.id);
      setMediaItems(updatedItems);
      
      // Call external delete callback if provided
      onDeleteMedia?.(itemToDelete.id);
      
      // Show success notification
      showNotification?.(`Đã xóa ${itemToDelete.name}`, 'success');
      
      // Close modal
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const cancelDeleteMedia = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      {showHeader && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Media Library</h3>
            <button
              onClick={handleUploadClick}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <FaUpload className="w-3 h-3" />
              <span>Upload</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'Tất cả', icon: <FaFolder className="w-3 h-3" /> },
              { key: 'image', label: 'Hình ảnh', icon: <FaImage className="w-3 h-3" /> },
              { key: 'video', label: 'Video', icon: <FaVideo className="w-3 h-3" /> },
              { key: 'audio', label: 'Audio', icon: <FaMusic className="w-3 h-3" /> }
            ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedType(tab.key as any)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                selectedType === tab.key 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
          </div>
        </div>
      )}

      {/* Compact header when showHeader is false */}
      {!showHeader && (
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleUploadClick}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <FaUpload className="w-3 h-3" />
              <span>Upload</span>
            </button>
            
            {/* Media count and clear all button */}
            {mediaItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {filteredMedia.length} / {mediaItems.length} media
                </span>
                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả media không?')) {
                      setMediaItems([]);
                      // Call delete for each item individually since onDeleteMedia expects single id
                      mediaItems.forEach(item => onDeleteMedia?.(item.id));
                      showNotification?.('Đã xóa tất cả media', 'success');
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  title="Xóa tất cả media"
                >
                  <FaTrash className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'Tất cả', icon: <FaFolder className="w-3 h-3" /> },
              { key: 'image', label: 'Hình ảnh', icon: <FaImage className="w-3 h-3" /> },
              { key: 'video', label: 'Video', icon: <FaVideo className="w-3 h-3" /> },
              { key: 'audio', label: 'Audio', icon: <FaMusic className="w-3 h-3" /> }
            ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedType(tab.key as any)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                selectedType === tab.key 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
          </div>
        </div>
      )}

      {/* Media Grid */}
      <div 
        className={`flex-1 p-4 overflow-y-auto ${
          isDragging ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {isDragging ? (
              <>
                <FaUpload className="w-12 h-12 mb-4 text-blue-500" />
                <p className="text-blue-600 font-medium">Thả file vào đây để upload</p>
              </>
            ) : (
              <>
                <FaFolder className="w-12 h-12 mb-4" />
                <p className="font-medium mb-2">Chưa có media nào</p>
                <p className="text-sm text-center">
                  Kéo thả file vào đây hoặc click nút Upload để thêm media
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredMedia.map(item => (
                <div
                  key={item.id}
                  className={`bg-gray-50 rounded-lg p-3 border-2 transition-all cursor-pointer transform hover:scale-105 relative group ${
                    hoveredItem === item.id ? 'border-blue-400 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  draggable
                  onDragStart={(e: React.DragEvent) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      type: 'media-item',
                      mediaItem: item
                    }));
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={`Kéo thả ${item.name} vào timeline`}
                >
                {/* Delete button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: hoveredItem === item.id ? 1 : 0, scale: hoveredItem === item.id ? 1 : 0.8 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMedia(item);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 z-10 shadow-lg"
                  title="Xóa media"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaTrash className="w-2.5 h-2.5" />
                </motion.button>

                {/* Thumbnail */}
                <div className="aspect-video bg-gray-200 rounded-md mb-2 flex items-center justify-center overflow-hidden relative">
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">
                      {getMediaIcon(item.type)}
                    </div>
                  )}
                  {/* Duration overlay for videos/audio */}
                  {item.duration && (
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                      {Math.round(item.duration)}s
                    </div>
                  )}
                  {/* Hover overlay */}
                  {hoveredItem === item.id && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <div className="text-blue-600 text-xs font-medium bg-white px-2 py-1 rounded shadow">
                        Drag to Timeline
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <div className="text-gray-600">
                      {getMediaIcon(item.type)}
                    </div>
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(item.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h4>
              <button onClick={cancelDeleteMedia} className="text-gray-500 hover:text-gray-700">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-700 text-sm">
                Bạn có chắc chắn muốn xóa media <strong>"{itemToDelete.name}"</strong>? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDeleteMedia}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteMedia}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
              <button
                onClick={cancelDeleteMedia}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Bạn có chắc chắn muốn xóa media này không?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-600">
                    {getMediaIcon(itemToDelete.type)}
                  </div>
                  <span className="font-medium text-gray-900">{itemToDelete.name}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatFileSize(itemToDelete.size)}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteMedia}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteMedia}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
