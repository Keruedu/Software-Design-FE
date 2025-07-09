import React, { createContext, useContext, useState, useCallback } from 'react';
import { Track, TimelineItem, TimelineState } from '@/types/timeline';

interface TimelineContextType {
  timelineState: TimelineState;
  addTrack: (track: Omit<Track, 'id'>) => string;
  removeTrack: (trackId: string) => void;
  addItemToTrack: (trackId: string, item: Omit<TimelineItem, 'id' | 'trackId'>) => string;
  removeItemFromTrack: (trackId: string, itemId: string) => void;
  updateItem: (trackId: string, itemId: string, updates: Partial<TimelineItem>) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setZoom: (zoom: number) => void;
  moveItem: (itemId: string, fromTrackId: string, toTrackId: string, newStartTime: number) => void;
  getFirstAvailableTrack: () => string;
}

const TimelineContext = createContext<TimelineContextType | null>(null);

export const useTimelineContext = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimelineContext must be used within a TimelineProvider');
  }
  return context;
};

const DEFAULT_TRACKS: Track[] = [
  {
    id: 'track-1',
    name: 'Main Video',
    type: 'mixed',
    height: 50, 
    isVisible: true,
    isLocked: false,
    isMainVideoTrack: true, 
    isResizable: false,
    items: [],
    color: '#3B82F6'
  },
  {
    id: 'track-2',
    name: 'Track 2',
    type: 'mixed',
    height: 50,
    isVisible: true,
    isLocked: false,
    isMuted: false,
    volume: 1,
    isResizable: true, 
    items: [],
    color: '#3B82F6'
  },
  {
    id: 'track-3',
    name: 'Track 3',
    type: 'mixed',
    height: 50,
    isVisible: true,
    isLocked: false,
    isMuted: false,
    volume: 1,
    isResizable: true,
    items: [],
    color: '#3B82F6'
  },
  {
    id: 'track-4',
    name: 'Track 4',
    type: 'mixed',
    height: 50,
    isVisible: true,
    isLocked: false,
    isMuted: false,
    volume: 1,
    isResizable: true,
    items: [],
    color: '#3B82F6'
  }
];

export const TimelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    tracks: DEFAULT_TRACKS,
    duration: 0,
    currentTime: 0,
    zoom: 1,
    pixelsPerSecond: 200 
  });

  const addTrack = useCallback((track: Omit<Track, 'id'>) => {
    const id = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newTrack: Track = { 
      ...track, 
      id
    };
    
    setTimelineState(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }));
    
    return id;
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.filter(track => track.id !== trackId)
    }));
  }, []);

  const addItemToTrack = useCallback((trackId: string, item: Omit<TimelineItem, 'id' | 'trackId'>) => {
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newItem: TimelineItem = { ...item, id, trackId };
    
    setTimelineState(prev => {
      const updatedTracks = prev.tracks.map(track => 
        track.id === trackId 
          ? { ...track, items: [...track.items, newItem] }
          : track
      );

      return {
        ...prev,
        tracks: updatedTracks
      };
    });
    
    return id;
  }, []);

  const removeItemFromTrack = useCallback((trackId: string, itemId: string) => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId 
          ? { ...track, items: track.items.filter(item => item.id !== itemId) }
          : track
      )
    }));
  }, []);

  const updateItem = useCallback((trackId: string, itemId: string, updates: Partial<TimelineItem>) => {
    setTimelineState(prev => {
      const updatedTracks = prev.tracks.map(track => 
        track.id === trackId 
          ? { 
              ...track, 
              items: track.items.map(item => 
                item.id === itemId ? { ...item, ...updates } : item
              )
            }
          : track
      );

      // Calculate new duration if item extends beyond current duration
      let newDuration = prev.duration;
      updatedTracks.forEach(track => {
        track.items.forEach(item => {
          const itemEndTime = item.startTime + item.duration;
          if (itemEndTime > newDuration) {
            newDuration = itemEndTime;
          }
        });
      });

      return {
        ...prev,
        tracks: updatedTracks,
        duration: newDuration
      };
    });
  }, []);

  const updateTrack = useCallback((trackId: string, updates: Partial<Track>) => {
    // console.log('Debug - TimelineContext updateTrack called:', { trackId, updates });
    setTimelineState(prev => {
      const updatedTracks = prev.tracks.map(track => 
        track.id === trackId ? { ...track, ...updates } : track
      );
      // console.log('Debug - Updated tracks:', updatedTracks.find(t => t.id === trackId));
      return {
        ...prev,
        tracks: updatedTracks
      };
    });
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    setTimelineState(prev => ({ ...prev, currentTime: time }));
  }, []);

  const setDuration = useCallback((duration: number) => {
    setTimelineState(prev => ({ ...prev, duration }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setTimelineState(prev => ({ ...prev, zoom, pixelsPerSecond: 200 * zoom }));
  }, []);

  const moveItem = useCallback((itemId: string, fromTrackId: string, toTrackId: string, newStartTime: number) => {
    setTimelineState(prev => {
      const fromTrack = prev.tracks.find(t => t.id === fromTrackId);
      const item = fromTrack?.items.find(i => i.id === itemId);
      
      if (!item) return prev;
      
      const updatedItem = { ...item, trackId: toTrackId, startTime: newStartTime };
      
      return {
        ...prev,
        tracks: prev.tracks.map(track => {
          if (track.id === fromTrackId) {
            return { ...track, items: track.items.filter(i => i.id !== itemId) };
          }
          if (track.id === toTrackId) {
            return { ...track, items: [...track.items, updatedItem] };
          }
          return track;
        })
      };
    });
  }, []);

  const getFirstAvailableTrack = useCallback(() => {
    const availableTrack = timelineState.tracks.find(track => !track.isMainVideoTrack);
    
    if (availableTrack) {
      return availableTrack.id;
    }
    
    // Create a new track if none are available
    const newTrackId = addTrack({
      name: `Track ${timelineState.tracks.length + 1}`,
      type: 'mixed',
      height: 50,
      isVisible: true,
      isLocked: false,
      isResizable: true,
      items: [],
      color: '#3B82F6'
    });
    
    return newTrackId;
  }, [timelineState.tracks, addTrack]);

  const contextValue: TimelineContextType = {
    timelineState,
    addTrack,
    removeTrack,
    addItemToTrack,
    removeItemFromTrack,
    updateItem,
    updateTrack,
    setCurrentTime,
    setDuration,
    setZoom,
    moveItem,
    getFirstAvailableTrack
  };

  return (
    <TimelineContext.Provider value={contextValue}>
      {children}
    </TimelineContext.Provider>
  );
};
