import { useRouter } from 'next/router'
import React, {useState,useRef,useEffect} from 'react'
import { GeneratedVideo } from '../../types/video'
import Sidebar from '@/components/features/VideoEditor/Sidebar'
import VideoPlayer from '@/components/features/VideoEditor/VideoPlayer'
import { FaRobot,FaVideo } from 'react-icons/fa'
import {motion} from 'framer-motion'
const VideoEditor :React.FC =()=>{
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'timeline' | 'text' | 'trim' | 'audio' | 'media' | 'effects' | 'layers'>('timeline');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
 

useEffect(()=>{
  const loadVideoFromGeneration =()=>{
    const{videoId,videoUrl:urlParam,title} =router.query
    if(urlParam && typeof urlParam ==='string'){
        setIsLoadingVideo(true)
        const video:GeneratedVideo={
            id: (videoId as string) || `gen-${Date.now()}`,
            url: urlParam,
            title: (title as string) || 'AI Generated Video',
            duration: 0,
            createdAt: new Date().toISOString(),
        }
        setGeneratedVideo(video)
        setVideoUrl(urlParam);
        setIsLoadingVideo(false)
    }
  }
  loadVideoFromGeneration()
},[router.query])

  const handleBackToGenerate=()=>{
    router.push('/create')
  }
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const handleProgress = (progress) => {
   
  };
  const handleDuration = (duration: number) => {
   
  };


return (
  <div className="h-screen bg-gray-50 flex">
    <Sidebar
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onBackToGenerate={handleBackToGenerate}
    />

    {/* Main Content */}
    <div className="flex-1 h-full flex flex-col">
        <header className='bg-white border-b border-gray-200 px-6 py-4 shadow-sm'>
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {generatedVideo&&(
                  <div className="flex items-center space-x-2">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <FaRobot className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-medium">{generatedVideo.title}</h3>
                      <p className="text-gray-500 text-sm">
                        {formatTime(generatedVideo.duration)} • {new Date(generatedVideo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
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
                  <p className="text-gray-600">Loading your AI generated video...</p>
                </div>
              </div>
            ):!videoUrl?(
              <div className="flex items-center justify-center h-full">
                <div className="text-center bg-white rounded-lg p-12 shadow-lg border border-gray-200">
                  <FaVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No video to edit</h3>
                  <p className="text-gray-600 mb-6">Generate a video with AI to start editing</p>
                  <div className="flex flex-row justify-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBackToGenerate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 shadow-md"
                  >
                     <FaVideo className="w-5 h-5" />
                     <span className='text-white'>Generate AI Video</span>
                  </motion.button>
                </div>
                </div>
                
              </div>
            ):(
              <div className="h-full">
                  <VideoPlayer
                      videoUrl={videoUrl}
                      onDuration={handleDuration}
                      onProgress={handleProgress}
                  />
              </div>
            )}
          </div>
        </div>
    </div>

  </div>
)
}

export default VideoEditor