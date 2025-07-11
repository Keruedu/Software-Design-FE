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
import { TopVideo } from '@/services/analyst.service';
interface ChartComponentProps {
  data: TopVideo[];
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

  const labels = Array.isArray(data) ? data.map(video => video.title.length > 15 ? video.title.slice(0, 15) + '...' : video.title) : [];
  const platformColors: Record<string, { background: string; border: string }> = {
  facebook: {
    background: 'rgba(24, 119, 242, 0.8)',
    border: 'rgba(24, 119, 242, 1)',
  },
  google: {
    background: 'rgba(255, 0, 0, 0.8)',
    border: 'rgba(255, 0, 0, 1)',
  },
  tiktok: {
    background: 'rgba(0, 0, 0, 0.8)',
    border: 'rgba(0, 0, 0, 1)',
  },
};

  const platform = data[0]?.platform || 'facebook'; // fallback nếu data rỗng

const colors = platformColors[platform] || {
  background: 'rgba(0, 0, 0, 0.8)',
  border: 'rgba(0, 0, 0, 1)',
};

const datasets = [
  {
    label: platform,
    data: Array.isArray(data) ? data.map(video => video.count || 0) : [],
    backgroundColor: chartType === 'bar'
      ? colors.background
      : colors.background.replace('0.8', '0.2'),
    borderColor: colors.border,
    borderWidth: 1,
    ...(chartType === 'line' && { tension: 0.4 }),
  }
];


  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        // position: 'top' as const,
        display: false
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
