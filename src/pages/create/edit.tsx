import { useRouter } from 'next/router'
import React, { useState, useRef, useEffect } from 'react'
import { GeneratedVideo } from '../../types/video'
import { TimelineItem } from '@/types/timeline'
import Sidebar from '@/components/features/VideoEditor/Sidebar'
import VideoPlayer from '@/components/features/VideoEditor/VideoPlayer'
import MultiTrackTimeline from '@/components/features/VideoEditor/MultiTrackTimeline'
import PropertiesPanel from '@/components/features/VideoEditor/PropertiesPanel'
import AudioProperties from '@/components/features/VideoEditor/AudioProperties'
import MediaLibrary from '@/components/features/VideoEditor/MediaLibrary'
import ExportProgressModal from '@/components/features/VideoEditor/ExportProgressModal'
import TextOverlayPanel from '@/components/features/VideoEditor/TextOverlayPanel'
import StickerPanel from '@/components/features/VideoEditor/StickerPanel'
import { AudioTrackData } from '@/types/audio'
import { FaRobot, FaVideo, FaMusic, FaCog, FaDownload, FaCut, FaUndo } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { videoProcessor } from '@/services/videoProcessor.service'
import { videoExportService } from '@/services/videoExport.service'
import { AudioTracksContextProvider, TrimVideoContextProvider, useTrimVideoContext, useAudioTracksContext } from '@/context/AudioTracks'
import { TimelineProvider, useTimelineContext } from '@/context/TimelineContext'
import { TextOverlayProvider, useTextOverlayContext } from '@/context/TextOverlayContext'
import { StickerProvider, useStickerContext } from '@/context/StickerContext'

const VideoEditor: React.FC = () => {
  // Move trim state to wrapper level to avoid context conflicts
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  // Move uploadedAudios state to wrapper level
  const [uploadedAudios, setUploadedAudios] = useState<AudioTrackData[]>([]);

  return (
    <TimelineProvider>
      <TextOverlayProvider>
        <StickerProvider>
          <AudioTracksContextProvider value={{audioTracks:uploadedAudios,setAudioTracks:setUploadedAudios}}>
            <TrimVideoContextProvider value={{trimStart, trimEnd, setTrimStart, setTrimEnd}}>
              <VideoEditorContent />
            </TrimVideoContextProvider>
          </AudioTracksContextProvider>
        </StickerProvider>
      </TextOverlayProvider>
    </TimelineProvider>
  )
}

