import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { VoiceService } from '../../services/voice.service';
import { Voice } from '../../mockdata/voices';

export default function VoicePage() {
  const router = useRouter();
  const { state, setSelectedVoice, setVoiceSettings, setStep } = useVideoCreation();
  
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);
  const [speed, setSpeed] = useState(state.voiceSettings.speed);
  const [pitch, setPitch] = useState(state.voiceSettings.pitch);
  const [generatingPreview, setGeneratingPreview] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<{[key: string]: string}>({});
  
  // Check if we have a script, if not redirect to script step
  useEffect(() => {
    if (!state.script) {
      router.replace('/create/script');
    }
  }, [state.script, router]);
  
  // Load voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoading(true);
        const data = await VoiceService.getAllVoices();
        setVoices(data);
        
        // If we don't have a selected voice yet and we have voices, select the first one
        if (!state.selectedVoice && data.length > 0) {
          setSelectedVoice(data[0]);
        }
      } catch (err) {
        setError('Failed to load voices. Please try again.');
        console.error('Error fetching voices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, [setSelectedVoice, state.selectedVoice]);
    const handlePlayPreview = async (voiceId: string) => {
    try {
      // Stop any currently playing audio
      if (previewPlaying) {
        setPreviewPlaying(null);
      }
      
      // If clicking on the same voice that's playing, just stop it
      if (previewPlaying === voiceId) {
        return;
      }
      
      // Create cache key with current settings
      const cacheKey = `${voiceId}_${speed}_${pitch}`;
      
      // Check if we have cached audio
      if (audioCache[cacheKey]) {
        const audio = new Audio(audioCache[cacheKey]);
        audio.play();
        setPreviewPlaying(voiceId);
        
        audio.onended = () => {
          setPreviewPlaying(null);
        };
        return;
      }
      
      // Generate new audio preview
      setGeneratingPreview(voiceId);
      
      // Use a short preview text
      const previewText = "Hello! This is how I sound with your current settings. I can help narrate your video content.";
      
      const result = await VoiceService.generateVoiceAudio({
        text: previewText,
        voiceId: voiceId,
        settings: { speed, pitch }
      });
      
      if (result?.audioUrl) {
        // Cache the audio URL
        setAudioCache(prev => ({
          ...prev,
          [cacheKey]: result.audioUrl
        }));
        
        // Play the audio
        const audio = new Audio(result.audioUrl);
        audio.play();
        setPreviewPlaying(voiceId);
        
        audio.onended = () => {
          setPreviewPlaying(null);
        };
      }
      
    } catch (err) {
      console.error('Error generating audio preview:', err);
      alert('Could not generate audio preview. Please try again.');
    } finally {
      setGeneratingPreview(null);
    }
  };
  
  const handleSelectVoice = (voice: Voice) => {
    setSelectedVoice(voice);
  };
  
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);
    setVoiceSettings({ speed: newSpeed });
  };
  
  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPitch = parseInt(e.target.value);
    setPitch(newPitch);
    setVoiceSettings({ pitch: newPitch });
  };  
  const handleContinue = () => {
    setStep('background');
    router.push('/create/background');
  };
  
  const handleBack = () => {
    router.push('/create/script');
  };
  
  if (loading) {
    return (
      <Layout>
        <Head>
          <title>Select Voice - VideoAI</title>
        </Head>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow px-6 py-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Loading Voices</h1>
            
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
        <title>Select Voice - VideoAI</title>
        <meta name="description" content="Choose a voice for your video" />
      </Head>
      
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Select a Voice</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Available Voices</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voices.map((voice) => (
                <div
                  key={voice.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    state.selectedVoice?.id === voice.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectVoice(voice)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">{voice.name}</h3>
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      {voice.gender}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-1">
                    {voice.language} {voice.accent ? `(${voice.accent})` : ''}
                  </p>
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {voice.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                    <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    disabled={generatingPreview === voice.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPreview(voice.id);
                    }}
                  >
                    {generatingPreview === voice.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        Generating...
                      </div>
                    ) : previewPlaying === voice.id ? (
                      'Stop Preview'
                    ) : (
                      'Preview Voice'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Voice settings */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Voice Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-1">
                  Speaking Speed: {speed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  id="speed"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={handleSpeedChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="pitch" className="block text-sm font-medium text-gray-700 mb-1">
                  Voice Pitch: {pitch > 0 ? `+${pitch}` : pitch}
                </label>
                <input
                  type="range"
                  id="pitch"
                  min="-10"
                  max="10"
                  step="1"
                  value={pitch}
                  onChange={handlePitchChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Lower</span>
                  <span>Normal</span>
                  <span>Higher</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button 
              onClick={handleContinue}
              disabled={!state.selectedVoice}
            >
              Continue to Background Selection
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
