import { Voice } from '../mockdata/voices';
import { mockApiCall, mockVoices } from '../mockdata';

export interface VoiceGenerationParams {
  scriptId: string;
  voiceId: string;
  settings?: {
    speed?: number; // 0.5 to 2.0, default 1.0
    pitch?: number; // -10 to 10, default 0
  };
}

export interface VoiceGenerationResult {
  id: string;
  audioUrl: string;
  duration: number;
  scriptId: string;
  voiceId: string;
  settings: {
    speed: number;
    pitch: number;
  };
}

/**
 * Service for voice generation and management
 */
export const VoiceService = {
  /**
   * Get all available voices
   */
  getAllVoices: async (): Promise<Voice[]> => {
    return mockApiCall(mockVoices);
  },

  /**
   * Get voice by ID
   */
  getVoiceById: async (id: string): Promise<Voice | null> => {
    const voice = mockVoices.find(v => v.id === id);
    return mockApiCall(voice || null);
  },

  /**
   * Generate audio from script using selected voice
   */
  generateVoiceAudio: async (params: VoiceGenerationParams): Promise<VoiceGenerationResult> => {
    // Default settings
    const settings = {
      speed: params.settings?.speed || 1.0,
      pitch: params.settings?.pitch || 0
    };

    // Simulate voice generation
    const result: VoiceGenerationResult = {
      id: `audio_${Date.now()}`,
      audioUrl: '/assets/sounds/generated-audio-sample.mp3', // Mock audio URL
      duration: 60, // Mock duration
      scriptId: params.scriptId,
      voiceId: params.voiceId,
      settings
    };

    // Simulate longer processing time for AI voice generation
    return mockApiCall(result, 0.05, 3000);
  },

  /**
   * Filter voices by language
   */
  filterVoicesByLanguage: async (language: string): Promise<Voice[]> => {
    const filteredVoices = mockVoices.filter(voice => 
      voice.language.toLowerCase() === language.toLowerCase()
    );
    
    return mockApiCall(filteredVoices);
  }
};
