export interface StickerItem {
  id: string;
  name: string;
  category: string;
  pack: string;
  url: string;
}

export interface StickerOverlay {
  id: string;
  stickerId: string;
  stickerUrl: string;
  stickerName: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  timing: {
    startTime: number;
    endTime: number;
  };
  animation?: {
    type: 'none' | 'bounce' | 'pulse' | 'fade' | 'slide';
    duration: number;
    delay: number;
  };
}

export interface StickerState {
  stickerOverlays: StickerOverlay[];
  selectedStickerId: string | null;
  clipboard: StickerOverlay | null;
  availableStickers: StickerItem[];
}

export const STICKER_CATEGORIES = {
  EMOJI: 'emoji',
  SHAPES: 'shapes',
  ARROWS: 'arrows',
  DECORATIVE: 'decorative',
  ANIMALS: 'animals',
  FOOD: 'food',
  OBJECTS: 'objects',
} as const;

export const DEFAULT_STICKER_SIZE = {
  width: 64,
  height: 64,
};

export const DEFAULT_STICKER_ANIMATION = {
  type: 'none' as const,
  duration: 1000,
  delay: 0,
};

export const STICKER_PACKS = {
  ANIMALS: 'Animals',
  CAT: 'Cat',
  DOWM: 'DoWM',
  FROG: 'Frog',
  MISC: 'Misc',
} as const;
