export interface SubtitleSegment {
  id: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export interface SubtitleStyle {
  name?: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  backgroundOpacity: number; // 0-1
  position: 'top' | 'middle' | 'bottom';
  outline: boolean;
  outlineColor: string;
}

export interface SubtitleOptions {
  enabled: boolean;
  language: string;
  style: SubtitleStyle;
  autoGenerate: boolean; // Generate from script vs from audio
  segments?: SubtitleSegment[];
}

export interface SubtitleGenerationResult {
  id: string;
  segments: SubtitleSegment[];
  language: string;
  totalDuration: number;
  srtUrl?: string;
  source: 'audio' | 'script';
}

// Predefined subtitle styles (matching backend)
export const SUBTITLE_STYLES: { [key: string]: SubtitleStyle } = {
  default: {
    name: 'default',
    fontFamily: 'Arial',
    fontSize: 16,
    fontColor: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.7,
    position: 'bottom',
    outline: true,
    outlineColor: '#000000'
  },
  modern: {
    name: 'modern',
    fontFamily: 'Helvetica',
    fontSize: 18,
    fontColor: '#FFFFFF',
    backgroundColor: '#1F2937',
    backgroundOpacity: 0.8,
    position: 'bottom',
    outline: true,
    outlineColor: '#374151'
  },
  minimal: {
    name: 'minimal',
    fontFamily: 'Arial',
    fontSize: 14,
    fontColor: '#FFFFFF',
    backgroundColor: 'transparent',
    backgroundOpacity: 0.0,
    position: 'bottom',
    outline: true,
    outlineColor: '#000000'
  },
  bold: {
    name: 'bold',
    fontFamily: 'Arial Black',
    fontSize: 20,
    fontColor: '#FFFF00',
    backgroundColor: '#000000',
    backgroundOpacity: 0.9,
    position: 'bottom',
    outline: true,
    outlineColor: '#FF0000'
  },
  elegant: {
    name: 'elegant',
    fontFamily: 'Times New Roman',
    fontSize: 16,
    fontColor: '#F8F9FA',
    backgroundColor: '#2C3E50',
    backgroundOpacity: 0.75,
    position: 'bottom',
    outline: false,
    outlineColor: '#000000'
  }
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' }
];
