import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  AlertTriangle, User, Brain, Shield, FileText, 
  Calculator, ChevronDown, ChevronRight, CheckCircle2,
  ExternalLink, Sparkles
} from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const [sourcesOpen, setSourcesOpen] = useState(true);

  if (isUser) {
    return (
      <div className="flex w-full justify-end my-3">
        <div className="flex max-w-[85%] md:max-w-[70%] gap-2.5 flex-row-reverse">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#1F2430] border border-slate-200 dark:border-[#2B3245] text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-xs">
            <User size={15} />
          </div>
          <div className="bg-slate-100 dark:bg-[#1F2430] border border-slate-200 dark:border-[#2B3245] text-slate-900 dark:text-white rounded-lg rounded-tr-none px-4 py-2.5 shadow-xs text-xs sm:text-sm font-medium leading-relaxed break-words">
            <div className="text-[10px] uppercase font-bold text-copper-600 dark:text-copper-400 tracking-wider mb-1">Operator Inquiry</div>
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // AI Intelligence Response (Dedicated Result Panel)
  const confidence = typeof message.confidence === 'number' ? message.confidence : null;
  const citations = message.citations || message.sources || [];
  const calculation = message.calculation && Object.keys(message.calculation).length > 0 ? message.calculation : null;
  const isInsufficient = Boolean(
    message.insufficientEvidence || 
    message.content?.toLowerCase().includes('insufficient evidence') ||
    message.content?.toLowerCase().includes('not contain enough information')
  );

  return (
    <div className="flex w-full justify-start my-4">
      <div className="w-full max-w-4xl bg-white dark:bg-[#161B26] border border-slate-200 dark:border-[#2B3245] rounded-lg shadow-xs overflow-hidden transition-all">
        
        {/* Result Panel Top Status Bar */}
        <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-[#0E121A] border-b border-slate-200 dark:border-[#2B3245] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Brain className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
              MineIntel Operations Intelligence
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">•</span>
            <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] hidden sm:inline">RAG Evidence Grounded</span>
          </div>

          <div className="flex items-center gap-2">
            {confidence !== null && (
              <div className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border ${
                confidence >= 0.8
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                  : confidence >= 0.5
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-copper-700 dark:text-copper-400 border-copper-200 dark:border-copper-800/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                <span>Confidence: {Math.round(confidence * 100)}%</span>
              </div>
            )}
            
            {citations.length > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-[#1F2430] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#2B3245]">
                {citations.length} {citations.length === 1 ? 'Source' : 'Sources'}
              </span>
            )}
          </div>
        </div>

        {/* Inner Content Area */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Error Alert State */}
          {isError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Execution Failed</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">{message.content}</p>
              </div>
            </div>
          )}

          {/* Insufficient Evidence Warning Banner */}
          {isInsufficient && !isError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-copper-300 dark:border-copper-700/50 rounded-lg flex items-start gap-2.5 text-slate-900 dark:text-slate-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-copper-600 dark:text-copper-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-copper-700 dark:text-copper-400">Insufficient Evidence in Indexed Documents</p>
                <p className="text-[11px] mt-0.5 leading-relaxed text-slate-600 dark:text-slate-300">
                  The available statutory reports do not contain conclusive data to address this inquiry with high certainty. Consider uploading relevant subsidiary circulars or expanding query scope.
                </p>
              </div>
            </div>
          )}

          {/* Deterministic Mathematical Calculation Card */}
          {calculation && (
            <div className="p-3.5 bg-slate-50 dark:bg-[#0E121A] border border-slate-200 dark:border-[#2B3245] rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2B3245] pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Calculator className="w-4 h-4 text-copper-500" />
                  <span>Deterministic Operational Computation</span>
                </div>
                {calculation.metric && (
                  <span className="text-[10px] font-mono uppercase bg-copper-500/10 text-copper-600 dark:text-copper-400 px-2 py-0.5 rounded font-semibold">
                    {calculation.metric}
                  </span>
                )}
              </div>

              {calculation.formula && (
                <div className="font-mono text-[11px] p-2 bg-white dark:bg-[#161B26] border border-slate-200 dark:border-[#2B3245] rounded text-slate-800 dark:text-[#E2E8F0] break-words">
                  <span className="text-slate-400 mr-1.5">Formula:</span>
                  {calculation.formula}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {calculation.currentValue !== undefined && (
                  <div className="p-2 rounded bg-white dark:bg-[#161B26] border border-slate-200 dark:border-[#2B3245]">
                    <div className="text-[10px] text-slate-400">Current Value</div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {calculation.currentValue} {calculation.unit || ''}
                    </div>
                  </div>
                )}
                {calculation.comparisonValue !== undefined && (
                  <div className="p-2 rounded bg-white dark:bg-[#161B26] border border-slate-200 dark:border-[#2B3245]">
                    <div className="text-[10px] text-slate-400">Comparison Target</div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {calculation.comparisonValue} {calculation.unit || ''}
                    </div>
                  </div>
                )}
                {calculation.variance !== undefined && (
                  <div className="p-2 rounded bg-white dark:bg-[#161B26] border border-slate-200 dark:border-[#2B3245]">
                    <div className="text-[10px] text-slate-400">Variance</div>
                    <div className={`text-xs font-bold font-mono ${
                      calculation.variance < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {calculation.variance > 0 ? `+${calculation.variance}` : calculation.variance} {calculation.unit || ''}
                    </div>
                  </div>
                )}
                {calculation.achievementRate !== undefined && (
                  <div className="p-2 rounded bg-white dark:bg-[#161B26] border border-slate-200 dark:border-[#2B3245]">
                    <div className="text-[10px] text-slate-400">Achievement Rate</div>
                    <div className="text-xs font-bold font-mono text-copper-600 dark:text-copper-400">
                      {calculation.achievementRate}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Executive Answer Body */}
          <div className="prose dark:prose-invert max-w-none prose-sm leading-relaxed text-xs sm:text-sm text-slate-800 dark:text-[#CBD5E1] break-words">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
              components={{
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-3 border border-slate-200 dark:border-[#2B3245] rounded-lg">
                    <table className="w-full text-left border-collapse text-xs" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => (
                  <thead className="bg-slate-50 dark:bg-[#0E121A] text-slate-700 dark:text-[#94A3B8] border-b border-slate-200 dark:border-[#2B3245]" {...props} />
                ),
                th: ({node, ...props}) => (
                  <th className="px-3 py-2 font-semibold text-[11px] uppercase tracking-wider" {...props} />
                ),
                td: ({node, ...props}) => (
                  <td className="px-3 py-2 border-b border-slate-100 dark:border-[#2B3245]/60 text-xs" {...props} />
                ),
                code: ({node, inline, children, ...props}) => (
                  <code className={`${inline ? 'bg-slate-100 dark:bg-[#1F2430] text-copper-600 dark:text-copper-400 px-1 py-0.5 rounded font-mono text-[11px]' : 'block bg-slate-50 dark:bg-[#0E121A] p-2.5 rounded font-mono text-xs border border-slate-200 dark:border-[#2B3245]'}`} {...props}>
                    {children}
                  </code>
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Citations & Evidence Panel */}
          {!isError && citations.length > 0 && (
            <div className="border-t border-slate-200 dark:border-[#2B3245] pt-3 mt-4">
              <button
                onClick={() => setSourcesOpen(!sourcesOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-[#94A3B8] hover:text-copper-600 dark:hover:text-white transition-colors mb-2.5"
              >
                {sourcesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Shield className="w-3.5 h-3.5 text-copper-500" />
                <span>Verified Evidence Sources ({citations.length})</span>
              </button>

              {sourcesOpen && (
                <div className="grid grid-cols-1 gap-2">
                  {citations.map((src, i) => {
                    const docName = src.documentName || src.documentId?.originalName || src.documentId?.filename || src.title || 'Mining Record';
                    const page = src.pageNumber !== undefined && src.pageNumber !== null ? `Page ${src.pageNumber}` : null;
                    const matchPct = src.similarity ? Math.round(src.similarity * 100) : (src.confidence ? Math.round(src.confidence * 100) : null);
                    const snippet = src.snippet || src.excerpt || src.text || (typeof src.content === 'string' ? src.content.substring(0, 180) : '');

                    return (
                      <div 
                        key={i} 
                        className="p-2.5 bg-slate-50 dark:bg-[#0E121A] border border-slate-200 dark:border-[#2B3245] rounded-lg text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-[#F1F5F9] truncate">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{docName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {page && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#1F2430] text-slate-700 dark:text-[#CBD5E1] text-[10px] font-mono">
                                {page}
                              </span>
                            )}
                            {matchPct && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-semibold">
                                {matchPct}% Match
                              </span>
                            )}
                          </div>
                        </div>

                        {snippet && (
                          <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] leading-relaxed line-clamp-2 italic">
                            "{snippet}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default MessageBubble;
