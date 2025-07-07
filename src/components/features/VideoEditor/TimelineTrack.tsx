import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Track, TimelineItem } from '@/types/timeline';
import { FaEye, FaEyeSlash, FaLock, FaUnlock, FaVolumeUp, FaVolumeMute, FaTrash, FaGripLines, FaVideo, FaMusic, FaImage, FaFont, FaSmile } from 'react-icons/fa';
import { audioManager } from '@/services/audioManager';
import { useTimelineContext } from '@/context/TimelineContext';
import TimelineItemComponent from './TimelineItem';

// Helper function to get track icon based on type
const getTrackIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <FaVideo className="w-3 h-3" />;
    case 'audio':
      return <FaMusic className="w-3 h-3" />;
    case 'image':
      return <FaImage className="w-3 h-3" />;
    case 'text':
      return <FaFont className="w-3 h-3" />;
    case 'sticker':
      return <FaSmile className="w-3 h-3" />;
    default:
      return <FaGripLines className="w-3 h-3" />;
  }
};

interface TimelineTrackProps {
  track: Track;
  duration: number;
  pixelsPerSecond: number;
  zoom: number;
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
  zoom,
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const resizeRef = useRef<HTMLDivElement>(null);
  const { timelineState } = useTimelineContext();

  const timelineWidth = duration * pixelsPerSecond * zoom;
  const playheadPosition = currentTime * pixelsPerSecond * zoom;

  // Check if this track has any audio items (audio or video with audio)
  const hasAudioItems = track.items.some(item => item.type === 'audio' || item.type === 'video');
  
  // Use track's own mute state instead of audio manager
  const isTrackMuted = track.isMuted || false;

