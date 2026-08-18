import React, { useState, useMemo } from 'react';
import { useShoots } from '../context/useShoots';
import {
  Search, Plus, MapPin,
  MessageSquare, ArrowUpDown, CheckCircle2, Clock,
  User, Building, Trash2, AlertCircle
} from 'lucide-react';
import { formatCurrency, calculateRetentionStatus } from '../utils/helpers';
import { WfolioBadge } from './WfolioBadge';
import { Shoot } from '../types/shoot';
import { ContactQuickActions } from './ContactQuickActions';
import { format } from 'date-fns';

type FilterTab = 'all' | 'own' | 'third_party' | 'booked' | 'editing' | 'delivered' | 'data_cleared';
type SortField = 'date' | 'revenue' | 'balance' | 'title';

const getRegistryStatusMeta = (shoot: Shoot) => {
  if (shoot.isDataCleared || shoot.status === 'data_cleared') {
    return {
      label: 'Data Cleared',
      className: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    };
  }

  if (shoot.status === 'delivered') {
    return {
      label: 'Delivered',
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }

  if (shoot.status === 'in_progress') {
    return {
      label: 'Live Now',
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }

  if (shoot.status === 'editing') {
    return {
      label: 'Editing',
      className: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }

  return {
    label: 'Booked',
    className: 'bg-blue-50 text-ios-blue border-blue-200',
  };
};

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
            className="min-h-11 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-ios-blue shadow-xs"
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
            className="min-h-11 flex-1 sm:flex-initial bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-ios-blue shadow-xs font-semibold"
          >
            <option value="date">Sort by Date</option>
            <option value="revenue">Sort by Revenue</option>
            <option value="balance">Sort by Balance Due</option>
            <option value="title">Sort by Title</option>
          </select>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex min-h-11 min-w-11 items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-700 dark:text-zinc-300 hover:text-black transition-colors shadow-xs"
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
              className={`min-h-11 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
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

      {/* Studio Activity Cards */}
      <div className="space-y-3">
        {filteredShoots.length > 0 ? (
          filteredShoots.map((shoot) => {
            const retention = calculateRetentionStatus(shoot);
            const isFullyPaid = shoot.balanceAmount === 0;
            const hasOnlinePayment = shoot.advanceAmount > 0;
            const statusMeta = getRegistryStatusMeta(shoot);
            const primaryEvent = shoot.events?.[0];
            const venue = primaryEvent?.venue || shoot.location || 'Location Pending';
            const sessionTime = primaryEvent
              ? `${primaryEvent.startTime} - ${primaryEvent.endTime}`
              : 'Time Pending';
            const parsedDate = new Date(`${shoot.primaryDate || new Date().toISOString().split('T')[0]}T00:00:00`);

            return (
              <article
                key={shoot.id}
                onClick={() => setSelectedShoot(shoot)}
                className="group overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xs transition-all hover:border-[#C9440A]/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="p-3.5 sm:p-4">
                  <div className="flex gap-3">
                    <div className="flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-2xl border border-[#C9440A]/20 bg-[#FFF4EE] text-[#B83A08]">
                      <span className="text-[10px] font-black uppercase tracking-wide">
                        {format(parsedDate, 'MMM')}
                      </span>
                      <span className="text-2xl font-black leading-none">
                        {format(parsedDate, 'd')}
                      </span>
                      <span className="text-[10px] font-extrabold text-[#923006]/75">
                        {format(parsedDate, 'EEE')}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                          {shoot.category}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          shoot.shootType === 'own'
                            ? 'border-blue-200 bg-blue-50 text-ios-blue'
                            : 'border-purple-200 bg-purple-50 text-purple-700'
                        }`}>
                          {shoot.shootType === 'own' ? (
                            <span className="inline-flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Own
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {shoot.agencyName || '3rd Party'}
                            </span>
                          )}
                        </span>
                      </div>

                      <h3 className="mt-2 text-[15px] font-black leading-snug text-zinc-950 transition-colors group-hover:text-[#B83A08] dark:text-white">
                        {shoot.title}
                      </h3>
                      <p className="mt-0.5 break-words text-sm font-extrabold leading-snug text-zinc-900 dark:text-zinc-100">
                        {shoot.clientName || 'Client Name Pending'}
                      </p>

                      <div className="mt-2 grid gap-1 text-[11px] font-semibold text-zinc-500 sm:grid-cols-2">
                        <span className="flex min-w-0 items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span className="truncate">{sessionTime}</span>
                        </span>
                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span className="truncate">{venue}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 bg-zinc-50/80 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-zinc-400">Package</span>
                        <span className="font-mono text-sm font-black text-zinc-950 dark:text-white">
                          {formatCurrency(shoot.totalAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                          {isFullyPaid ? 'Payment' : 'Balance'}
                        </span>
                        {isFullyPaid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Settled
                          </span>
                        ) : (
                          <span className="font-mono text-sm font-black text-rose-600">
                            {formatCurrency(shoot.balanceAmount)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {hasOnlinePayment && (
                        <span className="inline-flex min-h-8 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-black text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Online Paid
                        </span>
                      )}
                      {retention && (
                        <span className={`inline-flex min-h-8 items-center rounded-xl border px-2.5 text-[11px] font-black ${retention.badgeColor}`}>
                          {retention.badgeText}
                        </span>
                      )}
                      {shoot.wfolioUrl ? (
                        <WfolioBadge url={shoot.wfolioUrl} compact={true} />
                      ) : (
                        <span className="inline-flex min-h-8 items-center rounded-xl border border-zinc-200 bg-white px-2.5 text-[11px] font-bold text-zinc-400">
                          No wfolio
                        </span>
                      )}
                      <button
                        onClick={() => setReminderModalShoot(shoot)}
                        className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-500"
                        title="Send WhatsApp Template"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Reminder</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShootToDelete(shoot);
                        }}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white text-zinc-400 ring-1 ring-zinc-200 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        title="Delete Shoot"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <ContactQuickActions shoot={shoot} compact />
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="py-16 text-center space-y-3">
            <p className="text-base font-bold text-zinc-500">No shoots match your filter or search.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterTab('all');
              }}
              className="min-h-11 px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300"
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
