import React from 'react';
import { ExternalLink, CheckCircle2, Globe, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface WfolioBadgeProps {
  url?: string;
  password?: string;
  status?: string;
  clientName?: string;
  compact?: boolean;
}

export const WfolioBadge: React.FC<WfolioBadgeProps> = ({
  url,
  password,
  status = 'published',
  clientName,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!url) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-500 text-xs">
        <Globe className="w-3.5 h-3.5 opacity-60" />
        <span>No wfolio link</span>
      </span>
    );
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <button
        onClick={handleOpen}
        title="Open wfolio Client Gallery"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-300 text-xs font-medium transition-colors"
      >
        <Globe className="w-3.5 h-3.5 text-indigo-400" />
        <span>wfolio Gallery</span>
        <ExternalLink className="w-3 h-3 text-indigo-400" />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-black border border-indigo-800/40">
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
          <Globe className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="truncate">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-indigo-200">wfolio Client Gallery</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-400 border border-emerald-700/50">
              Live
            </span>
          </div>
          <p className="text-xs text-zinc-400 truncate mt-0.5">{url}</p>
          {password && (
            <p className="text-[11px] text-zinc-400 mt-0.5">PIN: <code className="text-indigo-300 font-mono">{password}</code></p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          title="Copy Link"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>

        <button
          onClick={handleOpen}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow-blue transition-all"
        >
          <span>Open</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
