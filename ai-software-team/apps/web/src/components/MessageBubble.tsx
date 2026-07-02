import React from "react";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  sender: string;
  content: string;
  timestamp: string;
}

export default function MessageBubble({ sender, content, timestamp }: MessageBubbleProps) {
  const isUser = sender.toLowerCase() === "user" || sender.toLowerCase() === "requirement";

  return (
    <div className={`flex gap-3 max-w-2xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
        isUser
          ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
          : "bg-slate-800 border-slate-700 text-slate-300"
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`rounded-xl px-4 py-3 border text-sm ${
        isUser
          ? "bg-teal-950/20 border-teal-900/30 text-teal-100"
          : "bg-slate-900/80 border-slate-800 text-slate-200"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-xs text-slate-400">{sender}</span>
          <span className="text-[10px] text-slate-600">{timestamp}</span>
        </div>
        <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
