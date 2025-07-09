import React, { createContext, useState, useContext, ReactNode } from 'react';
import { TrendingTopic } from '../mockdata/trendingTopics';
import { Script } from '../mockdata/scripts';
import { Voice } from '../mockdata/voices';
import { Background } from '../mockdata/backgrounds';
import { VideoEditParams } from '../services/video.service';
import { VoiceGenerationResult } from '../services/voice.service';
import { SubtitleOptions } from '../types/subtitle';

interface VideoCreationState {
  step: 'topic' | 'script' | 'voice' | 'background' | 'subtitle' | 'edit' | 'export';
  selectedTopic: TrendingTopic | null;
  keyword: string;
  script: Script | null;
  selectedVoice: Voice | null;
  voiceSettings: {
    speed: number; // 0.5 to 2.0
    pitch: number; // -10 to 10
  };  
  generatedAudio: VoiceGenerationResult | null;
  selectedUploadedAudio: {
    id: string;
    title: string;
    audioUrl: string;
  } | null; // New: for uploaded audio
  selectedBackground: Background | null; // Backward compatibility
  selectedBackgrounds: Background[]; // New multi-selection
  subtitleOptions: SubtitleOptions | null;
  editSettings: VideoEditParams;
}

interface VideoCreationContextType {
  state: VideoCreationState;
  setStep: (step: VideoCreationState['step']) => void;
  setSelectedTopic: (topic: TrendingTopic | null) => void;
  setKeyword: (keyword: string) => void;
  setScript: (script: Script | null) => void;
  setSelectedVoice: (voice: Voice | null) => void;
  setVoiceSettings: (settings: Partial<VideoCreationState['voiceSettings']>) => void;  setGeneratedAudio: (audio: VoiceGenerationResult | null) => void;
  setSelectedUploadedAudio: (audio: VideoCreationState['selectedUploadedAudio']) => void;
  setSelectedBackground: (background: Background | null) => void;
  setSelectedBackgrounds: (backgrounds: Background[]) => void; // New method
  setSubtitleOptions: (options: SubtitleOptions | null) => void;
  setEditSettings: (settings: Partial<VideoEditParams>) => void;
  resetState: () => void;
}

const initialState: VideoCreationState = {
  step: 'topic',
  selectedTopic: null,
  keyword: '',
  script: null,
  selectedVoice: null,
  voiceSettings: {
    speed: 1.0,
    pitch: 0
  },  generatedAudio: null,
  selectedUploadedAudio: null,
  selectedBackground: null,
  selectedBackgrounds: [], // Initialize empty array
  subtitleOptions: null,
  editSettings: {
    textOverlays: [],
    backgroundMusic: undefined,
    subtitles: true,
    filters: []
  }
};

const VideoCreationContext = createContext<VideoCreationContextType | undefined>(undefined);

