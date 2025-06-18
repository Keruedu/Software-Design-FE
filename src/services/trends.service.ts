import { TrendingTopic } from '../mockdata/trendingTopics';
import { delay, mockApiCall, trendingTopics } from '../mockdata';

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Service for fetching trending topics
 */
export const TrendsService = {
  /**
   * Get all trending topics from backend API
   */
  getTrends: async (): Promise<TrendingTopic[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trending/topics?size=20`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert backend format to frontend format
      const convertedTopics: TrendingTopic[] = data.topics.map((topic: any) => ({
        id: topic.id,
        title: topic.title,
        category: topic.category,
        popularity: topic.popularity,
        keywords: topic.keywords || []
      }));
      
      return convertedTopics;
      
    } catch (error) {
      console.error('Error fetching trending topics from API:', error);
      
      // Fallback to mock data if API fails
      return mockApiCall(trendingTopics);
    }
  },
  /**
   * Search trending topics by keyword using backend API with tracking
   */
  searchTrends: async (keyword: string, trackSearch: boolean = true): Promise<TrendingTopic[]> => {
    try {      const trackParam = trackSearch ? '&track=true' : '&track=false';
      const response = await fetch(`${API_BASE_URL}/trending/topics/search?q=${encodeURIComponent(keyword)}&size=20${trackParam}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Log tracking info if available
      if (data.tracking && trackSearch) {
        console.log('Search tracking result:', data.tracking);
        if (data.tracking.action === 'created') {
          console.log(`✨ New trending topic created: "${keyword}"`);
        } else if (data.tracking.action === 'updated') {
          console.log(`📈 Trending score updated for: "${keyword}"`);
        }
      }
      
      // Convert backend format to frontend format
      const convertedTopics: TrendingTopic[] = data.topics.map((topic: any) => ({
        id: topic.id,
        title: topic.title,
        category: topic.category,
        popularity: topic.popularity,
        keywords: topic.keywords || []
      }));
      
      return convertedTopics;
      
    } catch (error) {
      console.error('Error searching trending topics from API:', error);
      
      // Fallback to mock search
      const normalizedKeyword = keyword.toLowerCase();
      const filteredTopics = trendingTopics.filter(topic => {
        if (topic.title.toLowerCase().includes(normalizedKeyword)) return true;
        if (topic.category.toLowerCase().includes(normalizedKeyword)) return true;
        if (topic.keywords.some(kw => kw.toLowerCase().includes(normalizedKeyword))) return true;
        return false;
      });
      
      return mockApiCall(filteredTopics);
    }
  },
  /**
   * Get trending topic by ID using backend API
   */
  getTrendById: async (id: string): Promise<TrendingTopic | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trending/topics/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const topic = await response.json();
      
      // Convert backend format to frontend format
      return {
        id: topic.id,
        title: topic.title,
        category: topic.category,
        popularity: topic.popularity,
        keywords: topic.keywords || []
      };
      
    } catch (error) {
      console.error('Error fetching trending topic by ID from API:', error);
        // Fallback to mock data
      const topic = trendingTopics.find(t => t.id === id);
      return mockApiCall(topic || null);
    }
  },

  /**
   * Get hot trending keywords based on recent activity
   */
  getHotKeywords: async (limit: number = 20): Promise<TrendingTopic[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trending/hot-keywords?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert backend format to frontend format
      return data.keywords.map((topic: any) => ({
        id: topic.id,
        title: topic.title,
        category: topic.category,
        popularity: topic.popularity,
        keywords: topic.keywords || []
      }));
      
    } catch (error) {
      console.error('Error fetching hot keywords from API:', error);
      
      // Fallback to trending topics sorted by popularity
      return mockApiCall(trendingTopics.slice(0, limit));
    }
  },

  /**
   * Manually track a search keyword (for logged-in users)
   */
  trackSearch: async (keyword: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trending/track-search?keyword=${encodeURIComponent(keyword)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if available
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error tracking search:', error);
      return { success: false, message: 'Failed to track search' };
    }
  }
};
