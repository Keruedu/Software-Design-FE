import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { VideoService } from '../../services/video.service';
import { Modal } from '../../components/common/Modal/Modal';
import {FaFacebook, FaYoutube,FaInstagram,FaTiktok } from 'react-icons/fa';
import{HiDownload,HiPencil,HiLink} from 'react-icons/hi';
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
        // Use uploaded audio URL if available, otherwise use voice_id
        ...(state.selectedUploadedAudio 
          ? { audio_url: state.selectedUploadedAudio.audioUrl }
          : { voice_id: state.selectedVoice?.id || 'default' }
        ),
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
      
      console.log('🎬 Video creation params:', params);
      console.log('🎵 Audio source:', state.selectedUploadedAudio ? 'Uploaded' : 'AI Voice');
      if (state.selectedUploadedAudio) {
        console.log('📁 Uploaded audio URL:', state.selectedUploadedAudio.audioUrl);
      } else {
        console.log('🎤 Voice ID:', state.selectedVoice?.id);
      }
      
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




   const handleEditVideo = async () => {
    const params = new URLSearchParams();
        if (videoUrl) {
          params.append('videoUrl', exportedVideoUrl ||'/assets/videos/preview-video.mp4');
        }
        if (state.script?.title) {
          params.append('title', state.script.title);
        }
        router.push(`/create/edit?${params.toString()}`);
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
  const handleCopyLink = () => {
      
    }
  
  const renderVideoPreview = () => {
    if (isCreating) {
      return (
        <div className="flex flex-col items-center justify-center h-80 bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Creating video preview...</p>
        </div>
      );
    }
    const handleEditVideo = async () => {
    setIsExporting(true);
    setError(null);
    
    try {      // Create complete video using real API
      const params = {
        script_text: state.script?.content || '',
        // Use uploaded audio URL if available, otherwise use voice_id
        ...(state.selectedUploadedAudio 
          ? { audio_url: state.selectedUploadedAudio.audioUrl }
          : { voice_id: state.selectedVoice?.id || 'default' }
        ),
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
       const params = new URLSearchParams();
                    if (videoUrl) {
                      params.append('videoUrl', previewData.video_url);
                    }
                    if (state.script?.title) {
                      params.append('title', state.script.title);
                    }
                    router.push(`/create/edit?${params.toString()}`);
      } else {
        throw new Error('Failed to create video');
      }    } catch (err: any) {
      if (err.message?.includes('session has expired') || err.message?.includes('login again')) {
        // Redirect to login page
        router.push('/login?returnUrl=/create/edit');
        return;
      }
      
      setError(err.message || 'Failed to edit video. Please try again.');
      console.error('Video export error:', err);
    } finally {
      setIsExporting(false);
    }
  };
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
              <div className="md:col-span-2">
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Video Actions</h3>
                  {/* Download Button */}
                <Button
                  variant="outline"
                  onClick={handleExportVideo}
                  disabled={!videoUrl}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <HiDownload className="h-4 w-4" />
                  <span>Export video</span>
                </Button>
                  {/* Edit Video Button */}
                <Button
                  variant="outline"
                  onClick={() =>{handleEditVideo}}
                  disabled={!videoUrl}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <HiPencil className="h-4 w-4" />
                  <span>Edit Video</span>
                </Button>
                
                {/* Share to Social Networks */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Share to Social Media</h4>
                  <div className="grid grid-cols-2 gap-2">                    {/* Facebook */}
                    <button
                      onClick={() => handleShareToSocial('facebook')}
                      disabled={!videoUrl}
                      className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <FaFacebook className="h-4 w-4" />
                      <span>Facebook</span>
                    </button>
                    
                    {/* YouTube */}
                    <button
                      onClick={() => handleShareToSocial('youtube')}
                      disabled={!videoUrl}
                      className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <FaYoutube className="h-4 w-4" />
                      <span>YouTube</span>
                    </button>
                    
                    {/* TikTok */}
                    <button
                      onClick={() => handleShareToSocial('tiktok')}
                      disabled={!videoUrl}
                      className="flex items-center justify-center space-x-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <FaTiktok className="h-4 w-4" />
                      <span>TikTok</span>
                    </button>
                    
                    {/* Instagram */}
                    <button
                      onClick={() => handleShareToSocial('instagram')}
                      disabled={!videoUrl}
                      className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <FaInstagram className="h-4 w-4" />
                      <span>Instagram</span>
                    </button>
                  </div>
                </div>
                  {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  disabled={!videoUrl}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiLink className="h-4 w-4" />
                  <span>Copy Link</span>
                </button>
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
            <Button variant="outline" onClick={handleEditVideo}>
              Edit Video
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
