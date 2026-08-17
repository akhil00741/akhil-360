import React, { useState } from 'react';
import { useShoots } from '../context/useShoots';
import { X, Calendar, Copy, Check, Smartphone, ShieldCheck, Sparkles, Download } from 'lucide-react';
import { generateICalendar } from '../utils/calendarSync';

interface AppleCalendarSyncModalProps {
  onClose: () => void;
}

export const AppleCalendarSyncModal: React.FC<AppleCalendarSyncModalProps> = ({ onClose }) => {
  const { shoots } = useShoots();
  const [copied, setCopied] = useState(false);

  const icsData = generateICalendar(shoots);
  const calendarFeedUrl = `https://akhil00741.github.io/akhil-360/calendar.ics`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(calendarFeedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectSync = () => {
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AKHIL_360_Shoots.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/35 backdrop-blur-xs">
      <div 
        className="w-full max-w-xl bg-white border border-zinc-200/90 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-sheet-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grabber Pill */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-300 mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-ios-blue" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">
                Apple Calendar Sync
              </h2>
              <p className="text-xs text-zinc-500 font-medium">Add your photography shoots to iPhone Calendar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-130px)]">
          
          {/* Method 1: Instant 1-Tap Sync (Recommended) */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2.5">
            <div className="flex items-center space-x-2 text-ios-blue text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Recommended: 1-Tap Direct Sync to iPhone</span>
            </div>
            <p className="text-xs text-zinc-700 leading-relaxed font-medium">
              Tap the button below. iPhone Safari will immediately prompt you to <strong>"Add All Events to Calendar"</strong>.
            </p>
            
            <button
              onClick={handleDirectSync}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-ios-blue hover:bg-blue-600 text-white font-bold text-xs shadow-glow-blue transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Sync {shoots.length} Shoots to Apple Calendar</span>
            </button>
          </div>

          {/* Method 2: iPhone Subscribed Calendar Feed */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-zinc-600" />
              <span>Subscribed Calendar Feed URL</span>
            </h3>

            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              If adding as a background subscribed calendar in iPhone Settings, use this exact calendar file URL:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={calendarFeedUrl}
                className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-800 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white border border-zinc-200 space-y-1.5 text-xs text-zinc-600">
              <p className="font-bold text-zinc-800">iPhone Settings Path:</p>
              <p><strong>Settings ➔ Apps ➔ Calendar ➔ Calendar Accounts ➔ Add Account ➔ Other ➔ Add Subscribed Calendar</strong> ➔ Paste this URL.</p>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-center space-x-2 text-xs text-zinc-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Apple End-to-End Encrypted Calendar Protocol (RFC 5545)</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-white flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
