import { trendingTopics } from './trendingTopics';
import { mockScripts } from './scripts';
import { mockVoices } from './voices';
import { mockBackgrounds } from './backgrounds';
import { mockVideos } from './videos';

/**
 * Index file that exports all mock data
 */
export {
  trendingTopics,
  mockScripts,
  mockVoices,
  mockBackgrounds,
  mockVideos
};

/**
 * Helper function to get a random item from an array
 */
export const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Helper function to simulate API delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Helper function to simulate API request
 */
export const mockApiCall = async <T>(data: T, errorRate = 0.1, delayMs = 800): Promise<T> => {
  await delay(delayMs);
  
  // Randomly throw an error based on errorRate
  if (Math.random() < errorRate) {
    throw new Error('API request failed');
  }
  
  return data;
};
