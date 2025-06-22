import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { VideoService } from '../../services/video.service';
import { Modal } from '../../components/common/Modal/Modal';

export default function EditPage() {
  const router = useRouter();
  const { state, setStep } = useVideoCreation();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  
  const [subtitle, setSubtitle] = useState(true);
  const [musicVolume, setMusicVolume] = useState(50);
  const [hasBgMusic, setHasBgMusic] = useState(false);
  // Check if we have all the required data
  useEffect(() => {
    if (!state.script || !state.selectedVoice || (!state.selectedBackgrounds || state.selectedBackgrounds.length === 0)) {
      router.replace('/create/background');
    }
  }, [state.script, state.selectedVoice, state.selectedBackgrounds, router]);
    useEffect(() => {
    // Simulate creating the video preview
    const createPreview = async () => {
      if (state.script && state.selectedVoice && state.selectedBackgrounds && state.selectedBackgrounds.length > 0 && !isCreating && !videoUrl) {
        setIsCreating(true);
        setError(null);
        
        // Simulate delay for video creation
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          // In a real app, this would actually create the video
          // For demo, we'll just set a mock URL
          setVideoUrl('/assets/videos/preview-video.mp4');
        } catch (err) {
          setError('Failed to create video preview. Please try again.');
          console.error('Video creation error:', err);
        } finally {
          setIsCreating(false);
        }
      }
    };
    
    createPreview();
  }, [state.script, state.selectedVoice, state.selectedBackgrounds, isCreating, videoUrl]);
    const handleExportVideo = async () => {
    setIsExporting(true);
    setError(null);
    
    try {      // Create complete video using real API
      const params = {
        script_text: state.script?.content || '',
        voice_id: state.selectedVoice?.id || 'default',
        background_image_id: state.selectedBackground?.id || 'default', // Legacy fallback
        background_image_ids: state.selectedBackgrounds?.length > 0 
          ? state.selectedBackgrounds.map(bg => bg.id)
          : undefined, // Send multiple backgrounds if available
        subtitle_enabled: subtitle,
        subtitle_language: state.subtitleOptions?.language || 'en',
        subtitle_style: typeof state.subtitleOptions?.style === 'string' 
          ? state.subtitleOptions.style 
          : 'default'
      };
      
      const result = await VideoService.createCompleteVideo(params);
      
      if (result && result.id) {
        // Get video preview URL
        const previewData = await VideoService.getVideoPreview(result.id);
        setExportedVideoUrl(previewData.video_url);
        setShowSuccessModal(true);
      } else {
        throw new Error('Failed to create video');
      }    } catch (err: any) {
      if (err.message?.includes('session has expired') || err.message?.includes('login again')) {
        // Redirect to login page
        router.push('/login?returnUrl=/create/edit');
        return;
      }
      
      setError(err.message || 'Failed to export video. Please try again.');
      console.error('Video export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!exportedVideoUrl) return;
    
    try {
      // Extract video ID from URL or use a stored ID
      const videoId = exportedVideoUrl.split('/').pop()?.split('.')[0];
      if (videoId) {
        const blob = await VideoService.downloadVideo(videoId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download video. Please try again.');
    }
  };
  
  const handleGoToDashboard = () => {
    setStep('topic'); // Reset creation flow
    router.push('/dashboard');
  };
  
  const renderVideoPreview = () => {
    if (isCreating) {
      return (
        <div className="flex flex-col items-center justify-center h-80 bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Creating video preview...</p>
        </div>
      );
    }
    
    if (videoUrl) {
      return (
        <div className="bg-black rounded-lg overflow-hidden">
          {/* In a real app, this would be a video player */}
          <div className="aspect-video bg-gray-900 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto bg-white bg-opacity-25 rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-white text-sm">Video preview available (mock)</p>
              <p className="text-gray-400 text-xs mt-1">In a full implementation, the actual video would appear here.</p>
            </div>
          </div>
          
          {/* Video controls/timeline mockup */}
          <div className="px-4 py-3 bg-gray-800">
            <div className="w-full h-1 bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-1/3"></div>
            </div>
            <div className="flex items-center justify-between mt-2 text-white text-xs">
              <span>0:12</span>
              <div className="flex space-x-4">
                <button className="text-gray-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 15.536L12 12m0 0l-3.536 3.536M12 12l3.536-3.536M12 12l-3.536-3.536" />
                  </svg>
                </button>
                <button className="text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464L12 12m0 0l-3.536 3.536M12 12l3.536 3.536M12 12l-3.536-3.536" />
                  </svg>
                </button>
              </div>
              <span>0:36</span>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center h-80 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Video preview not available</p>
      </div>
    );
  };
  
  const handleTestAPI = async () => {
    try {
      setIsCreating(true);
      setError(null);
      
      // Test API connection first
      console.log('Testing API connection...');
      const testResult = await VideoService.testAPI();
      console.log('API test result:', testResult);
      
      // Then test video creation
      const params = {
        script_text: state.script?.content || 'Test video script',
        voice_id: state.selectedVoice?.id || 'default',
        background_image_id: state.selectedBackground?.id || 'custom_282c039b',
        subtitle_enabled: false,
        subtitle_language: 'en',
        subtitle_style: 'default'
      };
      
      console.log('Testing video creation...');
      const result = await VideoService.createTestVideo(params);
      console.log('Test video result:', result);
      
      if (result && result.url) {
        setExportedVideoUrl(result.url);
        setShowSuccessModal(true);
      }
      
    } catch (error) {
      console.error('Test error:', error);
      setError(error instanceof Error ? error.message : 'Test failed');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Edit Video - VideoAI</title>
        <meta name="description" content="Edit your AI-generated video" />
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Your Video</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="grid md:grid-cols-5 gap-6">
            {/* Main content - video preview */}
            <div className="md:col-span-3">
              {renderVideoPreview()}
              
              {/* Video information */}
              <div className="mt-4">
                <h2 className="font-medium text-gray-900 mb-1">{state.script?.title || 'Untitled Video'}</h2>
                <p className="text-sm text-gray-500">Duration: ~30 seconds</p>
              </div>
            </div>
            
            {/* Sidebar - editing tools */}
            <div className="md:col-span-2">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="font-medium text-gray-900 mb-4">Editing Options</h2>
                
                {/* Subtitle toggle */}
                <div className="mb-4">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={subtitle}
                        onChange={() => setSubtitle(!subtitle)} 
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${subtitle ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${subtitle ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Show subtitles</span>
                  </label>
                </div>
                
                {/* Background music */}
                <div className="mb-4">
                  <label className="flex items-center cursor-pointer mb-2">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={hasBgMusic}
                        onChange={() => setHasBgMusic(!hasBgMusic)} 
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${hasBgMusic ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${hasBgMusic ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Background music</span>
                  </label>
                  
                  {hasBgMusic && (
                    <>
                      <select 
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500 text-sm"
                        defaultValue="ambient1"
                      >
                        <option value="ambient1">Ambient Relaxation</option>
                        <option value="upbeat1">Upbeat Corporate</option>
                        <option value="inspirational1">Inspirational</option>
                        <option value="tech1">Tech Background</option>
                      </select>
                      
                      <div className="mt-2">
                        <label htmlFor="volume" className="block text-sm text-gray-700 mb-1">
                          Music Volume: {musicVolume}%
                        </label>
                        <input
                          type="range"
                          id="volume"
                          min="0"
                          max="100"
                          value={musicVolume}
                          onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </div>
                
                {/* Visual effects */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Visual Effects</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['None', 'Fade', 'Zoom', 'Blur', 'Pan', 'Ken Burns'].map((effect) => (
                      <button
                        key={effect}
                        className={`px-2 py-1 text-xs rounded-md ${effect === 'None' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                      >
                        {effect}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Text overlay */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Text Overlay</h3>
                  <Button variant="outline" size="sm" className="w-full">
                    Add Text Overlay
                  </Button>
                </div>
                
                {/* Demo note */}
                <div className="text-xs text-gray-500 italic mt-4">
                  Note: In this demo, these controls showcase the UI but don't modify the actual video.
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => router.push('/create/background')}>
              Back
            </Button>
            <Button
              variant="success"
              onClick={handleExportVideo}
              isLoading={isExporting}
              disabled={isCreating || !videoUrl}
            >
              Export Video
            </Button>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Video Created Successfully!"        footer={
          <>
            <Button variant="outline" onClick={handleDownloadVideo}>
              Download Video
            </Button>
            <Button variant="outline" onClick={() => setShowSuccessModal(false)}>
              Create Another
            </Button>
            <Button onClick={handleGoToDashboard}>
              Go to Dashboard
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mb-4">Your video has been created successfully!</p>
          </div>
          
          {exportedVideoUrl && (
            <div className="mt-4">
              <video
                src={exportedVideoUrl}
                controls
                className="w-full max-w-md mx-auto rounded-lg"
                style={{ maxHeight: '300px' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="font-medium text-gray-900">{state.script?.title || 'Untitled Video'}</p>
            <p className="text-sm text-gray-500 mb-3">Created with AI technology</p>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
