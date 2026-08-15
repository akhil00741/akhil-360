import React from 'react';
import { useShoots } from '../context/ShootContext';
import { 
  TrendingUp, Calendar, AlertTriangle, Plus, Shield, 
  Clock, MapPin, CheckCircle2, Globe, MessageSquare, 
  ChevronRight, DollarSign, Sparkles, Building, User, Banknote, Landmark, Smartphone, HardDrive 
} from 'lucide-react';
import { formatCurrency, formatDate, calculateRetentionStatus } from '../utils/helpers';

export const DashboardView: React.FC = () => {
  const { 
    shoots, 
    metrics, 
    setIsCreateModalOpen, 
    setSelectedShoot, 
    setActiveTab,
    setReminderModalShoot 
  } = useShoots();

  // Urgent storage clearance shoots (< 7 days or expired)
  const urgentPurgeShoots = shoots
    .filter(s => s.deliveredAt && !s.isDataCleared)
    .map(s => ({ shoot: s, retention: calculateRetentionStatus(s) }))
    .filter(item => item.retention && (item.retention.isExpired || item.retention.daysLeft <= 7))
    .slice(0, 3);

  // Upcoming shoots
  const upcomingShoots = shoots
    .filter(s => s.status === 'booked' || s.status === 'in_progress')
    .slice(0, 4);

  // Recent delivered / active shoots
  const deliveredShoots = shoots
    .filter(s => s.status === 'delivered')
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-24">
      
      {/* Top Luxury Studio Cockpit Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-[#F8FAFC] to-[#EEF2F6] dark:from-[#16161A] dark:via-[#121216] dark:to-[#0A0A0C] p-5 sm:p-7 rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 shadow-ios transition-all">
        {/* Subtle ambient luxury light blob */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Studio Cockpit Live
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white mt-1.5 tracking-tight">
              AKHIL <span className="text-ios-blue">360</span> Studio Suite
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 font-medium max-w-xl">
              High-end management for shoots, cash & digital income flows, 30-day retention policies, and wfolio galleries.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-ios-blue to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-xs sm:text-sm font-extrabold shadow-glow-blue transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Register New Shoot</span>
            </button>
          </div>
        </div>
      </div>

      {/* 30-Day Storage Purge Alert Banner if any */}
      {urgentPurgeShoots.length > 0 && (
        <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 dark:from-red-950/70 dark:via-rose-950/40 dark:to-black border border-rose-200/90 dark:border-red-800/60 space-y-3 animate-fade-in shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-red-600/20 border border-rose-300 dark:border-red-500/40 flex items-center justify-center text-rose-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-rose-950 dark:text-red-200">
                  {urgentPurgeShoots.length} Shoot(s) Approaching 30-Day Storage Deadline
                </h3>
                <p className="text-xs text-rose-700/90 dark:text-red-300/80 font-medium">
                  Clients must be notified on WhatsApp before clearing local SSD storage.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('storage')}
              className="text-xs text-rose-700 dark:text-red-300 font-extrabold hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {urgentPurgeShoots.map(({ shoot, retention }) => (
              <div
                key={shoot.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-black/60 border border-rose-200/80 dark:border-red-900/50 flex items-center justify-between shadow-2xs"
              >
                <div className="truncate mr-2">
                  <p className="text-xs font-extrabold text-zinc-950 dark:text-white truncate">{shoot.title}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    {shoot.clientName} • <span className="text-rose-600 dark:text-red-400 font-extrabold">{retention?.badgeText}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => setReminderModalShoot(shoot)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-glow-green transition-all"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setSelectedShoot(shoot)}
                    className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Financial Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Billed Revenue */}
        <div className="p-4 sm:p-5 rounded-[24px] ios-glass-card space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Gross Billed</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-ios-blue/15 border border-blue-200/80 dark:border-ios-blue/30 flex items-center justify-center text-ios-blue">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-zinc-950 dark:text-white tracking-tight">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <span>{metrics.totalShoots} Total Bookings</span>
            <span className="text-ios-blue font-bold">Lifetime</span>
          </div>
        </div>

        {/* Total Collected (Cash & Digital) */}
        <div className="p-4 sm:p-5 rounded-[24px] ios-glass-card space-y-2 relative overflow-hidden group border-emerald-200/80 dark:border-emerald-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Cash Inflow</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(metrics.totalReceived)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <span className="text-emerald-700 dark:text-emerald-300 font-bold">
              💵 Cash: {formatCurrency(metrics.cashReceived)}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
              {metrics.totalRevenue > 0 ? Math.round((metrics.totalReceived / metrics.totalRevenue) * 100) : 0}% Realized
            </span>
          </div>
        </div>

        {/* Outstanding Pending Balance */}
        <div className="p-4 sm:p-5 rounded-[24px] ios-glass-card space-y-2 relative overflow-hidden group border-rose-200/80 dark:border-rose-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Receivables</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200/80 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight">
            {formatCurrency(metrics.totalPending)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <span>Pending Invoices</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">Balance Due</span>
          </div>
        </div>

        {/* 30-Day Storage Holds */}
        <div className="p-4 sm:p-5 rounded-[24px] ios-glass-card space-y-2 relative overflow-hidden group border-amber-200/80 dark:border-amber-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Storage Holds</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200/80 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-300 tracking-tight">
            {metrics.retentionActiveCount} <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Active</span>
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <span>{metrics.clearedCount} Cleared</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{metrics.criticalClearanceCount} Expiring</span>
          </div>
        </div>
      </div>

      {/* Treasury & Payment Breakdown Capsule */}
      <div className="p-5 rounded-[24px] ios-glass-card space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Studio Treasury & Payment Inflow
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('analytics')}
            className="text-xs text-ios-blue hover:underline font-extrabold"
          >
            Analytics & Charts →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 space-y-0.5">
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase block">💵 Cash in Hand</span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-800 dark:text-emerald-200">
              {formatCurrency(metrics.paymentMethodTotals['Cash'] || 0)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 space-y-0.5">
            <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 uppercase block">📱 UPI / GPay</span>
            <span className="text-base sm:text-lg font-black font-mono text-blue-800 dark:text-blue-200">
              {formatCurrency(metrics.paymentMethodTotals['UPI'] || 0)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 space-y-0.5">
            <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase block">🏦 Bank IMPS</span>
            <span className="text-base sm:text-lg font-black font-mono text-indigo-800 dark:text-indigo-200">
              {formatCurrency(metrics.paymentMethodTotals['Bank Transfer'] || 0)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 space-y-0.5">
            <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 uppercase block">💳 Card & Other</span>
            <span className="text-base sm:text-lg font-black font-mono text-purple-800 dark:text-purple-200">
              {formatCurrency((metrics.paymentMethodTotals['Card'] || 0) + (metrics.paymentMethodTotals['Cheque'] || 0) + (metrics.paymentMethodTotals['Other'] || 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Empty State Banner if 0 shoots */}
      {shoots.length === 0 && (
        <div className="p-8 sm:p-10 rounded-[28px] bg-gradient-to-b from-white to-zinc-50 dark:from-[#16161A] dark:to-[#101014] border border-zinc-200/80 dark:border-zinc-800 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-ios-blue/20 border border-blue-200 dark:border-ios-blue/30 flex items-center justify-center mx-auto text-ios-blue shadow-xs">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-extrabold text-zinc-950 dark:text-white">
              Welcome to AKHIL 360 Studio Suite!
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              Your clean production dashboard is ready. Tap <strong>Register Shoot</strong> to log your first client booking, multi-event time slots, Cash/Bank advance payments, and wfolio delivery gallery links.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-ios-blue to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-xs sm:text-sm font-extrabold shadow-glow-blue transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Register Your First Shoot</span>
          </button>
        </div>
      )}

      {/* Two Column Section: Upcoming Shoots & Recent Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Shoots Timeline */}
        <div className="p-5 rounded-[24px] ios-glass-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-ios-blue" />
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">Upcoming Shoot Schedule</h3>
            </div>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs text-ios-blue hover:underline font-extrabold"
            >
              Full Calendar →
            </button>
          </div>

          <div className="space-y-3">
            {upcomingShoots.length > 0 ? (
              upcomingShoots.map((shoot) => (
                <div
                  key={shoot.id}
                  onClick={() => setSelectedShoot(shoot)}
                  className="ios-glass-card-interactive p-4 rounded-2xl cursor-pointer space-y-2.5 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-ios-blue dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60">
                        {shoot.category}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                        shoot.shootType === 'own' ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' : 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      }`}>
                        {shoot.shootType === 'own' ? 'Own Shoot' : shoot.agencyName || '3rd Party'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(shoot.totalAmount)}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-zinc-950 dark:text-white group-hover:text-ios-blue transition-colors">
                    {shoot.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {formatDate(shoot.primaryDate)}
                    </span>
                    <span className="truncate max-w-[150px] text-zinc-500">{shoot.location}</span>
                  </div>

                  {shoot.events && shoot.events.length > 0 && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
                      {shoot.events.map(e => (
                        <span key={e.id} className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-800 font-semibold">
                          {e.name} ({e.startTime})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 py-6 text-center font-medium">No upcoming shoots scheduled.</p>
            )}
          </div>
        </div>

        {/* Recent Deliveries & wfolio Hub */}
        <div className="p-5 rounded-[24px] ios-glass-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">Client Deliveries & wfolio</h3>
            </div>
            <button
              onClick={() => setActiveTab('storage')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-extrabold"
            >
              Storage Hub →
            </button>
          </div>

          <div className="space-y-3">
            {deliveredShoots.length > 0 ? (
              deliveredShoots.map((shoot) => {
                const retention = calculateRetentionStatus(shoot);
                return (
                  <div
                    key={shoot.id}
                    onClick={() => setSelectedShoot(shoot)}
                    className="ios-glass-card-interactive p-4 rounded-2xl cursor-pointer space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-zinc-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {shoot.title}
                      </h4>
                      {retention && (
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${retention.badgeColor}`}>
                          {retention.badgeText}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Client: <strong className="text-zinc-800 dark:text-zinc-200">{shoot.clientName}</strong></p>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div>
                        {shoot.wfolioUrl ? (
                          <span className="text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1 font-extrabold">
                            <Globe className="w-3.5 h-3.5" />
                            wfolio Gallery Live
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400 font-medium">No wfolio link</span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReminderModalShoot(shoot);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-glow-green"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Send Notice</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-zinc-400 py-6 text-center font-medium">No delivered shoots currently active.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
