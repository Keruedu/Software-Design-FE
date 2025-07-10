import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiPlus, FiVideo, FiClock, FiTrendingUp } from 'react-icons/fi';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { VideoService } from '../../services/video.service';
import { Video } from '../../mockdata/videos';
import VideoManager from '../../components/features/VideoManager/VideoManager';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const { auth } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [videosPerPage] = useState(12);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  const [stats, setStats] = useState({
    totalVideos: 0,
    videosThisMonth: 0,
    videosToday: 0,
    videosThisWeek: 0
  });
  
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const data = await VideoService.getAllVideoOfUser(currentPage, videosPerPage);
        setVideos(data.videos);
        setTotalVideos(data.total);
        setHasNextPage(data.hasNext);
        
        setError(null);
      } catch (err) {
        setError('Failed to load your videos. Please try again later.');
        console.error('Error fetching videos:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, [currentPage, videosPerPage]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await VideoService.getEnhancedVideoStats();
        
        setStats({
          totalVideos: statsData.total_videos,
          videosThisMonth: statsData.videos_this_month,
          videosToday: statsData.videos_today,
          videosThisWeek: statsData.videos_this_week
        });
      } catch (err) {
        console.error('Error fetching video stats:', err);
      }
    };
    
    fetchStats();
  }, []);
  
  const handleDeleteVideo = async (id: string) => {
    try {
      const videoToDelete = videos.find(video => video.id === id);
      
      await VideoService.deleteVideo(id);
      setVideos(videos.filter(video => video.id !== id));
      
      try {
        const statsData = await VideoService.getEnhancedVideoStats();
        setStats({
          totalVideos: statsData.total_videos,
          videosThisMonth: statsData.videos_this_month,
          videosToday: statsData.videos_today,
          videosThisWeek: statsData.videos_this_week
        });
      } catch (statsErr) {
        if (videoToDelete) {
          const isVideoFromThisMonth = (() => {
            const createdAt = new Date(videoToDelete.createdAt);
            const now = new Date();
            return (
              createdAt.getMonth() === now.getMonth() && 
              createdAt.getFullYear() === now.getFullYear()
            );
          })();

          const isVideoFromToday = (() => {
            const createdAt = new Date(videoToDelete.createdAt);
            const now = new Date();
            return (
              createdAt.getDate() === now.getDate() &&
              createdAt.getMonth() === now.getMonth() && 
              createdAt.getFullYear() === now.getFullYear()
            );
          })();

          const isVideoFromThisWeek = (() => {
            const createdAt = new Date(videoToDelete.createdAt);
            const now = new Date();
            const daysSinceMonday = now.getDay() === 0 ? 6 : now.getDay() - 1; // Convert Sunday (0) to 6
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - daysSinceMonday);
            startOfWeek.setHours(0, 0, 0, 0);
            
            return createdAt >= startOfWeek;
          })();

          setStats(prev => ({
            ...prev,
            totalVideos: prev.totalVideos - 1,
            videosThisMonth: isVideoFromThisMonth ? prev.videosThisMonth - 1 : prev.videosThisMonth,
            videosToday: isVideoFromToday ? prev.videosToday - 1 : prev.videosToday,
            videosThisWeek: isVideoFromThisWeek ? prev.videosThisWeek - 1 : prev.videosThisWeek
          }));
        }
      }
      
      if (videos.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      toast.success('Video deleted successfully',
        { 
          position: 'bottom-right', 
          autoClose: 3000 
        }
      );
    } catch (err) {
      toast.error('Failed to delete video',
        { 
          position: 'bottom-right', 
          autoClose: 3000 
        }
      );
      console.error('Error deleting video:', err);
    }
  };
  
  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>Dashboard - VideoAI</title>
          <meta name="description" content="Manage your VideoAI videos" />
        </Head>
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {auth.user?.username || 'User'}
              </p>
            </div>
            
            <Link href="/create">
              <Button icon={<FiPlus />}>Create New Video</Button>
            </Link>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FiVideo className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Videos</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalVideos}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Videos Today</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.videosToday}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Videos This Week</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.videosThisWeek}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Videos This Month</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.videosThisMonth}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Videos Section */}
          <div className="mb-8">              
            {/* <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Your Videos</h2>
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm mr-4">
                    {loading ? 'Loading...' : `${totalVideos} videos total`}
                  </span>
                  <select 
                    className="border border-gray-300 rounded-md text-sm py-1.5 px-3 text-gray-800"
                    defaultValue="recent"
                    disabled={loading}
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div> */}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <VideoManager 
              videos={videos}
              onDelete={handleDeleteVideo}
              isLoading={loading}
            />
            
            {/* Pagination */}
            {totalVideos > videosPerPage && (
              <div className="mt-6 flex justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || loading}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, Math.ceil(totalVideos / videosPerPage)) }, (_, i) => {
                        const totalPages = Math.ceil(totalVideos / videosPerPage);
                        const pageNum =
                          currentPage <= 3
                            ? i + 1
                            : currentPage >= totalPages - 2
                            ? totalPages - 4 + i
                            : currentPage - 2 + i;

                        if (pageNum < 1 || pageNum > totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={loading}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!hasNextPage || loading}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>

                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {Math.ceil(totalVideos / videosPerPage)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Usage Limits Section */}
          {/* <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Plan Usage</h2>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Videos Created (5/10)</span>
                <span className="text-sm font-medium text-gray-700">50%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Storage (25MB/100MB)</span>
                <span className="text-sm font-medium text-gray-700">25%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-gray-500 text-sm">
                Free plan
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Basic
                </span>
              </div>
              <Button variant="outline" size="sm">Upgrade Plan</Button>
            </div>
          </div> */}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
