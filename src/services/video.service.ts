import { Video, VideoWithDetails } from '../mockdata/videos';
import { VideoStats } from '../types/video';
import { mockApiCall, mockBackgrounds, mockScripts, mockVideos, mockVoices, trendingTopics } from '../mockdata';
import { SubtitleStyle } from '../types/subtitle';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Request cache for deduplication
const requestCache = new Map<string, Promise<any>>();

// Thumbnail cache to avoid regenerating
const thumbnailCache = new Map<string, string>();

/**
 * Generate thumbnail from video URL using canvas
 */
const generateThumbnailFromVideo = (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true; // Ensure video can play without user interaction
    
    video.onloadedmetadata = () => {
      // Set canvas size to match video aspect ratio
      canvas.width = 320; // Standard thumbnail width
      canvas.height = Math.round((video.videoHeight / video.videoWidth) * 320);
      
      // Seek to 10% of video duration for a good thumbnail frame
      video.currentTime = Math.min(video.duration * 0.1, 3); // Max 3 seconds to avoid long seeks
    };
    
    video.onseeked = () => {
      if (ctx) {
        try {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to data URL
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Cache the thumbnail
          thumbnailCache.set(videoUrl, thumbnailUrl);
          
          resolve(thumbnailUrl);
        } catch (error) {
          reject(new Error('Failed to draw video frame to canvas'));
        }
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video for thumbnail generation'));
    };
    
    // Set timeout to avoid hanging
    setTimeout(() => {
      reject(new Error('Thumbnail generation timeout'));
    }, 10000); // 10 second timeout
    
    video.src = videoUrl;
  });
};

/**
 * Get or generate thumbnail URL
 */
