import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { TrendingTopic } from '../../../mockdata/trendingTopics';
import { TrendsService } from '../../../services/trends.service';
import { Button } from '../../common/Button/Button';

export const TrendingTopics: React.FC = () => {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const data = await TrendsService.getTrends();
        setTopics(data);
        setError(null);
      } catch (err) {
        setError('Failed to load trending topics. Please try again later.');
        console.error('Error fetching trending topics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  const handleSelectTopic = (topic: TrendingTopic) => {
    router.push({
      pathname: '/create',
      query: { topicId: topic.id },
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Trending Topics</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create videos on these popular topics to maximize engagement.
        </p>
      </div>

      <ul className="divide-y divide-gray-200">
        {topics.map((topic) => (
          <li key={topic.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{topic.title}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  {topic.category}
                </span>
                <div className="mt-2 flex flex-wrap gap-1">
                  {topic.keywords.slice(0, 3).map((keyword, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleSelectTopic(topic)}
              >
                Select
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {topics.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          <p>No trending topics available at the moment.</p>
        </div>
      )}
    </div>
  );
};
