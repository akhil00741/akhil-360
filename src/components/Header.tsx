import React from 'react';
import { useShoots } from '../context/ShootContext';
import { Plus, Camera, Calendar, RefreshCw, Cloud } from 'lucide-react';

interface HeaderProps {
  onOpenAppleSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAppleSync }) => {
  const { setIsCreateModalOpen, isSyncing, triggerSync } = useShoots();

  return (
    <header className="sticky top-0 z-30 ios-glass-header px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Left Branding - Clean & Elegant */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs">
            <Camera className="w-4 h-4 text-ios-blue stroke-[2.4]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-zinc-900 flex items-center gap-1">
              AKHIL <span className="text-ios-blue">360</span>
            </h1>
            <p className="text-[11px] text-zinc-500 font-medium leading-none">
              Photography Studio
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          
          {/* Real-time Cloud Sync Button */}
          <button
            onClick={() => triggerSync()}
            title="Real-Time Worldwide Studio Sync (US & India)"
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 shadow-2xs transition-all active:scale-95 disabled:opacity-70"
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-ios-blue animate-spin" />
            ) : (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <Cloud className="w-3.5 h-3.5 text-zinc-500" />
              </div>
            )}
            <span className="hidden sm:inline text-[11px]">
              {isSyncing ? 'Syncing...' : 'Cloud Live'}
            </span>
          </button>

          {/* Apple Calendar Quick Sync Icon */}
          <button
            onClick={onOpenAppleSync}
            title="Apple Calendar Live Auto-Sync"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 shadow-2xs transition-all active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-ios-blue" />
            <span className="hidden sm:inline">Apple Cal</span>
          </button>

          {/* New Shoot Primary Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-ios-blue hover:bg-blue-600 text-white text-xs font-bold shadow-glow-blue transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Shoot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
