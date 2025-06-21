import React,{useState,useRef} from 'react';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { FaPlay, FaPause,FaBackward,FaForward  } from 'react-icons/fa';
import Timeline from './Timeline';
interface VideoPlayerProps {
    videoUrl: string
    onDuration: (duration: number) => void;
    onProgress: (progress: { playedSeconds: number }) => void;
}



const VideoPlayer:React.FC<VideoPlayerProps> = ({
    videoUrl,
    onDuration,
    onProgress
}) => {
const [isPlaying, setIsPlaying] = useState(false)
const [isMuted, setIsMuted] = useState(false)
const [volume, setVolume] = useState(1)
const [duration, setDuration] = useState(0)
const [currentTime, setCurrentTime] = useState(0)
const playerRef = useRef<ReactPlayer>(null)
const handleSeek = (typeSeek:string) => {
    if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        if(typeSeek === 'forward') {
            const duration = playerRef.current.getDuration();
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
    return(
        <div className="bg-white rounded-lg overflow-hidden shadow-lg h-full flex flex-col">
            <div className="flex-1 relative min-h-0 py-2 ">
                <ReactPlayer
                    ref ={playerRef}
                    url={videoUrl}
                    playing={isPlaying}
                    onProgress={handleProgress}
                    onDuration={handlDuration}
                    width="100%"
                    height="100%"
                    volume={isMuted ? 0 : volume}
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
               <Timeline
                    duration={duration}
                    currentTime={currentTime}
                    onSeek={handleTimelineSeek}
                    videoUrl={videoUrl}
               />
            </div>
        </div>
    )
}

export default VideoPlayer;



