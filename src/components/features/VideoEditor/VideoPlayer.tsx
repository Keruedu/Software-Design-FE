import React,{useState,useRef,useEffect,forwardRef,useImperativeHandle,useCallback} from 'react';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { FaPlay, FaPause,FaBackward,FaForward, FaRegSave, FaVolumeUp, FaVolumeMute, FaVolumeDown } from 'react-icons/fa';
import { videoProcessor } from '@/services/videoProcessor.service';
import { ffmpegService } from '@/services/editVideo.service';
import { useAudioTracksContext } from '@/context/AudioTracks';
import { useTimelineContext } from '@/context/TimelineContext';
import { useTextOverlayContext } from '@/context/TextOverlayContext';
import { audioManager } from '@/services/audioManager';
import { AudioTrackData } from '@/types/audio';
import TextOverlay from './TextOverlay';

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
const [isPlaying, setIsPlaying] = useState(externalIsPlaying)
const [duration, setDuration] = useState(0)
const [currentTime, setCurrentTime] = useState(0)
const [videoContainerRef, setVideoContainerRef] = useState<HTMLDivElement | null>(null)
const [videoSize, setVideoSize] = useState({ width: 0, height: 0 })
const playerRef = useRef<ReactPlayer>(null)
const[isProcessing, setIsProcessing] = useState(false);
const [url, setUrl] = useState(videoUrl);
const [forceUpdate, setForceUpdate] = useState(true)

const audioItems = timelineState.tracks.flatMap(track => 
    track.items.filter(item => item.type === 'audio')
);

useEffect(() => {
  setUrl(videoUrl);
}, [videoUrl]);

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
    console.log('Debug - VideoPlayer syncing track mute states:', timelineState.tracks.map(t => ({ id: t.id, isMuted: t.isMuted })));
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

// Notify parent about volume changes - Remove this since we're using external volume
// The parent controls the volume state now

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

// Get visible text overlays for current time
const visibleTextOverlays = getTextOverlayAtTime(currentTime);

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
        <div className="bg-white rounded-lg overflow-hidden shadow-lg h-full flex flex-col">
            <div 
                ref={setVideoContainerRef}
                className="flex-1 relative min-h-0 py-2"
            >
                <ReactPlayer
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
                        onDoubleClick={handleTextOverlayDoubleClick}
                    />
                ))}
                
            </div>
            {/* Video Control - Disabled (chỉ hiển thị) */}
            {/* <div className="p-2">
                <div className="flex items-center justify-center space-x-5">
                     <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={true}
                        className="text-white p-2 rounded-full bg-gray-400 cursor-not-allowed shadow-md opacity-50">
                        <FaBackward className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={true}
                        className="text-white p-2 rounded-full bg-gray-400 cursor-not-allowed shadow-md opacity-50">
                        {isPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4 ml-0.5" />}
                    </motion.button>
                     <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={true}
                        className="text-white p-2 rounded-full bg-gray-400 cursor-not-allowed shadow-md opacity-50">
                        <FaForward className="w-4 h-4" />
                    </motion.button>
                </div>
            </div> */}
        </div>
    )
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;



