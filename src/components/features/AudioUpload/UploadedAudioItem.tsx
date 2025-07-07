import React from 'react';
import { UploadedAudio } from './AudioUpload';

interface UploadedAudioItemProps {
  audio: UploadedAudio;
  onRemove: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const UploadedAudioItem: React.FC<UploadedAudioItemProps> = ({
  audio,
  onRemove,
  isSelected = false,
  onSelect
}) => {
  return (
    <div 
      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-green-500 ring-2 ring-green-200 shadow-lg' 
          : 'border-green-200 hover:border-green-300 hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      {/* Audio Info */}
      <div className="p-3 bg-white">
        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(audio.id);
          }}
          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors shadow-md z-10"
          title="Remove uploaded audio"
        >
          ×
        </button>
        
        {/* Audio icon */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          
          {/* Uploaded badge */}
          <div className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
            UPLOADED
          </div>
        </div>
        
        {/* Title */}
        <p className="text-sm font-medium text-gray-900 truncate mb-1" title={audio.title}>
          {audio.title}
        </p>
        
        {/* Format info */}
        {audio.format && (
          <p className="text-xs text-gray-500 uppercase">
            {audio.format}
          </p>
        )}
        
        {/* Audio player */}
        <audio controls className="w-full mt-2" style={{ height: '30px' }}>
          <source src={audio.audioUrl} />
          Your browser does not support the audio element.
        </audio>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 bg-green-600 bg-opacity-10 flex items-center justify-center pointer-events-none">
            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">
              ✓
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
