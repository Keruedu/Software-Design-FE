import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FiDownload, FiEdit, FiShare2, FiTrash2 } from 'react-icons/fi';
import ReactPlayer from 'react-player';
import { Layout } from '../../../components/layout/Layout';
import { Button } from '../../../components/common/Button/Button';
import { VideoService } from '../../../services/video.service';
import { Video, VideoWithDetails } from '../../../mockdata/videos';
import { Modal } from '../../../components/common/Modal/Modal';

const VideoDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;  const [video, setVideo] = useState<VideoWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const fetchedVideo = await VideoService.getVideoById(id as string);
        setVideo(fetchedVideo);
        setError('');
      } catch (err) {
        setError('Failed to load video details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  const handleEdit = () => {
    router.push(`/create/edit?videoId=${id}`);
  };
  const handleDelete = async () => {
    try {
      await VideoService.deleteVideo(id as string);
      setShowDeleteModal(false);
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to delete video:', err);
      setError('Failed to delete video');
    }
  };

  const handleDownload = () => {
    // In a real app, this would trigger an actual download
    alert('Downloading video...');
  };

  const handleShare = () => {
    // In a real app, this would open a share dialog
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/video/${id}`);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !video) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500 mb-4">{error || 'Video not found'}</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
          <p className="text-gray-600 mb-4">Created on {new Date(video.createdAt).toLocaleDateString()}</p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {video.tags.map((tag, index) => (
              <span 
                key={index} 
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg overflow-hidden mb-8">
          <div className="aspect-w-16 aspect-h-9 w-full">
            <ReactPlayer
              url={video.url}
              width="100%"
              height="100%"
              controls
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Video Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1">{video.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Duration</h3>
              <p className="mt-1">{video.duration} seconds</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Voice</h3>
              <p className="mt-1">{video.voiceName || 'Default'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Background</h3>
              <p className="mt-1">{video.backgroundName || 'Default'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleEdit} icon={<FiEdit />}>
            Edit Video
          </Button>
          <Button onClick={handleDownload} variant="outline" icon={<FiDownload />}>
            Download
          </Button>
          <Button onClick={handleShare} variant="outline" icon={<FiShare2 />}>
            Share
          </Button>
          <Button 
            onClick={() => setShowDeleteModal(true)} 
            variant="danger" 
            icon={<FiTrash2 />}
          >
            Delete
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Video"
      >
        <div className="p-6">
          <p className="mb-6">Are you sure you want to delete &quot;{video.title}&quot;? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default VideoDetailPage;
