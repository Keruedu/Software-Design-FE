import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { VoiceService } from '../../services/voice.service';
import { Voice } from '../../mockdata/voices';

export default function VoiceGenerationPage() {
  const router = useRouter();
  const { state, setGeneratedAudio, setStep } = useVideoCreation();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [generatedAudio, setAudio] = useState<any>(null);
  
  // Check if we have required data
  useEffect(() => {
    if (!state.script || !state.selectedVoice) {
      router.replace('/create/voice');
    }
  }, [state.script, state.selectedVoice, router]);
  
  // Auto-generate audio when component loads
  useEffect(() => {
    if (state.script && state.selectedVoice && !generatedAudio) {
      handleGenerateAudio();
    }
  }, [state.script, state.selectedVoice]);
  
  const handleGenerateAudio = async () => {
    if (!state.script || !state.selectedVoice) return;
    
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      const result = await VoiceService.generateVoiceAudio({
        text: state.script.content,
        voiceId: state.selectedVoice.id,
        settings: state.voiceSettings
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setAudio(result);
      setGeneratedAudio(result);
      
      console.log('✅ Audio generated successfully:', result);
      
    } catch (err) {
      setError('Failed to generate audio. Please try again.');
      console.error('Audio generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleRegenerateAudio = () => {
    setAudio(null);
    handleGenerateAudio();
  };
  
  const handlePlayAudio = () => {
    if (generatedAudio?.audioUrl) {
      // Create audio element and play
      const audio = new Audio(generatedAudio.audioUrl);
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        alert('Could not play audio. The file may not be ready yet.');
      });
    }
  };
  
  const handleContinue = () => {
    setStep('background');
    router.push('/create/background');
  };
  
  const handleBack = () => {
    router.push('/create/voice');
  };
  
  if (isGenerating) {
    return (
      <Layout>
        <Head>
          <title>Generating Audio - VideoAI</title>
        </Head>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Generating Your Audio
            </h1>
            
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-64 bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <div className="animate-pulse flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              
              <p className="text-gray-600 text-center">
                Creating audio with <strong>{state.selectedVoice?.name}</strong> voice...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Progress: {progress}%
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Head>
        <title>Audio Generated - VideoAI</title>
        <meta name="description" content="Your audio has been generated" />
      </Head>
      
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Audio Generated!</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {generatedAudio && (
            <div className="mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-green-900">
                      Audio Ready! 🎉
                    </h3>
                    <p className="text-green-700 mt-1">
                      Voice: <strong>{state.selectedVoice?.name}</strong> | 
                      Duration: <strong>{Math.round(generatedAudio.duration)}s</strong>
                    </p>
                  </div>
                  <Button
                    onClick={handlePlayAudio}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    ▶️ Play Audio
                  </Button>
                </div>
                
                <div className="text-sm text-green-600">
                  <p><strong>Settings used:</strong></p>
                  <p>Speed: {generatedAudio.settings.speed}x | Pitch: {generatedAudio.settings.pitch}</p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleRegenerateAudio}
                  disabled={isGenerating}
                >
                  🔄 Regenerate Audio
                </Button>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Script Preview</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">{state.script?.title}</h3>
              <p className="text-gray-700 whitespace-pre-line">{state.script?.content}</p>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              ← Back to Voice Selection
            </Button>
            <Button 
              onClick={handleContinue}
              disabled={!generatedAudio}
            >
              Continue to Background Selection →
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
