import React, { createContext, useContext, useReducer, useCallback, useEffect, useState, useRef } from 'react';
import { StickerOverlay, StickerState, StickerItem, DEFAULT_STICKER_SIZE, DEFAULT_STICKER_ANIMATION } from '@/types/sticker';
import { clampPositionToBounds, getDefaultVideoSize, getDefaultStickerSize } from '@/utils/stickerPosition';
import { useTimelineContext } from '@/context/TimelineContext';

type StickerAction =
  | { type: 'ADD_STICKER'; payload: { id?: string; stickerId: string; stickerUrl: string; stickerName: string; position: { x: number; y: number }; timing?: { startTime: number; endTime: number } } }
  | { type: 'REMOVE_STICKER'; payload: string }
  | { type: 'SELECT_STICKER'; payload: string | null }
  | { type: 'UPDATE_STICKER'; payload: { id: string; updates: Partial<StickerOverlay> } }
  | { type: 'DUPLICATE_STICKER'; payload: string }
  | { type: 'UPDATE_STICKER_POSITION'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'UPDATE_STICKER_SIZE'; payload: { id: string; size: { width: number; height: number } } }
  | { type: 'UPDATE_STICKER_ROTATION'; payload: { id: string; rotation: number } }
  | { type: 'UPDATE_STICKER_OPACITY'; payload: { id: string; opacity: number } }
  | { type: 'UPDATE_STICKER_TIMING'; payload: { id: string; timing: { startTime: number; endTime: number } } }
  | { type: 'UPDATE_STICKER_TIMING_FROM_TIMELINE'; payload: { stickers: StickerOverlay[] } }
  | { type: 'SET_STICKER_VISIBILITY'; payload: { id: string; visible: boolean } }
  | { type: 'SET_STICKER_LOCK'; payload: { id: string; locked: boolean } }
  | { type: 'BRING_TO_FRONT'; payload: string }
  | { type: 'SEND_TO_BACK'; payload: string }
  | { type: 'COPY_STICKER'; payload: string }
  | { type: 'PASTE_STICKER'; payload: { x: number; y: number } }
  | { type: 'CLEAR_CLIPBOARD' }
  | { type: 'RESTORE_STICKERS'; payload: StickerOverlay[] }
  | { type: 'LOAD_AVAILABLE_STICKERS'; payload: StickerItem[] };

const initialState: StickerState = {
  stickerOverlays: [],
  selectedStickerId: null,
  clipboard: null,
  availableStickers: [],
};

