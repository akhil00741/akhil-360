import React, { useState } from 'react';
import { useShoots } from '../context/ShootContext';
import { 
  Shield, Hourglass, CheckCircle2, 
  Trash2, HardDrive, MessageSquare, 
  Clock, Sparkles, ChevronRight 
} from 'lucide-react';
import { formatCurrency, formatDate, calculateRetentionStatus } from '../utils/helpers';
import { WfolioBadge } from './WfolioBadge';
import { Shoot } from '../types/shoot';

export const DataRetentionView: React.FC = () => {
  const { shoots, setSelectedShoot, setReminderModalShoot, markDataCleared } = useShoots();
  const [filterType, setFilterType] = useState<'active' | 'critical' | 'cleared' | 'all'>('active');

  const deliveredShoots = shoots.filter(s => !!s.deliveredAt);

  const retentionItems = deliveredShoots.map(shoot => ({
    shoot,
    retention: calculateRetentionStatus(shoot)!,
  }));

  const filteredItems = retentionItems.filter(({ shoot, retention }) => {
    if (filterType === 'active') return !shoot.isDataCleared;
    if (filterType === 'critical') return !shoot.isDataCleared && (retention.isExpired || retention.daysLeft <= 7);
    if (filterType === 'cleared') return shoot.isDataCleared;
    return true;
  });

  const totalHeldStorageGb = deliveredShoots
    .filter(s => !s.isDataCleared)
    .reduce((sum, s) => sum + (s.rawFilesSizeGb || 100), 0);

  const activeHoldCount = deliveredShoots.filter(s => !s.isDataCleared).length;
  const criticalCount = deliveredShoots.filter(s => !s.isDataCleared && (calculateRetentionStatus(s)?.daysLeft || 0) <= 7).length;
  const clearedCount = deliveredShoots.filter(s => s.isDataCleared).length;

  const handleClearData = (shoot: Shoot) => {
    const confirmText = `Are you sure you want to mark RAW files as CLEARED from your storage drive (${shoot.storageDevice || 'SSD'}) for "${shoot.title}"?`;
    if (confirm(confirmText)) {
      markDataCleared(shoot.id, shoot.storageDevice);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Top Banner: 30-Day Policy Overview */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-950/40 dark:via-zinc-900/80 dark:to-black border border-amber-200 dark:border-amber-900/40 shadow-ios space-y-4 transition-colors">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Hourglass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              30-Day Storage & Data Clearance Hub
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Photographer client delivery policy: 30 days backup hold before SD/SSD wipe.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-white dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Active Data Holds</span>
            <span className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-300">{activeHoldCount} Shoots</span>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Estimated SSD Space</span>
            <span className="text-lg font-extrabold font-mono text-zinc-900 dark:text-white">{totalHeldStorageGb} GB</span>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-black/50 border border-rose-200 dark:border-red-900/40 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-red-400 block">Clearance Due (&lt;7d)</span>
            <span className="text-lg font-extrabold font-mono text-rose-600 dark:text-red-400">{criticalCount} Critical</span>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-zinc-400 block">Safely Cleared</span>
            <span className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{clearedCount} Shoots</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'active', label: 'Active Holds (In 30d Window)', count: activeHoldCount },
          { id: 'critical', label: 'Critical Clearance (< 7 Days)', count: criticalCount },
          { id: 'cleared', label: 'Purged / Cleared', count: clearedCount },
          { id: 'all', label: 'All Delivered', count: deliveredShoots.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              filterType === tab.id
                ? 'bg-amber-500 text-black font-extrabold shadow-glow-amber'
                : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 shadow-xs'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              filterType === tab.id ? 'bg-black/20 text-black' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Shoots Retention Cards */}
      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map(({ shoot, retention }) => (
            <div
              key={shoot.id}
              className="ios-glass-card p-4 sm:p-5 rounded-3xl space-y-4 border-zinc-200/80 dark:border-zinc-800/80"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-ios-blue">{shoot.category}</span>
                    <span className="text-xs text-zinc-500">• Client: <strong className="text-zinc-800 dark:text-zinc-200">{shoot.clientName}</strong></span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5">
                    {shoot.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border font-mono ${retention.badgeColor}`}>
                    {retention.badgeText}
                  </span>
                </div>
              </div>

              {/* Progress & Countdown Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono font-medium">
                  <span>Delivered: {formatDate(shoot.deliveredAt)}</span>
                  <span>Purge Deadline: <strong className="text-zinc-900 dark:text-white">{retention.deadlineFormatted}</strong></span>
                </div>

                <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      shoot.isDataCleared
                        ? 'bg-zinc-400'
                        : retention.isExpired
                        ? 'bg-red-500 animate-pulse'
                        : retention.daysLeft <= 7
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${shoot.isDataCleared ? 100 : retention.progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
                  <span>Day 1</span>
                  <span>{shoot.isDataCleared ? 'Storage Cleared' : `${retention.daysLeft} days remaining of 30 days`}</span>
                  <span>Day 30</span>
                </div>
              </div>

              {/* wfolio Link & Storage Device */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                    wfolio Client Delivery
                  </label>
                  <WfolioBadge
                    url={shoot.wfolioUrl}
                    password={shoot.wfolioPassword}
                    status={shoot.wfolioStatus}
                    compact={true}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                    Storage Drive Location
                  </label>
                  <div className="flex items-center space-x-2 text-xs text-zinc-700 dark:text-zinc-300 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
                    <HardDrive className="w-4 h-4 text-ios-blue shrink-0" />
                    <span className="truncate font-semibold">{shoot.storageDevice || 'SanDisk Extreme SSD'}</span>
                    <span className="text-zinc-500 font-mono">({shoot.rawFilesSizeGb || 100} GB)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setReminderModalShoot(shoot)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-green transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Reminder Template</span>
                  </button>

                  <button
                    onClick={() => setSelectedShoot(shoot)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs font-bold"
                  >
                    View Details
                  </button>
                </div>

                {!shoot.isDataCleared ? (
                  <button
                    onClick={() => handleClearData(shoot)}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-glow-red transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Mark Data Cleared from SSD</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Cleared on {formatDate(shoot.dataClearedAt)}
                  </span>
                )}
              </div>

            </div>
          ))
        ) : (
          <div className="py-16 text-center space-y-2">
            <Shield className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-zinc-500">No shoots match the selected retention filter.</p>
          </div>
        )}
      </div>

    </div>
  );
};
