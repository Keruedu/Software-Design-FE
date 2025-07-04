import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { Button } from '../../common/Button/Button';
import { MediaService } from '../../../services/media.service';

export interface UploadedAudio {
  id: string;
  title: string;
  audioUrl: string;
  duration?: number;
  format?: string;
}

interface AudioUploadProps {
  onAudioUploaded: (audio: UploadedAudio) => void;
  disabled?: boolean;
  className?: string;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({
  onAudioUploaded,
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
      // Debug: Log file information
      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      // Validate file
      const validation = MediaService.validateAudioFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Create a prompt based on filename
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      const prompt = `Custom audio: ${fileName}`;

      // Upload audio
      const uploadedMedia = await MediaService.uploadAudio(file, {
        prompt,
        onProgress: setUploadProgress
      });

      console.log('Uploaded audio response:', uploadedMedia); // Debug log

      // Convert to UploadedAudio format
      const audio: UploadedAudio = {
        id: uploadedMedia.id,
        title: uploadedMedia.content || uploadedMedia.title || 'User Uploaded Audio',
        audioUrl: uploadedMedia.url,
        format: file.type.split('/')[1] || 'unknown'
      };
      
      console.log('Converted audio:', audio); // Debug log

      // Clear error if upload successful
      setError(null);

      // Notify parent component
      onAudioUploaded(audio);

      // Show success notification
      toast.success(`Audio uploaded successfully! "${audio.title}" is ready to use.`, {
        position: "top-right",
        autoClose: 3000,
      });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.message || 'Failed to upload audio';
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
        className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-green-300 hover:border-green-400 hover:bg-green-50 transition-colors"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
            <span>Uploading... {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : ''}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4h10m-5 10V8m-7 0v10a2 2 0 002 2h10a2 2 0 002-2V8H5z" />
            </svg>
            <span>Upload Your Audio</span>
          </>
        )}
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.webm,.flac"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Progress bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
          Supported formats: MP3, WAV, OGG, M4A, AAC, WebM, FLAC (Max 50MB)
        </p>
      )}
    </div>
  );
};
