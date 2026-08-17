import React, { useMemo, useState } from 'react';
import { useShoots } from '../context/useShoots';
import {
  TrendingUp, IndianRupee, Award, User, Building, Trash2,
  Download
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { ShootCategory, PaymentMethod } from '../types/shoot';
import { format, subMonths, parseISO, isSameMonth } from 'date-fns';
import { getPaymentMethodLabel } from '../utils/paymentMethods';

export const AnalyticsView: React.FC = () => {
  const { shoots, contacts, metrics, clearAllData } = useShoots();
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Category Breakdown
  const categoryStats = useMemo(() => {
    const map = new Map<ShootCategory, { count: number; revenue: number }>();
    shoots.forEach((s) => {
      const current = map.get(s.category) || { count: 0, revenue: 0 };
      map.set(s.category, {
        count: current.count + 1,
        revenue: current.revenue + s.totalAmount,
      });
    });

    return Array.from(map.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [shoots]);

  // Monthly Revenue Chart Data (Last 6 Months)
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const label = format(d, 'MMM yyyy');
      const shortLabel = format(d, 'MMM');
      
      const total = shoots.reduce((acc, s) => {
        try {
          const shootDate = parseISO(s.primaryDate);
          if (isSameMonth(shootDate, d)) {
            return acc + s.totalAmount;
          }
        } catch {}
        return acc;
      }, 0);

      months.push({ label, shortLabel, total });
    }
    return months;
  }, [shoots]);

  const maxMonthRevenue = Math.max(...monthlyData.map(m => m.total), 50000);

  const avgShootIncome = metrics.totalShoots > 0 ? Math.round(metrics.totalRevenue / metrics.totalShoots) : 0;
  const collectionRate = metrics.totalRevenue > 0 ? Math.round((metrics.totalReceived / metrics.totalRevenue) * 100) : 0;

  // Export JSON Backup
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shoots, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AKHIL_360_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const paymentMethodsList: { method: PaymentMethod; label: string; bg: string }[] = [
    { method: 'UPI', label: getPaymentMethodLabel('UPI'), bg: 'bg-blue-500' },
    { method: 'Bank Transfer', label: getPaymentMethodLabel('Bank Transfer'), bg: 'bg-indigo-500' },
    { method: 'Card', label: getPaymentMethodLabel('Card'), bg: 'bg-purple-500' },
    { method: 'Cheque', label: getPaymentMethodLabel('Cheque'), bg: 'bg-amber-500' },
    { method: 'Other', label: getPaymentMethodLabel('Other'), bg: 'bg-zinc-500' },
  ];

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Revenue Analytics & Graphs
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Interactive financial charts, online payment channels, and shoot category splits
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-ios-blue" />
            <span>Export Backup</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Billed Revenue */}
        <div className="p-5 rounded-3xl ios-glass-card space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Gross Billed Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-ios-blue/15 border border-blue-200 dark:border-ios-blue/30 flex items-center justify-center text-ios-blue">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-900 dark:text-white">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Across {metrics.totalShoots} registered shoots</p>
        </div>

        {/* Realized Online Inflow */}
        <div className="p-5 rounded-3xl ios-glass-card space-y-2 relative overflow-hidden border-emerald-200/80 dark:border-emerald-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Collected Income (₹)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(metrics.totalReceived)}
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden flex-1">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${collectionRate}%` }} />
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">{collectionRate}% Realized</span>
          </div>
        </div>

        {/* Average Ticket Size */}
        <div className="p-5 rounded-3xl ios-glass-card space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Average Revenue / Shoot</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-300">
            {formatCurrency(avgShootIncome)}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Average booking ticket</p>
        </div>

      </div>

      {/* Visual Chart 1: Monthly Revenue Progression (Interactive SVG Bar Chart) */}
      <div className="p-5 sm:p-6 rounded-3xl ios-glass-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-ios-blue uppercase tracking-wider">Revenue Trend</span>
            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white">
              Monthly Shoot Revenue Chart (Last 6 Months)
            </h3>
          </div>
          <span className="text-xs font-bold font-mono px-3 py-1 rounded-xl bg-blue-50 dark:bg-ios-blue/15 text-ios-blue border border-blue-200 dark:border-ios-blue/30">
            Peak: {formatCurrency(maxMonthRevenue)}
          </span>
        </div>

        {/* SVG Interactive Visual Bar Chart */}
        <div className="pt-4 pb-2">
          <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {monthlyData.map((m, idx) => {
              const heightPercent = maxMonthRevenue > 0 ? Math.max(12, Math.round((m.total / maxMonthRevenue) * 100)) : 12;
              const hasRevenue = m.total > 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Tooltip / Amount on Hover */}
                  <span className="text-[11px] font-bold font-mono text-zinc-700 dark:text-zinc-300 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    {hasRevenue ? `₹${(m.total / 1000).toFixed(0)}k` : '₹0'}
                  </span>

                  {/* Visual Bar with Gradient */}
                  <div className="w-full max-w-[48px] bg-zinc-100 dark:bg-zinc-900/80 rounded-2xl p-1 h-full flex items-end">
                    <div
                      className={`w-full rounded-xl transition-all duration-500 ${
                        hasRevenue
                          ? 'bg-gradient-to-t from-ios-blue to-cyan-400 group-hover:from-blue-600 group-hover:to-cyan-300 shadow-md'
                          : 'bg-zinc-200 dark:bg-zinc-800'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Month Label */}
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-2">
                    {m.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Chart 2: Online Payment Methods Breakdown */}
      <div className="p-5 sm:p-6 rounded-3xl ios-glass-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Payment Channels</span>
            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white">
              Online Collection Distribution
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            Total Inflow: {formatCurrency(metrics.totalReceived)}
          </span>
        </div>

        {/* Stacked Multi-Color Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden flex shadow-inner">
            {paymentMethodsList
              .map(({ method, bg }) => {
              const amount = metrics.paymentMethodTotals[method] || 0;
              const percent = metrics.totalReceived > 0 ? (amount / metrics.totalReceived) * 100 : 0;
              return { method, bg, amount, percent };
            })
              .filter(({ percent }) => percent > 0)
              .map(({ method, bg, amount, percent }) => (
                <div
                  key={`payment-segment-${method}`}
                  className={`${bg} h-full transition-all duration-500 hover:brightness-110`}
                  style={{ width: `${percent}%` }}
                  title={`${method}: ${formatCurrency(amount)} (${percent.toFixed(1)}%)`}
                />
              ))}
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            {paymentMethodsList.map(({ method, label, bg }) => {
              const amount = metrics.paymentMethodTotals[method] || 0;
              const percent = metrics.totalReceived > 0 ? Math.round((amount / metrics.totalReceived) * 100) : 0;

              return (
                <div key={method} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${bg}`} />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{label}</span>
                  </div>
                  <p className="text-base font-extrabold font-mono text-zinc-900 dark:text-white">
                    {formatCurrency(amount)}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{percent}% of online collection</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shoot Type Comparison: Own Shoot vs Third Party */}
      <div className="p-5 sm:p-6 rounded-3xl ios-glass-card space-y-4">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">
          Direct Client vs. Agency Referral Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Own Shoots Box */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-zinc-950/80 border border-blue-200 dark:border-ios-blue/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-ios-blue/20 flex items-center justify-center text-ios-blue">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Direct Own Shoots</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Your direct private clients</p>
                </div>
              </div>
              <span className="text-xs font-bold text-ios-blue font-mono">{metrics.ownShootsCount} Shoots</span>
            </div>

            <div className="pt-2 border-t border-blue-200/60 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Earnings</span>
              <span className="text-base font-extrabold font-mono text-zinc-900 dark:text-white">
                {formatCurrency(metrics.ownShootsRevenue)}
              </span>
            </div>

            <div className="w-full bg-blue-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-ios-blue h-full rounded-full"
                style={{
                  width: `${metrics.totalRevenue > 0 ? (metrics.ownShootsRevenue / metrics.totalRevenue) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 text-right font-medium">
              {metrics.totalRevenue > 0 ? Math.round((metrics.ownShootsRevenue / metrics.totalRevenue) * 100) : 0}% of total revenue
            </p>
          </div>

          {/* Third Party Shoots Box */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-zinc-950/80 border border-purple-200 dark:border-purple-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">3rd Party Agency Shoots</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Subcontracts & referrals</p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-300 font-mono">{metrics.thirdPartyCount} Shoots</span>
            </div>

            <div className="pt-2 border-t border-purple-200/60 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Earnings</span>
              <span className="text-base font-extrabold font-mono text-purple-700 dark:text-purple-300">
                {formatCurrency(metrics.thirdPartyRevenue)}
              </span>
            </div>

            <div className="w-full bg-purple-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full"
                style={{
                  width: `${metrics.totalRevenue > 0 ? (metrics.thirdPartyRevenue / metrics.totalRevenue) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 text-right font-medium">
              {metrics.totalRevenue > 0 ? Math.round((metrics.thirdPartyRevenue / metrics.totalRevenue) * 100) : 0}% of total revenue
            </p>
          </div>

        </div>
      </div>

      {/* Category Wise Revenue Breakdown Table */}
      <div className="p-5 sm:p-6 rounded-3xl ios-glass-card space-y-4">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">
          Revenue by Photography Category
        </h3>

        <div className="space-y-3">
          {categoryStats.map((item) => {
            const percent = metrics.totalRevenue > 0 ? Math.round((item.revenue / metrics.totalRevenue) * 100) : 0;

            return (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-zinc-900 dark:text-white">{item.category}</span>
                    <span className="text-zinc-500 font-mono">({item.count} shoots)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.revenue)}</span>
                    <span className="text-zinc-500 font-mono w-8 text-right font-semibold">{percent}%</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-ios-blue to-ios-purple h-full rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Management */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Database Maintenance</h4>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Production data is saved locally on this device. Export a backup before clearing shoots and the in-app contact book.
          </p>
          <button
            onClick={() => setIsClearConfirmOpen(true)}
            disabled={shoots.length === 0 && contacts.length === 0}
            className="flex min-h-11 items-center space-x-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 shrink-0 border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear App Data</span>
          </button>
        </div>
      </div>

      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 backdrop-blur-xs sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-950">Clear current app data?</h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-600">
                  This clears {shoots.length} shoot{shoots.length === 1 ? '' : 's'} and {contacts.length} saved contact{contacts.length === 1 ? '' : 's'} from this app. Export a backup first if you need one.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="min-h-11 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void clearAllData();
                  setIsClearConfirmOpen(false);
                }}
                className="min-h-11 rounded-xl bg-rose-600 px-4 text-xs font-extrabold text-white transition-colors hover:bg-rose-500"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
