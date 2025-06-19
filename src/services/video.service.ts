import { Video, VideoWithDetails } from '../mockdata/videos';
import { mockApiCall, mockBackgrounds, mockScripts, mockVideos, mockVoices, trendingTopics } from '../mockdata';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface VideoCreationParams {
  title: string;
  description: string;
  scriptId: string;
  voiceId: string;
  backgroundId: string;
  topics: string[];
}

export interface CompleteVideoCreationParams {
  script_text: string;
  voice_id: string;
  background_image_id: string;
  subtitle_enabled?: boolean;
  subtitle_language?: string;
  subtitle_style?: string;
}

export interface VideoFromComponentsParams {
  audio_file_id: string;
  background_image_id: string;
  script_text?: string;
  subtitle_enabled?: boolean;
  subtitle_language?: string;
}

export interface VideoEditParams {
  textOverlays?: Array<{
    text: string;
    startTime: number;
    endTime: number;
    position: 'top' | 'middle' | 'bottom';
    style?: {
      fontFamily?: string;
      fontSize?: number;
      color?: string;
    };
  }>;
  backgroundMusic?: {
    trackId: string;
    volume: number; // 0-100
  };
  subtitles?: boolean;
  filters?: Array<{
    type: string;
    intensity: number;
  }>;
}

/**
 * Service for video creation and management
 */
export const VideoService = {
  /**
   * Create a complete video from script, voice, background, and subtitles
   */  createCompleteVideo: async (params: CompleteVideoCreationParams): Promise<any> => {
    let token = localStorage.getItem('access_token');
    // For testing - use mock token if no real token found
    if (!token) {
      console.warn('No access token found, using mock token for testing');
      token = 'mock-token-for-testing';
    }

    const response = await fetch(`${API_BASE_URL}/api/video/create-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create video');
    }

    return response.json();
  },

  /**
   * Create video from existing audio and background components
   */  createVideoFromComponents: async (params: VideoFromComponentsParams): Promise<any> => {
    let token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No access token found, using mock token for testing');
      token = 'mock-token-for-testing';
    }

    const response = await fetch(`${API_BASE_URL}/api/video/create-from-components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create video');
    }

    return response.json();
  },

  /**
   * Get video preview URL
   */  getVideoPreview: async (videoId: string): Promise<{video_url: string; title: string; duration?: number; created_at: string}> => {
    let token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No access token found, using mock token for testing');
      token = 'mock-token-for-testing';
    }

    const response = await fetch(`${API_BASE_URL}/api/video/preview/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get video preview');
    }

    return response.json();
  },

  /**
   * Download video file
   */  downloadVideo: async (videoId: string): Promise<Blob> => {
    let token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No access token found, using mock token for testing');
      token = 'mock-token-for-testing';
    }

    const response = await fetch(`${API_BASE_URL}/api/video/download/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download video');
    }

    return response.blob();
  },

  /**
   * Get all videos (mock - for backward compatibility)
   */
  getAllVideos: async (): Promise<Video[]> => {
    return mockApiCall(mockVideos);
  },

  /**
   * Get videos for the current user (mock - for backward compatibility)
   */
  getVideos: async (): Promise<Video[]> => {
    return mockApiCall(mockVideos);
  },

  /**
   * Get video by ID with detailed information (mock - for backward compatibility)
   */
  getVideoById: async (id: string): Promise<VideoWithDetails | null> => {
    const video = mockVideos.find(v => v.id === id);
    
    if (!video) {
      return mockApiCall(null);
    }
    
    const script = mockScripts.find(s => s.id === video.scriptId) || mockScripts[0];
    const voice = mockVoices.find(v => v.id === video.voiceId) || mockVoices[0];
    const background = mockBackgrounds.find(b => b.id === video.backgroundId) || mockBackgrounds[0];
    
    const relatedTopics = trendingTopics.filter(topic => 
      video.topics.includes(topic.id)
    );
    
    const videoWithDetails: VideoWithDetails = {
      ...video,
      script,
      voice,
      background,
      relatedTopics
    };
    
    return mockApiCall(videoWithDetails);
  },

  /**
   * Create a video from provided parameters (mock - for backward compatibility)
   */
  createVideo: async (params: VideoCreationParams): Promise<Video> => {
    const newVideo: Video = {
      id: `video-${Date.now()}`,
      title: params.title,
      description: params.description,
      scriptId: params.scriptId,
      voiceId: params.voiceId,
      backgroundId: params.backgroundId,
      duration: 60, // Mock duration
      thumbnailUrl: '/assets/images/thumbnails/default-thumbnail.jpg',
      videoUrl: '',
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      topics: params.topics,
      tags: [],
      views: 0,
      url: ''
    };
    
    // Simulate video creation processing
    return mockApiCall(newVideo, 0.05, 1500);
  },

  /**
   * Apply edits to a video (mock - for backward compatibility)
   */
  editVideo: async (id: string, editParams: VideoEditParams): Promise<Video> => {
    const video = mockVideos.find(v => v.id === id);
    
    if (!video) {
      throw new Error(`Video not found with id: ${id}`);
    }
    
    const updatedVideo: Video = {
      ...video,
      status: 'processing',
      updatedAt: new Date().toISOString()
    };
    
    // Simulate video processing after edit
    return mockApiCall(updatedVideo, 0.05, 2000);
  },

  /**
   * Export a video (mock - for backward compatibility)
   */
  exportVideo: async (id: string): Promise<{url: string, downloadUrl: string}> => {
    const video = mockVideos.find(v => v.id === id);
    
    if (!video) {
      throw new Error(`Video not found with id: ${id}`);
    }
    
    // Update the video status
    video.status = 'completed';
    video.videoUrl = '/assets/videos/exported-video.mp4';
    
    // Simulate export processing
    await mockApiCall(null, 0.05, 5000);
    
    return {
      url: video.videoUrl,
      downloadUrl: '/download/exported-video.mp4'
    };
  },

  /**
   * Delete a video (mock - for backward compatibility)
   */
  deleteVideoMock: async (id: string): Promise<void> => {
    const videoIndex = mockVideos.findIndex(v => v.id === id);
    
    if (videoIndex === -1) {
      throw new Error(`Video not found with id: ${id}`);
    }
    
    mockVideos.splice(videoIndex, 1);
    
    return mockApiCall(undefined);
  }
};
