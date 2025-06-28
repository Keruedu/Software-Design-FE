import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TimelineItem } from '@/types/timeline';
import { FaImage, FaMusic, FaVideo, FaFont, FaMagic, FaVolumeUp, FaVolumeMute, FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';

interface TimelineItemComponentProps {
  item: TimelineItem;
  pixelsPerSecond: number;
  zoom: number;
  trackHeight: number;
  videoDuration: number; 
  onUpdateItem: (updates: Partial<TimelineItem>) => void;
  onDeleteItem: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

const TimelineItemComponent: React.FC<TimelineItemComponentProps> = ({
  item,
  pixelsPerSecond,
  zoom,
  trackHeight,
  videoDuration, 
  onUpdateItem,
  onDeleteItem,
  onSelect,
  isSelected
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'left' | 'right' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, startTime: 0, duration: 0 });
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Snap to grid helper function for better precision
  const snapToGrid = (time: number, zoom: number) => {
    if (zoom >= 2) {
      return Math.round(time * 10) / 10;
    } else if (zoom >= 1) {
      return Math.round(time * 2) / 2;
    } else {
      return Math.round(time);
    }
  };

  const width = item.duration * pixelsPerSecond * zoom;
  const left = item.startTime * pixelsPerSecond * zoom;

  // Handle mouse events for drag and resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !item.isLocked) {
        // Only allow dragging if the item is not locked (main video is locked)
        const deltaX = e.clientX - dragStart.x;
        const deltaTime = deltaX / (pixelsPerSecond * zoom);
        const rawNewStartTime = dragStart.startTime + deltaTime;
        let newStartTime = Math.max(0, snapToGrid(rawNewStartTime, zoom));
        
        // Ensure item doesn't extend beyond video duration
        const maxStartTime = Math.max(0, videoDuration - item.duration);
        newStartTime = Math.min(newStartTime, maxStartTime);
        
        onUpdateItem({ startTime: newStartTime });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaTime = deltaX / (pixelsPerSecond * zoom);
        
        if (resizeDirection === 'right') {
          // Resize from right - change duration
          const rawNewDuration = dragStart.duration + deltaTime;
          let newDuration = Math.max(0.1, snapToGrid(rawNewDuration, zoom));
          
          // For main video, enforce maximum duration constraint
          if (item.isMainVideoUnit && item.maxDuration) {
            newDuration = Math.min(newDuration, item.maxDuration);
          } else {
            // For all other items, ensure they don't extend beyond video duration
            const maxDuration = videoDuration - item.startTime;
            newDuration = Math.min(newDuration, maxDuration);
          }
          
          onUpdateItem({ duration: newDuration });
        } else if (resizeDirection === 'left' && !item.isLocked) {
          // Resize from left - only allowed for non-locked items
          // Main video (locked) cannot be resized from the left
          const rawNewStartTime = dragStart.startTime + deltaTime;
          let newStartTime = Math.max(0, snapToGrid(rawNewStartTime, zoom));
          let newDuration = Math.max(0.1, snapToGrid(dragStart.duration - deltaTime, zoom));
          
          // Ensure the item doesn't extend beyond video duration
          const maxEndTime = videoDuration;
          if (newStartTime + newDuration > maxEndTime) {
            newDuration = maxEndTime - newStartTime;
          }
          
          onUpdateItem({ 
            startTime: newStartTime,
            duration: newDuration 
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeDirection, dragStart, pixelsPerSecond, zoom, onUpdateItem]);

  const getItemIcon = () => {
    switch (item.type) {
      case 'video': return <FaVideo className="w-3 h-3" />;
      case 'audio': return <FaMusic className="w-3 h-3" />;
      case 'image': return <FaImage className="w-3 h-3" />;
      case 'text': return <FaFont className="w-3 h-3" />;
      case 'effect': return <FaMagic className="w-3 h-3" />;
      default: return <FaVideo className="w-3 h-3" />;
    }
  };

  const getItemColor = () => {
    if (item.isMainVideoUnit) {
      // Main video gets a special color to indicate it's locked
      return 'bg-indigo-600';
    }
    
    switch (item.type) {
      case 'video': return 'bg-blue-500';
      case 'audio': return 'bg-green-500';
      case 'image': return 'bg-purple-500';
      case 'text': return 'bg-red-500';
      case 'effect': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.button === 0) { 
      if (!item.isLocked) {
        setIsDragging(true);
        setDragStart({ x: e.clientX, startTime: item.startTime, duration: item.duration });
      }
      onSelect();
    }
  };

  const handleResizeStart = (e: React.MouseEvent, direction: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setDragStart({ x: e.clientX, startTime: item.startTime, duration: item.duration });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Don't allow deleting the main video
    if (!item.isMainVideoUnit) {
      onDeleteItem();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <motion.div
        ref={itemRef}
        className={`absolute top-1 bottom-1 rounded-md transition-all duration-200 ${getItemColor()} ${
          isSelected ? 'ring-2 ring-white ring-opacity-80 shadow-lg' : 'hover:shadow-md'
        } ${isDragging ? 'z-50' : 'z-10'} ${
          item.isLocked ? 'cursor-default' : 'cursor-pointer'
        } ${item.isMainVideoUnit ? 'border-2 border-yellow-400' : ''}`}
        style={{
          left: `${left}px`,
          width: `${Math.max(width, 30)}px`,
          height: `${trackHeight - 8}px`
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setShowDeleteButton(true)}
        onMouseLeave={() => setShowDeleteButton(false)}
        whileHover={{ scale: item.isLocked ? 1 : 1.02 }}
        animate={{ 
          scale: isSelected ? 1.05 : 1,
          opacity: isDragging ? 0.8 : 1
        }}
        drag={false} // Disable framer-motion drag to use custom drag
        title={item.isMainVideoUnit ? 
          `Video chính - Không thể di chuyển, chỉ có thể cắt ngắn (tối đa: ${item.maxDuration ? formatTime(item.maxDuration) : 'N/A'})` : 
          `${item.name} - Giới hạn trong thời lượng video chính (${formatTime(videoDuration)})`
        }
      >
        {/* Item Content */}
        <div className="item-content h-full flex items-center justify-between px-2 relative overflow-hidden pointer-events-none">
          {/* Left side - Icon and name */}
          <div className="flex items-center space-x-1 text-white text-xs font-medium min-w-0">
            {getItemIcon()}
            <span className="truncate">
              {item.isMainVideoUnit ? `🔒 ${item.name}` : item.name}
            </span>
          </div>

          {/* Right side - Duration and controls */}
          <div className="flex items-center space-x-1 text-white text-xs">
            <span>
              {formatTime(item.duration)}
              {item.isMainVideoUnit && item.maxDuration && (
                <span className="text-yellow-300"> / {formatTime(item.maxDuration)}</span>
              )}
            </span>
            {item.type === 'audio' && (
              <div className="flex items-center space-x-1">
                {item.volume && item.volume > 0 ? (
                  <FaVolumeUp className="w-2 h-2" />
                ) : (
                  <FaVolumeMute className="w-2 h-2" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delete Button */}
        {showDeleteButton && isSelected && !item.isMainVideoUnit && (
          <button
            onClick={handleDeleteClick}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-all duration-200 pointer-events-auto z-10"
            title="Xóa item"
          >
            <FaTrash className="w-2 h-2" />
          </button>
        )}

        {/* Left Resize Handle - Only show for non-locked items */}
        {!item.isLocked && (
          <div
            className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize transition-all pointer-events-auto ${
              isResizing && resizeDirection === 'left' ? 'bg-blue-500 w-3' : 'bg-white bg-opacity-20 hover:bg-opacity-40 hover:w-3'
            }`}
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          >
            {isResizing && resizeDirection === 'left' && (
              <div className="absolute -top-6 -left-8 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {formatTime(item.duration)}
              </div>
            )}
          </div>
        )}

        {/* Right Resize Handle */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize transition-all pointer-events-auto ${
            isResizing && resizeDirection === 'right' ? 'bg-blue-500 w-3' : 'bg-white bg-opacity-20 hover:bg-opacity-40 hover:w-3'
          }`}
          onMouseDown={(e) => handleResizeStart(e, 'right')}
        >
          {isResizing && resizeDirection === 'right' && (
            <div className="absolute -top-6 -right-8 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
              {formatTime(item.duration)}
              {item.isMainVideoUnit && item.maxDuration && (
                <span className="text-yellow-300"> / {formatTime(item.maxDuration)}</span>
              )}
            </div>
          )}
        </div>

        {/* Progress indicator for video/audio */}
        {(item.type === 'video' || item.type === 'audio') && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20 pointer-events-none">
            <div 
              className="h-full bg-white bg-opacity-60 transition-all duration-100"
              style={{ width: '0%' }} // This would be updated based on playback progress
            />
          </div>
        )}

        {/* Duration usage indicator for main video */}
        {item.isMainVideoUnit && item.maxDuration && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-600 bg-opacity-40 pointer-events-none">
            <div 
              className="h-full bg-yellow-400 transition-all duration-200"
              style={{ width: `${(item.duration / item.maxDuration) * 100}%` }}
            />
          </div>
        )}

        {/* Thumbnail for video/image */}
        {(item.type === 'video' || item.type === 'image') && item.thumbnail && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 rounded-md pointer-events-none"
            style={{ backgroundImage: `url(${item.thumbnail})` }}
          />
        )}

        {/* Main video indicator */}
        {item.isMainVideoUnit && (
          <>
            <div className="absolute top-0 left-0 bg-yellow-500 text-black text-xs px-1 rounded-br-md font-bold pointer-events-none">
              MAIN
            </div>
          </>
        )}

        {/* Warning when item approaches video duration limit */}
        {!item.isMainVideoUnit && (item.startTime + item.duration) > videoDuration * 0.95 && (
          <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-1 rounded-bl-md font-bold pointer-events-none">
            !
          </div>
        )}

        {/* Visual indicator showing video duration boundary */}
        {!item.isMainVideoUnit && (item.startTime + item.duration) >= videoDuration && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-bl-md font-bold pointer-events-none">
            ⚠
          </div>
        )}
      </motion.div>

      {/* Global Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-40 cursor-move pointer-events-none" />
      )}
    </>
  );
};

export default TimelineItemComponent;
