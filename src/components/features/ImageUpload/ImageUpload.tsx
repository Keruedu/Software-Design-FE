import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { Button } from '../../common/Button/Button';
import { MediaService } from '../../../services/media.service';
import { Background } from '../../../mockdata/backgrounds';

interface ImageUploadProps {
  onImageUploaded: (background: Background) => void;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  disabled = false,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file
      const validation = MediaService.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Create a prompt based on filename
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      const prompt = `Custom background: ${fileName}`;

      // Upload image
      const uploadedMedia = await MediaService.uploadImage(file, {
        prompt,
        onProgress: setUploadProgress
      });

      console.log('Uploaded media response:', uploadedMedia); // Debug log

      // Convert to Background format
      const background = MediaService.uploadedMediaToBackground(uploadedMedia);
      
      console.log('Converted background:', background); // Debug log

      // Clear error if upload successful
      setError(null);

      // Notify parent component
      onImageUploaded(background);

      // Show success notification
      toast.success(`Image uploaded successfully! "${background.title}" is ready to use.`, {
        position: "top-right",
        autoClose: 3000,
      });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.message || 'Failed to upload image';
      setError(errorMessage);
      
      // Show error notification
      toast.error(`Upload failed: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Button */}
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            <span>Uploading... {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : ''}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload Your Image</span>
          </>
        )}
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Progress bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* Help text */}
      {!isUploading && !error && (
        <p className="text-xs text-gray-500 text-center">
          Supported formats: JPEG, PNG, WebP (Max 10MB)
        </p>
      )}
    </div>
  );
};
