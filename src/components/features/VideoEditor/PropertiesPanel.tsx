import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronRight } from 'react-icons/fa';

interface PropertySection {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
  defaultExpanded?: boolean;
}

interface PropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: PropertySection[];
  width?: number;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  isOpen,
  onClose,
  title,
  sections,
  width = 400
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(() => {
    const defaultSection = sections.find(s => s.defaultExpanded);
    return defaultSection ? defaultSection.id : null;
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: width }}
          exit={{ width: 0 }}
          transition={{ 
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1] // Custom bezier curve cho smooth motion
          }}
          className="bg-white border-l border-gray-200 shadow-lg flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {sections.map((section) => {
              const isExpanded = expandedSection === section.id;
              
              return (
                <div key={section.id} className="border-b border-gray-100 last:border-b-0">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center justify-between p-4 text-left transition-all duration-200 ${
                      isExpanded ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {section.icon && (
                        <div className={`transition-colors duration-200 ${
                          isExpanded ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {section.icon}
                        </div>
                      )}
                      <span className={`font-medium transition-colors duration-200 ${
                        isExpanded ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {section.title}
                      </span>
                    </div>
                    <motion.div
                      animate={{ 
                        rotate: isExpanded ? 90 : 0
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`transition-colors duration-200 ${
                        isExpanded ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      <FaChevronRight className="w-4 h-4" />
                    </motion.div>
                  </button>

                  {/* Section Content */}
                  <motion.div
                    initial={false}
                    animate={{ 
                      height: isExpanded ? 'auto' : 0,
                      opacity: isExpanded ? 1 : 0
                    }}
                    transition={{ 
                      duration: 0.3,
                      ease: [0.04, 0.62, 0.23, 0.98]
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 bg-gray-50">
                      {section.content}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-2 bg-gray-50 flex-shrink-0">
            <div className="text-xs text-gray-500 text-center">
              {expandedSection 
                ? `${sections.find(s => s.id === expandedSection)?.title}`
                : 'Select an item to start editing'
              }
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PropertiesPanel;