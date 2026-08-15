import React from 'react';
import { useShoots } from '../context/ShootContext';
import { LayoutDashboard, FolderKanban, CalendarDays, Hourglass, BarChart3 } from 'lucide-react';
import { ViewTab } from '../types/shoot';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, metrics } = useShoots();

  const tabs: { id: ViewTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'registry', label: 'Shoots', icon: FolderKanban, badge: metrics.upcomingCount },
    { id: 'calendar', label: 'Schedule', icon: CalendarDays },
    { id: 'storage', label: '30d Purge', icon: Hourglass, badge: metrics.criticalClearanceCount },
    { id: 'analytics', label: 'Revenue', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 ios-glass border-t border-zinc-200/80 dark:border-white/10 safe-bottom transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5 sm:py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 transition-all duration-200 relative group ${
                isActive ? 'text-ios-blue' : 'text-zinc-400 dark:text-ios-gray hover:text-zinc-700 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full border border-white dark:border-black animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </div>

              <span className={`text-[11px] mt-1 font-semibold tracking-tight ${isActive ? 'font-bold text-ios-blue' : ''}`}>
                {tab.label}
              </span>

              {isActive && (
                <span className="w-1 h-1 rounded-full bg-ios-blue mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
