import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useTextOverlayContext } from '@/context/TextOverlayContext';
import { useTimelineContext } from '@/context/TimelineContext';
import { TextOverlayData } from '@/types/text';

interface TextTimelineTrackProps {
  currentTime: number;
  duration: number;
  pixelsPerSecond: number;
  zoom: number;
  onSeek: (time: number) => void;
}

const TextTimelineTrack: React.FC<TextTimelineTrackProps> = ({
  currentTime,
  duration,
  pixelsPerSecond,
  zoom,
  onSeek,
}) => {
  const {
    state: { textOverlays, selectedTextId },
    selectTextOverlay,
    updateTextTiming,
  } = useTextOverlayContext();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, time: 0 });
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
  const [resizeMode, setResizeMode] = useState<'start' | 'end' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const timelineWidth = duration * pixelsPerSecond;

  // Convert time to pixels
  const timeToPixels = useCallback((time: number) => {
    return time * pixelsPerSecond;
  }, [pixelsPerSecond]);

  // Convert pixels to time
  const pixelsToTime = useCallback((pixels: number) => {
    return pixels / pixelsPerSecond;
  }, [pixelsPerSecond]);

  // Handle text item mouse down
  const handleTextMouseDown = useCallback((e: React.MouseEvent, textId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const text = textOverlays.find(t => t.id === textId);
    if (!text) return;

    const textStartX = timeToPixels(text.timing.startTime);
    const textEndX = timeToPixels(text.timing.endTime);
    const textWidth = textEndX - textStartX;

    // Check if clicking on resize handles
    const handleSize = 8;
    const isClickingStartHandle = clickX >= textStartX - handleSize && clickX <= textStartX + handleSize;
    const isClickingEndHandle = clickX >= textEndX - handleSize && clickX <= textEndX + handleSize;

    if (isClickingStartHandle || isClickingEndHandle) {
      setIsResizing(true);
      setResizeMode(isClickingStartHandle ? 'start' : 'end');
    } else {
      setIsDragging(true);
    }

    setDraggedTextId(textId);
    setDragStart({ x: clickX, time: text.timing.startTime });
    selectTextOverlay(textId);
  }, [textOverlays, timeToPixels, selectTextOverlay]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedTextId || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const deltaX = currentX - dragStart.x;
    const deltaTime = pixelsToTime(deltaX);

    const text = textOverlays.find(t => t.id === draggedTextId);
    if (!text) return;

    if (isDragging) {
      // Move the entire text block
      const newStartTime = Math.max(0, Math.min(duration - text.timing.duration, dragStart.time + deltaTime));
      const newEndTime = newStartTime + text.timing.duration;

      updateTextTiming(draggedTextId, {
        startTime: newStartTime,
        endTime: newEndTime,
      });
    } else if (isResizing && resizeMode) {
      // Resize the text block
      if (resizeMode === 'start') {
        const newStartTime = Math.max(0, Math.min(text.timing.endTime - 0.1, text.timing.startTime + deltaTime));
        const newDuration = text.timing.endTime - newStartTime;
        
        updateTextTiming(draggedTextId, {
          startTime: newStartTime,
          duration: newDuration,
        });
      } else if (resizeMode === 'end') {
        const newEndTime = Math.max(text.timing.startTime + 0.1, Math.min(duration, text.timing.endTime + deltaTime));
        const newDuration = newEndTime - text.timing.startTime;
        
        updateTextTiming(draggedTextId, {
          endTime: newEndTime,
          duration: newDuration,
        });
      }
    }
  }, [
    draggedTextId,
    isDragging,
    isResizing,
    resizeMode,
    dragStart,
    pixelsToTime,
    textOverlays,
    updateTextTiming,
    duration,
  ]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDraggedTextId(null);
    setResizeMode(null);
  }, []);

  // Handle timeline click
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (isDragging || isResizing) return;

    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickTime = pixelsToTime(clickX);

    onSeek(Math.max(0, Math.min(duration, clickTime)));
  }, [isDragging, isResizing, pixelsToTime, duration, onSeek]);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Render time ruler
  const renderTimeRuler = () => {
    const markers = [];
    const interval = Math.max(1, Math.floor(10 / zoom));
    
    for (let i = 0; i <= duration; i += interval) {
      const x = timeToPixels(i);
      markers.push(
        <div
          key={i}
          className="absolute top-0 h-full border-l border-gray-300"
          style={{ left: x }}
        >
          <div className="absolute -top-5 left-1 text-xs text-gray-500">
            {i}s
          </div>
        </div>
      );
    }
    
    return markers;
  };

  // Render current time indicator
  const renderCurrentTimeIndicator = () => {
    const x = timeToPixels(currentTime);
    return (
      <div
        className="absolute top-0 h-full border-l-2 border-red-500 pointer-events-none z-10"
        style={{ left: x }}
      />
    );
  };

  // Render text items
  const renderTextItems = () => {
    return textOverlays.map((text) => {
      const startX = timeToPixels(text.timing.startTime);
      const width = timeToPixels(text.timing.duration);
      const isSelected = selectedTextId === text.id;

      return (
        <div
          key={text.id}
          className={`absolute top-6 h-8 rounded cursor-move select-none ${
            isSelected ? 'ring-2 ring-blue-500' : ''
          } ${text.isVisible ? 'opacity-100' : 'opacity-50'}`}
          style={{
            left: startX,
            width: Math.max(width, 20),
            backgroundColor: text.style.color,
            border: '1px solid rgba(0,0,0,0.2)',
          }}
          onMouseDown={(e) => handleTextMouseDown(e, text.id)}
        >
          {/* Text content */}
          <div className="px-2 py-1 text-xs text-white truncate bg-black bg-opacity-50">
            {text.text || 'Empty Text'}
          </div>

          {/* Resize handles */}
          {isSelected && (
            <>
              {/* Start resize handle */}
              <div
                className="absolute left-0 top-0 w-2 h-full bg-blue-500 cursor-ew-resize opacity-75"
                style={{ marginLeft: -4 }}
              />
              
              {/* End resize handle */}
              <div
                className="absolute right-0 top-0 w-2 h-full bg-blue-500 cursor-ew-resize opacity-75"
                style={{ marginRight: -4 }}
              />
            </>
          )}
        </div>
      );
    });
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Text Timeline</h3>
          <div className="text-xs text-gray-500">
            {textOverlays.length} text{textOverlays.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div 
          ref={trackRef}
          className="relative h-16 bg-gray-50 border border-gray-200 rounded cursor-crosshair overflow-hidden"
          style={{ width: Math.max(timelineWidth, 800) }}
          onClick={handleTimelineClick}
        >
          {/* Time ruler */}
          {renderTimeRuler()}
          
          {/* Current time indicator */}
          {renderCurrentTimeIndicator()}
          
          {/* Text items */}
          {renderTextItems()}
        </div>
      </div>
    </div>
  );
};

export default TextTimelineTrack;
