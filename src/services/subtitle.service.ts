import { SubtitleSegment, SubtitleStyle, SubtitleOptions, SubtitleGenerationResult } from '../types/subtitle';
import { mockApiCall } from '../mockdata';

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SubtitleGenerationParams {
  audioFile?: File;
  scriptText?: string;
  language?: string;
  maxWordsPerSegment?: number;
}

/**
 * Service for subtitle management and generation
 */
export const SubtitleService = {
  /**
   * Get available subtitle styles and supported languages
   */
  getSubtitleOptions: async (): Promise<{ styles: SubtitleStyle[], languages: string[] }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/subtitles/styles`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        styles: data.styles,
        languages: data.languages
      };
      
    } catch (error) {
      console.error('Error fetching subtitle options from API:', error);
      
      // Fallback to hardcoded options
      return {
        styles: [
          { name: 'default', fontFamily: 'Arial', fontSize: 16, fontColor: '#FFFFFF', backgroundColor: '#000000', backgroundOpacity: 0.7, position: 'bottom', outline: true, outlineColor: '#000000' },
          { name: 'modern', fontFamily: 'Helvetica', fontSize: 18, fontColor: '#FFFFFF', backgroundColor: '#1F2937', backgroundOpacity: 0.8, position: 'bottom', outline: true, outlineColor: '#374151' }
        ],
        languages: ['en', 'vi', 'es', 'fr']
      };
    }
  },

  /**
   * Generate subtitles from audio file
   */
  generateSubtitlesFromAudio: async (params: SubtitleGenerationParams): Promise<SubtitleGenerationResult> => {
    if (!params.audioFile) {
      throw new Error('Audio file is required');
    }

    try {
      const formData = new FormData();
      formData.append('audio_file', params.audioFile);
      formData.append('language', params.language || 'en');
      formData.append('max_words_per_segment', String(params.maxWordsPerSegment || 5));
      
      const response = await fetch(`${API_BASE_URL}/subtitles/generate`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        segments: data.segments.map((seg: any) => ({
          id: seg.id,
          startTime: seg.start_time,
          endTime: seg.end_time,
          text: seg.text
        })),
        language: data.language,
        totalDuration: data.total_duration,
        srtUrl: data.srt_url,
        source: 'audio'
      };
      
    } catch (error) {
      console.error('Error generating subtitles from audio:', error);
      
      // Fallback to mock generation
      const mockResult: SubtitleGenerationResult = {
        id: `audio_sub_${Date.now()}`,
        segments: [
          { id: 1, startTime: 0, endTime: 3, text: 'Welcome to our amazing video' },
          { id: 2, startTime: 3, endTime: 6, text: 'This is generated from audio' },
          { id: 3, startTime: 6, endTime: 9, text: 'Enjoy watching our content' }
        ],
        language: params.language || 'en',
        totalDuration: 9,
        source: 'audio'
      };
      
      return mockApiCall(mockResult, 0.05, 3000);
    }
  },

  /**
   * Generate subtitles from script text (faster, no audio processing)
   */
  generateSubtitlesFromScript: async (params: SubtitleGenerationParams): Promise<SubtitleGenerationResult> => {
    if (!params.scriptText) {
      throw new Error('Script text is required');
    }

    try {
      const formData = new FormData();
      formData.append('script_text', params.scriptText);
      formData.append('language', params.language || 'en');
      formData.append('max_words_per_segment', String(params.maxWordsPerSegment || 5));
      formData.append('estimated_duration', String(30.0)); // Default 30 seconds
      
      const response = await fetch(`${API_BASE_URL}/subtitles/generate-from-script`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        segments: data.segments.map((seg: any) => ({
          id: seg.id,
          startTime: seg.start_time,
          endTime: seg.end_time,
          text: seg.text
        })),
        language: data.language,
        totalDuration: data.total_duration,
        srtUrl: data.srt_url,
        source: 'script'
      };
      
    } catch (error) {
      console.error('Error generating subtitles from script:', error);
      
      // Fallback to simple text splitting
      const words = params.scriptText.split(' ');
      const segments: SubtitleSegment[] = [];
      const maxWords = params.maxWordsPerSegment || 5;
      
      for (let i = 0; i < words.length; i += maxWords) {
        const segmentWords = words.slice(i, i + maxWords);
        const text = segmentWords.join(' ');
        const startTime = i * 0.5; // 0.5 seconds per word
        const endTime = startTime + segmentWords.length * 0.5;
        
        segments.push({
          id: segments.length + 1,
          startTime,
          endTime,
          text
        });
      }
      
      const mockResult: SubtitleGenerationResult = {
        id: `script_sub_${Date.now()}`,
        segments,
        language: params.language || 'en',
        totalDuration: segments.length > 0 ? segments[segments.length - 1].endTime : 0,
        source: 'script'
      };
      
      return mockApiCall(mockResult, 0.05, 1000);
    }
  },

  /**
   * Update subtitle segments
   */
  updateSubtitleSegments: async (subtitleId: string, segments: SubtitleSegment[]): Promise<SubtitleGenerationResult> => {
    try {
      const requestBody = {
        subtitle_id: subtitleId,
        segments: segments.map(seg => ({
          id: seg.id,
          start_time: seg.startTime,
          end_time: seg.endTime,
          text: seg.text
        }))
      };
      
      const response = await fetch(`${API_BASE_URL}/subtitles/${subtitleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        segments: data.segments.map((seg: any) => ({
          id: seg.id,
          startTime: seg.start_time,
          endTime: seg.end_time,
          text: seg.text
        })),
        language: data.language,
        totalDuration: data.total_duration,
        srtUrl: data.srt_url,
        source: 'script'
      };
      
    } catch (error) {
      console.error('Error updating subtitle segments:', error);
      throw error;
    }
  },

  /**
   * Get subtitle preview with selected style
   */
  getSubtitlePreview: async (subtitleId: string, styleName: string = 'default'): Promise<{ previewHtml: string, style: SubtitleStyle, sampleSegments: SubtitleSegment[] }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/subtitles/${subtitleId}/preview?style_name=${styleName}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        previewHtml: data.preview_html,
        style: data.style,
        sampleSegments: data.sample_segments.map((seg: any) => ({
          id: seg.id,
          startTime: seg.start_time,
          endTime: seg.end_time,
          text: seg.text
        }))
      };
      
    } catch (error) {
      console.error('Error getting subtitle preview:', error);
      
      // Fallback preview
      return {
        previewHtml: '<div style="background: rgba(0,0,0,0.7); color: white; padding: 8px; text-align: center;">Sample subtitle text</div>',
        style: { name: styleName, fontFamily: 'Arial', fontSize: 16, fontColor: '#FFFFFF', backgroundColor: '#000000', backgroundOpacity: 0.7, position: 'bottom', outline: true, outlineColor: '#000000' },
        sampleSegments: []
      };
    }
  },

  /**
   * Download SRT file
   */
  downloadSrtFile: async (subtitleId: string): Promise<Blob> => {
    try {
      const response = await fetch(`${API_BASE_URL}/subtitles/${subtitleId}/download`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      return await response.blob();
      
    } catch (error) {
      console.error('Error downloading SRT file:', error);
      throw error;
    }
  },

  /**
   * Delete subtitle files
   */
  deleteSubtitles: async (subtitleId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/subtitles/${subtitleId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('Error deleting subtitles:', error);
      throw error;
    }
  },

  /**
   * Apply subtitles to video file
   */
  applySubtitlesToVideo: async (videoFile: File, subtitleId: string, styleName: string = 'default'): Promise<Blob> => {
    try {
      const formData = new FormData();
      formData.append('video_file', videoFile);
      formData.append('subtitle_id', subtitleId);
      formData.append('style_name', styleName);
      
      const response = await fetch(`${API_BASE_URL}/subtitles/apply`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      return await response.blob();
      
    } catch (error) {
      console.error('Error applying subtitles to video:', error);
      throw error;
    }
  }
};
