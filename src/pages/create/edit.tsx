import { useRouter } from 'next/router'
import React, { useState, useRef, useEffect } from 'react'
import { GeneratedVideo } from '../../types/video'
import Sidebar from '@/components/features/VideoEditor/Sidebar'
import VideoPlayer from '@/components/features/VideoEditor/VideoPlayer'
import MultiTrackTimeline from '@/components/features/VideoEditor/MultiTrackTimeline'
import PropertiesPanel from '@/components/features/VideoEditor/PropertiesPanel'
import AudioProperties from '@/components/features/VideoEditor/AudioProperties'
import MediaLibrary from '@/components/features/VideoEditor/MediaLibrary'
import { AudioTrackData } from '@/types/audio'
import { FaRobot, FaVideo, FaMusic, FaCog, FaDownload, FaCut, FaUndo } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { videoProcessor } from '@/services/videoProcessor.service'
import { AudioTracksContextProvider, TrimVideoContextProvider } from '@/context/AudioTracks'
import { TimelineProvider, useTimelineContext } from '@/context/TimelineContext'

const VideoEditor: React.FC = () => {
  return (
    <TimelineProvider>
      <AudioTracksContextProvider value={{audioTracks:[],setAudioTracks:() => {}}}>
        <TrimVideoContextProvider value={{trimStart: 0, trimEnd: 0, setTrimStart: () => {}, setTrimEnd: () => {}}}>
          <VideoEditorContent />
        </TrimVideoContextProvider>
      </AudioTracksContextProvider>
    </TimelineProvider>
  )
}

