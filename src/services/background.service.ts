import { Background } from '../mockdata/backgrounds';
import { mockApiCall, mockBackgrounds } from '../mockdata';

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Cache to prevent duplicate requests
const requestCache = new Map();
const REQUEST_CACHE_DURATION = 10000; // 10 seconds for background requests

export interface BackgroundGenerationParams {
  prompt: string;
  style?: string;
  resolution?: string;
}

export interface BackgroundGenerationResult {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  resolution: string;
}

/**
 * Service for background management and generation
 */
export const BackgroundService = {
  /**
   * Get all available backgrounds from backend API
   */
  getAllBackgrounds: async (): Promise<Background[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/backgrounds/`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert backend format to frontend format
      return data.backgrounds.map((bg: any) => ({
        id: bg.id,
        title: bg.title,
        category: bg.category,
        imageUrl: bg.image_url,
        tags: bg.tags || [],
        premium: bg.premium || false
      }));
      
    } catch (error) {
      console.error('Error fetching backgrounds from API:', error);
      
      // Fallback to mock data if API fails
      return mockApiCall(mockBackgrounds);
    }
  },

  /**
   * Get background by ID from backend API
   */
  getBackgroundById: async (id: string): Promise<Background | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/backgrounds/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const bg = await response.json();
      
      // Convert backend format to frontend format
      return {
        id: bg.id,
        title: bg.title,
        category: bg.category,
        imageUrl: bg.image_url,
        tags: bg.tags || [],
        premium: bg.premium || false
      };
      
    } catch (error) {
      console.error('Error fetching background by ID from API:', error);
      
      // Fallback to mock data
      const background = mockBackgrounds.find(b => b.id === id);
      return mockApiCall(background || null);
    }
  },

  /**
   * Get backgrounds by category from backend API
   */
  getBackgroundsByCategory: async (category: string): Promise<Background[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/backgrounds/?category=${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.backgrounds.map((bg: any) => ({
        id: bg.id,
        title: bg.title,
        category: bg.category,
        imageUrl: bg.image_url,
        tags: bg.tags || [],
        premium: bg.premium || false
      }));
      
    } catch (error) {
      console.error('Error fetching backgrounds by category from API:', error);
      
      // Fallback to mock filtering
      const filteredBackgrounds = mockBackgrounds.filter(bg => 
        bg.category.toLowerCase() === category.toLowerCase()
      );
      
      return mockApiCall(filteredBackgrounds);
    }
  },

  /**
   * Search backgrounds from backend API
   */
  searchBackgrounds: async (query: string): Promise<Background[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/backgrounds/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.backgrounds.map((bg: any) => ({
        id: bg.id,
        title: bg.title,
        category: bg.category,
        imageUrl: bg.image_url,
        tags: bg.tags || [],
        premium: bg.premium || false
      }));
      
    } catch (error) {
      console.error('Error searching backgrounds from API:', error);
      
      // Fallback to mock search
      const query_lower = query.toLowerCase();
      const filteredBackgrounds = mockBackgrounds.filter(bg => {
        if (bg.title.toLowerCase().includes(query_lower)) return true;
        if (bg.category.toLowerCase().includes(query_lower)) return true;
        if (bg.tags.some(tag => tag.toLowerCase().includes(query_lower))) return true;
        return false;
      });
      
      return mockApiCall(filteredBackgrounds);
    }
  },  /**
   * Get recommended backgrounds based on script content and image prompts
   */
  getRecommendedBackgrounds: async (scriptContent?: string, voiceId?: string, scriptImages?: string[]): Promise<Background[]> => {
    try {
      // Create cache key to prevent duplicate requests
      const cacheKey = `recommended-${scriptContent || ''}-${voiceId || ''}-${JSON.stringify(scriptImages || [])}`;
      const now = Date.now();
      
      // Check if we have a recent request for the same parameters
      if (requestCache.has(cacheKey)) {
        const cachedRequest = requestCache.get(cacheKey);
        if (now - cachedRequest.timestamp < REQUEST_CACHE_DURATION) {
          console.log('🔄 Returning cached backgrounds for:', cacheKey.substring(0, 50) + '...');
          return cachedRequest.promise;
        }
      }
      
      // Create the request promise
      const requestPromise = (async () => {
        const params = new URLSearchParams();
        if (scriptContent) params.append('script_content', scriptContent);
        if (voiceId) params.append('voice_id', voiceId);
        if (scriptImages && scriptImages.length > 0) {
          params.append('script_images', JSON.stringify(scriptImages));
        }
        params.append('limit', '8');
        
        console.log('🚀 Making API request for recommended backgrounds:', { scriptContent: scriptContent?.substring(0, 50) + '...', voiceId, scriptImages });
        
        const response = await fetch(`${API_BASE_URL}/backgrounds/recommended?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log(`✅ Received ${data.total} recommended backgrounds (${data.generated_from_script ? 'with' : 'without'} script-generated)`);
        
        const backgrounds = data.recommendations.map((bg: any) => ({
          id: bg.id,
          title: bg.title,
          category: bg.category,
          imageUrl: bg.image_url,
          tags: bg.tags || [],
          premium: bg.premium || false
        }));
        
        // Remove from cache after successful completion
        requestCache.delete(cacheKey);
        
        return backgrounds;
      })();
      
      // Cache the request
      requestCache.set(cacheKey, {
        promise: requestPromise,
        timestamp: now
      });
      
      return requestPromise;
      
    } catch (error) {
      console.error('Error fetching recommended backgrounds from API:', error);
      
      // Fallback to mock recommendations
      return mockApiCall(mockBackgrounds.slice(0, 8));
    }
  },

  /**
   * Generate backgrounds specifically from script image prompts
   */
  generateBackgroundsFromScript: async (scriptImages: string[], style: string = "realistic"): Promise<Background[]> => {
    try {
      const params = new URLSearchParams();
      scriptImages.forEach(image => params.append('script_images', image));
      params.append('style', style);
      params.append('limit', '3');
      
      const response = await fetch(`${API_BASE_URL}/backgrounds/generate-from-script?${params.toString()}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log(`🎨 Generated ${data.generated_count}/${data.requested_count} backgrounds from script images`);
      
      return data.backgrounds.map((bg: any) => ({
        id: bg.id,
        title: bg.title,
        category: bg.category,
        imageUrl: bg.image_url,
        tags: bg.tags || [],
        premium: bg.premium || false
      }));
      
    } catch (error) {
      console.error('Error generating backgrounds from script images:', error);
      
      // Fallback to mock backgrounds
      return mockApiCall(mockBackgrounds.slice(0, 3));
    }
  },

  /**
   * Get available categories from backend API
   */
  getAvailableCategories: async (): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/backgrounds/categories`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.categories;
      
    } catch (error) {
      console.error('Error fetching background categories from API:', error);
      
      // Fallback to mock categories
      const categories = [...new Set(mockBackgrounds.map(bg => bg.category))];
      return Promise.resolve(categories);
    }
  },
  /**
   * Generate custom background using AI
   */
  generateCustomBackground: async (params: BackgroundGenerationParams): Promise<BackgroundGenerationResult> => {
    try {
      const requestBody = {
        prompt: params.prompt,
        style: params.style || "realistic",
        resolution: params.resolution || "1080x1920"
      };
      
      const response = await fetch(`${API_BASE_URL}/backgrounds/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Background generation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        id: result.id,
        imageUrl: result.image_url,
        prompt: result.prompt,
        style: result.style,
        resolution: result.resolution
      };
      
    } catch (error) {
      console.error('Error generating custom background from API:', error);
      
      // Fallback to mock generation
      const result: BackgroundGenerationResult = {
        id: `custom_${Date.now()}`,
        imageUrl: '/assets/images/backgrounds/generated-sample.jpg',
        prompt: params.prompt,
        style: params.style || "realistic",
        resolution: params.resolution || "1080x1920"
      };

      return mockApiCall(result, 0.05, 5000);
    }
  },

  /**
   * Generate background automatically based on script content
   */
  generateBackgroundFromScript: async (
    scriptContent: string, 
    style: string = "realistic", 
    resolution: string = "1080x1920"
  ): Promise<BackgroundGenerationResult> => {
    try {
      const params = new URLSearchParams();
      params.append('script_content', scriptContent);
      params.append('style', style);
      params.append('resolution', resolution);
      
      const response = await fetch(`${API_BASE_URL}/backgrounds/generate-from-script?${params.toString()}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Script-based background generation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        id: result.id,
        imageUrl: result.image_url,
        prompt: result.prompt,
        style: result.style,
        resolution: result.resolution
      };
      
    } catch (error) {
      console.error('Error generating background from script content:', error);
      
      // Fallback to mock generation with script-based prompt
      const result: BackgroundGenerationResult = {
        id: `script_bg_${Date.now()}`,
        imageUrl: '/assets/images/backgrounds/script-generated-sample.jpg',
        prompt: `Generated from script: ${scriptContent.slice(0, 50)}...`,
        style: style,
        resolution: resolution
      };

      return mockApiCall(result, 0.05, 4000);
    }
  },

  /**
   * Get free backgrounds only
   */
  getFreeBackgrounds: async (): Promise<Background[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/backgrounds/?premium=false`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.backgrounds.map((bg: any) => ({
        id: bg.id,
        title: bg.title,
        category: bg.category,
        imageUrl: bg.image_url,
        tags: bg.tags || [],
        premium: bg.premium || false
      }));
      
    } catch (error) {
      console.error('Error fetching free backgrounds from API:', error);
      
      // Fallback to mock free backgrounds
      const freeBackgrounds = mockBackgrounds.filter(bg => !bg.premium);
      return mockApiCall(freeBackgrounds);
    }
  },

  /**
   * Get premium backgrounds only
   */
  getPremiumBackgrounds: async (): Promise<Background[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/backgrounds/?premium=true`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.backgrounds.map((bg: any) => ({
        id: bg.id,
        title: bg.title,
        category: bg.category,
        imageUrl: bg.image_url,
        tags: bg.tags || [],
        premium: bg.premium || false
      }));
      
    } catch (error) {
      console.error('Error fetching premium backgrounds from API:', error);
      
      // Fallback to mock premium backgrounds
      const premiumBackgrounds = mockBackgrounds.filter(bg => bg.premium);
      return mockApiCall(premiumBackgrounds);
    }
  }
};
