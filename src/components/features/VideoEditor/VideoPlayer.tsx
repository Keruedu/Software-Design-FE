import React,{useState,useRef,useEffect,forwardRef,useImperativeHandle,useCallback} from 'react';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { FaPlay, FaPause,FaBackward,FaForward, FaRegSave, FaVolumeUp, FaVolumeMute, FaVolumeDown } from 'react-icons/fa';
import { videoProcessor } from '@/services/videoProcessor.service';
import { ffmpegService } from '@/services/editVideo.service';
import { useAudioTracksContext } from '@/context/AudioTracks';
import { useTimelineContext } from '@/context/TimelineContext';
import { useTextOverlayContext } from '@/context/TextOverlayContext';
import { useStickerContext } from '@/context/StickerContext';
import { audioManager } from '@/services/audioManager';
import { AudioTrackData } from '@/types/audio';
import TextOverlay from './TextOverlay';
import StickerOverlay from './StickerOverlay';

interface VideoPlayerProps {
    videoUrl: string;
    onDuration: (duration: number) => void;
    onProgress: (progress: { playedSeconds: number }) => void;
    isPlaying?: boolean;
    onPlay?: () => void;
    onPause?: () => void;
    onSeek?: (direction: 'forward' | 'backward') => void;
    currentTime?: number;
    volume?: number;
    onVolumeChange?: (volume: number) => void;
    isMuted?: boolean;
    onToggleMute?: () => void;
    isMainVideoTrackMuted?: boolean; 
    trimStart?: number;
    trimEnd?: number;
    setVideoSize?: (size: { width: number; height: number }) => void; 
}



