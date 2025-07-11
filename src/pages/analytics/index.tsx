import React, { useState, useEffect } from 'react';
import { ChartComponent, VideoStats } from '../../components/analytics/ChartComponent';
import { StatsCards } from '../../components/analytics/StatsCards';
import { mockVideoStats } from '../../data/mockVideoStats';
import { Layout } from '../../components/layout/Layout';
import { 
  FaCalendarAlt, 
  FaChartBar, 
  FaInfoCircle, 
  FaClock, 
  FaChevronDown,
  FaFacebook,
  FaYoutube,
  FaTiktok,
  FaChartLine
} from 'react-icons/fa';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { Header } from '@/components/layout/Header/Header';

const AnalyticsPage: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | 'all'>('7days');
  const [metricType, setMetricType] = useState<'views' | 'likes' | 'comments'>('views');
  const [filteredData, setFilteredData] = useState<VideoStats[]>([]);

  // Lọc dữ liệu theo thời gian
  useEffect(() => {
    const now = new Date();
    let filtered = mockVideoStats;

    if (timeFilter === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = mockVideoStats.filter(video => new Date(video.createdAt) >= sevenDaysAgo);
    } else if (timeFilter === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = mockVideoStats.filter(video => new Date(video.createdAt) >= thirtyDaysAgo);
    }

    setFilteredData(filtered);
  }, [timeFilter]);

  // Get metric label
  const getMetricLabel = () => {
    switch (metricType) {
      case 'views': return 'views';
      case 'likes': return 'likes';
      case 'comments': return 'comments';
      default: return '';
    }
  };

  return (
    <ProtectedRoute>
      <Header/>
        <div className='flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'>
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Video Performance Analytics
                </h1>
                <p className="text-gray-600 text-lg">
                  Analyze top 10 highest performing videos across social media platforms
                </p>
                <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Real-time data updates</span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="w-4 h-4 mr-1" />
                    <span>Last updated: {new Date().toLocaleString('en-US')}</span>
                  </div>
                </div>
              </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Data Filters</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <span className="flex items-center">
                      <FaCalendarAlt className="w-4 h-4 mr-2" />
                      Time Period
                    </span>
                  </label>
                  <div className="relative">
                    <select 
                      value={timeFilter} 
                      onChange={(e) => setTimeFilter(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white shadow-sm"
                    >
                      <option value="7days">Last 7 days</option>
                      <option value="30days">Last 30 days</option>
                      <option value="all">All time</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <span className="flex items-center">
                      <FaChartBar className="w-4 h-4 mr-2" />
                      Statistics Type
                    </span>
                  </label>
                  <div className="relative">
                    <select 
                      value={metricType} 
                      onChange={(e) => setMetricType(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white shadow-sm"
                    >
                      <option value="views">Views</option>
                      <option value="likes">Likes</option>
                      <option value="comments">Comments</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current filter information */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-sm text-blue-800">
                  <FaInfoCircle className="w-4 h-4 mr-2" />
                  <span>
                    Showing <strong>{getMetricLabel()}</strong> of <strong>{filteredData.length} videos</strong> from{' '}
                    <strong>
                      {timeFilter === '7days' ? 'last 7 days' : 
                      timeFilter === '30days' ? 'last 30 days' : 'all time'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Thống kê tổng quan */}
            <StatsCards data={filteredData} metricType={metricType} />

            {/* Charts */}
            <div className="space-y-8">
              {/* Bar Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Bar Chart Comparison</h2>
                    <p className="text-sm text-gray-600 mt-1">Compare performance across platforms</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <FaChartBar className="w-4 h-4" />
                    <span>Bar Chart</span>
                  </div>
                </div>
                <ChartComponent 
                  data={filteredData}
                  metricType={metricType}
                  chartType="bar"
                  title={`Compare ${getMetricLabel()} by platform`}
                />
              </div>

              {/* Line Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Line Chart Trends</h2>
                    <p className="text-sm text-gray-600 mt-1">Track development trends over time</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <FaChartLine className="w-4 h-4" />
                    <span>Line Chart</span>
                  </div>
                </div>
                <ChartComponent 
                  data={filteredData}
                  metricType={metricType}
                  chartType="line"
                  title={`${getMetricLabel()} trends across videos`}
                />
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Individual Video Performance Details</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Showing {getMetricLabel()} for top {filteredData.length} videos
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Video
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center justify-center">
                          <FaFacebook className="w-4 h-4 mr-1 text-blue-600" />
                          Facebook
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center justify-center">
                          <FaYoutube className="w-4 h-4 mr-1 text-red-600" />
                          YouTube
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center justify-center">
                          <FaTiktok className="w-4 h-4 mr-1 text-black" />
                          TikTok
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((video, index) => {
                      const total = video.facebook[metricType] + video.youtube[metricType] + video.tiktok[metricType];
                      return (
                        <tr key={video.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                  #{index + 1}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{video.title}</div>
                                <div className="text-sm text-gray-500">{new Date(video.createdAt).toLocaleDateString('en-US')}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-semibold text-blue-600">{video.facebook[metricType].toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-semibold text-red-600">{video.youtube[metricType].toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-semibold text-gray-900">{video.tiktok[metricType].toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-bold text-gray-900">{total.toLocaleString()}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
        </div>
        <footer className="bg-white border-t mt-10">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} VideoAI. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
      </footer>
    </ProtectedRoute>
  );
};

export default AnalyticsPage;
