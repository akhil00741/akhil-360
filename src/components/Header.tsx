import React from 'react';
import { useShoots } from '../context/ShootContext';
import { Plus, Camera, AlertCircle, Sun, Moon, Calendar, Sparkles } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

interface HeaderProps {
  onOpenAppleSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAppleSync }) => {
  const { setIsCreateModalOpen, metrics, theme, toggleTheme } = useShoots();

  return (
    <header className="sticky top-0 z-30 ios-glass-header px-4 py-3 sm:px-6 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Left Branding - Luxury Studio Crest */}
        <div className="flex items-center space-x-3.5">
          <div className="relative group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-zinc-900 via-blue-950 to-black dark:from-zinc-800 dark:to-zinc-950 p-[1.5px] shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-white dark:bg-[#121214] rounded-[14px] flex items-center justify-center">
                <Camera className="w-5 h-5 text-ios-blue dark:text-cyan-400 stroke-[2.2]" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#0A0A0C] rounded-full shadow-xs"></span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white flex items-center gap-1.5 font-sans">
                AKHIL <span className="bg-gradient-to-r from-[#0066FF] via-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">360</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-blue-50/80 dark:bg-ios-blue/15 text-[#0066FF] dark:text-cyan-400 border border-blue-200/80 dark:border-ios-blue/30 shadow-2xs">
                STUDIO PRO
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <span>{metrics.totalShoots} Registered</span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{formatCurrency(metrics.totalRevenue)} Billed</span>
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          
          {/* Apple Calendar Quick Auto-Sync */}
          <button
            onClick={onOpenAppleSync}
            title="Apple Calendar Live Auto-Sync"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#16161A] hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs transition-all active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-ios-blue" />
            <span className="hidden sm:inline">Apple Cal Sync</span>
            <span className="sm:hidden">Cal</span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-[#16161A] hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-2xs"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-zinc-700 stroke-[2.2]" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
            )}
          </button>

          {/* Critical Purge Warning Pill */}
          {metrics.criticalClearanceCount > 0 && (
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-red-950/60 border border-rose-200 dark:border-red-800/80 text-rose-600 dark:text-red-300 text-xs font-extrabold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>{metrics.criticalClearanceCount} Due</span>
            </div>
          )}

          {/* New Shoot Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0066FF] to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-xs sm:text-sm font-bold shadow-glow-blue transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Shoot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
