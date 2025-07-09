import { useState, useEffect } from 'react';
import { VideoService } from '../services/video.service';

export const useVideoDuration = (videoUrl: string, initialDuration: number = 0) => {
  const [duration, setDuration] = useState(initialDuration);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ((!initialDuration || initialDuration === 0) && videoUrl) {
      setIsLoading(true);
      
      VideoService.getVideoDuration(videoUrl)
        .then((detectedDuration) => {
          setDuration(detectedDuration);
        })
        .catch((error) => {
          console.warn('Failed to load video duration:', error);
          setDuration(0);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [videoUrl, initialDuration]);

  // Format duration as mm:ss
  const formattedDuration = duration > 0 
    ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
    : '0:00';

  return {
    duration,
    formattedDuration,
    isLoading
  };
};
