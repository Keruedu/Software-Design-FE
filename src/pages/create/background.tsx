import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { Background } from '../../mockdata/backgrounds';
import { BackgroundService, BackgroundGenerationParams } from '../../services/background.service';

export default function BackgroundPage() {
  const router = useRouter();
  const { state, setSelectedBackground, setStep } = useVideoCreation();
  
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCustomGenerator, setShowCustomGenerator] = useState(false);  const [customPrompt, setCustomPrompt] = useState('');
  const [customStyle, setCustomStyle] = useState('realistic');
  const [generatingCustom, setGeneratingCustom] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Check if we have required data, if not redirect
  useEffect(() => {
    if (!state.script || !state.selectedVoice) {
      router.replace('/create/voice');
    }
  }, [state.script, state.selectedVoice, router]);
    // Load backgrounds and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Only run once and if we have required data
      if (hasInitialized || !state.script || !state.selectedVoice) {
        return;
      }
      
      try {
        setLoading(true);
        setHasInitialized(true);
        
        console.log('🎨 Fetching backgrounds for script:', state.script.content.substring(0, 50) + '...');
        
        // Get recommended backgrounds based on script content and image prompts
        const recommendedBackgrounds = await BackgroundService.getRecommendedBackgrounds(
          state.script?.content,
          state.selectedVoice?.id,
          state.script?.imagePrompts // Pass image prompts from script
        );
        
        // Get all available categories
        const availableCategories = await BackgroundService.getAvailableCategories();
        
        setBackgrounds(recommendedBackgrounds);
        setCategories(availableCategories);
        
        // If we don't have a selected background yet and we have backgrounds, select the first one
        if (!state.selectedBackground && recommendedBackgrounds.length > 0) {
          setSelectedBackground(recommendedBackgrounds[0]);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load backgrounds. Please try again.');
        console.error('Error fetching backgrounds:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hasInitialized, state.script?.id, state.selectedVoice?.id]);
  
  // Handle category filter change
  const handleCategoryFilter = async (category: string | null) => {
    setSelectedFilter(category);
    setLoading(true);
    
    try {
      let filteredBackgrounds;
      if (category) {
        filteredBackgrounds = await BackgroundService.getBackgroundsByCategory(category);      } else {
        filteredBackgrounds = await BackgroundService.getRecommendedBackgrounds(
          state.script?.content,
          state.selectedVoice?.id,
          state.script?.imagePrompts // Include image prompts
        );
      }
      setBackgrounds(filteredBackgrounds);
    } catch (err) {
      setError('Failed to filter backgrounds.');
      console.error('Error filtering backgrounds:', err);
    } finally {
      setLoading(false);
    }
  };
    // Handle custom background generation
  const handleGenerateCustomBackground = async () => {
    if (!customPrompt.trim()) {
      setError('Please enter a description for your custom background.');
      return;
    }
    
    setGeneratingCustom(true);
    setError(null);
    
    try {
      const params: BackgroundGenerationParams = {
        prompt: customPrompt,
        style: customStyle,
        resolution: "1080x1920"
      };
      
      const result = await BackgroundService.generateCustomBackground(params);
      
      // Create a Background object from the result
      const newBackground: Background = {
        id: result.id,
        title: `Custom: ${customPrompt.slice(0, 30)}...`,
        category: "Custom",
        imageUrl: result.imageUrl,
        tags: ["custom", "generated", result.style],
        premium: false
      };
      
      // Add to backgrounds list and select it
      setBackgrounds(prev => [newBackground, ...prev]);
      setSelectedBackground(newBackground);
      setShowCustomGenerator(false);
      setCustomPrompt('');
      
      console.log('✅ Custom background generated successfully:', result);
      
    } catch (err) {
      setError('Failed to generate custom background. Please try again.');
      console.error('Custom background generation error:', err);
    } finally {
      setGeneratingCustom(false);
    }
  };

  // Handle script-based background generation
  const handleGenerateFromScript = async () => {
    if (!state.script?.content) {
      setError('No script content available for background generation.');
      return;
    }
    
    setGeneratingCustom(true);
    setError(null);
    
    try {
      const result = await BackgroundService.generateBackgroundFromScript(
        state.script.content,
        customStyle,
        "1080x1920"
      );
      
      // Create a Background object from the result
      const newBackground: Background = {
        id: result.id,
        title: `AI Generated: ${state.script.title}`,
        category: "AI Generated",
        imageUrl: result.imageUrl,
        tags: ["ai-generated", "script-based", result.style],
        premium: false
      };
      
      // Add to backgrounds list and select it
      setBackgrounds(prev => [newBackground, ...prev]);
      setSelectedBackground(newBackground);
      
      console.log('✅ Script-based background generated successfully:', result);
      console.log('📝 Generated from script:', state.script.title);
      console.log('🎨 Generated prompt:', result.prompt);
      
    } catch (err) {
      setError('Failed to generate background from script. Please try again.');
      console.error('Script-based background generation error:', err);
    } finally {
      setGeneratingCustom(false);
    }
  };
  
  const handleSelectBackground = (background: Background) => {
    setSelectedBackground(background);
  };
  
  const filteredBackgrounds = selectedFilter 
    ? backgrounds.filter(bg => bg.category === selectedFilter) 
    : backgrounds;
  
  const uniqueCategories = [...new Set(backgrounds.map(bg => bg.category))];
  const handleContinue = () => {
    setStep('subtitle');
    router.push('/create/subtitle');
  };
  
  const handleBack = () => {
    router.push('/create/voice');
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
              {error}            </div>
          )}
          
          {/* Show script info if available */}
          {state.script && (
            <div className="mb-6 bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Script: {state.script.title}</h3>
              <p className="text-sm text-blue-700">
                {state.script.imagePrompts && state.script.imagePrompts.length > 0 
                  ? `🎨 Using ${state.script.imagePrompts.length} AI-generated backgrounds from your script`
                  : 'Showing recommended backgrounds based on your script content'
                }
              </p>
            </div>
          )}
          
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
                onClick={() => handleCategoryFilter(null)}
              >
                All
              </button>
                {categories.map((category) => (
                <button
                  key={category}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedFilter === category
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => handleCategoryFilter(category)}
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
