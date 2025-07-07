import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaPause, FaBackward, FaForward, FaRegSave, FaPlus, FaSearchMinus, FaSearchPlus } from 'react-icons/fa';
import { useTimelineContext } from '@/context/TimelineContext';
import { useTrimVideoContext } from '@/context/AudioTracks';
import TimelineTrack from './TimelineTrack';
import { Track, TimelineItem } from '@/types/timeline';

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
    
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
    const [virtualPlayheadTime, setVirtualPlayheadTime] = useState(0);
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
    const [isDragOverTrack, setIsDragOverTrack] = useState<string | null>(null);
    
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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimeFromPosition = (clientX: number) => {
        if (!timelineRef.current) return 0;
        const rect = timelineRef.current.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (clientX - rect.left - 180) / (rect.width - 180))); // Account for track headers
        return percentage * duration;
    };

    const handleMouseDown = (type: 'playhead', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'playhead') {
            setIsDraggingPlayhead(true);
            setVirtualPlayheadTime(currentTime);
        }
    };

    const handleTimelineClick = (e: React.MouseEvent) => {
        if (isDraggingPlayhead) return;
        const time = getTimeFromPosition(e.clientX);
        onSeek(time);
    };

    // Handle mouse events for dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!timelineRef.current) return;
            
            const time = getTimeFromPosition(e.clientX);
            
            if (isDraggingPlayhead) {
                const clampedTime = Math.max(0, Math.min(duration, time));
                setVirtualPlayheadTime(clampedTime);
            }
        };

        const handleMouseUp = () => {
            if (isDraggingPlayhead) {
                onSeek(virtualPlayheadTime);
            }
            setIsDraggingPlayhead(false);
        };

        if (isDraggingPlayhead) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingPlayhead, duration, onSeek, virtualPlayheadTime]);

    const handleAddTrack = (type: Track['type']) => {
        const trackNames = {
            video: 'Video mới',
            audio: 'Audio mới',
            overlay: 'Overlay mới',
            text: 'Text mới',
            effect: 'Effect mới'
        };

        const trackColors = {
            video: '#3B82F6',
            audio: '#10B981',
            overlay: '#F59E0B',
            text: '#EF4444',
            effect: '#8B5CF6'
        };

        addTrack({
            name: trackNames[type],
            type,
            height: type === 'video' ? 50 : type === 'audio' ? 40 : 35,
            isVisible: true,
            isLocked: false,
            items: [],
            color: trackColors[type],
            ...(type === 'audio' && { isMuted: false, volume: 1 })
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
                
                // Check if media type matches track type with more flexible rules
                const isValidDrop = 
                    (mediaItem.type === 'video' && track.type === 'video') ||
                    (mediaItem.type === 'audio' && track.type === 'audio') ||
                    (mediaItem.type === 'image' && (track.type === 'overlay' || track.type === 'video'));
                
                if (!isValidDrop) {
                    // Show error message
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    notification.textContent = `Không thể thêm ${mediaItem.type} vào ${track.type} track. Vui lòng chọn track phù hợp.`;
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
                    return;
                }
                
                // Calculate drop position more precisely
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                const startTime = percentage * duration;
                
                // Add item to track
                addItemToTrack(trackId, {
                    type: mediaItem.type === 'image' ? 'image' : mediaItem.type,
                    name: mediaItem.name,
                    startTime,
                    duration: mediaItem.duration || (mediaItem.type === 'image' ? 5 : 10), // Default durations
                    url: mediaItem.url,
                    thumbnail: mediaItem.thumbnail,
                    volume: mediaItem.type === 'audio' ? 1 : undefined,
                    opacity: mediaItem.type === 'image' ? 1 : undefined
                });

                // Show success notification
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-in';
                notification.textContent = `Đã thêm ${mediaItem.name} vào ${track.name}`;
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
        setIsDragOverTrack(trackId);
    };

    const handleDragLeaveTrack = () => {
        setIsDragOverTrack(null);
    };

    const playheadPosition = duration > 0 ? 
        ((isDraggingPlayhead ? virtualPlayheadTime : currentTime) / duration) * (timelineState.pixelsPerSecond * duration) : 0;

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
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>
                
                <div className="flex items-center space-x-3">
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
                            <span className="text-xs font-medium text-gray-700">Tracks</span>
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        const menu = document.getElementById('add-track-menu');
                                        if (menu) {
                                            menu.classList.toggle('hidden');
                                        }
                                    }}
                                    className="flex items-center space-x-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors text-xs"
                                    data-add-track
                                >
                                    <FaPlus className="w-2.5 h-2.5" />
                                    <span>Add</span>
                                </button>
                                
                                <div 
                                    id="add-track-menu"
                                    className="hidden absolute right-0 top-7 bg-white border border-gray-200 rounded-lg shadow-lg z-40 py-1 min-w-[130px]"
                                >
                                    <button
                                        onClick={() => {
                                            handleAddTrack('video');
                                            document.getElementById('add-track-menu')?.classList.add('hidden');
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                        <span>🎬</span>
                                        <span>Video Track</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleAddTrack('audio');
                                            document.getElementById('add-track-menu')?.classList.add('hidden');
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                        <span>🎵</span>
                                        <span>Audio Track</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleAddTrack('overlay');
                                            document.getElementById('add-track-menu')?.classList.add('hidden');
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                        <span>🖼️</span>
                                        <span>Image Track</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleAddTrack('text');
                                            document.getElementById('add-track-menu')?.classList.add('hidden');
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                        <span>📝</span>
                                        <span>Text Track</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Time markers */}
                    <div className="flex-1 relative h-6 bg-white">
                        {Array.from({ length: Math.ceil(duration / 5) }, (_, i) => (
                            <div
                                key={i}
                                className="absolute top-0 bottom-0 flex flex-col"
                                style={{ left: `${i * 5 * timelineState.pixelsPerSecond}px` }}
                            >
                                <div className="border-l border-gray-400 h-3"></div>
                                <div className="text-xs text-gray-600 ml-1" style={{ fontSize: '10px' }}>
                                    {formatTime(i * 5)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tracks */}
                <div className="relative">
                    {/* Empty Timeline Message */}
                    {timelineState.tracks.every(track => track.items.length === 0) && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-90">
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">🎬</div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Your timeline is empty</h3>
                                <p className="text-gray-500 mb-4">Add some media from the Media panel to start editing!</p>
                                <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                                    <span>💡 Tip: Kéo thả media từ thư viện vào tracks</span>
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

                {/* Playhead */}
                <div
                    className="absolute top-6 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none"
                    style={{ left: `${180 + playheadPosition}px` }}
                />
                
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
                />
            </div>

            {/* Close add track menu when clicking outside */}
            <div onClick={(e) => {
                const menu = document.getElementById('add-track-menu');
                const button = e.target as HTMLElement;
                if (menu && !menu.contains(button) && !button.closest('button[data-add-track]')) {
                    menu.classList.add('hidden');
                }
            }} />
        </div>
    );
};

export default Timeline;
