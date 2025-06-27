import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TimelineItem } from '@/types/timeline';
import { FaImage, FaMusic, FaVideo, FaFont, FaMagic, FaVolumeUp, FaVolumeMute, FaEye, FaEyeSlash } from 'react-icons/fa';

interface TimelineItemComponentProps {
  item: TimelineItem;
  pixelsPerSecond: number;
  trackHeight: number;
  onUpdateItem: (updates: Partial<TimelineItem>) => void;
  onDeleteItem: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

const TimelineItemComponent: React.FC<TimelineItemComponentProps> = ({
  item,
  pixelsPerSecond,
  trackHeight,
  onUpdateItem,
  onDeleteItem,
  onSelect,
  isSelected
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, startTime: 0 });
  const itemRef = useRef<HTMLDivElement>(null);

  const width = item.duration * pixelsPerSecond;
  const left = item.startTime * pixelsPerSecond;

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
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.item-content')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, startTime: item.startTime });
      onSelect();
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({ x: e.clientX, startTime: item.startTime });
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
        className={`absolute top-1 bottom-1 rounded-md cursor-pointer transition-all duration-200 ${getItemColor()} ${
          isSelected ? 'ring-2 ring-white ring-opacity-80 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          left: `${left}px`,
          width: `${Math.max(width, 30)}px`,
          height: `${trackHeight - 8}px`
        }}
        onMouseDown={handleMouseDown}
        whileHover={{ scale: 1.02 }}
        animate={{ 
          scale: isSelected ? 1.05 : 1,
          opacity: isDragging ? 0.8 : 1
        }}
      >
        {/* Item Content */}
        <div className="item-content h-full flex items-center justify-between px-2 relative overflow-hidden">
          {/* Left side - Icon and name */}
          <div className="flex items-center space-x-1 text-white text-xs font-medium min-w-0">
            {getItemIcon()}
            <span className="truncate">{item.name}</span>
          </div>

          {/* Right side - Duration and controls */}
          <div className="flex items-center space-x-1 text-white text-xs">
            <span>{formatTime(item.duration)}</span>
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

        {/* Resize Handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white bg-opacity-20 hover:bg-opacity-40 transition-all"
          onMouseDown={handleResizeStart}
        />

        {/* Progress indicator for video/audio */}
        {(item.type === 'video' || item.type === 'audio') && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20">
            <div 
              className="h-full bg-white bg-opacity-60 transition-all duration-100"
              style={{ width: '0%' }} // This would be updated based on playback progress
            />
          </div>
        )}

        {/* Thumbnail for video/image */}
        {(item.type === 'video' || item.type === 'image') && item.thumbnail && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 rounded-md"
            style={{ backgroundImage: `url(${item.thumbnail})` }}
          />
        )}
      </motion.div>

      {/* Drag/Resize Overlay */}
      {(isDragging || isResizing) && (
        <div className="fixed inset-0 z-50 cursor-move" />
      )}
    </>
  );
};

export default TimelineItemComponent;
