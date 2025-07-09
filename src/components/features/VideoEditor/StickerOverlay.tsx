import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { StickerOverlay as StickerOverlayType } from '@/types/sticker';
import { useStickerContext } from '@/context/StickerContext';

interface StickerOverlayProps {
  overlay: StickerOverlayType;
  currentTime: number;
  videoWidth: number;
  videoHeight: number;
  originalVideoSize: { width: number; height: number };
  onClick?: (stickerId: string) => void;
}

const StickerOverlay: React.FC<StickerOverlayProps> = ({
  overlay,
  currentTime,
  videoWidth,
  videoHeight,
  originalVideoSize,
  onClick
}) => {
  const { updateStickerPosition, updateStickerSize, state: { selectedStickerId } } = useStickerContext();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isNewlyAdded, setIsNewlyAdded] = useState(true);
  const stickerRef = useRef<HTMLDivElement>(null);

  // Remove newly added indicator after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNewlyAdded(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Check if sticker should be visible at current time
  const isVisible = overlay.visible && 
    currentTime >= overlay.timing.startTime && 
    currentTime <= overlay.timing.endTime;

  if (!isVisible) return null;

  // Use fallback values if originalVideoSize is not set yet
  const fallbackOriginalSize = originalVideoSize.width > 0 && originalVideoSize.height > 0 
    ? originalVideoSize 
    : { width: 720, height: 1280 }; // Vertical video fallback

  // Use fallback values if videoSize is not set yet  
  const fallbackVideoSize = videoWidth > 0 && videoHeight > 0 
    ? { width: videoWidth, height: videoHeight }
    : { width: 360, height: 640 }; // Vertical fallback display size

  // Calculate scale factor based on video size - đảm bảo tỷ lệ chính xác
  const scaleX = fallbackOriginalSize.width > 0 ? fallbackVideoSize.width / fallbackOriginalSize.width : 1;
  const scaleY = fallbackOriginalSize.height > 0 ? fallbackVideoSize.height / fallbackOriginalSize.height : 1;

  // Ensure position is within bounds - sử dụng logic đơn giản và chính xác hơn
  const safePosition = React.useMemo(() => {
    const margin = 10; // Giảm margin để tăng độ chính xác
    const maxX = Math.max(0, fallbackOriginalSize.width - overlay.size.width - margin);
    const maxY = Math.max(0, fallbackOriginalSize.height - overlay.size.height - margin);
    
    const safeX = Math.max(margin, Math.min(overlay.position.x, maxX));
    const safeY = Math.max(margin, Math.min(overlay.position.y, maxY));

    if (Math.abs(safeX - overlay.position.x) > 1 || Math.abs(safeY - overlay.position.y) > 1) {
      console.log('Adjusting sticker position for safety:', {
        stickerId: overlay.id,
        original: overlay.position,
        adjusted: { x: safeX, y: safeY },
        reason: 'out of bounds',
        videoSize: fallbackOriginalSize
      });

      setTimeout(() => {
        updateStickerPosition(overlay.id, { x: safeX, y: safeY });
      }, 0);
    }
    
    return { x: safeX, y: safeY };
  }, [overlay.position.x, overlay.position.y, overlay.size.width, overlay.size.height, fallbackOriginalSize, overlay.id, updateStickerPosition]);

  const scaledPosition = {
    x: safePosition.x * scaleX,
    y: safePosition.y * scaleY,
  };

  const scaledSize = {
    width: overlay.size.width * scaleX,
    height: overlay.size.height * scaleY,
  };

  // Debug log
  useEffect(() => {
    if (isNewlyAdded) {
      console.log('StickerOverlay new sticker rendered:', {
        stickerName: overlay.stickerName,
        stickerId: overlay.id,
        isVisible,
        position: overlay.position,
        size: overlay.size,
        scaledPosition,
        scaledSize,
        scaleFactors: { scaleX, scaleY },
        videoSize: { width: videoWidth, height: videoHeight },
        originalVideoSize: fallbackOriginalSize
      });
    }
  }, [overlay.id, isNewlyAdded, scaledPosition.x, scaledPosition.y]);

  // Debug log
  if (isNewlyAdded) {
    console.log('NEW STICKER POSITIONING:', {
      stickerName: overlay.stickerName,
      webUI: {
        originalPosition: overlay.position,
        scaledPosition,
        scaleFactors: { scaleX, scaleY }
      },
      videoSizes: {
        display: { width: videoWidth, height: videoHeight },
        original: fallbackOriginalSize
      }
    });
  }

  const isSelected = selectedStickerId === overlay.id;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onClick) {
      onClick(overlay.id);
    }

    if (overlay.locked) return;

    setIsDragging(true);
    const rect = stickerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Resize handle
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    
    if (overlay.locked) return;

    setIsResizing(true);
    setResizeHandle(handle);
    
    const rect = stickerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.right,
        y: e.clientY - rect.bottom,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (overlay.locked) return;

    const videoContainer = stickerRef.current?.parentElement;
    if (!videoContainer) return;

    const containerRect = videoContainer.getBoundingClientRect();
    
    // Use fallback values if originalVideoSize is not set yet
    const fallbackOriginalSize = originalVideoSize.width > 0 && originalVideoSize.height > 0 
      ? originalVideoSize 
      : { width: 720, height: 1280 }; // Vertical video fallback

    if (isDragging && !isResizing) {
      // Handle dragging
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;

      // Convert back to original scale
      const originalX = newX / scaleX;
      const originalY = newY / scaleY;

      const margin = 10;
      const maxX = fallbackOriginalSize.width - overlay.size.width - margin;
      const maxY = fallbackOriginalSize.height - overlay.size.height - margin;

      const boundedX = Math.max(margin, Math.min(originalX, maxX));
      const boundedY = Math.max(margin, Math.min(originalY, maxY));

      updateStickerPosition(overlay.id, {
        x: boundedX,
        y: boundedY,
      });
    } else if (isResizing) {
      // Handle resizing
      const currentRect = stickerRef.current?.getBoundingClientRect();
      if (!currentRect) return;

      let newWidth = overlay.size.width;
      let newHeight = overlay.size.height;
      let newX = overlay.position.x;
      let newY = overlay.position.y;

      // Calculate deltas based on current mouse position
      const deltaX = (e.clientX - containerRect.left) / scaleX;
      const deltaY = (e.clientY - containerRect.top) / scaleY;

      switch (resizeHandle) {
        case 'bottom-right':
          newWidth = Math.max(10, deltaX - overlay.position.x);
          newHeight = Math.max(10, deltaY - overlay.position.y);
          break;
        
        case 'bottom-left':
          newWidth = Math.max(10, overlay.position.x + overlay.size.width - deltaX);
          newHeight = Math.max(10, deltaY - overlay.position.y);
          newX = Math.min(deltaX, overlay.position.x + overlay.size.width - 10);
          break;
          
        case 'top-right':
          newWidth = Math.max(10, deltaX - overlay.position.x);
          newHeight = Math.max(10, overlay.position.y + overlay.size.height - deltaY);
          newY = Math.min(deltaY, overlay.position.y + overlay.size.height - 10);
          break;
          
        case 'top-left':
          newWidth = Math.max(10, overlay.position.x + overlay.size.width - deltaX);
          newHeight = Math.max(10, overlay.position.y + overlay.size.height - deltaY);
          newX = Math.min(deltaX, overlay.position.x + overlay.size.width - 10);
          newY = Math.min(deltaY, overlay.position.y + overlay.size.height - 10);
          break;
      }

      // Giới hạn kích thước tối đa (same as in StickerPanel)
      newWidth = Math.min(180, newWidth);
      newHeight = Math.min(180, newHeight);

      // Ensure sticker doesn't go out of bounds
      const margin = 10;
      newX = Math.max(margin, Math.min(newX, fallbackOriginalSize.width - newWidth - margin));
      newY = Math.max(margin, Math.min(newY, fallbackOriginalSize.height - newHeight - margin));

      // Update both size and position if needed
      if (newX !== overlay.position.x || newY !== overlay.position.y) {
        updateStickerPosition(overlay.id, { x: newX, y: newY });
      }
      
      updateStickerSize(overlay.id, {
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, scaleX, scaleY, overlay.id, overlay.size, overlay.position, originalVideoSize, resizeHandle]);

  // Animation variants
  const animationVariants = {
    none: {},
    bounce: {
      y: [0, -10, 0],
      transition: {
        duration: overlay.animation?.duration || 1000,
        repeat: Infinity,
        delay: overlay.animation?.delay || 0,
      },
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: overlay.animation?.duration || 1000,
        repeat: Infinity,
        delay: overlay.animation?.delay || 0,
      },
    },
    fade: {
      opacity: [1, 0.5, 1],
      transition: {
        duration: overlay.animation?.duration || 1000,
        repeat: Infinity,
        delay: overlay.animation?.delay || 0,
      },
    },
    slide: {
      x: [0, 20, 0],
      transition: {
        duration: overlay.animation?.duration || 1000,
        repeat: Infinity,
        delay: overlay.animation?.delay || 0,
      },
    },
  };

  const currentAnimation = overlay.animation?.type || 'none';

  return (
    <motion.div
      ref={stickerRef}
      className={`absolute cursor-pointer select-none ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${overlay.locked ? 'cursor-not-allowed' : 'cursor-move'} ${
        isNewlyAdded ? 'ring-2 ring-green-400 ring-opacity-75' : ''
      }`}
      style={{
        left: scaledPosition.x,
        top: scaledPosition.y,
        width: scaledSize.width,
        height: scaledSize.height,
        zIndex: overlay.zIndex,
        opacity: overlay.opacity,
        transform: `rotate(${overlay.rotation}deg)`,
        pointerEvents: overlay.locked ? 'none' : 'auto',
      }}
      initial={isNewlyAdded ? { scale: 0.5, opacity: 0 } : false}
      animate={isNewlyAdded ? { 
        scale: 1, 
        opacity: overlay.opacity,
        transition: { 
          type: "spring", 
          stiffness: 200, 
          damping: 20 
        }
      } : animationVariants[currentAnimation]}
      onMouseDown={handleMouseDown}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <img
        src={overlay.stickerUrl}
        alt={overlay.stickerName}
        className="w-full h-full object-contain"
        draggable={false}
        onLoad={() => {
          console.log('Sticker image loaded:', overlay.stickerName);
          console.log('Final sticker position on screen:', { 
            left: scaledPosition.x, 
            top: scaledPosition.y,
            width: scaledSize.width,
            height: scaledSize.height
          });
        }}
        onError={(e) => console.error('Sticker image failed to load:', overlay.stickerName, e)}
      />
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none">
          {/* Resize handles */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full pointer-events-auto cursor-nw-resize"
               onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full pointer-events-auto cursor-ne-resize"
               onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')}></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full pointer-events-auto cursor-sw-resize"
               onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')}></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full pointer-events-auto cursor-se-resize"
               onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}></div>
               
          {/* Resize indicator text */}
          {/* <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
            {Math.round(overlay.size.width)} × {Math.round(overlay.size.height)}px
          </div> */}
        </div>
      )}
    </motion.div>
  );
};

export default StickerOverlay;
