import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { TrendsService } from '../../services/trends.service';
import { TrendingTopic } from '../../mockdata/trendingTopics';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { HotTrends } from '../../components/features/HotTrends/HotTrends';

export default function CreatePage() {
  const router = useRouter();
  const { topicId } = router.query;
  const { setSelectedTopic, setKeyword, setStep } = useVideoCreation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TrendingTopic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<TrendingTopic | null>(null);
  
  // Handle pre-selected topic from trending section
  useEffect(() => {
    if (topicId && typeof topicId === 'string') {
      const fetchTopic = async () => {
        try {
          const topic = await TrendsService.getTrendById(topicId);
          if (topic) {
            setSelectedTrend(topic);
            setSelectedTopic(topic);
          }
        } catch (error) {
          console.error('Failed to fetch topic:', error);
        }
      };
      
      fetchTopic();
    }
  }, [topicId, setSelectedTopic]);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const results = await TrendsService.searchTrends(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleSelectTopic = (topic: TrendingTopic) => {
    setSelectedTrend(topic);
    setSelectedTopic(topic);
  };
  
  const handleCustomTopic = () => {
    setKeyword(searchQuery);
    setStep('script');
    router.push('/create/script');
  };
  
  const handleContinue = () => {
    setStep('script');
    router.push('/create/script');
  };
  
  return (
    <Layout>
      <Head>
        <title>Create New Video - VideoAI</title>
        <meta name="description" content="Create a new AI-powered short video" />
      </Head>
        <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow px-6 py-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a New Video</h1>
              
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Choose a Topic</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Search for a topic or enter your own to get started
                </p>
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search topics (e.g., Sustainable Fashion, AI, Fitness)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                    fullWidth
                  />
                  <Button
                    onClick={handleSearch}
                    isLoading={isSearching}
                  >
                    Search
                  </Button>
                </div>
              </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-900 mb-2">Search Results</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {searchResults.map((topic) => (
                  <div
                    key={topic.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedTrend?.id === topic.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                    onClick={() => handleSelectTopic(topic)}
                  >
                    <h4 className="font-medium text-gray-900">{topic.title}</h4>
                    <div className="flex mt-1">
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                        {topic.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* No Results */}
          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500">
                No matching topics found. Want to create a video about "{searchQuery}"?
              </p>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={handleCustomTopic}
              >
                Use Custom Topic
              </Button>
            </div>
          )}
          
          {/* Selected Topic */}
          {selectedTrend && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Selected Topic: {selectedTrend.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Popular keywords: {selectedTrend.keywords.join(', ')}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedTrend(null);
                    setSelectedTopic(null);
                  }}
                >
                  Change
                </Button>
              </div>
            </div>
          )}
            <div className="flex justify-end">
            <Button
              disabled={!selectedTrend && !searchQuery}
              onClick={selectedTrend ? handleContinue : handleCustomTopic}
            >
              Continue
            </Button>
          </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <HotTrends 
              onSelectTrend={handleSelectTopic}
              limit={8}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
