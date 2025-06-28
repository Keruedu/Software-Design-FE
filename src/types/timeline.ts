export interface TimelineItem {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'effect';
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
  isMainVideoUnit?: boolean;
  isLocked?: boolean; 
  maxDuration?: number; 
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'overlay' | 'text' | 'effect' | 'mixed';
  height: number;
  isVisible: boolean;
  isLocked: boolean;
  isMuted?: boolean;
  volume?: number;
  items: TimelineItem[];
  color: string;
}

export interface TimelineState {
  tracks: Track[];
  duration: number;
  currentTime: number;
  zoom: number;
  pixelsPerSecond: number;
}
