import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { AudioUpload, UploadedAudio, UploadedAudioItem } from '../../components/features/AudioUpload';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { VoiceService } from '../../services/voice.service';
import { Voice } from '../../mockdata/voices';

// Static voice preview URLs mapping
const voicePreviewUrls: {[key: string]: string} = {
  'zephyr': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135482/zephyr_nelkvt.wav',
  'puck': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135481/puck_grjtt8.wav',
  'charon': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135480/charon_cvqifd.wav',
  'kore': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135478/kore_wtwmkj.wav',
  'fenrir': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135477/fenrir_sx8cfr.wav',
  'leda': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135476/leda_tzzina.wav',
  'orus': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135476/orus_sweci4.wav',
  'aoede': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135475/aoede_wpxdpo.wav',
  'callirrhoe': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135475/callirrhoe_bgda92.wav',
  'autonoe': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135474/autonoe_w8robg.wav',
  'enceladus': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135474/enceladus_wzx5wc.wav',
  'iapetus': 'https://res.cloudinary.com/dpoc6susa/video/upload/v1752135474/iapetus_dvea3h.wav',
};

export default function VoicePage() {
  const router = useRouter();
  const { state, setSelectedVoice, setVoiceSettings, setGeneratedAudio, setSelectedUploadedAudio, setStep } = useVideoCreation();
  
  const [voices, setVoices] = useState<Voice[]>([]);
  const [uploadedAudios, setUploadedAudios] = useState<UploadedAudio[]>([]);
  const [localSelectedUploadedAudio, setLocalSelectedUploadedAudio] = useState<UploadedAudio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);
  const [speed, setSpeed] = useState(state.voiceSettings.speed);
  const [pitch, setPitch] = useState(state.voiceSettings.pitch);
  const [generatingPreview, setGeneratingPreview] = useState<string | null>(null);
  const [useUploadedAudio, setUseUploadedAudio] = useState(false);
  // Lưu trữ tham chiếu đến audio đang phát
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Check if we have a script, if not redirect to script step
  useEffect(() => {
    if (!state.script) {
      router.replace('/create/script');
    }
  }, [state.script, router]);

  // Load uploaded audios from localStorage
  useEffect(() => {
    const savedUploaded = localStorage.getItem('uploadedAudios');
    if (savedUploaded) {
      try {
        const parsed = JSON.parse(savedUploaded);
        if (Array.isArray(parsed)) {
          setUploadedAudios(parsed);
        }
      } catch (error) {
        console.error('Failed to load uploaded audios:', error);
      }
    }
  }, []);
  
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
      // Nếu đang nhấn vào voice đang phát, dừng lại
      if (previewPlaying === voiceId) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }
        setPreviewPlaying(null);
        return;
      }
      
      // Dừng audio đang phát (nếu có)
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setPreviewPlaying(null);
      
      // Set generating preview state to show loading indicator
      setGeneratingPreview(voiceId);
      
      // Mapping from voice IDs (v1, v2, etc.) to voice names in voicePreviewUrls
      const voiceIdToNameMap: {[key: string]: string} = {
        'v1': 'zephyr',
        'v2': 'puck',
        'v3': 'charon',
        'v4': 'kore',
        'v5': 'fenrir',
        'v6': 'leda',
        'v7': 'orus',
        'v8': 'aoede',
        'v9': 'callirrhoe',
        'v10': 'autonoe',
        'v11': 'enceladus',
        'v12': 'iapetus'
      };
      
      // Get the voice name from the ID
      const voiceName = voiceIdToNameMap[voiceId];
      
      if (!voiceName) {
        console.error(`No voice name mapping for voice ID: ${voiceId}`);
        alert('Could not find voice preview. Please try another voice.');
        return;
      }
      
      // Get the static preview URL using the voice name
      const previewUrl = voicePreviewUrls[voiceName];
      
      if (!previewUrl) {
        console.error(`No preview URL found for voice name: ${voiceName}`);
        alert('Could not find voice preview. Please try another voice.');
        return;
      }
      
      // Play the audio using the static URL
      const audio = new Audio(previewUrl);
      audioRef.current = audio;
      audio.play();
      setPreviewPlaying(voiceId);
      
      audio.onended = () => {
        audioRef.current = null;
        setPreviewPlaying(null);
      };
      
    } catch (err) {
      console.error('Error playing audio preview:', err);
      alert('Could not play audio preview. Please try again.');
    } finally {
      setGeneratingPreview(null);
    }
  };
  
  const handleSelectVoice = (voice: Voice) => {
    setSelectedVoice(voice);
    setUseUploadedAudio(false);
    setLocalSelectedUploadedAudio(null);
    setSelectedUploadedAudio(null);
    // Clear generated audio when changing voice since it's no longer valid
    setGeneratedAudio(null);
    console.log('🔄 Cleared generated audio due to voice change');
  };

  const handleAudioUploaded = (audio: UploadedAudio) => {
    const updatedUploaded = [audio, ...uploadedAudios];
    setUploadedAudios(updatedUploaded);
    
    // Save to localStorage
    localStorage.setItem('uploadedAudios', JSON.stringify(updatedUploaded));
    
    // Auto-select uploaded audio and save to context
    setLocalSelectedUploadedAudio(audio);
    setSelectedUploadedAudio({
      id: audio.id,
      title: audio.title,
      audioUrl: audio.audioUrl
    });
    setUseUploadedAudio(true);
    setSelectedVoice(null);
  };

  const handleSelectUploadedAudio = (audio: UploadedAudio) => {
    setLocalSelectedUploadedAudio(audio);
    setSelectedUploadedAudio({
      id: audio.id,
      title: audio.title,
      audioUrl: audio.audioUrl
    });
    setUseUploadedAudio(true);
    setSelectedVoice(null);
  };

  const handleRemoveUploadedAudio = (audioId: string) => {
    const updatedUploaded = uploadedAudios.filter(audio => audio.id !== audioId);
    setUploadedAudios(updatedUploaded);
    localStorage.setItem('uploadedAudios', JSON.stringify(updatedUploaded));
    
    // If the removed audio was selected, clear selection
    if (localSelectedUploadedAudio?.id === audioId) {
      setLocalSelectedUploadedAudio(null);
      setSelectedUploadedAudio(null);
      setUseUploadedAudio(false);
    }
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
    // Store audio choice in context (either voice or uploaded audio)
    if (useUploadedAudio && localSelectedUploadedAudio) {
      // Upload audio selected - already saved to context
      console.log('Using uploaded audio:', localSelectedUploadedAudio);
    }
    
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow px-8 py-10 text-center">
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
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow px-8 py-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Select a Voice</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Your Own Audio</h2>
            
            {/* Upload Section */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4h10m-5 10V8m-7 0v10a2 2 0 002 2h10a2 2 0 002-2V8H5z" />
                    </svg>
                    Upload Custom Audio
                  </h3>
                  <p className="text-xs text-gray-500">Upload your own audio file to use as narration</p>
                </div>
                <div className="md:w-64">
                  <AudioUpload
                    onAudioUploaded={handleAudioUploaded}
                    disabled={false}
                  />
                </div>
              </div>
              
              {uploadedAudios.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-green-600 font-medium">
                      ✅ {uploadedAudios.length} custom audio{uploadedAudios.length !== 1 ? 's' : ''} uploaded
                    </p>
                    <button
                      onClick={() => {
                        setUploadedAudios([]);
                        localStorage.removeItem('uploadedAudios');
                        setSelectedUploadedAudio(null);
                        setUseUploadedAudio(false);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                    >
                      Clear all
                    </button>
                  </div>
                  
                  {/* Mini preview of uploaded audios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {uploadedAudios.slice(0, 3).map((audio) => (
                      <UploadedAudioItem
                        key={audio.id}
                        audio={audio}
                        onRemove={handleRemoveUploadedAudio}
                        isSelected={localSelectedUploadedAudio?.id === audio.id}
                        onSelect={() => handleSelectUploadedAudio(audio)}
                      />
                    ))}
                    {uploadedAudios.length > 3 && (
                      <div className="h-20 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500">
                        +{uploadedAudios.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">AI Generated Voices</h2>
              {useUploadedAudio && (
                <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full font-medium">
                  Using uploaded audio
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {voices.map((voice) => (
                <div
                  key={voice.id}
                  className={`border rounded-lg p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    state.selectedVoice?.id === voice.id && !useUploadedAudio
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : useUploadedAudio
                      ? 'border-gray-200 bg-gray-50 opacity-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  onClick={() => !useUploadedAudio && handleSelectVoice(voice)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 text-base">{voice.name}</h3>
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
                      {voice.gender}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {voice.language} {voice.accent ? `(${voice.accent})` : ''}
                  </p>
                  
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {voice.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                    <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-white hover:bg-blue-50 border-blue-200 text-blue-700 font-medium"
                    disabled={generatingPreview === voice.id || useUploadedAudio}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPreview(voice.id);
                    }}
                  >
                    {generatingPreview === voice.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        Loading...
                      </div>
                    ) : previewPlaying === voice.id ? (
                      'Stop Preview'
                    ) : useUploadedAudio ? (
                      'Using Custom Audio'
                    ) : (
                      'Preview Voice'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Voice settings - only show if using AI voice
          {!useUploadedAudio && (
            <div className="mb-10">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Voice Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Slow</span>
                    <span>Normal</span>
                    <span>Fast</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label htmlFor="pitch" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Lower</span>
                    <span>Normal</span>
                    <span>Higher</span>
                  </div>
                </div>
              </div>
            </div>
          )} */}
          
          <div className="flex flex-col md:flex-row md:justify-between gap-4 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={handleBack} className="px-6 py-2 w-full md:w-auto">
              Back
            </Button>
            <Button 
              onClick={handleContinue}
              disabled={!state.selectedVoice && !localSelectedUploadedAudio}
              className="px-6 py-2 w-full md:w-auto"
            >
              Continue to Background Selection
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
