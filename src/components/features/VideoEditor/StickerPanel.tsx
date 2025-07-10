import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  FaSmile, 
  FaPalette, 
  FaSearchPlus,
  FaSearchMinus,
  FaUndo,
  FaRedo,
  FaEyeSlash,
  FaEye,
  FaLock,
  FaUnlock,
  FaTrash,
  FaCopy,
  FaPaste,
  FaLayerGroup,
  FaPlus,
  FaFilter
} from 'react-icons/fa';
import { useStickerContext } from '@/context/StickerContext';
import { StickerItem, STICKER_CATEGORIES } from '@/types/sticker';
import { 
  calculateCenterPosition, 
  generateRandomOffset, 
  getDefaultVideoSize, 
  getDefaultStickerSize,
  getSafeCenterPosition,
  getOptimalStickerSize 
} from '@/utils/stickerPosition';

interface StickerPanelProps {
  currentTime: number;
  onAddSticker?: () => void;
}

const StickerPanel: React.FC<StickerPanelProps> = ({ 
  currentTime, 
  onAddSticker 
}) => {
  const {
    state: { stickerOverlays, selectedStickerId, clipboard, availableStickers },
    addStickerOverlay,
    addStickerToTimeline,
    removeStickerOverlay,
    selectStickerOverlay,
    updateStickerOverlay,
    duplicateStickerOverlay,
    updateStickerPosition,
    updateStickerSize,
    updateStickerRotation,
    updateStickerOpacity,
    updateStickerTiming,
    setStickerVisibility,
    setStickerLock,
    copyStickerOverlay,
    pasteStickerOverlay,
    bringToFront,
    sendToBack,
    getStickerOverlayById,
  } = useStickerContext();

  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPack, setSelectedPack] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOverlay = selectedStickerId ? getStickerOverlayById(selectedStickerId) : null;

  // Filter stickers by pack and search
  const filteredStickers = availableStickers.filter(sticker => {
    const matchesPack = selectedPack === 'all' || sticker.pack === selectedPack;
    const matchesSearch = sticker.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPack && matchesSearch;
  });

  // Get unique packs for categories
  const packs = ['all', ...new Set(availableStickers.map(s => s.pack))];

  // Handle add sticker
  const handleAddSticker = useCallback((sticker: StickerItem) => {
    const videoSize = getDefaultVideoSize();
    const stickerSize = getOptimalStickerSize(videoSize);

    const position = getSafeCenterPosition(videoSize, stickerSize, 60);
    
    // Add sticker to timeline with default duration of 5 seconds
    const newStickerId = addStickerToTimeline(
      sticker.id,
      sticker.url,
      sticker.name,
      position,
      currentTime,
      5 // Default duration
    );
    
    console.log('Adding sticker to timeline with safe positioning:', {
      sticker: sticker.name,
      position,
      currentTime,
      duration: 5,
      videoSize,
      stickerSize
    });
    
    if (onAddSticker) {
      onAddSticker();
    }
  }, [addStickerToTimeline, currentTime, onAddSticker]);

  // Handle sticker selection
  const handleSelectSticker = useCallback((id: string) => {
    selectStickerOverlay(id);
  }, [selectStickerOverlay]);

  // Handle property updates with validation
  const handleSizeUpdate = useCallback((size: { width: number; height: number }) => {
    if (selectedStickerId) {
      const maxSize = 180;
      const minSize = 10;
      
      let validatedSize = { ...size };
      let hasError = false;
      
      if (size.width > maxSize) {
        toast.warning(`Maximum width is ${maxSize}px!`, {
          position: "top-right",
          autoClose: 1500,
        });
        validatedSize.width = maxSize;
        hasError = true;
      } else if (size.width < minSize) {
        toast.warning(`Minimum width is ${maxSize}px!`, {
          position: "bottom-right", 
          autoClose: 1500,
        });
        validatedSize.width = minSize;
        hasError = true;
      }
      
      if (size.height > maxSize) {
        toast.warning(`Maximum heoght is ${maxSize}px!`, {
          position: "bottom-right",
          autoClose: 1500,
        });
        validatedSize.height = maxSize;
        hasError = true;
      } else if (size.height < minSize) {
        toast.warning(`Minimum width is ${maxSize}px!`, {
          position: "bottom-right",
          autoClose: 1500,
        });
        validatedSize.height = minSize;
        hasError = true;
      }
      
      updateStickerSize(selectedStickerId, validatedSize);
    }
  }, [selectedStickerId, updateStickerSize]);

  const handleOpacityUpdate = useCallback((opacity: number) => {
    if (selectedStickerId) {
      updateStickerOpacity(selectedStickerId, opacity);
    }
  }, [selectedStickerId, updateStickerOpacity]);

  const handleTimingUpdate = useCallback((timing: { startTime: number; endTime: number }) => {
    if (selectedStickerId) {
      updateStickerTiming(selectedStickerId, timing);
    }
  }, [selectedStickerId, updateStickerTiming]);

  // Render sticker library
  const renderStickerLibrary = () => {
    return (
      <div className="space-y-4">
        {/* Pack Filter */}
        <div className="flex flex-wrap gap-2">
          {packs.map(pack => (
            <button
              key={pack}
              onClick={() => setSelectedPack(pack)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedPack === pack
                  ? 'bg-blue-500 text-white shadow-md border-2 border-blue-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent hover:border-gray-300'
              }`}
            >
              {pack === 'all' ? 'All' : pack}
            </button>
          ))}
        </div>

        {/* Sticker Grid */}
        <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
          {filteredStickers.map((sticker) => (
            <motion.button
              key={sticker.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAddSticker(sticker)}
              className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
              title={sticker.name}
            >
              <img
                src={sticker.url}
                alt={sticker.name}
                className="w-12 h-12 object-contain"
              />
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  // Render sticker list
  const renderStickerList = () => {
    return (
      <div className="space-y-3 max-h-40 overflow-y-auto">
        {stickerOverlays.map((sticker) => (
          <motion.div
            key={sticker.id}
            whileHover={{ x: 2 }}
            className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
              selectedStickerId === sticker.id
                ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
            onClick={() => handleSelectSticker(sticker.id)}
          >
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
              <img
                src={sticker.stickerUrl}
                alt={sticker.stickerName}
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="text-sm font-medium truncate flex-1 text-gray-700">{sticker.stickerName}</span>
            
            {/* Sticker controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStickerVisibility(sticker.id, !sticker.visible);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  sticker.visible 
                    ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={sticker.visible ? 'Ẩn' : 'Hiện'}
              >
                {sticker.visible ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStickerLock(sticker.id, !sticker.locked);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  sticker.locked 
                    ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={sticker.locked ? 'Mở khóa' : 'Khóa'}
              >
                {sticker.locked ? <FaLock className="w-4 h-4" /> : <FaUnlock className="w-4 h-4" />}
              </button>
              
              {/* <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeStickerOverlay(sticker.id);
                }}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa"
              >
                <FaTrash className="w-4 h-4" />
              </button> */}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Render properties panel
  const renderPropertiesPanel = () => {
    if (!selectedOverlay) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FaSmile className="mx-auto mb-2 text-2xl" />
          <p>Choose a sticker to edit</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Size Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Size
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="10"
              max="180"
              value={selectedOverlay.size.width}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 10;
                handleSizeUpdate({
                  width: value,
                  height: selectedOverlay.size.height
                });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              placeholder="Width"
              title="Width"
            />
            <input
              type="number"
              min="10"
              max="180"
              value={selectedOverlay.size.height}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 10;
                handleSizeUpdate({
                  width: selectedOverlay.size.width,
                  height: value
                });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              placeholder="Height"
              title="Height"
            />
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opacity ({Math.round(selectedOverlay.opacity * 100)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedOverlay.opacity}
            onChange={(e) => handleOpacityUpdate(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Content */}
      {isExpanded && (
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Sticker Library */}
          <div>
            {renderStickerLibrary()}
          </div>

          {/* Current Stickers */}
          {stickerOverlays.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Stickers  ({stickerOverlays.length})
              </h4>
              {renderStickerList()}
            </div>
          )}

          {/* Properties */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Properties</h4>
            {renderPropertiesPanel()}
          </div>
        </div>
      )}
    </div>
  );
};

export default StickerPanel;