const VideoEditorContent: React.FC = () => {
  const router = useRouter()
  const { addItemToTrack, timelineState, updateTrack, findOrCreateStickerTrack } = useTimelineContext()
  const { state: textOverlayState, getTextOverlayAtTime, restoreTextOverlays } = useTextOverlayContext()
  const { state: stickerState, getStickerOverlayAtTime, restoreStickerOverlays, setTimelineOperations } = useStickerContext()
  // Use trim context directly instead of props
  const { trimStart, trimEnd, setTrimStart, setTrimEnd } = useTrimVideoContext();

  // Setup timeline operations for sticker context
  useEffect(() => {
    setTimelineOperations({
      tracks: timelineState.tracks,
      addItemToTrack: addItemToTrack,
      findOrCreateStickerTrack: findOrCreateStickerTrack
    });
  }, [timelineState.tracks, addItemToTrack, findOrCreateStickerTrack, setTimelineOperations]);

  const [activeTab, setActiveTab] = useState<'text' | 'media' | 'effects' | 'stickers' | null>('media'); // Start with media tab
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);

  // Video processing state
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  // console.log('textOverlayState:', textOverlayState);
  const [videoSize, setVideoSize] = useState<{ width: number; height: number }>({ width: 1280, height: 720 }); 
  // Debug: Log trim context values whenever they change
  useEffect(() => {
    console.log('Trim context values changed:', {
      trimStart,
      trimEnd,
      videoDuration,
      source: 'useTrimVideoContext'
    });
  }, [trimStart, trimEnd, videoDuration]);
  const [videoVolume, setVideoVolume] = useState(1); // Track video player volume
  const [isMuted, setIsMuted] = useState(false); // Global mute state for all tracks
  
  // Debug logging when videoVolume changes
  useEffect(() => {
    console.log('Debug - VideoVolume state changed to:', videoVolume);
  }, [videoVolume]);

  // Custom volume change handler with debug
  const handleVolumeChange = (newVolume: number) => {
    console.log('Debug - Volume change requested:', newVolume);
    setVideoVolume(newVolume);
  };

  // Use uploaded audios from context
  const { audioTracks: uploadedAudios, setAudioTracks: setUploadedAudios } = useAudioTracksContext();
  // Global media items state
  const [globalMediaItems, setGlobalMediaItems] = useState<any[]>([]);
  // Track if main video has been added to timeline
  const [hasAddedMainVideo, setHasAddedMainVideo] = useState(false);
  // REMOVED: Timeline timer refs - không cần vì timeline chỉ trong video duration
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      // Cleanup audio elements
      Object.values(audioElementsRef.current).forEach(audio => {
        audio.pause();
      });
      audioElementsRef.current = {};
      
      // SIMPLIFIED: No hidden video elements to cleanup
      // Video is handled by ReactPlayer as a single unit
    };
  }, []);

  // Width của Properties Panel
  const propertiesPanelWidth = 400;

  useEffect(() => {
    const loadVideoFromGeneration = async () => {
      const { videoId, videoUrl: urlParam, title } = router.query
      if (urlParam && typeof urlParam === 'string') {
        setIsLoadingVideo(true)
        setHasAddedMainVideo(false) // Reset when loading new video
        try {
          const video: GeneratedVideo = {
            id: (videoId as string) || `gen-${Date.now()}`,
            url: urlParam,
            title: (title as string) || 'AI Generated Video',
            duration: 0,
            createdAt: new Date().toISOString(),
          }
          setGeneratedVideo(video)
          setVideoUrl(urlParam);

          // IMPROVED APPROACH: Treat video as a single unit from database
          // Instead of complex audio/video separation, use the video URL directly
          // This simplifies timeline handling and eliminates sync issues
          
          // Initialize video processor
          await videoProcessor.initialize(urlParam);
          
        } catch (error) {
          console.error('Error initializing video:', error);
        } finally {
          setIsLoadingVideo(false)
        }
      }
    }
    loadVideoFromGeneration()
  }, [router.query])

  // FIXED: Add main video as a locked unit to timeline
  useEffect(() => {
    if (videoUrl && videoDuration > 0 && generatedVideo && !hasAddedMainVideo) {
      // Add video item to track-1 automatically as a complete unit
      const trackId = 'track-1';
      addItemToTrack(trackId, {
        type: 'video',
        name: generatedVideo.title,
        startTime: 0, // Luôn bắt đầu từ 0
        duration: videoDuration,
        url: videoUrl,
        thumbnail: videoUrl,
        opacity: 1,
        volume: 1,
        // Mark this as the main video unit - contains both video and embedded audio
        isMainVideoUnit: true,
        isLocked: true, // Khóa không cho di chuyển
        maxDuration: videoDuration // Duration tối đa
      });

      // Add to global media items with special flag for main video
      const mainVideoMediaItem = {
        id: `main-video-${Date.now()}`,
        name: generatedVideo.title,
        type: 'video' as const,
        url: videoUrl,
        thumbnail: videoUrl,
        duration: videoDuration,
        size: 0,
        isMainVideo: true, 
        hasEmbeddedAudio: true,
        isVideoBlock: true
      };
      setGlobalMediaItems(prev => [...prev, mainVideoMediaItem]);
      setHasAddedMainVideo(true);

      showNotification(`Video "${generatedVideo.title}" has been added`, 'success');
    }
  }, [videoUrl, videoDuration, generatedVideo, addItemToTrack, hasAddedMainVideo]);

  // Initialize trim end when video duration changes
  useEffect(() => {
    if (videoDuration > 0) {
      setTrimEnd(videoDuration);
    }
  }, [videoDuration]);

  // Initialize trim end when video duration is loaded
  useEffect(() => {
    if (videoDuration > 0 && trimEnd === 0) {
      setTrimEnd(videoDuration);
    }
  }, [videoDuration, trimEnd, setTrimEnd]);

  useEffect(() => {
    if (activeTab === 'media' ||activeTab) {
      setIsPropertiesPanelOpen(true);
    } else {
      setIsPropertiesPanelOpen(false);
    }
  }, [activeTab]);

  // Auto open media panel when no video is loaded
  useEffect(() => {
    if (!videoUrl && !isLoadingVideo) {
      setActiveTab('text');
      setIsPropertiesPanelOpen(true);
    }
  }, [videoUrl, isLoadingVideo]);

  // Update timeline audio volume when video volume changes
  useEffect(() => {
    console.log('Debug - Video volume changed to:', videoVolume);
    updateTimelineAudioVolume(videoVolume);
  }, [videoVolume]);

  // Force update volume when timeline state changes (when items are added/removed)
  useEffect(() => {
    updateTimelineAudioVolume(videoVolume);
  }, [timelineState.tracks, videoVolume]);

  // Update volume when track mute states change
  useEffect(() => {
    const trackMuteStates = timelineState.tracks.map(track => ({ id: track.id, isMuted: track.isMuted }));
    console.log('Debug - Track mute states changed:', trackMuteStates);
    updateTimelineAudioVolume(videoVolume);
    
    // Also check if main video track mute state changed for VideoPlayer
    const mainVideoMuted = isMainVideoTrackMuted();
    console.log('Debug - Main video track muted:', mainVideoMuted);
  }, [timelineState.tracks.map(track => track.isMuted).join(','), videoVolume]);

  // Toggle mute for specific track
  const handleToggleTrackMute = (trackId: string) => {
    const track = timelineState.tracks.find(t => t.id === trackId);
    if (track) {
      const newMutedState = !track.isMuted;
      updateTrack(trackId, { isMuted: newMutedState });
      
      // Update volume for audio elements in this track immediately
      updateTimelineAudioVolume(videoVolume);
      
      // Force immediate audio pause/play for muted tracks
      if (newMutedState) {
        // Mute: pause all audio/video elements in this track immediately
        Object.keys(audioElementsRef.current).forEach(itemId => {
          const item = timelineState.tracks
            .flatMap(t => t.items)
            .find(item => (item.id || '') === itemId);
          
          if (item && !item.isMainVideoUnit) { // Only handle pure audio items
            const itemTrack = timelineState.tracks.find(t => 
              t.items.some(trackItem => trackItem.id === item.id)
            );
            if (itemTrack && itemTrack.id === trackId) {
              const audio = audioElementsRef.current[itemId];
              if (audio && !audio.paused) {
                fadeAudioVolume(audio, 0, 100);
                setTimeout(() => audio.pause(), 100);
              }
            }
          }
        });
      }
      
      console.log('Debug - Track', trackId, 'mute toggled to:', newMutedState);
      showNotification(
        `Track "${track.name}" has been ${newMutedState ? 'muted' : 'unmuted'}`, 
        newMutedState ? 'warning' : 'success'
      );
    }
  };

  // Toggle global mute for all tracks
  const handleToggleGlobalMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Update volume for all audio elements immediately
    updateTimelineAudioVolume(videoVolume);
    
    console.log('Debug - Global mute toggled to:', newMutedState);
    showNotification(
      `All tracks have been ${newMutedState ? 'muted' : 'unmuted'}`, 
      newMutedState ? 'warning' : 'success'
    );
  };

  // Helper function to check if main video track is muted
  const isMainVideoTrackMuted = (): boolean => {
    // Find track-1 which typically contains the main video
    const mainTrack = timelineState.tracks.find(track => track.id === 'track-1');
    if (mainTrack && mainTrack.isMuted) {
      return true;
    }
    
    // Also check if any track containing the main video is muted
    const videoItems = timelineState.tracks.flatMap(track => 
      track.items.filter(item => item.type === 'video' && item.url === videoUrl)
    );
    
    for (const item of videoItems) {
      const track = timelineState.tracks.find(t => 
        t.items.some(trackItem => trackItem.id === item.id)
      );
      if (track && track.isMuted) {
        return true;
      }
    }
    
    return false;
  };

  const handleBackToGenerate = () => {
      videoProcessor.cleanup();
      router.push('/create');
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgress = (progress: { playedSeconds: number }) => {
    const newTime = progress.playedSeconds;
    
    console.log('Debug - Current time:', newTime, 'Video duration:', videoDuration);
    
    // Kiểm tra nếu đạt cuối video
    if (isPlaying && newTime >= videoDuration - 0.1) {
      console.log('Debug - Reached end of video, pausing...');
      setCurrentTime(videoDuration);
      setIsPlaying(false);
      return;
    }
    
    setCurrentTime(newTime);
  };

  const handleDuration = (duration: number) => {
    setVideoDuration(duration);
    if (generatedVideo) {
      setGeneratedVideo(prev => prev ? { ...prev, duration } : null);
    }
  };

  // Helper functions for timeline content detection
  const hasContentAtTime = (time: number): boolean => {
    return timelineState.tracks.some(track => 
      track.items.some(item => 
        time >= item.startTime && time <= (item.startTime + item.duration)
      )
    );
  };

  const getAudioItemsAtTime = (time: number) => {
    return timelineState.tracks.flatMap(track => 
      track.items.filter(item => 
        item.type === 'audio' && 
        !item.isMainVideoUnit && 
        item.url && 
        time >= item.startTime && 
        time <= (item.startTime + item.duration)
      )
    );
  };

  const preloadTimelineAudio = (targetTime: number) => {
    const audioItems = getAudioItemsAtTime(targetTime);
    console.log('Debug - Preloading timeline audio for time:', targetTime, 'items:', audioItems.length);
    
    audioItems.forEach(item => {
      const itemId = item.id || '';
      
      // Only handle pure audio items (not embedded in video)
      if (item.type === 'audio' && item.url && !item.isMainVideoUnit) {
        if (!audioElementsRef.current[itemId]) {
          const audio = new Audio(item.url);
          const finalVolume = (item.volume || 1) * videoVolume;
          audio.volume = 0; // Start with 0 volume for smooth fade in
          audioElementsRef.current[itemId] = audio;
          
          // Seek to the exact position we'll need
          const itemTime = targetTime - item.startTime;
          audio.currentTime = itemTime;
          console.log('Debug - Preloaded audio at time:', itemTime, 'target volume:', finalVolume);
        }
      }
    });
  };

  const playTimelineAudio = (currentTime: number) => {
    const audioItems = getAudioItemsAtTime(currentTime);
    
    audioItems.forEach(item => {
      const itemId = item.id || '';
      
      // Find the track for this item to check mute state
      const track = timelineState.tracks.find(t => 
        t.items.some(trackItem => (trackItem.id || '') === itemId)
      );
      
      if (!track) return;
      
      const isTrackMuted = track.isMuted || false;
      const trackVolume = track.volume || 1;
      
      if (item.type === 'audio' && !item.isMainVideoUnit) {
        // Handle pure audio items (not embedded in video)
        if (item.url && !audioElementsRef.current[itemId]) {
          const audio = new Audio(item.url);
          const finalVolume = (isMuted || isTrackMuted) ? 0 : (item.volume || 1) * trackVolume * videoVolume;
          audio.volume = finalVolume;
          audioElementsRef.current[itemId] = audio;
          console.log('Debug - Created audio element with volume:', finalVolume, 
            'item volume:', item.volume, 'track volume:', trackVolume, 'video volume:', videoVolume, 
            'global muted:', isMuted, 'track muted:', isTrackMuted);
        }
        
        const audio = audioElementsRef.current[itemId];
        if (audio) {
          const finalVolume = (isMuted || isTrackMuted) ? 0 : (item.volume || 1) * trackVolume * videoVolume;
          audio.volume = finalVolume;
          
          const itemTime = currentTime - item.startTime;
          if (Math.abs(audio.currentTime - itemTime) > 0.1) {
            audio.currentTime = itemTime;
          }
          
          if (audio.paused && !isMuted && !isTrackMuted) {
            audio.play().then(() => {
              if (finalVolume > 0) {
                fadeAudioVolume(audio, finalVolume, 150);
              }
            }).catch(console.error);
          } else if (!audio.paused && (isMuted || isTrackMuted)) {
            // Pause if muted
            fadeAudioVolume(audio, 0, 100);
            setTimeout(() => audio.pause(), 100);
          } else if (!audio.paused) {
            // Gradually adjust volume if already playing
            if (Math.abs(audio.volume - finalVolume) > 0.05) {
              fadeAudioVolume(audio, finalVolume, 100);
            }
          }
        }
      }
    });
    // Stop audio items that shouldn't be playing
    Object.keys(audioElementsRef.current).forEach(itemId => {
      const isCurrentlyPlaying = audioItems.some(item => (item.id || '') === itemId && item.type === 'audio' && !item.isMainVideoUnit);
      if (!isCurrentlyPlaying) {
        const audio = audioElementsRef.current[itemId];
        if (audio && !audio.paused) {
          // Fade out before pausing
          fadeAudioVolume(audio, 0, 100);
          setTimeout(() => {
            if (!audio.paused) {
              audio.pause();
            }
          }, 100);
        }
      }
    });
  };

  const stopTimelineAudio = () => {
    Object.values(audioElementsRef.current).forEach(audio => {
      if (!audio.paused) {
        audio.pause();
      }
    });
  };

  const updateTimelineAudioVolume = (newVolume: number) => {
    console.log('Debug - Updating timeline audio volume to:', newVolume, 'global muted:', isMuted);
    
    // Update audio elements volume (pure audio tracks only)
    Object.keys(audioElementsRef.current).forEach(itemId => {
      const audio = audioElementsRef.current[itemId];
      // Find the corresponding item and track to get volume/mute settings
      let item: any = null;
      let track: any = null;
      
      for (const t of timelineState.tracks) {
        const foundItem = t.items.find(item => (item.id || '') === itemId);
        if (foundItem) {
          item = foundItem;
          track = t;
          break;
        }
      }
      
      if (item && track && !item.isMainVideoUnit) {
        const itemVolume = item.volume || 1;
        const trackVolume = track.volume || 1;
        const isTrackMuted = track.isMuted || false;
        const finalVolume = (isMuted || isTrackMuted) ? 0 : itemVolume * trackVolume * newVolume;
        
        audio.volume = finalVolume;
        console.log('Debug - Updated audio element', itemId, 'volume to:', finalVolume, 
          '(item:', itemVolume, '* track:', trackVolume, '* video:', newVolume, 
          'globalMuted:', isMuted, 'trackMuted:', isTrackMuted, ')');
      }
    });
  };

  // Smooth audio fade for transitions
  const fadeAudioVolume = (element: HTMLAudioElement | HTMLVideoElement, targetVolume: number, duration: number = 200) => {
    // If globally muted, always fade to 0
    const finalTargetVolume = isMuted ? 0 : targetVolume;
    
    const startVolume = element.volume;
    const startTime = performance.now();
    
    const updateVolume = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use ease-out curve for smoother transition
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentVolume = startVolume + (finalTargetVolume - startVolume) * easedProgress;
      
      element.volume = currentVolume;
      
      if (progress < 1) {
        requestAnimationFrame(updateVolume);
      }
    };
    
    requestAnimationFrame(updateVolume);
  };

  const findLastContentEndTime = (): number => {
    return videoDuration;
  };

  const findFirstContentTime = (): number => {
    const allItems = timelineState.tracks.flatMap(track => track.items);
    if (allItems.length === 0) return 0;
    
    const firstItem = allItems.reduce((earliest, item) => 
      item.startTime < earliest.startTime ? item : earliest
    );
    
    return firstItem.startTime;
  };

  // Video control handlers
  const handlePlay = () => {
    // Check if current time is outside trim boundaries
    if (trimEnd > 0 && (currentTime < trimStart || currentTime >= trimEnd)) {
      console.log('Debug - Current time outside trim, seeking to trim start');
      handleSeek(trimStart);
      setTimeout(() => setIsPlaying(true), 100);
      return;
    }
    
    if (trimEnd > 0 && currentTime >= trimEnd - 0.05) {
      console.log('Debug - At end of trim, seeking to trim start');
      handleSeek(trimStart);
      setTimeout(() => setIsPlaying(true), 100);
      return;
    }
    
    // Play normally
    console.log('Debug - Playing normally');
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopTimelineAudio();
  };

  const handleSeek = (time: number) => {
    let clampedTime = Math.max(0, Math.min(time, videoDuration));
    
    // Further restrict to trim boundaries if trim is set
    if (trimEnd > 0) {
      clampedTime = Math.max(trimStart, Math.min(clampedTime, trimEnd));
    }
    
    setCurrentTime(clampedTime);
    
    // Seek video player
    if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
      videoPlayerRef.current.seekTo(clampedTime);
    }
  };
  const handleSkipBackward = () => {
    const newTime = Math.max(trimStart, currentTime - 10);
    handleSeek(newTime);
  };
  const handleSkipForward = () => {
    // FIXED: Giới hạn skip trong phạm vi trim boundaries
    const maxTime = trimEnd > 0 ? trimEnd : videoDuration;
    const newTime = Math.min(maxTime, currentTime + 10);
    handleSeek(newTime);
  };

  // Video save handler
  const videoPlayerRef = useRef<any>(null);
  const handleSaveVideo = () => {
    handleOpenExportModal();
  };

  // Trạng thái export video
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');

  // Download confirmation modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadData, setDownloadData] = useState<{
    filename: string;
    videoId: string;
  } | null>(null);

  // Login expiration modal state
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Export video modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportVideoTitle, setExportVideoTitle] = useState('');

  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    show: boolean;
  }>({ message: '', type: 'info', show: false });

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ message, type, show: true });
    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Download modal handlers
  const handleConfirmDownload = () => {
    if (downloadData) {
      videoProcessor.downloadCurrentVideo(downloadData.filename);
      showNotification(`File downloaded: ${downloadData.filename}`, 'info');
      setShowDownloadModal(false);
      setDownloadData(null);
    }
  };

  const handleChooseLocationDownload = async () => {
    if (!downloadData) return;

    try {
      // Check if File System Access API is supported
      if ('showSaveFilePicker' in window) {
        // Type-safe interface for File System Access API
        interface FileSystemFileHandle {
          createWritable(): Promise<FileSystemWritableFileStream>;
        }
        
        interface FileSystemWritableFileStream {
          write(data: Blob): Promise<void>;
          close(): Promise<void>;
        }

        const showSaveFilePicker = (window as any).showSaveFilePicker;
        const fileHandle: FileSystemFileHandle = await showSaveFilePicker({
          suggestedName: downloadData.filename,
          types: [
            {
              description: 'Video files',
              accept: {
                'video/mp4': ['.mp4'],
              },
            },
          ],
        });

        // Get the video blob from videoProcessor
        const currentVideo = videoProcessor.getCurrentVideo();
        if (currentVideo && currentVideo.blob) {
          const writable = await fileHandle.createWritable();
          await writable.write(currentVideo.blob);
          await writable.close();
          
          showNotification(`File successfully saved to the selected location!`, 'success');
        } else {
          throw new Error('No video found to download');
        }
      } else {
        // Fallback for browsers that don't support File System Access API
        showNotification('Browser does not support choosing a download location. Using default download...', 'warning');
        videoProcessor.downloadCurrentVideo(downloadData.filename);
        showNotification(`File downloaded: ${downloadData.filename}`, 'info');
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled the save dialog
        showNotification('Download canceled', 'info');
      } else {
        console.error('Error saving file:', error);
        showNotification(`Error saving file: ${(error as Error).message}`, 'error');
        // Fallback to default download
        videoProcessor.downloadCurrentVideo(downloadData.filename);
        showNotification('Switched to default download', 'info');
      }
    } finally {
      setShowDownloadModal(false);
      setDownloadData(null);
    }
  };

  const handleCancelDownload = () => {
    setShowDownloadModal(false);
    setDownloadData(null);
  };

  const showDownloadConfirmation = (filename: string, videoId: string) => {
    setDownloadData({ filename, videoId });
    setShowDownloadModal(true);
    
    // Show browser compatibility info
    if (!('showSaveFilePicker' in window)) {
      setTimeout(() => {
        showNotification(
          "Save location selection is not supported in this browser. Use the latest Chrome or Edge for the best experience.",
          'info'
        );
      }, 500);
    }
  };

  // Login expiration modal handlers
  const handleConfirmLogin = () => {
    setShowLoginModal(false);
    window.location.href = '/auth/login';
  };

  const handleCancelLogin = () => {
    setShowLoginModal(false);
  };

  const showLoginExpiration = () => {
    setShowLoginModal(true);
  };

  // Export modal handlers
  const handleOpenExportModal = () => {
    if (!generatedVideo || !videoUrl) {
      showNotification('Không có video để export!', 'error');
      return;
    }

    if (isExporting) {
      showNotification('Đang export video, vui lòng đợi...', 'warning');
      return;
    }

    // Set default title based on current video
    const defaultTitle = generatedVideo.title || 'Edited Video';
    setExportVideoTitle(defaultTitle);
    setShowExportModal(true);
  };

  const handleConfirmExport = () => {
    if (!exportVideoTitle.trim()) {
      showNotification('Vui lòng nhập tên video!', 'error');
      return;
    }
    setShowExportModal(false);
    handleExportVideo();
  };

  const handleCancelExport = () => {
    setShowExportModal(false);
    setExportVideoTitle('');
  };

  // Download original video function
  const handleDownloadOriginalVideo = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `original_${generatedVideo?.title || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Downloading original video...', 'info');
    }
  };

  // Delete media function
  const handleDeleteMedia = (mediaId: string) => {
    setGlobalMediaItems(prev => prev.filter(item => item.id !== mediaId));
    showNotification('Media removed from library', 'success');
  };

  // Properties panel helper functions
  const getPropertiesTitle = () => {
    return 'Properties';
  };

  const getPropertiesSections = () => {
    return [];
  };

  const handleExportVideo = async () => {
    if (!generatedVideo || !videoUrl) {
      showNotification('Không có video để export!', 'error');
      return;
    }

    if (isExporting) {
      showNotification('Đang export video, vui lòng đợi...', 'warning');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // B1: Bắt đầu export với dữ liệu hiện tại
      setExportStage('Bắt đầu export video (1080p)...');
      showNotification('Bắt đầu export video với chất lượng 1080p...', 'info');
      setExportProgress(5);

      // Use current state values directly (no save/load needed)
      let effectiveTrimStart = trimStart;
      let effectiveTrimEnd = trimEnd;
      let effectiveVideoVolume = videoVolume;

      console.log('Debug Export - Using current state for export:', {
        trimStart: effectiveTrimStart,
        trimEnd: effectiveTrimEnd,
        videoVolume: effectiveVideoVolume,
        trimmedDuration: effectiveTrimEnd - effectiveTrimStart
      });

      // B1: Thu thập tất cả timeline items và processing steps
      setExportStage('Đang chuẩn bị export video...');
      showNotification('Đang chuẩn bị export video...', 'info');
      setExportProgress(10);

      const allItems: TimelineItem[] = [];
      const audioItems: TimelineItem[] = [];
      let mainVideoItem: TimelineItem | null = null;

      // Use current timeline state
      const effectiveTimeline = timelineState.tracks;
      
      console.log('Debug Export - Using timeline tracks:', {
        source: 'current',
        tracksCount: effectiveTimeline.length,
        totalItems: effectiveTimeline.reduce((sum: number, track: any) => sum + track.items.length, 0)
      });

      // Thu thập items từ effective timeline
      effectiveTimeline.forEach((track: any) => {
        track.items.forEach((item: any) => {
          if (item.isMainVideoUnit) {
            mainVideoItem = item;
          } else if (item.type === 'audio') {
            // Chỉ thêm audio items từ tracks không bị mute
            if (!track.isMuted) {
              audioItems.push({
                ...item,
                volume: (item.volume || 1) * (track.volume || 1) * effectiveVideoVolume
              });
            }
          }
          allItems.push(item);
        });
      });

      setExportProgress(20);

      // B2: Luôn tạo fresh video processor cho export để đảm bảo tính chính xác
      setExportStage('Đang xử lý video chính...');
      showNotification('Đang xử lý video chính...', 'info');
      
      console.log('Debug Export - Creating fresh video processor for export');
      
      // Cleanup existing processor to start fresh
      videoProcessor.cleanup();
      
      // Initialize with original video
      await videoProcessor.initialize(videoUrl);
      
      console.log('Debug Export - Fresh video processor initialized:', {
        duration: videoProcessor.getCurrentVideo()?.duration,
        processingSteps: videoProcessor.getProcessingHistory().length
      });
      
      setExportProgress(30);

      // B3: Áp dụng trim nếu có (dựa trên saved timeline hoặc state hiện tại)
      console.log('Debug Export - Trim analysis:', {
        effectiveTrimStart,
        effectiveTrimEnd,
        videoDuration,
        trimmedDuration: effectiveTrimEnd - effectiveTrimStart,
        trimmedPercentage: ((effectiveTrimEnd - effectiveTrimStart) / videoDuration * 100).toFixed(1) + '%',
        willTrim: effectiveTrimStart > 0 || effectiveTrimEnd < videoDuration,
        trimCondition1: effectiveTrimStart > 0,
        trimCondition2: effectiveTrimEnd < videoDuration,
        trimStartSeconds: effectiveTrimStart.toFixed(2),
        trimEndSeconds: effectiveTrimEnd.toFixed(2),
        durationToTrim: (videoDuration - (effectiveTrimEnd - effectiveTrimStart)).toFixed(2) + 's'
      });
      
      if (effectiveTrimStart > 0 || effectiveTrimEnd < videoDuration) {
        const trimmedDuration = effectiveTrimEnd - effectiveTrimStart;
        const trimmedPercentage = (trimmedDuration / videoDuration * 100).toFixed(1);
        const totalTrimmed = videoDuration - trimmedDuration;
        
        // Warn if trim is very small (less than 1 second total trimmed)
        if (totalTrimmed < 1) {
          console.warn('Debug Export - Very small trim detected:', {
            totalTrimmed: totalTrimmed.toFixed(3) + 's',
            message: 'Video sẽ gần như không thay đổi'
          });
          showNotification(
            `Cảnh báo: Trim rất nhỏ (chỉ cắt ${totalTrimmed.toFixed(1)}s). Video sẽ gần như không đổi.`,
            'warning'
          );
        }
        
        setExportStage('Đang cắt video theo timeline...');
        showNotification(
          `Đang cắt video: ${formatTime(effectiveTrimStart)} - ${formatTime(effectiveTrimEnd)} (${trimmedPercentage}% video gốc)`,
          'info'
        );
        
        console.log('Debug Export - Applying trim:', {
          startTime: effectiveTrimStart,
          endTime: effectiveTrimEnd,
          duration: trimmedDuration,
          originalDuration: videoDuration,
          percentageKept: trimmedPercentage
        });
        
        try {
          await videoProcessor.addProcessingStep({
            type: 'trim',
            params: {
              startTime: effectiveTrimStart,
              endTime: effectiveTrimEnd
            }
          });
          
          // Debug: Check video after trim
          const videoAfterTrim = videoProcessor.getCurrentVideo();
          console.log('Debug Export - Video after trim:', {
            duration: videoAfterTrim?.duration,
            expectedDuration: effectiveTrimEnd - effectiveTrimStart,
            blobSize: videoAfterTrim?.blob.size,
            processingSteps: videoAfterTrim?.steps.length
          });
          
          console.log('Debug Export - Trim step added successfully');
        } catch (trimError) {
          console.error('Debug Export - Trim failed:', trimError);
          throw new Error(`Lỗi khi trim video: ${trimError instanceof Error ? trimError.message : String(trimError)}`);
        }
        
        setExportProgress(50);
      } else {
        console.log('Debug Export - No trim applied (using full video)');
        setExportProgress(50);
      }

      // B4: Xử lý audio tracks
      if (audioItems.length > 0) {
        setExportStage(`Adding ${audioItems.length} audio track(s)...`);
        showNotification(`Adding ${audioItems.length} audio track(s)...`, 'info');
        
        console.log(`Processing ${audioItems.length} audio tracks at once:`, 
          audioItems.map((item, i) => ({
            index: i,
            name: item.url,
            duration: item.duration,
            startTime: item.startTime,
            volume: item.volume
          }))
        );
        
        // Tạo audio tracks data
        const audioTracks = [];
        for (let i = 0; i < audioItems.length; i++) {
          const audioItem = audioItems[i];
          
          if (!audioItem.url) {
            console.warn(`Audio item ${i} không có URL, bỏ qua`);
            continue;
          }
          
          // Tạo audio file từ URL
          const audioResponse = await fetch(audioItem.url);
          const audioBlob = await audioResponse.blob();
          const audioFile = new File([audioBlob], `audio-${i}.mp3`, { type: 'audio/mpeg' });
          
          audioTracks.push({
            audioFile: audioFile,
            startTime: audioItem.startTime,
            duration: audioItem.duration,
            volume: audioItem.volume || 1
          });
        }
        
        // Thêm tất cả audio tracks cùng lúc
        if (audioTracks.length > 0) {
          await videoProcessor.addProcessingStep({
            type: 'addMultipleAudio',
            params: {
              audioTracks: audioTracks
            }
          });
          
          console.log(`Added ${audioTracks.length} audio tracks in one step`);
        }
        
        setExportProgress(70);
      }

      // B5: Xử lý Text Overlays từ state hiện tại
      let effectiveTextOverlays = textOverlayState.textOverlays.filter(overlay => overlay.isVisible);
      console.log('Debug Export - Using current text overlays:', effectiveTextOverlays.length);

      console.log('Text overlays analysis:', {
        currentStateOverlays: textOverlayState.textOverlays.length,
        currentVisibleOverlays: textOverlayState.textOverlays.filter(overlay => overlay.isVisible).length,
        effectiveOverlays: effectiveTextOverlays.length,
        source: 'current',
        allCurrentOverlays: textOverlayState.textOverlays.map(overlay => ({
          id: overlay.id,
          text: overlay.text,
          isVisible: overlay.isVisible,
          timing: overlay.timing
        }))
      });
      
      if (effectiveTextOverlays.length > 0) {
        setExportStage(`Adding ${effectiveTextOverlays.length} text overlay(s)...`);
        showNotification(`Adding ${effectiveTextOverlays.length} text overlay(s)...`, 'info');
        
        console.log('Debug Export - Text overlays to process:', effectiveTextOverlays.map(overlay => ({
          id: overlay.id,
          text: overlay.text,
          startTime: overlay.timing.startTime,
          duration: overlay.timing.duration,
          endTime: overlay.timing.endTime,
          position: overlay.position,
          style: overlay.style,
          isVisible: overlay.isVisible
        })));
        
        // Process all text overlays in one step for better performance
        const adjustedTextOverlays = [];
        for (const textOverlay of effectiveTextOverlays) {
          // Adjust timing for trimmed video
          let adjustedStartTime = textOverlay.timing.startTime;
          let adjustedDuration = textOverlay.timing.duration;
          
          // If video was trimmed, adjust text overlay timing
          if (effectiveTrimStart > 0 || effectiveTrimEnd < videoDuration) {
            // Skip text overlays that are completely outside the trimmed range
            if (textOverlay.timing.endTime <= effectiveTrimStart || textOverlay.timing.startTime >= effectiveTrimEnd) {
              console.log(`Debug Export - Skipping text overlay "${textOverlay.text}" (outside trim range)`);
              continue;
            }
            
            // Adjust timing for overlays that intersect with trimmed range
            adjustedStartTime = Math.max(0, textOverlay.timing.startTime - effectiveTrimStart);
            const adjustedEndTime = Math.min(
              effectiveTrimEnd - effectiveTrimStart,
              textOverlay.timing.endTime - effectiveTrimStart
            );
            adjustedDuration = adjustedEndTime - adjustedStartTime;
            
            console.log(`Debug Export - Adjusted text overlay timing for "${textOverlay.text}":`, {
              original: { start: textOverlay.timing.startTime, duration: textOverlay.timing.duration },
              adjusted: { start: adjustedStartTime, duration: adjustedDuration },
              trimRange: { start: effectiveTrimStart, end: effectiveTrimEnd }
            });
          }
          
          if (adjustedDuration <= 0) {
            console.log(`Debug Export - Skipping text overlay "${textOverlay.text}" (invalid duration after adjustment)`);
            continue;
          }
          
          adjustedTextOverlays.push({
            text: textOverlay.text,
            position: textOverlay.position,
            style: textOverlay.style,
            timing: {
              startTime: adjustedStartTime,
              duration: adjustedDuration
            },
            size: textOverlay.size,
            opacity: textOverlay.opacity,
            shadow: textOverlay.shadow,
            outline: textOverlay.outline,
            background: textOverlay.background,
          });
        }
        
        // Add all text overlays in one processing step
        if (adjustedTextOverlays.length > 0) {
          console.log('Adjust:', adjustedTextOverlays);
          await videoProcessor.addProcessingStep({
            type: 'addMultipleTextOverlays',
            params: {
              overlays: adjustedTextOverlays,
              videoSize:videoSize
            }
          });

          console.log(`Debug Export - Added ${adjustedTextOverlays.length} text overlays in one step`);
        }
        
        setExportProgress(80);
      }

      // B5.5: Xử lý Sticker Overlays từ state hiện tại
      let effectiveStickerOverlays = stickerState.stickerOverlays.filter(overlay => overlay.visible);
      console.log('Debug Export - Using current sticker overlays:', effectiveStickerOverlays.length);

      if (effectiveStickerOverlays.length > 0) {
        setExportStage(`Đang thêm ${effectiveStickerOverlays.length} sticker(s)...`);
        showNotification(`Đang thêm ${effectiveStickerOverlays.length} sticker(s)...`, 'info');
        
        console.log('Debug Export - Sticker overlays to process:', effectiveStickerOverlays.map(overlay => ({
          id: overlay.id,
          stickerId: overlay.stickerId,
          stickerName: overlay.stickerName,
          stickerUrl: overlay.stickerUrl ? overlay.stickerUrl.substring(0, 50) + '...' : 'No URL',
          startTime: overlay.timing.startTime,
          endTime: overlay.timing.endTime,
          position: overlay.position,
          size: overlay.size,
          visible: overlay.visible
        })));
        
        // Validate sticker overlays before processing
        const validStickerOverlays = effectiveStickerOverlays.filter(overlay => {
          if (!overlay.stickerUrl || overlay.stickerUrl.trim() === '') {
            console.warn(`Skipping sticker ${overlay.stickerName}: Invalid URL`);
            return false;
          }
          
          // Validate URL format
          try {
            const url = new URL(overlay.stickerUrl, window.location.origin);
            if (!url.pathname.toLowerCase().endsWith('.png') && !url.pathname.toLowerCase().endsWith('.jpg') && !url.pathname.toLowerCase().endsWith('.jpeg')) {
              console.warn(`Skipping sticker ${overlay.stickerName}: Not a supported image format`);
              return false;
            }
          } catch (urlError) {
            console.warn(`Skipping sticker ${overlay.stickerName}: Invalid URL format`);
            return false;
          }
          
          if (overlay.timing.startTime >= overlay.timing.endTime) {
            console.warn(`Skipping sticker ${overlay.stickerName}: Invalid timing (start >= end)`);
            return false;
          }
          
          // Check if sticker timing is within video duration
          if (overlay.timing.startTime >= videoDuration || overlay.timing.endTime <= 0) {
            console.warn(`Skipping sticker ${overlay.stickerName}: Timing outside video duration`);
            return false;
          }
          
          // Check if sticker has reasonable size
          if (overlay.size.width <= 0 || overlay.size.height <= 0 || overlay.size.width > 100 || overlay.size.height > 100) {
            console.warn(`Skipping sticker ${overlay.stickerName}: Invalid size`);
            return false;
          }
          return true;
        });
        
        if (validStickerOverlays.length === 0) {
          console.warn('No valid sticker overlays to process');
          showNotification('Không có sticker hợp lệ để thêm', 'warning');
        } else {
          console.log(`Processing ${validStickerOverlays.length} valid sticker overlays`);
          
          // Process all sticker overlays in one step for better performance
          const adjustedStickerOverlays = [];
          
          for (const stickerOverlay of validStickerOverlays) {
            // Adjust timing for trimmed video
            let adjustedStartTime = stickerOverlay.timing.startTime;
            let adjustedEndTime = stickerOverlay.timing.endTime;
            
            // If video was trimmed, adjust sticker overlay timing
            if (effectiveTrimStart > 0 || effectiveTrimEnd < videoDuration) {
              // Skip sticker overlays that are completely outside the trimmed range
              if (stickerOverlay.timing.endTime <= effectiveTrimStart || stickerOverlay.timing.startTime >= effectiveTrimEnd) {
                console.log(`Debug Export - Skipping sticker overlay "${stickerOverlay.stickerName}" (outside trim range)`);
                continue;
              }
              
              // Adjust timing for overlays that intersect with trimmed range
              adjustedStartTime = Math.max(0, stickerOverlay.timing.startTime - effectiveTrimStart);
              adjustedEndTime = Math.min(
                effectiveTrimEnd - effectiveTrimStart,
                stickerOverlay.timing.endTime - effectiveTrimStart
              );
            }
            
            if (adjustedEndTime <= adjustedStartTime) {
              console.log(`Debug Export - Skipping sticker overlay "${stickerOverlay.stickerName}" (invalid duration after adjustment)`);
              continue;
            }
            
            adjustedStickerOverlays.push({
              stickerId: stickerOverlay.stickerId,
              stickerUrl: stickerOverlay.stickerUrl,
              stickerName: stickerOverlay.stickerName,
              position: stickerOverlay.position,
              size: stickerOverlay.size,
              rotation: stickerOverlay.rotation,
              opacity: stickerOverlay.opacity,
              timing: {
                startTime: adjustedStartTime,
                endTime: adjustedEndTime
              },
              animation: stickerOverlay.animation,
            });
          }
          
          // Add all sticker overlays in one processing step
          if (adjustedStickerOverlays.length > 0) {
            try {
              // Debug: Log final sticker data being sent to FFmpeg
              console.log('Debug - Final sticker data sent to FFmpeg:', {
                count: adjustedStickerOverlays.length,
                videoSize,
                videoDuration,
                currentTime,
                stickers: adjustedStickerOverlays.map((s, i) => ({
                  index: i,
                  name: s.stickerName,
                  url: s.stickerUrl.substring(0, 30) + '...',
                  position: s.position,
                  size: s.size,
                  timing: s.timing,
                  rotation: s.rotation,
                  opacity: s.opacity,
                  pixelPosition: {
                    x: s.position.x,
                    y: s.position.y  
                  },
                  pixelSize: {
                    width: s.size.width,  
                    height: s.size.height 
                  },
                  coordinateSystem: 'Sticker uses pixel coordinates relative to 1280x720 original size',
                  videoScaling: {
                    originalVideoSize: '1280x720 (default)',
                    actualVideoSize: `${videoSize.width}x${videoSize.height}`,
                    scaleX: videoSize.width / 1280,
                    scaleY: videoSize.height / 720,
                    scaledPosition: {
                      x: Math.round(s.position.x * (videoSize.width / 1280)),
                      y: Math.round(s.position.y * (videoSize.height / 720))
                    }
                  },
                  webUIComparison: {
                    note: 'How this position would be calculated in web UI',
                    webUIScaleX: videoSize.width / 1280, 
                    webUIScaleY: videoSize.height / 720,
                    webUIPosition: {
                      x: s.position.x * (videoSize.width / 1280),
                      y: s.position.y * (videoSize.height / 720)
                    },
                    positionDifference: {
                      note: 'Difference between FFmpeg and expected web UI position',
                      ffmpegX: Math.round(s.position.x * (videoSize.width / 1280)),
                      ffmpegY: Math.round(s.position.y * (videoSize.height / 720)),
                      expectedWebUIX: s.position.x * (videoSize.width / 1280),
                      expectedWebUIY: s.position.y * (videoSize.height / 720)
                    }
                  },
                  expectedScaledSize: {
                    note: 'Sticker size will be scaled based on pixel size',
                    avgPixelSize: (s.size.width + s.size.height) / 2,
                    estimatedScaleFactor: (s.size.width + s.size.height) / 2 <= 50 ? '100%' : 
                                         (s.size.width + s.size.height) / 2 <= 100 ? '80%' : 
                                         (s.size.width + s.size.height) / 2 <= 150 ? '70%' : 
                                         (s.size.width + s.size.height) / 2 <= 200 ? '60%' : '50%'
                  },
                  timingCheck: {
                    isValidTiming: s.timing.startTime < s.timing.endTime,
                    duration: s.timing.endTime - s.timing.startTime,
                    startsBeforeVideoEnd: s.timing.startTime < videoDuration,
                    endsAfterVideoStart: s.timing.endTime > 0
                  }
                }))
              });
              
              await videoProcessor.addProcessingStep({
                type: 'addMultipleStickerOverlays',
                params: {
                  overlays: adjustedStickerOverlays,
                  videoSize: videoSize
                }
              });

              console.log(`Debug Export - Added ${adjustedStickerOverlays.length} sticker overlays in one step`);
              
              // Show success notification
              const originalCount = effectiveStickerOverlays.length;
              const processedCount = adjustedStickerOverlays.length;
              
              if (originalCount > processedCount) {
                const skippedCount = originalCount - processedCount;
                showNotification(`Đã thêm ${processedCount} sticker(s), bỏ qua ${skippedCount} sticker(s) không hợp lệ`, 'info');
              } else {
                showNotification(`Đã thêm ${processedCount} sticker(s) thành công`, 'success');
              }
              
            } catch (stickerError) {
              console.error('Error adding sticker overlays:', stickerError);
              showNotification(`Có lỗi khi thêm sticker: ${stickerError instanceof Error ? stickerError.message : String(stickerError)}`, 'error');
              // Throw error to stop export process if stickers fail
              throw stickerError;
            }
          } else {
            console.warn('No sticker overlays remain after validation and timing adjustment');
            showNotification('Không có sticker nào có thể được thêm sau khi kiểm tra', 'warning');
          }
        }
        
        setExportProgress(82);
      }

      // B6: Tạo video cuối cùng
      setExportStage('Đang hoàn tất xử lý video...');
      showNotification('Đang hoàn tất xử lý video...', 'info');
      setExportProgress(85);

      const exportedVideo = videoProcessor.getCurrentVideo();
      if (!exportedVideo) {
        throw new Error('Không thể tạo video cuối cùng');
      }

      // Kiểm tra kích thước video trước khi upload
      const videoSizeKB = Math.round(exportedVideo.blob.size / 1024);
      console.log(`Video size: ${videoSizeKB}KB`);
      
      if (videoSizeKB > 800) {
        showNotification(`Video có kích thước lớn (${videoSizeKB}KB). Hệ thống sẽ tự động nén để đảm bảo upload thành công.`, 'warning');
      }

      // B7: Upload video lên server và cập nhật database
      setExportStage('Đang upload video lên server...');
      showNotification('Đang upload video lên server...', 'info');
      setExportProgress(90);

      // Chuẩn bị dữ liệu export
      const processingSteps = videoProcessor.getProcessingHistory();
      const timelineData = {
        tracks: effectiveTimeline, 
        duration: videoDuration,
        trimStart: effectiveTrimStart, 
        trimEnd: effectiveTrimEnd,     
        audioTracks: audioItems.map(item => ({
          id: item.id,
          url: item.url,
          volume: item.volume,
          startTime: item.startTime,
          duration: item.duration
        })),
        textOverlays: effectiveTextOverlays.map((overlay: any) => ({
          id: overlay.id,
          text: overlay.text,
          position: overlay.position,
          style: overlay.style,
          timing: overlay.timing,
          size: overlay.size,
          opacity: overlay.opacity,
          shadow: overlay.shadow,
          outline: overlay.outline,
          background: overlay.background,
          isVisible: overlay.isVisible
        })),
        videoVolume: effectiveVideoVolume, 
        exportTimestamp: new Date().toISOString()
      };

      // Upload video lên server
      const uploadResult = await videoExportService.uploadEditedVideo(
        exportedVideo.blob, 
        {
          originalVideoId: generatedVideo.id, 
          title: exportVideoTitle, 
          description: `Edited version of ${generatedVideo.title}`,
          processingSteps,
          timelineData
        }
      );

      setExportProgress(98);

      // B8: Thông báo thành công và tùy chọn tải xuống
      setExportStage('Hoàn thành export video (1080p)!');
      showNotification(
        'Video export thành công với chất lượng 1080p!'
      );

      // Hiển thị thông tin chi tiết về export
      console.log('Export completed with database update:', {
        originalVideoId: generatedVideo.id,
        newVideoId: uploadResult.video_id,
        videoUrl: uploadResult.video_url,
        exportQuality: '1080p', // Fixed quality
        processingSteps: processingSteps.length,
        audioTracksAdded: audioItems.length,
        textOverlaysAdded: effectiveTextOverlays.length,
        trimApplied: effectiveTrimStart > 0 || effectiveTrimEnd < videoDuration, 
        trimValues: { start: effectiveTrimStart, end: effectiveTrimEnd }, 
        originalVideoUpdated: uploadResult.original_video_updated,
        processingSummary: uploadResult.processing_summary
      });

      setExportProgress(100);

      // Show download confirmation modal
      const filename = `${exportVideoTitle.replace(/[<>:"/\\|?*]/g, '_')}.mp4`;
      showDownloadConfirmation(filename, uploadResult.video_id);

      // Log thông tin export để debug
      console.log('Export completed:', {
        originalDuration: videoDuration,
        trimmedDuration: trimEnd - trimStart,
        audioTracksAdded: audioItems.length,
        textOverlaysAdded: effectiveTextOverlays.length,
        exportQuality: '1080p',
        finalVolume: videoVolume,
        totalProcessingSteps: videoProcessor.getProcessingHistory().length
      });

    } catch (error) {
      console.error('Error exporting video:', error);
      let errorMessage = 'Lỗi không xác định';
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication') || error.message.includes('đăng nhập')) {
          errorMessage = error.message;
          // Show login expiration modal instead of window.confirm
          setTimeout(() => {
            showLoginExpiration();
          }, 2000);
        } else if (error.message.includes('exceeded maximum size') || error.message.includes('quá lớn')) {
          errorMessage = error.message;
          // Show specific size error guidance
          showNotification(
            'Video hoặc dữ liệu quá lớn để upload.'
          );
        } else {
          errorMessage = error.message;
        }
      }
      
      showNotification(`Lỗi khi export video: ${errorMessage}`, 'error');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportStage('');
    }
  };

  // Component mount effect (simplified - no save/load functionality)
  useEffect(() => {
    // Initialize with default values when video loads
    if (generatedVideo?.id && videoDuration > 0) {
      console.log('Video loaded, using default trim values:', {
        trimStart: 0,
        trimEnd: videoDuration,
        videoVolume: 1
      });
    }
  }, [generatedVideo?.id, videoDuration]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className='bg-white border-b border-gray-200 px-6 py-2 shadow-sm flex-shrink-0'>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {generatedVideo && (
                <div className="flex items-center space-x-2">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <FaRobot className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{generatedVideo.title}</h2>
                      <p className="text-gray-500 text-sm">
                        {formatTime(videoDuration)} • {new Date(generatedVideo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-3">
                {/* Export Video Button */}
                {videoUrl && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleOpenExportModal}
                    disabled={isExporting}
                    className={`flex items-center space-x-2 text-sm px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                      isExporting 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        <span>Đang Export...</span>
                      </>
                    ) : (
                      <>
                        <FaDownload className="w-4 h-4" />
                        <span>Export Video</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>

              {/* Export Progress Bar */}
              {isExporting && exportProgress > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-0 right-0 top-full mt-2 mx-4"
                >
                  <div className="bg-white rounded-lg shadow-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Đang Export Video</span>
                      <span className="text-sm text-gray-500">{exportProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${exportProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </header>

          {/* Main content area  */}
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* Top content area - sidebar, video, properties panel */}
            <div className="flex-1 flex min-h-0">
              {/* Sidebar - responsive width */}
              <div className="flex-shrink-0 bg-white border-r border-gray-200 shadow-sm">
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onBackToGenerate={handleBackToGenerate}
                />
              </div>

              {/* Middle content - Video area */}
              <div className="flex-1 bg-gray-50 p-6 min-w-0">
                {isLoadingVideo ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Đang tải video AI của bạn...</p>
                      <p className="text-gray-500 text-sm mt-2">Khởi tạo video processor...</p>
                    </div>
                  </div>
                ) : !videoUrl ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center bg-white rounded-lg p-12 shadow-lg border border-gray-200 max-w-md">
                      <div className="text-6xl mb-6">🎬</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Video Editor</h3>
                      <p className="text-gray-600 mb-6">Create amazing videos with our multi-track timeline editor</p>
                      
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                          <span>Generate AI video or upload media files</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                          <span>Drag & drop media to timeline tracks</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                          <span>Edit, arrange, and export your video</span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-3">
                        <button
                          onClick={handleBackToGenerate}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center justify-center space-x-2 shadow-md transition-colors duration-200"
                        >
                          <FaRobot className="w-5 h-5" />
                          <span>Generate AI Video</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('media');
                            setIsPropertiesPanelOpen(true);
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg inline-flex items-center justify-center space-x-2 transition-colors duration-200"
                        >
                          <FaVideo className="w-5 h-5" />
                          <span>Upload Media Files</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full">
                    <VideoPlayer
                      key={videoUrl}
                      ref={videoPlayerRef}
                      videoUrl={videoUrl}
                      onDuration={handleDuration}
                      onProgress={handleProgress}
                      isPlaying={isPlaying}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      currentTime={currentTime}
                      volume={videoVolume}
                      onVolumeChange={handleVolumeChange}
                      isMuted={isMuted}
                      onToggleMute={handleToggleGlobalMute}
                      isMainVideoTrackMuted={isMainVideoTrackMuted()}
                      trimStart={trimStart}
                      trimEnd={trimEnd}
                      setVideoSize={setVideoSize}
                      onSeek={(direction) => {
                        if (direction === 'forward') {
                          handleSkipForward();
                        } else {
                          handleSkipBackward();
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Properties Panel or Media Library or Text Overlay Panel */}
              {isPropertiesPanelOpen && activeTab === 'media' ? (
                // Direct Media Library for media tab
                <div className="bg-white border-l border-gray-200 shadow-sm flex-shrink-0" style={{ width: `${propertiesPanelWidth}px` }}>
                  <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-lg font-semibold text-gray-900">Thư Viện Media</h3>
                      <button
                        onClick={() => {
                          setIsPropertiesPanelOpen(false);
                          setActiveTab(null);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Media Library */}
                    <div className="flex-1 min-h-0">
                      <MediaLibrary
                        mediaItems={globalMediaItems}
                        setMediaItems={setGlobalMediaItems}
                        showHeader={false}
                        onAddMedia={(media) => {
                          console.log('Added media:', media);
                          showNotification(`Đã thêm ${media.name} vào thư viện media`, 'success');
                        }}
                        onDeleteMedia={handleDeleteMedia}
                        showNotification={showNotification}
                      />
                    </div>
                  </div>
                </div>
              ) : isPropertiesPanelOpen && activeTab === 'text' ? (
                // Direct Text Overlay Panel for text tab
                <div className="bg-white border-l border-gray-200 shadow-sm flex-shrink-0" style={{ width: `${propertiesPanelWidth}px` }}>
                  <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-lg font-semibold text-gray-900">Text Overlay</h3>
                      <button
                        onClick={() => {
                          setIsPropertiesPanelOpen(false);
                          setActiveTab(null);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Text Overlay Panel */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <TextOverlayPanel
                        currentTime={currentTime}
                        onAddText={() => {
                          showNotification('Đã thêm text overlay mới', 'success');
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : isPropertiesPanelOpen && activeTab === 'stickers' ? (
                // Direct Sticker Panel for stickers tab
                <div className="bg-white border-l border-gray-200 shadow-sm flex-shrink-0" style={{ width: `${propertiesPanelWidth}px` }}>
                  <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-lg font-semibold text-gray-900">Sticker</h3>
                      <button
                        onClick={() => {
                          setIsPropertiesPanelOpen(false);
                          setActiveTab(null);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Sticker Panel */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <StickerPanel
                        currentTime={currentTime}
                        onAddSticker={() => {
                          showNotification('Đã thêm sticker mới', 'success');
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Properties Panel for other tabs
                <PropertiesPanel
                  isOpen={isPropertiesPanelOpen && activeTab !== 'media' && activeTab !== 'text' && activeTab !== 'stickers'}
                  onClose={() => {
                    setIsPropertiesPanelOpen(false);
                    setActiveTab(null);
                  }}
                  title={getPropertiesTitle()}
                  sections={getPropertiesSections()}
                  width={propertiesPanelWidth}
                />
              )}
            </div>

            {/* Bottom area - Multi-Track Timeline */}
            <div className="bg-white border-t border-gray-200 shadow-sm flex-shrink-0" style={{ height: '300px' }}>
              <MultiTrackTimeline
                duration={videoDuration} // FIXED: Sử dụng videoDuration thay vì tính toán phức tạp
                currentTime={currentTime}
                onSeek={handleSeek}
                videoUrl={videoUrl}
                isProcessing={false}
                setIsProcessing={() => {}}
                isPlaying={isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
                onSkipBackward={handleSkipBackward}
                onSkipForward={handleSkipForward}
                onSaveVideo={handleSaveVideo}
                backgroundImages={[]}
                // Volume control props
                volume={videoVolume}
                onVolumeChange={handleVolumeChange}
                isMuted={isMuted}
                onToggleMute={handleToggleGlobalMute}
              />
            </div>
        </div>

        {/* Export Progress Modal */}
        <ExportProgressModal
          isVisible={isExporting}
          progress={exportProgress}
          stage={exportStage}
        />

        {/* Download Confirmation Modal */}
        {showDownloadModal && downloadData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Download video</h3>
              <p className="text-gray-600 mb-6">
                Video exported successfully! How do you want to download?
              </p>
              <div className="space-y-3">
                {/* Default download option */}
                <button
                  onClick={handleConfirmDownload}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-left">
                    <div>Fast download</div>
                    <div className="text-xs text-blue-100">Save in downloads folder</div>
                  </div>
                </button>
                
                {/* Choose location option */}
                <button
                  onClick={handleChooseLocationDownload}
                  className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    'showSaveFilePicker' in window
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!('showSaveFilePicker' in window)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <div className="text-left">
                    <div>
                      Select folder
                      {!('showSaveFilePicker' in window) && (
                        <span className="text-xs block">Chỉ hỗ trợ Chrome/Edge</span>
                      )}
                    </div>
                    <div className={`text-xs ${
                      'showSaveFilePicker' in window ? 'text-green-100' : 'text-gray-400'
                    }`}>
                      {('showSaveFilePicker' in window) 
                        ? 'Chọn thư mục và tên file tùy ý' 
                        : 'Cần trình duyệt hỗ trợ mới'
                      }
                    </div>
                  </div>
                </button>
                
                {/* Cancel option */}
                <button
                  onClick={handleCancelDownload}
                  className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  No download
                </button>
              </div>
              
              {/* File info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>File name:</span>
                    <span className="font-medium">{downloadData.filename}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>File type:</span>
                    <span className="font-medium">MP4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login Expiration Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Phiên đăng nhập hết hạn</h3>
              <p className="text-gray-600 mb-6">
                Phiên đăng nhập đã hết hạn. Bạn có muốn đăng nhập lại không?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancelLogin}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Không
                </button>
                <button
                  onClick={handleConfirmLogin}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Đăng nhập lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Video Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Export Video</h3>
              <p className="text-gray-600 mb-4">
                Nhập tên cho video sau khi chỉnh sửa:
              </p>
              <input
                type="text"
                value={exportVideoTitle}
                onChange={(e) => setExportVideoTitle(e.target.value)}
                placeholder="Nhập tên video..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmExport();
                  }
                }}
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancelExport}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmExport}
                  disabled={!exportVideoTitle.trim()}
                  className={`px-4 py-2 rounded-lg ${
                    exportVideoTitle.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -50, x: '-50%' }}
              className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'error' ? 'bg-red-500' :
                notification.type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{notification.message}</span>
                <button
                  onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                  className="ml-2 text-white/80 hover:text-white"
                >
                  x
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}

export default VideoEditor