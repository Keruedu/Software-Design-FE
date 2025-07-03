import React, { createContext, useContext, useCallback, useReducer, useEffect } from 'react';
import { 
  TextOverlayData, 
  TextOverlayState, 
  TextOverlayContextType,
  DEFAULT_TEXT_STYLE,
  DEFAULT_TEXT_POSITION,
  DEFAULT_TEXT_SIZE
} from '@/types/text';
import { useTimelineContext } from '@/context/TimelineContext';
import { TimelineItem } from '@/types/timeline';

// Action types
type TextOverlayAction = 
  | { type: 'ADD_TEXT_OVERLAY'; payload: { id: string; text: string; position?: { x: number; y: number } } }
  | { type: 'UPDATE_TEXT_OVERLAY'; payload: { id: string; updates: Partial<TextOverlayData> } }
  | { type: 'REMOVE_TEXT_OVERLAY'; payload: { id: string } }
  | { type: 'SELECT_TEXT_OVERLAY'; payload: { id: string | null } }
  | { type: 'DUPLICATE_TEXT_OVERLAY'; payload: { id: string } }
  | { type: 'MOVE_TEXT_OVERLAY'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'RESIZE_TEXT_OVERLAY'; payload: { id: string; size: { width: number; height: number } } }
  | { type: 'UPDATE_TEXT_STYLE'; payload: { id: string; style: Partial<TextOverlayData['style']> } }
  | { type: 'UPDATE_TEXT_TIMING'; payload: { id: string; timing: Partial<TextOverlayData['timing']> } }
  | { type: 'START_EDITING'; payload: { id: string } }
  | { type: 'STOP_EDITING' }
  | { type: 'COPY_TEXT_OVERLAY'; payload: { id: string } }
  | { type: 'PASTE_TEXT_OVERLAY'; payload: { position?: { x: number; y: number } } }
  | { type: 'SET_TEXT_OVERLAY_VISIBILITY'; payload: { id: string; visible: boolean } }
  | { type: 'SET_TEXT_OVERLAY_LOCK'; payload: { id: string; locked: boolean } }
  | { type: 'BRING_TO_FRONT'; payload: { id: string } }
  | { type: 'SEND_TO_BACK'; payload: { id: string } };

const initialState: TextOverlayState = {
  textOverlays: [],
  selectedTextId: null,
  isEditMode: false,
  editingTextId: null,
  clipboard: null,
};

