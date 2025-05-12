import { useState, useEffect } from 'react';
import { TrendingTopic } from '../mockdata/trendingTopics';
import { TrendsService } from '../services/trends.service';

interface UseTrendingTopicsResult {
  topics: TrendingTopic[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTrendingTopics(): UseTrendingTopicsResult {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchTopics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await TrendsService.getTrendingTopics();
      setTopics(data);
    } catch (err) {
      setError('Failed to fetch trending topics. Please try again.');
      console.error('Error fetching trending topics:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTopics();
  }, []);
  
  return {
    topics,
    loading,
    error,
    refetch: fetchTopics,
  };
}
