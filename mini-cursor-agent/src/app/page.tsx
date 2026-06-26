'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Send,
  FileText,
  CheckCircle,
  Activity,
  Cpu,
  Layers,
  Loader2,
  RefreshCw,
  Code,
  FileCode,
  ArrowRight,
  Database,
  Search,
  Settings,
  HelpCircle,
  MessageSquare,
  AlertCircle,
  Compass,
  ExternalLink
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ReActStep {
  type: 'plan' | 'execute' | 'verify';
  message: string;
  timestamp: string;
}

function useChat({ api }: { api: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [data, setData] = useState<ReActStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rawLogs, setRawLogs] = useState<string[]>([]);

  const append = async (userMessage: Message) => {
    setIsLoading(true);
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Reset current telemetry and console
    setData([]);
    setRawLogs([]);

    // CRITICAL FIX: Filter out the greeting message from the payload sent to the API.
    // OpenAI/Gemini APIs strictly require the chat history to start with a 'user' or 'system' message.
    // Starting with an 'assistant' message causes local proxy gateways to misparse, drop system instructions, or fail.
    const messagesToSend = updatedMessages.filter((msg, index) => {
      if (msg.role === 'assistant' && index === 0) {
        return false;
      }
      return true;
    });

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesToSend }) // Sends clean, standard role history
      });

      if (!response.body) {
        throw new Error("No response body received from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiContent = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            // Log raw chunk stream
            setRawLogs((prev) => [...prev, line]);

            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;

            const prefix = line.slice(0, colonIndex);
            const payloadStr = line.slice(colonIndex + 1);

            if (prefix === '0') {
              try {
                const textChunk = JSON.parse(payloadStr);
                if (typeof textChunk === 'string') {
                  aiContent += textChunk;
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated.length > 0) {
                      updated[updated.length - 1] = { role: 'assistant', content: aiContent };
                    }
                    return updated;
                  });
                }
              } catch (e) {}
            } else if (prefix === '8' || prefix === '2' || prefix === 'e') {
              try {
                const parsed = JSON.parse(payloadStr);
                const packets = Array.isArray(parsed) ? parsed : [parsed];
                
                packets.forEach((packet) => {
                  if (packet && typeof packet === 'object' && ('type' in packet) && ('message' in packet)) {
                    setData((prev) => {
                      if (prev.some(item => item.message === packet.message && item.type === packet.type)) {
                        return prev;
                      }
                      return [...prev, packet as ReActStep];
                    });
                  }
                });
              } catch (e) {}
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error communicating with agent runtime: ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, data, isLoading, append, rawLogs, setMessages, setData, setRawLogs };
}

