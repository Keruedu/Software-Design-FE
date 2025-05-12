import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { Background } from '../../mockdata/backgrounds';
import { VoiceGenerationResult, VoiceService } from '../../services/voice.service';

// Mock function to get backgrounds
const getBackgrounds = async (): Promise<Background[]> => {
  // For demo purposes, let's import from mockdata
  const { mockBackgrounds } = await import('../../mockdata/backgrounds');
  return mockBackgrounds;
};

export default function BackgroundPage() {
  const router = useRouter();
  const { state, setSelectedBackground, setStep } = useVideoCreation();
  
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioPreview, setAudioPreview] = useState<VoiceGenerationResult | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
  // Check if we have voice selected, if not redirect
  useEffect(() => {
    if (!state.script || !state.selectedVoice) {
      router.replace('/create/voice');
    }
  }, [state.script, state.selectedVoice, router]);
  
  // Load backgrounds on component mount
  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        setLoading(true);
        const data = await getBackgrounds();
        setBackgrounds(data);
        
        // If we don't have a selected background yet and we have backgrounds, select the first one
        if (!state.selectedBackground && data.length > 0) {
          setSelectedBackground(data[0]);
        }
      } catch (err) {
        setError('Failed to load backgrounds. Please try again.');
        console.error('Error fetching backgrounds:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBackgrounds();
  }, [setSelectedBackground, state.selectedBackground]);
  
  // Generate audio preview when voice and script are ready
  useEffect(() => {
    const generateAudioPreview = async () => {
      if (state.script && state.selectedVoice && !audioPreview && !generatingAudio) {
        setGeneratingAudio(true);
        
        try {
          const result = await VoiceService.generateVoiceAudio({
            scriptId: state.script.id,
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
  }, [state.script, state.selectedVoice, state.voiceSettings, audioPreview, generatingAudio]);
  
  const handleSelectBackground = (background: Background) => {
    setSelectedBackground(background);
  };
  
  const handleFilterChange = (category: string | null) => {
    setSelectedFilter(category);
  };
  
  const filteredBackgrounds = selectedFilter 
    ? backgrounds.filter(bg => bg.category === selectedFilter) 
    : backgrounds;
  
  const uniqueCategories = [...new Set(backgrounds.map(bg => bg.category))];
  
  const handleContinue = () => {
    setStep('edit');
    router.push('/create/edit');
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
          <audio 
            controls 
            className="w-full" 
            src={audioPreview.audioUrl}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }
    
    return null;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Select a Background</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {/* Audio preview */}
          <div className="mb-8">
            {renderAudioPreview()}
          </div>
          
          {/* Category filters */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Background Categories</h2>
            
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === null
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange(null)}
              >
                All
              </button>
              
              {uniqueCategories.map((category) => (
                <button
                  key={category}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedFilter === category
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => handleFilterChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Available Backgrounds</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredBackgrounds.map((background) => (
                <div
                  key={background.id}
                  className={`border rounded-lg cursor-pointer transition-colors overflow-hidden ${
                    state.selectedBackground?.id === background.id 
                      ? 'ring-2 ring-blue-500' 
                      : 'hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectBackground(background)}
                >
                  <div 
                    className="h-32 bg-gray-200 bg-cover bg-center"
                    style={{ backgroundImage: `url(${background.imageUrl})` }}
                  >
                    {background.premium && (
                      <span className="absolute top-1 right-1 bg-yellow-400 text-yellow-800 text-xs font-bold px-1 rounded">
                        PREMIUM
                      </span>
                    )}
                  </div>
                  
                  <div className="p-2">
                    <h3 className="text-xs font-medium text-gray-900 truncate">{background.title}</h3>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredBackgrounds.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No backgrounds found in this category.
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button 
              onClick={handleContinue}
              disabled={!state.selectedBackground}
            >
              Continue to Video Editor
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