const VideoPlayer = forwardRef<any, VideoPlayerProps>(({
    videoUrl,
    onDuration,
    onProgress,
    isPlaying: externalIsPlaying = false,
    onPlay,
    onPause,
    onSeek: externalOnSeek,
    currentTime: externalCurrentTime = 0,
    volume: externalVolume = 1, 
    onVolumeChange,
    isMuted = false,
    onToggleMute,
    isMainVideoTrackMuted = false,
    trimStart = 0,
    trimEnd = 0,
    setVideoSize: setExternalVideoSize = () => {},
}, ref) => {
useEffect(()=>{
    const initializeFFmpeg = async () => {
        try {
            await ffmpegService.initialize();
        } catch (error) {
            console.error('Failed to initialize FFmpeg:', error);
        }
    };
    initializeFFmpeg();
},[])

const { audioTracks, setAudioTracks } = useAudioTracksContext();
const { timelineState } = useTimelineContext();
const { 
    state: { textOverlays }, 
    startEditing, 
    stopEditing,
    getTextOverlayAtTime 
} = useTextOverlayContext();
const { 
    state: { stickerOverlays }, 
    getStickerOverlayAtTime,
    selectStickerOverlay,
    setVideoSize: setStickerVideoSize 
} = useStickerContext();
const [isPlaying, setIsPlaying] = useState(externalIsPlaying)
const [duration, setDuration] = useState(0)
const [currentTime, setCurrentTime] = useState(0)
const [videoContainerRef, setVideoContainerRef] = useState<HTMLDivElement | null>(null)
const [videoSize, setVideoSize] = useState({ width: 360, height: 640 }) // Default to vertical display size
const playerRef = useRef<ReactPlayer>(null)
const[isProcessing, setIsProcessing] = useState(false);
const [url, setUrl] = useState(videoUrl);
const [forceUpdate, setForceUpdate] = useState(true)
const [originalVideoSize, setOriginalVideoSize] = useState({ width: 720, height: 1280 }); // Default to vertical video
const audioItems = timelineState.tracks.flatMap(track => 
    track.items.filter(item => item.type === 'audio')
);

useEffect(() => {
  setUrl(videoUrl);
  
  // Initialize sticker context with default video size
  setStickerVideoSize({ width: 720, height: 1280 });
}, [videoUrl, setStickerVideoSize]);

// Sync external playing state and manage audio playback
useEffect(() => {
    setIsPlaying(externalIsPlaying);
    
    if (externalIsPlaying) {
        audioManager.play(currentTime, audioItems, timelineState.tracks);
        
        // Sync mute states with audio manager
        timelineState.tracks.forEach(track => {
            if (track.isMuted) {
                audioManager.muteTrack(track.id);
            } else {
                audioManager.unmuteTrack(track.id);
            }
        });
    } else {
        audioManager.pause();
    }
}, [externalIsPlaying, currentTime, audioItems, timelineState.tracks.map(t => t.isMuted).join(',')]); // Added track mute dependency

// Update audio items when timeline changes
useEffect(() => {
    audioManager.updateAudioItems(audioItems);
}, [audioItems]);

// Sync track mute states with audio manager
useEffect(() => {
    timelineState.tracks.forEach(track => {
        if (track.isMuted) {
            audioManager.muteTrack(track.id);
        } else {
            audioManager.unmuteTrack(track.id);
        }
    });
    // Update all audio volumes to reflect mute changes
    audioManager.updateAllAudioVolumes(audioItems, timelineState.tracks);
}, [timelineState.tracks.map(t => t.isMuted).join(','), audioItems]);

// Log when main video track mute state changes
useEffect(() => {
    // console.log('Debug - VideoPlayer main video track mute state:', isMainVideoTrackMuted, 'global mute:', isMuted);
    // console.log('Debug - Final video volume will be:', (isMuted || isMainVideoTrackMuted) ? 0 : externalVolume);
}, [isMainVideoTrackMuted, isMuted, externalVolume]);

// Sync external currentTime to video player and audio
useEffect(() => {
    if (playerRef.current && Math.abs(currentTime - externalCurrentTime) > 0.5) {
        playerRef.current.seekTo(externalCurrentTime, 'seconds');
        audioManager.seekTo(externalCurrentTime, audioItems, timelineState.tracks);
    }
}, [externalCurrentTime, audioItems]); // Removed timelineState.tracks dependency

// Debug logging for external volume changes
useEffect(() => {
    // console.log('Debug - VideoPlayer received external volume:', externalVolume);
}, [externalVolume]);

// Update video container size when video loads
useEffect(() => {
    if (videoContainerRef && playerRef.current) {
        const updateSize = () => {
            const playerElement = playerRef.current?.getInternalPlayer();
            if (playerElement && playerElement.videoWidth && playerElement.videoHeight) {
                const containerRect = videoContainerRef.getBoundingClientRect();
                const videoAspectRatio = playerElement.videoWidth / playerElement.videoHeight;
                const containerAspectRatio = containerRect.width / containerRect.height;
                
                let videoWidth, videoHeight;
                if (videoAspectRatio > containerAspectRatio) {
                    videoWidth = containerRect.width;
                    videoHeight = containerRect.width / videoAspectRatio;
                } else {
                    videoHeight = containerRect.height;
                    videoWidth = containerRect.height * videoAspectRatio;
                }
                
                // Update sizes in multiple places
                const originalVideoSize = { width: playerElement.videoWidth, height: playerElement.videoHeight };
                setExternalVideoSize(originalVideoSize);
                setStickerVideoSize(originalVideoSize); // Keep sticker context updated
                setVideoSize({ width: videoWidth, height: videoHeight });
            }
        };
        
        updateSize();
        window.addEventListener('resize', updateSize);
        
        return () => window.removeEventListener('resize', updateSize);
    }
}, [videoContainerRef, url]);

// Handle text overlay double click for editing
const handleTextOverlayDoubleClick = useCallback((textId: string) => {
    startEditing(textId);
}, [startEditing]);
const handleReady = () => {
    if (videoContainerRef && playerRef.current) {
        const playerElement = playerRef.current.getInternalPlayer();
        if (playerElement && playerElement.videoWidth && playerElement.videoHeight) {
            const videoSize = { 
                width: playerElement.videoWidth, 
                height: playerElement.videoHeight 
            };
            
            setExternalVideoSize(videoSize);
            setOriginalVideoSize(videoSize);
            setStickerVideoSize(videoSize);
            
            console.log('VideoPlayer: Video ready with size:', videoSize);
        }
    }
};
// Get visible text overlays for current time
const visibleTextOverlays = getTextOverlayAtTime(currentTime);

// Get visible sticker overlays for current time
const visibleStickerOverlays = getStickerOverlayAtTime(currentTime);

// Handle sticker overlay click
const handleStickerOverlayClick = useCallback((stickerId: string) => {
    selectStickerOverlay(stickerId);
}, [selectStickerOverlay]);

// Handle text overlay processing
const addTextOverlayToVideo = async () => {
    try {
        for (const textOverlay of textOverlays) {
            const result = await videoProcessor.addProcessingStep({
                type: 'addTextOverlay',
                params: {
                    text: textOverlay.text,
                    position: textOverlay.position,
                    style: textOverlay.style,
                    timing: textOverlay.timing,
                    size: textOverlay.size,
                    opacity: textOverlay.opacity,
                    shadow: textOverlay.shadow,
                    outline: textOverlay.outline,
                    background: textOverlay.background,
                }
            });
        }
    } catch (error) {
        console.error('Error adding text overlays to video:', error);
    }
};

// Expose methods to parent component
useImperativeHandle(ref, () => ({
    handleSaveVideo,
    seekTo: (time: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(time, 'seconds');
        }
    }
}));

const handleSeek = (typeSeek:string) => {
    if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        if(typeSeek === 'forward') {
            playerRef.current.seekTo(Math.min(duration -0.1, currentTime + 10), 'seconds');
        }
        else if(typeSeek === 'backward') {
        playerRef.current.seekTo(Math.max(0, currentTime - 10), 'seconds');
    }
    }
}
const handlDuration=(duration:number)=>{
    setDuration(duration);
    onDuration(duration);
}
const handleProgress = (progress: { playedSeconds: number }) => {
    const currentTime = progress.playedSeconds;
    
    // Check if playback is outside trim boundaries
    if (trimEnd > 0 && currentTime >= trimEnd) {
        // Stop playback when reaching trim end
        setIsPlaying(false);
        if (onPause) onPause();
        
        // Seek back to trim end to prevent overshoot
        if (playerRef.current) {
            playerRef.current.seekTo(trimEnd, 'seconds');
        }
        
        // Update progress with trim end time
        setCurrentTime(trimEnd);
        onProgress({ playedSeconds: trimEnd });
        return;
    }
    
    // Normal progress update
    setCurrentTime(currentTime);
    onProgress(progress);
    
    // Only sync audio playback with video progress if there are audio items
    // Don't call audioManager.play() continuously to avoid interference
};
const handleTimelineSeek = (time: number) => {
    if (playerRef.current) {
        playerRef.current.seekTo(time, 'seconds');
        audioManager.seekTo(time, audioItems, timelineState.tracks);
    }
};
const trimVideo = async () => {
        if(!videoUrl)return;
        setIsProcessing(true);
        try{
            const result = await videoProcessor.addProcessingStep
            ({
                type: 'trim',
                params: {
                    startTime: trimStart,
                    endTime: trimEnd
                },
            });
            
            // Trim values are now managed by parent component via props
        }
        catch (error) {
            console.error('Error trimming video:', error);
        } finally {
            setIsProcessing(false);
        }
    }