export default function Home() {
  const { messages, data, isLoading, append, rawLogs, setMessages, setData, setRawLogs } = useChat({
    api: '/api/chat',
  });

  const [input, setInput] = useState('');
  const [activeSession, setActiveSession] = useState('Session 1');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rawLogs]);

  // Pure welcome screen on the UI (no system-message pollution to payload)
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `👋 Hello! I am your Mini Cursor Agent.

I can help you explore, write, and analyze code in this workspace using Model Context Protocol (MCP) tools.

What would you like to build or analyze today?`
      }
    ]);
  }, [setMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    append({ role: 'user', content: input });
    setInput('');
  };

  const getAgentStatus = () => {
    if (!isLoading) return { label: 'IDLE', color: 'bg-slate-500 text-slate-100 border-slate-600', pingColor: 'bg-slate-400' };
    if (data.length === 0) return { label: 'THINKING', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', pingColor: 'bg-amber-400' };
    
    const lastStep = data[data.length - 1];
    if (lastStep.type === 'plan') {
      return { label: 'PLANNING', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', pingColor: 'bg-yellow-400' };
    }
    if (lastStep.type === 'execute') {
      return { label: 'EXECUTING MCP TOOL', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', pingColor: 'bg-purple-400' };
    }
    if (lastStep.type === 'verify') {
      return { label: 'VERIFYING OUTCOME', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', pingColor: 'bg-emerald-400' };
    }
    
    return { label: 'PROCESSING', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', pingColor: 'bg-blue-400' };
  };

  const status = getAgentStatus();

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* 1. SIDEBAR (240px) */}
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-4 border-b border-slate-800 flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-indigo-400 animate-pulse" />
            <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Mini Cursor
            </span>
          </div>

          <div className="p-3 space-y-1">
            <div className="text-xs font-semibold text-slate-500 px-3 py-2 uppercase tracking-wider">
              Recent Workspaces
            </div>
            <button
              onClick={() => setActiveSession('Session 1')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center space-x-2 transition-all ${
                activeSession === 'Session 1'
                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Workspace Analyzer</span>
            </button>

            <a
              href="http://127.0.0.1:3002"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent group transition-all"
            >
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Context Engineering</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition" />
            </a>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Postgres: Connected</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>MCP Server: Active</span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW CONTROLLER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER */}
        <header className="h-14 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-sm font-semibold text-slate-200">Workspace Analyzer</h1>
            <span className="text-slate-600">/</span>
            <div className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-all ${status.color}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.pingColor}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${status.pingColor}`}></span>
              </span>
              <span>{status.label}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                setMessages([
                  { role: 'assistant', content: 'Workspace reset! How can I help you next?' }
                ]);
                setData([]);
                setRawLogs([]);
              }}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition"
              title="Reset Workspace"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* DUAL PANE WORKSPACE */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* LEFT PANEL: Chat Interface (60%) */}
          <div className="w-3/5 flex flex-col bg-slate-950 border-r border-slate-800/80 overflow-hidden">
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => {
                if (msg.role === 'system') {
                  return (
                    <div key={idx} className="flex justify-center">
                      <div className="bg-slate-900/40 border border-slate-800/60 text-slate-400 text-xs px-3 py-1 rounded-full flex items-center space-x-1.5">
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        <span>{msg.content}</span>
                      </div>
                    </div>
                  );
                }

                const isUser = msg.role === 'user';
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl p-4 text-sm shadow-md transition-all ${
                      isUser 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-900 border border-slate-800/60 text-slate-200 rounded-tl-none leading-relaxed'
                    }`}>
                      <div className="font-semibold text-xs opacity-60 mb-1">
                        {isUser ? 'You' : 'Mini Cursor Agent'}
                      </div>

                      {/* INLINE TOOL CALL BADGES FOR ACTIVE ASSISTANT TURN */}
                      {!isUser && idx === messages.length - 1 && data.some(s => s.type === 'execute') && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {data.filter(s => s.type === 'execute').map((step, sIdx) => {
                            const rawMsg = step.message;
                            let toolName = "local_mcp_tool";
                            if (rawMsg.includes('"read_file"')) toolName = "read_file";
                            if (rawMsg.includes('"write_file"')) toolName = "write_file";

                            return (
                              <div key={sIdx} className="inline-flex items-center space-x-2 bg-slate-950/90 border border-purple-500/40 text-purple-300 text-[10px] px-2.5 py-1 rounded-md font-mono shadow-sm">
                                <Terminal className="w-3 h-3 text-purple-400 animate-pulse" />
                                <span>🛠️ Called MCP Tool: </span>
                                <strong className="text-purple-100 bg-purple-500/20 px-1 py-0.5 rounded">{toolName}</strong>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="whitespace-pre-wrap select-text selection:bg-indigo-500 selection:text-white">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800/60 text-slate-200 rounded-xl p-4 rounded-tl-none flex items-center space-x-3">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="text-sm text-slate-400">Thinking and reasoning...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-900 bg-slate-900/20 shrink-0">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  placeholder={isLoading ? "Agent is busy executing..." : "Ask standard questions or execute file analysis..."}
                  className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500 rounded-lg pl-4 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
                <button 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-md text-white transition disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT PANEL: Agent Telemetry (40%) */}
          <div className="w-2/5 flex flex-col bg-slate-900/30 overflow-hidden">
            
            <div className="flex-1 flex flex-col p-6 overflow-hidden min-h-0">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold text-slate-200">ReAct Executing Trace</h2>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">PLAN → EXECUTE → VERIFY</span>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {data.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 p-4 text-center">
                    <Activity className="w-8 h-8 opacity-40 animate-pulse text-indigo-500" />
                    <p className="text-xs">No active telemetry steps.</p>
                    <p className="text-[10px] opacity-75">Send a message to see the ReAct pipeline trace.</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-800 ml-3.5 space-y-6">
                    {data.map((step, idx) => {
                      let iconColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                      let stepIcon = <Search className="w-4 h-4" />;
                      let accentColor = 'border-yellow-500/30 bg-yellow-500/5';
                      
                      if (step.type === 'execute') {
                        iconColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                        stepIcon = <Terminal className="w-4 h-4" />;
                        accentColor = 'border-purple-500/30 bg-purple-500/5';
                      } else if (step.type === 'verify') {
                        iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                        stepIcon = <CheckCircle className="w-4 h-4" />;
                        accentColor = 'border-emerald-500/30 bg-emerald-500/5';
                      }

                      return (
                        <div key={idx} className="relative pl-6 group">
                          <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border flex items-center justify-center shadow-sm ${iconColor}`}>
                            {stepIcon}
                          </div>
                          
                          <div className={`p-3 rounded-lg border shadow-sm space-y-2 ${accentColor}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                                {step.type}
                              </span>
                              <span className="text-[9px] font-mono opacity-40">
                                {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 font-medium leading-relaxed">
                              {step.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RAW CONSOLE LOGGER */}
            <div className="h-1/3 border-t border-slate-800 bg-slate-950/80 p-4 flex flex-col overflow-hidden shrink-0">
              <div className="flex items-center justify-between pb-2 shrink-0">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Raw MCP JSON-RPC Stream</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-500">sse-data</span>
              </div>
              <div className="flex-1 bg-black/40 border border-slate-900 rounded p-2.5 font-mono text-[10px] text-emerald-400 overflow-y-auto space-y-1 select-text">
                {rawLogs.length === 0 ? (
                  <div className="text-slate-700 italic">Waiting for incoming SSE log streams...</div>
                ) : (
                  rawLogs.map((log, idx) => (
                    <div key={idx} className="break-all whitespace-pre-wrap leading-normal hover:bg-slate-900/50 px-1 py-0.5 rounded">
                      <span className="text-slate-600 select-none mr-2">[{idx + 1}]</span>
                      {log}
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
