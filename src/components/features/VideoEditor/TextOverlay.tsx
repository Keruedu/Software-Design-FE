import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TextOverlayData } from '@/types/text';
import { useTextOverlayContext } from '@/context/TextOverlayContext';

interface TextOverlayProps {
  overlay: TextOverlayData;
  currentTime: number;
  videoWidth: number;
  videoHeight: number;
  isPreviewMode?: boolean;
  onDoubleClick?: (id: string) => void;
}

const TextOverlay: React.FC<TextOverlayProps> = ({
  overlay,
  currentTime,
  videoWidth,
  videoHeight,
  isPreviewMode = false,
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

  // Calculate position and size based on video dimensions
  const pixelPosition = {
    x: (overlay.position.x / 100) * videoWidth,
    y: (overlay.position.y / 100) * videoHeight,
  };

  const pixelSize = {
    width: overlay.size.width,
    height: overlay.size.height,
  };

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
    const elementCenterX = elementRect.left + elementRect.width / 2;
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
    
    // Calculate new position based on mouse position minus drag offset
    const newCenterX = e.clientX - dragStart.x;
    const newCenterY = e.clientY - dragStart.y;
    
    // Convert to top-left position
    const newX = newCenterX - pixelSize.width / 2 - containerRect.left;
    const newY = newCenterY - pixelSize.height / 2 - containerRect.top;

    // Apply constraints to keep text within container bounds
    const maxX = containerRect.width - pixelSize.width;
    const maxY = containerRect.height - pixelSize.height;
    
    const constrainedX = Math.max(0, Math.min(maxX, newX));
    const constrainedY = Math.max(0, Math.min(maxY, newY));

    // Convert to percentage
    const percentageX = (constrainedX / containerRect.width) * 100;
    const percentageY = (constrainedY / containerRect.height) * 100;

    moveTextOverlay(overlay.id, { x: percentageX, y: percentageY });
  }, [isDragging, isPreviewMode, overlay.isLocked, dragStart, pixelSize, moveTextOverlay, overlay.id]);

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

    resizeTextOverlay(overlay.id, { width: newWidth, height: newHeight });
  }, [isResizing, isPreviewMode, overlay.isLocked, resizeTextOverlay, overlay.id]);

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
        left: pixelPosition.x,
        top: pixelPosition.y,
        width: pixelSize.width,
        height: pixelSize.height,
        zIndex: overlay.zIndex + 1000,
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
            fontSize: overlay.style.fontSize,
            fontFamily: overlay.style.fontFamily,
            color: overlay.style.color,
            fontWeight: overlay.style.fontWeight,
            fontStyle: overlay.style.fontStyle,
            textAlign: overlay.style.textAlign,
            textDecoration: overlay.style.textDecoration,
            lineHeight: overlay.style.lineHeight,
            letterSpacing: overlay.style.letterSpacing,
            textShadow: overlay.shadow?.enabled
              ? `${overlay.shadow.offsetX}px ${overlay.shadow.offsetY}px ${overlay.shadow.blur}px ${overlay.shadow.color}`
              : 'none',
            WebkitTextStroke: overlay.outline?.enabled
              ? `${overlay.outline.width}px ${overlay.outline.color}`
              : 'none',
          }}
          autoFocus
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center break-words select-none ${
            !isPreviewMode ? 'cursor-default' : 'cursor-default'
          }`}
          style={{
            fontSize: overlay.style.fontSize,
            fontFamily: overlay.style.fontFamily,
            color: overlay.style.color,
            fontWeight: overlay.style.fontWeight,
            fontStyle: overlay.style.fontStyle,
            textAlign: overlay.style.textAlign,
            textDecoration: overlay.style.textDecoration,
            lineHeight: overlay.style.lineHeight,
            letterSpacing: overlay.style.letterSpacing,
            textShadow: overlay.shadow?.enabled
              ? `${overlay.shadow.offsetX}px ${overlay.shadow.offsetY}px ${overlay.shadow.blur}px ${overlay.shadow.color}`
              : 'none',
            WebkitTextStroke: overlay.outline?.enabled
              ? `${overlay.outline.width}px ${overlay.outline.color}`
              : 'none',
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
