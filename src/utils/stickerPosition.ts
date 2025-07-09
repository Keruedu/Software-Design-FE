/**
 * Utility functions for calculating sticker positions
 */

export interface VideoSize {
  width: number;
  height: number;
}

export interface StickerSize {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

/**
 * Calculate center position for a sticker within video bounds
 */
export function calculateCenterPosition(
  videoSize: VideoSize,
  stickerSize: StickerSize,
  randomOffset: { x: number; y: number } = { x: 0, y: 0 }
): Position {
  // Calculate center position - place sticker center at video center
  const centerX = (videoSize.width - stickerSize.width) / 2;
  const centerY = (videoSize.height - stickerSize.height) / 2;
  
  // Add random offset if provided
  const offsetX = centerX + randomOffset.x;
  const offsetY = centerY + randomOffset.y;
  
  // Ensure sticker stays within bounds
  const margin = 32;
  const finalX = Math.max(margin, Math.min(offsetX, videoSize.width - stickerSize.width - margin));
  const finalY = Math.max(margin, Math.min(offsetY, videoSize.height - stickerSize.height - margin));
  
  return { x: finalX, y: finalY };
}

/**
 * Generate random offset for sticker positioning
 */
export function generateRandomOffset(maxOffset: number = 50): { x: number; y: number } {
  return {
    x: (Math.random() - 0.5) * maxOffset * 2, // Random from -maxOffset to +maxOffset
    y: (Math.random() - 0.5) * maxOffset * 2
  };
}

/**
 * Validate if position is within video bounds
 */
export function isPositionWithinBounds(
  position: Position,
  stickerSize: StickerSize,
  videoSize: VideoSize,
  margin: number = 32
): boolean {
  return (
    position.x >= margin &&
    position.y >= margin &&
    position.x + stickerSize.width <= videoSize.width - margin &&
    position.y + stickerSize.height <= videoSize.height - margin
  );
}

/**
 * Clamp position to video bounds
 */
export function clampPositionToBounds(
  position: Position,
  stickerSize: StickerSize,
  videoSize: VideoSize,
  margin: number = 32
): Position {
  const clampedX = Math.max(margin, Math.min(position.x, videoSize.width - stickerSize.width - margin));
  const clampedY = Math.max(margin, Math.min(position.y, videoSize.height - stickerSize.height - margin));
  
  return { x: clampedX, y: clampedY };
}

/**
 * Get default video size (fallback) - Updated for vertical video (9:16)
 */
export function getDefaultVideoSize(): VideoSize {
  return { width: 720, height: 1280 };
}

/**
 * Get safe center position for any video size - ensures sticker is always visible
 * Điều chỉnh để đảm bảo vị trí chính xác
 */
export function getSafeCenterPosition(
  videoSize: VideoSize,
  stickerSize: StickerSize,
  margin: number = 30
): Position {
  const centerX = Math.max(margin, (videoSize.width - stickerSize.width) / 2);
  const centerY = Math.max(margin, (videoSize.height - stickerSize.height) / 2);
  
  const safeX = Math.min(centerX, videoSize.width - stickerSize.width - margin);
  const safeY = Math.min(centerY, videoSize.height - stickerSize.height - margin);
  
  return { x: safeX, y: safeY };
}

/**
 * Get default sticker size
 */
export function getDefaultStickerSize(): StickerSize {
  return { width: 64, height: 64 };
}

/**
 * Get optimal sticker size based on video orientation and size
 */
export function getOptimalStickerSize(videoSize: VideoSize, baseSize: number = 80): StickerSize {
  const maxWidth = Math.min(videoSize.width / 4, 320);
  const maxHeight = Math.min(videoSize.height / 4, 180);
  
  const scale = Math.min(videoSize.width / 720, videoSize.height / 1280);
  const scaledSize = Math.max(50, baseSize * scale);
  
  const finalWidth = Math.min(scaledSize, maxWidth);
  const finalHeight = Math.min(scaledSize, maxHeight);
  
  return { width: finalWidth, height: finalHeight };
}

/**
 * Get preset positions for vertical videos (9:16)
 */
export function getVerticalVideoPresetPositions(videoSize: VideoSize, stickerSize: StickerSize) {
  const margin = 40;
  const centerX = (videoSize.width - stickerSize.width) / 2;
  const centerY = (videoSize.height - stickerSize.height) / 2;
  
  return {
    topLeft: { x: margin, y: margin },
    topCenter: { x: centerX, y: margin },
    topRight: { x: videoSize.width - stickerSize.width - margin, y: margin },
    centerLeft: { x: margin, y: centerY },
    center: { x: centerX, y: centerY },
    centerRight: { x: videoSize.width - stickerSize.width - margin, y: centerY },
    bottomLeft: { x: margin, y: videoSize.height - stickerSize.height - margin },
    bottomCenter: { x: centerX, y: videoSize.height - stickerSize.height - margin },
    bottomRight: { x: videoSize.width - stickerSize.width - margin, y: videoSize.height - stickerSize.height - margin },
  };
}

/**
 * Get safe zones for vertical video sticker placement
 */
export function getVerticalVideoSafeZones(videoSize: VideoSize) {
  return {
    top: { y: 80, height: 200 }, 
    middle: { y: (videoSize.height - 300) / 2, height: 300 }, 
    bottom: { y: videoSize.height - 280, height: 200 }, 
    fullWidth: { x: 40, width: videoSize.width - 80 }, 
  };
}
