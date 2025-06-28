import React,{useState,useRef,useEffect,forwardRef,useImperativeHandle} from 'react';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { FaPlay, FaPause,FaBackward,FaForward, FaRegSave, FaVolumeUp, FaVolumeMute, FaVolumeDown } from 'react-icons/fa';
import { videoProcessor } from '@/services/videoProcessor.service';
import { ffmpegService } from '@/services/editVideo.service';
import { useAudioTracksContext } from '@/context/AudioTracks';
import { useTimelineContext } from '@/context/TimelineContext';
import { audioManager } from '@/services/audioManager';
import { AudioTrackData } from '@/types/audio';

interface VideoPlayerProps {
    videoUrl: string;
    onDuration: (duration: number) => void;
    onProgress: (progress: { playedSeconds: number }) => void;
    isPlaying?: boolean;
    onPlay?: () => void;
    onPause?: () => void;
    onSeek?: (direction: 'forward' | 'backward') => void;
    currentTime?: number;
    onVolumeChange?: (volume: number) => void;
    isMuted?: boolean;
    onToggleMute?: () => void;
    isMainVideoTrackMuted?: boolean; // Add this to check if main video track is muted
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
    onVolumeChange,
    isMuted = false,
    onToggleMute,
    isMainVideoTrackMuted = false,
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
const [trimStart, setTrimStart] = useState(0);
const [trimEnd, setTrimEnd] = useState(0);
const [isPlaying, setIsPlaying] = useState(externalIsPlaying)
const [volume, setVolume] = useState(1)
const [duration, setDuration] = useState(0)
const [currentTime, setCurrentTime] = useState(0)
const playerRef = useRef<ReactPlayer>(null)
const[isProcessing, setIsProcessing] = useState(false);
const [url, setUrl] = useState(videoUrl);
const [forceUpdate, setForceUpdate] = useState(true)

// Get all audio items from timeline tracks
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
        // Update audio manager with current track mute states before playing
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

//... existing useEffects...

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
    console.log('Debug - VideoPlayer main video track mute state:', isMainVideoTrackMuted, 'global mute:', isMuted);
    console.log('Debug - Final video volume will be:', (isMuted || isMainVideoTrackMuted) ? 0 : volume);
}, [isMainVideoTrackMuted, isMuted, volume]);

// Sync external currentTime to video player and audio
useEffect(() => {
    if (playerRef.current && Math.abs(currentTime - externalCurrentTime) > 0.5) {
        playerRef.current.seekTo(externalCurrentTime, 'seconds');
        audioManager.seekTo(externalCurrentTime, audioItems, timelineState.tracks);
    }
}, [externalCurrentTime, audioItems]); // Removed timelineState.tracks dependency

// Notify parent about volume changes
useEffect(() => {
    if (onVolumeChange) {
        onVolumeChange(volume);
    }
}, [volume, onVolumeChange]);

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
    setCurrentTime(progress.playedSeconds);
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
            
            setTrimStart(0);
            setTrimEnd(result.duration);
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
    await addAudioToVideo()
    setForceUpdate(!forceUpdate);
    const currentVideo = videoProcessor.getCurrentVideo();
    if (!currentVideo) {
        console.error('No current video available');
        return;
    }
    setUrl(currentVideo.url);
}
    return(
        <div className="bg-white rounded-lg overflow-hidden shadow-lg h-full flex flex-col">
            <div className="flex-1 relative min-h-0 py-2">
                <ReactPlayer
                    ref ={playerRef}
                    url={ url}
                    playing={isPlaying}
                    onProgress={handleProgress}
                    onDuration={handlDuration}
                    width="100%"
                    height="100%"
                    volume={(isMuted || isMainVideoTrackMuted) ? 0 : volume}
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
                
                {/* Volume Control Overlay */}
                <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black bg-opacity-50 rounded-lg px-3 py-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onToggleMute}
                        className="text-white hover:text-blue-400 transition-colors"
                    >
                        {isMuted ? (
                            <FaVolumeMute className="w-4 h-4" />
                        ) : volume > 0.5 ? (
                            <FaVolumeUp className="w-4 h-4" />
                        ) : (
                            <FaVolumeDown className="w-4 h-4" />
                        )}
                    </motion.button>
                    
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                            const newVolume = parseFloat(e.target.value);
                            setVolume(newVolume);
                            if (newVolume > 0 && isMuted && onToggleMute) {
                                onToggleMute(); // Unmute when adjusting volume
                            }
                        }}
                        className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(isMuted ? 0 : volume) * 100}%, #6B7280 ${(isMuted ? 0 : volume) * 100}%, #6B7280 100%)`
                        }}
                    />
                    
                    <span className="text-white text-xs font-mono min-w-[3rem]">
                        {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                    </span>
                </div>
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



