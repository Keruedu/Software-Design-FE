import React,{useState, useRef,useEffect} from 'react';
import {motion} from 'framer-motion';
import { FaPlay, FaPause,FaDownload, FaHandScissors, FaForward } from 'react-icons/fa';
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
}

const Timeline: React.FC<TimelineProps> = ({
    duration,
    currentTime,
    onSeek,
    videoUrl,
    isProcessing,
    setIsProcessing,
}) =>{
    const { trimStart, trimEnd, setTrimStart, setTrimEnd } = useTrimVideoContext();
    console.log(trimStart,trimEnd);
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
                // Chỉ cập nhật playhead ảo, KHÔNG gọi onSeek
                const clampedTime = Math.max(0, Math.min(duration, time));
                setVirtualPlayheadTime(clampedTime);
            }
        };

        const handleMouseUp = () => {
            // Chỉ khi thả chuột mới seek video thật sự
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

    // Tính toán vị trí hiển thị
    const actualPlayheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;
    const virtualPlayheadPosition = duration > 0 ? (virtualPlayheadTime / duration) * 100 : 0;
    
    // Sử dụng vị trí ảo khi đang drag, vị trí thật khi không drag
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
            // Khởi tạo vị trí ảo bằng vị trí hiện tại
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
        <div className="bg-gray-50 rounded-lg space-y-5">
            <div className="flex justify-center text-xs text-gray-500">
                    <span className={`font-medium transition-colors duration-200 ${
                        isDraggingPlayhead ? 'text-orange-600' : 'text-gray-700'
                    }`}>
                        {formatTime(displayTime)}
                    </span>
                </div>
            {/* Timeline */}
            <div className="space-y-2 px-2">
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
                    
                    {/* Playhead thật (chỉ hiển thị khi KHÔNG drag) */}
                    {!isDraggingPlayhead && (
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none transition-all duration-100"
                            style={{ left: `${actualPlayheadPosition}%` }}
                        />
                    )}
                    
                    {/* Playhead ảo (chỉ hiển thị khi đang drag) */}
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
    )
}

export default Timeline;