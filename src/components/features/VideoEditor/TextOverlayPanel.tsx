import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FaFont, 
  FaPalette, 
  FaAlignLeft, 
  FaAlignCenter, 
  FaAlignRight,
  FaBold,
  FaItalic,
  FaUnderline,
  FaEyeSlash,
  FaEye,
  FaLock,
  FaUnlock,
  FaTrash,
  FaCopy,
  FaPaste,
  FaLayerGroup,
  FaPlus
} from 'react-icons/fa';
import { useTextOverlayContext } from '@/context/TextOverlayContext';
import { FONT_FAMILIES, FONT_SIZES, TEXT_COLORS } from '@/types/text';

interface TextOverlayPanelProps {
  currentTime: number;
  onAddText?: () => void;
}

const TextOverlayPanel: React.FC<TextOverlayPanelProps> = ({ 
  currentTime, 
  onAddText 
}) => {
  const {
    state: { textOverlays, selectedTextId, clipboard },
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    selectTextOverlay,
    duplicateTextOverlay,
    updateTextStyle,
    updateTextTiming,
    setTextOverlayVisibility,
    setTextOverlayLock,
    copyTextOverlay,
    pasteTextOverlay,
    bringToFront,
    sendToBack,
    getTextOverlayById,
  } = useTextOverlayContext();

  const [isExpanded, setIsExpanded] = useState(true);
  const [newTextInput, setNewTextInput] = useState('');

  const selectedOverlay = selectedTextId ? getTextOverlayById(selectedTextId) : null;

  // Handle add new text with input
  const handleAddTextWithInput = useCallback(() => {
    if (newTextInput.trim()) {
      const newTextId = addTextOverlay(newTextInput.trim(), { x: 50, y: 50 });
      setNewTextInput('');
      selectTextOverlay(newTextId);
      if (onAddText) {
        onAddText();
      }
    }
  }, [addTextOverlay, newTextInput, selectTextOverlay, onAddText]);

  // Handle add new text
  const handleAddText = useCallback(() => {
    const newTextId = addTextOverlay('New Text', { x: 50, y: 50 });
    selectTextOverlay(newTextId);
    if (onAddText) {
      onAddText();
    }
  }, [addTextOverlay, selectTextOverlay, onAddText]);

  // Handle text selection
  const handleSelectText = useCallback((id: string) => {
    selectTextOverlay(id);
  }, [selectTextOverlay]);

  // Handle style updates
  const handleStyleUpdate = useCallback((styleUpdates: any) => {
    if (selectedTextId) {
      updateTextStyle(selectedTextId, styleUpdates);
    }
  }, [selectedTextId, updateTextStyle]);

  // Handle timing updates (kept for compatibility)
  const handleTimingUpdate = useCallback((timingUpdates: any) => {
    if (selectedTextId) {
      updateTextTiming(selectedTextId, timingUpdates);
    }
  }, [selectedTextId, updateTextTiming]);

  // Render style controls
  const renderStyleControls = () => {
    if (!selectedOverlay) {
      return (
        <div className="text-center text-gray-500 py-8">
          <div className="mb-4 text-4xl">🎨</div>
          <p>Select a text overlay to edit its style</p>
          <p className="text-sm mt-2">Click on a text overlay in the video or from the list above</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Text Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Content
          </label>
          <textarea
            value={selectedOverlay.text}
            onChange={(e) => updateTextOverlay(selectedOverlay.id, { text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Enter your text here..."
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Family
          </label>
          <select
            value={selectedOverlay.style.fontFamily}
            onChange={(e) => handleStyleUpdate({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Size: {selectedOverlay.style.fontSize}px
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="8"
              max="128"
              value={selectedOverlay.style.fontSize}
              onChange={(e) => handleStyleUpdate({ fontSize: parseInt(e.target.value) })}
              className="flex-1"
            />
            <select
              value={selectedOverlay.style.fontSize}
              onChange={(e) => handleStyleUpdate({ fontSize: parseInt(e.target.value) })}
              className="px-2 py-1 border border-gray-300 rounded"
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Font Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Style
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStyleUpdate({ 
                fontWeight: selectedOverlay.style.fontWeight === 'bold' ? 'normal' : 'bold' 
              })}
              className={`p-2 rounded ${
                selectedOverlay.style.fontWeight === 'bold' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <FaBold size={14} />
            </button>
            
            <button
              onClick={() => handleStyleUpdate({ 
                fontStyle: selectedOverlay.style.fontStyle === 'italic' ? 'normal' : 'italic' 
              })}
              className={`p-2 rounded ${
                selectedOverlay.style.fontStyle === 'italic' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <FaItalic size={14} />
            </button>
            
            <button
              onClick={() => handleStyleUpdate({ 
                textDecoration: selectedOverlay.style.textDecoration === 'underline' ? 'none' : 'underline' 
              })}
              className={`p-2 rounded ${
                selectedOverlay.style.textDecoration === 'underline' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <FaUnderline size={14} />
            </button>
          </div>
        </div>
        {/* Text Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={selectedOverlay.style.color}
              onChange={(e) => handleStyleUpdate({ color: e.target.value })}
              className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
            />
            <div className="grid grid-cols-10 gap-1 flex-1">
              {TEXT_COLORS.map((color,index) => (
                <button
                  key={index}
                  onClick={() => handleStyleUpdate({ color })}
                  className={`w-6 h-6 rounded border-2 ${
                    selectedOverlay.style.color === color 
                      ? 'border-gray-800' 
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opacity: {Math.round(selectedOverlay.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedOverlay.opacity}
            onChange={(e) => updateTextOverlay(selectedOverlay.id, { opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
     

      {isExpanded && (
        <div className="p-4">
          {/* Add Text Section */}
          <div className="space-y-4 mb-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Add New Text Overlay</h3>
              
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Content
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTextInput}
                    onChange={(e) => setNewTextInput(e.target.value)}
                    placeholder="Enter your text here..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTextWithInput();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddTextWithInput}
                    disabled={!newTextInput.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <FaPlus size={12} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Style Controls */}
          <div className="border-t pt-4">
            {renderStyleControls()}
          </div>

          {/* Action Buttons */}
          {selectedOverlay && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => duplicateTextOverlay(selectedOverlay.id)}
                className="flex items-center space-x-1 px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
              >
                <FaCopy size={12} />
                <span>Duplicate</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextOverlayPanel;