const addAudioToVideo = async () => {
  try {
    for (const track of audioTracks) {
      const result = await videoProcessor.addProcessingStep({
        type: 'addAudio',
        params: {
          audioFile: track.file,
          options: {
            audioVolume: track.volume,
            audioStartTime: track.startTime,
            replaceOriginalAudio: false
          }
        }
      });
    }
  } catch (error) {
    console.error('Error adding audio to video:', error);
  }
};

const trimAudio = async () => {
    try {
        const updatedTracks: AudioTrackData[] = [];
        for (const track of audioTracks) {
            if (track.trimStart !== 0 || track.trimEnd !== track.duration) {
                // Trim audio if needed
                const result = await ffmpegService.trimAudio(
                    track.file,
                    track.trimStart,
                    track.trimEnd
                );
                const duration =track.trimEnd - track.trimStart;
                updatedTracks.push({ ...track, file: result,duration :duration,trimStart: 0, trimEnd: duration });
            } else {
                updatedTracks.push(track);
            }
        }
        setAudioTracks(updatedTracks);
    } catch (error) {
        console.error('Error trimming audio:', error);
        alert('Failed to trim audio. Please try again.');
    }
};


const handleSaveVideo = async () => {
    await trimVideo();
    await trimAudio();
    await addAudioToVideo();
    await addTextOverlayToVideo();
    setForceUpdate(!forceUpdate);
    const currentVideo = videoProcessor.getCurrentVideo();
    if (!currentVideo) {
        console.error('No current video available');
        return;
    }
    setUrl(currentVideo.url);
}

