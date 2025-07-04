import React, { createContext, useState, useContext, ReactNode } from 'react';
import { TrendingTopic } from '../mockdata/trendingTopics';
import { Script } from '../mockdata/scripts';
import { Voice } from '../mockdata/voices';
import { Background } from '../mockdata/backgrounds';
import { VideoEditParams } from '../services/video.service';
import { VoiceGenerationResult } from '../services/voice.service';
import { SubtitleOptions } from '../types/subtitle';

interface VideoCreationState {
  step: 'topic' | 'script' | 'voice' | 'background' | 'subtitle' | 'edit' | 'export'|'preview';
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
  const [state, setState] = useState<VideoCreationState>(initialState);
  
  const setStep = (step: VideoCreationState['step']) => {
    setState(prev => ({ ...prev, step }));
  };
    const setSelectedTopic = (topic: TrendingTopic | null) => {
    setState(prev => {
      // If topic changed, reset script to force regeneration
      const shouldResetScript = prev.selectedTopic?.id !== topic?.id;
      return {
        ...prev,
        selectedTopic: topic,
        script: shouldResetScript ? null : prev.script
      };
    });
  };
  
  const setKeyword = (keyword: string) => {
    setState(prev => {
      // If keyword changed, reset script to force regeneration
      const shouldResetScript = prev.keyword !== keyword;
      return {
        ...prev,
        keyword,
        script: shouldResetScript ? null : prev.script
      };
    });
  };
  
  const setScript = (script: Script | null) => {
    setState(prev => ({ ...prev, script }));
  };
  
  const setSelectedVoice = (voice: Voice | null) => {
    setState(prev => ({ ...prev, selectedVoice: voice }));
  };
    const setVoiceSettings = (settings: Partial<VideoCreationState['voiceSettings']>) => {
    setState(prev => ({
      ...prev,
      voiceSettings: { ...prev.voiceSettings, ...settings }
    }));
  };
  
  const setGeneratedAudio = (audio: VoiceGenerationResult | null) => {
    setState(prev => ({ ...prev, generatedAudio: audio }));
  };

  const setSelectedUploadedAudio = (audio: VideoCreationState['selectedUploadedAudio']) => {
    setState(prev => ({ ...prev, selectedUploadedAudio: audio }));
  };

  const setSelectedBackground = (background: Background | null) => {
    setState(prev => ({ ...prev, selectedBackground: background }));
  };
  
  const setSelectedBackgrounds = (backgrounds: Background[]) => {
    setState(prev => ({ 
      ...prev, 
      selectedBackgrounds: backgrounds,
      selectedBackground: backgrounds.length > 0 ? backgrounds[0] : null // Sync with main selection
    }));
  };
  
  const setSubtitleOptions = (options: SubtitleOptions | null) => {
    setState(prev => ({ ...prev, subtitleOptions: options }));
  };
  
  const setEditSettings = (settings: Partial<VideoEditParams>) => {
    setState(prev => ({
      ...prev,
      editSettings: { ...prev.editSettings, ...settings }
    }));
  };
  
  const resetState = () => {
    setState(initialState);
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
