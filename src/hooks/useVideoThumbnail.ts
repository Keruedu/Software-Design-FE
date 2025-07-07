import { useState, useEffect } from 'react';
import { VideoService } from '../services/video.service';

interface UseVideoThumbnailOptions {
  /** Whether to automatically generate thumbnail on mount */
  autoGenerate?: boolean;
  /** Default placeholder image while loading */
  placeholder?: string;
}

interface UseVideoThumbnailReturn {
  /** The thumbnail URL (generated or provided) */
  thumbnailUrl: string;
  /** Whether thumbnail is being generated */
  isGenerating: boolean;
  /** Error if thumbnail generation failed */
  error: string | null;
  /** Manually trigger thumbnail generation */
  generateThumbnail: () => Promise<void>;
}

/**
 * React hook for managing video thumbnails with automatic generation
 */
export const useVideoThumbnail = (
  videoUrl: string | undefined,
  existingThumbnail?: string,
  options: UseVideoThumbnailOptions = {}
): UseVideoThumbnailReturn => {
  const {
    autoGenerate = true,
    placeholder = '/assets/images/thumbnails/default-video-thumbnail.svg'
  } = options;

  const [thumbnailUrl, setThumbnailUrl] = useState<string>(existingThumbnail || placeholder);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateThumbnail = async () => {
    if (!videoUrl) {
      setError('No video URL provided');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedThumbnail = await VideoService.generateThumbnail(videoUrl);
      setThumbnailUrl(generatedThumbnail);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate thumbnail';
      setError(errorMessage);
      setThumbnailUrl(placeholder);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // If we have an existing thumbnail, use it
    if (existingThumbnail && existingThumbnail !== '') {
      setThumbnailUrl(existingThumbnail);
      return;
    }

    // Auto-generate thumbnail if enabled and we have a video URL
    if (autoGenerate && videoUrl && !existingThumbnail) {
      generateThumbnail();
    }
  }, [videoUrl, existingThumbnail, autoGenerate]);

  return {
    thumbnailUrl,
    isGenerating,
    error,
    generateThumbnail
  };
};

/**
 * Simple hook for getting thumbnail with loading state
 */
export const useVideoThumbnailSimple = (videoUrl: string | undefined, existingThumbnail?: string) => {
  const { thumbnailUrl, isGenerating } = useVideoThumbnail(videoUrl, existingThumbnail, {
    autoGenerate: true
  });

  return { thumbnailUrl, isLoading: isGenerating };
};
