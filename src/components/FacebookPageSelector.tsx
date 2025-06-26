import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface FacebookPage {
  page_id: string;
  page_name: string;
  page_access_token: string;
  category?: string;
  about?: string;
  picture_url?: string;
  is_published: boolean;
}

interface FacebookPagesResponse {
  pages: FacebookPage[];
}

interface FacebookPageSelectorProps {
  onPageSelect: (page: FacebookPage | null) => void;
  selectedPageId?: string;
}

export const FacebookPageSelector: React.FC<FacebookPageSelectorProps> = ({
  onPageSelect,
  selectedPageId
}) => {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFacebookPages();
  }, []);

  const fetchFacebookPages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('/api/facebook-pages/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Cannot fetch Facebook Pages");
      }

      const data: FacebookPagesResponse = await response.json();
      setPages(data.pages);
      
      if (selectedPageId) {
        const selectedPage = data.pages.find(page => page.page_id === selectedPageId);
        if (selectedPage) {
          onPageSelect(selectedPage);
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error occurred while fetching Facebook Pages';
      setError(errorMessage);
      toast.error(errorMessage,
        {
            position: 'bottom-right',
            autoClose: 3000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePageSelect = (page: FacebookPage) => {
    onPageSelect(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading list of Facebook Pages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading Facebook Pages.</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchFacebookPages}
          className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No Facebook Pages available.</h3>
            <p className="text-sm text-yellow-700 mt-1">
              You need to create or have admin access to at least one Facebook Page to use this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900">Choose Facebook Page</h3>
      <div className="grid gap-3">
        {pages.map((page) => (
          <div
            key={page.page_id}
            className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
              selectedPageId === page.page_id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handlePageSelect(page)}
          >
            <div className="flex items-start space-x-3">
              {page.picture_url && (
                <img
                  src={page.picture_url}
                  alt={page.page_name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {page.page_name}
                  </h4>
                  {!page.is_published && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Private
                    </span>
                  )}
                </div>
                {page.category && (
                  <p className="text-xs text-gray-500 mt-1">{page.category}</p>
                )}
                {page.about && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{page.about}</p>
                )}
              </div>
              {selectedPageId === page.page_id && (
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
