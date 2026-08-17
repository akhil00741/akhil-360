import React, { useEffect, useMemo, useState } from 'react';
import { useShoots } from '../context/useShoots';
import {
  Calendar, AlertTriangle, Plus,
  Clock, CheckCircle2, Globe, MessageSquare,
  ChevronRight, IndianRupee, Sparkles, Smartphone,
  MapPin, Square, Navigation, SunMedium, Camera
} from 'lucide-react';
import { formatCurrency, formatDate, calculateRetentionStatus, getWhatsAppLink } from '../utils/helpers';
import { format } from 'date-fns';
import { LiveActivityCountdown } from './LiveActivityCountdown';
import { Shoot } from '../types/shoot';
import { getShootSessionStates, SessionTrackerState } from '../utils/sessionTracking';
import { ContactQuickActions } from './ContactQuickActions';

type DashboardSession = SessionTrackerState & {
  shoot: Shoot;
};

export const DashboardView: React.FC = () => {
  const { 
    shoots, 
    metrics, 
    setIsCreateModalOpen, 
    setSelectedShoot, 
    setActiveTab,
    setReminderModalShoot 
  } = useShoots();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayFormatted = format(new Date(), 'EEEE, dd MMMM yyyy');
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Today's sessions, resolved at event-slot level so multi-day shoots show the correct details.
  const todaySessions = useMemo<DashboardSession[]>(() => {
    return shoots
      .flatMap((shoot) => getShootSessionStates(shoot, nowMs)
        .filter(session => session.event.date === todayStr)
        .map((session) => ({
          ...session,
          shoot,
        })))
      .sort((a, b) => a.startsAt - b.startsAt);
  }, [nowMs, shoots, todayStr]);

  // Gear Checklist state (stored in session/local state)
  const [gearChecklist, setGearChecklist] = useState<Record<string, boolean>>({
    'batteries': false,
    'sd_cards': false,
    'flash_triggers': false,
    'lenses_cleaned': false,
  });

  const toggleGear = (key: string) => {
    setGearChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allGearReady = Object.values(gearChecklist).every(Boolean);

  // Urgent storage clearance shoots (< 7 days or expired)
  const urgentPurgeShoots = shoots
    .filter(s => s.deliveredAt && !s.isDataCleared)
    .map(s => ({ shoot: s, retention: calculateRetentionStatus(s) }))
    .filter(item => item.retention && (item.retention.isExpired || item.retention.daysLeft <= 7))
    .slice(0, 3);

  const liveOrUpcomingSessions = useMemo<DashboardSession[]>(() => {
    return shoots
      .filter(s => s.status === 'booked' || s.status === 'in_progress')
      .flatMap((shoot) => getShootSessionStates(shoot, nowMs).map((session) => ({
        ...session,
        shoot,
      })))
      .filter(session => session.phase !== 'finished')
      .sort((a, b) => {
        if (a.phase === 'live' && b.phase !== 'live') return -1;
        if (a.phase !== 'live' && b.phase === 'live') return 1;
        return a.startsAt - b.startsAt;
      })
      .slice(0, 4);
  }, [nowMs, shoots]);

  // Recent delivered / active shoots
  const deliveredShoots = shoots
    .filter(s => s.status === 'delivered')
    .slice(0, 4);

  return (
    <div className="space-y-5 pb-24">
      
      {/* Top Clean Light Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Studio Active • {todayFormatted}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-1 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            Manage client bookings, online payments, 30-day storage clearance & wfolio galleries.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="min-h-[44px] flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#B83A08] hover:bg-[#923006] text-white text-xs sm:text-sm font-extrabold shadow-glow-blue ring-1 ring-[#923006]/20 transition-all active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-[#B83A08]/35"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Register Shoot</span>
        </button>
      </div>

      {/* 🌟 TODAY'S LIVE STUDIO BRIEFING & SCHEDULE */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-blue-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-ios-blue text-white flex items-center justify-center shadow-xs">
              <SunMedium className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900">Today's Studio Briefing</h3>
              <p className="text-xs text-zinc-500 font-medium">{todayFormatted}</p>
            </div>
          </div>

          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            todaySessions.length > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
          }`}>
            {todaySessions.length > 0 ? `${todaySessions.length} Session${todaySessions.length === 1 ? '' : 's'} Today` : 'Schedule Clear Today'}
          </span>
        </div>

        {/* If shoots today */}
        {todaySessions.length > 0 ? (
          <div className="space-y-3 pt-1">
            {todaySessions.map(({ shoot, event, phase, statusLabel, rangeLabel, timeLabel }) => (
              <div key={`${shoot.id}-${event.id}`} className="p-4 rounded-xl bg-white border border-blue-200/80 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-ios-blue border border-blue-200">
                        {shoot.category}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        phase === 'live'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : phase === 'finished'
                            ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            : 'bg-blue-50 text-ios-blue border-blue-200'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-zinc-900 mt-1">{shoot.title}</h4>
                    <p className="text-xs text-zinc-700 font-bold mt-0.5">{event.name}</p>
                    <p className="text-xs text-zinc-600 font-medium">
                      Client: <strong>{shoot.clientName}</strong> {shoot.clientPhone ? `(${shoot.clientPhone})` : ''}
                    </p>
                  </div>

                  <span className="text-sm font-black font-mono text-emerald-700">
                    {formatCurrency(event.allocatedIncome || shoot.totalAmount)}
                  </span>
                </div>

                <ContactQuickActions shoot={shoot} compact />

                {/* Event Timing & Location */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 pt-1 border-t border-zinc-100">
                  <span className="flex items-center gap-1 font-semibold text-zinc-800">
                    <Clock className="w-3.5 h-3.5 text-ios-blue" />
                    {rangeLabel} • {timeLabel}
                  </span>
                  <span className="flex items-center gap-1 truncate max-w-xs">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    {event.venue || shoot.location || 'Studio Location'}
                  </span>
                </div>

                {/* 1-Tap Quick Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {(event.venue || shoot.location) && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.venue || shoot.location)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-ios-blue border border-blue-200 text-xs font-bold transition-all active:scale-95"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Maps</span>
                    </a>
                  )}

                  {shoot.clientPhone && (
                    <a
                      href={getWhatsAppLink(shoot.clientPhone, `Hi ${shoot.clientName}, I am preparing the gear for our ${event.name} shoot today at ${event.venue || shoot.location}!`)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Client</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white/80 border border-zinc-200/80 flex items-center justify-between text-xs text-zinc-600 font-medium">
            <span>No client shoots scheduled for today. Free for post-processing or album designs!</span>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs text-ios-blue font-bold hover:underline shrink-0 ml-2"
            >
              + Book Today
            </button>
          </div>
        )}

        {/* 📷 Photographer Pre-Shoot Gear Checklist */}
        <div className="pt-2 border-t border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-ios-blue" />
              <span>Pre-Shoot Equipment Checklist</span>
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              allGearReady ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'
            }`}>
              {allGearReady ? 'All Gear Ready' : `${Object.values(gearChecklist).filter(Boolean).length}/4 Ready`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'batteries', label: 'Camera Batteries 100%' },
              { id: 'sd_cards', label: 'SD/CFexpress Cleared' },
              { id: 'flash_triggers', label: 'Flashes & Triggers' },
              { id: 'lenses_cleaned', label: 'Prime Lenses Packed' },
            ].map(item => {
              const isChecked = gearChecklist[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleGear(item.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                    isChecked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <span className="truncate mr-1">{item.label}</span>
                  {isChecked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🔴 LIVE ACTIVITY: Dynamic Island / Lock Screen Countdown */}
      {liveOrUpcomingSessions.length > 0 && (
        <LiveActivityCountdown
          upcomingShoot={liveOrUpcomingSessions[0].shoot}
          upcomingEvent={liveOrUpcomingSessions[0].event}
          onOpenShoot={(s) => setSelectedShoot(s)}
        />
      )}

      {/* 30-Day Storage Purge Alert Banner if any */}
      {urgentPurgeShoots.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-rose-950">
                {urgentPurgeShoots.length} Shoot(s) Approaching 30-Day Storage Deadline
              </h3>
            </div>

            <button
              onClick={() => setActiveTab('storage')}
              className="text-xs text-rose-700 font-bold hover:underline flex items-center gap-0.5 shrink-0"
            >
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {urgentPurgeShoots.map(({ shoot, retention }) => (
              <div
                key={shoot.id}
                className="p-3 rounded-xl bg-white border border-rose-200 flex items-center justify-between shadow-2xs"
              >
                <div className="truncate mr-2">
                  <p className="text-xs font-bold text-zinc-900 truncate">{shoot.title}</p>
                  <p className="text-[11px] text-zinc-500">
                    {shoot.clientName} • <span className="text-rose-600 font-bold">{retention?.badgeText}</span>
                  </p>
                </div>
                <button
                  onClick={() => setReminderModalShoot(shoot)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* CARD 1: Online collected */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Online Collected</span>
            </span>
            <span className="p-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
              <IndianRupee className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-900">
            {formatCurrency(metrics.totalReceived)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold pt-0.5">
            <span>UPI, Bank, Card</span>
            <span>{metrics.totalRevenue > 0 ? Math.round((metrics.totalReceived / metrics.totalRevenue) * 100) : 0}% Collected</span>
          </div>
        </div>


        {/* CARD 2: Active pipeline */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200/90 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-ios-blue" />
              <span>Active Pipeline</span>
            </span>
            <span className="p-1 rounded-md bg-blue-50 text-ios-blue">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-zinc-900 tracking-tight">
            {metrics.upcomingCount + metrics.inEditingCount}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium pt-0.5">
            <span>{metrics.upcomingCount} upcoming</span>
            <span className="text-ios-blue font-bold">{metrics.inEditingCount} editing</span>
          </div>
        </div>

        {/* CARD 3: ⏳ PENDING BALANCE */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-rose-200 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>Pending Balance</span>
            </span>
            <span className="p-1 rounded-md bg-rose-50 text-rose-600">
              <IndianRupee className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-rose-600 tracking-tight">
            {formatCurrency(metrics.totalPending)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium pt-0.5">
            <span>To Collect</span>
            <span className="text-rose-600 font-bold">Unpaid</span>
          </div>
        </div>

        {/* CARD 4: 📈 TOTAL BILLED REVENUE */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200/90 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Total Billed</span>
            </span>
            <span className="p-1 rounded-md bg-zinc-100 text-zinc-600">
              <IndianRupee className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-zinc-900 tracking-tight">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium pt-0.5">
            <span>{metrics.totalShoots} Shoots</span>
            <span className="text-ios-blue font-bold">Gross</span>
          </div>
        </div>
      </div>

      {/* Empty State Banner if 0 shoots */}
      {shoots.length === 0 && (
        <div className="p-8 sm:p-10 rounded-2xl bg-white border border-zinc-200 text-center space-y-3.5 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-ios-blue">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-extrabold text-zinc-900">
              Welcome to AKHIL 360 Studio!
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Your clean dashboard is ready. Tap <strong>Register Shoot</strong> to log your first booking, time slots, online advance payments, and wfolio gallery links.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="min-h-[44px] inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#B83A08] hover:bg-[#923006] text-white text-xs font-extrabold shadow-glow-blue ring-1 ring-[#923006]/20 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#B83A08]/35"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Register Your First Shoot</span>
          </button>
        </div>
      )}

      {/* Two Column Section: Upcoming Shoots & Recent Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Upcoming Shoots Timeline */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200/90 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-ios-blue" />
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Upcoming Shoots</h3>
            </div>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs text-ios-blue hover:underline font-bold"
            >
              Full Calendar →
            </button>
          </div>

          <div className="space-y-2.5">
            {liveOrUpcomingSessions.length > 0 ? (
              liveOrUpcomingSessions.map(({ shoot, event, phase, statusLabel }) => (
                <div
                  key={`${shoot.id}-${event.id}`}
                  onClick={() => setSelectedShoot(shoot)}
                  className="ios-glass-card-interactive p-3.5 rounded-xl cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-ios-blue border border-blue-200">
                        {shoot.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-zinc-100 text-zinc-600">
                        {shoot.shootType === 'own' ? 'Own Shoot' : shoot.agencyName || '3rd Party'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-black border ${
                        phase === 'live'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-ios-blue border-blue-200'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {formatCurrency(shoot.totalAmount)}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 group-hover:text-ios-blue transition-colors">
                    {shoot.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {formatDate(event.date)} • {event.startTime}
                    </span>
                    <span className="truncate max-w-[150px] text-zinc-400">{event.venue || shoot.location}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 py-6 text-center font-medium">No upcoming shoots scheduled.</p>
            )}
          </div>
        </div>

        {/* Recent Deliveries & wfolio Hub */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200/90 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Client Deliveries & wfolio</h3>
            </div>
            <button
              onClick={() => setActiveTab('storage')}
              className="text-xs text-indigo-600 hover:underline font-bold"
            >
              Storage Hub →
            </button>
          </div>

          <div className="space-y-2.5">
            {deliveredShoots.length > 0 ? (
              deliveredShoots.map((shoot) => {
                const retention = calculateRetentionStatus(shoot);
                return (
                  <div
                    key={shoot.id}
                    onClick={() => setSelectedShoot(shoot)}
                    className="ios-glass-card-interactive p-3.5 rounded-xl cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                        {shoot.title}
                      </h4>
                      {retention && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${retention.badgeColor}`}>
                          {retention.badgeText}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 font-medium">Client: <strong className="text-zinc-800">{shoot.clientName}</strong></p>

                    <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between">
                      <div>
                        {shoot.wfolioUrl ? (
                          <span className="text-[11px] text-indigo-700 flex items-center gap-1 font-bold">
                            <Globe className="w-3 h-3" />
                            wfolio Gallery Live
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400">No wfolio link</span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReminderModalShoot(shoot);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
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
