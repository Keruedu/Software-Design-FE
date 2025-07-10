import React from "react";
import {motion} from "framer-motion";
import { 
  FaVideo, 
  FaFont, 
  FaArrowLeft, 
  FaMusic,
  FaImages,
  FaFilter,
  FaSmile,
  FaCog,
  FaAlignJustify 
} from 'react-icons/fa';
import { useState } from "react";
type ActiveTab = 'text' | 'media' | 'effects' | 'stickers' | null
interface SidebarProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    onBackToGenerate: () => void;
}

const Sidebar:React.FC<SidebarProps>=({
    activeTab,
    setActiveTab,
    onBackToGenerate
})=>{
     const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const sidebarItems = [
    {
      id: 'text',
      label: 'Text',
      icon: FaFont,
      description: 'Add text overlays and titles'
    },

    // {
    //   id: 'media',
    //   label: 'Media',
    //   icon: FaImages,
    //   description: 'Images, videos, and assets'
    // },
    {
      id: 'media',
      label: 'Music',
      icon: FaMusic,
      description: 'Add background music and audio'
    },
    {
      id: 'stickers',
      label: 'Stickers',
      icon: FaSmile,
      description: 'Add stickers to video'
    }
];


  return (
    <motion.div
        initial={{width:sidebarCollapsed?60:280}}
        animate ={{width:sidebarCollapsed?60:280}}
        transition={{duration:0.3}}
        className="bg-white border-r border-gray-200 flex flex-col shadow-lg"
    >
        {/* Sidebar Header */}
        <div className="p-4 border-b flex-shrink-0 border-gray-200">
            <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBackToGenerate}
                        className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                        <FaArrowLeft className="w-4 h-4" />
                    </motion.button>
                    <h2 className="text-gray-900 font-semibold">Video Editor</h2>
                </motion.div>
                )}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                    <FaAlignJustify  className="w-4 h-4" />
                </motion.button>
            </div>

        </div>
        
        {/* Sidebar Menu */}

        <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-2">
                {sidebarItems.map((item)=>(
                    <motion.button
                        key={item.id}
                        whileHover={{ x: 2 }}
                        onClick={() => {
                            // if (activeTab === item.id) {
                            //     setActiveTab(null); 
                            // } else {
                            //     setActiveTab(item.id as ActiveTab);
                            // }
                            setActiveTab(item.id as ActiveTab);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                                activeTab === item.id
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        title={sidebarCollapsed ? item.label : ''}>
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.label}</div>
                            <div className="text-xs text-gray-500 truncate">{item.description}</div>
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>
        </div>

    </motion.div>
  )
}
export default Sidebar;