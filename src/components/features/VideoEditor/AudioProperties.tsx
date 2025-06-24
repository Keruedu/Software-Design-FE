import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUpload, 
  FaPlay, 
  FaPause, 
  FaTrash,
  FaMusic,
} from 'react-icons/fa';
import { AudioTrackData } from '@/types/audio';

interface AudioPropertiesProps {
  uploadedAudios: AudioTrackData[];
  setUploadedAudios:(tracks:AudioTrackData[]) => void;
}

const AudioProperties: React.FC<AudioPropertiesProps> = ({
  uploadedAudios,
  setUploadedAudios
}) =>{
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = ""; 
    try {
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        const newAudio: AudioTrackData = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          originFile:file,
          file: file,
          duration: audio.duration,
          startTime: 0,
          volume: 0.5,
          trimStart: 0,
          trimEnd: audio.duration
        };
        
        setUploadedAudios([...uploadedAudios, newAudio]);
        URL.revokeObjectURL(audioUrl);
        
      };
      audio.onerror = () => {
        alert('Không thể tải file audio. Vui lòng kiểm tra định dạng file.');
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.src = audioUrl;
    } catch (error) {
      console.error('Error loading audio file:', error);
      alert('Lỗi khi tải file audio');
    }
  };
  const toggleAudioPreview = async (audio: AudioTrackData) => {
    if (isPlaying === audio.id) {
      audioRef.current?.pause();
      setIsPlaying(null);
    } else {
      try {
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(audio.file);
          audioRef.current.volume = audio.volume;
          audioRef.current.currentTime = audio.trimStart;
          
          // Set up event listeners
          const handleTimeUpdate = () => {
            if (audioRef.current && audioRef.current.currentTime >= audio.trimEnd) {
              audioRef.current.pause();
              setIsPlaying(null);
              audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
            }
          };
          
          audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
          await audioRef.current.play();
          setIsPlaying(audio.id);
        }
      } catch (error) {
        console.error('Error playing audio:', error);
        alert('Không thể phát audio');
      }
    }
  };

  const deleteAudio = (id: string) => {
    setUploadedAudios(uploadedAudios.filter(audio => audio.id !== id));
  };
  return (
    <div className="space-y-6">
        <audio ref={audioRef} onEnded={() => setIsPlaying(null)} />
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <FaMusic className="w-4 h-4 mr-2" />
            Upload Audio
          </h3>
          <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50">
            <FaUpload className="w-4 h-4" />
            <span>Chọn File Audio</span>
          </motion.button>
        </div>

        {uploadedAudios.length > 0 &&(
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Audio Tracks ({uploadedAudios.length})
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {uploadedAudios.map((audio)=>(
                  <motion.div
                    key={audio.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-3 rounded-lg border transition-all cursor-pointer border-blue-500 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {audio.name}
                    </span>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAudioPreview(audio);
                        }}
                        className="p-1.5 text-gray-600 hover:text-blue-600 rounded transition-colors"
                        title="Preview"
                      >
                        {isPlaying === audio.id ? 
                          <FaPause className="w-3 h-3" /> : 
                          <FaPlay className="w-3 h-3" />
                        }
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAudio(audio.id);
                        }}
                        className="p-1.5 text-gray-600 hover:text-red-600 rounded transition-colors"
                        title="Delete"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Duration: {Math.round(audio.duration)}s | 
                    Volume: {Math.round(audio.volume * 100)}%
                  </div>
                </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) }
    </div>
  )
}

export default AudioProperties;




