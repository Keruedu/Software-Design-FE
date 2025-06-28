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
import { AudioTrackData } from '@/types/audio'
import { FaRobot, FaVideo, FaMusic, FaCog, FaDownload, FaCut, FaUndo, FaSave } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { videoProcessor } from '@/services/videoProcessor.service'
import { videoExportService } from '@/services/videoExport.service'
import { AudioTracksContextProvider, TrimVideoContextProvider, useTrimVideoContext } from '@/context/AudioTracks'
import { TimelineProvider, useTimelineContext } from '@/context/TimelineContext'

const VideoEditor: React.FC = () => {
  // Move trim state to wrapper level to avoid context conflicts
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  return (
    <TimelineProvider>
      <AudioTracksContextProvider value={{audioTracks:[],setAudioTracks:() => {}}}>
        <TrimVideoContextProvider value={{trimStart, trimEnd, setTrimStart, setTrimEnd}}>
          <VideoEditorContent />
        </TrimVideoContextProvider>
      </AudioTracksContextProvider>
    </TimelineProvider>
  )
}

const VideoEditorContent: React.FC = () => {
  const router = useRouter()
  const { addItemToTrack, timelineState, updateTrack } = useTimelineContext()
  // Use trim context directly instead of props
  const { trimStart, trimEnd, setTrimStart, setTrimEnd } = useTrimVideoContext();

  const [activeTab, setActiveTab] = useState<'text' | 'media' | 'effects' | 'layers' | null>('media'); // Start with media tab
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);

  // Video processing state
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
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
  // Audio
  const [uploadedAudios, setUploadedAudios] = useState<AudioTrackData[]>([]);
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

      showNotification(`Đã thêm video "${generatedVideo.title}"`, 'success');
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
    if (activeTab === 'media') {
      setIsPropertiesPanelOpen(true);
    } else {
      setIsPropertiesPanelOpen(false);
    }
  }, [activeTab]);

  // Auto open media panel when no video is loaded
  useEffect(() => {
    if (!videoUrl && !isLoadingVideo) {
      setActiveTab('media');
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
        
        // SIMPLIFIED: No hidden video elements to manage
        // Main video muting is handled by ReactPlayer volume control
      }
      
      console.log('Debug - Track', trackId, 'mute toggled to:', newMutedState);
      showNotification(
        `Track "${track.name}" đã ${newMutedState ? 'tắt' : 'bật'} tiếng`, 
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
      `Tất cả track đã ${newMutedState ? 'tắt' : 'bật'} tiếng`, 
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
    
    // FIXED: Đơn giản hóa - chỉ cập nhật thời gian, không có logic phức tạp
    // Vì timeline chỉ trong phạm vi video duration
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

  // REMOVED: startTimelineTimer - không cần thiết vì timeline chỉ trong video duration

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

  // SIMPLIFIED: Get only pure audio items (not embedded in video)
  const getAudioItemsAtTime = (time: number) => {
    return timelineState.tracks.flatMap(track => 
      track.items.filter(item => 
        item.type === 'audio' && 
        !item.isMainVideoUnit && // Exclude main video unit (handled by ReactPlayer)
        item.url && 
        time >= item.startTime && 
        time <= (item.startTime + item.duration)
      )
    );
  };

  // SIMPLIFIED: Preload only pure audio (video handled by ReactPlayer)
  const preloadTimelineAudio = (targetTime: number) => {
    const audioItems = getAudioItemsAtTime(targetTime);
    console.log('Debug - Preloading timeline audio for time:', targetTime, 'items:', audioItems.length);
    
    audioItems.forEach(item => {
      const itemId = item.id || '';
      
      // Only handle pure audio items (not embedded in video)
      if (item.type === 'audio' && item.url && !item.isMainVideoUnit) {
        // Preload audio element but don't play yet
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
    
    // SIMPLIFIED: No hidden video elements needed
    // Main video from database is handled by ReactPlayer as one unit
  };

  // SIMPLIFIED: Play audio items for timeline - treat video as single units
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
      
      // SIMPLIFIED APPROACH: Handle pure audio items only
      // Video items (including main video from database) are handled by ReactPlayer
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
          // Ensure volume is updated (in case volume/mute state changed)
          const finalVolume = (isMuted || isTrackMuted) ? 0 : (item.volume || 1) * trackVolume * videoVolume;
          audio.volume = finalVolume;
          
          const itemTime = currentTime - item.startTime;
          // Use smaller threshold for smoother seeking (0.1s instead of 0.2s)
          if (Math.abs(audio.currentTime - itemTime) > 0.1) {
            audio.currentTime = itemTime;
          }
          
          if (audio.paused && !isMuted && !isTrackMuted) {
            audio.play().then(() => {
              // Fade in for smooth transition (only if not muted)
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
      
      // NOTE: Video items (including main video) are handled by ReactPlayer
      // No need for hidden video elements - this eliminates sync issues
      // The main video from database (https://res.cloudinary.com/...) remains as one block
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
    
    // SIMPLIFIED: No need to manage hidden video elements anymore
    // Video items are handled by ReactPlayer directly
  };

  // SIMPLIFIED: Stop only audio elements (no hidden video elements)
  const stopTimelineAudio = () => {
    Object.values(audioElementsRef.current).forEach(audio => {
      if (!audio.paused) {
        audio.pause();
      }
    });
    
    // SIMPLIFIED: No need to manage hidden video elements
    // Video is handled by ReactPlayer as a single unit
    // This eliminates the complexity and sync issues
  };

  // SIMPLIFIED: Update volume for audio elements only (no hidden video elements)
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
    
    // SIMPLIFIED: No hidden video elements to manage
    // Video volume is handled by ReactPlayer directly through props
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
    // FIXED: Giới hạn timeline theo duration của video gốc
    // Không cho phép timeline kéo dài quá video gốc
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
    
    // FIXED: Đơn giản hóa logic play
    // Chỉ kiểm tra nếu đã ở cuối trim thì seek về trimStart
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
    // FIXED: Đơn giản hóa - không cần logic phức tạp
    stopTimelineAudio();
  };

  const handleSeek = (time: number) => {
    // FIXED: Giới hạn seek trong phạm vi trim boundaries
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
    if (videoPlayerRef.current && videoPlayerRef.current.handleSaveVideo) {
      videoPlayerRef.current.handleSaveVideo();
    }
  };

  // Trạng thái export video
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');
  
  // Trạng thái save timeline
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Download confirmation modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadData, setDownloadData] = useState<{
    filename: string;
    videoId: string;
  } | null>(null);

  // Login expiration modal state
  const [showLoginModal, setShowLoginModal] = useState(false);

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
      showNotification(`File đã được tải xuống: ${downloadData.filename}`, 'info');
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
          
          showNotification(`File đã được lưu thành công tại vị trí bạn chọn!`, 'success');
        } else {
          throw new Error('Không tìm thấy video để tải xuống');
        }
      } else {
        // Fallback for browsers that don't support File System Access API
        showNotification('Trình duyệt không hỗ trợ chọn vị trí tải. Sử dụng tải xuống mặc định...', 'warning');
        videoProcessor.downloadCurrentVideo(downloadData.filename);
        showNotification(`File đã được tải xuống: ${downloadData.filename}`, 'info');
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled the save dialog
        showNotification('Đã hủy tải xuống', 'info');
      } else {
        console.error('Error saving file:', error);
        showNotification(`Lỗi khi lưu file: ${(error as Error).message}`, 'error');
        // Fallback to default download
        videoProcessor.downloadCurrentVideo(downloadData.filename);
        showNotification(`Đã chuyển sang tải xuống mặc định`, 'info');
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
          'Trình duyệt này chưa hỗ trợ chọn vị trí lưu. Sử dụng Chrome/Edge mới nhất để có trải nghiệm tốt nhất.',
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

  // Export preview function
  const showExportPreview = () => {
    showNotification('Preview Export feature coming soon!', 'info');
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
      showNotification('Đang tải video gốc...', 'info');
    }
  };

  // Delete media function
  const handleDeleteMedia = (mediaId: string) => {
    setGlobalMediaItems(prev => prev.filter(item => item.id !== mediaId));
    showNotification('Đã xóa media khỏi thư viện', 'success');
  };

  // Properties panel helper functions
  const getPropertiesTitle = () => {
    return 'Properties';
  };

  const getPropertiesSections = () => {
    return [];
  };

  /**
   * LOGIC EXPORT VIDEO (Tiếng Việt)
   * ================================
   * 
   * Quy trình export video hoàn chỉnh:
   * 1. Thu thập tất cả timeline items từ các track
   * 2. Xử lý video chính (main video) với các ràng buộc duration
   * 3. Xử lý audio tracks (thêm, điều chỉnh volume, mute)
   * 4. Áp dụng trim settings nếu có
   * 5. Kết hợp tất cả thành video cuối cùng
   * 6. Tải xuống file cho người dùng
   * 
   * Đặc điểm của hệ thống export:
   * - Tất cả items bị giới hạn trong main video duration
   * - Audio tracks có thể được mix với nhau
   * - Volume và mute settings được áp dụng cho từng track
   * - Trim settings được áp dụng cho toàn bộ video cuối cùng
   * - Hỗ trợ multiple audio overlays
   */
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
      // Auto-save current timeline state before export
      setExportStage('Đang lưu timeline trước khi export...');
      showNotification('Đang lưu timeline hiện tại...', 'info');
      try {
        await handleSaveTimeline(true); // Silent save
        console.log('Debug Export - Timeline auto-saved before export');
      } catch (saveError) {
        console.warn('Failed to auto-save timeline before export:', saveError);
        // Continue with export even if save fails
      }
      setExportProgress(3);

      // Load saved timeline data first
      setExportStage('Đang tải trạng thái timeline đã lưu...');
      showNotification('Đang tải trạng thái timeline đã lưu...', 'info');
      const savedTimelineData = await loadSavedTimeline();
      setExportProgress(5);

      // Use saved data if available, otherwise use current state
      let effectiveTrimStart = trimStart;
      let effectiveTrimEnd = trimEnd;
      let effectiveVideoVolume = videoVolume;
      let currentTimeline = timelineState;

      console.log('Debug Export - Current state before loading saved data:', {
        currentTrimStart: trimStart,
        currentTrimEnd: trimEnd,
        currentVideoVolume: videoVolume,
        savedTimelineData: savedTimelineData ? 'Found' : 'Not found'
      });

      if (savedTimelineData) {
        // Sử dụng saved values, nhưng fallback về current state nếu saved values không có
        effectiveTrimStart = savedTimelineData.trimStart !== undefined ? savedTimelineData.trimStart : trimStart;
        effectiveTrimEnd = savedTimelineData.trimEnd !== undefined ? savedTimelineData.trimEnd : trimEnd;
        effectiveVideoVolume = savedTimelineData.videoVolume !== undefined ? savedTimelineData.videoVolume : videoVolume;
        
        console.log('Debug Export - Using saved timeline data:', {
          savedTrimStart: savedTimelineData.trimStart,
          savedTrimEnd: savedTimelineData.trimEnd,
          savedVideoVolume: savedTimelineData.videoVolume,
          effectiveTrimStart,
          effectiveTrimEnd,
          effectiveVideoVolume,
          fallbackUsed: {
            trimStart: savedTimelineData.trimStart === undefined,
            trimEnd: savedTimelineData.trimEnd === undefined,
            videoVolume: savedTimelineData.videoVolume === undefined
          }
        });
        
        showNotification(
          `Sử dụng timeline đã lưu: ${formatTime(effectiveTrimStart)} - ${formatTime(effectiveTrimEnd)}`,
          'success'
        );
        console.log('Using saved timeline data:', {
          trimStart: effectiveTrimStart,
          trimEnd: effectiveTrimEnd,
          trimmedDuration: effectiveTrimEnd - effectiveTrimStart,
          videoVolume: effectiveVideoVolume,
          lastSaved: savedTimelineData.lastSaved
        });
      } else {
        console.log('Debug Export - No saved timeline, using current state:', {
          currentTrimStart: trimStart,
          currentTrimEnd: trimEnd,
          currentVideoVolume: videoVolume
        });
        showNotification('Không tìm thấy timeline đã lưu, sử dụng trạng thái hiện tại', 'warning');
      }

      // Bước 1: Thu thập tất cả timeline items và processing steps
      setExportStage('Đang chuẩn bị export video...');
      showNotification('Đang chuẩn bị export video...', 'info');
      setExportProgress(10);

      const allItems: TimelineItem[] = [];
      const audioItems: TimelineItem[] = [];
      let mainVideoItem: TimelineItem | null = null;

      // Use saved timeline tracks if available, otherwise use current state
      const effectiveTimeline = savedTimelineData?.tracks || timelineState.tracks;
      
      console.log('Debug Export - Using timeline tracks:', {
        source: savedTimelineData ? 'saved' : 'current',
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

      // Bước 2: Luôn tạo fresh video processor cho export để đảm bảo tính chính xác
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

      // Bước 3: Áp dụng trim nếu có (dựa trên saved timeline hoặc state hiện tại)
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

      // Bước 4: Xử lý audio tracks
      if (audioItems.length > 0) {
        setExportStage(`Đang thêm ${audioItems.length} audio track(s)...`);
        showNotification(`Đang thêm ${audioItems.length} audio track(s)...`, 'info');
        
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

          // Thêm audio với volume và timing settings
          await videoProcessor.addProcessingStep({
            type: 'addAudio',
            params: {
              audioFile: audioFile,
              options: {
                volume: audioItem.volume || 1,
                startTime: audioItem.startTime,
                duration: audioItem.duration,
                replaceOriginalAudio: false, // Giữ audio gốc
                mixWithOriginal: true // Mix với audio hiện tại
              }
            }
          });

          // Cập nhật progress cho mỗi audio
          setExportProgress(50 + (i + 1) / audioItems.length * 30);
        }
      }

      // Bước 5: Tạo video cuối cùng
      setExportStage('Đang hoàn tất xử lý video...');
      showNotification('Đang hoàn tất xử lý video...', 'info');
      setExportProgress(70);

      const exportedVideo = videoProcessor.getCurrentVideo();
      if (!exportedVideo) {
        throw new Error('Không thể tạo video cuối cùng');
      }

      // Bước 6: Upload video lên server và cập nhật database
      setExportStage('Đang upload video lên server...');
      showNotification('Đang upload video lên server...', 'info');
      setExportProgress(80);

      // Chuẩn bị dữ liệu export
      const processingSteps = videoProcessor.getProcessingHistory();
      const timelineData = {
        tracks: effectiveTimeline, // Sử dụng effective timeline thay vì state hiện tại
        duration: videoDuration,
        trimStart: effectiveTrimStart, // Sử dụng effective trim values
        trimEnd: effectiveTrimEnd,     // Sử dụng effective trim values
        audioTracks: audioItems.map(item => ({
          id: item.id,
          url: item.url,
          volume: item.volume,
          startTime: item.startTime,
          duration: item.duration
        })),
        videoVolume: effectiveVideoVolume, // Sử dụng effective video volume
        exportTimestamp: new Date().toISOString()
      };

      // Upload video lên server
      const uploadResult = await videoExportService.uploadEditedVideo(
        exportedVideo.blob, // Sử dụng blob từ ProcessedVideo
        {
          originalVideoId: generatedVideo.id, // Sử dụng id thay vì _id
          title: `${generatedVideo.title} - Edited`,
          description: `Edited version of ${generatedVideo.title}`,
          processingSteps,
          timelineData
        }
      );

      setExportProgress(90);

      // Bước 7: Thông báo thành công và tùy chọn tải xuống
      setExportStage('Hoàn thành export video!');
      showNotification(
        `Video đã được export và lưu thành công! Video ID: ${uploadResult.video_id}`,
        'success'
      );

      // Hiển thị thông tin chi tiết về export
      console.log('Export completed with database update:', {
        originalVideoId: generatedVideo.id,
        newVideoId: uploadResult.video_id,
        videoUrl: uploadResult.video_url,
        processingSteps: processingSteps.length,
        audioTracksAdded: audioItems.length,
        trimApplied: effectiveTrimStart > 0 || effectiveTrimEnd < videoDuration, // Sử dụng effective values
        trimValues: { start: effectiveTrimStart, end: effectiveTrimEnd }, // Thêm trim values để debug
        originalVideoUpdated: uploadResult.original_video_updated,
        processingSummary: uploadResult.processing_summary
      });

      setExportProgress(100);

      // Show download confirmation modal
      const filename = `${generatedVideo.title.replace(/[^a-z0-9]/gi, '_')}_edited.mp4`;
      showDownloadConfirmation(filename, uploadResult.video_id);

      // Log thông tin export để debug
      console.log('Export completed:', {
        originalDuration: videoDuration,
        trimmedDuration: trimEnd - trimStart,
        audioTracksAdded: audioItems.length,
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

  /**
   * SAVE TIMELINE STATE
   * Save current timeline configuration including trim settings
   */
  const handleSaveTimeline = async (silent: boolean = false) => {
    if (!generatedVideo?.id) {
      if (!silent) showNotification('Không thể lưu - không có thông tin video!', 'error');
      return;
    }

    if (!silent) setIsSaving(true);
    
    try {
      // Log current trim state for debugging from CONTEXT
      console.log('Current trim state before save (FROM CONTEXT):', {
        trimStart,
        trimEnd,
        videoDuration,
        trimmedDuration: trimEnd - trimStart,
        isMainVideoTrimmed: trimStart > 0 || trimEnd < videoDuration
      });

      // Collect current timeline state
      const currentTimelineData = {
        tracks: timelineState.tracks,
        duration: videoDuration,
        trimStart,
        trimEnd,
        trimmedDuration: trimEnd - trimStart,
        videoVolume,
        audioTracks: timelineState.tracks
          .flatMap(track => track.items)
          .filter(item => item.type === 'audio')
          .map(item => ({
            id: item.id,
            url: item.url,
            volume: item.volume,
            startTime: item.startTime,
            duration: item.duration
          })),
        lastSaved: new Date().toISOString(),
        isMainVideoTrimmed: trimStart > 0 || trimEnd < videoDuration
      };

      // Save to server
      await videoExportService.saveEditSession({
        videoId: generatedVideo.id,
        timelineData: currentTimelineData
      });

      setLastSaved(new Date());
      showNotification(
        `Timeline đã được lưu! Trim: ${formatTime(trimStart)} - ${formatTime(trimEnd)} (${formatTime(trimEnd - trimStart)})`,
        'success'
      );

      console.log('Timeline saved:', {
        originalDuration: videoDuration,
        trimmedDuration: trimEnd - trimStart,
        trimStart,
        trimEnd,
        audioTracksCount: currentTimelineData.audioTracks.length
      });

    } catch (error) {
      console.error('Error saving timeline:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      if (!silent) showNotification(`Lỗi khi lưu timeline: ${errorMessage}`, 'error');
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  // Load saved timeline function
  const loadSavedTimeline = async () => {
    if (!generatedVideo?.id) return null;

    try {
      const savedSession = await videoExportService.getEditSession(generatedVideo.id);
      console.log('Debug - Raw saved session response:', savedSession);
      
      if (savedSession?.session_data?.timeline_data) {
        const timelineData = savedSession.session_data.timeline_data;
        console.log('Debug - Extracted timeline data:', timelineData);
        console.log('Debug - Timeline data trim values:', {
          trimStart: timelineData.trimStart,
          trimEnd: timelineData.trimEnd,
          videoVolume: timelineData.videoVolume,
          hasTracksData: !!timelineData.tracks
        });
        return timelineData;
      } else {
        console.log('Debug - No timeline_data found in session_data');
      }
    } catch (error) {
      console.warn('No saved timeline found, using current state:', error);
    }
    return null;
  };

  // Load saved timeline on component mount
  useEffect(() => {
    const loadSavedState = async () => {
      if (generatedVideo?.id && videoDuration > 0) {
        try {
          const savedData = await loadSavedTimeline();
          if (savedData) {
            // Restore saved trim settings
            if (savedData.trimStart !== undefined) {
              setTrimStart(savedData.trimStart);
            }
            if (savedData.trimEnd !== undefined) {
              setTrimEnd(savedData.trimEnd);
            }
            if (savedData.videoVolume !== undefined) {
              setVideoVolume(savedData.videoVolume);
            }
            
            showNotification(
              `Đã khôi phục timeline đã lưu: ${formatTime(savedData.trimStart || 0)} - ${formatTime(savedData.trimEnd || videoDuration)}`,
              'success'
            );
            console.log('Restored saved timeline:', savedData);
          }
        } catch (error) {
          console.log('No saved timeline to restore');
        }
      }
    };

    loadSavedState();
  }, [generatedVideo?.id, videoDuration]);

  return (
    <AudioTracksContextProvider value={{audioTracks:uploadedAudios,setAudioTracks:setUploadedAudios}}>
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
                {/* Save Timeline Button */}
                {videoUrl && !isExporting && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => handleSaveTimeline()}
                    disabled={isSaving}
                    className={`flex items-center space-x-2 text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                      isSaving 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-300'
                    }`}
                    title={lastSaved ? `Lần lưu cuối: ${lastSaved.toLocaleTimeString()}` : 'Lưu trạng thái timeline hiện tại'}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <FaSave className="w-3 h-3" />
                        <span>Save Timeline</span>
                      </>
                    )}
                  </motion.button>
                )}

                {/* Export Preview Button */}
                {videoUrl && !isExporting && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={showExportPreview}
                    className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    <FaCog className="w-3 h-3" />
                    <span>Preview Export</span>
                  </motion.button>
                )}

                {/* Export Video Button */}
                {videoUrl && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleExportVideo}
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

                {/* Download Original Button (for testing) */}
                {videoProcessor.getCurrentVideo() && !isExporting && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleDownloadOriginalVideo}
                    className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    <FaDownload className="w-3 h-3" />
                    <span>Tải Gốc</span>
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

              {/* Properties Panel or Media Library */}
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
              ) : (
                // Properties Panel for other tabs
                <PropertiesPanel
                  isOpen={isPropertiesPanelOpen && activeTab !== 'media'}
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
              <h3 className="text-lg font-semibold mb-4">Tải xuống video</h3>
              <p className="text-gray-600 mb-6">
                Video đã được export thành công! Bạn muốn tải xuống như thế nào?
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
                    <div>Tải xuống nhanh</div>
                    <div className="text-xs text-blue-100">Lưu vào thư mục Downloads</div>
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
                      Chọn vị trí lưu
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
                  Không tải xuống
                </button>
              </div>
              
              {/* File info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Tên file:</span>
                    <span className="font-medium">{downloadData.filename}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Định dạng:</span>
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
    </AudioTracksContextProvider>
  )
}

export default VideoEditor