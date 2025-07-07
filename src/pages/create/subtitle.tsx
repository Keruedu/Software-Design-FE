import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { Progress } from '../../components/common/Progress/Progress';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { SubtitleOptions, SubtitleStyle, SUBTITLE_STYLES } from '../../types/subtitle';

export default function SubtitlePage() {
  const router = useRouter();
  const { state, setSubtitleOptions, setStep } = useVideoCreation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Subtitle configuration - only style selection
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [selectedStyleName, setSelectedStyleName] = useState('default');
  
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

  const handleContinue = () => {
    // Save subtitle options to context
    const subtitleOptions: SubtitleOptions = {
      enabled: subtitlesEnabled,
      language: 'auto', // Will be detected from audio
      style: SUBTITLE_STYLES[selectedStyleName] || SUBTITLE_STYLES.default,
      autoGenerate: false // Always generate from audio
    };

    setSubtitleOptions(subtitleOptions);
    setStep('preview');
    router.push('/create/preview');
  };

  const handleSkip = () => {
    setSubtitleOptions({
      enabled: false,
      language: 'auto',
      style: SUBTITLE_STYLES.default,
      autoGenerate: false
    });
    setStep('preview');
    router.push('/create/preview');
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
            { id: 'subtitle', name: 'Subtitle' },
            { id: 'preview', name: 'Preview' }
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
                <p className="text-xs mt-1 text-blue-600">
                  💡 Language will be automatically detected from audio
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
            <div className="space-x-4">
              <Button variant="outline" onClick={handleSkip}>
                Skip Subtitles
              </Button>
              <Button 
                onClick={handleContinue}
                disabled={!hasAudio && subtitlesEnabled}
                isLoading={loading}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
