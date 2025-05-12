import React, { useState, useEffect } from 'react';
import { FiLoader, FiEdit3, FiRefreshCw } from 'react-icons/fi';
import { Button } from '../../common/Button/Button';
import { ScriptService } from '../../../services/script.service';
import { Script } from '../../../mockdata/scripts';

interface ScriptGeneratorProps {
  topic: string;
  onScriptGenerated: (script: Script) => void;
  initialScript?: Script;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  topic,
  onScriptGenerated,
  initialScript
}) => {
  const [script, setScript] = useState<Script | null>(initialScript || null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedScript, setEditedScript] = useState<string>('');
  const [scriptLength, setScriptLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [tone, setTone] = useState<'casual' | 'professional' | 'educational'>('casual');
  
  useEffect(() => {
    if (!initialScript && topic && !script && !isGenerating) {
      generateScript();
    } else if (initialScript) {
      setScript(initialScript);
    }
  }, [topic, initialScript]);
  
  const generateScript = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    
    try {
      const generatedScript = await ScriptService.generateScript({
        topic,
        options: {
          length: scriptLength,
          tone: tone
        }
      });
      
      setScript(generatedScript);
      onScriptGenerated(generatedScript);
    } catch (error) {
      console.error('Error generating script:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleEdit = () => {
    setEditedScript(script?.content || '');
    setIsEditing(true);
  };
  
  const handleSaveEdit = async () => {
    if (!script) return;
    
    const updatedScript = await ScriptService.updateScript({
      scriptId: script.id,
      content: editedScript
    });
    
    setScript(updatedScript);
    setIsEditing(false);
    onScriptGenerated(updatedScript);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedScript('');
  };
  
  const handleRegenerateScript = () => {
    generateScript();
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Script Generator</h2>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Script Length
            </label>
            <div className="flex space-x-2">
              {['short', 'medium', 'long'].map((length) => (
                <button
                  key={length}
                  type="button"
                  onClick={() => setScriptLength(length as any)}
                  className={`py-1 px-3 text-xs rounded-full font-medium ${
                    scriptLength === length
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {length.charAt(0).toUpperCase() + length.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tone
            </label>
            <div className="flex space-x-2">
              {['casual', 'professional', 'educational'].map((toneOption) => (
                <button
                  key={toneOption}
                  type="button"
                  onClick={() => setTone(toneOption as any)}
                  className={`py-1 px-3 text-xs rounded-full font-medium ${
                    tone === toneOption
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {toneOption.charAt(0).toUpperCase() + toneOption.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={generateScript}
            isLoading={isGenerating}
            disabled={isGenerating || isEditing}
            size="sm"
          >
            {script ? 'Generate New Script' : 'Generate Script'}
          </Button>
          
          {script && (
            <Button
              onClick={handleRegenerateScript}
              variant="outline"
              size="sm"
              disabled={isGenerating || isEditing}
              icon={<FiRefreshCw size={16} />}
            >
              Regenerate
            </Button>
          )}
        </div>
      </div>
      
      {isGenerating && (
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded">
          <div className="flex flex-col items-center">
            <FiLoader className="animate-spin h-8 w-8 text-blue-500 mb-2" />
            <p className="text-gray-600">Generating script for &quot;{topic}&quot;...</p>
          </div>
        </div>
      )}
      
      {script && !isGenerating && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium text-gray-900">{script.title}</h3>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                icon={<FiEdit3 size={16} />}
              >
                Edit Script
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <div>
              <textarea
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring focus:ring-blue-500 focus:border-blue-500 min-h-[200px] mb-3"
                value={editedScript}
                onChange={(e) => setEditedScript(e.target.value)}
                placeholder="Write your script here..."
              ></textarea>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-md whitespace-pre-line">
              {script.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScriptGenerator;
