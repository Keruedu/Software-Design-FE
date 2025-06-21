export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  bold: boolean;
  italic: boolean;
  textAlign: 'left' | 'center' | 'right';
  opacity: number;
  rotation: number;
  startTime: number;
  endTime: number;
  visible: boolean;
  animation: 'none' | 'fadeIn' | 'slideIn' | 'bounce' | 'typewriter';
}

export interface GeneratedVideo {
  id: string;
  url: string;
  title: string;
  duration: number;
  createdAt: string;
  thumbnail?: string;
}