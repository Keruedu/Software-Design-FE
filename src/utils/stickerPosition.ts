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
 * Get default video size (fallback)
 */
export function getDefaultVideoSize(): VideoSize {
  return { width: 1280, height: 720 };
}

/**
 * Get default sticker size
 */
export function getDefaultStickerSize(): StickerSize {
  return { width: 64, height: 64 };
}
