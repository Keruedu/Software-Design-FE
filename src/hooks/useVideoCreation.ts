import { useContext } from 'react';
import { VideoCreationContext, VideoCreationContextType } from '../context/VideoCreationContext';

export function useVideoCreation(): VideoCreationContextType {
  const context = useContext(VideoCreationContext);
  
  if (!context) {
    throw new Error('useVideoCreation must be used within a VideoCreationProvider');
  }
  
  return context;
}
