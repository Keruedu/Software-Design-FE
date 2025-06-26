import { useState } from 'react';
import { toast } from 'react-toastify';
import { FacebookPageSelector } from './FacebookPageSelector';

interface FacebookPage {
  page_id: string;
  page_name: string;
  page_access_token: string;
  category?: string;
  about?: string;
  picture_url?: string;
  is_published: boolean;
}

interface FacebookVideoUploadProps {
  mediaId: string;
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: string) => void;
}

export const FacebookVideoUpload: React.FC<FacebookVideoUploadProps> = ({
  mediaId,
  onUploadSuccess,
  onUploadError
}) => {
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedPage) {
      toast.error('Please select a Facebook Page',
        {
            position: 'bottom-right',
            autoClose: 3000
        }
      );
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter video title',
        {
            position: 'bottom-right',
            autoClose: 3000
        }
      );
      return;
    }

    try {
      setUploading(true);
      
      // Prepare data
      const uploadData = {
        media_id: mediaId,
        platform: 'facebook',
        page_id: selectedPage.page_id,
        title: title.trim(),
        description: description.trim()
      };

      const token = localStorage.getItem('access_token');
      
      const response = await fetch('/api/facebook-pages/upload-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Unable to upload video');
      }

      const result = await response.json();
      
      toast.success('Video has been successfully uploaded to Facebook Page!',
        {
            position: 'bottom-right',
            autoClose: 3000
        }
      );
      
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      // Reset form
      setTitle('');
      setDescription('');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while uploading video';
      toast.error(errorMessage,
        {
            position: 'bottom-right',
            autoClose: 3000
        }
      );
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Selector */}
      <FacebookPageSelector
        onPageSelect={setSelectedPage}
        selectedPageId={selectedPage?.page_id}
      />

      {selectedPage && (
        <div className="space-y-4">
          {/* Selected Page Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              {selectedPage.picture_url && (
                <img
                  src={selectedPage.picture_url}
                  alt={selectedPage.page_name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Will post to: {selectedPage.page_name}
                </p>
                {selectedPage.category && (
                  <p className="text-xs text-blue-700">{selectedPage.category}</p>
                )}
              </div>
            </div>
          </div>

          {/* Video Info Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="video-title" className="block text-sm font-medium text-gray-700">
                Video Title *
              </label>
              <input
                type="text"
                id="video-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter video title..."
                maxLength={255}
              />
              <p className="mt-1 text-xs text-gray-500">
                {title.length}/255 characters
              </p>
            </div>

            <div>
              <label htmlFor="video-description" className="block text-sm font-medium text-gray-700">
                Video Description
              </label>
              <textarea
                id="video-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter video description... (optional)"
                maxLength={2000}
              />
              <p className="mt-1 text-xs text-gray-500">
                {description.length}/2000 characters
              </p>
            </div>

            {/* Upload Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedPage || !title.trim()}
                className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  uploading || !selectedPage || !title.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Upload Video
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
