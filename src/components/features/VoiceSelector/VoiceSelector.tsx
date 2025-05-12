import React, { useState, useEffect } from 'react';
import { FiPlay, FiSquare, FiVolume2 } from 'react-icons/fi';
import { Voice } from '../../../mockdata/voices';
import { Button } from '../../common/Button/Button';

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: Voice | null;
  onSelect: (voice: Voice) => void;
  onSettingsChange: (settings: any) => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelect,
  onSettingsChange
}) => {
  const [playing, setPlaying] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    speed: 1,
    pitch: 1
  });
  
  // Group voices by gender
  const groupedVoices = voices.reduce<Record<string, Voice[]>>((acc, voice) => {
    if (!acc[voice.gender]) {
      acc[voice.gender] = [];
    }
    acc[voice.gender].push(voice);
    return acc;
  }, {});
  
  // Helper function to get list of unique languages
  const getLanguages = () => {
    const languages = new Set(voices.map(voice => voice.language));
    return Array.from(languages);
  };
  
  const filteredVoices = activeFilter
    ? voices.filter(voice => voice.language === activeFilter)
    : voices;
  
  const handlePlay = (voiceId: string) => {
    if (playing === voiceId) {
      // Stop playing
      setPlaying(null);
    } else {
      // Play the audio sample
      setPlaying(voiceId);
      // Simulate audio playback - in a real app, this would play the actual audio
      setTimeout(() => {
        setPlaying(null);
      }, 3000);
    }
  };
  
  const handleFilterChange = (language: string | null) => {
    setActiveFilter(language);
  };
  
  const handleSettingsChange = (key: string, value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Select a Voice</h2>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Languages</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeFilter === null
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => handleFilterChange(null)}
          >
            All Languages
          </button>
          
          {getLanguages().map((language) => (
            <button
              key={language}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeFilter === language
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => handleFilterChange(language)}
            >
              {language}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Voice Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="speed" className="block text-sm text-gray-600 mb-1">
              Speaking Speed: {settings.speed.toFixed(1)}x
            </label>
            <input
              type="range"
              id="speed"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.speed}
              onChange={(e) => handleSettingsChange('speed', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="pitch" className="block text-sm text-gray-600 mb-1">
              Voice Pitch: {settings.pitch.toFixed(1)}x
            </label>
            <input
              type="range"
              id="pitch"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => handleSettingsChange('pitch', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {Object.entries(groupedVoices).map(([gender, voicesList]) => (
        <div key={gender} className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {gender.charAt(0).toUpperCase() + gender.slice(1)} Voices
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {voicesList
              .filter(voice => activeFilter ? voice.language === activeFilter : true)
              .map((voice) => (
                <div
                  key={voice.id}
                  className={`border rounded-lg p-4 cursor-pointer transition ${
                    selectedVoice?.id === voice.id
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onSelect(voice)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{voice.name}</h4>
                    {voice.premium && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">
                        Premium
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-2">
                      <FiVolume2 size={16} />
                      <span>{voice.language}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(voice.id);
                    }}
                    icon={playing === voice.id ? <FiSquare size={16} /> : <FiPlay size={16} />}
                  >
                    {playing === voice.id ? 'Stop' : 'Preview'}
                  </Button>
                </div>
              ))}
          </div>
        </div>
      ))}
      
      {filteredVoices.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No voices found for the selected language.
        </div>
      )}
    </div>
  );
};

export default VoiceSelector;
