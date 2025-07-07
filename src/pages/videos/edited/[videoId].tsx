import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FaPlay, FaDownload, FaEdit, FaClock, FaMusic, FaCut, FaArrowLeft } from 'react-icons/fa';
import { videoExportService } from '@/services/videoExport.service';

interface EditedVideo {
  _id: string;
  title: string;
  url: string;
  created_at: string;
  metadata: {
    original_video_id: string;
    is_edited: boolean;
    processing_steps: any[];
    timeline_data: any;
    edit_timestamp: string;
    video_duration: number;
    audio_tracks_count: number;
    trim_applied: boolean;
  };
}

const EditedVideosPage: React.FC = () => {
  const router = useRouter();
  const { videoId } = router.query;
  
  const [editedVideos, setEditedVideos] = useState<EditedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoId && typeof videoId === 'string') {
      loadEditedVersions(videoId);
    }
  }, [videoId]);

  const loadEditedVersions = async (originalVideoId: string) => {
    try {
      setLoading(true);
      const response = await videoExportService.getEditedVersions(originalVideoId);
      setEditedVideos(response.edited_versions);
      setError(null);
    } catch (err) {
    setError(err instanceof Error ? err.message : 'Unable to load the list of edited videos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = (video: EditedVideo) => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `${video.title}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditAgain = (video: EditedVideo) => {
    router.push({
      pathname: '/create/edit',
      query: {
        videoId: video._id,
        videoUrl: video.url,
        title: video.title
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video list...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">An error occurred</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <FaArrowLeft className="w-5 h-5" />
                <span>Quay lại</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edited Videos</h1>
                <p className="text-gray-600">
                  {editedVideos.length} edited version{editedVideos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {editedVideos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📹</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No edited videos yet
            </h3>
            <p className="text-gray-600">
              You haven't created any edited versions for this video yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {editedVideos.map((video, index) => (
              <motion.div
                key={video._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Video Preview */}
                <div className="aspect-video bg-gray-100 relative">
                  <video
                    src={video.url}
                    className="w-full h-full object-cover"
                    poster=""
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button className="bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 transition-all">
                      <FaPlay className="text-gray-800 ml-1" size={20} />
                    </button>
                  </div>
                  
                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                    {formatDuration(video.metadata.video_duration || 0)}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <FaClock className="w-4 h-4" />
                      <span>Edited: {formatDate(video.metadata.edit_timestamp)}</span>
                    </div>
                    
                    {video.metadata.audio_tracks_count > 0 && (
                      <div className="flex items-center space-x-2 mb-1">
                        <FaMusic className="w-4 h-4" />
                        <span>{video.metadata.audio_tracks_count} audio track(s)</span>
                      </div>
                    )}
                    
                    {video.metadata.trim_applied && (
                      <div className="flex items-center space-x-2 mb-1">
                        <FaCut className="w-4 h-4" />
                        <span>Video trimmed</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      {video.metadata.processing_steps?.length || 0} processing step{(video.metadata.processing_steps?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditAgain(video)}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FaEdit className="w-4 h-4" />
                      <span>Edit Again</span>
                    </button>
                    
                    <button
                      onClick={() => handleDownload(video)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <FaDownload className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EditedVideosPage;
