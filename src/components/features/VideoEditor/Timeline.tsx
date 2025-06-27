import React,{useState, useRef,useEffect} from 'react';
import {motion} from 'framer-motion';
import { FaPlay, FaPause,FaDownload, FaHandScissors, FaForward, FaBackward, FaRegSave } from 'react-icons/fa';
import AudioTrack from './AudioTrack';

import { useAudioTracksContext,useTrimVideoContext } from '@/context/AudioTracks';
import { AudioTrackData } from '@/types/audio';
interface TimelineProps {
    duration: number;
    currentTime: number;
    onSeek: (time: number) => void;
    videoUrl: string;
    isProcessing:boolean;
    setIsProcessing: (isProcessing: boolean) => void;
    isPlaying?: boolean;
    onPlay?: () => void;
    onPause?: () => void;
    onSkipBackward?: () => void;
    onSkipForward?: () => void;
    onSaveVideo?: () => void;
    backgroundImages?: Array<{
        id: string;
        url: string;
        startTime: number;
        duration: number;
        name: string;
    }>;
}

const Timeline: React.FC<TimelineProps> = ({
    duration,
    currentTime,
    onSeek,
    videoUrl,
    isProcessing,
    setIsProcessing,
    isPlaying = false,
    onPlay,
    onPause,
    onSkipBackward,
    onSkipForward,
    onSaveVideo,
    backgroundImages = []
}) =>{
    const { trimStart, trimEnd, setTrimStart, setTrimEnd } = useTrimVideoContext();
    const [isDraggingStart, setIsDraggingStart] = useState(false);
    const [isDraggingEnd, setIsDraggingEnd] = useState(false);
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
    // Thêm state cho playhead ảo
    const [virtualPlayheadTime, setVirtualPlayheadTime] = useState(0);
    const timelineRef = useRef<HTMLDivElement>(null);
    const {audioTracks,setAudioTracks} = useAudioTracksContext();
    useEffect(() => {
      setTrimEnd(duration);
    },[duration]);

    // Handle drag events
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!timelineRef.current) return;
            
            const time = getTimeFromPosition(e.clientX);
            
            if (isDraggingStart) {
                setTrimStart(Math.max(0, Math.min(time, trimEnd - 0.1)));
            } else if (isDraggingEnd) {
                setTrimEnd(Math.min(duration, Math.max(time, trimStart + 0.1)));
            } else if (isDraggingPlayhead) {
                const clampedTime = Math.max(0, Math.min(duration, time));
                setVirtualPlayheadTime(clampedTime);
            }
        };

        const handleMouseUp = () => {
            if (isDraggingPlayhead) {
                onSeek(virtualPlayheadTime);
            }
            
            setIsDraggingStart(false);
            setIsDraggingEnd(false);
            setIsDraggingPlayhead(false);
        };

        if (isDraggingStart || isDraggingEnd || isDraggingPlayhead) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingStart, isDraggingEnd, isDraggingPlayhead, trimStart, trimEnd, duration, onSeek, virtualPlayheadTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const actualPlayheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;
    const virtualPlayheadPosition = duration > 0 ? (virtualPlayheadTime / duration) * 100 : 0;
    
    const displayPlayheadPosition = isDraggingPlayhead ? virtualPlayheadPosition : actualPlayheadPosition;
    const displayTime = isDraggingPlayhead ? virtualPlayheadTime : currentTime;
    
    const trimStartPosition = duration > 0 ? (trimStart / duration) * 100 : 0;
    const trimEndPosition = duration > 0 ? (trimEnd / duration) * 100 : 0;

    const getTimeFromPosition=(clientX:number)=>{
        if (!timelineRef.current) return 0;
        const rect = timelineRef.current.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return percentage * duration;
    }

    const handleMouseDown=(type: 'start' | 'end' | 'playhead',e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'start') {
            setIsDraggingStart(true);
        } else if (type === 'end') {
            setIsDraggingEnd(true);
        } else if (type === 'playhead') {
            setIsDraggingPlayhead(true);
            setVirtualPlayheadTime(currentTime);
        }
    }

    const handleTimelineClick=(e:React.MouseEvent)=>{
        if(isDraggingStart||isDraggingEnd||isDraggingPlayhead) return;
        const time =getTimeFromPosition(e.clientX);
        onSeek(time);
    }


  
        const onUpdateAudioTrack = (id: string, updates: Partial<AudioTrackData>) => {
            setAudioTracks(prevTracks =>
                prevTracks.map(track =>
                track.id === id ? { ...track, ...updates } : track
                )
            );
        };

    const onDeleteAudioTrack =()=>{
        
    }
    const onSelectAudioTrack =()=>{
        
    }





    return(
        <div className="bg-white border-t border-gray-200">
            {/* Video Controls */}
            <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (onSkipBackward) {
                                onSkipBackward();
                            } else {
                                onSeek(Math.max(0, currentTime - 10));
                            }
                        }}
                        className="text-white p-3 rounded-full bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        <FaBackward className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (isPlaying) {
                                onPause?.();
                            } else {
                                onPlay?.();
                            }
                        }}
                        className="text-white p-4 rounded-full bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        {isPlaying ? <FaPause className="w-5 h-5" /> : <FaPlay className="w-5 h-5 ml-0.5" />}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (onSkipForward) {
                                onSkipForward();
                            } else {
                                onSeek(Math.min(duration, currentTime + 10));
                            }
                        }}
                        className="text-white p-3 rounded-full bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        <FaForward className="w-4 h-4" />
                    </motion.button>
                </div>
                
                <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                        <span className={`font-medium transition-colors duration-200 ${
                            isDraggingPlayhead ? 'text-orange-600' : 'text-gray-700'
                        }`}>
                            {formatTime(displayTime)} / {formatTime(duration)}
                        </span>
                    </div>
                    
                    {/* Save Video Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onSaveVideo}
                        disabled={isProcessing}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
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

            {/* Timeline Area */}
            <div className="px-6 pb-4">
                <div className="bg-gray-50 rounded-lg space-y-5 p-4">
                    {/* Timeline */}
                    <div className="space-y-2">
                        <div ref={timelineRef}
                             className="relative h-8 bg-gray-300 rounded-lg cursor-pointer"
                             onClick={handleTimelineClick}
                     >
                     {/* Trim selection */}
                    <div className="absolute top-0 bottom-0 bg-blue-200 border-l-2 border-r-2  rounded"
                        style={{
                            left: `${trimStartPosition}%`,
                            width: `${trimEndPosition - trimStartPosition}%`,
                        }}>
                    </div>
                    
                    {/* Trim start handle */}
                    <motion.div 
                        className="absolute top-0 bottom-0 w-4 bg-blue-600 cursor-ew-resize hover:bg-blue-700 rounded-l z-10  border-white shadow-sm"
                        style={{ left: `calc(${trimStartPosition}% - 16px)` }}
                        onMouseDown={(e)=>handleMouseDown('start',e)}
                        whileHover={{ scale: 1.1 }}
                        
                    >
                        <span className="absolute -top-8 text-xs text-gray-500">{formatTime(trimStart)}</span>
                    </motion.div>
                    
                    {/* Trim end handle */}
                    <motion.div
                        className="absolute top-0 bottom-0 w-4 bg-blue-600 cursor-ew-resize hover:bg-blue-700 rounded-r z-10  border-white shadow-sm"
                        style={{ right: `calc(${100-trimEndPosition}% - 16px)` }}
                        onMouseDown={(e) => handleMouseDown('end', e)}
                        whileHover={{ scale: 1.1 }}
                    >
                         <span className="absolute -top-8 text-xs text-gray-500 right-0">{formatTime(trimEnd)}</span>
                    </motion.div>
                    
                    {!isDraggingPlayhead && (
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none transition-all duration-100"
                            style={{ left: `${actualPlayheadPosition}%` }}
                        />
                    )}
                    
                    {isDraggingPlayhead && (
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-20 pointer-events-none"
                            style={{ left: `${virtualPlayheadPosition}%` }}
                        />
                    )}
                    
                    {/* Playhead handle */}
                    <motion.div
                        className={`absolute w-4 h-4 rounded-full cursor-ew-resize z-20 border-2 border-white shadow-md transition-colors duration-200 ${
                            isDraggingPlayhead ? 'bg-orange-400' : 'bg-red-500'
                        }`}
                        style={{ 
                            left: `calc(${displayPlayheadPosition}% - 8px)`,
                            top: '-2px'
                        }}
                        onMouseDown={(e) => handleMouseDown('playhead', e)}
                        whileHover={{ 
                            scale: 1.2, 
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)' 
                        }}
                        whileTap={{ scale: 0.9 }}
                        animate={{ 
                            scale: isDraggingPlayhead ? 1.3 : 1,
                            boxShadow: isDraggingPlayhead 
                                ? '0 6px 12px rgba(251, 146, 60, 0.5)' 
                                : '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        transition={{ duration: 0.15 }}
                    />
                   
                </div>
                
                
            </div>
            {/* Audio Tracks */}
            {audioTracks.length > 0 && (
                <div className="space-y-2 px-2">
                    <div className="text-xs text-gray-600 font-medium mb-1">Audio Tracks</div>
                    <div className="space-y-2">
                        {audioTracks.map((track) => (
                            <div key={track.id} className="relative h-12 bg-gray-200 rounded-lg">
                                <AudioTrack
                                    track={track}
                                    videoDuration={duration}
                                    onUpdateTrack={onUpdateAudioTrack}
                                    onSelectTrack={onSelectAudioTrack}
                                />
                                
                                {/* Playhead for audio tracks */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                                    style={{ left: `${displayPlayheadPosition}%` }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
                </div>
            </div>
        </div>
    )
}

export default Timeline;