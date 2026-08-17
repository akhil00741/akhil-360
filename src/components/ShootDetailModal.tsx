import React, { useEffect, useMemo, useState } from 'react';
import { useShoots } from '../context/useShoots';
import { Shoot, ShootStatus, PaymentMethod } from '../types/shoot';
import {
  X, Calendar, Clock, MapPin,
  MessageSquare, Plus, IndianRupee, Shield, HardDrive,
  Trash2, Edit3, CheckCircle2, CircleDot, Activity, Navigation, Radio, Timer
} from 'lucide-react';
import { formatCurrency, formatDate, calculateRetentionStatus } from '../utils/helpers';
import { WfolioBadge } from './WfolioBadge';
import { downloadAppleCalendar } from '../utils/calendarSync';
import { getPaymentMethodLabel, normalizeOnlinePaymentMethod, ONLINE_PAYMENT_METHODS } from '../utils/paymentMethods';
import { ContactQuickActions } from './ContactQuickActions';
import { getShootSessionStates, SessionPhase } from '../utils/sessionTracking';

interface ShootDetailModalProps {
  shoot: Shoot | null;
  onClose: () => void;
  onEdit: (shoot: Shoot) => void;
  onOpenReminder: (shoot: Shoot) => void;
}

const STATUS_ORDER: ShootStatus[] = ['booked', 'in_progress', 'editing', 'delivered', 'data_cleared'];