// Cleanup effect  
useEffect(() => {
    return () => {
        if (playerRef.current) {
            setIsPlaying(false);
            // Pause tất cả media elements
            const allVideos = document.querySelectorAll('video');
            const allAudios = document.querySelectorAll('audio');
            allVideos.forEach(video => video.pause());
            allAudios.forEach(audio => audio.pause());
        }
        
        // Cleanup audio manager
        audioManager.dispose();
    };
}, []);
    return(
        <div className="bg-black rounded-lg overflow-hidden shadow-lg h-full flex flex-col">
            <div 
                ref={setVideoContainerRef}
                className="flex-1 relative min-h-0"
            >
                <ReactPlayer
                    onReady={handleReady}
                    ref ={playerRef}
                    url={ url}
                    playing={isPlaying}
                    onProgress={handleProgress}
                    onDuration={handlDuration}
                    width="100%"
                    height="100%"
                    volume={(isMuted || isMainVideoTrackMuted) ? 0 : externalVolume}
                    progressInterval={100}
                    loop={false}
                    onEnded={() => setIsPlaying(false)}
                    config={{
                        file: {
                            attributes: {
                                preload: 'metadata',
                                controlsList: 'nodownload noremoteplayback',
                                disablePictureInPicture: true
                            }
                        }
                    }}
                    stopOnUnmount={true}
                />
                
                {/* Text Overlays */}
                {visibleTextOverlays.map((textOverlay) => (
                    <TextOverlay
                        key={textOverlay.id}
                        overlay={textOverlay}
                        currentTime={currentTime}
                        videoWidth={videoSize.width}
                        videoHeight={videoSize.height}
                        originalVideoSize={originalVideoSize}
                        onDoubleClick={handleTextOverlayDoubleClick}
                    />
                ))}

                {/* Sticker Overlays - Always render with fallback positioning */}
                {videoContainerRef && (
                    <div
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{
                            width: videoSize.width > 0 ? videoSize.width : 360,
                            height: videoSize.height > 0 ? videoSize.height : 640,
                            transform: videoContainerRef ? `translate(${(videoContainerRef.getBoundingClientRect().width - (videoSize.width > 0 ? videoSize.width : 360)) / 2}px, ${(videoContainerRef.getBoundingClientRect().height - (videoSize.height > 0 ? videoSize.height : 640)) / 2}px)` : 'none',
                            zIndex: 10
                        }}
                    >
                        {visibleStickerOverlays.map((stickerOverlay) => {
                            console.log('Rendering sticker overlay in video bounds:', {
                                stickerId: stickerOverlay.id,
                                stickerName: stickerOverlay.stickerName,
                                position: stickerOverlay.position,
                                stickerSize: stickerOverlay.size,
                                videoDisplaySize: { width: videoSize.width, height: videoSize.height },
                                originalVideoSize: originalVideoSize,
                                containerSize: videoContainerRef ? {
                                    width: videoContainerRef.getBoundingClientRect().width,
                                    height: videoContainerRef.getBoundingClientRect().height
                                } : null
                            });
                            
                            return (
                                <StickerOverlay
                                    key={stickerOverlay.id}
                                    overlay={stickerOverlay}
                                    currentTime={currentTime}
                                    videoWidth={videoSize.width > 0 ? videoSize.width : 360}
                                    videoHeight={videoSize.height > 0 ? videoSize.height : 640}
                                    originalVideoSize={originalVideoSize}
                                    onClick={handleStickerOverlayClick}
                                />
                            );
                        })}
                    </div>
                )}
                
            </div>
        </div>
    )
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;