export const VideoCreationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Initialize state with persistence from localStorage
  const [state, setState] = useState<VideoCreationState>(() => {
    if (typeof window === 'undefined') return initialState;
    
    try {
      const savedState = localStorage.getItem('videoCreationState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        console.log('🔄 Restoring state from localStorage:', {
          hasGeneratedAudio: !!parsed.generatedAudio,
          hasUploadedAudio: !!parsed.selectedUploadedAudio,
          hasVoice: !!parsed.selectedVoice,
          hasScript: !!parsed.script,
          step: parsed.step
        });
        return {
          ...initialState,
          // Only restore critical data that should persist across refreshes
          generatedAudio: parsed.generatedAudio || null,
          selectedUploadedAudio: parsed.selectedUploadedAudio || null,
          selectedVoice: parsed.selectedVoice || null,
          voiceSettings: parsed.voiceSettings || initialState.voiceSettings,
          script: parsed.script || null,
          selectedTopic: parsed.selectedTopic || null,
          keyword: parsed.keyword || '',
          selectedBackgrounds: parsed.selectedBackgrounds || [],
          selectedBackground: parsed.selectedBackground || null,
          subtitleOptions: parsed.subtitleOptions || null,
          step: parsed.step || 'topic'
        };
      }
    } catch (error) {
      console.warn('Failed to load saved state from localStorage:', error);
    }
    
    return initialState;
  });

  // Persist critical state changes to localStorage
  const persistState = (newState: VideoCreationState) => {
    if (typeof window === 'undefined') return;
    
    try {
      const stateToPersist = {
        generatedAudio: newState.generatedAudio,
        selectedUploadedAudio: newState.selectedUploadedAudio,
        selectedVoice: newState.selectedVoice,
        voiceSettings: newState.voiceSettings,
        script: newState.script,
        selectedTopic: newState.selectedTopic,
        keyword: newState.keyword,
        selectedBackgrounds: newState.selectedBackgrounds,
        selectedBackground: newState.selectedBackground,
        subtitleOptions: newState.subtitleOptions,
        step: newState.step
      };
      localStorage.setItem('videoCreationState', JSON.stringify(stateToPersist));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  };
  
  const setStep = (step: VideoCreationState['step']) => {
    setState(prev => {
      const newState = { ...prev, step };
      persistState(newState);
      return newState;
    });
  };
    const setSelectedTopic = (topic: TrendingTopic | null) => {
    setState(prev => {
      // If topic changed, reset script to force regeneration
      const shouldResetScript = prev.selectedTopic?.id !== topic?.id;
      const newState = {
        ...prev,
        selectedTopic: topic,
        script: shouldResetScript ? null : prev.script
      };
      persistState(newState);
      return newState;
    });
  };
  
  const setKeyword = (keyword: string) => {
    setState(prev => {
      // If keyword changed, reset script to force regeneration
      const shouldResetScript = prev.keyword !== keyword;
      const newState = {
        ...prev,
        keyword,
        script: shouldResetScript ? null : prev.script
      };
      persistState(newState);
      return newState;
    });
  };
  
  const setScript = (script: Script | null) => {
    setState(prev => {
      const newState = { ...prev, script };
      persistState(newState);
      return newState;
    });
  };
  
  const setSelectedVoice = (voice: Voice | null) => {
    setState(prev => {
      const newState = { ...prev, selectedVoice: voice };
      persistState(newState);
      return newState;
    });
  };
    const setVoiceSettings = (settings: Partial<VideoCreationState['voiceSettings']>) => {
    setState(prev => {
      const newState = {
        ...prev,
        voiceSettings: { ...prev.voiceSettings, ...settings }
      };
      persistState(newState);
      return newState;
    });
  };
  
  const setGeneratedAudio = (audio: VoiceGenerationResult | null) => {
    setState(prev => {
      const newState = { ...prev, generatedAudio: audio };
      persistState(newState);
      return newState;
    });
  };

  const setSelectedUploadedAudio = (audio: VideoCreationState['selectedUploadedAudio']) => {
    setState(prev => {
      const newState = { ...prev, selectedUploadedAudio: audio };
      persistState(newState);
      return newState;
    });
  };

  const setSelectedBackground = (background: Background | null) => {
    setState(prev => {
      const newState = { ...prev, selectedBackground: background };
      persistState(newState);
      return newState;
    });
  };
  
  const setSelectedBackgrounds = (backgrounds: Background[]) => {
    setState(prev => {
      const newState = { 
        ...prev, 
        selectedBackgrounds: backgrounds,
        selectedBackground: backgrounds.length > 0 ? backgrounds[0] : null // Sync with main selection
      };
      persistState(newState);
      return newState;
    });
  };
  
  const setSubtitleOptions = (options: SubtitleOptions | null) => {
    setState(prev => {
      const newState = { ...prev, subtitleOptions: options };
      persistState(newState);
      return newState;
    });
  };
  
  const setEditSettings = (settings: Partial<VideoEditParams>) => {
    setState(prev => {
      const newState = {
        ...prev,
        editSettings: { ...prev.editSettings, ...settings }
      };
      // Don't persist editSettings as they're temporary
      return newState;
    });
  };
  
  const resetState = () => {
    setState(initialState);
    // Clear persisted state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('videoCreationState');
    }
  };
  const value = {
    state,
    setStep,
    setSelectedTopic,
    setKeyword,
    setScript,
    setSelectedVoice,
    setVoiceSettings,
    setGeneratedAudio,
    setSelectedUploadedAudio,
    setSelectedBackground,
    setSelectedBackgrounds, // Add new method
    setSubtitleOptions,
    setEditSettings,
    resetState
  };
  
  return (
    <VideoCreationContext.Provider value={value}>
      {children}
    </VideoCreationContext.Provider>
  );
};

export const useVideoCreation = (): VideoCreationContextType => {
  const context = useContext(VideoCreationContext);
  
  if (context === undefined) {
    throw new Error('useVideoCreation must be used within a VideoCreationProvider');
  }
  
  return context;
};