const STATUS_LABELS: Record<ShootStatus, { label: string; color: string }> = {
  booked: { label: 'Booked', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  editing: { label: 'Editing', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  delivered: { label: 'Delivered (30d Hold)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  data_cleared: { label: 'Data Cleared', color: 'bg-zinc-100 text-zinc-600 border-zinc-300' },
};

const STATUS_DETAILS: Record<ShootStatus, string> = {
  booked: 'Client confirmed and session scheduled.',
  in_progress: 'Shoot day or production is currently active.',
  editing: 'Files are in selection, retouching, or album work.',
  delivered: 'Gallery delivered; 30-day storage hold is active.',
  data_cleared: 'Raw data cleared after delivery window.',
};

const SESSION_PHASE_STYLE: Record<SessionPhase, { badge: string; bar: string; card: string }> = {
  upcoming: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    bar: 'bg-ios-blue',
    card: 'bg-blue-50/60 border-blue-200',
  },
  live: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bar: 'bg-emerald-500',
    card: 'bg-emerald-50/70 border-emerald-200',
  },
  finished: {
    badge: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    bar: 'bg-zinc-400',
    card: 'bg-zinc-50 border-zinc-200',
  },
};

export const ShootDetailModal: React.FC<ShootDetailModalProps> = ({
  shoot,
  onClose,
  onEdit,
  onOpenReminder,
}) => {
  const { updateShoot, deleteShoot, markAsDelivered, markDataCleared, addPayment } = useShoots();
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const sessionStates = useMemo(() => shoot ? getShootSessionStates(shoot, nowMs) : [], [nowMs, shoot]);
  const focusSession = useMemo(() => {
    const liveSession = sessionStates.find(session => session.phase === 'live');
    const upcomingSession = sessionStates.find(session => session.phase === 'upcoming');
    return liveSession || upcomingSession || sessionStates[sessionStates.length - 1] || null;
  }, [sessionStates]);

  if (!shoot) return null;

  const retention = calculateRetentionStatus(shoot);
  const currentStageIndex = Math.max(0, STATUS_ORDER.indexOf(shoot.status));
  const navigationVenue = focusSession?.event.venue || shoot.location;
  const isPastShootWork = shoot.status === 'editing' || shoot.status === 'delivered' || shoot.status === 'data_cleared';
  const shouldShowDirections = Boolean(navigationVenue && focusSession?.phase !== 'finished' && !isPastShootWork);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      alert('Please enter a valid amount in Rupees (₹)');
      return;
    }
    addPayment(shoot.id, {
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      method: normalizeOnlinePaymentMethod(paymentMethod),
      notes: paymentNotes,
    });
    setPaymentAmount(0);
    setPaymentNotes('');
    setShowPaymentForm(false);
  };

  const handleStatusChange = (newStatus: ShootStatus) => {
    if (newStatus === 'delivered' && shoot.status !== 'delivered') {
      markAsDelivered(shoot.id);
    } else if (newStatus === 'data_cleared' && !shoot.isDataCleared) {
      markDataCleared(shoot.id);
    } else {
      updateShoot(shoot.id, { status: newStatus });
    }
  };

  const confirmDelete = () => {
    deleteShoot(shoot.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleAddToAppleCal = () => {
    downloadAppleCalendar([shoot], `${shoot.title.replace(/\s+/g, '_')}_AppleCal.ics`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/35 backdrop-blur-xs">
        <div 
          className="w-full max-w-2xl bg-white border border-zinc-200/90 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-sheet-up overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* iOS Grabber Pill */}
          <div className="w-12 h-1.5 rounded-full bg-zinc-300 mx-auto mt-2.5 sm:hidden" />

          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center space-x-2">
              <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border ${STATUS_LABELS[shoot.status].color}`}>
                {STATUS_LABELS[shoot.status].label}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                shoot.shootType === 'own' ? 'bg-blue-50 text-ios-blue border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                {shoot.shootType === 'own' ? 'Own Shoot' : `3rd Party: ${shoot.agencyName || 'Agency'}`}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleAddToAppleCal}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                title="Add to Apple Calendar (.ics)"
              >
                <Calendar className="w-4 h-4 text-ios-blue" />
              </button>
              <button
                onClick={() => onEdit(shoot)}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                title="Edit Shoot"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-rose-100 text-zinc-500 hover:text-rose-600 transition-colors"
                title="Delete Shoot"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-130px)]">
            
            {/* Shoot Title & Category */}
            <div>
              <span className="text-xs font-bold text-ios-blue uppercase tracking-wide">{shoot.category}</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-0.5 tracking-tight">
                {shoot.title}
              </h2>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-500 mt-2 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  {formatDate(shoot.primaryDate)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {shoot.location || 'Location Not Specified'}
                </span>
                {shouldShowDirections && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(navigationVenue)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open Google Maps directions to ${navigationVenue}`}
                    title="Open Google Maps directions"
                    className="min-h-[44px] min-w-[44px] -my-3 inline-flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 text-ios-blue border border-blue-200 transition-all active:scale-[0.98]"
                  >
                    <Navigation className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Client & Communication */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Client Contact & Copy
                  </label>
                  <p className="text-base font-extrabold text-zinc-900 mt-1">{shoot.clientName}</p>
                  <p className="text-xs text-zinc-500 font-medium">Copy individual fields or paste the complete contact block.</p>
                </div>
                <button
                  onClick={() => onOpenReminder(shoot)}
                  className="min-h-[44px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-green transition-all active:scale-[0.98]"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Template Reminder</span>
                </button>
              </div>

              <ContactQuickActions shoot={shoot} showQuickLinks />
            </div>

            {/* Client Stage Tracker */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Client Stage Tracker
                  </label>
                  <p className="text-xs text-zinc-600 font-medium mt-0.5">
                    Auto-tracked by shoot time until delivery. Current stage: <strong className="text-zinc-900">{STATUS_LABELS[shoot.status].label}</strong>
                  </p>
                </div>
                <span className="text-[11px] font-black font-mono px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-zinc-700">
                  {currentStageIndex + 1}/{STATUS_ORDER.length}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-white border border-zinc-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-ios-blue transition-all duration-500"
                  style={{ width: `${((currentStageIndex + 1) / STATUS_ORDER.length) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {STATUS_ORDER.map((st, index) => {
                  const isActive = shoot.status === st;
                  const isComplete = index < currentStageIndex || shoot.status === 'data_cleared';
                  const canConfirmManually = st === 'delivered' || st === 'data_cleared';

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => canConfirmManually ? handleStatusChange(st) : undefined}
                      disabled={!canConfirmManually}
                      title={canConfirmManually ? `Mark as ${STATUS_LABELS[st].label}` : 'This stage is updated automatically from session time'}
                      aria-current={isActive ? 'step' : undefined}
                      className={`min-h-[96px] p-3 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'bg-ios-blue text-white border-ios-blue shadow-glow-blue'
                          : isComplete
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200 shadow-2xs'
                      } ${canConfirmManually ? 'cursor-pointer' : 'cursor-default opacity-95'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black">{STATUS_LABELS[st].label.split('(')[0].trim()}</span>
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <CircleDot className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-300'}`} />
                        )}
                      </div>
                      <p className={`text-[10px] leading-snug mt-2 font-semibold ${isActive ? 'text-white/80' : 'text-zinc-500'}`}>
                        {STATUS_DETAILS[st]}
                      </p>
                      {!canConfirmManually && (
                        <p className={`text-[10px] mt-2 font-black ${isActive ? 'text-white/70' : 'text-zinc-400'}`}>
                          Automatic
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Session Start-to-End Tracker */}
            {focusSession && (
              <div className={`p-4 rounded-2xl border space-y-4 ${SESSION_PHASE_STYLE[focusSession.phase].card}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      focusSession.phase === 'live' ? 'bg-emerald-600 text-white' : 'bg-white text-ios-blue border border-zinc-200'
                    }`}>
                      {focusSession.phase === 'live' ? (
                        <Radio className="w-4 h-4 animate-pulse" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                        Live Session Tracker
                      </label>
                      <h4 className="text-sm font-extrabold text-zinc-900">
                        {focusSession.event.name}
                      </h4>
                    </div>
                  </div>

                  <span className={`inline-flex items-center justify-center min-h-[32px] px-3 py-1 rounded-full border text-[11px] font-black ${SESSION_PHASE_STYLE[focusSession.phase].badge}`}>
                    {focusSession.statusLabel}
                  </span>
                </div>

                <div className="rounded-2xl bg-white/80 border border-white/80 p-3.5 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-ios-blue" />
                        <span>{formatDate(focusSession.event.date)} • {focusSession.rangeLabel}</span>
                      </p>
                      <p className="text-xs text-zinc-600 font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{focusSession.event.venue || shoot.location || 'Location pending'}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-black flex items-center sm:justify-end gap-1">
                        <Timer className="w-3 h-3" />
                        Time Status
                      </span>
                      <p className="text-sm font-black text-zinc-900">{focusSession.timeLabel}</p>
                    </div>
                  </div>

                  <div>
                    <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${SESSION_PHASE_STYLE[focusSession.phase].bar}`}
                        style={{ width: `${focusSession.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold mt-1.5">
                      <span>Start</span>
                      <span>{focusSession.progressPercent}% complete</span>
                      <span>End</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-white border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-600 shadow-2xs">
                      <Timer className="w-3.5 h-3.5 text-ios-blue" />
                      <span>Status updates automatically from this schedule</span>
                    </span>

                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sessionStates.map((session) => (
                    <div
                      key={session.event.id}
                      className="rounded-xl bg-white/70 border border-white/80 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-zinc-900 truncate">{session.event.name}</p>
                          <p className="text-[11px] text-zinc-500 font-semibold">
                            {formatDate(session.event.date)} • {session.rangeLabel}
                          </p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${SESSION_PHASE_STYLE[session.phase].badge}`}>
                          {session.statusLabel}
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${SESSION_PHASE_STYLE[session.phase].bar}`}
                          style={{ width: `${session.progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500 font-bold">{session.timeLabel}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 30-Day Data Retention Banner */}
            {retention && (
              <div className={`p-4 rounded-2xl border space-y-3 ${retention.badgeColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-current" />
                    <div>
                      <h4 className="text-sm font-bold">30-Day Storage & Retention Policy</h4>
                      <p className="text-xs opacity-90 font-medium">
                        Delivered: {formatDate(shoot.deliveredAt)} • Purge Deadline: {retention.deadlineFormatted}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-black/5 border border-current">
                    {retention.badgeText}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        retention.isExpired ? 'bg-red-500' : retention.daysLeft <= 5 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${retention.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] opacity-80 mt-1 font-mono font-bold">
                    <span>Day 1 (Delivered)</span>
                    <span>{retention.progressPercent}% of 30 Days Passed</span>
                    <span>Day 30 (Purge)</span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs flex items-center gap-1 font-medium text-zinc-700">
                    <HardDrive className="w-3.5 h-3.5" />
                    {shoot.storageDevice || 'SSD Storage'} ({shoot.rawFilesSizeGb || 80} GB)
                  </span>

                  {!shoot.isDataCleared && (
                    <button
                      onClick={() => handleStatusChange('data_cleared')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      Confirm & Mark Cleared
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* wfolio Client Gallery Link */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                wfolio Client Delivery
              </label>
              <WfolioBadge
                url={shoot.wfolioUrl}
                password={shoot.wfolioPassword}
                status={shoot.wfolioStatus}
                clientName={shoot.clientName}
              />
            </div>

            {/* Event Schedule & Time-to-Time Breakdown */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                Event Schedule & Session Earnings (₹ Rupees)
              </label>
              <div className="space-y-2">
                {shoot.events && shoot.events.length > 0 ? (
                  shoot.events.map((evt) => (
                    <div key={evt.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-zinc-900">{evt.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-zinc-600 border border-zinc-200">
                            {evt.date}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-ios-blue" />
                          {evt.startTime} - {evt.endTime} • {evt.venue}
                        </p>
                      </div>
                      {evt.allocatedIncome ? (
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-emerald-600">
                            {formatCurrency(evt.allocatedIncome)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 italic">No specific sub-events logged.</p>
                )}
              </div>
            </div>

            {/* Financials & Online Payment Ledger (Rupees ₹) */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Online Financial Summary (₹ Rupees)
                  </label>
                </div>
                <button
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="flex items-center space-x-1 text-xs text-ios-blue hover:underline font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>

              {/* Numbers row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white border border-zinc-200 shadow-2xs">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Package</span>
                  <span className="text-sm sm:text-base font-extrabold font-mono text-zinc-900">
                    {formatCurrency(shoot.totalAmount)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Online Received</span>
                  <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-700">
                    {formatCurrency(shoot.advanceAmount)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] text-rose-700 uppercase font-bold block">Balance Due</span>
                  <span className="text-sm sm:text-base font-extrabold font-mono text-rose-600">
                    {formatCurrency(shoot.balanceAmount)}
                  </span>
                </div>
              </div>

              {/* Add Payment Sub-form */}
              {showPaymentForm && (
                <form onSubmit={handleRecordPayment} className="p-3.5 rounded-xl bg-white border border-zinc-200 space-y-3 animate-fade-in shadow-xs">
                  <h4 className="text-xs font-bold text-zinc-800">Record Online Payment Received in Rupees (₹)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <input
                        type="number"
                        placeholder="₹ Amount"
                        required
                        min={1}
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-mono font-bold focus:bg-white"
                      />
                    </div>
                    <div>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-bold focus:bg-white"
                      >
                        {ONLINE_PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>{getPaymentMethodLabel(method)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Note (e.g. 2nd Installment)"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-3 py-1 text-xs text-zinc-500 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-xs"
                    >
                      Save Payment
                    </button>
                  </div>
                </form>
              )}

              {/* Payment history list */}
              {shoot.payments && shoot.payments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Online Payment History</span>
                  {shoot.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-white border border-zinc-200 shadow-2xs">
                      <span className="text-zinc-600 font-medium">
                        {p.date} • <strong className="text-zinc-900">{getPaymentMethodLabel(p.method)}</strong> {p.notes ? `(${p.notes})` : ''}
                      </span>
                      <span className="font-mono font-bold text-emerald-600">+{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-200 bg-white flex items-center justify-between">
            <button
              onClick={() => onOpenReminder(shoot)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-green transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send Reminder</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all active:scale-95"
                title="Delete Shoot"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => onEdit(shoot)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-ios-blue hover:bg-blue-600 text-white text-xs font-bold shadow-glow-blue transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Shoot</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* In-App Apple Style Delete Confirmation Alert Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-zinc-900">
                Delete Permanently?
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Are you sure you want to permanently delete <strong>"{shoot.title}"</strong> across all devices?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
