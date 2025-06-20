import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  HiDownload, 
  HiPencil, 
  HiLink, 
  HiPlay, 
  HiPause,
  HiFastForward,
  HiRewind,
  HiCheck
} from 'react-icons/hi';
import { 
  FaFacebook, 
  FaYoutube, 
  FaTiktok, 
  FaInstagram 
} from 'react-icons/fa';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { VideoService } from '../../services/video.service';
import { Modal } from '../../components/common/Modal/Modal';

export default function PreviewPage() {
  const router = useRouter();
  const { state, setStep } = useVideoCreation();
  const [isCreating, setIsCreating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>("/assets/videos/preview-video.mp4");
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
    // Check if we have all the required data
  useEffect(() => {
    if (!state.script || !state.selectedVoice || !state.selectedBackground) {
      // router.replace('/create/subtitle');
    }
  }, [state.script, state.selectedVoice, state.selectedBackground, router]);
  
  useEffect(() => {
    // Simulate creating the video preview
    const createPreview = async () => {
      if (state.script && state.selectedVoice && state.selectedBackground && !isCreating && !videoUrl) {
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
  }, [state.script, state.selectedVoice, state.selectedBackground, isCreating, videoUrl]);

  const handleDownloadVideo = async () => {
    
  };
  
  const handleGoToDashboard = () => {
    setStep('topic'); // Reset creation flow
    router.push('/dashboard');
  };
  
  const handleShareToSocial = (platform: string) => {
    if (!videoUrl) {
      alert('Please export the video first before sharing');
      return;
    }
    
   
  };
  
  const handleCopyLink = async () => {
    if (!videoUrl) {
      alert('Please export the video first');
      return;
    }
    

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
          {/* In a real app, this would be a video player */}          <div className="aspect-video bg-gray-900 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto bg-white bg-opacity-25 rounded-full flex items-center justify-center mb-2">
                <HiPlay className="h-8 w-8 text-white" />
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
              <span>0:12</span>              <div className="flex space-x-4">
                <button className="text-gray-400 hover:text-white">
                  <HiRewind className="h-5 w-5" />
                </button>
                <button className="text-white">
                  <HiPlay className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-white">
                  <HiFastForward className="h-5 w-5" />
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
  

  return (
    <Layout>
      <Head>
        <title>Preview Video - VideoAI</title>
        <meta name="description" content="Preview your AI-generated video" />
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Preview Your Video</h1>
          
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
              {/* Sidebar - export, share social network, edit */}
            <div className="md:col-span-2">
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Video Actions</h3>
                  {/* Download Button */}
                <Button
                  variant="outline"
                  onClick={handleDownloadVideo}
                  disabled={!videoUrl}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <HiDownload className="h-4 w-4" />
                  <span>Download Video</span>
                </Button>
                  {/* Edit Video Button */}
                <Button
                  variant="outline"
                  onClick={() => router.push('/create/edit')}
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
          <div className="text-center py-4">            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <HiCheck className="h-8 w-8 text-green-600" />
            </div>
            <p className="mb-4">Your video has been created successfully!</p>
          </div>
          
          {videoUrl && (
            <div className="mt-4">
              <video
                src={videoUrl}
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
