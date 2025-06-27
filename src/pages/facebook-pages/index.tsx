import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FacebookPageSelector } from '../../components/FacebookPageSelector';

interface FacebookPage {
  page_id: string;
  page_name: string;
  page_access_token: string;
  category?: string;
  about?: string;
  picture_url?: string;
  is_published: boolean;
}

const FacebookPagesPage: NextPage = () => {
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const handlePageSelect = (page: FacebookPage | null) => {
    setSelectedPage(page);
    if (page) {
      // TODO: Load videos from this page
      // loadPageVideos(page.page_id);
    } else {
      setVideos([]);
    }
  };

  const loadPageVideos = async (pageId: string) => {
    // TODO: Implement loading videos from Facebook page
    setLoadingVideos(true);
    try {
      // API call to get videos from page
      setLoadingVideos(false);
    } catch (error) {
      setLoadingVideos(false);
      toast.error('Không thể tải danh sách video từ Facebook Page');
    }
  };

  return (
    <>
      <Head>
        <title>Facebook Pages - VideoAI</title>
        <meta name="description" content="Quản lý Facebook Pages và đăng video" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                    <span className="ml-4 text-sm font-medium text-gray-500">Facebook Pages</span>
                  </div>
                </li>
              </ol>
            </nav>
            
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-gray-900">Facebook Pages</h1>
              <p className="mt-2 text-gray-600">
                Manage and upload videos to your Facebook Pages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Page Selector */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Choose Facebook Page
                </h2>
                <FacebookPageSelector
                  onPageSelect={handlePageSelect}
                  selectedPageId={selectedPage?.page_id}
                />
                
                {!selectedPage && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No Page selected.</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Select a Facebook Page to view details and manage videos.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Page Details & Videos */}
            <div className="lg:col-span-2">
              {selectedPage ? (
                <div className="space-y-6">
                  {/* Page Info Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start space-x-4">
                      {selectedPage.picture_url && (
                        <img
                          src={selectedPage.picture_url}
                          alt={selectedPage.page_name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h2 className="text-xl font-bold text-gray-900">
                            {selectedPage.page_name}
                          </h2>
                          {!selectedPage.is_published && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Private
                            </span>
                          )}
                        </div>
                        {selectedPage.category && (
                          <p className="text-sm text-gray-600 mt-1">{selectedPage.category}</p>
                        )}
                        {selectedPage.about && (
                          <p className="text-sm text-gray-700 mt-2">{selectedPage.about}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex space-x-3">
                      <Link
                        href={`/upload?platform=facebook&page_id=${selectedPage.page_id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Upload New Video
                      </Link>
                      <button
                        onClick={() => loadPageVideos(selectedPage.page_id)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Retry
                      </button>
                    </div>
                  </div>

                  {/* Videos List */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Posted Videos
                    </h3>
                    
                    {loadingVideos ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading video list...</span>
                      </div>
                    ) : videos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videos.map((video, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900">{video.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                              <span>{video.created_time}</span>
                              <span>{video.view_count || 0} view</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No videos yet.</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Get started by uploading your first video to this Facebook Page.
                        </p>
                        <div className="mt-6">
                          <Link
                            href={`/upload?platform=facebook&page_id=${selectedPage.page_id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Upload First Video
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Choose Facebook Page</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Select a Facebook Page from the list on the left to view details and manage videos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FacebookPagesPage;
