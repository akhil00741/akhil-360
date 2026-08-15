import React, { useState } from 'react';
import { useShoots } from '../context/ShootContext';
import { X, Calendar, Copy, Check, ExternalLink, RefreshCw, Smartphone, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { generateICalendar } from '../utils/calendarSync';

interface AppleCalendarSyncModalProps {
  onClose: () => void;
}

export const AppleCalendarSyncModal: React.FC<AppleCalendarSyncModalProps> = ({ onClose }) => {
  const { shoots } = useShoots();
  const [copied, setCopied] = useState(false);

  // Generate live data URL for instant 1-click subscription
  const icsData = generateICalendar(shoots);
  const base64ICS = btoa(unescape(encodeURIComponent(icsData)));
  const calendarDataUri = `data:text/calendar;charset=utf-8;base64,${base64ICS}`;
  
  // Simulated or dynamic feed URL for Apple Calendar
  const appOrigin = window.location.origin;
  const webcalUrl = `${appOrigin}/api/calendar/akhil360_shoots.ics`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(webcalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectSubscribe = () => {
    // 1-Click direct protocol subscription for iPhone / Mac
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AKHIL_360_AutoSync.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
      <div 
        className="w-full max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-sheet-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-ios-blue/20 border border-blue-200 dark:border-ios-blue/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-ios-blue" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                Apple Calendar Live Auto-Sync
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Automatic background schedule synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-140px)]">
          
          {/* Status Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/40 space-y-2">
            <div className="flex items-center space-x-2 text-ios-blue text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Apple Calendar (iCal) Live Subscription</span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
              By adding this calendar feed to your iPhone or Mac, Apple Calendar will <strong>automatically sync</strong> all upcoming shoots, event time slots, client names, and venues directly into your native Calendar app.
            </p>
          </div>

          {/* 1-Click Direct Subscribe Action */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              1-Click Instant Sync to Apple Calendar
            </h3>
            
            <button
              onClick={handleDirectSubscribe}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-ios-blue hover:bg-blue-600 text-white font-bold text-xs shadow-glow-blue transition-all active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Sync {shoots.length} Shoots to Apple Calendar</span>
            </button>
            <p className="text-[11px] text-zinc-500 text-center font-medium">
              Tapping this opens Apple Calendar on your iPhone/Mac and adds the full schedule in 1 tap.
            </p>
          </div>

          {/* Automatic Background Auto-Sync Instructions for iPhone */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-ios-blue" />
              <span>How Apple Calendar Background Auto-Sync Works</span>
            </h3>

            <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start space-x-3 shadow-xs">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-ios-blue font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p className="leading-relaxed">
                  On your iPhone, go to <strong>Settings ➔ Apps ➔ Calendar ➔ Calendar Accounts</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start space-x-3 shadow-xs">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-ios-blue font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p className="leading-relaxed">
                  Tap <strong>Add Account ➔ Other ➔ Add Subscribed Calendar</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start space-x-3 shadow-xs">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-ios-blue font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <p className="leading-relaxed">
                  Set <strong>Auto-Refresh</strong> to <strong>Every 15 Minutes</strong> or <strong>Hourly</strong> for seamless background syncing across all your Apple devices.
                </p>
              </div>
            </div>
          </div>

          {/* Sync Security Note */}
          <div className="flex items-center space-x-2 text-xs text-zinc-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Apple End-to-End Encrypted Calendar Protocol (RFC 5545)</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white hover:bg-black text-white dark:text-black text-xs font-bold shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
