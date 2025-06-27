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
import { TimelineProvider } from '@/context/TimelineContext'

const VideoEditor: React.FC = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'text' | 'media' | 'effects' | 'layers' | null>('media'); // Start with media tab
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);

  // Video processing state
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  // Audio
  const [uploadedAudios, setUploadedAudios] = useState<AudioTrackData[]>([]);
  // Global media items state
  const [globalMediaItems, setGlobalMediaItems] = useState<any[]>([]);
  // Trim video state
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  // Width của Properties Panel
  const propertiesPanelWidth = 400;

  useEffect(() => {
    const loadVideoFromGeneration = async () => {
      const { videoId, videoUrl: urlParam, title } = router.query
      if (urlParam && typeof urlParam === 'string') {
        setIsLoadingVideo(true)
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
    setCurrentTime(progress.playedSeconds);
  };

  const handleDuration = (duration: number) => {
    setVideoDuration(duration);
    if (generatedVideo) {
      setGeneratedVideo(prev => prev ? { ...prev, duration } : null);
    }
  };

  // Video control handlers
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoPlayerRef.current && videoPlayerRef.current.seekTo) {
      videoPlayerRef.current.seekTo(time);
    }
  };
  const handleSkipBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    handleSeek(newTime);
  };
  const handleSkipForward = () => {
    const newTime = Math.min(videoDuration, currentTime + 10);
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
                    <li>• Kéo thả media từ thư viện vào timeline</li>
                    <li>• Video → Track Video, Audio → Track Audio</li>
                    <li>• Hình ảnh → Track Overlay hoặc Video</li>
                  </ul>
                </div>
                <MediaLibrary
                  mediaItems={globalMediaItems}
                  setMediaItems={setGlobalMediaItems}
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
    setGlobalMediaItems(prevItems => prevItems.filter(item => item.id !== mediaId));
    showNotification('Media đã được xóa thành công', 'success');
  };

  return (
    <TimelineProvider>
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
                      
                      {/* Instructions */}
                      {/* <div className="p-4 border-b border-gray-200">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                          <h4 className="font-medium text-blue-900 mb-2">💡 Hướng dẫn sử dụng:</h4>
                          <ul className="text-blue-800 space-y-1 text-xs">
                            <li>• Upload hình ảnh, video, audio vào thư viện</li>
                            <li>• Kéo thả media từ thư viện vào timeline</li>
                            <li>• Video → Track Video, Audio → Track Audio</li>
                            <li>• Hình ảnh → Track Overlay hoặc Video</li>
                          </ul>
                        </div>
                      </div> */}
                      
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
                  duration={videoDuration}
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
    </TimelineProvider>
  )
}

export default VideoEditor