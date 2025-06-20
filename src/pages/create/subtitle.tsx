import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { SubtitleService } from '../../services/subtitle.service';
import { SubtitleOptions, SubtitleStyle, SubtitleSegment, SUBTITLE_STYLES, SUPPORTED_LANGUAGES } from '../../types/subtitle';

export default function SubtitlePage() {
  const router = useRouter();
  const { state, setSubtitleOptions, setStep } = useVideoCreation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  // Subtitle configuration
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedStyleName, setSelectedStyleName] = useState('default');
  const [generationType, setGenerationType] = useState<'script' | 'audio'>('script');
  const [maxWordsPerSegment, setMaxWordsPerSegment] = useState(5);
  
  // Generated subtitle data
  const [subtitleResult, setSubtitleResult] = useState<any>(null);
  const [editableSegments, setEditableSegments] = useState<SubtitleSegment[]>([]);
  const [showSegmentEditor, setShowSegmentEditor] = useState(false);
  
  // Preview
  const [previewHtml, setPreviewHtml] = useState('');
  
  // Available options
  const [availableStyles, setAvailableStyles] = useState<SubtitleStyle[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  // Check if we have required data
  useEffect(() => {
    if (!state.script || !state.selectedVoice || !state.selectedBackground) {
      router.replace('/create/background');
    }
  }, [state.script, state.selectedVoice, state.selectedBackground, router]);

  // Load subtitle options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true);
        const options = await SubtitleService.getSubtitleOptions();
        setAvailableStyles(options.styles);
        setAvailableLanguages(options.languages);
        setError(null);
      } catch (err) {
        console.error('Error loading subtitle options:', err);
        // Fallback to default options
        setAvailableStyles(Object.values(SUBTITLE_STYLES));
        setAvailableLanguages(SUPPORTED_LANGUAGES.map(l => l.code));
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  // Auto-generate subtitles when script is available
  useEffect(() => {
    if (state.script && subtitlesEnabled && !subtitleResult && !generating) {
      handleGenerateSubtitles();
    }
  }, [state.script, subtitlesEnabled]);

  const handleGenerateSubtitles = async () => {
    if (!state.script) return;

    setGenerating(true);
    setError(null);

    try {
      let result;
      
      if (generationType === 'script') {
        // Generate from script text (faster)
        result = await SubtitleService.generateSubtitlesFromScript({
          scriptText: state.script.content,
          language: selectedLanguage,
          maxWordsPerSegment
        });
      } else {
        // Generate from audio (more accurate timing)
        if (!state.generatedAudio?.audioFile) {
          throw new Error('Audio file not available. Please go back and generate audio first.');
        }
        
        result = await SubtitleService.generateSubtitlesFromAudio({
          audioFile: state.generatedAudio.audioFile,
          language: selectedLanguage,
          maxWordsPerSegment
        });
      }

      setSubtitleResult(result);
      setEditableSegments(result.segments);
      
      console.log('✅ Subtitles generated:', result);

    } catch (err) {
      setError(`Failed to generate subtitles: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Subtitle generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSegmentEdit = (segmentId: number, field: keyof SubtitleSegment, value: any) => {
    setEditableSegments(prev => 
      prev.map(seg => 
        seg.id === segmentId 
          ? { ...seg, [field]: value }
          : seg
      )
    );
  };

  const handleSaveSegments = async () => {
    if (!subtitleResult) return;

    try {
      setLoading(true);
      const updated = await SubtitleService.updateSubtitleSegments(
        subtitleResult.id,
        editableSegments
      );
      setSubtitleResult(updated);
      setShowSegmentEditor(false);
      setError(null);
    } catch (err) {
      setError('Failed to save subtitle edits.');
      console.error('Error saving segments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStylePreview = async (styleName: string) => {
    if (!subtitleResult) return;

    try {
      const preview = await SubtitleService.getSubtitlePreview(subtitleResult.id, styleName);
      setPreviewHtml(preview.previewHtml);
    } catch (err) {
      console.error('Error getting style preview:', err);
      // Fallback preview
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
        ">
          Sample subtitle text
        </div>
      `);
    }
  };

  useEffect(() => {
    if (subtitleResult) {
      handleStylePreview(selectedStyleName);
    }
  }, [selectedStyleName, subtitleResult]);

  const handleContinue = () => {
    // Save subtitle options to context
    const subtitleOptions: SubtitleOptions = {
      enabled: subtitlesEnabled,
      language: selectedLanguage,
      style: SUBTITLE_STYLES[selectedStyleName] || SUBTITLE_STYLES.default,
      autoGenerate: generationType === 'script',
      segments: editableSegments
    };

    setSubtitleOptions(subtitleOptions);
    setStep('edit');
    router.push('/create/preview');
  };

  const handleSkip = () => {
    setSubtitleOptions({
      enabled: false,
      language: 'en',
      style: SUBTITLE_STYLES.default,
      autoGenerate: false
    });
    setStep('edit');
    router.push('/create/preview');
  };

  const handleBack = () => {
    router.push('/create/background');
  };

  if (loading && !availableStyles.length) {
    return (
      <Layout>
        <Head>
          <title>Loading Subtitle Options - VideoAI</title>
        </Head>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow px-6 py-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Loading Subtitle Options</h1>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Configure Subtitles - VideoAI</title>
        <meta name="description" content="Configure subtitles for your video" />
      </Head>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Configure Subtitles</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Enable/Disable Subtitles */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Add Subtitles to Video</h2>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={subtitlesEnabled}
                    onChange={() => setSubtitlesEnabled(!subtitlesEnabled)} 
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${subtitlesEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${subtitlesEnabled ? 'translate-x-6' : ''}`}></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {subtitlesEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {subtitlesEnabled && (
              <p className="text-sm text-gray-600">
                Subtitles will help make your video more accessible and engaging for viewers.
              </p>
            )}
          </div>

          {subtitlesEnabled && (
            <>
              {/* Generation Options */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Generation Method</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      generationType === 'script'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setGenerationType('script')}
                  >
                    <div className="font-medium text-gray-900">From Script</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Faster generation, estimated timing
                    </div>
                  </button>
                  <button
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      generationType === 'audio'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setGenerationType('audio')}
                  >
                    <div className="font-medium text-gray-900">From Audio</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Accurate timing, requires audio processing
                    </div>
                  </button>
                </div>
              </div>

              {/* Language and Settings */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Words per Segment</label>
                  <select
                    value={maxWordsPerSegment}
                    onChange={(e) => setMaxWordsPerSegment(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={3}>3 words</option>
                    <option value={5}>5 words</option>
                    <option value={7}>7 words</option>
                    <option value={10}>10 words</option>
                  </select>
                </div>
              </div>

              {/* Style Selection */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Subtitle Style</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.keys(SUBTITLE_STYLES).map(styleName => (
                    <button
                      key={styleName}
                      className={`p-3 border-2 rounded-lg text-left transition-colors capitalize ${
                        selectedStyleName === styleName
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedStyleName(styleName)}
                    >
                      {styleName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Preview */}
              {previewHtml && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Style Preview</h3>
                  <div className="bg-black rounded-lg p-8 flex items-center justify-center">
                    <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                </div>
              )}

              {/* Generate Subtitles Button */}
              {!subtitleResult && (
                <div className="mb-6">
                  <Button
                    onClick={handleGenerateSubtitles}
                    disabled={generating}
                    className="w-full"
                    variant="primary"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Subtitles...
                      </>
                    ) : (
                      'Generate Subtitles'
                    )}
                  </Button>
                </div>
              )}

              {/* Generated Subtitles */}
              {subtitleResult && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900">Generated Subtitles</h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowSegmentEditor(!showSegmentEditor)}
                        variant="outline"
                        size="sm"
                      >
                        {showSegmentEditor ? 'Hide Editor' : 'Edit Segments'}
                      </Button>
                      <Button
                        onClick={handleGenerateSubtitles}
                        variant="outline"
                        size="sm"
                        disabled={generating}
                      >
                        Regenerate
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {editableSegments.length} segments • {Math.round(subtitleResult.totalDuration)}s duration • {subtitleResult.source} generated
                    </p>
                    
                    {/* Preview first few segments */}
                    <div className="space-y-2">
                      {editableSegments.slice(0, 3).map(segment => (
                        <div key={segment.id} className="text-sm">
                          <span className="text-gray-500">{Math.round(segment.startTime)}s-{Math.round(segment.endTime)}s:</span>
                          <span className="ml-2">{segment.text}</span>
                        </div>
                      ))}
                      {editableSegments.length > 3 && (
                        <div className="text-sm text-gray-500">
                          ... and {editableSegments.length - 3} more segments
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Segment Editor */}
                  {showSegmentEditor && (
                    <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <h4 className="font-medium text-gray-900 mb-3">Edit Subtitle Segments</h4>
                      <div className="space-y-3">
                        {editableSegments.map(segment => (
                          <div key={segment.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-1 text-sm text-gray-500">#{segment.id}</div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                value={segment.startTime}
                                onChange={(e) => handleSegmentEdit(segment.id, 'startTime', parseFloat(e.target.value))}
                                placeholder="Start"
                                size="sm"
                                step="0.1"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                value={segment.endTime}
                                onChange={(e) => handleSegmentEdit(segment.id, 'endTime', parseFloat(e.target.value))}
                                placeholder="End"
                                size="sm"
                                step="0.1"
                              />
                            </div>
                            <div className="col-span-7">
                              <Input
                                value={segment.text}
                                onChange={(e) => handleSegmentEdit(segment.id, 'text', e.target.value)}
                                placeholder="Subtitle text"
                                size="sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={handleSaveSegments}
                          disabled={loading}
                          size="sm"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkip}>
                Skip Subtitles
              </Button>
              <Button 
                onClick={handleContinue}
                disabled={subtitlesEnabled && !subtitleResult && !generating}
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
