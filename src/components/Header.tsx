import React from 'react';
import { useShoots } from '../context/ShootContext';
import { Plus, Camera, AlertCircle, Sun, Moon, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

interface HeaderProps {
  onOpenAppleSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAppleSync }) => {
  const { setIsCreateModalOpen, metrics, theme, toggleTheme } = useShoots();

  return (
    <header className="sticky top-0 z-30 ios-glass-header px-4 py-3 sm:px-6 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-ios-blue via-ios-indigo to-ios-purple p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-black/90 rounded-[14px] flex items-center justify-center">
                <Camera className="w-5 h-5 text-ios-blue dark:text-white" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-black rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1">
                AKHIL <span className="bg-gradient-to-r from-ios-blue via-ios-indigo to-ios-purple bg-clip-text text-transparent">360</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-ios-blue/15 text-ios-blue dark:text-ios-teal border border-blue-200 dark:border-ios-blue/30">
                PRO STUDIO
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-ios-gray font-medium">
              {metrics.totalShoots} Shoots • {formatCurrency(metrics.totalRevenue)} Revenue
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          
          {/* Apple Calendar Quick Auto-Sync */}
          <button
            onClick={onOpenAppleSync}
            title="Apple Calendar Live Auto-Sync"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-xs transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-ios-blue" />
            <span className="hidden sm:inline">Apple Cal Sync</span>
            <span className="sm:hidden">Cal</span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-zinc-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Critical Purge Warning Pill */}
          {metrics.criticalClearanceCount > 0 && (
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-red-950/60 border border-rose-200 dark:border-red-800/80 text-rose-600 dark:text-red-300 text-xs font-semibold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>{metrics.criticalClearanceCount} Due</span>
            </div>
          )}

          {/* New Shoot Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-ios-blue hover:bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-glow-blue transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Shoot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
