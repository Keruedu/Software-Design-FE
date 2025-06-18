import React, { useState, useEffect } from 'react';
import { TrendingTopic } from '../../../mockdata/trendingTopics';
import { TrendsService } from '../../../services/trends.service';
import { Button } from '../../common/Button/Button';

interface HotTrendsProps {
  onSelectTrend?: (trend: TrendingTopic) => void;
  limit?: number;
}

export const HotTrends: React.FC<HotTrendsProps> = ({ 
  onSelectTrend, 
  limit = 10 
}) => {
  const [hotTrends, setHotTrends] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotTrends = async () => {
      try {
        setLoading(true);
        const trends = await TrendsService.getHotKeywords(limit);
        setHotTrends(trends);
        setError(null);
      } catch (err) {
        setError('Failed to load hot trends');
        console.error('Error fetching hot trends:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotTrends();
  }, [limit]);

  const handleSelectTrend = (trend: TrendingTopic) => {
    if (onSelectTrend) {
      onSelectTrend(trend);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🔥 Hot Trends</h3>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🔥 Hot Trends</h3>
        <div className="text-center text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">🔥 Hot Trends</h3>
        <span className="text-xs text-gray-500">Based on recent searches</span>
      </div>
      
      {hotTrends.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p className="text-sm">No hot trends available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {hotTrends.map((trend, index) => (
            <div
              key={trend.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-red-600">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {trend.title}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {trend.category}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${trend.popularity}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {trend.popularity}%
                  </span>
                </div>
              </div>
              
              {onSelectTrend && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelectTrend(trend)}
                  className="ml-3 text-xs"
                >
                  Use
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-400">
          Updates based on user search patterns
        </p>
      </div>
    </div>
  );
};
