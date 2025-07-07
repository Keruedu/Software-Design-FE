import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TextOverlayData } from '@/types/text';
import { useTextOverlayContext } from '@/context/TextOverlayContext';

// Helper function to handle Google Fonts with fallback
const getFontFamilyWithFallback = (fontFamily: string) => {
  // Các Google Fonts phổ biến với fallback
  const fontFallbacks: { [key: string]: string } = {
    'Roboto': 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'Open Sans': 'Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'Montserrat': 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'Lato': 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'Poppins': 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'Nunito': 'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'Inter': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'Playfair Display': '"Playfair Display", Georgia, serif',
    'Source Sans Pro': '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'Oswald': 'Oswald, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'Raleway': 'Raleway, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'PT Sans': '"PT Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'Merriweather': 'Merriweather, Georgia, serif',
    'Ubuntu': 'Ubuntu, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    'Noto Sans': '"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  };
  if (fontFallbacks[fontFamily]) {
    return fontFallbacks[fontFamily];
  }
  // Nếu không có trong danh sách, thêm fallback mặc định
  if (fontFamily.includes('serif')) {
    return `${fontFamily}, Georgia, serif`;
  } else {
    return `${fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
  }
};

interface TextOverlayProps {
  overlay: TextOverlayData;
  currentTime: number;
  videoWidth: number;
  videoHeight: number;
  isPreviewMode?: boolean;
  originalVideoSize?: { width: number; height: number }; 
  onDoubleClick?: (id: string) => void;
}

const TextOverlay: React.FC<TextOverlayProps> = ({
  overlay,
  currentTime,
  videoWidth,
  videoHeight,
  isPreviewMode = false,
  originalVideoSize = { width: 0, height: 0 }, 
  onDoubleClick,
}) => {
  const { 
    selectTextOverlay, 
    moveTextOverlay, 
    resizeTextOverlay, 
    updateTextOverlay,
    state: { selectedTextId, editingTextId }
  } = useTextOverlayContext();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0 });
  const [editText, setEditText] = useState(overlay.text);
  const textRef = useRef<HTMLDivElement>(null);

  // Check if text should be visible at current time
  const isVisible = overlay.isVisible && 
    currentTime >= overlay.timing.startTime && 
    currentTime <= overlay.timing.endTime;

  const isSelected = selectedTextId === overlay.id;
  const isEditing = editingTextId === overlay.id;

  // Calculate responsive dimensions first
  console.log('videoWidth:', videoWidth, 'videoHeight:', videoHeight);
  // Use fallback dimensions if video dimensions are not available
  const actualVideoWidth = videoWidth || 640;
  const actualVideoHeight = videoHeight || 360;

  // Calculate responsive font size based on video dimensions
  // Use a base reference size and scale font size proportionally
  // This ensures text appears consistent across different video sizes
  const baseVideoWidth = originalVideoSize.width || 1920; // Use original video size or fallback
  const baseVideoHeight = originalVideoSize.height || 1080; // Use original video
  const scaleFactor = Math.min(actualVideoWidth / baseVideoWidth, actualVideoHeight / baseVideoHeight);
  
  // Ensure minimum scaling to keep text readable
  const minScaleFactor = 0.3; // Minimum 30% of original size
  const maxScaleFactor = 2.0; // Maximum 200% of original size
  const clampedScaleFactor = Math.max(minScaleFactor, Math.min(maxScaleFactor, scaleFactor));
  
  const responsiveFontSize = overlay.style.fontSize * clampedScaleFactor;

  // Calculate responsive size - scale size with same factor as font
  const responsiveSize = {
    width: overlay.size.width * clampedScaleFactor,
    height: overlay.size.height * clampedScaleFactor,
  };

  // Debug logs (can be removed in production)
  console.log('Scale calculations:', {
    originalVideoSize,
    actualVideoSize: { width: actualVideoWidth, height: actualVideoHeight },
    scaleFactor,
    clampedScaleFactor,
    responsiveSize
  });

  // Calculate position using direct method (most accurate for UI)
  const responsivePosition = {
    x: (overlay.position.x / 100) * actualVideoWidth - responsiveSize.width / 2,
    y: (overlay.position.y / 100) * actualVideoHeight - responsiveSize.height / 2,
  };

  console.log('Position Debug:', {
    overlayPosition: overlay.position,
    actualVideoSize: { width: actualVideoWidth, height: actualVideoHeight },
    responsivePosition,
    responsiveSize
  });

  // Calculate responsive shadow and outline based on scale factor
  const responsiveShadow = overlay.shadow?.enabled 
    ? `${overlay.shadow.offsetX * clampedScaleFactor}px ${overlay.shadow.offsetY * clampedScaleFactor}px ${overlay.shadow.blur * clampedScaleFactor}px ${overlay.shadow.color}`
    : 'none';
  
  const responsiveOutline = overlay.outline?.enabled
    ? `${overlay.outline.width * clampedScaleFactor}px ${overlay.outline.color}`
    : 'none';



  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isPreviewMode || overlay.isLocked) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    selectTextOverlay(overlay.id);
    setIsDragging(true);
    
    // Get the container bounds for proper constraint calculation
    const container = e.currentTarget.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const elementRect = e.currentTarget.getBoundingClientRect();
    
    // Calculate offset from mouse to element center for smoother dragging
    const elementCenterX = elementRect.left + elementRect.width / 2 ;
    const elementCenterY = elementRect.top + elementRect.height / 2;
    
    setDragStart({
      x: e.clientX - elementCenterX,
      y: e.clientY - elementCenterY,
    });
  }, [isPreviewMode, overlay.isLocked, overlay.id, selectTextOverlay]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || isPreviewMode || overlay.isLocked) return;

    const container = textRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    
    // Calculate new center position based on mouse position minus drag offset
    const newCenterX = e.clientX - dragStart.x;
    const newCenterY = e.clientY - dragStart.y;
    
    // Convert to relative position within container
    const relativeX = newCenterX - containerRect.left;
    const relativeY = newCenterY - containerRect.top;

    // Apply constraints to keep text center within container bounds
    const minX = responsiveSize.width / 2;
    const maxX = containerRect.width - responsiveSize.width / 2;
    const minY = responsiveSize.height / 2;
    const maxY = containerRect.height - responsiveSize.height / 2;
    
    const constrainedX = Math.max(minX, Math.min(maxX, relativeX));
    const constrainedY = Math.max(minY, Math.min(maxY, relativeY));

    // Convert to percentage based on center position
    const percentageX = (constrainedX  / containerRect.width) * 100;
    const percentageY = (constrainedY / containerRect.height) * 100;
    moveTextOverlay(overlay.id, { x: percentageX  + 12, y: percentageY - 12 });
  }, [isDragging, isPreviewMode, overlay.isLocked, dragStart, responsiveSize, moveTextOverlay, overlay.id]);

  // Handle mouse up for dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (isPreviewMode || overlay.isLocked) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    const elementRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!elementRect) return;
    
    setResizeStart({
      width: elementRect.width,
      height: elementRect.height,
    });
  }, [isPreviewMode, overlay.isLocked]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || isPreviewMode || overlay.isLocked) return;

    const container = textRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = textRef.current.getBoundingClientRect();
    
    // Calculate new size based on mouse position
    const newWidth = Math.max(50, Math.min(containerRect.width - (elementRect.left - containerRect.left), e.clientX - elementRect.left));
    const newHeight = Math.max(20, Math.min(containerRect.height - (elementRect.top - containerRect.top), e.clientY - elementRect.top));

    // Convert back to original size by dividing with scale factor
    const originalWidth = newWidth / clampedScaleFactor;
    const originalHeight = newHeight / clampedScaleFactor;

    resizeTextOverlay(overlay.id, { width: originalWidth, height: originalHeight });
  }, [isResizing, isPreviewMode, overlay.isLocked, clampedScaleFactor, resizeTextOverlay, overlay.id]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Handle double click for editing
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isPreviewMode || overlay.isLocked) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (onDoubleClick) {
      onDoubleClick(overlay.id);
    }
  }, [isPreviewMode, overlay.isLocked, onDoubleClick, overlay.id]);

  // Handle text editing
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
  }, []);

  const handleTextBlur = useCallback(() => {
    updateTextOverlay(overlay.id, { text: editText });
  }, [updateTextOverlay, overlay.id, editText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextBlur();
    }
  }, [handleTextBlur]);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div
      ref={textRef}
      className={`absolute select-none ${
        isSelected && !isPreviewMode && !isDragging ? 'outline-2 outline-blue-500 outline-dashed' : ''
      } ${isDragging ? 'z-50' : ''}`}
      style={{
        left: responsivePosition.x,
        top: responsivePosition.y,
        width: responsiveSize.width,
        height: responsiveSize.height,
        zIndex: overlay.zIndex + 2,
        transform: `rotate(${overlay.rotation}deg)`,
        opacity: overlay.opacity,
      }}
    >
      {/* Background */}
      {overlay.background?.enabled && (
        <div
          className="absolute inset-0 rounded"
          style={{
            backgroundColor: overlay.background.color,
            opacity: overlay.background.opacity,
            borderRadius: overlay.background.borderRadius,
            padding: overlay.background.padding,
          }}
        />
      )}

      {/* Text Content */}
      {isEditing ? (
        <textarea
          value={editText}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent border-none outline-none resize-none cursor-text"
          style={{
            fontSize: responsiveFontSize,
            fontFamily: getFontFamilyWithFallback(overlay.style.fontFamily),
            color: overlay.style.color,
            fontWeight: overlay.style.fontWeight,
            fontStyle: overlay.style.fontStyle,
            textAlign: overlay.style.textAlign,
            textDecoration: overlay.style.textDecoration,
            lineHeight: overlay.style.lineHeight,
            letterSpacing: overlay.style.letterSpacing,
            textShadow: responsiveShadow,
            WebkitTextStroke: responsiveOutline,
          }}
          autoFocus
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center break-words select-none ${
            !isPreviewMode ? 'cursor-default' : 'cursor-default'
          }`}
          style={{
            fontSize: responsiveFontSize,
            fontFamily: getFontFamilyWithFallback(overlay.style.fontFamily),
            color: overlay.style.color,
            fontWeight: overlay.style.fontWeight,
            fontStyle: overlay.style.fontStyle,
            textAlign: overlay.style.textAlign,
            textDecoration: overlay.style.textDecoration,
            lineHeight: overlay.style.lineHeight,
            letterSpacing: overlay.style.letterSpacing,
            textShadow: responsiveShadow,
            WebkitTextStroke: responsiveOutline,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
          }}
        >
          <span
            className={`${!isPreviewMode ? 'cursor-move' : 'cursor-default'}`}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            style={{
              display: 'inline-block',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
            }}
          >
            {overlay.text}
          </span>
        </div>
      )}

      {/* Selection Handles - chỉ hiển thị khi hover hoặc selected */}
      {isSelected && !isPreviewMode && !isEditing && !isDragging && (
        <>
          {/* Corner resize handle */}
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize shadow-sm hover:bg-blue-600 transition-colors opacity-80 hover:opacity-100"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          />
        </>
      )}
      
      {/* Drag preview */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-300 opacity-30 rounded pointer-events-none border-2 border-blue-500 border-dashed" />
      )}
      
      {/* Resize preview */}
      {isResizing && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-500 rounded pointer-events-none bg-blue-100 opacity-30" />
      )}
    </div>
  );
};

export default TextOverlay;
