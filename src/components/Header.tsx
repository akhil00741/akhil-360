import React from 'react';
import { useShoots } from '../context/useShoots';
import { Plus, Camera, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  onOpenAppleSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAppleSync }) => {
  const { setIsCreateModalOpen } = useShoots();
  const todayLabel = format(new Date(), 'EEE, dd MMM yyyy');

  return (
    <header className="sticky top-0 z-30 ios-glass-header px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1F1A17] shadow-ios ring-1 ring-black/5">
            <Camera className="h-5 w-5 text-white stroke-[2.4]" />
            <span className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#C9440A]" />
          </div>
          <div className="min-w-0">
            <h1 className="flex items-center gap-1 text-[17px] sm:text-xl font-extrabold tracking-normal text-zinc-950 whitespace-nowrap leading-tight">
              AKHIL <span className="text-[#C9440A]">360</span>
            </h1>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] sm:text-xs text-zinc-500 font-bold leading-none truncate">
              <Calendar className="h-3 w-3 text-[#C9440A]" />
              <span>{todayLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onOpenAppleSync}
            title="Apple Calendar"
            className="hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-extrabold text-zinc-800 shadow-2xs transition-all hover:bg-zinc-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#C9440A]/25"
          >
            <Calendar className="h-4 w-4 text-[#C9440A]" />
            <span className="hidden lg:inline">Calendar</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex min-h-[44px] min-w-[108px] items-center justify-center gap-1.5 rounded-2xl bg-[#B83A08] px-3.5 py-2 text-xs font-extrabold text-white shadow-glow-blue ring-1 ring-[#923006]/20 transition-all hover:bg-[#923006] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#B83A08]/35 sm:px-4"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New Shoot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
