import { Script } from '../mockdata/scripts';
import { delay, mockApiCall, mockScripts } from '../mockdata';

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Service for script generation and management
 */
export const ScriptService = {
  /**
   * Generate a new script based on topic/keywords using real AI API
   */
  generateScript: async (topic: string, keywords: string[] = []): Promise<Script> => {
    try {
      // Create the prompt for AI generation
      const prompt = `Create a video script about: ${topic}. Keywords: ${keywords.join(', ')}`;
      
      // Call the backend API
      const formData = new FormData();
      formData.append('model', 'deepseek'); // Using DeepSeek model
      formData.append('prompt', prompt);
      
      const response = await fetch(`${API_BASE_URL}/media/generate-text`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      const aiResult = data.text;
      
      // Create script object from AI response
      const newScript: Script = {
        id: `script_${Date.now()}`,
        topic,
        title: aiResult.title || `Video about ${topic}`,
        content: aiResult.script || 'Generated script content...',
        duration: Math.ceil(aiResult.script?.split(' ').length * 0.5) || 60, // Estimate duration
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return newScript;
      
    } catch (error) {
      console.error('Error generating script with AI:', error);
      
      // Fallback to mock data if API fails
      const baseMock = mockScripts[0];
      const fallbackScript: Script = {
        ...baseMock,
        id: `script_${Date.now()}`,
        topic,
        title: `How to Get Started with ${topic} in 2025`,
        content: baseMock.content.replace(/sustainable fashion/gi, topic),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return fallbackScript;
    }
  },

  /**
   * Update an existing script
   */
  updateScript: async (id: string, updates: Partial<Script>): Promise<Script> => {
    const script = mockScripts.find(s => s.id === id);
    
    if (!script) {
      throw new Error(`Script not found with id: ${id}`);
    }
    
    const updatedScript = {
      ...script,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return mockApiCall(updatedScript);
  },

  /**
   * Get script by ID
   */
  getScriptById: async (id: string): Promise<Script | null> => {
    const script = mockScripts.find(s => s.id === id);
    return mockApiCall(script || null);
  },

  /**
   * Get all scripts
   */
  getAllScripts: async (): Promise<Script[]> => {
    return mockApiCall(mockScripts);
  }
};
