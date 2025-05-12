import { TrendingTopic } from '../mockdata/trendingTopics';
import { delay, mockApiCall, trendingTopics } from '../mockdata';

/**
 * Service for fetching trending topics
 */
export const TrendsService = {
  /**
   * Get all trending topics
   */
  getTrends: async (): Promise<TrendingTopic[]> => {
    return mockApiCall(trendingTopics);
  },

  /**
   * Search trending topics by keyword
   */
  searchTrends: async (keyword: string): Promise<TrendingTopic[]> => {
    const normalizedKeyword = keyword.toLowerCase();
    
    const filteredTopics = trendingTopics.filter(topic => {
      // Search in title
      if (topic.title.toLowerCase().includes(normalizedKeyword)) {
        return true;
      }
      
      // Search in category
      if (topic.category.toLowerCase().includes(normalizedKeyword)) {
        return true;
      }
      
      // Search in keywords
      if (topic.keywords.some(kw => kw.toLowerCase().includes(normalizedKeyword))) {
        return true;
      }
      
      return false;
    });
    
    return mockApiCall(filteredTopics);
  },

  /**
   * Get trending topic by ID
   */
  getTrendById: async (id: string): Promise<TrendingTopic | null> => {
    const topic = trendingTopics.find(t => t.id === id);
    return mockApiCall(topic || null);
  }
};
