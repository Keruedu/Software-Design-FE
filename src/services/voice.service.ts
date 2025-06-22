import { Voice } from '../mockdata/voices';
import { mockApiCall, mockVoices } from '../mockdata';

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Audio cache to prevent duplicate API calls
const audioCache = new Map<string, VoiceGenerationResult>();

// Helper function to create cache key
const createCacheKey = (text: string, voiceId: string, speed: number, pitch: number): string => {
  return `${voiceId}_${speed}_${pitch}_${text.slice(0, 100)}`; // Limit text length for cache key
};

export interface VoiceGenerationParams {
  text: string;
  voiceId: string;
  settings?: {
    speed?: number; // 0.5 to 2.0, default 1.0
    pitch?: number; // -10 to 10, default 0
  };
}

export interface VoiceGenerationResult {
  audioUrl: string;
  duration: number;
  voiceId: string;
  settings: {
    speed: number;
    pitch: number;
  };
}

/**
 * Service for voice generation and management
 */
export const VoiceService = {  /**
   * Get all available voices from backend API
   */
  getAllVoices: async (): Promise<Voice[]> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/voices/`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const voices = await response.json();
      
      // Convert backend format to frontend format
      return voices.map((voice: any) => ({
        id: voice.id,
        name: voice.name,
        gender: voice.gender,
        language: voice.language,
        accent: voice.accent,
        previewUrl: voice.preview_url || `/assets/sounds/voice-preview-${voice.id}.mp3`,
        tags: voice.tags || []
      }));
      
    } catch (error) {
      console.error('Error fetching voices from API:', error);
      
      // Only fallback to mock data if the API is completely unreachable
      // But log this as it should not happen in production
      console.warn('Falling back to mock data - this should not happen in production');
      return mockApiCall(mockVoices);
    }
  },
  /**
   * Get voice by ID from backend API
   */
  getVoiceById: async (id: string): Promise<Voice | null> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/voices/${id}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const voice = await response.json();
      
      // Convert backend format to frontend format
      return {
        id: voice.id,
        name: voice.name,
        gender: voice.gender,
        language: voice.language,
        accent: voice.accent,
        previewUrl: voice.preview_url || `/assets/sounds/voice-preview-${voice.id}.mp3`,
        tags: voice.tags || []
      };
      
    } catch (error) {
      console.error('Error fetching voice by ID from API:', error);
      
      // Fallback to mock data
      const voice = mockVoices.find(v => v.id === id);
      return mockApiCall(voice || null);
    }
  },  /**
   * Generate audio from text using selected voice and backend API
   */
  generateVoiceAudio: async (params: VoiceGenerationParams): Promise<VoiceGenerationResult> => {
    try {
      const settings = {
        speed: params.settings?.speed || 1.0,
        pitch: params.settings?.pitch || 0
      };
      
      // Create cache key
      const cacheKey = createCacheKey(params.text, params.voiceId, settings.speed, settings.pitch);
      
      // Check cache first
      if (audioCache.has(cacheKey)) {
        console.log('🎵 Using cached audio for:', cacheKey);
        return audioCache.get(cacheKey)!;
      }
      
      console.log('🎵 Generating new audio for:', cacheKey);
      
      const token = localStorage.getItem('access_token');
      const requestBody = {
        text: params.text,
        voice_id: params.voiceId,
        settings: settings
      };
      
      const response = await fetch(`${API_BASE_URL}/voices/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Voice generation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      const voiceResult: VoiceGenerationResult = {
        audioUrl: result.audio_url,
        duration: result.duration,
        voiceId: result.voice_id,
        settings: result.settings
      };
        // Cache the result
      audioCache.set(cacheKey, voiceResult);
      console.log('💾 Cached audio result for:', cacheKey);
      console.log('📊 Cache now has', audioCache.size, 'entries');
      
      return voiceResult;
      
    } catch (error) {
      console.error('Error generating voice audio from API:', error);
      
      // Fallback to mock generation
      const settings = {
        speed: params.settings?.speed || 1.0,
        pitch: params.settings?.pitch || 0
      };

      const result: VoiceGenerationResult = {
        audioUrl: '/assets/sounds/generated-audio-sample.mp3',
        duration: 60,
        voiceId: params.voiceId,
        settings
      };      
      return mockApiCall(result, 0.05, 3000);
    }
  },
  /**
   * Filter voices by language using backend API
   */
  filterVoicesByLanguage: async (language: string): Promise<Voice[]> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/voices/?language=${encodeURIComponent(language)}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const voices = await response.json();
      
      return voices.map((voice: any) => ({
        id: voice.id,
        name: voice.name,
        gender: voice.gender,
        language: voice.language,
        accent: voice.accent,
        previewUrl: voice.preview_url || `/assets/sounds/voice-preview-${voice.id}.mp3`,
        tags: voice.tags || []
      }));
      
    } catch (error) {
      console.error('Error filtering voices by language from API:', error);
      
      // Fallback to mock filtering
      const filteredVoices = mockVoices.filter(voice => 
        voice.language.toLowerCase() === language.toLowerCase()
      );
      
      return mockApiCall(filteredVoices);
    }
  },

  /**
   * Get available languages from backend API
   */
  getAvailableLanguages: async (): Promise<string[]> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/voices/languages/available`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.languages;
      
    } catch (error) {
      console.error('Error fetching available languages from API:', error);
      
      // Fallback to mock languages
      const languages = [...new Set(mockVoices.map(voice => voice.language))];
      return Promise.resolve(languages);
    }
  },

  /**
   * Get available genders from backend API
   */
  getAvailableGenders: async (): Promise<string[]> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/voices/genders/available`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.genders;
        } catch (error) {
      console.error('Error fetching available genders from API:', error);
      
      // Fallback to mock genders
      const genders = [...new Set(mockVoices.map(voice => voice.gender))];
      return Promise.resolve(genders);
    }
  },

  /**
   * Clear audio cache (useful for testing or memory management)
   */
  clearAudioCache: () => {
    audioCache.clear();
    console.log('🗑️ Audio cache cleared');
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    return {
      size: audioCache.size,
      keys: Array.from(audioCache.keys())
    };
  }
};
