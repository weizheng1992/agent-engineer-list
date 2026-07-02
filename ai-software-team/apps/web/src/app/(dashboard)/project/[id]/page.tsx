"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, RefreshCw, Terminal, CheckCircle } from "lucide-react";
import AgentTimeline, { TimelineEvent } from "@/components/AgentTimeline";
import MessageBubble from "@/components/MessageBubble";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ req?: string }>;
}

export default function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const { id } = use(params);
  const { req } = use(searchParams);
  const requirement = req || "No requirements provided";

  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // To avoid SSR hydration mismatch of dynamic Date/Time strings:
  const [messages, setMessages] = useState<Array<{ sender: string; content: string; timestamp: string }>>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setMessages([
      {
        sender: "Requirement",
        content: requirement,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, [requirement]);

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, timeline]);

  const handleStartPipeline = () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsFinished(false);

    // Dynamic timeline initialization
    const initialSteps: TimelineEvent[] = [
      { id: "1", agent: "Supervisor", status: "running", message: "Starting Multi-Agent routing flow", timestamp: new Date().toLocaleTimeString() },
      { id: "2", agent: "Architect", status: "pending", message: "Awaiting architectural input", timestamp: "-" },
      { id: "3", agent: "Developer", status: "pending", message: "Awaiting task completion", timestamp: "-" },
      { id: "4", agent: "Tester", status: "pending", message: "Awaiting workspace verification", timestamp: "-" },
      { id: "5", agent: "Reviewer", status: "pending", message: "Awaiting security checks", timestamp: "-" },
    ];
    setTimeline(initialSteps);

    // Call the SSE LangGraph stream API endpoint
    const eventSource = new EventSource(`/api/agent/stream?req=${encodeURIComponent(requirement)}`);

    eventSource.addEventListener("status", (e: any) => {
      const data = JSON.parse(e.data);
      console.log("Status update:", data.message);
    });

    eventSource.addEventListener("update", (e: any) => {
      const data = JSON.parse(e.data);
      console.log("Graph updates received:", data);

      const updateTimelineStatus = (agent: string, status: "completed" | "running", message: string) => {
        setTimeline(prev => prev.map(item => {
          if (item.agent === agent) {
            return { ...item, status, message, timestamp: new Date().toLocaleTimeString() };
          }
          return item;
        }));
      };

      // Transform raw LangGraph updates and dispatch messages/timeline changes
      if (data.supervisor) {
        updateTimelineStatus("Supervisor", "completed", "Supervisor finished workflow planning.");
        updateTimelineStatus("Architect", "running", "Analyzing requirements...");
        if (data.supervisor.messages) {
          setMessages(prev => [...prev, ...data.supervisor.messages]);
        }
      }
      if (data.architect) {
        updateTimelineStatus("Architect", "completed", "Architect produced design system.");
        updateTimelineStatus("Developer", "running", "Coding system logic...");
        if (data.architect.messages) {
          setMessages(prev => [...prev, ...data.architect.messages]);
        }
      }
      if (data.developer) {
        updateTimelineStatus("Developer", "completed", "Developer wrote source files.");
        updateTimelineStatus("Tester", "running", "Writing test cases...");
        if (data.developer.messages) {
          setMessages(prev => [...prev, ...data.developer.messages]);
        }
      }
      if (data.tester) {
        updateTimelineStatus("Tester", "completed", "Tester validated test suite.");
        updateTimelineStatus("Reviewer", "running", "Inspecting code quality...");
        if (data.tester.messages) {
          setMessages(prev => [...prev, ...data.tester.messages]);
        }
      }
      if (data.reviewer) {
        updateTimelineStatus("Reviewer", "completed", "Reviewer certified codebase.");
        if (data.reviewer.messages) {
          setMessages(prev => [...prev, ...data.reviewer.messages]);
        }
      }
    });

    eventSource.addEventListener("complete", () => {
      setIsRunning(false);
      setIsFinished(true);
      eventSource.close();
    });

    eventSource.addEventListener("error", (e: any) => {
      console.error("SSE stream error:", e);
      setIsRunning(false);
      eventSource.close();
    });
  };

  // Prevent SSR render completely until mounted to avoid hydration errors on dynamic dates/time strings
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-bold text-slate-200">Session ID: {id}</h2>
            <p className="text-xs text-slate-500">Workspace / projects / {id}</p>
          </div>
        </div>

        <div>
          {!isFinished ? (
            <button
              onClick={handleStartPipeline}
              disabled={isRunning}
              className={`px-4 py-2 rounded-lg font-bold text-sm cursor-pointer flex items-center gap-2 transition-all ${
                isRunning
                  ? "bg-slate-800 text-slate-500 border border-slate-700"
                  : "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/10"
              }`}
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {isRunning ? "Running Pipeline..." : "Start Agent Run"}
            </button>
          ) : (
            <div className="px-4 py-2 rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-400 font-bold text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Complete
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace split panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        {/* Left column: Logs & Chat history */}
        <div className="lg:col-span-2 flex flex-col border-r border-slate-800 bg-slate-950/30 overflow-y-auto">
          <div className="p-4 border-b border-slate-800 bg-slate-900/10 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-teal-400" />
            Live Team Log Stream
          </div>

          <div className="flex-1 p-6 space-y-6">
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                sender={msg.sender}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Right column: Timelines & Outputs */}
        <div className="p-6 bg-slate-950/50 space-y-6 overflow-y-auto">
          <AgentTimeline events={timeline} />

          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 backdrop-blur">
            <h3 className="text-sm font-bold text-slate-200 mb-3">Workspace Context</h3>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span>Model Orchestrator</span>
                <span className="text-teal-400 font-mono">LangGraph stateful</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span>Next.js Version</span>
                <span className="text-slate-300 font-mono">v15.1.0 (App Router)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span>Safe Sandbox</span>
                <span className="text-slate-300 font-mono">E2B Sandbox Ready</span>
              </div>
              <div className="flex justify-between">
                <span>Monorepo Scope</span>
                <span className="text-slate-300 font-mono">Turborepo Workspace</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
