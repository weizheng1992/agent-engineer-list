"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Code2, Users, Layers, Activity } from "lucide-react";

export default function Home() {
  const [requirement, setRequirement] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirement.trim()) return;
    // For Week 1 template: Redirect to a project space
    window.location.href = `/project/demo?req=${encodeURIComponent(requirement)}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-sm mb-4">
          <Bot className="w-4 h-4" />
          Multi-Agent Team Orchestrator
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-teal-400">
          AI Software Team
        </h1>
        <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
          One prompt triggers a multi-role team: Architect, Developer, Tester, and Reviewer executing in safe sandboxes.
        </p>
      </header>

      <main className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur shadow-xl mb-12">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="req" className="block text-sm font-semibold text-slate-300 mb-2">
              What do you want the AI Software Team to build?
            </label>
            <textarea
              id="req"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="e.g. Build a memory-efficient LRU cache in TypeScript with comprehensive unit tests..."
              className="w-full h-32 bg-slate-950 border border-slate-800 focus:border-teal-500/50 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-teal-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Code2 className="w-5 h-5" />
            Launch Multi-Agent Cycle
          </button>
        </form>
      </main>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30">
          <div className="text-teal-400 mb-3"><Users className="w-6 h-6" /></div>
          <h3 className="font-bold text-slate-200 mb-1">Stateful LangGraph</h3>
          <p className="text-slate-400 text-sm">Dynamic state-sharing & routing between dedicated specialist agents.</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30">
          <div className="text-teal-400 mb-3"><Layers className="w-6 h-6" /></div>
          <h3 className="font-bold text-slate-200 mb-1">Safe Sandboxes</h3>
          <p className="text-slate-400 text-sm">Automated code runs securely inside isolated sandboxed execution areas.</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30">
          <div className="text-teal-400 mb-3"><Activity className="w-6 h-6" /></div>
          <h3 className="font-bold text-slate-200 mb-1">Real-time Stream</h3>
          <p className="text-slate-400 text-sm">Stream intermediate outputs and agent timelines seamlessly with SSE.</p>
        </div>
      </section>
    </div>
  );
}
