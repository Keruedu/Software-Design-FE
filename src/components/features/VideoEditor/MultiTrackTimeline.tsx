import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaPause, FaBackward, FaForward, FaRegSave, FaPlus, FaSearchMinus, FaSearchPlus, FaVolumeUp, FaVolumeDown, FaVolumeMute } from 'react-icons/fa';
import { useTimelineContext } from '@/context/TimelineContext';
import { useTrimVideoContext } from '@/context/AudioTracks';
import { audioManager } from '@/services/audioManager';
import TimelineTrack from './TimelineTrack';
import { Track, TimelineItem } from '@/types/timeline';
import { useTextOverlayContext } from '@/context/TextOverlayContext';

// Helper function to format time
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface TimelineProps {
    duration: number;
    currentTime: number;
    onSeek: (time: number) => void;
    videoUrl: string;
    isProcessing: boolean;
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
    // Volume control props
    volume?: number;
    onVolumeChange?: (volume: number) => void;
    isMuted?: boolean;
    onToggleMute?: () => void;
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
    backgroundImages = [],
    // Volume control props
    volume = 1,
    onVolumeChange,
    isMuted = false,
    onToggleMute
}) => {
    const { 
        timelineState, 
        addTrack, 
        removeTrack, 
        addItemToTrack, 
        updateItem, 
        removeItemFromTrack,
        updateTrack,
        setCurrentTime,
        setDuration,
        setZoom
    } = useTimelineContext();

    const { trimStart, trimEnd, setTrimStart, setTrimEnd } = useTrimVideoContext();
    const { state: textOverlayState } = useTextOverlayContext();
    
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
    const [virtualPlayheadTime, setVirtualPlayheadTime] = useState(0);
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
    const [isDragOverTrack, setIsDragOverTrack] = useState<string | null>(null);
    
    // Trim handles dragging state
    const [isDraggingTrimStart, setIsDraggingTrimStart] = useState(false);
    const [isDraggingTrimEnd, setIsDraggingTrimEnd] = useState(false);
    const [virtualTrimStart, setVirtualTrimStart] = useState(0);
    const [virtualTrimEnd, setVirtualTrimEnd] = useState(0);
    
    const timelineRef = useRef<HTMLDivElement>(null);

    // Sync duration with timeline context
    useEffect(() => {
        if (duration !== timelineState.duration) {
            setDuration(duration);
        }
    }, [duration, timelineState.duration, setDuration]);

    // Sync current time with timeline context
    useEffect(() => {
        if (currentTime !== timelineState.currentTime) {
            setCurrentTime(currentTime);
        }
    }, [currentTime, timelineState.currentTime, setCurrentTime]);

    // Initialize trim end when duration changes
    useEffect(() => {
        if (duration > 0 && trimEnd === 0) {
            setTrimEnd(duration);
        }
    }, [duration, trimEnd, setTrimEnd]);

    // Initialize virtual trim values
    useEffect(() => {
        setVirtualTrimStart(trimStart);
        setVirtualTrimEnd(trimEnd);
    }, [trimStart, trimEnd]);

    const getTimeFromPosition = (clientX: number) => {
        if (!timelineRef.current) return 0;
        const rect = timelineRef.current.getBoundingClientRect();
        const timelineWidth = duration * timelineState.pixelsPerSecond * timelineState.zoom;
        const percentage = Math.max(0, Math.min(1, (clientX - rect.left - 180) / timelineWidth)); // Account for track headers
        return percentage * duration;
    };

    const handleMouseDown = (type: 'playhead' | 'trimStart' | 'trimEnd', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'playhead') {
            setIsDraggingPlayhead(true);
            setVirtualPlayheadTime(currentTime);
        } else if (type === 'trimStart') {
            setIsDraggingTrimStart(true);
            setVirtualTrimStart(trimStart);
        } else if (type === 'trimEnd') {
            setIsDraggingTrimEnd(true);
            setVirtualTrimEnd(trimEnd);
        }
    };

    const handleTimelineClick = (e: React.MouseEvent) => {
        if (isDraggingPlayhead) return;
        let time = getTimeFromPosition(e.clientX);
        
        // Clamp time to trim boundaries if trim is set
        if (trimEnd > 0) {
            time = Math.max(trimStart, Math.min(time, trimEnd));
        }
        
        // Get all audio items from timeline tracks
        const audioItems = timelineState.tracks.flatMap(track => 
            track.items.filter(item => item.type === 'audio')
        );
        
        // Sync audio manager with the seek
        audioManager.seekTo(time, audioItems, timelineState.tracks);
        onSeek(time);
    };

    // Handle mouse events for dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!timelineRef.current) return;
            
            const time = getTimeFromPosition(e.clientX);
            
            if (isDraggingPlayhead) {
                let clampedTime = Math.max(0, Math.min(duration, time));
                
                // Further restrict to trim boundaries if trim is set
                if (trimEnd > 0) {
                    clampedTime = Math.max(trimStart, Math.min(clampedTime, trimEnd));
                }
                
                setVirtualPlayheadTime(clampedTime);
            } else if (isDraggingTrimStart) {
                const clampedTime = Math.max(0, Math.min(trimEnd - 0.1, time));
                setVirtualTrimStart(clampedTime);
            } else if (isDraggingTrimEnd) {
                const clampedTime = Math.max(trimStart + 0.1, Math.min(duration, time));
                setVirtualTrimEnd(clampedTime);
            }
        };

        const handleMouseUp = () => {
            if (isDraggingPlayhead) {
                // Get all audio items from timeline tracks
                const audioItems = timelineState.tracks.flatMap(track => 
                    track.items.filter(item => item.type === 'audio')
                );
                
                // Sync audio manager with the seek
                audioManager.seekTo(virtualPlayheadTime, audioItems, timelineState.tracks);
                onSeek(virtualPlayheadTime);
            } else if (isDraggingTrimStart) {
                setTrimStart(virtualTrimStart);
                console.log('Updated trimStart to:', virtualTrimStart);
            } else if (isDraggingTrimEnd) {
                setTrimEnd(virtualTrimEnd);
                console.log('Updated trimEnd to:', virtualTrimEnd);
            }
            
            setIsDraggingPlayhead(false);
            setIsDraggingTrimStart(false);
            setIsDraggingTrimEnd(false);
        };

        if (isDraggingPlayhead || isDraggingTrimStart || isDraggingTrimEnd) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingPlayhead, isDraggingTrimStart, isDraggingTrimEnd, duration, onSeek, virtualPlayheadTime, virtualTrimStart, virtualTrimEnd, trimStart, trimEnd, setTrimStart, setTrimEnd]);

    const handleAddTrack = () => {
        // Calculate next track number
        const nextTrackNumber = timelineState.tracks.length + 1;

        addTrack({
            name: `Track ${nextTrackNumber}`,
            type: 'video', 
            height: 50,
            isVisible: true,
            isLocked: false,
            items: [],
            color: '#3B82F6' 
        });
    };

    // Handle drop event for media items
    const handleDropOnTrack = (trackId: string, e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOverTrack(null);
        
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            
            if (data.type === 'media-item') {
                const mediaItem = data.mediaItem;
                const track = timelineState.tracks.find(t => t.id === trackId);
                
                if (!track) {
                    console.warn('Track not found');
                    return;
                }
                
                // Allow dropping any media type on any track for maximum flexibility
                // Calculate drop position precisely
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                const startTime = percentage * duration;
                
                // Add item to track with appropriate properties based on media type
                addItemToTrack(trackId, {
                    type: mediaItem.type === 'image' ? 'image' : mediaItem.type,
                    name: mediaItem.name,
                    startTime,
                    duration: mediaItem.duration || (mediaItem.type === 'image' ? 5 : mediaItem.type === 'audio' ? 10 : 10), 
                    url: mediaItem.url,
                    thumbnail: mediaItem.thumbnail,
                    // Set properties based on media type
                    volume: mediaItem.type === 'audio' || mediaItem.type === 'video' ? 1 : undefined,
                    opacity: mediaItem.type === 'image' || mediaItem.type === 'video' ? 1 : undefined
                });

                // Show success notification
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-in';
                notification.textContent = `Đã thêm "${mediaItem.name}" vào "${track.name}"`;
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
            }
        } catch (error) {
            console.error('Error handling drop:', error);
        }
    };

    const handleDragOverTrack = (trackId: string, e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Only update state if it's actually changing to prevent flickering
        if (isDragOverTrack !== trackId) {
            setIsDragOverTrack(trackId);
        }
    };

    const handleDragLeaveTrack = (e?: React.DragEvent) => {
        // Use a small delay to prevent flickering when moving between elements
        setTimeout(() => {
            setIsDragOverTrack(null);
        }, 50);
    };

    const playheadPosition = duration > 0 ? 
        ((isDraggingPlayhead ? virtualPlayheadTime : currentTime) / duration) * (timelineState.pixelsPerSecond * duration * timelineState.zoom) : 0;

    return (
        <div className="bg-white border-t border-gray-200">
            {/* Video Controls */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center space-x-3">
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
                        className="text-white p-2 rounded-full bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        <FaBackward className="w-3 h-3" />
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
                        className="text-white p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        {isPlaying ? <FaPause className="w-3.5 h-3.5" /> : <FaPlay className="w-3.5 h-3.5 ml-0.5" />}
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
                        className="text-white p-2 rounded-full bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        <FaForward className="w-3 h-3" />
                    </motion.button>

                    {/* Current Time Display */}
                    <div className="text-xs text-gray-600 min-w-[80px] text-center">
                        <div>{formatTime(currentTime)} / {formatTime(duration)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Trim: {formatTime(isDraggingTrimStart ? virtualTrimStart : trimStart)} - {formatTime(isDraggingTrimEnd ? virtualTrimEnd : trimEnd)}
                        </div>
                    </div>

                    {/* Volume Controls */}
                    <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onToggleMute}
                            className="text-gray-600 hover:text-blue-600 transition-colors"
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
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                                const newVolume = parseFloat(e.target.value);
                                console.log('Volume slider changed from', volume, 'to', newVolume);
                                if (onVolumeChange) {
                                    onVolumeChange(newVolume);
                                }
                                if (newVolume > 0 && isMuted && onToggleMute) {
                                    onToggleMute(); // Unmute when adjusting volume
                                }
                            }}
                            onMouseMove={(e) => {
                                // Handle dragging - immediate feedback
                                if (e.buttons === 1) { // Left mouse button is pressed
                                    const newVolume = parseFloat((e.target as HTMLInputElement).value);
                                    console.log('Volume slider dragged to:', newVolume);
                                    if (onVolumeChange) {
                                        onVolumeChange(newVolume);
                                    }
                                }
                            }}
                            className="w-20 volume-slider cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(isMuted ? 0 : volume) * 100}%, #E5E7EB ${(isMuted ? 0 : volume) * 100}%, #E5E7EB 100%)`,
                                height: '4px',
                                WebkitAppearance: 'none',
                                appearance: 'none',
                                borderRadius: '2px',
                                outline: 'none'
                            }}
                        />
                        
                        <span className="text-gray-500 text-xs font-mono min-w-[3rem]">
                            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        <span className="text-green-600 font-mono">
                            {formatTime(trimStart)}
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className="text-red-600 font-mono">
                            {formatTime(trimEnd)}
                        </span>
                        <span className="text-gray-500">
                            ({formatTime(trimEnd - trimStart)})
                        </span>
                    </div>
                    
                    {/* Timeline Zoom Controls */}
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setZoom(Math.max(0.25, timelineState.zoom - 0.25))}
                            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        >
                            <FaSearchMinus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-xs text-gray-600 min-w-[40px] text-center">
                            {Math.round(timelineState.zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom(Math.min(4, timelineState.zoom + 0.25))}
                            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        >
                            <FaSearchPlus className="w-2.5 h-2.5" />
                        </button>
                    </div>
                    
                    {/* Save Video Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onSaveVideo}
                        disabled={isProcessing}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm text-sm"
                    >
                        {isProcessing ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FaRegSave className="w-3 h-3" />
                        )}
                        <span>{isProcessing ? 'Processing...' : 'Export'}</span>
                    </motion.button>
                </div>
            </div>

            {/* Multi-Track Timeline */}
            <div 
                ref={timelineRef}
                className="relative bg-gray-50 overflow-x-auto overflow-y-auto max-h-96"
                onClick={handleTimelineClick}
            >
                {/* Time Ruler */}
                <div className="sticky top-0 z-30 bg-white border-b border-gray-300 flex">
                    <div className="w-[180px] flex-shrink-0 bg-gray-100 border-r border-gray-300 px-3 py-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">Timeline</span>
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        handleAddTrack();
                                    }}
                                    className="flex items-center space-x-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors text-xs"
                                >
                                    <FaPlus className="w-2.5 h-2.5" />
                                    <span>Add</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Time markers */}
                    <div 
                        className="flex-1 relative h-6 bg-white"
                        style={{ minWidth: `${duration * timelineState.pixelsPerSecond * timelineState.zoom}px` }}
                    >
                        {/* Major time markers (every 5 seconds for normal zoom, every 1 second for high zoom) */}
                        {timelineState.zoom >= 2 ? (
                            // High zoom: show every 1 second
                            Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
                                <div
                                    key={`major-${i}`}
                                    className="absolute top-0 bottom-0 flex flex-col"
                                    style={{ left: `${i * timelineState.pixelsPerSecond * timelineState.zoom}px` }}
                                >
                                    <div className="border-l border-gray-400 h-3"></div>
                                    <div className="text-xs text-gray-600 ml-1" style={{ fontSize: '9px' }}>
                                        {formatTime(i)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Normal zoom: show every 5 seconds
                            Array.from({ length: Math.ceil(duration / 5) + 1 }, (_, i) => (
                                <div
                                    key={`major-${i}`}
                                    className="absolute top-0 bottom-0 flex flex-col"
                                    style={{ left: `${i * 5 * timelineState.pixelsPerSecond * timelineState.zoom}px` }}
                                >
                                    <div className="border-l border-gray-400 h-3"></div>
                                    <div className="text-xs text-gray-600 ml-1" style={{ fontSize: '10px' }}>
                                        {formatTime(i * 5)}
                                    </div>
                                </div>
                            ))
                        )}
                        
                        {/* Minor time markers */}
                        {timelineState.zoom >= 2 ? (
                            // High zoom: show every 0.5 second
                            Array.from({ length: Math.ceil(duration * 2) + 1 }, (_, i) => 
                                i % 2 !== 0 ? (
                                    <div
                                        key={`minor-${i}`}
                                        className="absolute top-0 bottom-0"
                                        style={{ left: `${(i * 0.5) * timelineState.pixelsPerSecond * timelineState.zoom}px` }}
                                    >
                                        <div className="border-l border-gray-300 h-2"></div>
                                    </div>
                                ) : null
                            )
                        ) : timelineState.zoom >= 1 ? (
                            // Medium zoom: show every 1 second (excluding major markers)
                            Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => 
                                i % 5 !== 0 ? (
                                    <div
                                        key={`minor-${i}`}
                                        className="absolute top-0 bottom-0"
                                        style={{ left: `${i * timelineState.pixelsPerSecond * timelineState.zoom}px` }}
                                    >
                                        <div className="border-l border-gray-300 h-2"></div>
                                    </div>
                                ) : null
                            )
                        ) : null}
                        
                        {/* Sub-second markers (every 0.1 second) when very highly zoomed in */}
                        {timelineState.zoom >= 3 && Array.from({ length: Math.ceil(duration * 10) + 1 }, (_, i) => 
                            i % 5 !== 0 ? (
                                <div
                                    key={`sub-${i}`}
                                    className="absolute top-0 bottom-0"
                                    style={{ left: `${(i * 0.1) * timelineState.pixelsPerSecond * timelineState.zoom}px` }}
                                >
                                    <div className="border-l border-gray-200 h-1"></div>
                                </div>
                            ) : null
                        )}
                    </div>
                </div>

                {/* Tracks */}
                <div className="relative">
                    {/* Trim Range Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                        {/* Left trim overlay (before trim start) */}
                        <div
                            className="absolute top-0 bottom-0 bg-black bg-opacity-30"
                            style={{
                                left: '180px',
                                width: `${(isDraggingTrimStart ? virtualTrimStart : trimStart) * timelineState.pixelsPerSecond * timelineState.zoom}px`
                            }}
                        />
                        
                        {/* Right trim overlay (after trim end) */}
                        <div
                            className="absolute top-0 bottom-0 bg-black bg-opacity-30"
                            style={{
                                left: `${180 + (isDraggingTrimEnd ? virtualTrimEnd : trimEnd) * timelineState.pixelsPerSecond * timelineState.zoom}px`,
                                right: '0px'
                            }}
                        />
                    </div>
                    {/* Empty Timeline Message */}
                    {timelineState.tracks.every(track => track.items.length === 0) && timelineState.tracks.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-75 pointer-events-none">
                            <div className="text-center py-8 pointer-events-auto bg-white rounded-lg shadow-lg px-6 border border-gray-200">
                                <div className="text-4xl mb-4">🎬</div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Your timeline is empty</h3>
                                <p className="text-gray-500 mb-4">Add some media from the Media panel to start editing!</p>
                                <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                                    <span>💡 Tip: Kéo thả bất kỳ media nào vào bất kỳ track nào</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {timelineState.tracks.map((track) => (
                        <TimelineTrack
                            key={track.id}
                            track={track}
                            duration={duration}
                            pixelsPerSecond={timelineState.pixelsPerSecond}
                            zoom={timelineState.zoom}
                            currentTime={currentTime}
                            onUpdateTrack={(updates) => updateTrack(track.id, updates)}
                            onDeleteTrack={() => removeTrack(track.id)}
                            onAddItem={(item) => addItemToTrack(track.id, item)}
                            onUpdateItem={(itemId, updates) => updateItem(track.id, itemId, updates)}
                            onDeleteItem={(itemId) => removeItemFromTrack(track.id, itemId)}
                            selectedItemId={selectedItemId}
                            onSelectItem={setSelectedItemId}
                            onDrop={(e) => handleDropOnTrack(track.id, e)}
                            onDragOver={(e) => handleDragOverTrack(track.id, e)}
                            onDragLeave={handleDragLeaveTrack}
                        />
                    ))}
                </div>

                {/* Trim handles */}
                <div className="relative z-50">
                    {/* Trim Start Handle */}
                    <motion.div
                        className={`absolute w-4 h-8 cursor-ew-resize z-50 border-2 border-white shadow-lg transition-colors duration-200 ${
                            isDraggingTrimStart ? 'bg-blue-400' : 'bg-green-500'
                        }`}
                        style={{ 
                            left: `${180 + (isDraggingTrimStart ? virtualTrimStart : trimStart) * timelineState.pixelsPerSecond * timelineState.zoom - 8}px`,
                            top: '6px',
                            borderRadius: '4px 0 0 4px'
                        }}
                        onMouseDown={(e) => handleMouseDown('trimStart', e)}
                        whileHover={{ 
                            scale: 1.1, 
                            boxShadow: '0 4px 8px rgba(0,0,0,0.3)' 
                        }}
                        whileTap={{ scale: 0.95 }}
                        animate={{ 
                            scale: isDraggingTrimStart ? 1.2 : 1,
                            boxShadow: isDraggingTrimStart 
                                ? '0 6px 12px rgba(34, 197, 94, 0.5)' 
                                : '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        transition={{ duration: 0.15 }}
                        title={`Trim Start: ${formatTime(isDraggingTrimStart ? virtualTrimStart : trimStart)}`}
                    >
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-1 h-4 bg-white rounded-full"></div>
                        </div>
                    </motion.div>

                    {/* Trim End Handle */}
                    <motion.div
                        className={`absolute w-4 h-8 cursor-ew-resize z-50 border-2 border-white shadow-lg transition-colors duration-200 ${
                            isDraggingTrimEnd ? 'bg-blue-400' : 'bg-red-500'
                        }`}
                        style={{ 
                            left: `${180 + (isDraggingTrimEnd ? virtualTrimEnd : trimEnd) * timelineState.pixelsPerSecond * timelineState.zoom - 8}px`,
                            top: '6px',
                            borderRadius: '0 4px 4px 0'
                        }}
                        onMouseDown={(e) => handleMouseDown('trimEnd', e)}
                        whileHover={{ 
                            scale: 1.1, 
                            boxShadow: '0 4px 8px rgba(0,0,0,0.3)' 
                        }}
                        whileTap={{ scale: 0.95 }}
                        animate={{ 
                            scale: isDraggingTrimEnd ? 1.2 : 1,
                            boxShadow: isDraggingTrimEnd 
                                ? '0 6px 12px rgba(239, 68, 68, 0.5)' 
                                : '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        transition={{ duration: 0.15 }}
                        title={`Trim End: ${formatTime(isDraggingTrimEnd ? virtualTrimEnd : trimEnd)}`}
                    >
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-1 h-4 bg-white rounded-full"></div>
                        </div>
                    </motion.div>
                </div>

                {/* Playhead */}
                <div
                    className="absolute top-6 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none"
                    style={{ left: `${180 + playheadPosition}px` }}
                />

                {/* Trim Start Handle */}
                <div
                    className="absolute top-6 bottom-0 w-0.5 bg-green-500 z-35 pointer-events-none opacity-80"
                    style={{ left: `${180 + (isDraggingTrimStart ? virtualTrimStart : trimStart) * timelineState.pixelsPerSecond * timelineState.zoom}px` }}
                />
                
                {/* Trim End Handle */}
                <div
                    className="absolute top-6 bottom-0 w-0.5 bg-blue-500 z-35 pointer-events-none opacity-80"
                    style={{ left: `${180 + (isDraggingTrimEnd ? virtualTrimEnd : trimEnd) * timelineState.pixelsPerSecond * timelineState.zoom}px` }}
                />

                {/* Video Duration Boundary Line */}
                <div
                    className="absolute top-6 bottom-0 w-0.5 bg-orange-500 z-30 pointer-events-none opacity-70"
                    style={{ left: `${180 + duration * timelineState.pixelsPerSecond * timelineState.zoom}px` }}
                    title={`Giới hạn video chính: ${formatTime(duration)}`}
                />
                
                {/* Trim Start Handle (Draggable) */}
                <motion.div
                    className={`absolute w-3 h-3 rounded-full cursor-ew-resize z-40 border-2 border-white shadow-md transition-colors duration-200 ${
                        isDraggingTrimStart ? 'bg-green-400' : 'bg-green-500'
                    }`}
                    style={{ 
                        left: `${180 + (isDraggingTrimStart ? virtualTrimStart : trimStart) * timelineState.pixelsPerSecond * timelineState.zoom - 6}px`,
                        top: '0px'
                    }}
                    onMouseDown={(e) => handleMouseDown('trimStart', e)}
                    whileHover={{ 
                        scale: 1.2, 
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)' 
                    }}
                    whileTap={{ scale: 0.9 }}
                    animate={{ 
                        scale: isDraggingTrimStart ? 1.3 : 1,
                        boxShadow: isDraggingTrimStart 
                            ? '0 6px 12px rgba(34, 197, 94, 0.5)' 
                            : '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    transition={{ duration: 0.15 }}
                    title={`Trim Start: ${formatTime(isDraggingTrimStart ? virtualTrimStart : trimStart)}`}
                />
                
                {/* Trim End Handle (Draggable) */}
                <motion.div
                    className={`absolute w-3 h-3 rounded-full cursor-ew-resize z-40 border-2 border-white shadow-md transition-colors duration-200 ${
                        isDraggingTrimEnd ? 'bg-blue-400' : 'bg-blue-500'
                    }`}
                    style={{ 
                        left: `${180 + (isDraggingTrimEnd ? virtualTrimEnd : trimEnd) * timelineState.pixelsPerSecond * timelineState.zoom - 6}px`,
                        top: '0px'
                    }}
                    onMouseDown={(e) => handleMouseDown('trimEnd', e)}
                    whileHover={{ 
                        scale: 1.2, 
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)' 
                    }}
                    whileTap={{ scale: 0.9 }}
                    animate={{ 
                        scale: isDraggingTrimEnd ? 1.3 : 1,
                        boxShadow: isDraggingTrimEnd 
                            ? '0 6px 12px rgba(59, 130, 246, 0.5)' 
                            : '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    transition={{ duration: 0.15 }}
                    title={`Trim End: ${formatTime(isDraggingTrimEnd ? virtualTrimEnd : trimEnd)}`}
                />
                
                {/* Playhead Handle (Draggable) */}
                <motion.div
                    className={`absolute w-3 h-3 rounded-full cursor-ew-resize z-40 border-2 border-white shadow-md transition-colors duration-200 ${
                        isDraggingPlayhead ? 'bg-orange-400' : 'bg-red-500'
                    }`}
                    style={{ 
                        left: `${180 + playheadPosition - 6}px`,
                        top: '0px'
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
                    title={`Playhead: ${formatTime(isDraggingPlayhead ? virtualPlayheadTime : currentTime)}`}
                />
            </div>

            {/* Trim Info Display */}
            {(trimStart > 0 || trimEnd < duration) && (
                <div className="absolute top-2 right-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg z-20">
                    Trim: {formatTime(trimStart)} - {formatTime(trimEnd)} 
                    <span className="ml-2 text-blue-200">
                        ({formatTime(trimEnd - trimStart)} / {((trimEnd - trimStart) / duration * 100).toFixed(0)}%)
                    </span>
                </div>
            )}
            
            {/* Timeline container */}
        </div>
    );
};

export default Timeline;
