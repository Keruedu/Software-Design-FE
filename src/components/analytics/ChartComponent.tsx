import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Đăng ký các thành phần Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export type { VideoPerformanceData, VideoStats } from '../../data/mockVideoStats';
import type { VideoStats } from '../../data/mockVideoStats';

interface ChartComponentProps {
  data: VideoStats[];
  metricType: 'views' | 'likes' | 'comments';
  chartType: 'bar' | 'line';
  title: string;
}

export const ChartComponent: React.FC<ChartComponentProps> = ({ 
  data, 
  metricType, 
  chartType, 
  title 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-gray-500">No data available to display</p>
      </div>
    );
  }

  const labels = data.map(video => video.title.length > 15 ? video.title.slice(0, 15) + '...' : video.title);
  
  const datasets = [
    {
      label: 'Facebook',
      data: data.map(video => video.facebook[metricType] || 0),
      backgroundColor: chartType === 'bar' ? 'rgba(24, 119, 242, 0.8)' : 'rgba(24, 119, 242, 0.2)',
      borderColor: 'rgba(24, 119, 242, 1)',
      borderWidth: 1,
      ...(chartType === 'line' && { tension: 0.4 }),
    },
    {
      label: 'YouTube',
      data: data.map(video => video.youtube[metricType] || 0),
      backgroundColor: chartType === 'bar' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 0, 0, 0.2)',
      borderColor: 'rgba(255, 0, 0, 1)',
      borderWidth: 1,
      ...(chartType === 'line' && { tension: 0.4 }),
    },
    {
      label: 'TikTok',
      data: data.map(video => video.tiktok[metricType] || 0),
      backgroundColor: chartType === 'bar' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.2)',
      borderColor: 'rgba(0, 0, 0, 1)',
      borderWidth: 1,
      ...(chartType === 'line' && { tension: 0.4 }),
    },
  ];

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (typeof value === 'number') {
              return value.toLocaleString();
            }
            return value;
          }
        }
      },
    },
  };

  return (
    <div className="h-96">
      {chartType === 'bar' ? (
        <Bar data={{ labels, datasets }} options={commonOptions} />
      ) : (
        <Line data={{ labels, datasets }} options={commonOptions} />
      )}
    </div>
  );
};