const VideoEditorContent: React.FC = () => {
  const router = useRouter()
  const { addItemToTrack, timelineState, updateTrack } = useTimelineContext()
  const [activeTab, setActiveTab] = useState<'text' | 'media' | 'effects' | 'layers' | null>('media'); // Start with media tab
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);

  // Video processing state
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingBeyondVideo, setIsPlayingBeyondVideo] = useState(false); // Track if playing beyond video duration
  const [videoVolume, setVideoVolume] = useState(1); // Track video player volume
  const [isMuted, setIsMuted] = useState(false); // Global mute state for all tracks
  
  // Debug logging when videoVolume changes
  useEffect(() => {
    console.log('Debug - VideoVolume state changed to:', videoVolume);
  }, [videoVolume]);
  // Audio
  const [uploadedAudios, setUploadedAudios] = useState<AudioTrackData[]>([]);
  // Global media items state
  const [globalMediaItems, setGlobalMediaItems] = useState<any[]>([]);
  // Trim video state
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  // Track if main video has been added to timeline
  const [hasAddedMainVideo, setHasAddedMainVideo] = useState(false);
  // Timeline timer for content beyond video duration
  const timelineTimerRef = useRef<number | null>(null);
  const lastTimelineUpdateRef = useRef<number>(0);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const hiddenVideoElementsRef = useRef<{ [key: string]: HTMLVideoElement }>({});

  // Cleanup timeline timer on unmount
  useEffect(() => {
    return () => {
      if (timelineTimerRef.current) {
        cancelAnimationFrame(timelineTimerRef.current);
        timelineTimerRef.current = null;
      }
      // Cleanup audio elements
      Object.values(audioElementsRef.current).forEach(audio => {
        audio.pause();
      });
      audioElementsRef.current = {};
      
      // Cleanup hidden video elements
      Object.values(hiddenVideoElementsRef.current).forEach(video => {
        video.pause();
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      });
      hiddenVideoElementsRef.current = {};
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

  // Add main video to timeline and media library when video is loaded
  useEffect(() => {
    if (videoUrl && videoDuration > 0 && generatedVideo && !hasAddedMainVideo) {
      // Add video item to track-1 automatically
      const trackId = 'track-1';
      addItemToTrack(trackId, {
        type: 'video',
        name: generatedVideo.title,
        startTime: 0,
        duration: videoDuration,
        url: videoUrl,
        thumbnail: videoUrl,
        opacity: 1,
        volume: 1
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
        isMainVideo: true // Special flag to identify main video
      };
      setGlobalMediaItems(prev => [...prev, mainVideoMediaItem]);
      setHasAddedMainVideo(true);

      showNotification(`Đã thêm video chính "${generatedVideo.title}"`, 'success');
    }
  }, [videoUrl, videoDuration, generatedVideo, addItemToTrack, hasAddedMainVideo]);

  // Initialize trim end when video duration changes
  useEffect(() => {
    if (videoDuration > 0) {
      setTrimEnd(videoDuration);
    }
  }, [videoDuration]);

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
          
          if (item) {
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
        
        Object.keys(hiddenVideoElementsRef.current).forEach(itemId => {
          const item = timelineState.tracks
            .flatMap(t => t.items)
            .find(item => (item.id || '') === itemId);
          
          if (item) {
            const itemTrack = timelineState.tracks.find(t => 
              t.items.some(trackItem => trackItem.id === item.id)
            );
            if (itemTrack && itemTrack.id === trackId) {
              const video = hiddenVideoElementsRef.current[itemId];
              if (video && !video.paused) {
                fadeAudioVolume(video, 0, 100);
                setTimeout(() => video.pause(), 100);
              }
            }
          }
        });
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
    
    // If we're playing beyond video duration via timeline timer, don't update from video progress
    if (isPlayingBeyondVideo) {
      return;
    }
    
    // Find the last content end time on timeline
    const lastContentEndTime = findLastContentEndTime();
    
    console.log('Debug - Current time:', newTime, 'Last content end:', lastContentEndTime, 'Video duration:', videoDuration);
    
    // Preload timeline audio when approaching video duration (smoother transition)
    if (isPlaying && newTime >= videoDuration - 0.5 && lastContentEndTime > videoDuration) {
      preloadTimelineAudio(videoDuration);
    }
    
    // If video is about to reach its duration but timeline extends beyond, start timeline timer
    if (isPlaying && newTime >= videoDuration - 0.05 && lastContentEndTime > videoDuration) {
      console.log('Debug - Video reached duration limit, starting timeline timer...');
      // Set current time to video duration and start timeline timer
      setCurrentTime(videoDuration);
      startTimelineTimer(videoDuration, lastContentEndTime);
      return;
    }
    
    // Check if we've reached the end of all content
    if (isPlaying && newTime >= lastContentEndTime - 0.1) {
      console.log('Debug - Reached end of all content, pausing...');
      setCurrentTime(lastContentEndTime);
      setIsPlaying(false);
      return;
    }
    
    // Check if current time has any content on timeline
    const hasContentAtCurrentTime = hasContentAtTime(newTime);
    
    // Only pause for no content if we're within video duration
    if (isPlaying && !hasContentAtCurrentTime && newTime < videoDuration) {
      console.log('Debug - No content at current time (within video duration), pausing...');
      setIsPlaying(false);
    }
    
    setCurrentTime(newTime);
  };

  const startTimelineTimer = (startTime: number, endTime: number) => {
    console.log('Debug - Starting timeline timer from', startTime, 'to', endTime);
    
    // Clear existing timer
    if (timelineTimerRef.current) {
      cancelAnimationFrame(timelineTimerRef.current);
    }
    
    // Set flag that we're playing beyond video duration
    setIsPlayingBeyondVideo(true);
    
    // Start timeline audio immediately for seamless transition
    playTimelineAudio(startTime);
    
    let currentTimelineTime = startTime;
    lastTimelineUpdateRef.current = performance.now();
    
    const updateTimeline = (currentFrameTime: number) => {
      const deltaTime = (currentFrameTime - lastTimelineUpdateRef.current) / 1000; // Convert to seconds
      lastTimelineUpdateRef.current = currentFrameTime;
      
      currentTimelineTime += deltaTime;
      
      if (currentTimelineTime >= endTime) {
        console.log('Debug - Timeline timer reached end, pausing...');
        setCurrentTime(endTime);
        setIsPlaying(false);
        setIsPlayingBeyondVideo(false);
        stopTimelineAudio();
        timelineTimerRef.current = null;
        return;
      }
      
      // Check if there's any content at current timeline time
      const hasContent = hasContentAtTime(currentTimelineTime);
        
      if (!hasContent) {
        console.log('Debug - Timeline timer: no content at', currentTimelineTime, ', pausing...');
        setIsPlaying(false);
        setIsPlayingBeyondVideo(false);
        stopTimelineAudio();
        timelineTimerRef.current = null;
        return;
      }
      
      // Play audio for current timeline time (with smoothing)
      playTimelineAudio(currentTimelineTime);
      
      console.log('Debug - Timeline timer progress:', currentTimelineTime);
      setCurrentTime(currentTimelineTime);
      
      // Continue the animation loop
      timelineTimerRef.current = requestAnimationFrame(updateTimeline);
    };
    
    // Start the animation loop
    timelineTimerRef.current = requestAnimationFrame(updateTimeline);
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

  // Get audio items that should be playing at specific time
  const getAudioItemsAtTime = (time: number) => {
    return timelineState.tracks.flatMap(track => 
      track.items.filter(item => 
        (item.type === 'audio' || (item.type === 'video' && item.url)) && 
        time >= item.startTime && 
        time <= (item.startTime + item.duration)
      )
    );
  };

  // Preload timeline audio for smoother transition
  const preloadTimelineAudio = (targetTime: number) => {
    const audioItems = getAudioItemsAtTime(targetTime);
    console.log('Debug - Preloading timeline audio for time:', targetTime, 'items:', audioItems.length);
    
    audioItems.forEach(item => {
      const itemId = item.id || '';
      
      if (item.type === 'video' && item.url) {
        // Preload video element but don't play yet
        if (!hiddenVideoElementsRef.current[itemId]) {
          console.log('Debug - Preloading hidden video element for item:', itemId);
          const video = document.createElement('video');
          video.src = item.url;
          const finalVolume = (item.volume || 1) * videoVolume;
          video.volume = 0; // Start with 0 volume for smooth fade in
          video.style.display = 'none';
          video.muted = false;
          video.preload = 'auto'; // Aggressive preload for smoother transition
          document.body.appendChild(video);
          hiddenVideoElementsRef.current[itemId] = video;
          
          // Seek to the exact position we'll need
          const itemTime = targetTime - item.startTime;
          video.currentTime = itemTime;
          console.log('Debug - Preloaded video at time:', itemTime, 'target volume:', finalVolume);
        }
      } else if (item.type === 'audio' && item.url) {
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
  };

  // Play audio items for timeline beyond video duration
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
      
      if (item.type === 'audio') {
        // Handle pure audio items
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
      } else if (item.type === 'video' && item.url) {
        // Handle video items with embedded audio using hidden video element
        if (!hiddenVideoElementsRef.current[itemId]) {
          console.log('Debug - Creating hidden video element for item:', itemId, item.url);
          const video = document.createElement('video');
          video.src = item.url;
          const finalVolume = (isMuted || isTrackMuted) ? 0 : (item.volume || 1) * trackVolume * videoVolume;
          video.volume = finalVolume;
          video.style.display = 'none';
          video.muted = false;
          video.preload = 'auto';
          document.body.appendChild(video);
          hiddenVideoElementsRef.current[itemId] = video;
          console.log('Debug - Created hidden video element with volume:', finalVolume,
            'item volume:', item.volume, 'track volume:', trackVolume, 'video volume:', videoVolume,
            'global muted:', isMuted, 'track muted:', isTrackMuted);
        }
        
        const video = hiddenVideoElementsRef.current[itemId];
        if (video) {
          // Ensure volume is updated (in case volume/mute state changed)
          const finalVolume = (isMuted || isTrackMuted) ? 0 : (item.volume || 1) * trackVolume * videoVolume;
          video.volume = finalVolume;
          
          const itemTime = currentTime - item.startTime;
          console.log('Debug - Playing hidden video at time:', itemTime, 'for item:', itemId, 'with volume:', finalVolume);
          // Use smaller threshold for smoother seeking (0.1s instead of 0.2s)
          if (Math.abs(video.currentTime - itemTime) > 0.1) {
            video.currentTime = itemTime;
          }
          
          if (video.paused && !isMuted && !isTrackMuted) {
            video.play().then(() => {
              // Fade in for smooth transition (only if not muted)
              if (finalVolume > 0) {
                fadeAudioVolume(video, finalVolume, 150);
              }
            }).catch(err => {
              console.error('Debug - Error playing hidden video:', err);
            });
          } else if (!video.paused && (isMuted || isTrackMuted)) {
            // Pause if muted
            fadeAudioVolume(video, 0, 100);
            setTimeout(() => video.pause(), 100);
          } else if (!video.paused) {
            // Gradually adjust volume if already playing
            if (Math.abs(video.volume - finalVolume) > 0.05) {
              fadeAudioVolume(video, finalVolume, 100);
            }
          }
        }
      }
    });
    
    // Stop audio items that shouldn't be playing
    Object.keys(audioElementsRef.current).forEach(itemId => {
      const isCurrentlyPlaying = audioItems.some(item => (item.id || '') === itemId && item.type === 'audio');
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
    
    // Stop video items that shouldn't be playing (but keep them in memory for smoother transitions)
    Object.keys(hiddenVideoElementsRef.current).forEach(itemId => {
      const isCurrentlyPlaying = audioItems.some(item => (item.id || '') === itemId && item.type === 'video');
      if (!isCurrentlyPlaying) {
        const video = hiddenVideoElementsRef.current[itemId];
        if (video && !video.paused) {
          // Fade out before pausing
          fadeAudioVolume(video, 0, 100);
          setTimeout(() => {
            if (!video.paused) {
              video.pause();
            }
          }, 100);
        }
        // Don't remove from DOM immediately - keep for potential reuse
      }
    });
  };

  // Stop all timeline audio
  const stopTimelineAudio = () => {
    Object.values(audioElementsRef.current).forEach(audio => {
      if (!audio.paused) {
        audio.pause();
      }
    });
    
    Object.values(hiddenVideoElementsRef.current).forEach(video => {
      if (!video.paused) {
        video.pause();
      }
      // Remove from DOM when stopping
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
    });
    hiddenVideoElementsRef.current = {};
  };

  // Update volume for all timeline audio elements
  const updateTimelineAudioVolume = (newVolume: number) => {
    console.log('Debug - Updating timeline audio volume to:', newVolume, 'global muted:', isMuted);
    
    // Update audio elements volume
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
      
      if (item && track) {
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
    
    // Update hidden video elements volume
    Object.keys(hiddenVideoElementsRef.current).forEach(itemId => {
      const video = hiddenVideoElementsRef.current[itemId];
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
      
      if (item && track) {
        const itemVolume = item.volume || 1;
        const trackVolume = track.volume || 1;
        const isTrackMuted = track.isMuted || false;
        const finalVolume = (isMuted || isTrackMuted) ? 0 : itemVolume * trackVolume * newVolume;
        
        video.volume = finalVolume;
        console.log('Debug - Updated hidden video element', itemId, 'volume to:', finalVolume,
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
    const allItems = timelineState.tracks.flatMap(track => track.items);
    if (allItems.length === 0) return videoDuration;
    
    const lastEndTime = allItems.reduce((latest, item) => {
      const itemEndTime = item.startTime + item.duration;
      return itemEndTime > latest ? itemEndTime : latest;
    }, 0);
    
    return lastEndTime;
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
    const currentHasContent = hasContentAtTime(currentTime);
    const lastContentEndTime = findLastContentEndTime();
    
    console.log('Debug - handlePlay: currentTime=', currentTime, 'hasContent=', currentHasContent, 'videoDuration=', videoDuration, 'lastContentEnd=', lastContentEndTime);
    
    // If at or past the end of all content, seek to first content
    if (currentTime >= lastContentEndTime - 0.05) {
      console.log('Debug - At end of content, seeking to first content');
      const firstContentTime = findFirstContentTime();
      handleSeek(firstContentTime);
      setTimeout(() => setIsPlaying(true), 100);
      return;
    }
    
    // If no content at current time, seek to next content
    if (!currentHasContent) {
      console.log('Debug - No content at current time, seeking to next');
      const nextContentTime = findNextContentTime(currentTime);
      if (nextContentTime !== null) {
        handleSeek(nextContentTime);
        setTimeout(() => setIsPlaying(true), 100);
        return;
      } else {
        // No content ahead, seek to first content
        const firstContentTime = findFirstContentTime();
        handleSeek(firstContentTime);
        setTimeout(() => setIsPlaying(true), 100);
        return;
      }
    }
    
    // Special case: if current time is beyond video duration but has content
    if (currentTime >= videoDuration && currentHasContent) {
      console.log('Debug - Playing beyond video duration, starting timeline timer');
      startTimelineTimer(currentTime, lastContentEndTime);
      setIsPlaying(true);
      return;
    }
    
    // Has content at current time, play normally
    console.log('Debug - Playing normally');
    setIsPlaying(true);
  };
  
  const findNextContentTime = (fromTime: number): number | null => {
    const allItems = timelineState.tracks.flatMap(track => track.items);
    const upcomingItems = allItems
      .filter(item => item.startTime > fromTime)
      .sort((a, b) => a.startTime - b.startTime);
    
    return upcomingItems.length > 0 ? upcomingItems[0].startTime : null;
  };

  const handlePause = () => {
    setIsPlaying(false);
    setIsPlayingBeyondVideo(false);
    stopTimelineAudio();
    // Clear timeline timer when pausing
    if (timelineTimerRef.current) {
      cancelAnimationFrame(timelineTimerRef.current);
      timelineTimerRef.current = null;
    }
  };
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    
    // Clear any existing timeline timer and beyond video flag
    if (timelineTimerRef.current) {
      cancelAnimationFrame(timelineTimerRef.current);
      timelineTimerRef.current = null;
    }
    setIsPlayingBeyondVideo(false);
    stopTimelineAudio();
    
    // If seeking beyond video duration, keep video at its end and don't seek
    if (time >= videoDuration) {
      console.log('Debug - Seeking beyond video duration, keeping video at end');
      // Don't seek the video player, just keep it at the end
      // Video player will stay at the last frame
      if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
        videoPlayerRef.current.seekTo(videoDuration - 0.1);
      }
    } else {
      // Normal seek within video duration
      if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
        videoPlayerRef.current.seekTo(time);
      }
    }
  };
  const handleSkipBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    handleSeek(newTime);
  };
  const handleSkipForward = () => {
    const lastContentEndTime = findLastContentEndTime();
    const maxDuration = Math.max(videoDuration, lastContentEndTime);
    const newTime = Math.min(maxDuration, currentTime + 10);
    handleSeek(newTime);
  };

  // Video save handler
  const videoPlayerRef = useRef<any>(null);
  const handleSaveVideo = () => {
    if (videoPlayerRef.current && videoPlayerRef.current.handleSaveVideo) {
      videoPlayerRef.current.handleSaveVideo();
    }
  };

  // Download current video
  const handleDownloadVideo = () => {
    try {
      videoProcessor.downloadCurrentVideo("AI-Video.mp4");
      showNotification('Video đã được tải xuống!', 'success');
    } catch (error) {
      console.error('Error downloading video:', error);
      showNotification('Lỗi khi tải video', 'error');
    }
  };

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const notification = document.createElement('div');
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      warning: 'bg-yellow-500'
    }[type];
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-in`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  };
  const getPropertiesSections = () => {
    switch (activeTab) {
      case 'text':
        return [
          {
            id: 'text-overlay',
            title: 'Thêm Text Overlay',
            icon: <FaRobot className="w-4 h-4" />,
            content: (
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <FaRobot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-2">Coming Soon</p>
                  <p className="text-xs text-gray-400">
                    Tính năng thêm text overlay sẽ được phát triển trong phiên bản tiếp theo
                  </p>
                </div>
              </div>
            ),
            defaultExpanded: true
          }
        ];

      case 'media':
        return [
          {
            id: 'media-library',
            title: 'Thư Viện Media',
            icon: <FaVideo className="w-4 h-4" />,
            content: (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Hướng dẫn sử dụng:</h4>
                  <ul className="text-blue-800 space-y-1 text-xs">
                    <li>• Upload hình ảnh, video, audio vào thư viện</li>
                    <li>• Kéo thả bất kỳ media nào vào bất kỳ track nào</li>
                    <li>• Tracks chỉ là để tổ chức, không giới hạn loại media</li>
                    <li>• Có thể resize, ẩn/hiện, lock/unlock tracks</li>
                  </ul>
                </div>
                <MediaLibrary
                  mediaItems={globalMediaItems}
                  setMediaItems={setGlobalMediaItems}
                  showHeader={false}
                  onAddMedia={(media) => {
                    // Handle adding media to timeline
                    console.log('Added media:', media);
                    showNotification(`Đã thêm ${media.name} vào thư viện media`, 'success');
                  }}
                  onDeleteMedia={handleDeleteMedia}
                  showNotification={showNotification}
                />
              </div>
            ),
            defaultExpanded: true
          }
        ];
      
      default:
        return [];
    }
  };

  const getPropertiesTitle = () => {
    switch (activeTab) {
      case 'text':
        return 'Chỉnh Sửa Text';
      case 'media':
        return 'Thư Viện Media';
      case 'effects':
        return 'Hiệu Ứng';
      case 'layers':
        return 'Quản Lý Layers';
      default:
        return 'Thuộc Tính';
    }
  };

  // Handle delete media
  const handleDeleteMedia = (mediaId: string) => {
    const mediaItem = globalMediaItems.find(item => item.id === mediaId);
    if (mediaItem && mediaItem.isMainVideo) {
      showNotification('Không thể xóa video chính!', 'warning');
      return;
    }
    setGlobalMediaItems(prevItems => prevItems.filter(item => item.id !== mediaId));
    showNotification('Media đã được xóa thành công', 'success');
  };

  return (
    <AudioTracksContextProvider value={{audioTracks:uploadedAudios,setAudioTracks:setUploadedAudios}}>
      <TrimVideoContextProvider value={{trimStart, trimEnd, setTrimStart, setTrimEnd}}>
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
                {/* Download button */}
                {videoProcessor.getCurrentVideo() && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleDownloadVideo}
                    className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <FaDownload className="w-3 h-3" />
                    <span>Tải Video</span>
                  </motion.button>
                )}
              </div>
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
                      onVolumeChange={setVideoVolume}
                      isMuted={isMuted}
                      onToggleMute={handleToggleGlobalMute}
                      isMainVideoTrackMuted={isMainVideoTrackMuted()}
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
                duration={Math.max(videoDuration, findLastContentEndTime())}
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
              />
            </div>
          </div>
        </div>
      </TrimVideoContextProvider>
    </AudioTracksContextProvider>
  )
}

export default VideoEditor