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
  const { updateStickerPosition, state: { selectedStickerId } } = useStickerContext();
  const [isDragging, setIsDragging] = useState(false);
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
    : { width: 1280, height: 720 }; // Standard HD fallback

  // Use fallback values if videoSize is not set yet
  const fallbackVideoSize = videoWidth > 0 && videoHeight > 0 
    ? { width: videoWidth, height: videoHeight }
    : { width: 640, height: 360 }; // Fallback display size

  // Calculate scale factor based on video size - avoid division by zero
  const scaleX = fallbackOriginalSize.width > 0 ? fallbackVideoSize.width / fallbackOriginalSize.width : 1;
  const scaleY = fallbackOriginalSize.height > 0 ? fallbackVideoSize.height / fallbackOriginalSize.height : 1;

  // Apply scale to position and size
  const scaledPosition = {
    x: overlay.position.x * scaleX,
    y: overlay.position.y * scaleY,
  };

  const scaledSize = {
    width: overlay.size.width * scaleX,
    height: overlay.size.height * scaleY,
  };

  // Debug log - only for newly added stickers
  if (isNewlyAdded) {
    console.log('NEW STICKER DEBUG:', {
      stickerName: overlay.stickerName,
      originalPosition: overlay.position,
      scaledPosition,
      scaleX,
      scaleY,
      videoWidth,
      videoHeight,
      fallbackVideoSize,
      originalVideoSize,
      fallbackOriginalSize,
      isNewlyAdded
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

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || overlay.locked) return;

    const videoContainer = stickerRef.current?.parentElement;
    if (!videoContainer) return;

    const containerRect = videoContainer.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;

    // Use fallback values if originalVideoSize is not set yet
    const fallbackOriginalSize = originalVideoSize.width > 0 && originalVideoSize.height > 0 
      ? originalVideoSize 
      : { width: 1280, height: 720 };

    // Convert back to original scale
    const originalX = newX / scaleX;
    const originalY = newY / scaleY;

    // Đảm bảo sticker không bị kéo ra ngoài video bounds với margin an toàn
    const margin = 16; // Margin an toàn 16px từ edge
    const maxX = fallbackOriginalSize.width - overlay.size.width - margin;
    const maxY = fallbackOriginalSize.height - overlay.size.height - margin;

    const boundedX = Math.max(margin, Math.min(originalX, maxX));
    const boundedY = Math.max(margin, Math.min(originalY, maxY));

    updateStickerPosition(overlay.id, {
      x: boundedX,
      y: boundedY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, scaleX, scaleY, overlay.id, overlay.size, originalVideoSize]);

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
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      )}
    </motion.div>
  );
};

export default StickerOverlay;
