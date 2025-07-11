import React from 'react';
import { VideoStats } from './ChartComponent';

interface StatsCardsProps {
  data: VideoStats[];
  metricType: 'views' | 'likes' | 'comments';
}

export const StatsCards: React.FC<StatsCardsProps> = ({ data, metricType }) => {
  const getMetricLabel = () => {
    switch (metricType) {
      case 'views': return 'views';
      case 'likes': return 'likes';
      case 'comments': return 'comments';
      default: return '';
    }
  };

  const facebookTotal = data.reduce((sum, video) => sum + video.facebook[metricType], 0);
  const youtubeTotal = data.reduce((sum, video) => sum + video.youtube[metricType], 0);
  const tiktokTotal = data.reduce((sum, video) => sum + video.tiktok[metricType], 0);

  const cards = [
    {
      platform: 'Facebook',
      total: facebookTotal,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-100',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      platform: 'YouTube',
      total: youtubeTotal,
      bgColor: 'bg-red-500',
      textColor: 'text-red-100',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      platform: 'TikTok',
      total: tiktokTotal,
      bgColor: 'bg-gray-800',
      textColor: 'text-gray-300',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={card.platform} className={`${card.bgColor} text-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300 border border-opacity-20 border-white`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{card.platform}</h3>
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              {card.icon}
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 animate-pulse">
            {card.total.toLocaleString()}
          </p>
          <p className={`${card.textColor} text-sm mb-3`}>
            Total {getMetricLabel()}
          </p>
          <div className="mt-3 flex items-center">
            <div className="flex-1 bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-1000 ease-out" 
                style={{
                  width: `${Math.min((card.total / Math.max(facebookTotal, youtubeTotal, tiktokTotal)) * 100, 100)}%`,
                  animationDelay: `${index * 200}ms`
                }}
              ></div>
            </div>
            <span className="ml-3 text-sm font-medium bg-white bg-opacity-20 px-2 py-1 rounded-full">
              {((card.total / (facebookTotal + youtubeTotal + tiktokTotal)) * 100).toFixed(1)}%
            </span>
          </div>
          
          {/* Trend indicator */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className={card.textColor}>vs last month</span>
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">+{(5 + index * 2).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
