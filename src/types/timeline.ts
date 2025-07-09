export interface TimelineItem {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'effect' | 'sticker';
  name: string;
  startTime: number;
  duration: number;
  trackId: string;
  url?: string;
  thumbnail?: string;
  volume?: number;
  opacity?: number;
  position?: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  text?: string;
  style?: {
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: string;
  };
  // Sticker specific properties
  stickerId?: string;
  stickerUrl?: string;
  rotation?: number;
  animation?: {
    type: 'none' | 'bounce' | 'pulse' | 'fade' | 'slide';
    duration?: number;
    delay?: number;
    repeat?: boolean;
  };
  isMainVideoUnit?: boolean;
  isLocked?: boolean; 
  maxDuration?: number; 
}

export interface Track {
  id: string;
  name: string;
  type: 'mixed';
  height: number;
  isVisible: boolean;
  isLocked: boolean;
  isMuted?: boolean;
  volume?: number;
  items: TimelineItem[];
  color: string;
  isMainVideoTrack?: boolean; 
  isResizable?: boolean; 
}

export interface TimelineState {
  tracks: Track[];
  duration: number;
  currentTime: number;
  zoom: number;
  pixelsPerSecond: number;
}
