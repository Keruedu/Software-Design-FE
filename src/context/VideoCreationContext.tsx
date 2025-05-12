import React, { createContext, useState, useContext, ReactNode } from 'react';
import { TrendingTopic } from '../mockdata/trendingTopics';
import { Script } from '../mockdata/scripts';
import { Voice } from '../mockdata/voices';
import { Background } from '../mockdata/backgrounds';
import { VideoEditParams } from '../services/video.service';

interface VideoCreationState {
  step: 'topic' | 'script' | 'voice' | 'background' | 'edit' | 'export';
  selectedTopic: TrendingTopic | null;
  keyword: string;
  script: Script | null;
  selectedVoice: Voice | null;
  voiceSettings: {
    speed: number; // 0.5 to 2.0
    pitch: number; // -10 to 10
  };
  selectedBackground: Background | null;
  editSettings: VideoEditParams;
}

interface VideoCreationContextType {
  state: VideoCreationState;
  setStep: (step: VideoCreationState['step']) => void;
  setSelectedTopic: (topic: TrendingTopic | null) => void;
  setKeyword: (keyword: string) => void;
  setScript: (script: Script | null) => void;
  setSelectedVoice: (voice: Voice | null) => void;
  setVoiceSettings: (settings: Partial<VideoCreationState['voiceSettings']>) => void;
  setSelectedBackground: (background: Background | null) => void;
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
  },
  selectedBackground: null,
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
    setState(prev => ({ ...prev, selectedTopic: topic }));
  };
  
  const setKeyword = (keyword: string) => {
    setState(prev => ({ ...prev, keyword }));
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
  
  const setSelectedBackground = (background: Background | null) => {
    setState(prev => ({ ...prev, selectedBackground: background }));
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
    setSelectedBackground,
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
