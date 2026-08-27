import React, { useState } from 'react';
import { Monitor, FileText, CheckCircle, AlertTriangle, FileOutput, Bot, Send, Loader2 } from 'lucide-react';
import { orchestrate } from '../services/apiAgents';

const CommandCenter = () => {
  const [taskInput, setTaskInput] = useState('');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [orchestratorResult, setOrchestratorResult] = useState(null);

  const stats = [
    { label: 'Docs Processed', value: '1,248', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Validation Score', value: '98.5%', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Open Issues', value: '12', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Reports Generated', value: '342', icon: FileOutput, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' }
  ];

  const handleOrchestrate = async (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    setIsOrchestrating(true);
    setOrchestratorResult(null);
    try {
      const res = await orchestrate(taskInput, { source: 'command-center' });
      setOrchestratorResult({ success: true, message: res.message || 'Task completed successfully.' });
    } catch (err) {
      setOrchestratorResult({ success: false, message: err.message || 'Failed to orchestrate task.' });
    } finally {
      setIsOrchestrating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Monitor className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Command Center</h1>
      </div>

      {/* System Stats Summary */}
      <section>
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-dark-card p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
              <div className={`p-4 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Multi-Agent Orchestrator Section */}
      <section className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center gap-3">
          <Bot className="w-6 h-6 text-indigo-500" />
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Multi-Agent Orchestrator</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Command the system's agents to perform complex, multi-step tasks across the knowledge base.
            </p>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleOrchestrate} className="space-y-4">
            <div>
              <label htmlFor="taskInput" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                New Task Assignment
              </label>
              <div className="flex gap-3">
                <input
                  id="taskInput"
                  type="text"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder='e.g., "Analyze production metrics from last month and generate a summary report"'
                  className="flex-1 px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-shadow text-base"
                  disabled={isOrchestrating}
                />
                <button
                  type="submit"
                  disabled={!taskInput.trim() || isOrchestrating}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {isOrchestrating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  Execute
                </button>
              </div>
            </div>
          </form>

          {orchestratorResult && (
            <div className={`mt-6 p-4 rounded-lg border flex items-start gap-3 ${
              orchestratorResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
            }`}>
              {orchestratorResult.success ? (
                <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              )}
              <div>
                <h4 className="font-medium mb-1">
                  {orchestratorResult.success ? 'Task Accepted' : 'Orchestration Failed'}
                </h4>
                <p className="text-sm opacity-90">{orchestratorResult.message}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CommandCenter;
