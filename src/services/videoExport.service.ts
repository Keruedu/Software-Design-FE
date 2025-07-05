import { getAuthToken, isAuthenticated, redirectToLogin } from '@/utils/auth';
import { ffmpegService } from './editVideo.service';

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
   * Estimate total FormData size
   */
  private estimateFormDataSize(formData: FormData): number {
    let totalSize = 0;
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        totalSize += value.size;
      } else if (typeof value === 'string') {
        totalSize += value.length;
      }
    }
    
    return totalSize;
  }

  /**
   * Optimize timeline data for upload by removing unnecessary fields
   */
  private optimizeTimelineData(timelineData: any): any {
    if (!timelineData) return timelineData;
    
    try {
      const optimized = { ...timelineData };
      
      // Remove preview/thumbnail data if exists
      if (optimized.elements) {
        optimized.elements = optimized.elements.map((element: any) => {
          const optimizedElement = { ...element };
          
          // Remove preview thumbnails, large binary data
          delete optimizedElement.preview;
          delete optimizedElement.thumbnail;
          delete optimizedElement.waveform;
          delete optimizedElement.tempBlob;
          
          return optimizedElement;
        });
      }
      
      // Remove any large binary data fields
      delete optimized.canvasData;
      delete optimized.previewData;
      
      return optimized;
    } catch (error) {
      console.warn('Error optimizing timeline data:', error);
      return timelineData;
    }
  }

  /**
   * Optimize processing steps for upload
   */
  private optimizeProcessingSteps(processingSteps: any[]): any[] {
    if (!processingSteps) return processingSteps;
    
    return processingSteps.map((step: any) => {
      const optimized = { ...step };
      
      // Remove any large binary data from options
      if (optimized.options) {
        const options = { ...optimized.options };
        delete options.preview;
        delete options.thumbnail;
        delete options.waveform;
        delete options.tempBlob;
        optimized.options = options;
      }
      
      return optimized;
    });
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
      
      // Check if video file is too large and compress if needed
      let finalVideoBlob = videoBlob;
      const maxVideoSize = 500 * 1024; // 500KB for video file
      
      if (videoBlob.size > maxVideoSize) {
        console.log(`Video file is too large (${Math.round(videoBlob.size / 1024)}KB). Compressing...`);
        
        try {
          // Initialize FFmpeg if not already done
          await ffmpegService.initialize();
          
          // Compress video with reduced quality
          finalVideoBlob = await ffmpegService.compressVideo(
            videoBlob,
            '300k', // Lower bitrate
            '640x360' // Lower resolution
          );
          
          console.log(`Video compressed: ${Math.round(videoBlob.size / 1024)}KB → ${Math.round(finalVideoBlob.size / 1024)}KB`);
          
          // If still too large, try more aggressive compression
          if (finalVideoBlob.size > maxVideoSize) {
            console.log('Still too large, applying more aggressive compression...');
            finalVideoBlob = await ffmpegService.compressVideo(
              videoBlob,
              '200k', // Very low bitrate
              '480x270' // Even lower resolution
            );
            console.log(`Second compression: ${Math.round(finalVideoBlob.size / 1024)}KB`);
          }
          
        } catch (compressionError) {
          console.warn('Video compression failed, using original video:', compressionError);
          // Continue with original video if compression fails
        }
      }
      
      // Add video file
      const videoFile = new File([finalVideoBlob], `${exportData.title.replace(/[^a-z0-9]/gi, '_')}_edited.mp4`, {
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
      
      // Optimize data before sending
      const optimizedProcessingSteps = this.optimizeProcessingSteps(exportData.processingSteps);
      const optimizedTimelineData = this.optimizeTimelineData(exportData.timelineData);
      
      const processingStepsJson = JSON.stringify(optimizedProcessingSteps);
      const timelineDataJson = JSON.stringify(optimizedTimelineData);
      
      // Log data sizes for debugging
      console.log('Upload data sizes:');
      console.log('- Video file:', Math.round(videoFile.size / 1024), 'KB');
      console.log('- Processing steps:', Math.round(processingStepsJson.length / 1024), 'KB');
      console.log('- Timeline data:', Math.round(timelineDataJson.length / 1024), 'KB');
      console.log('- Total estimated:', Math.round((videoFile.size + processingStepsJson.length + timelineDataJson.length) / 1024), 'KB');
      
      // Check if data is too large (approaching 1024KB limit)
      const totalSize = videoFile.size + processingStepsJson.length + timelineDataJson.length;
      const maxTotalSize = 900 * 1024; // 900KB limit to be safe
      
      if (totalSize > maxTotalSize) {
        console.warn(`Upload data is too large (${Math.round(totalSize / 1024)}KB). Attempting further optimization...`);
        
        // Further optimize timeline data if needed
        const minimalTimelineData = {
          duration: optimizedTimelineData.duration || 0,
          elements: optimizedTimelineData.elements?.map((el: any) => ({
            id: el.id,
            type: el.type,
            startTime: el.startTime,
            duration: el.duration,
            src: el.src ? (el.src.length > 100 ? el.src.substring(0, 100) + '...' : el.src) : undefined,
            volume: el.volume,
            // Keep only essential properties
          })) || [],
          currentTime: optimizedTimelineData.currentTime || 0,
        };
        
        // Minimal processing steps
        const minimalProcessingSteps = optimizedProcessingSteps.map((step: any) => ({
          type: step.type,
          options: step.options ? {
            startTime: step.options.startTime,
            duration: step.options.duration,
            volume: step.options.volume,
            src: step.options.src ? (step.options.src.length > 100 ? step.options.src.substring(0, 100) + '...' : step.options.src) : undefined,
            // Keep only essential options
          } : {},
        }));
        
        const minimalTimelineJson = JSON.stringify(minimalTimelineData);
        const minimalProcessingJson = JSON.stringify(minimalProcessingSteps);
        
        console.log('Minimal data sizes:');
        console.log('- Processing steps (minimal):', Math.round(minimalProcessingJson.length / 1024), 'KB');
        console.log('- Timeline data (minimal):', Math.round(minimalTimelineJson.length / 1024), 'KB');
        console.log('- Total after optimization:', Math.round((videoFile.size + minimalProcessingJson.length + minimalTimelineJson.length) / 1024), 'KB');
        
        formData.append('processing_steps', minimalProcessingJson);
        formData.append('timeline_data', minimalTimelineJson);
      } else {
        formData.append('processing_steps', processingStepsJson);
        formData.append('timeline_data', timelineDataJson);
      }

      // Final size check
      const finalSize = this.estimateFormDataSize(formData);
      console.log(`Final upload size: ${Math.round(finalSize / 1024)}KB`);
      
      if (finalSize > 1000 * 1024) { // 1000KB warning
        console.warn('Final upload size is very close to 1024KB limit. Upload may fail.');
      }

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
        
        // Handle specific size limit errors
        if (errorData.detail && errorData.detail.includes('exceeded maximum size')) {
          throw new Error('Video file quá lớn để upload. Hệ thống đã cố gắng nén video nhưng vẫn vượt quá giới hạn 1024KB. Vui lòng thử:\n1. Giảm độ dài video\n2. Xóa bớt audio tracks\n3. Giảm chất lượng video');
        }
        
        if (errorData.detail && errorData.detail.includes('multipart')) {
          throw new Error('Dữ liệu upload quá lớn. Hệ thống đã cố gắng tối ưu hóa nhưng vẫn vượt quá giới hạn cho phép.');
        }
        
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
