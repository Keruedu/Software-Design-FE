import React from 'react';
import { motion } from 'framer-motion';
import { FaUpload, FaCheckCircle, FaSpinner, FaDatabase } from 'react-icons/fa';

interface ExportProgressModalProps {
    isVisible: boolean;
    progress: number;
    stage: string;
}

const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
    isVisible,
    progress,
    stage
}) => {
    if (!isVisible) return null;

    const getStageIcon = () => {
        if (progress === 100) return <FaCheckCircle className="text-green-500" size={24} />;
        if (progress >= 80) return <FaDatabase className="text-blue-500" size={24} />;
        if (progress >= 70) return <FaUpload className="text-yellow-500" size={24} />;
        return <FaSpinner className="text-blue-500 animate-spin" size={24} />;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
                <div className="text-center">
                    <div className="mb-6">
                        {getStageIcon()}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        {progress === 100 ? 'Export Completed!' : 'Exporting Video...'}
                    </h3>
                    
                    <p className="text-gray-600 mb-6">{stage}</p>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <motion.div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-4">
                        {progress}% completed
                    </div>

                    {progress === 100 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-green-600 font-medium"
                        >
                            Video has been successfully saved to the database!
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ExportProgressModal;
