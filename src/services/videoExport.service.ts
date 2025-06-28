import { getAuthToken, isAuthenticated, redirectToLogin } from '@/utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface VideoExportData {
  originalVideoId?: string;
  title: string;
  description?: string;
  processingSteps: any[];
  timelineData: any;
}

export interface VideoExportResponse {
  success: boolean;
  video_id: string;
  video_url: string;
  public_id: string;
  original_video_updated: boolean;
  processing_summary: {
    steps_applied: number;
    audio_tracks: number;
    trim_applied: boolean;
  };
  message: string;
}

export interface EditSessionData {
  videoId: string;
  timelineData: any;
}

export interface EditedVersionsResponse {
  success: boolean;
  edited_versions: any[];
  count: number;
}

export interface EditSessionResponse {
  success: boolean;
  has_session: boolean;
  session_data?: any;
  video_id: string;
}

class VideoExportService {
  private getAuthHeaders() {
    if (!isAuthenticated()) {
      throw new Error('Bạn cần đăng nhập để sử dụng chức năng này. Vui lòng đăng nhập lại.');
    }
    
    const token = getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Upload edited video to server and update database
   */
  async uploadEditedVideo(
    videoBlob: Blob,
    exportData: VideoExportData
  ): Promise<VideoExportResponse> {
    try {
      // Validate authentication first
      try {
        this.getAuthHeaders();
      } catch (authError) {
        throw new Error(`Authentication required: ${authError instanceof Error ? authError.message : authError}`);
      }

      const formData = new FormData();
      
      // Add video file
      const videoFile = new File([videoBlob], `${exportData.title.replace(/[^a-z0-9]/gi, '_')}_edited.mp4`, {
        type: 'video/mp4'
      });
      formData.append('video_file', videoFile);
      
      // Add form data
      formData.append('title', exportData.title);
      if (exportData.description) {
        formData.append('description', exportData.description);
      }
      if (exportData.originalVideoId) {
        formData.append('original_video_id', exportData.originalVideoId);
      }
      formData.append('processing_steps', JSON.stringify(exportData.processingSteps));
      formData.append('timeline_data', JSON.stringify(exportData.timelineData));

      const response = await fetch(`${API_BASE_URL}/api/video/upload-edited`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your login session has expired. Please log in again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading edited video:', error);
      if (error instanceof Error && error.message.includes('Authentication')) {
        // Redirect to login if authentication fails
        redirectToLogin('Your login session has expired. Please log in again.');
      }
      throw error;
    }
  }

  /**
   * Save current editing session
   */
  async saveEditSession(sessionData: EditSessionData): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData();
      formData.append('video_id', sessionData.videoId);
      formData.append('timeline_data', JSON.stringify(sessionData.timelineData));

      const response = await fetch(`${API_BASE_URL}/api/video/save-edit-session`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving edit session:', error);
      throw error;
    }
  }

  /**
   * Get all edited versions of a video
   */
  async getEditedVersions(originalVideoId: string): Promise<EditedVersionsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/video/edited-versions/${originalVideoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting edited versions:', error);
      throw error;
    }
  }

  /**
   * Get saved editing session
   */
  async getEditSession(videoId: string): Promise<EditSessionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/video/edit-session/${videoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting edit session:', error);
      throw error;
    }
  }

  /**
   * Auto-save editing session periodically
   */
  async autoSaveEditSession(videoId: string, timelineData: any): Promise<void> {
    try {
      await this.saveEditSession({
        videoId,
        timelineData
      });
      console.log('Auto-saved editing session');
    } catch (error) {
      console.warn('Auto-save failed:', error);
      // Don't throw error for auto-save failures
    }
  }
}

export const videoExportService = new VideoExportService();
