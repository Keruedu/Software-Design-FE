import { useRouter } from 'next/router'
import React, {useState,useRef,useEffect} from 'react'
import { GeneratedVideo } from '../../types/video'
import Sidebar from '@/components/features/VideoEditor/Sidebar'
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


return (
  <div className="min-h-screen bg-gray-50 flex">
    <Sidebar
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onBackToGenerate={handleBackToGenerate}
    />
  </div>
)
}

export default VideoEditor