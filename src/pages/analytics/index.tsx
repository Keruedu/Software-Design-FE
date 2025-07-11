import React, { useState, useEffect } from 'react';
import { ChartComponent } from '../../components/analytics/ChartComponent';
import { StatsCards } from '../../components/analytics/StatsCards';
import { AnalystService, TopVideo } from '@/services/analyst.service';
import { getFilteredVideoData, convertToChartFormat, VideoStats, VideoPerformanceData } from '../../data/mockVideoStats';
import { 
  FaCalendarAlt, 
  FaChartBar, 
  FaInfoCircle, 
  FaClock, 
  FaChevronDown,
  FaFacebook,
  FaTiktok,
  FaChartLine,
  FaGoogle
} from 'react-icons/fa';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { Header } from '@/components/layout/Header/Header';
import { FiFacebook } from 'react-icons/fi';

const AnalyticsPage: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | 'all'>('7days');
  const [metricType, setMetricType] = useState<'views' | 'likes' | 'comments'>('views');
  const [topCount, setTopCount] = useState<5 | 10 | 15>(10);
  const [platformFilter, setPlatformFilter] = useState<'facebook' | 'google' | 'tiktok'>('facebook');
  const [filteredData, setFilteredData] = useState<TopVideo[]>([]);
  const [backendFormatData, setBackendFormatData] = useState<{
    facebook: VideoPerformanceData[];
    google: VideoPerformanceData[];
    tiktok: VideoPerformanceData[];
  }>({
    facebook: [],
    google: [],
    tiktok: []
  });

  // Cập nhật dữ liệu khi filter thay đổi
  useEffect(() => {
   const fetchData = async () => {
    const { startDate, endDate } = getDateRange(timeFilter);

    try {
      const data = await AnalystService.AnalystStatistic(
        platformFilter, startDate, endDate, getMetricLabel(), topCount
      );
      console.log(data);
      setFilteredData(data);
    } catch (error) {
      console.error(error);
    }
  };
  fetchData();
  }, [timeFilter, topCount, metricType, platformFilter]);
const getDateBefore = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const getDateRange = (timeFilter: '7days' | '30days' | 'all') => {
  const now = new Date().toISOString();
  let startDate: string;

  switch (timeFilter) {
    case '7days':
      startDate = getDateBefore(7);
      break;
    case '30days':
      startDate = getDateBefore(30);
      break;
    case 'all':
      startDate = new Date("2000-01-01T00:00:00Z").toISOString();
      break;
  }

  return { startDate, endDate: now };
};

const { startDate, endDate } = getDateRange('7days');
console.log(startDate, endDate);

  // Get metric label
  const getMetricLabel = () => {
    switch (metricType) {
      case 'views': return 'view';
      case 'likes': return 'like';
      case 'comments': return 'comment';
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
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Video Performance Analytics
                </h1>
                <p className="text-gray-600 text-lg">
                  Analyze top {topCount} highest performing videos on {platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)}
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                      <FaInfoCircle className="w-4 h-4 mr-2" />
                      Platform
                    </span>
                  </label>
                  <div className="relative">
                    <select 
                      value={platformFilter} 
                      onChange={(e) => setPlatformFilter(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white shadow-sm"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="google">Google</option>
                      <option value="tiktok">TikTok</option>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <span className="flex items-center">
                      <FaInfoCircle className="w-4 h-4 mr-2" />
                      Top Videos Count
                    </span>
                  </label>
                  <div className="relative">
                    <select 
                      value={topCount} 
                      onChange={(e) => setTopCount(Number(e.target.value) as 5 | 10 | 15)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white shadow-sm"
                    >
                      <option value={5}>Top 5 videos</option>
                      <option value={10}>Top 10 videos</option>
                      <option value={15}>Top 15 videos</option>
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
                    Showing <strong>{getMetricLabel()}</strong> for <strong>top {topCount} videos</strong> on{' '}
                    <strong>
                      {platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)}
                    </strong>{' '}
                    from{' '}
                    <strong>
                      {timeFilter === '7days' ? 'last 7 days' : 
                      timeFilter === '30days' ? 'last 30 days' : 'all time'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

           

            {/* Thống kê tổng quan */}
            {/* <StatsCards data={filteredData} metricType={metricType} /> */}

            {/* Charts */}
            <div className="space-y-8">
              {/* Bar Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)} Performance Chart
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Top {topCount} videos ranked by {getMetricLabel()} on {platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {platformFilter === 'facebook' && <FaFacebook className="w-4 h-4" />}
                    {platformFilter === 'google' && <FaGoogle className="w-4 h-4" />}
                    {platformFilter === 'tiktok' && <FaTiktok className="w-4 h-4" />}
                    <span>{platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)}</span>
                  </div>
                </div>
                <ChartComponent 
                  data={filteredData}
                  metricType={metricType}
                  chartType="bar"
                  title={`Top ${topCount} videos by ${getMetricLabel()} on ${platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)}`}
                />
              </div>

              {/* Line Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)} Trends Chart
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Track {getMetricLabel()} trends for top videos on {platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <FaChartLine className="w-4 h-4" />
                    <span>Trend Analysis</span>
                  </div>
                </div>
                <ChartComponent 
                  data={filteredData}
                  metricType={metricType}
                  chartType="line"
                  title={`${getMetricLabel().charAt(0).toUpperCase() + getMetricLabel().slice(1)} trends on ${platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)}`}
                />
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