const getThumbnailUrl = async (videoData: any): Promise<string> => {
  // If thumbnail already exists, use it
  if (videoData.thumbnail_url && videoData.thumbnail_url !== '') {
    return videoData.thumbnail_url;
  }
  
  // Check cache first
  if (videoData.url && thumbnailCache.has(videoData.url)) {
    return thumbnailCache.get(videoData.url)!;
  }
  
  // If video URL exists, try to generate thumbnail
  if (videoData.url) {
    try {
      const generatedThumbnail = await generateThumbnailFromVideo(videoData.url);
      return generatedThumbnail;
    } catch (error) {
      console.warn('Failed to generate thumbnail from video:', error);
      // Fallback to default thumbnail
      return '/assets/images/thumbnails/default-video-thumbnail.svg';
    }
  }
  
  // Default fallback
  return '/assets/images/thumbnails/default-video-thumbnail.svg';
};

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
  voice_id?: string; // Optional for backward compatibility
  audio_url?: string; // Audio URL from upload or AI generation
  audio_source?: 'uploaded' | 'generated' | 'voice_generation'; // Track audio source
  uploaded_audio_id?: string; // ID of uploaded audio file
  background_image_id: string; // Legacy single background
  background_image_ids?: string[]; // New multi-background support
  subtitle_enabled?: boolean;
  subtitle_language?: string;
  subtitle_style?: string | SubtitleStyle; // Accept both string name and full style object
  voice_settings?: {
    speed?: number;
    pitch?: number;
  };
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
   * Generate thumbnail from video URL (exposed for external use)
   */
  generateThumbnail: async (videoUrl: string): Promise<string> => {
    try {
      return await generateThumbnailFromVideo(videoUrl);
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error);
      return '/assets/images/thumbnails/default-video-thumbnail.svg';
    }
  },

  /**
   * Get thumbnail URL with fallback generation
   */
  getThumbnail: async (videoData: any): Promise<string> => {
    return await getThumbnailUrl(videoData);
  },  
   getUserVideos: async (): Promise<Video[]> => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/media/?page=1&size=100&media_type=video`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch videos');
    const data = await response.json();
    
    // Process videos and generate thumbnails if needed
    const processedVideos = await Promise.all((data.media || []).map(async (v: any) => {
      const thumbnailUrl = await getThumbnailUrl(v);
      
      return {
        id: v.id,
        title: v.title || 'Untitled Video',
        description: v.content || v.description || '',
        scriptId: v.metadata?.script_id || '',
        voiceId: v.metadata?.voice_id || '',
        backgroundId: v.metadata?.background_image_id || '',
        duration: v.metadata?.duration || v.duration || 0,
        thumbnailUrl: thumbnailUrl,
        videoUrl: v.url,
        status: v.status || 'completed',
        createdAt: v.created_at,
        updatedAt: v.updated_at,
        topics: v.metadata?.topics || [],
        tags: v.tags || [],
        views: v.views || 0,
        url: v.url,
        voiceName: v.metadata?.voice_name || '',
        backgroundName: v.metadata?.background_name || ''
      };
    }));
    
    return processedVideos;
  }, 
  getListVideoSocial: async (platform:string,video_id:string): Promise<any> => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/social/social-video?platform=${platform}&video_id=${video_id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch videos');
    const data = await response.json();
    if (typeof data === 'object' && data !== null) {
    const list = data[platform==="google"?"youtube":platform];
    if (Array.isArray(list)) {
      return list;
    }
  }
  return [];
  }, 
   getStatVideoSocial: async (platform: string, video_id: string, page_id?: string): Promise<any> => {
  const token = localStorage.getItem('access_token');
  const params = new URLSearchParams({
    platform,
    video_id
  });

  if (page_id) {
    params.append('page_id', page_id);
  }
  const response = await fetch(`${API_BASE_URL}/social/video-stats?${params.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch videos');
  const data = await response.json();
  return data;
},

  getVideoById: async (id: string): Promise<VideoWithDetails | null> => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/media/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const v = await response.json();
    return {
      ...v,
      script: {
        id: v.metadata?.script_id || '',
        title: v.title,
        content: v.metadata?.script_content || '',
        topic: v.metadata?.topic || '',
        createdAt: v.created_at,
        updatedAt: v.updated_at
      },
      voice: {
        id: v.metadata?.voice_id || '',
        name: v.metadata?.voice_name || '',
        language: v.metadata?.voice_language || '',
        gender: v.metadata?.voice_gender || ''
      },
      background: {
        id: v.metadata?.background_image_id || '',
        title: v.metadata?.background_name || '',
        url: v.metadata?.background_url || '',
        category: v.metadata?.background_category || ''
      },
      relatedTopics: []
    };


    
  },
  
  
  
  /**
   * Create a complete video from script, voice, background, and subtitles
   */
  createCompleteVideo: async (params: CompleteVideoCreationParams): Promise<any> => {
    // Create cache key for deduplication
    const cacheKey = `create-video-${JSON.stringify(params)}`;
    
    // Check if this request is already in progress
    if (requestCache.has(cacheKey)) {
      console.log('⚡ Using cached video creation request');
      return requestCache.get(cacheKey);
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🎬 Creating new video...');
    const requestPromise = fetch(`${API_BASE_URL}/api/video/create-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(params)
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create video');
      }
      return response.json();
    }).finally(() => {
      // Remove from cache after completion
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, 5000); // 5 seconds
    });    // Cache the promise
    requestCache.set(cacheKey, requestPromise);
      return requestPromise;
  },

  /**
   * Create video from existing audio and background components
   */
  createVideoFromComponents: async (params: VideoFromComponentsParams): Promise<any> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
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
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
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
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
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
   * Get paginated videos for the current user
   */
  getUserVideosPaginated: async (page: number = 1, size: number = 20): Promise<{videos: Video[], total: number, page: number, size: number}> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_BASE_URL}/media/?page=${page}&size=${size}&media_type=video`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch videos');
    const data = await response.json();
    
    // Process videos
    const processedVideos = (data.media || []).map((v: any) => ({
      id: v.id,
      title: v.title || 'Untitled Video',
      description: v.content || v.description || '',
      scriptId: v.metadata?.script_id || '',
      voiceId: v.metadata?.voice_id || '',
      backgroundId: v.metadata?.background_image_id || '',
      duration: v.metadata?.duration || v.duration || 0,
      thumbnailUrl: v.thumbnail_url,
      videoUrl: v.url,
      status: v.status || 'completed',
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      topics: v.metadata?.topics || [],
      tags: v.tags || [],
      views: v.views || 0,
      url: v.url,
      voiceName: v.metadata?.voice_name || '',
      backgroundName: v.metadata?.background_name || ''
    }));
    
    return {
      videos: processedVideos,
      total: data.total || processedVideos.length,
      page: data.page || page,
      size: data.size || size
    };
  },

  /**
   * Get all videos of user with pagination (new endpoint)
   */
  getAllVideoOfUser: async (page: number = 1, size: number = 12): Promise<{videos: Video[], total: number, page: number, size: number, hasNext: boolean}> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log(`🎬 Fetching videos - Page: ${page}, Size: ${size}`);
    const response = await fetch(`${API_BASE_URL}/media/videos/all?page=${page}&size=${size}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch videos');
    const data = await response.json();
    
    console.log(`📊 API Response:`, {
      totalMedia: data.media?.length || 0,
      total: data.total,
      page: data.page,
      size: data.size,
      hasNext: data.has_next
    });
    
    // Process videos and generate thumbnails if needed
    const processedVideos = await Promise.all((data.media || []).map(async (v: any) => {
      const thumbnailUrl = await getThumbnailUrl(v);
      
      return {
        id: v.id,
        title: v.title || 'Untitled Video',
        description: v.content || v.description || '',
        scriptId: v.metadata?.script_id || '',
        voiceId: v.metadata?.voice_id || '',
        backgroundId: v.metadata?.background_image_id || '',
        duration: v.metadata?.duration || v.duration || 0,
        thumbnailUrl: thumbnailUrl,
        videoUrl: v.url,
        status: v.status || 'completed',
        createdAt: v.created_at,
        updatedAt: v.updated_at,
        topics: v.metadata?.topics || [],
        tags: v.tags || [],
        views: v.views || 0,
        url: v.url,
        voiceName: v.metadata?.voice_name || '',
        backgroundName: v.metadata?.background_name || ''
      };
    }));
    
    console.log(`=Processed videos: ${processedVideos.length}`);
    
    return {
      videos: processedVideos,
      total: data.total || 0,
      page: data.page || page,
      size: data.size || size,
      hasNext: data.has_next || false
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
  },
  
  deleteVideo: async (id: string): Promise<void> => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/media/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to delete video');
  },

  // Video statistics
  getVideoStats: async (year?: number, month?: number): Promise<VideoStats> => {
    const token = localStorage.getItem('access_token');
    
    // Build query parameters
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/media/video/stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get video statistics');
    }
    
    return response.json();
  },
};
