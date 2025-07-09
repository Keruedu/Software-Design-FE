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
      const optimized: any = {
        duration: timelineData.duration || 0,
        currentTime: timelineData.currentTime || 0,
        trimStart: timelineData.trimStart || 0,
        trimEnd: timelineData.trimEnd || 0,
        videoVolume: timelineData.videoVolume || 1
      };
      
      if (timelineData.tracks && Array.isArray(timelineData.tracks)) {
        optimized.tracks = timelineData.tracks.map((track: any) => ({
          id: track.id,
          type: track.type,
          volume: track.volume || 1,
          isMuted: track.isMuted || false,
          items: track.items?.map((item: any) => ({
            id: item.id,
            type: item.type,
            startTime: item.startTime || 0,
            duration: item.duration || 0,
            volume: item.volume || 1,
            isMainVideoUnit: item.isMainVideoUnit || false,
            // Dramatically reduce URL size - keep only filename or identifier
            url: item.url ? (item.url.length > 50 ? item.url.split('/').pop() || item.url.substring(0, 50) : item.url) : undefined,
            // Only include text data for text items
            ...(item.type === 'text' && {
              text: item.text,
              style: item.style ? {
                fontSize: item.style.fontSize,
                color: item.style.color,
                fontFamily: item.style.fontFamily
              } : undefined,
              position: item.position
            })
          })) || []
        }));
      }
      
      // Minimal text overlays
      if (timelineData.textOverlays && Array.isArray(timelineData.textOverlays)) {
        optimized.textOverlays = timelineData.textOverlays.map((overlay: any) => ({
          id: overlay.id,
          text: overlay.text,
          timing: overlay.timing,
          position: overlay.position,
          style: overlay.style ? {
            fontSize: overlay.style.fontSize,
            color: overlay.style.color,
            fontFamily: overlay.style.fontFamily
          } : undefined,
          isVisible: overlay.isVisible
        }));
      }
      
      // Remove any elements or other large data
      if (timelineData.elements) {
        optimized.elements = timelineData.elements.map((element: any) => {
          const optimizedElement = {
            id: element.id,
            type: element.type,
            startTime: element.startTime,
            duration: element.duration,
            volume: element.volume
          };
          
          return optimizedElement;
        });
      }
      
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
      
      // Fixed 1080p quality settings - always use high quality
      const qualitySettings = {
        bitrate: '1500k',
        resolution: '1920x1080',
        maxSize: 15 * 1024 * 1024, // 15MB for 1080p quality
        fallbackBitrate: '1200k',
        fallbackResolution: '1920x1080' // Keep 1080p even in fallback
      };
      
      // Check if video file is too large and compress if needed
      let finalVideoBlob = videoBlob;
      
      // Smart compression - only compress if video is large
      if (videoBlob.size > qualitySettings.maxSize) {
        console.log(`Video file is too large (${Math.round(videoBlob.size / 1024)}KB). Compressing...`);
        
        try {
          // Initialize FFmpeg if not already done
          await ffmpegService.initialize();
          
          // Apply 1080p compression
          finalVideoBlob = await ffmpegService.compressVideo(
            videoBlob,
            qualitySettings.bitrate,
            qualitySettings.resolution
          );
          
          console.log(`Video compressed (1080p): ${Math.round(videoBlob.size / 1024)}KB → ${Math.round(finalVideoBlob.size / 1024)}KB`);
          
          // Apply fallback compression if still too large
          if (finalVideoBlob.size > qualitySettings.maxSize) {
            console.log('Still too large, applying fallback compression...');
            finalVideoBlob = await ffmpegService.compressVideo(
              videoBlob,
              qualitySettings.fallbackBitrate,
              qualitySettings.fallbackResolution
            );
            console.log(`Fallback compression: ${Math.round(finalVideoBlob.size / 1024)}KB`);
          }
          
        } catch (compressionError) {
          console.warn('Video compression failed, using original video:', compressionError);
          // Continue with original video if compression fails
        }
      } else {
        console.log(`Video size (${Math.round(videoBlob.size / 1024)}KB) is acceptable for 1080p quality. No compression needed.`);
      }
      
      // Add video file
      const videoFile = new File([finalVideoBlob], `${exportData.title.replace(/[<>:"/\\|?*]/g, '_')}.mp4`, {
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
      // Always use high quality (1080p)
      formData.append('quality', 'high');
      
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
      
      // Check if data is too large (approaching upload limit)
      const totalSize = videoFile.size + processingStepsJson.length + timelineDataJson.length;
      const maxTotalSize = qualitySettings.maxSize + (2 * 1024 * 1024); // Add 2MB buffer for metadata
      
      if (totalSize > maxTotalSize) {
        console.warn(`Upload data is too large (${Math.round(totalSize / 1024)}KB) for 1080p quality. Attempting aggressive optimization...`);
        
        // Further optimize timeline data if needed
        const minimalTimelineData = {
          duration: optimizedTimelineData.duration || 0,
          currentTime: optimizedTimelineData.currentTime || 0,
          trimStart: optimizedTimelineData.trimStart || 0,
          trimEnd: optimizedTimelineData.trimEnd || 0,
          videoVolume: optimizedTimelineData.videoVolume || 1,
          // Only essential track info
          tracks: optimizedTimelineData.tracks?.map((track: any) => ({
            id: track.id,
            type: track.type,
            volume: track.volume || 1,
            isMuted: track.isMuted || false,
            items: track.items?.map((item: any) => ({
              id: item.id,
              type: item.type,
              startTime: item.startTime || 0,
              duration: item.duration || 0,
              volume: item.volume || 1,
              isMainVideoUnit: item.isMainVideoUnit || false
            })) || []
          })) || [],
          // Minimal text overlays
          textOverlays: optimizedTimelineData.textOverlays?.map((overlay: any) => ({
            id: overlay.id,
            text: overlay.text?.substring(0, 100) || '', // Limit text length
            timing: overlay.timing,
            isVisible: overlay.isVisible
            // Remove style and position to save space
          })) || []
        };
        
        // Minimal processing steps
        const minimalProcessingSteps = optimizedProcessingSteps.map((step: any) => ({
          type: step.type,
          timestamp: step.timestamp,
          // Keep only essential options
          options: step.options ? {
            startTime: step.options.startTime,
            duration: step.options.duration,
            volume: step.options.volume
          } : {}
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
      
      if (finalSize > 20 * 1024 * 1024) { // 20MB warning threshold
        console.warn('Final upload size is very large. Upload may take longer.');
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
          throw new Error('Video file quá lớn để upload. Vui lòng thử:\n1. Giảm độ dài video\n2. Xóa bớt audio tracks\n3. Giảm số lượng text overlays');
        }
        
        if (errorData.detail && errorData.detail.includes('multipart')) {
          throw new Error('Dữ liệu upload quá lớn. Hệ thống đang cố gắng tối ưu hóa để giữ chất lượng video tốt nhất.');
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
