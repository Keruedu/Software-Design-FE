import React from 'react';
import { Background } from '../../../mockdata/backgrounds';

interface UploadedBackgroundItemProps {
  background: Background;
  onRemove: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const UploadedBackgroundItem: React.FC<UploadedBackgroundItemProps> = ({
  background,
  onRemove,
  isSelected = false,
  onSelect
}) => {
  return (
    <div 
      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-purple-500 ring-2 ring-purple-200 shadow-lg' 
          : 'border-purple-200 hover:border-purple-300 hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      {/* Image */}
      <div
        className="h-20 bg-gray-200 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${background.imageUrl})` }}
      >
        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(background.id);
          }}
          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors shadow-md"
          title="Remove uploaded image"
        >
          ×
        </button>
        
        {/* Uploaded badge */}
        <div className="absolute bottom-1 left-1 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded">
          UPLOADED
        </div>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 bg-purple-600 bg-opacity-20 flex items-center justify-center">
            <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">
              ✓
            </div>
          </div>
        )}
      </div>
      
      {/* Title */}
      <div className="p-2 bg-white">
        <p className="text-xs font-medium text-gray-900 truncate" title={background.title}>
          {background.title}
        </p>
      </div>
    </div>
  );
};
