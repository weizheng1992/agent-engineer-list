'use client';

import React from 'react';
import {
  MessageSquare,
  Loader2,
  Terminal,
  Send,
  Activity
} from 'lucide-react';
import { i18n } from './i18n';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ReActStep {
  type: 'plan' | 'execute' | 'verify' | 'telemetry';
  message: string;
  timestamp: string;
}

interface AgentChatProps {
  lang: 'zh' | 'en';
  messages: Message[];
  chatInput: string;
  setInput: (val: string) => void;
  chatLoading: boolean;
  reactSteps: ReActStep[];
  handleChatSubmit: (e: React.FormEvent) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export const AgentChat: React.FC<AgentChatProps> = ({
  lang,
  messages,
  chatInput,
  setInput,
  chatLoading,
  reactSteps,
  handleChatSubmit,
  chatEndRef
}) => {
  const t = i18n[lang];

  return (
    <div className="w-[38%] bg-slate-950 border-r border-slate-800/80 flex flex-col overflow-hidden shrink-0">
      <header className="h-14 bg-slate-900/40 border-b border-slate-800 flex items-center px-4 shrink-0 justify-between select-none">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-slate-200">{t.interactiveAgent}</span>
        </div>
        {chatLoading ? (
          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse flex items-center space-x-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            <span>{t.running}</span>
          </span>
        ) : (
          <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-750 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {t.idle}
          </span>
        )}
      </header>

      {/* CHAT MESSAGES DISPLAY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-xl p-3.5 text-xs shadow-md leading-relaxed ${
                isUser
                  ? 'bg-cyan-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none'
              }`}>
                <div className="font-bold opacity-60 text-[9px] uppercase mb-1">
                  {isUser ? (lang === 'zh' ? '您' : 'You') : (lang === 'zh' ? '智能体' : 'Agent')}
                </div>

                {/* INTERACTIVE COMPILATION LOG BADGES */}
                {!isUser && idx === messages.length - 1 && reactSteps.some(s => s.type === 'execute') && (
                  <div className="mb-2.5 space-y-1">
                    {reactSteps.filter(s => s.type === 'execute').map((step, sIdx) => (
                      <div key={sIdx} className="inline-flex items-center space-x-1.5 bg-slate-950/90 border border-purple-500/40 text-purple-300 text-[9px] px-2 py-0.5 rounded font-mono shadow-sm">
                        <Terminal className="w-3 h-3 text-purple-400 animate-pulse" />
                        <span>{lang === 'zh' ? '🛠️ 触发本地 MCP Server: ' : '🛠️ Triggered MCP Server: '}</span>
                        <strong className="text-purple-100 bg-purple-500/20 px-1 rounded">read_file</strong>
                      </div>
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
              </div>
            </div>
          );
        })}

        {chatLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-850 text-slate-300 rounded-xl p-4 rounded-tl-none flex items-center space-x-3 text-xs">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>{t.thinkingContext}</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* REALTIME REACT PIPELINE TRACE */}
      <div className="h-[140px] border-t border-slate-800 bg-slate-950/60 p-3 flex flex-col overflow-hidden shrink-0">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 mb-1.5 pb-1 border-b border-slate-900">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{t.reactTraceTitle}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
          {reactSteps.length === 0 ? (
            <div className="text-slate-700 italic text-center py-6">{t.noTraceSignal}</div>
          ) : (
            reactSteps.map((step, idx) => {
              let badge = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
              if (step.type === 'execute') badge = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
              else if (step.type === 'verify') badge = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
              else if (step.type === 'telemetry') badge = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 animate-pulse';

              return (
                <div key={idx} className="p-1.5 rounded bg-slate-900/40 border border-slate-900 flex items-start space-x-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 ${badge}`}>
                    {step.type}
                  </span>
                  <span className="text-slate-300 leading-normal">{step.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT INPUT FORM */}
      <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-800 bg-slate-900/20 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setInput(e.target.value)}
            disabled={chatLoading}
            placeholder={chatLoading ? t.processing : t.inputPlaceholder}
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-cyan-500 rounded-lg pl-3 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50 transition"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="absolute right-1.5 p-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-md text-white transition shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
export default AgentChat;
