import React, { useState, useMemo } from 'react';
import { useShoots } from '../context/useShoots';
import {
  Search, Plus, Calendar, MapPin,
  MessageSquare, ArrowUpDown, CheckCircle2,
  User, Building, Trash2, AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate, calculateRetentionStatus } from '../utils/helpers';
import { WfolioBadge } from './WfolioBadge';
import { Shoot } from '../types/shoot';
import { ContactQuickActions } from './ContactQuickActions';

type FilterTab = 'all' | 'own' | 'third_party' | 'booked' | 'editing' | 'delivered' | 'data_cleared';
type SortField = 'date' | 'revenue' | 'balance' | 'title';

export const ShootRegistryView: React.FC = () => {
  const { shoots, setIsCreateModalOpen, setSelectedShoot, setReminderModalShoot, deleteShoot } = useShoots();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [shootToDelete, setShootToDelete] = useState<Shoot | null>(null);

  // Filter and Sort Logic
  const filteredShoots = useMemo(() => {
    return shoots
      .filter((s) => {
        if (filterTab === 'own' && s.shootType !== 'own') return false;
        if (filterTab === 'third_party' && s.shootType !== 'third_party') return false;
        if (filterTab === 'booked' && s.status !== 'booked') return false;
        if (filterTab === 'editing' && (s.status !== 'editing' && s.status !== 'in_progress')) return false;
        if (filterTab === 'delivered' && s.status !== 'delivered') return false;
        if (filterTab === 'data_cleared' && !s.isDataCleared) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.clientName.toLowerCase().includes(q) ||
          s.location?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.agencyName?.toLowerCase().includes(q) ||
          s.clientPhone?.includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'date') {
          cmp = new Date(b.primaryDate).getTime() - new Date(a.primaryDate).getTime();
        } else if (sortField === 'revenue') {
          cmp = b.totalAmount - a.totalAmount;
        } else if (sortField === 'balance') {
          cmp = b.balanceAmount - a.balanceAmount;
        } else if (sortField === 'title') {
          cmp = a.title.localeCompare(b.title);
        }
        return sortAsc ? -cmp : cmp;
      });
  }, [shoots, filterTab, searchQuery, sortField, sortAsc]);

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Shoots', count: shoots.length },
    { id: 'own', label: 'Own Shoots', count: shoots.filter(s => s.shootType === 'own').length },
    { id: 'third_party', label: '3rd Party Agency', count: shoots.filter(s => s.shootType === 'third_party').length },
    { id: 'booked', label: 'Booked', count: shoots.filter(s => s.status === 'booked').length },
    { id: 'editing', label: 'In Progress / Editing', count: shoots.filter(s => s.status === 'editing' || s.status === 'in_progress').length },
    { id: 'delivered', label: 'Delivered (30d Hold)', count: shoots.filter(s => s.status === 'delivered').length },
    { id: 'data_cleared', label: 'Data Cleared', count: shoots.filter(s => s.isDataCleared).length },
  ];

  const handleConfirmDelete = () => {
    if (shootToDelete) {
      deleteShoot(shootToDelete.id);
      setShootToDelete(null);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      
      {/* Header & New Shoot Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Shoot Registry
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {filteredShoots.length} shoot{filteredShoots.length === 1 ? '' : 's'} found • Track online payments, dates & clients
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="min-h-[44px] flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#B83A08] hover:bg-[#923006] text-white text-xs sm:text-sm font-extrabold shadow-glow-blue ring-1 ring-[#923006]/20 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#B83A08]/35"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Shoot Entry</span>
        </button>
      </div>

      {/* Search Bar & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client, title, venue, agency, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-ios-blue shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="flex-1 sm:flex-initial bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-ios-blue shadow-xs font-semibold"
          >
            <option value="date">Sort by Date</option>
            <option value="revenue">Sort by Revenue</option>
            <option value="balance">Sort by Balance Due</option>
            <option value="title">Sort by Title</option>
          </select>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-700 dark:text-zinc-300 hover:text-black transition-colors shadow-xs"
            title={sortAsc ? 'Ascending' : 'Descending'}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {filterTabs.map((tab) => {
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-ios-blue text-white shadow-glow-blue'
                  : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 shadow-xs'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                isActive ? 'bg-black/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Shoot Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredShoots.length > 0 ? (
          filteredShoots.map((shoot) => {
            const retention = calculateRetentionStatus(shoot);
            const isFullyPaid = shoot.balanceAmount === 0;
            const hasOnlinePayment = shoot.advanceAmount > 0;

            return (
              <div
                key={shoot.id}
                onClick={() => setSelectedShoot(shoot)}
                className="ios-glass-card-interactive p-4 sm:p-5 rounded-3xl cursor-pointer space-y-3.5 border-zinc-200/80 dark:border-zinc-800/80 group"
              >
                {/* Top Row: Category, Shoot Type, 30-Day Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                      {shoot.category}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      shoot.shootType === 'own'
                        ? 'bg-blue-50 dark:bg-ios-blue/15 text-ios-blue dark:text-ios-teal border border-blue-200 dark:border-ios-blue/30'
                        : 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    }`}>
                      {shoot.shootType === 'own' ? (
                        <>
                          <User className="w-3 h-3" />
                          <span>Own Shoot</span>
                        </>
                      ) : (
                        <>
                          <Building className="w-3 h-3" />
                          <span>{shoot.agencyName || '3rd Party'}</span>
                        </>
                      )}
                    </span>

                    {hasOnlinePayment && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Online Paid</span>
                      </span>
                    )}
                  </div>

                  {retention && (
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${retention.badgeColor}`}>
                      {retention.badgeText}
                    </span>
                  )}
                </div>

                {/* Shoot Title & Location */}
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-ios-blue transition-colors">
                    {shoot.title}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {formatDate(shoot.primaryDate)}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {shoot.location || 'Location Pending'}
                    </span>
                  </div>
                </div>

                {/* Client info & Copyable Contact Strip */}
                <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="truncate font-medium">
                      <span>Client: </span>
                      <span className="text-zinc-900 dark:text-zinc-200 font-bold">{shoot.clientName}</span>
                    </div>

                    {shoot.events && shoot.events.length > 0 && (
                      <span className="text-[11px] text-zinc-500 font-mono font-bold shrink-0">
                        {shoot.events.length} Slot{shoot.events.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>

                  <ContactQuickActions shoot={shoot} compact />
                </div>

                {/* Financials & Status Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs text-zinc-400 block font-medium">Total Package</span>
                    <span className="text-base font-extrabold font-mono text-zinc-900 dark:text-white">
                      {formatCurrency(shoot.totalAmount)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block font-medium">
                      {isFullyPaid ? 'Payment Status' : 'Pending Balance'}
                    </span>
                    {isFullyPaid ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Fully Settled
                      </span>
                    ) : (
                      <span className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                        {formatCurrency(shoot.balanceAmount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <div>
                    {shoot.wfolioUrl ? (
                      <WfolioBadge url={shoot.wfolioUrl} compact={true} />
                    ) : (
                      <span className="text-[11px] text-zinc-400">No wfolio link</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setReminderModalShoot(shoot)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-glow-green transition-all"
                      title="Send WhatsApp Template"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Reminder</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShootToDelete(shoot);
                      }}
                      className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-100 text-zinc-400 hover:text-rose-600 transition-colors"
                      title="Delete Shoot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center space-y-3">
            <p className="text-base font-bold text-zinc-500">No shoots match your filter or search.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterTab('all');
              }}
              className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* In-App Apple Style Delete Confirmation Alert Modal */}
      {shootToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-red-950/80 border border-rose-300 dark:border-red-800 flex items-center justify-center mx-auto text-rose-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                Delete "{shootToDelete.title}"?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                This action cannot be undone. All time slots, payments, and 30-day retention logs for this shoot will be permanently erased.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShootToDelete(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-glow-red transition-all active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
