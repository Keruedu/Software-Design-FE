import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { VideoCreationService, VideoCreationParams, VideoStatusResponse } from '../../services/video.service';
import { useAuth } from '../../hooks/useAuth';

export default function CreateVideoPage() {
  const router = useRouter();
  const { state, resetState } = useVideoCreation();
  const { user, token, isAuthenticated } = useAuth();
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdVideoId, setCreatedVideoId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  // Video metadata form
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoTags, setVideoTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/create/final');
      return;
    }
  }, [isAuthenticated, router]);

  // Check if we have all required data
  useEffect(() => {
    if (!state.script || !state.selectedVoice || !state.selectedBackground) {
      router.replace('/create/subtitle');
      return;
    }

    // Auto-populate title from script
    if (!videoTitle && state.script) {
      setVideoTitle(state.script.title || 'My AI Video');
    }
  }, [state.script, state.selectedVoice, state.selectedBackground, router, videoTitle]);

  // Polling for video status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (isPolling && createdVideoId && token) {
      pollInterval = setInterval(async () => {
        try {
          const status = await VideoCreationService.getVideoStatus(createdVideoId, token);
          setVideoStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            setIsPolling(false);
          }
        } catch (err) {
          console.error('Error polling video status:', err);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isPolling, createdVideoId, token]);

  const handleCreateVideo = async () => {
    if (!state.script || !state.selectedVoice || !state.selectedBackground || !token) {
      setError('Missing required data or authentication');
      return;
    }

    if (!videoTitle.trim()) {
      setError('Please enter a video title');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Prepare video creation parameters
      const params: VideoCreationParams = {
        title: videoTitle.trim(),
        description: videoDescription.trim(),
        topic: state.selectedTopic?.title,
        keywords: state.keyword ? [state.keyword] : [],
        scriptContent: state.script.content,
        voiceId: state.selectedVoice.id,
        voiceSettings: state.voiceSettings,
        backgroundId: state.selectedBackground.id,
        subtitleEnabled: state.subtitleOptions?.enabled || false,
        subtitleLanguage: state.subtitleOptions?.language || 'en',
        subtitleStyle: state.subtitleOptions?.style?.name || 'default',
        customSubtitleSegments: state.subtitleOptions?.segments || [],
        tags: videoTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        isPublic: isPublic
      };

      console.log('🎬 Creating video with params:', params);

      // Start video creation
      const response = await VideoCreationService.createCompleteVideo(params, token);
      
      setCreatedVideoId(response.id);
      setVideoStatus({
        id: response.id,
        status: 'processing' as const,
        progress: 10,
        title: response.title,
        createdAt: response.createdAt,
        updatedAt: response.createdAt
      });

      // Start polling for status updates
      setIsPolling(true);

      console.log('✅ Video creation started:', response);

    } catch (err) {
      setError(`Failed to create video: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Video creation error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGoToDashboard = () => {
    resetState(); // Reset creation flow
    router.push('/dashboard');
  };

  const handleBackToSubtitles = () => {
    router.push('/create/subtitle');
  };

  const handleStartNew = () => {
    resetState();
    router.push('/create');
  };

  // Show authentication required
  if (!isAuthenticated) {
    return (
      <Layout>
        <Head>
          <title>Authentication Required - VideoAI</title>
        </Head>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow px-6 py-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6">Please log in to create videos.</p>
            <Button onClick={() => router.push('/auth/login')}>
              Log In
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Show video creation success/status
  if (videoStatus) {
    return (
      <Layout>
        <Head>
          <title>Creating Video - VideoAI</title>
        </Head>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow px-6 py-8">
            <div className="text-center">
              {videoStatus.status === 'processing' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Creating Your Video</h1>
                  <p className="text-gray-600 mb-6">{videoStatus.title}</p>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${videoStatus.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mb-8">
                    {videoStatus.progress}% complete • Processing your video with AI...
                  </p>
                  
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-blue-900 mb-2">What's happening:</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>✅ Generating audio from your script</li>
                      <li>✅ Preparing background visuals</li>
                      <li>{videoStatus.progress > 50 ? '✅' : '🔄'} Creating subtitles</li>
                      <li>{videoStatus.progress > 80 ? '✅' : '⏳'} Combining into final video</li>
                      <li>{videoStatus.progress === 100 ? '✅' : '⏳'} Uploading to cloud</li>
                    </ul>
                  </div>
                </>
              )}

              {videoStatus.status === 'completed' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Video Created Successfully!</h1>
                  <p className="text-gray-600 mb-6">{videoStatus.title}</p>
                  
                  <div className="bg-gray-100 p-4 rounded-lg mb-6">
                    <p className="font-medium text-gray-900 mb-1">{videoStatus.title}</p>
                    <p className="text-sm text-gray-500 mb-3">
                      Duration: {Math.round(videoStatus.duration || 0)}s • 
                      Created: {new Date(videoStatus.createdAt).toLocaleDateString()}
                    </p>
                    
                    {videoStatus.finalVideoUrl && (
                      <div className="mb-4">
                        <video 
                          controls 
                          className="w-full max-w-md mx-auto rounded-lg"
                          poster={videoStatus.thumbnailUrl}
                        >
                          <source src={videoStatus.finalVideoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={handleStartNew}>
                      Create Another Video
                    </Button>
                    <Button onClick={handleGoToDashboard}>
                      View in Dashboard
                    </Button>
                  </div>
                </>
              )}

              {videoStatus.status === 'failed' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Video Creation Failed</h1>
                  <p className="text-gray-600 mb-6">We encountered an error while creating your video.</p>
                  
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    Please try again or contact support if the problem persists.
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={handleBackToSubtitles}>
                      Back to Edit
                    </Button>
                    <Button onClick={handleCreateVideo} disabled={isCreating}>
                      Try Again
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show video creation form
  return (
    <Layout>
      <Head>
        <title>Create Video - VideoAI</title>
        <meta name="description" content="Create your AI-generated video" />
      </Head>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Ready to Create Your Video</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Summary of selections */}
          <div className="mb-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Video Configuration Summary</h2>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Topic:</span>
                <span className="ml-2 text-gray-600">{state.selectedTopic?.title || state.keyword || 'Custom'}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Script:</span>
                <span className="ml-2 text-gray-600">{state.script?.title}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Voice:</span>
                <span className="ml-2 text-gray-600">{state.selectedVoice?.name} ({state.selectedVoice?.gender})</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Background:</span>
                <span className="ml-2 text-gray-600">{state.selectedBackground?.title}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Subtitles:</span>
                <span className="ml-2 text-gray-600">
                  {state.subtitleOptions?.enabled ? `Enabled (${state.subtitleOptions.language})` : 'Disabled'}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Estimated Duration:</span>
                <span className="ml-2 text-gray-600">
                  ~{state.script && state.script.content
                    ? Math.round(state.script.content.split(' ').length * 0.5)
                    : 30}s
                </span>
              </div>
            </div>
          </div>

          {/* Video metadata form */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter a compelling title for your video"
                maxLength={200}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <textarea
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="Describe what your video is about..."
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (Optional)</label>
              <Input
                value={videoTags}
                onChange={(e) => setVideoTags(e.target.value)}
                placeholder="ai, tutorial, education (comma-separated)"
              />
              <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
            </div>

            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Make this video public (visible to other users)</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBackToSubtitles}>
              Back to Subtitles
            </Button>
            
            <Button 
              onClick={handleCreateVideo}
              disabled={isCreating || !videoTitle.trim()}
              className="min-w-[150px]"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Video'
              )}
            </Button>
          </div>

          {/* Info section */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• AI will generate audio from your script using the selected voice</li>
              <li>• Background visuals will be prepared and optimized</li>
              <li>• Subtitles will be synchronized with the audio (if enabled)</li>
              <li>• Everything will be combined into a high-quality video</li>
              <li>• Your video will be uploaded to cloud storage for easy access</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              Video creation typically takes 1-5 minutes depending on length and complexity.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
