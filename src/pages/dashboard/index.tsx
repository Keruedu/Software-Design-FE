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
import { formatNumber } from '../../utils/format';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const { auth } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalDuration: 0,
    videosThisMonth: 0
  });
  
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        // const data = await VideoService.getAllVideos();
        // setVideos(data);
        
        const data = await VideoService.getUserVideos();
        setVideos(data);
        
        // Calculate stats
        setStats({
          totalVideos: data.length,
          totalViews: data.reduce((sum, video) => sum + video.views, 0),
          totalDuration: data.reduce((sum, video) => sum + video.duration, 0),
          videosThisMonth: data.filter(video => {
            const createdAt = new Date(video.createdAt);
            const now = new Date();
            return (
              createdAt.getMonth() === now.getMonth() && 
              createdAt.getFullYear() === now.getFullYear()
            );
          }).length
        });
        
        setError(null);
      } catch (err) {
        setError('Failed to load your videos. Please try again later.');
        console.error('Error fetching videos:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, []);
  
  const handleDeleteVideo = async (id: string) => {
    try {
      await VideoService.deleteVideo(id);
      setVideos(videos.filter(video => video.id !== id));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalVideos: prev.totalVideos - 1
      }));
      toast.success('Video deleted successfully');
    } catch (err) {
      toast.error('Failed to delete video');
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
                  <FiTrendingUp className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Views</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalViews)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <FiClock className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Duration</p>
                  <p className="text-2xl font-semibold text-gray-900">{Math.round(stats.totalDuration / 60)} min</p>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Videos</h2>
              <div className="flex items-center">
                <span className="text-gray-500 text-sm mr-4">{videos.length} videos</span>
                <select 
                  className="border border-gray-300 rounded-md text-sm py-1.5 px-3 text-gray-800"
                  defaultValue="recent"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
            
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
          </div>
          
          {/* Usage Limits Section */}
          <div className="bg-white rounded-lg shadow p-6">
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
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