function stickerReducer(state: StickerState, action: StickerAction): StickerState {
  switch (action.type) {
    case 'ADD_STICKER': {
      const id = action.payload.id || `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newSticker: StickerOverlay = {
        id,
        stickerId: action.payload.stickerId,
        stickerUrl: action.payload.stickerUrl,
        stickerName: action.payload.stickerName,
        position: action.payload.position,
        size: { ...DEFAULT_STICKER_SIZE },
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: Math.max(...state.stickerOverlays.map(s => s.zIndex), 0) + 1,
        timing: action.payload.timing || {
          startTime: 0,
          endTime: 5, // Default to 5 seconds to match StickerPanel
        },
        animation: { ...DEFAULT_STICKER_ANIMATION },
      };
      
      return {
        ...state,
        stickerOverlays: [...state.stickerOverlays, newSticker],
        selectedStickerId: newSticker.id,
      };
    }

    case 'REMOVE_STICKER':
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.filter(s => s.id !== action.payload),
        selectedStickerId: state.selectedStickerId === action.payload ? null : state.selectedStickerId,
      };

    case 'SELECT_STICKER':
      return {
        ...state,
        selectedStickerId: action.payload,
      };

    case 'UPDATE_STICKER':
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.map(sticker =>
          sticker.id === action.payload.id
            ? { ...sticker, ...action.payload.updates }
            : sticker
        ),
      };

    case 'DUPLICATE_STICKER': {
      const originalSticker = state.stickerOverlays.find(s => s.id === action.payload);
      if (!originalSticker) return state;

      const offsetX = 50;
      const offsetY = 50;
      
      const stickerWidth = originalSticker.size.width;
      const stickerHeight = originalSticker.size.height;
      const margin = 32;
      
      const newX = Math.max(margin, Math.min(originalSticker.position.x + offsetX, 1280 - stickerWidth - margin));
      const newY = Math.max(margin, Math.min(originalSticker.position.y + offsetY, 720 - stickerHeight - margin));

      const newSticker: StickerOverlay = {
        ...originalSticker,
        id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: newX,
          y: newY,
        },
        zIndex: Math.max(...state.stickerOverlays.map(s => s.zIndex), 0) + 1,
      };

      return {
        ...state,
        stickerOverlays: [...state.stickerOverlays, newSticker],
        selectedStickerId: newSticker.id,
      };
    }

    case 'UPDATE_STICKER_POSITION':
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.map(sticker =>
          sticker.id === action.payload.id
            ? { ...sticker, position: action.payload.position }
            : sticker
        ),
      };

    case 'UPDATE_STICKER_SIZE':
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.map(sticker =>
          sticker.id === action.payload.id
            ? { ...sticker, size: action.payload.size }
            : sticker
        ),
      };

    case 'UPDATE_STICKER_ROTATION':
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.map(sticker =>
          sticker.id === action.payload.id
            ? { ...sticker, rotation: action.payload.rotation }
            : sticker
        ),
      };

    case 'UPDATE_STICKER_OPACITY':
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.map(sticker =>
          sticker.id === action.payload.id
            ? { ...sticker, opacity: action.payload.opacity }
            : sticker
        ),
      };

    case 'UPDATE_STICKER_TIMING':
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.map(sticker =>
          sticker.id === action.payload.id
            ? { ...sticker, timing: action.payload.timing }
            : sticker
        ),
      };

    case 'UPDATE_STICKER_TIMING_FROM_TIMELINE':
      return {
        ...state,
        stickerOverlays: action.payload.stickers,
      };

    case 'SET_STICKER_VISIBILITY':
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.map(sticker =>
          sticker.id === action.payload.id
            ? { ...sticker, visible: action.payload.visible }
            : sticker
        ),
      };

    case 'SET_STICKER_LOCK':
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.map(sticker =>
          sticker.id === action.payload.id
            ? { ...sticker, locked: action.payload.locked }
            : sticker
        ),
      };

    case 'BRING_TO_FRONT': {
      const maxZ = Math.max(...state.stickerOverlays.map(s => s.zIndex), 0);
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.map(sticker =>
          sticker.id === action.payload
            ? { ...sticker, zIndex: maxZ + 1 }
            : sticker
        ),
      };
    }

    case 'SEND_TO_BACK': {
      const minZ = Math.min(...state.stickerOverlays.map(s => s.zIndex), 0);
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.map(sticker =>
          sticker.id === action.payload
            ? { ...sticker, zIndex: minZ - 1 }
            : sticker
        ),
      };
    }

    case 'COPY_STICKER': {
      const stickerToCopy = state.stickerOverlays.find(s => s.id === action.payload);
      return {
        ...state,
        clipboard: stickerToCopy || null,
      };
    }

    case 'PASTE_STICKER': {
      if (!state.clipboard) return state;

      const stickerWidth = state.clipboard.size.width;
      const stickerHeight = state.clipboard.size.height;
      const margin = 32;
      
      const safeX = Math.max(margin, Math.min(action.payload.x, 1280 - stickerWidth - margin));
      const safeY = Math.max(margin, Math.min(action.payload.y, 720 - stickerHeight - margin));

      const newSticker: StickerOverlay = {
        ...state.clipboard,
        id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: { x: safeX, y: safeY },
        zIndex: Math.max(...state.stickerOverlays.map(s => s.zIndex), 0) + 1,
      };

      return {
        ...state,
        stickerOverlays: [...state.stickerOverlays, newSticker],
        selectedStickerId: newSticker.id,
      };
    }

    case 'CLEAR_CLIPBOARD':
      return {
        ...state,
        clipboard: null,
      };

    case 'RESTORE_STICKERS':
      return {
        ...state,
        stickerOverlays: action.payload,
      };

    case 'LOAD_AVAILABLE_STICKERS':
      return {
        ...state,
        availableStickers: action.payload,
      };

    default:
      return state;
  }
}

interface StickerContextValue {
  state: StickerState;
  addStickerOverlay: (stickerId: string, stickerUrl: string, stickerName: string, position: { x: number; y: number }) => string;
  addStickerToTimeline: (stickerId: string, stickerUrl: string, stickerName: string, position: { x: number; y: number }, currentTime: number, duration?: number) => string;
  removeStickerOverlay: (id: string) => void;
  selectStickerOverlay: (id: string | null) => void;
  updateStickerOverlay: (id: string, updates: Partial<StickerOverlay>) => void;
  duplicateStickerOverlay: (id: string) => void;
  updateStickerPosition: (id: string, position: { x: number; y: number }) => void;
  updateStickerSize: (id: string, size: { width: number; height: number }) => void;
  updateStickerRotation: (id: string, rotation: number) => void;
  updateStickerOpacity: (id: string, opacity: number) => void;
  updateStickerTiming: (id: string, timing: { startTime: number; endTime: number }) => void;
  setStickerVisibility: (id: string, visible: boolean) => void;
  setStickerLock: (id: string, locked: boolean) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  copyStickerOverlay: (id: string) => void;
  pasteStickerOverlay: (position: { x: number; y: number }) => void;
  clearClipboard: () => void;
  restoreStickerOverlays: (stickers: StickerOverlay[]) => void;
  getStickerOverlayById: (id: string) => StickerOverlay | undefined;
  getStickerOverlayAtTime: (time: number) => StickerOverlay[];
  loadAvailableStickers: (stickers: StickerItem[]) => void;
  setTimelineOperations: (operations: any) => void;
}

const StickerContext = createContext<StickerContextValue | undefined>(undefined);

export const StickerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(stickerReducer, initialState);
  const [timelineOperations, setTimelineOperations] = useState<any>(null);
  const timelineContext = useTimelineContext();
  
  // Refs to prevent infinite loops during synchronization
  const isUpdatingFromTimeline = useRef(false);
  const isUpdatingFromSticker = useRef(false);

  // Load available stickers on mount
  useEffect(() => {
    const loadStickers = async () => {
      try {
        const response = await fetch('/stickers/stickers.json');
        const stickers: StickerItem[] = await response.json();
        dispatch({ type: 'LOAD_AVAILABLE_STICKERS', payload: stickers });
      } catch (error) {
        console.error('Error loading stickers:', error);
      }
    };

    loadStickers();
  }, []);

  // Sync timeline changes back to sticker overlays (Timeline -> Sticker)
  // Handle both timing changes and item deletion
  useEffect(() => {
    if (!timelineContext || isUpdatingFromSticker.current) return;

    // Tìm tất cả sticker items trong tất cả tracks (không phân biệt track type)
    const allStickerItems = timelineContext.timelineState.tracks.flatMap(track => 
      track.items.filter(item => item.type === 'sticker')
    );
    
    // Check for deleted items - stickers that exist in overlay but not in timeline
    const deletedStickers = state.stickerOverlays.filter(sticker => 
      !allStickerItems.some(item => item.stickerId === sticker.id)
    );

    // Remove deleted stickers from overlay
    if (deletedStickers.length > 0) {
      console.log('Removing deleted stickers from timeline:', deletedStickers.map(s => s.id));
      deletedStickers.forEach(sticker => {
        dispatch({ type: 'REMOVE_STICKER', payload: sticker.id });
      });
      return; // Exit early to avoid timing update conflicts
    }

    // Only check for timing changes in existing items
    let hasTimingChanges = false;
    const updatedStickers = state.stickerOverlays.map(sticker => {
      const timelineItem = allStickerItems.find((item: any) => item.stickerId === sticker.id);
      if (!timelineItem) return sticker;

      // Only check for timing changes
      const timingChanged = 
        sticker.timing.startTime !== timelineItem.startTime ||
        sticker.timing.endTime !== (timelineItem.startTime + timelineItem.duration);

      if (timingChanged) {
        hasTimingChanges = true;
        return {
          ...sticker,
          timing: {
            startTime: timelineItem.startTime,
            endTime: timelineItem.startTime + timelineItem.duration,
          },
        };
      }
      return sticker;
    });

    if (hasTimingChanges) {
      console.log('Updating sticker overlays with timeline timing changes');
      isUpdatingFromTimeline.current = true;
      dispatch({ type: 'UPDATE_STICKER_TIMING_FROM_TIMELINE', payload: { stickers: updatedStickers } });
      // Reset flag after a short delay
      setTimeout(() => {
        isUpdatingFromTimeline.current = false;
      }, 50);
    }
  }, [
    // Theo dõi tất cả sticker items trong mọi track
    timelineContext?.timelineState.tracks.flatMap(track => track.items.filter(item => item.type === 'sticker')).map(item => `${item.id}-${item.startTime}-${item.duration}`).join(','),
    state.stickerOverlays.map(sticker => `${sticker.id}-${sticker.timing.startTime}-${sticker.timing.endTime}`).join(',')
  ]);

  const addStickerOverlay = useCallback((stickerId: string, stickerUrl: string, stickerName: string, position: { x: number; y: number }) => {
    const id = `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Ensure position is within bounds using utility function
    const videoSize = getDefaultVideoSize();
    const stickerSize = getDefaultStickerSize();
    const clampedPosition = clampPositionToBounds(position, stickerSize, videoSize);
    
    console.log('Adding sticker overlay:', {
      originalPosition: position,
      clampedPosition,
      videoSize,
      stickerSize
    });
    
    dispatch({ 
      type: 'ADD_STICKER', 
      payload: { 
        stickerId, 
        stickerUrl, 
        stickerName, 
        position: clampedPosition
      } 
    });
    return id;
  }, []);

  const removeStickerOverlay = useCallback((id: string) => {
    // Remove sticker overlay
    dispatch({ type: 'REMOVE_STICKER', payload: id });
    
    // Also remove from timeline if operations are available
    if (timelineOperations && timelineContext) {
      for (const track of timelineContext.timelineState.tracks) {
        const timelineItem = track.items.find((item: any) => item.type === 'sticker' && item.stickerId === id);
        if (timelineItem) {
          // Set flag to prevent sync loop
          isUpdatingFromSticker.current = true;
          timelineOperations.removeItemFromTrack(track.id, timelineItem.id);
          // Reset flag after a short delay
          setTimeout(() => {
            isUpdatingFromSticker.current = false;
          }, 50);
          break;
        }
      }
    }
  }, [timelineOperations, timelineContext]);

  const selectStickerOverlay = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_STICKER', payload: id });
  }, []);

  const updateStickerOverlay = useCallback((id: string, updates: Partial<StickerOverlay>) => {
    dispatch({ type: 'UPDATE_STICKER', payload: { id, updates } });
  }, []);

  const duplicateStickerOverlay = useCallback((id: string) => {
    dispatch({ type: 'DUPLICATE_STICKER', payload: id });
  }, []);

  const updateStickerPosition = useCallback((id: string, position: { x: number; y: number }) => {
    dispatch({ type: 'UPDATE_STICKER_POSITION', payload: { id, position } });
  }, []);

  const updateStickerSize = useCallback((id: string, size: { width: number; height: number }) => {
    dispatch({ type: 'UPDATE_STICKER_SIZE', payload: { id, size } });
  }, []);

  const updateStickerRotation = useCallback((id: string, rotation: number) => {
    dispatch({ type: 'UPDATE_STICKER_ROTATION', payload: { id, rotation } });
  }, []);

  const updateStickerOpacity = useCallback((id: string, opacity: number) => {
    dispatch({ type: 'UPDATE_STICKER_OPACITY', payload: { id, opacity } });
  }, []);

  const updateStickerTiming = useCallback((id: string, timing: { startTime: number; endTime: number }) => {
    // Update sticker timing
    dispatch({ type: 'UPDATE_STICKER_TIMING', payload: { id, timing } });
    
    // Also update on timeline if operations are available
    if (timelineOperations && timelineContext) {
      for (const track of timelineContext.timelineState.tracks) {
        const timelineItem = track.items.find((item: any) => item.type === 'sticker' && item.stickerId === id);
        if (timelineItem) {
          // Set flag to prevent sync loop
          isUpdatingFromSticker.current = true;
          timelineOperations.updateItem(track.id, timelineItem.id, {
            startTime: timing.startTime,
            duration: timing.endTime - timing.startTime
          });
          // Reset flag after a short delay
          setTimeout(() => {
            isUpdatingFromSticker.current = false;
          }, 50);
          break;
        }
      }
    }
  }, [timelineOperations, timelineContext]);

  const setStickerVisibility = useCallback((id: string, visible: boolean) => {
    dispatch({ type: 'SET_STICKER_VISIBILITY', payload: { id, visible } });
  }, []);

  const setStickerLock = useCallback((id: string, locked: boolean) => {
    dispatch({ type: 'SET_STICKER_LOCK', payload: { id, locked } });
  }, []);

  const bringToFront = useCallback((id: string) => {
    dispatch({ type: 'BRING_TO_FRONT', payload: id });
  }, []);

  const sendToBack = useCallback((id: string) => {
    dispatch({ type: 'SEND_TO_BACK', payload: id });
  }, []);

  const copyStickerOverlay = useCallback((id: string) => {
    dispatch({ type: 'COPY_STICKER', payload: id });
  }, []);

  const pasteStickerOverlay = useCallback((position: { x: number; y: number }) => {
    dispatch({ type: 'PASTE_STICKER', payload: position });
  }, []);

  const clearClipboard = useCallback(() => {
    dispatch({ type: 'CLEAR_CLIPBOARD' });
  }, []);

  const restoreStickerOverlays = useCallback((stickers: StickerOverlay[]) => {
    dispatch({ type: 'RESTORE_STICKERS', payload: stickers });
  }, []);

  const getStickerOverlayById = useCallback((id: string) => {
    return state.stickerOverlays.find(sticker => sticker.id === id);
  }, [state.stickerOverlays]);

  const getStickerOverlayAtTime = useCallback((time: number) => {
    return state.stickerOverlays.filter(sticker => 
      sticker.visible && 
      time >= sticker.timing.startTime && 
      time <= sticker.timing.endTime
    );
  }, [state.stickerOverlays]);

  const loadAvailableStickers = useCallback((stickers: StickerItem[]) => {
    dispatch({ type: 'LOAD_AVAILABLE_STICKERS', payload: stickers });
  }, []);

  // Add sticker to timeline
  const addStickerToTimeline = useCallback((
    stickerId: string, 
    stickerUrl: string, 
    stickerName: string, 
    position: { x: number; y: number }, 
    currentTime: number, 
    duration: number = 5
  ) => {
    // Ensure position is within bounds using utility function
    const videoSize = getDefaultVideoSize();
    const stickerSize = getDefaultStickerSize();
    const clampedPosition = clampPositionToBounds(position, stickerSize, videoSize);
    
    // Create sticker overlay with correct timing
    const id = `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    dispatch({ 
      type: 'ADD_STICKER', 
      payload: { 
        id,
        stickerId, 
        stickerUrl, 
        stickerName, 
        position: clampedPosition,
        timing: { startTime: currentTime, endTime: currentTime + duration }
      } 
    });
    
    // Add to timeline if operations are available
    if (timelineOperations) {
      const availableTrackId = timelineOperations.getFirstAvailableTrack();
      
      // Add item to track
      timelineOperations.addItemToTrack(availableTrackId, {
        type: 'sticker',
        name: stickerName,
        startTime: currentTime,
        duration: duration,
        stickerId: id,
        stickerUrl: stickerUrl,
        position: clampedPosition,
        size: { width: 100, height: 100 },
        rotation: 0,
        opacity: 1,
        animation: { type: 'none' },
        isLocked: false,
        isMainVideoUnit: false
      });
    }
    
    return id;
  }, [timelineOperations]);

  const setTimelineOperationsHandler = useCallback((operations: any) => {
    setTimelineOperations(operations);
  }, []);

  const value: StickerContextValue = {
    state,
    addStickerOverlay,
    addStickerToTimeline,
    removeStickerOverlay,
    selectStickerOverlay,
    updateStickerOverlay,
    duplicateStickerOverlay,
    updateStickerPosition,
    updateStickerSize,
    updateStickerRotation,
    updateStickerOpacity,
    updateStickerTiming,
    setStickerVisibility,
    setStickerLock,
    bringToFront,
    sendToBack,
    copyStickerOverlay,
    pasteStickerOverlay,
    clearClipboard,
    restoreStickerOverlays,
    getStickerOverlayById,
    getStickerOverlayAtTime,
    loadAvailableStickers,
    setTimelineOperations: setTimelineOperationsHandler,
  };

  return (
    <StickerContext.Provider value={value}>
      {children}
    </StickerContext.Provider>
  );
};

export const useStickerContext = () => {
  const context = useContext(StickerContext);
  if (context === undefined) {
    throw new Error('useStickerContext must be used within a StickerProvider');
  }
  return context;
};