const generateId = () => `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const textOverlayReducer = (state: TextOverlayState, action: TextOverlayAction): TextOverlayState => {
  switch (action.type) {
    case 'ADD_TEXT_OVERLAY': {
      const { id, text, position } = action.payload;
      const textPosition = position || DEFAULT_TEXT_POSITION;
      const newTextOverlay: TextOverlayData = {
        id,
        text,
        position: textPosition,
        size: DEFAULT_TEXT_SIZE,
        style: { ...DEFAULT_TEXT_STYLE },
        timing: {
          startTime: 0,
          duration: 5,
          endTime: 5,
        },
        animation: {
          type: 'none',
          duration: 0.5,
        },
        isVisible: true,
        isLocked: false,
        isSelected: false,
        zIndex: state.textOverlays.length,
        rotation: 0,
        opacity: 1,
      };
      
      return {
        ...state,
        textOverlays: [...state.textOverlays, newTextOverlay],
        selectedTextId: id,
      };
    }

    case 'UPDATE_TEXT_OVERLAY': {
      return {
        ...state,
        textOverlays: state.textOverlays.map(overlay =>
          overlay.id === action.payload.id
            ? { ...overlay, ...action.payload.updates }
            : overlay
        ),
      };
    }

    case 'REMOVE_TEXT_OVERLAY': {
      return {
        ...state,
        textOverlays: state.textOverlays.filter(overlay => overlay.id !== action.payload.id),
        selectedTextId: state.selectedTextId === action.payload.id ? null : state.selectedTextId,
        editingTextId: state.editingTextId === action.payload.id ? null : state.editingTextId,
      };
    }

    case 'SELECT_TEXT_OVERLAY': {
      return {
        ...state,
        selectedTextId: action.payload.id,
        textOverlays: state.textOverlays.map(overlay => ({
          ...overlay,
          isSelected: overlay.id === action.payload.id,
        })),
      };
    }

    case 'DUPLICATE_TEXT_OVERLAY': {
      const originalOverlay = state.textOverlays.find(overlay => overlay.id === action.payload.id);
      if (!originalOverlay) return state;

      const newId = generateId();
      const duplicatedOverlay: TextOverlayData = {
        ...originalOverlay,
        id: newId,
        position: {
          x: originalOverlay.position.x + 20,
          y: originalOverlay.position.y + 20,
        },
        zIndex: state.textOverlays.length,
        isSelected: false,
      };

      return {
        ...state,
        textOverlays: [...state.textOverlays, duplicatedOverlay],
        selectedTextId: newId,
      };
    }

    case 'MOVE_TEXT_OVERLAY': {
      return {
        ...state,
        textOverlays: state.textOverlays.map(overlay =>
          overlay.id === action.payload.id
            ? { ...overlay, position: action.payload.position }
            : overlay
        ),
      };
    }

    case 'RESIZE_TEXT_OVERLAY': {
      return {
        ...state,
        textOverlays: state.textOverlays.map(overlay =>
          overlay.id === action.payload.id
            ? { ...overlay, size: action.payload.size }
            : overlay
        ),
      };
    }

    case 'UPDATE_TEXT_STYLE': {
      return {
        ...state,
        textOverlays: state.textOverlays.map(overlay =>
          overlay.id === action.payload.id
            ? { ...overlay, style: { ...overlay.style, ...action.payload.style } }
            : overlay
        ),
      };
    }

    case 'UPDATE_TEXT_TIMING': {
      return {
        ...state,
        textOverlays: state.textOverlays.map(overlay =>
          overlay.id === action.payload.id
            ? { 
                ...overlay, 
                timing: { 
                  ...overlay.timing, 
                  ...action.payload.timing,
                  endTime: action.payload.timing.startTime !== undefined && action.payload.timing.duration !== undefined
                    ? action.payload.timing.startTime + action.payload.timing.duration
                    : overlay.timing.endTime
                }
              }
            : overlay
        ),
      };
    }

    case 'START_EDITING': {
      return {
        ...state,
        isEditMode: true,
        editingTextId: action.payload.id,
      };
    }

    case 'STOP_EDITING': {
      return {
        ...state,
        isEditMode: false,
        editingTextId: null,
      };
    }

    case 'COPY_TEXT_OVERLAY': {
      const overlayToCopy = state.textOverlays.find(overlay => overlay.id === action.payload.id);
      return {
        ...state,
        clipboard: overlayToCopy || null,
      };
    }

    case 'PASTE_TEXT_OVERLAY': {
      if (!state.clipboard) return state;

      const newId = generateId();
      const position = action.payload.position || {
        x: state.clipboard.position.x + 20,
        y: state.clipboard.position.y + 20,
      };

      const pastedOverlay: TextOverlayData = {
        ...state.clipboard,
        id: newId,
        position,
        zIndex: state.textOverlays.length,
        isSelected: false,
      };

      return {
        ...state,
        textOverlays: [...state.textOverlays, pastedOverlay],
        selectedTextId: newId,
      };
    }

    case 'SET_TEXT_OVERLAY_VISIBILITY': {
      return {
        ...state,
        textOverlays: state.textOverlays.map(overlay =>
          overlay.id === action.payload.id
            ? { ...overlay, isVisible: action.payload.visible }
            : overlay
        ),
      };
    }

    case 'SET_TEXT_OVERLAY_LOCK': {
      return {
        ...state,
        textOverlays: state.textOverlays.map(overlay =>
          overlay.id === action.payload.id
            ? { ...overlay, isLocked: action.payload.locked }
            : overlay
        ),
      };
    }

    case 'BRING_TO_FRONT': {
      const maxZIndex = Math.max(...state.textOverlays.map(overlay => overlay.zIndex));
      return {
        ...state,
        textOverlays: state.textOverlays.map(overlay =>
          overlay.id === action.payload.id
            ? { ...overlay, zIndex: maxZIndex + 1 }
            : overlay
        ),
      };
    }

    case 'SEND_TO_BACK': {
      const minZIndex = Math.min(...state.textOverlays.map(overlay => overlay.zIndex));
      return {
        ...state,
        textOverlays: state.textOverlays.map(overlay =>
          overlay.id === action.payload.id
            ? { ...overlay, zIndex: minZIndex - 1 }
            : overlay
        ),
      };
    }

    default:
      return state;
  }
};

const TextOverlayContext = createContext<TextOverlayContextType | null>(null);

export const useTextOverlayContext = () => {
  const context = useContext(TextOverlayContext);
  if (!context) {
    throw new Error('useTextOverlayContext must be used within a TextOverlayProvider');
  }
  return context;
};

export const TextOverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(textOverlayReducer, initialState);
  
  // Get timeline context if available (may not be available in all contexts)
  let timelineContext;
  try {
    timelineContext = useTimelineContext();
  } catch {
    timelineContext = null;
  }

  // Helper function to convert TextOverlayData to TimelineItem
  const textOverlayToTimelineItem = useCallback((overlay: TextOverlayData): TimelineItem => {
    return {
      id: overlay.id,
      type: 'text',
      name: overlay.text || 'Text',
      startTime: overlay.timing.startTime,
      duration: overlay.timing.duration,
      trackId: 'text-track',
      text: overlay.text,
      style: {
        fontSize: overlay.style.fontSize,
        color: overlay.style.color,
        fontFamily: overlay.style.fontFamily,
        fontWeight: overlay.style.fontWeight,
      },
      position: overlay.position,
      size: overlay.size,
      opacity: overlay.opacity,
      isLocked: overlay.isLocked,
    };
  }, []);

  // Sync text overlays with timeline when they change
  useEffect(() => {
    console.log('Text overlay sync effect triggered', { 
      hasTimelineContext: !!timelineContext, 
      textOverlayCount: state.textOverlays.length 
    });
    
    if (!timelineContext) return;

    const textTrack = timelineContext.timelineState.tracks.find(track => track.id === 'text-track');
    console.log('Text track found:', !!textTrack);
    if (!textTrack) return;

    // Update timeline items to match text overlays
    const textTrackItems = state.textOverlays.map(textOverlayToTimelineItem);
    
    // Only update if there are actual changes
    const currentItemIds = textTrack.items.map(item => item.id).sort();
    const newItemIds = textTrackItems.map(item => item.id).sort();
    
    console.log('Timeline sync check:', {
      currentItemIds,
      newItemIds,
      needsUpdate: JSON.stringify(currentItemIds) !== JSON.stringify(newItemIds)
    });
    
    if (JSON.stringify(currentItemIds) !== JSON.stringify(newItemIds)) {
      console.log('Updating timeline track with items:', textTrackItems);
      timelineContext.updateTrack('text-track', { items: textTrackItems });
    }
  }, [state.textOverlays, timelineContext, textOverlayToTimelineItem]);

  const addTextOverlay = useCallback((text: string, position?: { x: number; y: number }) => {
    const id = generateId();
    dispatch({ type: 'ADD_TEXT_OVERLAY', payload: { id, text, position } });
    return id;
  }, []);

  const updateTextOverlay = useCallback((id: string, updates: Partial<TextOverlayData>) => {
    dispatch({ type: 'UPDATE_TEXT_OVERLAY', payload: { id, updates } });
  }, []);

  const removeTextOverlay = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TEXT_OVERLAY', payload: { id } });
    // Also remove from timeline if available
    if (timelineContext) {
      timelineContext.removeItemFromTrack('text-track', id);
    }
  }, [timelineContext]);

  const selectTextOverlay = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_TEXT_OVERLAY', payload: { id } });
  }, []);

  const duplicateTextOverlay = useCallback((id: string) => {
    dispatch({ type: 'DUPLICATE_TEXT_OVERLAY', payload: { id } });
    return generateId();
  }, []);

  const moveTextOverlay = useCallback((id: string, position: { x: number; y: number }) => {
    dispatch({ type: 'MOVE_TEXT_OVERLAY', payload: { id, position } });
  }, []);

  const resizeTextOverlay = useCallback((id: string, size: { width: number; height: number }) => {
    dispatch({ type: 'RESIZE_TEXT_OVERLAY', payload: { id, size } });
  }, []);

  const updateTextStyle = useCallback((id: string, style: Partial<TextOverlayData['style']>) => {
    dispatch({ type: 'UPDATE_TEXT_STYLE', payload: { id, style } });
  }, []);

  const updateTextTiming = useCallback((id: string, timing: Partial<TextOverlayData['timing']>) => {
    dispatch({ type: 'UPDATE_TEXT_TIMING', payload: { id, timing } });
    
    // Also update timeline item if available
    if (timelineContext) {
      const updates: Partial<TimelineItem> = {};
      if (timing.startTime !== undefined) updates.startTime = timing.startTime;
      if (timing.duration !== undefined) updates.duration = timing.duration;
      if (Object.keys(updates).length > 0) {
        timelineContext.updateItem('text-track', id, updates);
      }
    }
  }, [timelineContext]);

  const startEditing = useCallback((id: string) => {
    dispatch({ type: 'START_EDITING', payload: { id } });
  }, []);

  const stopEditing = useCallback(() => {
    dispatch({ type: 'STOP_EDITING' });
  }, []);

  const copyTextOverlay = useCallback((id: string) => {
    dispatch({ type: 'COPY_TEXT_OVERLAY', payload: { id } });
  }, []);

  const pasteTextOverlay = useCallback((position?: { x: number; y: number }) => {
    dispatch({ type: 'PASTE_TEXT_OVERLAY', payload: { position } });
    return generateId();
  }, []);

  const setTextOverlayVisibility = useCallback((id: string, visible: boolean) => {
    dispatch({ type: 'SET_TEXT_OVERLAY_VISIBILITY', payload: { id, visible } });
  }, []);

  const setTextOverlayLock = useCallback((id: string, locked: boolean) => {
    dispatch({ type: 'SET_TEXT_OVERLAY_LOCK', payload: { id, locked } });
  }, []);

  const bringToFront = useCallback((id: string) => {
    dispatch({ type: 'BRING_TO_FRONT', payload: { id } });
  }, []);

  const sendToBack = useCallback((id: string) => {
    dispatch({ type: 'SEND_TO_BACK', payload: { id } });
  }, []);

  const getTextOverlayAtTime = useCallback((time: number) => {
    return state.textOverlays.filter(overlay => 
      overlay.isVisible && 
      time >= overlay.timing.startTime && 
      time <= overlay.timing.endTime
    );
  }, [state.textOverlays]);

  const getTextOverlayById = useCallback((id: string) => {
    return state.textOverlays.find(overlay => overlay.id === id) || null;
  }, [state.textOverlays]);

  const contextValue: TextOverlayContextType = {
    state,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    selectTextOverlay,
    duplicateTextOverlay,
    moveTextOverlay,
    resizeTextOverlay,
    updateTextStyle,
    updateTextTiming,
    startEditing,
    stopEditing,
    copyTextOverlay,
    pasteTextOverlay,
    setTextOverlayVisibility,
    setTextOverlayLock,
    bringToFront,
    sendToBack,
    getTextOverlayAtTime,
    getTextOverlayById,
  };

  return (
    <TextOverlayContext.Provider value={contextValue}>
      {children}
    </TextOverlayContext.Provider>
  );
};

export default TextOverlayProvider;
