import React, { useState } from 'react';
import { useShoots } from '../context/ShootContext';
import { 
  Shield, Hourglass, CheckCircle2, 
  Trash2, HardDrive, MessageSquare, 
  Clock, Sparkles, ChevronRight, AlertCircle 
} from 'lucide-react';
import { formatCurrency, formatDate, calculateRetentionStatus } from '../utils/helpers';
import { WfolioBadge } from './WfolioBadge';
import { Shoot } from '../types/shoot';

export const DataRetentionView: React.FC = () => {
  const { shoots, setSelectedShoot, setReminderModalShoot, markDataCleared } = useShoots();
  const [filterType, setFilterType] = useState<'active' | 'critical' | 'cleared' | 'all'>('active');
  const [shootToClear, setShootToClear] = useState<Shoot | null>(null);

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

  const handleConfirmClear = () => {
    if (shootToClear) {
      markDataCleared(shootToClear.id, shootToClear.storageDevice);
      setShootToClear(null);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Top Banner: 30-Day Policy Overview */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Hourglass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
              30-Day Storage & Data Clearance Hub
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Photographer client delivery policy: 30 days backup hold before SD/SSD wipe.
            </p>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-[#F8F9FB] border border-zinc-200">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Active 30d Holds</span>
            <span className="text-lg font-black font-mono text-zinc-900">{activeHoldCount} Shoots</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Expiring (&lt;7 Days)</span>
            <span className="text-lg font-black font-mono text-rose-700">{criticalCount} Due</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">SSD Data Purged</span>
            <span className="text-lg font-black font-mono text-emerald-700">{clearedCount} Cleared</span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">Storage In Hold</span>
            <span className="text-lg font-black font-mono text-blue-700">~{totalHeldStorageGb} GB</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'active', label: 'Active Holds', count: activeHoldCount },
          { id: 'critical', label: '⚠️ Urgent (&lt;7d)', count: criticalCount },
          { id: 'cleared', label: '✅ Cleared / Wiped', count: clearedCount },
          { id: 'all', label: 'All Delivered', count: deliveredShoots.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              filterType === tab.id
                ? 'bg-ios-blue text-white shadow-glow-blue'
                : 'bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200 shadow-2xs'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              filterType === tab.id ? 'bg-black/20 text-white' : 'bg-zinc-100 text-zinc-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Retention Shoot Cards List */}
      <div className="space-y-3.5">
        {filteredItems.length > 0 ? (
          filteredItems.map(({ shoot, retention }) => (
            <div
              key={shoot.id}
              onClick={() => setSelectedShoot(shoot)}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200 space-y-3.5 shadow-xs cursor-pointer hover:border-blue-300 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-zinc-900 group-hover:text-ios-blue transition-colors">
                      {shoot.title}
                    </h3>
                    <span className="text-xs font-bold text-zinc-500">({shoot.category})</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                    Client: <strong className="text-zinc-800">{shoot.clientName}</strong> • Delivered on: <strong>{formatDate(shoot.deliveredAt)}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${retention.badgeColor}`}>
                    {retention.badgeText}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      shoot.isDataCleared ? 'bg-zinc-400' : retention.isExpired ? 'bg-red-500' : retention.daysLeft <= 5 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${retention.progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 mt-1 font-mono font-bold">
                  <span>Day 1 (Delivered: {formatDate(shoot.deliveredAt)})</span>
                  <span>{retention.progressPercent}% of 30 Days Passed</span>
                  <span>Purge Deadline: {retention.deadlineFormatted}</span>
                </div>
              </div>

              {/* Device and Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 text-xs">
                <div className="flex items-center space-x-3 text-zinc-600 font-medium">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                    {shoot.storageDevice || 'SSD Storage'} ({shoot.rawFilesSizeGb || 100} GB)
                  </span>
                  {shoot.wfolioUrl && (
                    <WfolioBadge url={shoot.wfolioUrl} compact={true} />
                  )}
                </div>

                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setReminderModalShoot(shoot)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-glow-green"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Notice</span>
                  </button>

                  {!shoot.isDataCleared ? (
                    <button
                      onClick={() => setShootToClear(shoot)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
                    >
                      Clear SSD Storage
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Storage Wiped & Logged
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 bg-white rounded-2xl border border-zinc-200 text-center space-y-2">
            <p className="text-sm font-bold text-zinc-500">No shoots match this filter.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {shootToClear && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
              <HardDrive className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-zinc-900">
                Wipe SSD Data for "{shootToClear.title}"?
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Make sure the client has downloaded and confirmed their photos from wfolio before marking local SSD data as purged.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShootToClear(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmClear}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                Yes, Mark Cleared
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
