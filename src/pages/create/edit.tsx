import { useRouter } from 'next/router'
import React, { useState, useRef, useEffect } from 'react'
import { GeneratedVideo } from '../../types/video'
import Sidebar from '@/components/features/VideoEditor/Sidebar'
import VideoPlayer from '@/components/features/VideoEditor/VideoPlayer'
import PropertiesPanel from '@/components/features/VideoEditor/PropertiesPanel'
import AudioProperties from '@/components/features/VideoEditor/AudioProperties'
import { AudioTrackData } from '@/types/audio'
import { FaRobot, FaVideo, FaMusic, FaCog, FaDownload, FaCut, FaUndo } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { videoProcessor } from '@/services/videoProcessor.service'
import { AudioTracksContextProvider } from '@/context/AudioTracks'

const VideoEditor: React.FC = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'text' | 'audio' | 'media' | 'effects' | 'layers'>('text');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);

  // Video processing state
  const [videoDuration, setVideoDuration] = useState(0);
  // Audio
  const [uploadedAudios, setUploadedAudios] = useState<AudioTrackData[]>([]);
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

  // Mở properties panel khi click vào tab audio
  useEffect(() => {
    if (activeTab === 'audio') {
      setIsPropertiesPanelOpen(true);
    } else {
      setIsPropertiesPanelOpen(false);
    }
  }, [activeTab]);

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
    // Có thể thêm logic để sync với audio timeline
  };

  const handleDuration = (duration: number) => {
    setVideoDuration(duration);
    if (generatedVideo) {
      setGeneratedVideo(prev => prev ? { ...prev, duration } : null);
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
      case 'audio':
        return [
          {
            id: 'audio-overlay',
            title: 'Thêm & Chỉnh Sửa Audio',
            icon: <FaMusic className="w-4 h-4" />,
            content: (
              <AudioProperties
                uploadedAudios={uploadedAudios}
                setUploadedAudios={setUploadedAudios}
              />
            ),
            defaultExpanded: true
          }
        ];
      
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
            id: 'media-overlay',
            title: 'Thêm Media',
            icon: <FaVideo className="w-4 h-4" />,
            content: (
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <FaVideo className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-2">Coming Soon</p>
                  <p className="text-xs text-gray-400">
                    Tính năng thêm hình ảnh, video overlay sẽ được phát triển
                  </p>
                </div>
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
      case 'audio':
        return 'Chỉnh Sửa Audio';
      case 'text':
        return 'Chỉnh Sửa Text';
      case 'media':
        return 'Chỉnh Sửa Media';
      case 'effects':
        return 'Hiệu Ứng';
      case 'layers':
        return 'Quản Lý Layers';
      default:
        return 'Thuộc Tính';
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBackToGenerate={handleBackToGenerate}
      />

      {/* Main Content */}
      <div 
        className="h-full flex flex-col transition-all duration-300 ease-out"
        style={{ 
          width: isPropertiesPanelOpen 
            ? `calc(100% - ${propertiesPanelWidth}px)` 
            : '100%' 
        }}
      >
        <header className='bg-white border-b border-gray-200 px-6 py-2 shadow-sm flex-shrink-0'>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {generatedVideo && (
                <div className="flex items-center space-x-2">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <FaRobot className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">
                      {formatTime(videoDuration)} • {new Date(generatedVideo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action buttons và Status indicator */}
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
        
        {/* Content Area */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 p-6 bg-gray-50">
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
                <div className="text-center bg-white rounded-lg p-12 shadow-lg border border-gray-200">
                  <FaVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có video để chỉnh sửa</h3>
                  <p className="text-gray-600 mb-6">Tạo video bằng AI để bắt đầu chỉnh sửa</p>
                  <div className="flex flex-row justify-center space-x-4">
                    <button
                      onClick={handleBackToGenerate}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 shadow-md transition-colors duration-200"
                    >
                      <FaRobot className="w-5 h-5" />
                      <span>Tạo Video AI</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full">
                <AudioTracksContextProvider value={{audioTracks:uploadedAudios,setAudioTracks:setUploadedAudios}}>
                  <VideoPlayer
                    videoUrl={videoUrl}
                    onDuration={handleDuration}
                    onProgress={handleProgress}
                  />
                </AudioTracksContextProvider>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <PropertiesPanel
        isOpen={isPropertiesPanelOpen}
        onClose={() => {
            setIsPropertiesPanelOpen(false);
            setActiveTab('text');

        }}
        title={getPropertiesTitle()}
        sections={getPropertiesSections()}
        width={propertiesPanelWidth}
      />
    </div>
  )
}

export default VideoEditor