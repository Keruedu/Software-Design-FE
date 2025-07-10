import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiZap, FiStar, FiTag } from 'react-icons/fi';

import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { TrendsService } from '../../services/trends.service';
import { TrendingTopic } from '../../mockdata/trendingTopics';
import { useVideoCreation } from '../../context/VideoCreationContext';
import { HotTrends } from '../../components/features/HotTrends/HotTrends';

// Danh sách các style tags để lựa chọn
const AVAILABLE_STYLE_TAGS = [
  'Informative', 'Humorous', 'Dramatic', 'Educational', 
  'Storytelling', 'Conversational', 'Professional', 'Casual',
  'Motivational', 'Inspirational', 'Technical', 'Simplistic',
  'Poetic', 'Friendly', 'Formal'
];

export default function CreatePage() {
  const router = useRouter();
  const { topicId } = router.query;
  const { setSelectedTopic, setKeyword, setStep, state, setSelectedAIModel, setScriptStyleTags } = useVideoCreation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TrendingTopic[]>([]);
  const [suggestions, setSuggestions] = useState<{text: string, type: 'topic' | 'keyword'}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<TrendingTopic | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // Reference to the search timer for debounce
  const suggestionsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    
    try {
      const results = await TrendsService.searchTrends(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      handleSearch();
    } else if (e.key === 'ArrowDown' && suggestions.length > 0 && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestionIndex(0);
      const suggestionElement = document.getElementById('suggestion-0');
      if (suggestionElement) suggestionElement.focus();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };
  
  // Handle suggestion keyboard navigation
  const handleSuggestionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(index + 1, suggestions.length - 1);
      setSelectedSuggestionIndex(nextIndex);
      const nextElement = document.getElementById(`suggestion-${nextIndex}`);
      if (nextElement) nextElement.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index === 0) {
        // Move focus back to search input
        setSelectedSuggestionIndex(-1);
        if (searchInputRef.current) searchInputRef.current.focus();
      } else {
        const prevIndex = index - 1;
        setSelectedSuggestionIndex(prevIndex);
        const prevElement = document.getElementById(`suggestion-${prevIndex}`);
        if (prevElement) prevElement.focus();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectSuggestion(suggestions[index].text);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  };
  
  // Fetch suggestions when typing
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear previous timers
    if (suggestionsTimerRef.current) {
      clearTimeout(suggestionsTimerRef.current);
    }
    
    if (value.trim().length >= 2) {
      setIsFetchingSuggestions(true);
      setShowSuggestions(true);
      
      // Debounce suggestions to avoid excessive API calls
      suggestionsTimerRef.current = setTimeout(async () => {
        try {
          const suggestionResults = await TrendsService.getSuggestions(value);
          setSuggestions(suggestionResults);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
        } finally {
          setIsFetchingSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };
  
  const handleSelectTopic = (topic: TrendingTopic) => {
    setSelectedTrend(topic);
    setSelectedTopic(topic);
  };
  
  // handleCustomTopic is now integrated into handleContinue
  
  const handleContinue = () => {
    // Ensure we have the current state with style tags
    console.log('🔄 Continuing with style tags:', state.scriptStyleTags);
    
    // If no topic is selected but there is a search query, use it as a custom topic
    if (!selectedTrend && searchQuery) {
      setKeyword(searchQuery);
    }
    
    setStep('script');
    router.push('/create/script');
  };
  
  // Đóng dropdown gợi ý khi nhấp ra ngoài và dọn dẹp timer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.getElementById('search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Clean up timer when component unmounts
      if (suggestionsTimerRef.current) {
        clearTimeout(suggestionsTimerRef.current);
      }
    };
  }, []);
  
  // Hàm làm nổi bật phần khớp trong gợi ý
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, index) => 
          regex.test(part) 
            ? <span key={index} className="bg-yellow-100 font-medium">{part}</span> 
            : <span key={index}>{part}</span>
        )}
      </>
    );
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
              
              {/* AI Model Selection */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">AI Model for Text Generation</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedAIModel('deepseek')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      state.selectedAIModel === 'deepseek'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FiZap className="w-4 h-4 mr-2" />
                    DeepSeek
                    {state.selectedAIModel === 'deepseek' && (
                      <span className="ml-2 text-xs bg-blue-500 px-2 py-1 rounded-full">Default</span>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedAIModel('gemini')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      state.selectedAIModel === 'gemini'
                        ? 'bg-green-600 text-white shadow'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FiStar className="w-4 h-4 mr-2" />
                    Gemini
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: <span className="font-medium">{state.selectedAIModel === 'deepseek' ? 'DeepSeek' : 'Gemini'}</span> will be used for generating video scripts
                </p>
              </div>
              
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Choose a Topic</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Search for a topic or enter your own to get started
                </p>
                
                <div className="flex flex-col space-y-0 relative" id="search-container">
                  <div className="flex space-x-2">
                    <div className="relative flex-grow">
                      <Input
                        id="search-input"
                        placeholder="Search topics (e.g., Sustainable Fashion, AI, Fitness)"
                        value={searchQuery}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                        fullWidth
                        ref={searchInputRef}
                      />
                      
                      {/* Suggestions dropdown */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          <ul className="py-1">
                            {suggestions.map((suggestion, index) => (
                              <li key={`${suggestion.text}-${index}`}>
                                <button
                                  id={`suggestion-${index}`}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-100 focus:bg-blue-100 focus:outline-none ${
                                    selectedSuggestionIndex === index ? 'bg-blue-100' : ''
                                  } flex items-center justify-between`}
                                  onClick={() => handleSelectSuggestion(suggestion.text)}
                                  onKeyDown={(e) => handleSuggestionKeyDown(e, index)}
                                  tabIndex={0}
                                >
                                  <div>
                                    {highlightMatch(suggestion.text, searchQuery)}
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    suggestion.type === 'topic' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {suggestion.type === 'topic' ? 'Topic' : 'Keyword'}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Loading indicator for suggestions */}
                      {isFetchingSuggestions && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleSearch()}
                      isLoading={isSearching}
                      type="button"
                    >
                      Search
                    </Button>
                  </div>
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
          
          {/* No Results - only shown after search button clicked */}
          {searchQuery && searchResults.length === 0 && !isSearching && !isFetchingSuggestions && !showSuggestions && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500">
                No matching topics found for "{searchQuery}". You can continue with this topic.
              </p>
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
          
          {/* Script Style Tags Selection */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <FiTag className="text-gray-500 mr-1" />
              <label className="block text-sm font-medium text-gray-700">
                Script Style Personalization
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Select style tags to personalize your script's tone and style
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_STYLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    // Toggle the tag selection
                    const updatedTags = state.scriptStyleTags?.includes(tag)
                      ? state.scriptStyleTags.filter((t) => t !== tag)
                      : [...(state.scriptStyleTags || []), tag];
                    
                    // Update context with style tags
                    setScriptStyleTags(updatedTags);
                  }}
                  className={`px-3 py-1 text-xs rounded-full ${
                    state.scriptStyleTags?.includes(tag)
                      ? 'bg-blue-100 text-blue-800 border-blue-300 border'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              disabled={!selectedTrend && !searchQuery}
              onClick={handleContinue}
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
