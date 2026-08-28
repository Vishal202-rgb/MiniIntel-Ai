import React, { useState, useEffect } from 'react';
import { Layers, Search, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TopicsExplorer = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get('/topics');
        setTopics(res.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load topics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const handleExplore = (topicName) => {
    navigate(`/knowledge-base?q=${encodeURIComponent(topicName)}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-800 dark:text-neutral-200">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Topics Explorer</h1>
        <p className="text-gray-600 dark:text-neutral-400">Explore key themes and insights across your mining knowledge base.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="hover-lift bg-white dark:bg-dark-card border border-gray-200 dark:border-neutral-800 p-5 rounded-xl">
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <Layers className="hover-lift-icon w-5 h-5" />
            <h3 className="font-semibold text-gray-700 dark:text-neutral-300">Total Topics</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '-' : topics.length}</p>
        </div>
        <div className="hover-lift bg-white dark:bg-dark-card border border-gray-200 dark:border-neutral-800 p-5 rounded-xl">
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <BookOpen className="hover-lift-icon w-5 h-5" />
            <h3 className="font-semibold text-gray-700 dark:text-neutral-300">Documents Analyzed</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">5</p>
        </div>
        <div className="hover-lift bg-white dark:bg-dark-card border border-gray-200 dark:border-neutral-800 p-5 rounded-xl md:col-span-2">
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <Search className="hover-lift-icon w-5 h-5" />
            <h3 className="font-semibold text-gray-700 dark:text-neutral-300">Most Relevant Topic</h3>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-2 truncate">
            {loading ? '-' : topics.length > 0 ? topics[0].name : 'N/A'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-indigo-400">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span className="text-lg">Analyzing topics...</span>
        </div>
      ) : error ? (
        <div className="bg-red-950/30 border border-red-900/50 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map(topic => (
            <div key={topic._id} className="hover-lift bg-white dark:bg-dark-card border border-gray-200 dark:border-neutral-800 p-6 rounded-xl flex flex-col transition-colors">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{topic.name}</h3>
              <p className="text-gray-600 dark:text-neutral-400 text-sm flex-grow mb-4">{topic.description}</p>
              
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-gray-500 dark:text-neutral-500">{topic.documentCount} references</span>
                <span className="text-indigo-400 bg-indigo-100 dark:bg-indigo-500/10 px-2 py-1 rounded-md">
                  Relevance: {Math.round(topic.relevanceScore * 100)}%
                </span>
              </div>
              
              <button 
                onClick={() => handleExplore(topic.name)}
                className="w-full py-2 bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#2A2A2A] border border-gray-300 dark:border-neutral-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                Explore <ArrowRight className="hover-lift-arrow w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicsExplorer;
