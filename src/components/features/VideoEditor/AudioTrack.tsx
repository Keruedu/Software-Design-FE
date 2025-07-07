import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaSave, FaUndo  } from 'react-icons/fa';
import { AudioTrackData } from '@/types/audio'

interface AudioTrackProps {
  track: AudioTrackData;
  videoDuration: number;
  onUpdateTrack: (id: string, updates: Partial<AudioTrackData>) => void;
  onSelectTrack: (id: string) => void;
}

const AudioTrack: React.FC<AudioTrackProps> = ({
  track,
  videoDuration,
  onUpdateTrack,
  onSelectTrack,
}) => {

  // Drag states
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingTrimStart, setIsDraggingTrimStart] = useState(false);
  const [isDraggingTrimEnd, setIsDraggingTrimEnd] = useState(false);
  const [isDraggingTrack, setIsDraggingTrack] = useState(false);
  
  // Drag data
  const [dragStartX, setDragStartX] = useState(0);
  const [initialStartTime, setInitialStartTime] = useState(0);
  
  // Preview states
  const [previewStartTime, setPreviewStartTime] = useState(track.startTime);
  const [previewTrimStart, setPreviewTrimStart] = useState(track.trimStart);
  const [previewTrimEnd, setPreviewTrimEnd] = useState(track.trimEnd);
  
  // Pending changes
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPreviewStartTime(track.startTime);
    setPreviewTrimStart(track.trimStart);
    setPreviewTrimEnd(track.trimEnd);
    setHasPendingChanges(false);
  }, [track.startTime, track.trimStart, track.trimEnd]);

  // Memoized calculations
  const { trackStartPosition, trackWidth, trimStartPercentage, trimEndPercentage, visibleWidth } = useMemo(() => {
    const actualStartTime = previewStartTime;
    const actualTrimStart = previewTrimStart;
    const actualTrimEnd = previewTrimEnd;
    
    return {
      trackStartPosition: videoDuration > 0 ? (actualStartTime / videoDuration) * 100 : 0,
      trackWidth: videoDuration > 0 ? (track.duration / videoDuration) * 100 : 0,
      trimStartPercentage: track.duration > 0 ? (actualTrimStart / track.duration) * 100 : 0,
      trimEndPercentage: track.duration > 0 ? (actualTrimEnd / track.duration) * 100 : 100,
      visibleWidth: track.duration > 0 ? ((actualTrimEnd - actualTrimStart) / track.duration) * 100 : 100
    };
  }, [
    track.duration, videoDuration, 
    previewStartTime, previewTrimStart, previewTrimEnd
  ]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      
      if (isDraggingTrimStart || isDraggingTrimEnd) {
        const rect = trackRef.current.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
        const timeInTrack = percentage * track.duration;
        
        if (isDraggingTrimStart) {
          const newTrimStart = Math.max(0, Math.min(timeInTrack, previewTrimEnd - 0.1));
          setPreviewTrimStart(newTrimStart);
          setHasPendingChanges(true);
        } else if (isDraggingTrimEnd) {
          const newTrimEnd = Math.min(track.duration, Math.max(timeInTrack, previewTrimStart + 0.1));
          setPreviewTrimEnd(newTrimEnd);
          setHasPendingChanges(true);
        }
      } else if (isDraggingTrack) {
        const deltaX = e.clientX - dragStartX;
        const timelineBounds = trackRef.current.parentElement?.getBoundingClientRect();
        
        if (timelineBounds) {
          const deltaTime = (deltaX / timelineBounds.width) * videoDuration;
          const newStartTime = Math.max(0, Math.min(
            videoDuration - track.duration,
            initialStartTime + deltaTime
          ));
          setPreviewStartTime(newStartTime);
          setHasPendingChanges(true);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingTrimStart(false);
      setIsDraggingTrimEnd(false);
      setIsDraggingTrack(false);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging, isDraggingTrimStart, isDraggingTrimEnd, isDraggingTrack,
    dragStartX, initialStartTime, videoDuration, track.duration,
    previewTrimStart, previewTrimEnd
  ]);

  const handleTrackMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const relativeX = e.clientX - rect.left;
    const handleWidth = 10;
    const isNearLeftEdge = relativeX < handleWidth;
    const isNearRightEdge = relativeX > rect.width - handleWidth;
    
    if (!isNearLeftEdge && !isNearRightEdge) {
      setIsDraggingTrack(true);
      setIsDragging(true);
      setDragStartX(e.clientX);
      setInitialStartTime(previewStartTime);
      onSelectTrack(track.id);
    }
  };

  const handleTrimStartMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTrimStart(true);
    setIsDragging(true);
  };

  const handleTrimEndMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTrimEnd(true);
    setIsDragging(true);
  };

  // Save changes to actual track data
  const handleSave = () => {
    const updates: Partial<AudioTrackData> = {};
    
    if (previewStartTime !== track.startTime) {
      updates.startTime = previewStartTime;
    }
    if (previewTrimStart !== track.trimStart) {
      updates.trimStart = previewTrimStart;
    }
    if (previewTrimEnd !== track.trimEnd) {
      updates.trimEnd = previewTrimEnd;
    }
    
    if (Object.keys(updates).length > 0) {
      onUpdateTrack(track.id, updates);
    }
    setHasPendingChanges(false);
  };

  // Reset to original values
  const handleReset = () => {
    setPreviewStartTime(track.startTime);
    setPreviewTrimStart(track.trimStart);
    setPreviewTrimEnd(track.trimEnd);
    setHasPendingChanges(false);
  };

  return (
    <div className="relative w-full h-full">
      <motion.div
        ref={trackRef}
        className={`absolute h-12 rounded-lg border-2 cursor-move shadow-lg ${
          hasPendingChanges 
            ? 'border-orange-500 bg-orange-100' 
            : 'border-blue-500 bg-blue-100'
        }`}
        style={{
          left: `${trackStartPosition}%`,
          width: `${trackWidth}%`,
          minWidth: '60px',
          transition: isDragging ? 'none' : 'all 0.2s ease'
        }}
        onMouseDown={handleTrackMouseDown}
        whileHover={!isDragging ? { scale: 1.02 } : {}}
        animate={!isDragging ? { 
          scale: 1,
          boxShadow: hasPendingChanges 
            ? '0 2px 4px rgba(251, 146, 60, 0.3)' 
            : '0 2px 4px rgba(0,0,0,0.1)'
        } : {
          scale: 1.05,
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
        }}
        transition={{ duration: 0.1 }}
      >
        {/* Trimmed area overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg pointer-events-none">
          <div 
            className="absolute top-0 bottom-0 bg-transparent"
            style={{
              left: `${trimStartPercentage}%`,
              width: `${visibleWidth}%`,
              transition: isDragging ? 'none' : 'all 0.1s ease'
            }}
          />
        </div>

        {/* Track Content */}
        <div className="flex items-center h-full px-2 text-xs relative z-10">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate text-gray-800">
              {track.name}
              {hasPendingChanges && <span className="text-orange-600 ml-1">*</span>}
            </div>
            <div className="text-gray-600">
              {Math.round(track.volume * 100)}%
            </div>
          </div>
        </div>

        {/* Trim Start Handle */}
        <motion.div
          className={`absolute top-0 bottom-0 w-2 cursor-ew-resize rounded-l z-20 ${
            hasPendingChanges ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          style={{ 
            left: `${trimStartPercentage}%`,
            transition: isDragging ? 'none' : 'all 0.1s ease'
          }}
          onMouseDown={handleTrimStartMouseDown}
          whileHover={{ scale: 1.1 }}
          animate={{ 
            scale: isDraggingTrimStart ? 1.2 : 1,
            backgroundColor: isDraggingTrimStart 
              ? (hasPendingChanges ? '#ea580c' : '#1e40af')
              : (hasPendingChanges ? '#ea580c' : '#2563eb')
          }}
        >
          <div className="absolute -top-6 left-0 text-xs text-gray-600 whitespace-nowrap">
            {Math.round(previewTrimStart * 10) / 10}s
          </div>
        </motion.div>
        
        {/* Trim End Handle */}
        <motion.div
          className={`absolute top-0 bottom-0 w-2 cursor-ew-resize rounded-r z-20 ${
            hasPendingChanges ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          style={{ 
            left: `${trimEndPercentage}%`, 
            marginLeft: '-8px',
            transition: isDragging ? 'none' : 'all 0.1s ease'
          }}
          onMouseDown={handleTrimEndMouseDown}
          whileHover={{ scale: 1.1 }}
          animate={{ 
            scale: isDraggingTrimEnd ? 1.2 : 1,
            backgroundColor: isDraggingTrimEnd 
              ? (hasPendingChanges ? '#ea580c' : '#1e40af')
              : (hasPendingChanges ? '#ea580c' : '#2563eb')
          }}
        >
          <div className="absolute -top-6 right-0 text-xs text-gray-600 whitespace-nowrap">
            {Math.round(previewTrimEnd * 10) / 10}s
          </div>
        </motion.div>

        {/* Waveform visualization */}
        <div 
          className="absolute inset-2 opacity-30"
          style={{
            left: `${trimStartPercentage}%`,
            width: `${visibleWidth}%`,
            transition: isDragging ? 'none' : 'all 0.1s ease'
          }}
        >
          <div className={`h-full rounded ${
            hasPendingChanges 
              ? 'bg-gradient-to-r from-orange-300 to-orange-500' 
              : 'bg-gradient-to-r from-green-300 to-green-500'
          }`} />
        </div>
      </motion.div>

      {/* Control buttons - positioned inside track container */}
      {hasPendingChanges && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 z-30">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className="p-1 rounded-full bg-gray-500 text-white hover:bg-gray-600 shadow-md"
            title="Reset changes"
          >
            <FaUndo className="w-2.5 h-2.5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            className="p-1 rounded-full bg-green-500 text-white hover:bg-green-600 shadow-md"
            title="Save changes"
          >
            <FaSave className="w-2.5 h-2.5" />
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default AudioTrack;