import React,{useState,useRef,useEffect} from 'react';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { FaPlay, FaPause,FaBackward,FaForward, FaRegSave } from 'react-icons/fa';
import Timeline from './Timeline';
import { TrimVideoContextProvider } from '@/context/AudioTracks';
import { videoProcessor } from '@/services/videoProcessor.service';
import { ffmpegService } from '@/services/editVideo.service';
import { useAudioTracksContext,useTrimVideoContext } from '@/context/AudioTracks';
import { AudioTrackData } from '@/types/audio';

interface VideoPlayerProps {
    videoUrl: string;
    onDuration: (duration: number) => void;
    onProgress: (progress: { playedSeconds: number }) => void;
}



const VideoPlayer:React.FC<VideoPlayerProps> = ({
    videoUrl,
    onDuration,
    onProgress,
}) => {
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
const {audioTracks,setAudioTracks} = useAudioTracksContext();
const [trimStart, setTrimStart] = useState(0);
const [trimEnd, setTrimEnd] = useState(0);
const [isPlaying, setIsPlaying] = useState(false)
const [volume, setVolume] = useState(1)
const [duration, setDuration] = useState(0)
const [currentTime, setCurrentTime] = useState(0)
const playerRef = useRef<ReactPlayer>(null)
const[isProcessing, setIsProcessing] = useState(false);
const [url, setUrl] = useState(videoUrl);
const [forceUpdate, setForceUpdate] = useState(true)
useEffect(() => {
  setUrl(videoUrl);
}, [videoUrl]);
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
};
const handleTimelineSeek = (time: number) => {
    if (playerRef.current) {
        playerRef.current.seekTo(time, 'seconds');
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
                console.log("Hello")
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
            <div className="flex-1 relative min-h-0 py-2 ">
                <ReactPlayer
                    ref ={playerRef}
                    url={ url}
                    playing={isPlaying}
                    onProgress={handleProgress}
                    onDuration={handlDuration}
                    width="100%"
                    height="100%"
                    volume={volume}
                    progressInterval={100}
                    loop={false}
                    onEnded={() => setIsPlaying(false)}
                />
            </div>
            {/* Video Control */}
            <div className="p-2">
                <div className="flex items-center justify-center space-x-5">
                     <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={()=> handleSeek('backward')}
                        className="text-white p-2 rounded-full bg-blue-600 hover:bg-blue-700 shadow-md">
                        <FaBackward className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={()=>setIsPlaying(!isPlaying)}
                        className="text-white p-2 rounded-full bg-blue-600 hover:bg-blue-700 shadow-md">
                        {isPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4 ml-0.5" />}
                    </motion.button>
                     <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={()=>handleSeek('forward')}
                        className="text-white p-2 rounded-full bg-blue-600 hover:bg-blue-700 shadow-md">
                        <FaForward className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>
            <div className="p-4 border-t border-gray-200">
                <TrimVideoContextProvider value={{trimStart,trimEnd,setTrimStart,setTrimEnd}}>
                    <Timeline
                        duration={duration}
                        currentTime={currentTime}
                        onSeek={handleTimelineSeek}
                        videoUrl={videoUrl}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                    />
                </TrimVideoContextProvider>
            </div>
            <div className="ml-auto flex items-center justify-between px-2 py-2 border-t border-gray-200">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={()=>{handleSaveVideo()}}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <FaRegSave className="w-4 h-4" />
                    )}
                    <span>{isProcessing ? 'Processing...' : 'Save Video'}</span>
                </motion.button>
            </div>
        </div>
    )
}

export default VideoPlayer;



