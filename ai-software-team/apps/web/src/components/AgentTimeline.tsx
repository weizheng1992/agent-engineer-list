import React from "react";
import { CheckCircle2, Circle, AlertCircle, RefreshCw } from "lucide-react";

export interface TimelineEvent {
  id: string;
  agent: string;
  status: "pending" | "running" | "completed" | "failed";
  message: string;
  timestamp: string;
}

interface AgentTimelineProps {
  events: TimelineEvent[];
}

export default function AgentTimeline({ events }: AgentTimelineProps) {
  return (
    <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 backdrop-blur">
      <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-4 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
        Agent Execution Pipeline
      </h3>

      <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-6">
        {events.length === 0 ? (
          <p className="text-slate-500 text-sm">Waiting for pipeline flow signals...</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="relative">
              <span className="absolute -left-[31px] bg-slate-950 p-1 rounded-full">
                {event.status === "completed" && (
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                )}
                {event.status === "running" && (
                  <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                )}
                {event.status === "failed" && (
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                )}
                {event.status === "pending" && (
                  <Circle className="w-5 h-5 text-slate-700" />
                )}
              </span>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{event.agent}</span>
                  <span className="text-xs text-slate-500">{event.timestamp}</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">{event.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
