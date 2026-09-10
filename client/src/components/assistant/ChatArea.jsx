import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Brain, Sparkles, Loader2, FileText, Activity, ShieldCheck, Compass, AlertTriangle } from 'lucide-react';

const ChatArea = ({ messages, loading, convLoading, convError, onSampleClick }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, convLoading]);

  const samplePrompts = [
    {
      icon: Activity,
      label: 'Production Variance',
      query: 'Analyze Q3 production shortfall variance vs target and identify operational bottlenecks.'
    },
    {
      icon: Compass,
      label: 'Equipment Downtime',
      query: 'What were the primary equipment downtime and haulage restrictions recorded in recent reports?'
    },
    {
      icon: ShieldCheck,
      label: 'DGMS Statutory Compliance',
      query: 'Summarize statutory safety circular guidelines and compliance status across active pits.'
    },
    {
      icon: FileText,
      label: 'Stripping Ratio Analytics',
      query: 'Compute the overburden removal (OBR) to coal seam ratio and compare with target benchmarks.'
    }
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-[#0B0E14] space-y-4 custom-scrollbar">
      {/* ── 1. History Retrieval Loading State ── */}
      {convLoading ? (
        <div className="flex flex-col h-full items-center justify-center text-center max-w-md mx-auto py-20 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#161B26] border border-slate-200 dark:border-[#2B3245] flex items-center justify-center text-copper-500 shadow-xs">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Retrieving Consultation from Database</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Loading operator queries, deterministic computations, and verified document citations...
            </p>
          </div>
        </div>
      ) : convError ? (
        /* ── 2. Error Loading State ── */
        <div className="flex flex-col h-full items-center justify-center text-center max-w-md mx-auto py-20 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-500 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-700 dark:text-red-400">Consultation Load Failed</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {convError}
            </p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        /* ── 3. Empty Conversation / Starter Prompts ── */
        <div className="flex flex-col h-full items-center justify-center text-center max-w-2xl mx-auto py-8">
          <div className="w-12 h-12 bg-slate-100 dark:bg-[#161B26] border border-slate-200 dark:border-[#2B3245] rounded-xl flex items-center justify-center mb-3 text-slate-500 dark:text-slate-300 shadow-xs">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5">
            MineIntel Operations Intelligence Assistant
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#94A3B8] max-w-md mb-6 leading-relaxed">
            Inquire about statutory mining documents, compute production variance vs targets, and inspect 100% evidence-grounded page citations.
          </p>

          {/* Quick Prompt Starters */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onSampleClick && onSampleClick(p.query)}
                className="p-3 bg-white dark:bg-[#161B26] border border-slate-200 dark:border-[#2B3245] rounded-lg hover:border-copper-500/50 text-left transition-all group shadow-xs"
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] font-bold text-copper-600 dark:text-copper-400">
                  <p.icon className="w-3.5 h-3.5" />
                  <span>{p.label}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-[#CBD5E1] group-hover:text-slate-900 dark:group-hover:text-white line-clamp-2 leading-relaxed">
                  "{p.query}"
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── 4. Active Message Stream ── */
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}

          {/* Dedicated Processing Pipeline Indicator */}
          {loading && (
            <div className="flex w-full justify-start my-4">
              <div className="w-full max-w-4xl bg-white dark:bg-[#161B26] border border-slate-200 dark:border-[#2B3245] rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-copper-500" />
                    <span>MineIntel Intelligence Engine</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-copper-500/10 text-copper-600 dark:text-copper-400 font-semibold">
                    Processing Statutory Query
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#2B3245] flex items-center gap-2 text-slate-700 dark:text-[#CBD5E1]">
                    <div className="w-1.5 h-1.5 rounded-full bg-copper-500 animate-ping"></div>
                    <span>1. Searching Knowledge Chunks</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#2B3245] flex items-center gap-2 text-slate-700 dark:text-[#CBD5E1]">
                    <div className="w-1.5 h-1.5 rounded-full bg-copper-500"></div>
                    <span>2. Deterministic Arithmetic</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-[#2B3245] flex items-center gap-2 text-slate-700 dark:text-[#CBD5E1]">
                    <div className="w-1.5 h-1.5 rounded-full bg-copper-500"></div>
                    <span>3. Grounding Provenance</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatArea;
