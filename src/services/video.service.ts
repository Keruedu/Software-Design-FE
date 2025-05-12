import { Video, VideoWithDetails } from '../mockdata/videos';
import { mockApiCall, mockBackgrounds, mockScripts, mockVideos, mockVoices, trendingTopics } from '../mockdata';

export interface VideoCreationParams {
  title: string;
  description: string;
  scriptId: string;
  voiceId: string;
  backgroundId: string;
  topics: string[];
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
export const VideoService = {  /**
   * Get all videos
   */
  getAllVideos: async (): Promise<Video[]> => {
    return mockApiCall(mockVideos);
  },

  /**
   * Get videos for the current user (same as getAllVideos in mock)
   */
  getVideos: async (): Promise<Video[]> => {
    return mockApiCall(mockVideos);
  },
  
  /**
   * Delete a video by ID
   */
  deleteVideo: async (id: string): Promise<boolean> => {
    // In a real app, we would send a delete request to the server
    await mockApiCall(true, 500); // Simulate API delay
    return true;
  },

  /**
   * Get video by ID with detailed information
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
   * Create a new video
   */
  createVideo: async (params: VideoCreationParams): Promise<Video> => {
    const newVideo: Video = {
      id: `video_${Date.now()}`,
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
      topics: params.topics
    };
    
    // Simulate video creation processing
    return mockApiCall(newVideo, 0.05, 1500);
  },

  /**
   * Apply edits to a video
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
   * Export a video (simulate completion)
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
   * Delete a video
   */
  deleteVideo: async (id: string): Promise<void> => {
    const videoIndex = mockVideos.findIndex(v => v.id === id);
    
    if (videoIndex === -1) {
      throw new Error(`Video not found with id: ${id}`);
    }
    
    mockVideos.splice(videoIndex, 1);
    
    return mockApiCall(undefined);
  }
};
