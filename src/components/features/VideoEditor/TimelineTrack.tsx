import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Track, TimelineItem } from '@/types/timeline';
import { FaEye, FaEyeSlash, FaLock, FaUnlock, FaVolumeUp, FaVolumeMute, FaPlus, FaTrash, FaGripLines } from 'react-icons/fa';
import TimelineItemComponent from './TimelineItem';

interface TimelineTrackProps {
  track: Track;
  duration: number;
  pixelsPerSecond: number;
  currentTime: number;
  onUpdateTrack: (updates: Partial<Track>) => void;
  onDeleteTrack: () => void;
  onAddItem: (item: Omit<TimelineItem, 'id' | 'trackId'>) => void;
  onUpdateItem: (itemId: string, updates: Partial<TimelineItem>) => void;
  onDeleteItem: (itemId: string) => void;
  selectedItemId?: string;
  onSelectItem: (itemId: string) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
}

const TimelineTrack: React.FC<TimelineTrackProps> = ({
  track,
  duration,
  pixelsPerSecond,
  currentTime,
  onUpdateTrack,
  onDeleteTrack,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  selectedItemId,
  onSelectItem,
  onDrop,
  onDragOver,
  onDragLeave
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const timelineWidth = duration * pixelsPerSecond;
  const playheadPosition = currentTime * pixelsPerSecond;

  const handleAddItem = (type: TimelineItem['type']) => {
    const newItem: Omit<TimelineItem, 'id' | 'trackId'> = {
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} mới`,
      startTime: currentTime,
      duration: 5, // Default 5 seconds
    };

    if (type === 'audio') {
      newItem.volume = 1;
    }
    if (type === 'image' || type === 'text') {
      newItem.opacity = 1;
    }

    onAddItem(newItem);
    setShowAddMenu(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = track.height;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(40, Math.min(200, startHeight + deltaY)); // Min 40px, max 200px
      onUpdateTrack({ height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Wrapper functions for drag events with visual feedback
  const handleDragOver = (e: React.DragEvent) => {
    setIsDragOver(true);
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    if (onDragLeave) {
      onDragLeave();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    if (onDrop) {
      onDrop(e);
    }
  };

  const getTrackTypeIcon = () => {
    switch (track.type) {
      case 'video': return '🎬';
      case 'audio': return '🎵';
      case 'overlay': return '🖼️';
      case 'text': return '📝';
      case 'effect': return '✨';
      default: return '📁';
    }
  };

  return (
    <div 
      className="flex border-b border-gray-200"
      style={{ height: `${track.height + 8}px` }}
    >
      {/* Track Header */}
      <div 
        className="flex-shrink-0 bg-gray-100 border-r border-gray-300 px-2 py-1.5 flex items-center justify-between"
        style={{ width: '180px', minWidth: '180px' }}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-lg">{getTrackTypeIcon()}</span>
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={track.name}
              onChange={(e) => onUpdateTrack({ name: e.target.value })}
              className="text-xs font-medium bg-transparent border-none outline-none w-full truncate"
            />
            <div className="text-xs text-gray-500" style={{ fontSize: '10px' }}>
              {track.items.length} item{track.items.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Track Controls */}
        <div className="flex items-center space-x-0.5">
          {/* Volume for audio tracks */}
          {track.type === 'audio' && (
            <button
              onClick={() => onUpdateTrack({ isMuted: !track.isMuted })}
              className={`p-0.5 rounded hover:bg-gray-200 transition-colors ${
                track.isMuted ? 'text-red-500' : 'text-gray-600'
              }`}
            >
              {track.isMuted ? <FaVolumeMute className="w-2.5 h-2.5" /> : <FaVolumeUp className="w-2.5 h-2.5" />}
            </button>
          )}

          {/* Visibility Toggle */}
          <button
            onClick={() => onUpdateTrack({ isVisible: !track.isVisible })}
            className={`p-0.5 rounded hover:bg-gray-200 transition-colors ${
              track.isVisible ? 'text-gray-600' : 'text-gray-400'
            }`}
          >
            {track.isVisible ? <FaEye className="w-2.5 h-2.5" /> : <FaEyeSlash className="w-2.5 h-2.5" />}
          </button>

          {/* Lock Toggle */}
          <button
            onClick={() => onUpdateTrack({ isLocked: !track.isLocked })}
            className={`p-0.5 rounded hover:bg-gray-200 transition-colors ${
              track.isLocked ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            {track.isLocked ? <FaLock className="w-2.5 h-2.5" /> : <FaUnlock className="w-2.5 h-2.5" />}
          </button>

          {/* Add Item Menu */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="p-0.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <FaPlus className="w-2.5 h-2.5" />
            </button>

            {showAddMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                {track.type === 'video' && (
                  <button
                    onClick={() => handleAddItem('video')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <span>🎬</span>
                    <span>Video</span>
                  </button>
                )}
                {track.type === 'audio' && (
                  <button
                    onClick={() => handleAddItem('audio')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <span>🎵</span>
                    <span>Audio</span>
                  </button>
                )}
                {track.type === 'overlay' && (
                  <>
                    <button
                      onClick={() => handleAddItem('image')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <span>🖼️</span>
                      <span>Hình ảnh</span>
                    </button>
                    <button
                      onClick={() => handleAddItem('effect')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <span>✨</span>
                      <span>Hiệu ứng</span>
                    </button>
                  </>
                )}
                {track.type === 'text' && (
                  <button
                    onClick={() => handleAddItem('text')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <span>📝</span>
                    <span>Text</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Delete Track */}
          {track.id !== 'video-main' && track.id !== 'audio-main' && (
            <button
              onClick={onDeleteTrack}
              className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors ml-1"
            >
              <FaTrash className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Track Content Area */}
      <div 
        className={`flex-1 relative bg-gray-50 overflow-hidden transition-all duration-200 ${
          isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''
        }`}
        style={{
          backgroundColor: track.isVisible ? (isDragOver ? 'rgb(239 246 255)' : 'rgb(249 250 251)') : 'rgb(243 244 246)',
          opacity: track.isLocked ? 0.6 : 1
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Timeline Grid */}
        <div className="absolute inset-0">
          {Array.from({ length: Math.ceil(duration / 5) }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-gray-300 border-opacity-30"
              style={{ left: `${i * 5 * pixelsPerSecond}px` }}
            />
          ))}
        </div>

        {/* Track Color Strip */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 opacity-60"
          style={{ backgroundColor: track.color }}
        />

        {/* Timeline Items */}
        {track.items.map(item => (
          <TimelineItemComponent
            key={item.id}
            item={item}
            pixelsPerSecond={pixelsPerSecond}
            trackHeight={track.height}
            onUpdateItem={(updates) => onUpdateItem(item.id, updates)}
            onDeleteItem={() => onDeleteItem(item.id)}
            onSelect={() => onSelectItem(item.id)}
            isSelected={selectedItemId === item.id}
          />
        ))}

        {/* Empty state hint */}
        {track.items.length === 0 && !isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-400 text-xs text-center">
              <div className="mb-1">Trống</div>
              <div>Kéo media từ thư viện vào đây</div>
            </div>
          </div>
        )}

        {/* Drop Zone Overlay when dragging */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-80 border-2 border-dashed border-blue-400 rounded-lg transition-all duration-200">
            <div className="text-blue-600 text-sm font-medium bg-white px-3 py-1 rounded-lg shadow-sm">
              Thả media vào đây
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleResizeStart}
        className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize transition-all duration-200 group ${
          isResizing ? 'bg-blue-500 h-3' : 'hover:bg-gray-400 hover:h-3'
        }`}
        title="Kéo để điều chỉnh chiều cao track"
      >
        <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center">
          <FaGripLines className={`w-4 h-2 transition-all duration-200 ${
            isResizing ? 'text-white scale-110' : 'text-gray-400 opacity-0 group-hover:opacity-100'
          }`} />
        </div>
        {/* Visual feedback indicator */}
        {isResizing && (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {track.height}px
          </div>
        )}
      </div>

      {/* Close Add Menu when clicking outside */}
      {showAddMenu && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => setShowAddMenu(false)}
        />
      )}
    </div>
  );
};

export default TimelineTrack;
