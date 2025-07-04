import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { ImageUpload, UploadedBackgroundItem } from '../../components/features/ImageUpload';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { Background } from '../../mockdata/backgrounds';
import { VoiceGenerationResult, VoiceService } from '../../services/voice.service';
import { BackgroundService, StyleOption } from '../../services/background.service';

const getBackgrounds = async (): Promise<Background[]> => {
  try {
    return await BackgroundService.getAllBackgrounds();
  } catch (error) {
    console.error('Error loading backgrounds:', error);
    const { mockBackgrounds } = await import('../../mockdata/backgrounds');
    return mockBackgrounds;
  }
};

export default function BackgroundPage() {
  const router = useRouter();
  const { state, setSelectedBackgrounds, setStep } = useVideoCreation();

  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioPreview, setAudioPreview] = useState<VoiceGenerationResult | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [availableStyles, setAvailableStyles] = useState<StyleOption[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [generatingBackgrounds, setGeneratingBackgrounds] = useState(false);
  const [generatedBackgrounds, setGeneratedBackgrounds] = useState<Background[]>([]);
  const [uploadedBackgrounds, setUploadedBackgrounds] = useState<Background[]>([]);
  const [currentStep, setCurrentStep] = useState<'style' | 'backgrounds'>('style');
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  const selectedBackgrounds = state.selectedBackgrounds || [];
  const MAX_SELECTIONS = 3;

  // 👇 FLAG chống gọi nhiều lần (dù useEffect chạy 2 lần trong Strict Mode)
  const hasGeneratedAudio = useRef(false);

  useEffect(() => {
    if (!state.script || !state.selectedVoice) {
      router.replace('/create/voice');
    }
  }, [state.script, state.selectedVoice, router]);

  useEffect(() => {
    setSelectedBackgrounds([]);
    
    // Load uploaded backgrounds from localStorage
    const savedUploaded = localStorage.getItem('uploadedBackgrounds');
    if (savedUploaded) {
      try {
        const parsed = JSON.parse(savedUploaded);
        if (Array.isArray(parsed)) {
          setUploadedBackgrounds(parsed);
        }
      } catch (error) {
        console.error('Failed to load uploaded backgrounds:', error);
      }
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const styles = BackgroundService.getAvailableStyles();
        setAvailableStyles(styles);
        const defaultBackgrounds = await getBackgrounds();
        setBackgrounds(defaultBackgrounds);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // ✅ FIX gọi generateVoiceAudio() 2 lần
  useEffect(() => {
    const generateAudioPreview = async () => {
      if (
        state.script &&
        state.selectedVoice &&
        !hasGeneratedAudio.current
      ) {
        hasGeneratedAudio.current = true;
        setGeneratingAudio(true);
        try {
          const result = await VoiceService.generateVoiceAudio({
            text: state.script.content || 'Preview text',
            voiceId: state.selectedVoice.id,
            settings: state.voiceSettings
          });
          setAudioPreview(result);
        } catch (err) {
          console.error('Failed to generate audio preview:', err);
        } finally {
          setGeneratingAudio(false);
        }
      }
    };

    generateAudioPreview();
  }, [state.script, state.selectedVoice, state.voiceSettings]);

  const handleSelectBackground = (background: Background) => {
    const isSelected = selectedBackgrounds.some(bg => bg.id === background.id);
    if (isSelected) {
      const newSelection = selectedBackgrounds.filter(bg => bg.id !== background.id);
      setSelectedBackgrounds(newSelection);
    } else {
      if (selectedBackgrounds.length < MAX_SELECTIONS) {
        const newSelection = [...selectedBackgrounds, background];
        setSelectedBackgrounds(newSelection);
      }
    }
  };

  const handleFilterChange = (category: string | null) => {
    setSelectedFilter(category);
  };

  const handleSelectStyle = async (style: StyleOption) => {
    setSelectedStyle(style);
    setGeneratingBackgrounds(true);
    setError(null);

    try {
      let generatedBgs: Background[] = [];

      if (state.script?.imagePrompts && state.script.imagePrompts.length > 0) {
        const sceneBackgrounds = await BackgroundService.generateBackgroundsForScenes(
          state.script.imagePrompts,
          style.id,
          1
        );

        generatedBgs = Object.entries(sceneBackgrounds).flatMap(([sceneIndex, backgrounds]) =>
          backgrounds.map(bg => ({
            ...bg,
            title: `Scene ${parseInt(sceneIndex) + 1}: ${bg.title}`,
            sceneIndex: parseInt(sceneIndex),
            tags: [...(bg.tags || []), `Scene ${parseInt(sceneIndex) + 1}`]
          }))
        );
      } else {
        generatedBgs = await BackgroundService.generateBackgroundsFromScript({
          script_text: state.script?.content || 'Create a background for video',
          style: style.id,
          count: 4
        });
      }

      setGeneratedBackgrounds(generatedBgs);
      setCurrentStep('backgrounds');
    } catch (err: any) {
      console.error('Failed to generate backgrounds:', err);
      setError(err.message || 'Failed to generate backgrounds. Please try again.');
      setGeneratedBackgrounds(backgrounds.slice(0, 4));
      setCurrentStep('backgrounds');
    } finally {
      setGeneratingBackgrounds(false);
    }
  };

  const handleBackToStyles = () => {
    setCurrentStep('style');
    setSelectedStyle(null);
    setGeneratedBackgrounds([]);
    setUploadedBackgrounds([]);
    setSelectedBackgrounds([]);
  };

  const handleImageUploaded = (background: Background) => {
    const updatedUploaded = [background, ...uploadedBackgrounds];
    setUploadedBackgrounds(updatedUploaded);
    
    // Save to localStorage
    localStorage.setItem('uploadedBackgrounds', JSON.stringify(updatedUploaded));
    
    // Auto-select uploaded image if under limit
    if (selectedBackgrounds.length < MAX_SELECTIONS) {
      const newSelection = [...selectedBackgrounds, background];
      setSelectedBackgrounds(newSelection);
    }
  };

  const handleRemoveUploadedBackground = (backgroundId: string) => {
    const updatedUploaded = uploadedBackgrounds.filter(bg => bg.id !== backgroundId);
    setUploadedBackgrounds(updatedUploaded);
    localStorage.setItem('uploadedBackgrounds', JSON.stringify(updatedUploaded));
    
    // Also remove from selected if it was selected
    const updatedSelected = selectedBackgrounds.filter(bg => bg.id !== backgroundId);
    setSelectedBackgrounds(updatedSelected);
  };

  const handleImageError = (styleId: string) => {
    setImageLoadErrors(prev => new Set([...prev, styleId]));
  };

  const filteredBackgrounds = selectedFilter
    ? backgrounds.filter(bg => bg.category === selectedFilter)
    : backgrounds;

  const uniqueCategories = [...new Set(backgrounds.map(bg => bg.category))];

  const handleContinue = () => {
    setStep('preview');
    router.push('/create/preview');
  };

  const handleBack = () => {
    router.push('/create/voice');
  };

  const renderAudioPreview = () => {
    if (generatingAudio) {
      return (
        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
          <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          <span className="text-gray-600">Generating audio preview...</span>
        </div>
      );
    }

    if (audioPreview) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Audio Preview</p>
          <audio controls className="w-full" src={audioPreview.audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    return null;
  };

  const renderStyleSelection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Art Style</h2>
        <p className="text-sm text-gray-600 mb-6">
          Select an art style to generate backgrounds for your video based on your script content. 
          Each style will create unique, AI-generated backgrounds that match your story.
        </p>
      </div>

      {generatingBackgrounds && (
        <div className="flex items-center justify-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <div className="animate-spin mr-3 h-8 w-8 border-3 border-blue-500 rounded-full border-t-transparent"></div>
          <div className="text-center">
            <span className="text-blue-700 font-semibold text-lg">Generating backgrounds with {selectedStyle?.name} style...</span>
            <p className="text-blue-600 text-sm mt-1">This may take a few moments</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableStyles.map((style) => (
          <div
            key={style.id}
            className={`border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:scale-[1.02] ${
              generatingBackgrounds ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={() => !generatingBackgrounds && handleSelectStyle(style)}
          >
            {/* Preview Image */}
            <div 
              className="h-40 bg-gray-200 bg-cover bg-center relative"
              style={{ 
                backgroundImage: (style.previewImage && !imageLoadErrors.has(style.id)) 
                  ? `url(${style.previewImage})` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundColor: (style.previewImage && !imageLoadErrors.has(style.id)) ? 'transparent' : '#667eea'
              }}
            >
              {/* Hidden image to detect load errors */}
              {style.previewImage && !imageLoadErrors.has(style.id) && (
                <img 
                  src={style.previewImage} 
                  alt={style.name}
                  className="hidden"
                  onError={() => handleImageError(style.id)}
                />
              )}
              
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              
              {/* Fallback content when no image or load error */}
              {(!style.previewImage || imageLoadErrors.has(style.id)) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-6xl opacity-30">{style.emoji || '🎨'}</div>
                </div>
              )}
              
              {/* Style name overlay */}
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="font-bold text-white text-lg drop-shadow-lg">{style.name}</h3>
              </div>

              {/* Art style icon */}
              <div className="absolute top-3 right-3 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl">{style.emoji || '🎨'}</span>
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-blue-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Description */}
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>{style.description}</p>
              
              {/* Generate button indicator */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Generate Backgrounds</span>
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-blue-600 text-sm font-bold">→</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBackgroundSelection = () => {
    // Combine generated, uploaded, and default backgrounds
    let backgroundsToShow: Background[] = [];
    
    if (generatedBackgrounds.length > 0) {
      backgroundsToShow = [...generatedBackgrounds];
    }
    
    // Add uploaded backgrounds
    if (uploadedBackgrounds.length > 0) {
      backgroundsToShow = [...uploadedBackgrounds, ...backgroundsToShow];
    }
    
    // Add default backgrounds if no generated ones
    if (generatedBackgrounds.length === 0) {
      backgroundsToShow = [...backgroundsToShow, ...filteredBackgrounds];
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              {generatedBackgrounds.length > 0 ? `Generated Backgrounds (${selectedStyle?.name})` : 'Available Backgrounds'}
            </h2>
            <p className="text-sm text-gray-600">
              {generatedBackgrounds.length > 0
                ? 'AI-generated backgrounds based on your script and selected style'
                : 'Choose from our collection or upload your own backgrounds'}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Select up to {MAX_SELECTIONS} backgrounds. Selected: {selectedBackgrounds.length}/{MAX_SELECTIONS}
            </p>
          </div>

          <div className="flex space-x-3">
            {generatedBackgrounds.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleBackToStyles}>
                Try Different Style
              </Button>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Your Own Background
              </h3>
              <p className="text-xs text-gray-500">Upload a custom image to use as your video background</p>
            </div>
            <div className="md:w-64">
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                disabled={generatingBackgrounds}
              />
            </div>
          </div>
          
          {uploadedBackgrounds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-green-600 font-medium">
                  ✅ {uploadedBackgrounds.length} custom background{uploadedBackgrounds.length !== 1 ? 's' : ''} uploaded
                </p>
                <button
                  onClick={() => {
                    setUploadedBackgrounds([]);
                    localStorage.removeItem('uploadedBackgrounds');
                    // Remove from selected as well
                    const updatedSelected = selectedBackgrounds.filter(bg => 
                      !uploadedBackgrounds.some(uploaded => uploaded.id === bg.id)
                    );
                    setSelectedBackgrounds(updatedSelected);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                >
                  Clear all
                </button>
              </div>
              
              {/* Mini preview of uploaded backgrounds */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {uploadedBackgrounds.slice(0, 6).map((bg) => (
                  <UploadedBackgroundItem
                    key={bg.id}
                    background={bg}
                    onRemove={handleRemoveUploadedBackground}
                    isSelected={selectedBackgrounds.some(selected => selected.id === bg.id)}
                    onSelect={() => handleSelectBackground(bg)}
                  />
                ))}
                {uploadedBackgrounds.length > 6 && (
                  <div className="h-20 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500">
                    +{uploadedBackgrounds.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {backgroundsToShow.map((background) => {
            const isSelected = selectedBackgrounds.some(bg => bg.id === background.id);
            const selectedIndex = selectedBackgrounds.findIndex(bg => bg.id === background.id);
            const canSelect = selectedBackgrounds.length < MAX_SELECTIONS || isSelected;

            return (
              <div
                key={background.id}
                className={`border rounded-lg cursor-pointer transition-all overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : canSelect
                    ? 'hover:border-blue-300 hover:shadow-md'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => canSelect && handleSelectBackground(background)}
              >
                <div
                  className="h-32 bg-gray-200 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${background.imageUrl})` }}
                >
                  {background.premium && (
                    <span className="absolute top-1 right-1 bg-yellow-400 text-yellow-800 text-xs font-bold px-1 rounded">
                      PREMIUM
                    </span>
                  )}
                  {generatedBackgrounds.length > 0 && generatedBackgrounds.some(bg => bg.id === background.id) && (
                    <span className="absolute top-1 left-1 bg-green-500 text-white text-xs font-bold px-1 rounded">
                      AI
                    </span>
                  )}
                  {uploadedBackgrounds.some(bg => bg.id === background.id) && (
                    <>
                      <span className="absolute top-1 left-1 bg-purple-500 text-white text-xs font-bold px-1 rounded">
                        UPLOADED
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUploadedBackground(background.id);
                        }}
                        className="absolute top-1 right-7 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors"
                        title="Remove uploaded image"
                      >
                        ×
                      </button>
                    </>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {selectedIndex + 1}
                      </div>
                    </div>
                  )}
                  {!canSelect && !isSelected && (
                    <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Max {MAX_SELECTIONS}</span>
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <h3 className="text-xs font-medium text-gray-900 truncate">{background.title}</h3>
                  {background.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {background.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-600 px-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {backgroundsToShow.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No backgrounds found.
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <Head>
          <title>Select Background - VideoAI</title>
        </Head>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow px-6 py-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Loading Backgrounds</h1>
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
        <title>Select Background - VideoAI</title>
        <meta name="description" content="Choose a background for your video" />
      </Head>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {currentStep === 'style' ? 'Select Background Style' : 'Select Background'}
          </h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-8">{renderAudioPreview()}</div>

          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${currentStep === 'style' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 'style' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Choose Style</span>
              </div>
              <div className={`flex-1 h-px ${selectedStyle ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center ${currentStep === 'backgrounds' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 'backgrounds' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Select Background</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            {currentStep === 'style' ? renderStyleSelection() : renderBackgroundSelection()}
          </div>

          <div className="flex flex-col md:flex-row md:justify-between gap-4 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={handleBack} className="px-6 py-2 w-full md:w-auto">
              Back
            </Button>
            <Button onClick={handleContinue} disabled={selectedBackgrounds.length === 0} className="px-6 py-2 w-full md:w-auto">
              Continue to Video Editor ({selectedBackgrounds.length} background
              {selectedBackgrounds.length !== 1 ? 's' : ''})
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
