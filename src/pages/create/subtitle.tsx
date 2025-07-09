import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { Progress } from '../../components/common/Progress/Progress';
import { Modal } from '../../components/common/Modal/Modal';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { SubtitleOptions, SubtitleStyle, SUBTITLE_STYLES } from '../../types/subtitle';
import { VideoService } from '../../services/video.service';
import { HiDownload, HiPencil, HiLightBulb } from 'react-icons/hi';

export default function SubtitlePage() {
  const router = useRouter();
  const { state, setSubtitleOptions, setStep } = useVideoCreation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Video export states
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  
  // Subtitle configuration - only style selection
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [selectedStyleName, setSelectedStyleName] = useState('default');
  const [enable, setEnable] = useState(true);
  // Preview
  const [previewHtml, setPreviewHtml] = useState('');
  
  // Available styles - get from predefined styles
  const availableStyles = Object.keys(SUBTITLE_STYLES).map(key => ({
    ...SUBTITLE_STYLES[key],
    name: key
  }));

  // Check if we have required data
  useEffect(() => {
    if (!state.script || !state.selectedVoice || (!state.selectedBackgrounds || state.selectedBackgrounds.length === 0)) {
      router.replace('/create/background');
    }
  }, [state.script, state.selectedVoice, state.selectedBackgrounds, router]);

  // Generate preview when style changes
  useEffect(() => {
    generateStylePreview(selectedStyleName);
  }, [selectedStyleName]);

  const generateStylePreview = (styleName: string) => {
    try {
      const style = SUBTITLE_STYLES[styleName] || SUBTITLE_STYLES.default;
      setPreviewHtml(`
        <div style="
          background-color: ${style.backgroundColor};
          opacity: ${style.backgroundOpacity};
          color: ${style.fontColor};
          font-family: ${style.fontFamily};
          font-size: ${style.fontSize}px;
          padding: 8px 16px;
          border-radius: 4px;
          text-align: center;
          ${style.outline ? `text-shadow: 1px 1px 2px ${style.outlineColor};` : ''}
          margin: 8px 0;
        ">
          Sample subtitle text - ${style.name || styleName}
        </div>
      `);
    } catch (err) {
      console.error('Error generating style preview:', err);
    }
  };

  const handleExportVideo = async () => {
    setIsExporting(true);
    setError(null);
    setEnable(false);
    try {
      // Save subtitle options to context first
      const subtitleOptions: SubtitleOptions = {
        enabled: subtitlesEnabled,
        language: 'auto',
        style: SUBTITLE_STYLES[selectedStyleName] || SUBTITLE_STYLES.default,
        autoGenerate: false
      };
      setSubtitleOptions(subtitleOptions);
      
      // Get subtitle enabled state
      const subtitleEnabled = subtitleOptions?.enabled ?? true;
      
      // Create complete video using real API
      const params = {
        script_text: state.script?.content || '',
        // Priority: uploaded audio URL > generated audio URL > voice_id for generation
        ...(state.selectedUploadedAudio 
          ? { 
              audio_url: state.selectedUploadedAudio.audioUrl,
              audio_source: 'uploaded' as const,
              uploaded_audio_id: state.selectedUploadedAudio.id
            }
          : state.generatedAudio?.audioUrl 
            ? { 
                audio_url: state.generatedAudio.audioUrl,
                audio_source: 'generated' as const,
                voice_id: state.generatedAudio.voiceId,
                voice_settings: state.generatedAudio.settings
              }
            : { 
                voice_id: state.selectedVoice?.id || 'default',
                audio_source: 'voice_generation' as const,
                voice_settings: state.voiceSettings
              }
        ),
        background_image_id: state.selectedBackground?.id || 'default', // Legacy fallback
        background_image_ids: state.selectedBackgrounds?.length > 0 
          ? state.selectedBackgrounds.map(bg => bg.id)
          : undefined, // Send multiple backgrounds if available
        subtitle_enabled: subtitleEnabled,
        subtitle_language: subtitleOptions?.language || 'auto',
        subtitle_style: subtitleOptions?.style || SUBTITLE_STYLES.default // Send full style object
      };
      
      const result = await VideoService.createCompleteVideo(params);
      
      if (result && result.id) {
        // Get video preview URL
        const previewData = await VideoService.getVideoPreview(result.id);
        setExportedVideoUrl(previewData.video_url);
        setShowSuccessModal(true);
      } else {
        throw new Error('Failed to create video');
      }
    } catch (err: any) {
      if (err.message?.includes('session has expired') || err.message?.includes('login again')) {
        // Redirect to login page
        router.push('/login?returnUrl=/create/subtitle');
        return;
      }
      
      setError(err.message || 'Failed to export video. Please try again.');
      console.error('Video export error:', err);
    } finally {
      setIsExporting(false);
      setEnable(true);
    }
  };

  const handleEditVideo = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      // Save subtitle options to context first
      const subtitleOptions: SubtitleOptions = {
        enabled: subtitlesEnabled,
        language: 'auto',
        style: SUBTITLE_STYLES[selectedStyleName] || SUBTITLE_STYLES.default,
        autoGenerate: false
      };
      setSubtitleOptions(subtitleOptions);
      
      // Get subtitle enabled state
      const subtitleEnabled = subtitleOptions?.enabled ?? true;
      
      // Create complete video using real API
      const params = {
        script_text: state.script?.content || '',
        // Priority: uploaded audio URL > generated audio URL > voice_id for generation
        ...(state.selectedUploadedAudio 
          ? { 
              audio_url: state.selectedUploadedAudio.audioUrl,
              audio_source: 'uploaded' as const,
              uploaded_audio_id: state.selectedUploadedAudio.id
            }
          : state.generatedAudio?.audioUrl 
            ? { 
                audio_url: state.generatedAudio.audioUrl,
                audio_source: 'generated' as const,
                voice_id: state.generatedAudio.voiceId,
                voice_settings: state.generatedAudio.settings
              }
            : { 
                voice_id: state.selectedVoice?.id || 'default',
                audio_source: 'voice_generation' as const,
                voice_settings: state.voiceSettings
              }
        ),
        background_image_id: state.selectedBackground?.id || 'default', // Legacy fallback
        background_image_ids: state.selectedBackgrounds?.length > 0 
          ? state.selectedBackgrounds.map(bg => bg.id)
          : undefined, // Send multiple backgrounds if available
        subtitle_enabled: subtitleEnabled,
        subtitle_language: subtitleOptions?.language || 'auto',
        subtitle_style: subtitleOptions?.style || SUBTITLE_STYLES.default // Send full style object
      };
      
      const result = await VideoService.createCompleteVideo(params);
      
      if (result && result.id) {
        // Get video preview URL
        const previewData = await VideoService.getVideoPreview(result.id);
        const urlParams = new URLSearchParams();
        urlParams.append('videoUrl', previewData.video_url);
        if (state.script?.title) {
          urlParams.append('title', state.script.title);
        }
        router.push(`/create/edit?${urlParams.toString()}`);
      } else {
        throw new Error('Failed to create video');
      }
    } catch (err: any) {
      if (err.message?.includes('session has expired') || err.message?.includes('login again')) {
        // Redirect to login page
        router.push('/login?returnUrl=/create/subtitle');
        return;
      }
      
      setError(err.message || 'Failed to create video for editing. Please try again.');
      console.error('Video creation error:', err);
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



  const handleBack = () => {
    router.push('/create/background');
  };

  // Check if we have audio available for subtitle generation
  const hasAudio = state.selectedUploadedAudio || state.generatedAudio?.audioUrl;
  const audioSource = state.selectedUploadedAudio ? 'uploaded' : 'generated';

  return (
    <Layout>
      <Head>
        <title>Subtitle Settings - VideoAI</title>
        <meta name="description" content="Configure subtitle style for your video" />
      </Head>
      
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <Progress 
          steps={[
            { id: 'topic', name: 'Topic' },
            { id: 'script', name: 'Script' },
            { id: 'voice', name: 'Voice' },
            { id: 'background', name: 'Background' },
            { id: 'subtitle', name: 'Subtitle' }
          ]}
          currentStep="subtitle"
        />

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Subtitle Settings</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Audio Source Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">📤 Subtitle Source</h3>
            {hasAudio ? (
              <div className="text-blue-700">
                <p className="mb-2">✅ Subtitles will be generated from {audioSource} audio</p>
                {state.selectedUploadedAudio && (
                  <p className="text-sm">Audio: {state.selectedUploadedAudio.title}</p>
                )}
                {state.generatedAudio && !state.selectedUploadedAudio && (
                  <p className="text-sm">Voice: {state.selectedVoice?.name}</p>
                )}
                <p className="text-xs mt-1 text-blue-600 flex items-center">
                  <HiLightBulb className="w-3 h-3 mr-1" />
                  Language will be automatically detected from audio
                </p>
              </div>
            ) : (
              <div className="text-yellow-700">
                <p>⚠️ No audio available. Please go back and select/generate audio first.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Enable/Disable Subtitles */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Enable Subtitles</h2>
              <div className="flex items-center space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="subtitles"
                    checked={subtitlesEnabled}
                    onChange={() => setSubtitlesEnabled(true)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Enable subtitles</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="subtitles"
                    checked={!subtitlesEnabled}
                    onChange={() => setSubtitlesEnabled(false)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">No subtitles</span>
                </label>
              </div>
            </div>

            {/* Style Selection */}
            {subtitlesEnabled && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Subtitle Style</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableStyles.map((style) => (
                      <div
                        key={style.name}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedStyleName === style.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedStyleName(style.name || 'default')}
                      >
                        <div className="text-center">
                          <h3 className="font-medium text-gray-900 mb-2 capitalize">
                            {style.name || 'Default'}
                          </h3>
                          
                          {/* Style Preview */}
                          <div className="bg-gray-900 p-3 rounded">
                            <div
                              style={{
                                backgroundColor: style.backgroundColor,
                                color: style.fontColor,
                                fontFamily: style.fontFamily,
                                fontSize: `${Math.max(12, style.fontSize - 2)}px`,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                textAlign: 'center',
                                opacity: style.backgroundOpacity,
                                textShadow: style.outline ? `1px 1px 1px ${style.outlineColor}` : 'none'
                              }}
                            >
                              Sample Text
                            </div>
                          </div>

                          {/* Style Info */}
                          <div className="mt-2 text-xs text-gray-500">
                            <div>{style.fontFamily}</div>
                            <div>Size: {style.fontSize}px</div>
                            <div>Position: {style.position}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Style Preview */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
                  <div className="bg-gray-900 p-6 rounded-lg">
                    <div 
                      className="flex justify-center"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                    <p className="text-center text-gray-400 text-sm mt-2">
                      Preview of "{selectedStyleName}" style
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <div className="flex space-x-4">
              <Button 
                variant="outline"
                onClick={handleEditVideo}
                disabled={!hasAudio || isExporting}
                isLoading={isExporting&&enable}
                className="flex items-center space-x-2"
              >
                <HiPencil className="h-4 w-4" />
                <span>Edit Video</span>
              </Button>
              <Button 
                onClick={handleExportVideo}
                disabled={!hasAudio ||isExporting}
                isLoading={isExporting||!enable}
                className="flex items-center space-x-2"
              >
                <HiDownload className="h-4 w-4" />
                <span>Export Video</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Video Created Successfully!"
        footer={
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
