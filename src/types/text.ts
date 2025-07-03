export interface TextOverlayData {
  id: string;
  text: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: string;
    fontStyle: string;
    textAlign: 'left' | 'center' | 'right';
    textDecoration: string;
    lineHeight: number;
    letterSpacing: number;
  };
  timing: {
    startTime: number;
    duration: number;
    endTime: number;
  };
  animation?: {
    type: 'none' | 'fade-in' | 'fade-out' | 'slide-in' | 'slide-out';
    duration: number;
  };
  isVisible: boolean;
  isLocked: boolean;
  isSelected: boolean;
  zIndex: number;
  rotation: number;
  opacity: number;
  shadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  outline?: {
    enabled: boolean;
    color: string;
    width: number;
  };
  background?: {
    enabled: boolean;
    color: string;
    opacity: number;
    borderRadius: number;
    padding: number;
  };
}

export interface TextOverlayState {
  textOverlays: TextOverlayData[];
  selectedTextId: string | null;
  isEditMode: boolean;
  editingTextId: string | null;
  clipboard: TextOverlayData | null;
}

export interface TextOverlayActions {
  addTextOverlay: (text: string, position?: { x: number; y: number }) => string;
  updateTextOverlay: (id: string, updates: Partial<TextOverlayData>) => void;
  removeTextOverlay: (id: string) => void;
  selectTextOverlay: (id: string | null) => void;
  duplicateTextOverlay: (id: string) => string;
  moveTextOverlay: (id: string, position: { x: number; y: number }) => void;
  resizeTextOverlay: (id: string, size: { width: number; height: number }) => void;
  updateTextStyle: (id: string, style: Partial<TextOverlayData['style']>) => void;
  updateTextTiming: (id: string, timing: Partial<TextOverlayData['timing']>) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  copyTextOverlay: (id: string) => void;
  pasteTextOverlay: (position?: { x: number; y: number }) => string | null;
  setTextOverlayVisibility: (id: string, visible: boolean) => void;
  setTextOverlayLock: (id: string, locked: boolean) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  getTextOverlayAtTime: (time: number) => TextOverlayData[];
  getTextOverlayById: (id: string) => TextOverlayData | null;
}

export interface TextOverlayContextType extends TextOverlayActions {
  state: TextOverlayState;
}

export const DEFAULT_TEXT_STYLE: TextOverlayData['style'] = {
  fontSize: 32,
  fontFamily: 'Arial',
  color: '#ffffff',
  fontWeight: 'bold',
  fontStyle: 'normal',
  textAlign: 'center',
  textDecoration: 'none',
  lineHeight: 1.2,
  letterSpacing: 0,
};

export const DEFAULT_TEXT_POSITION = {
  x: 50, // percentage from left
  y: 50, // percentage from top
};

export const DEFAULT_TEXT_SIZE = {
  width: 200,
  height: 50,
};

export const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Arial Black',
  'Comic Sans MS',
  'Impact',
  'Lucida Console',
  'Trebuchet MS',
  'Tahoma',
  'Palatino',
  'Garamond',
  'Bookman',
  'Avant Garde',
];

export const FONT_SIZES = [
  8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 112, 128
];

export const TEXT_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
  '#ffc0cb', '#a52a2a', '#808080', '#c0c0c0', '#800000',
  '#008000', '#000080', '#808000', '#800080', '#008080'
];
