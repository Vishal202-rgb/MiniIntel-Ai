import React, { useState, useEffect } from 'react';
import { Layers, Search, ArrowRight, Loader2, BookOpen, FileText } from 'lucide-react';
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
    <div className="p-5 max-w-7xl mx-auto text-gray-800 dark:text-neutral-200">
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Topics Explorer</h1>
        <p className="text-gray-600 dark:text-slate-400">Explore key themes and insights across your mining knowledge base.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <Layers className="w-5 h-5" />
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300">Total Topics</h3>
          </div>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">{loading ? '-' : topics.length}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300">Documents Analyzed</h3>
          </div>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">5</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg md:col-span-2 shadow-sm">
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <Search className="w-5 h-5" />
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300">Most Relevant Topic</h3>
          </div>
          <p className="text-xl font-bold text-neutral-900 dark:text-white mt-2 truncate">
            {loading ? '-' : topics.length > 0 ? topics[0].name : 'N/A'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-blue-400">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span className="text-lg">Analyzing topics...</span>
        </div>
      ) : error ? (
        <div className="bg-red-950/30 border border-red-900/50 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map(topic => (
            <div 
              key={topic._id} 
              onClick={() => handleExplore(topic.name)}
              className="hover-lift bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg flex flex-col transition-all cursor-pointer group hover:border-blue-500/50 hover:shadow-lg"
            >
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{topic.name}</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm flex-grow mb-4 leading-relaxed">{topic.description}</p>
              
              {topic.relatedTopics && topic.relatedTopics.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">Related Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.relatedTopics.slice(0, 3).map((rt, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        {rt.topicId?.name || 'Topic'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {topic.documentCount} Ref
                </span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md">
                  Match: {Math.round(topic.relevanceScore * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicsExplorer;