  const handleAddItem = (type: TimelineItem['type']) => {
    const newItem: Omit<TimelineItem, 'id' | 'trackId'> = {
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} mới`,
      startTime: currentTime,
      duration: Math.min(5, duration - currentTime), 
    };

    if (type === 'audio') {
      newItem.volume = 1;
    }
    if (type === 'image' || type === 'text') {
      newItem.opacity = 1;
    }

    // Only add if there's time remaining
    if (newItem.duration > 0) {
      onAddItem(newItem);
    }
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

  // Wrapper functions for drag events with stable visual feedback
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only update state if it's actually changing to prevent flickering
    if (!isDragOver) {
      setIsDragOver(true);
    }
    
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're actually leaving the track area (not just moving between child elements)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Only set drag over to false if mouse is actually outside the track bounds
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
      if (onDragLeave) {
        onDragLeave();
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onDrop) {
      onDrop(e);
    }
  };

  const handleTrackMuteToggle = () => {
    const newMutedState = !isTrackMuted;
    console.log('Debug - Track mute toggle clicked for track:', track.id, 'hasAudioItems:', hasAudioItems, 'current muted:', isTrackMuted, 'new state:', newMutedState);
    
    // Always allow mute/unmute regardless of audio items (user might add audio items later)
    onUpdateTrack({ isMuted: newMutedState });
    console.log('Debug - Updated track mute state to:', newMutedState);
    
    // Show visual feedback immediately by forcing re-render
    setForceUpdate(prev => prev + 1);
  };



  return (
    <div 
      className={`flex border-b border-gray-200 transition-all duration-200 ${
        track.isVisible ? 'bg-white' : 'bg-gray-50'
      } ${isDragOver ? 'shadow-lg' : ''} ${
        isTrackMuted ? 'opacity-60' : ''
      }`}
      style={{ height: `${track.height}px` }}
    >
      {/* Track Header */}
      <div 
        className={`flex-shrink-0 bg-gray-100 border-r border-gray-300 px-2 py-1.5 flex items-center justify-between transition-all duration-200 ${
          isTrackMuted ? 'bg-red-50 border-red-200' : ''
        }`}
        style={{ width: '180px', minWidth: '180px' }}
      >
        <div className="flex items-center space-x-2 min-w-0">
          {/* Track icon */}
          <div className="flex-shrink-0 text-gray-600">
            {getTrackIcon(track.type)}
          </div>
          
          <div className="min-w-0 flex-1">
            {/* Track name if exists */}
            {track.name && (
              <div className="text-xs font-medium text-gray-700 truncate" style={{ fontSize: '11px' }}>
                {track.name}
              </div>
            )}
            
            {/* Chỉ hiển thị thông tin số lượng items */}
            <div className="text-xs text-gray-500" style={{ fontSize: '11px' }}>
              {track.items.length} item{track.items.length !== 1 ? 's' : ''}
              {isTrackMuted && (
                <span className="ml-1 text-red-500">• Muted</span>
              )}
            </div>
          </div>
        </div>

        {/* Track Controls */}
        <div className="flex items-center space-x-0.5">
          {/* Volume control - show for all tracks */}
          <button
            onClick={handleTrackMuteToggle}
            className={`p-0.5 rounded hover:bg-gray-200 transition-colors ${
              isTrackMuted ? 'text-red-500' : 'text-gray-600'
            }`}
            title={isTrackMuted ? 'Bật âm thanh track' : 'Tắt âm thanh track'}
          >
            {isTrackMuted ? 
              <FaVolumeMute className="w-2.5 h-2.5" /> : 
              <FaVolumeUp className="w-2.5 h-2.5" />
            }
          </button>

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

          {/* Delete Track */}
          {track.id !== 'track-1' && (
            <button
              onClick={onDeleteTrack}
              className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors ml-1"
              title="Xóa track"
            >
              <FaTrash className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Track Content Area */}
      <div 
        className={`flex-1 relative bg-gray-50 overflow-hidden transition-all duration-200 ${
          isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : 'border border-gray-200'
        } ${track.isLocked ? 'cursor-not-allowed' : 'cursor-default'}`}
        style={{
          backgroundColor: track.isVisible 
            ? (isDragOver ? 'rgb(239 246 255)' : 'rgb(249 250 251)') 
            : 'rgb(243 244 246)',
          opacity: track.isVisible ? (track.isLocked ? 0.7 : 1) : 0.5,
          pointerEvents: track.isLocked ? 'none' : 'auto',
          minWidth: `${timelineWidth}px`
        }}
        onDrop={track.isLocked ? undefined : handleDrop}
        onDragOver={track.isLocked ? undefined : handleDragOver}
        onDragLeave={track.isLocked ? undefined : handleDragLeave}
      >
        {/* Timeline Grid */}
        <div className="absolute inset-0">
          {/* Major grid lines (every 5 seconds) */}
          {Array.from({ length: Math.ceil(duration / 5) + 1 }, (_, i) => (
            <div
              key={`major-${i}`}
              className="absolute top-0 bottom-0 border-l border-gray-300 border-opacity-30"
              style={{ left: `${i * 5 * pixelsPerSecond * zoom}px` }}
            />
          ))}
          
          {/* Minor grid lines (every 1 second) when zoomed in */}
          {zoom >= 1 && Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => 
            i % 5 !== 0 ? (
              <div
                key={`minor-${i}`}
                className="absolute top-0 bottom-0 border-l border-gray-200 border-opacity-20"
                style={{ left: `${i * pixelsPerSecond * zoom}px` }}
              />
            ) : null
          )}
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
            zoom={zoom}
            trackHeight={track.height}
            videoDuration={duration} // Pass duration as videoDuration constraint
            onUpdateItem={(updates) => {
              onUpdateItem(item.id, updates)
            }
            }
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
              <div>Kéo bất kỳ media nào vào đây</div>
            </div>
          </div>
        )}

        {/* Drop Zone Overlay when dragging */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-80 border-2 border-dashed border-blue-400 rounded-lg transition-all duration-200">
            <div className="text-blue-600 text-sm font-medium bg-white px-3 py-1 rounded-lg shadow-sm">
              ✨ Thả vào đây
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
    </div>
  );
};

export default TimelineTrack;
