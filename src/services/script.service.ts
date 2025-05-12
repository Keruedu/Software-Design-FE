import { Script } from '../mockdata/scripts';
import { delay, mockApiCall, mockScripts } from '../mockdata';

/**
 * Service for script generation and management
 */
export const ScriptService = {
  /**
   * Generate a new script based on topic/keywords
   */
  generateScript: async (topic: string, keywords: string[] = []): Promise<Script> => {
    // Simulate script generation by using a mock script and modifying it slightly
    const baseMock = mockScripts[0];
    
    const newScript: Script = {
      ...baseMock,
      id: `script_${Date.now()}`,
      topic,
      title: `How to Get Started with ${topic} in 2025`,
      content: baseMock.content.replace(/sustainable fashion/gi, topic),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Simulate longer processing time for AI generation
    return mockApiCall(newScript, 0.05, 2500);
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
