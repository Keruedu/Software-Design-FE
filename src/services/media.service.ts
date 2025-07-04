import { Background } from '../mockdata/backgrounds';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export enum MediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  TEXT = 'text'
}

export interface UploadResponse {
  id: string;
  user_id: string;
  title: string;
  content: string;
  media_type: MediaType;
  url: string;
  public_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MediaUploadOptions {
  prompt: string;
  media_type: MediaType;
  onProgress?: (progress: number) => void;
}

export class MediaService {
  /**
   * Upload an audio file to the server
   */
  static async uploadAudio(
    file: File,
    options: Omit<MediaUploadOptions, 'media_type'>
  ): Promise<UploadResponse> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt', options.prompt);
    formData.append('media_type', MediaType.AUDIO);

    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload audio');
    }

    const result = await response.json();
    console.log('Upload audio response:', result); // Debug log
    return result;
  }
  static async uploadImage(
    file: File,
    options: Omit<MediaUploadOptions, 'media_type'>
  ): Promise<UploadResponse> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt', options.prompt);
    formData.append('media_type', MediaType.IMAGE);

    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload image');
    }

    const result = await response.json();
    console.log('Upload response:', result); // Debug log
    return result;
  }

  /**
   * Convert uploaded media to Background format for use in background selection
   */
  static uploadedMediaToBackground(media: UploadResponse): Background {
    // Extract filename from content or use title as fallback
    const displayTitle = media.content || media.title || 'User Uploaded Image';
    
    return {
      id: media.id,
      title: displayTitle,
      imageUrl: media.url,
      category: 'user-upload',
      tags: ['uploaded', 'custom'],
      premium: false,
    };
  }

  /**
   * Validate if file is a valid audio
   */
  static validateAudioFile(file: File): { isValid: boolean; error?: string } {
    // Check file type - include all possible MIME types for audio formats
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 
      'audio/m4a', 'audio/mp4', 'audio/x-m4a', 'audio/aac',
      'audio/webm', 'audio/flac'
    ];
    
    // Also check file extension as fallback
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm', '.flac'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      console.log('File type:', file.type, 'File name:', file.name); // Debug log
      return {
        isValid: false,
        error: 'Please select a valid audio file (MP3, WAV, OGG, M4A, AAC, WebM, FLAC)'
      };
    }

    // Check file size (max 50MB for audio)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Audio file size must be less than 50MB'
      };
    }

    return { isValid: true };
  }
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please select a valid image file (JPEG, PNG, or WebP)'
      };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image file size must be less than 10MB'
      };
    }

    return { isValid: true };
  }

  /**
   * Get media by ID
   */
  static async getMediaById(mediaId: string): Promise<UploadResponse> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_BASE_URL}/media/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get media');
    }

    return await response.json();
  }

  /**
   * Get user's uploaded media
   */
  static async getUserMedia(
    page: number = 1,
    limit: number = 20,
    mediaType?: MediaType
  ): Promise<{ items: UploadResponse[]; total: number; page: number; pages: number }> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    let url = `${API_BASE_URL}/media/user?page=${page}&limit=${limit}`;
    if (mediaType) {
      url += `&media_type=${mediaType}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get user media');
    }

    return await response.json();
  }
}
