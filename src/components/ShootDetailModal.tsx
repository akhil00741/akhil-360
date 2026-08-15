import React, { useState } from 'react';
import { useShoots } from '../context/ShootContext';
import { Shoot, ShootStatus, PaymentRecord, PaymentMethod } from '../types/shoot';
import { 
  X, Calendar, Clock, MapPin, Phone, Mail, 
  ExternalLink, CheckCircle, AlertTriangle, Trash2, Edit3, 
  MessageSquare, Plus, DollarSign, Shield, Check, HardDrive, 
  Building, User, ChevronRight, Download, Banknote 
} from 'lucide-react';
import { formatCurrency, formatDate, calculateRetentionStatus, getWhatsAppLink } from '../utils/helpers';
import { WfolioBadge } from './WfolioBadge';
import { downloadAppleCalendar } from '../utils/calendarSync';

interface ShootDetailModalProps {
  shoot: Shoot | null;
  onClose: () => void;
  onEdit: (shoot: Shoot) => void;
  onOpenReminder: (shoot: Shoot) => void;
}

const STATUS_ORDER: ShootStatus[] = ['booked', 'in_progress', 'editing', 'delivered', 'data_cleared'];

const STATUS_LABELS: Record<ShootStatus, { label: string; color: string }> = {
  booked: { label: 'Booked', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-400 dark:border-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800' },
  editing: { label: 'Editing', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800' },
  delivered: { label: 'Delivered (30d Hold)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800' },
  data_cleared: { label: 'Data Cleared', color: 'bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' },
};

export const ShootDetailModal: React.FC<ShootDetailModalProps> = ({
  shoot,
  onClose,
  onEdit,
  onOpenReminder,
}) => {
  const { updateShoot, deleteShoot, markAsDelivered, markDataCleared, addPayment } = useShoots();
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  if (!shoot) return null;

  const retention = calculateRetentionStatus(shoot);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    addPayment(shoot.id, {
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod,
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
      if (confirm('Are you sure you want to mark local data as CLEARED? Make sure client has confirmed their wfolio gallery download.')) {
        markDataCleared(shoot.id);
      }
    } else {
      updateShoot(shoot.id, { status: newStatus });
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${shoot.title}"?`)) {
      deleteShoot(shoot.id);
      onClose();
    }
  };

  const handleAddToAppleCal = () => {
    downloadAppleCalendar([shoot], `${shoot.title.replace(/\s+/g, '_')}_AppleCal.ics`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-sheet-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/60 sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border ${STATUS_LABELS[shoot.status].color}`}>
              {STATUS_LABELS[shoot.status].label}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              shoot.shootType === 'own' ? 'bg-blue-50 text-ios-blue border border-blue-200 dark:bg-ios-blue/15 dark:text-ios-teal dark:border-ios-blue/30' : 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800'
            }`}>
              {shoot.shootType === 'own' ? 'Own Shoot' : `3rd Party: ${shoot.agencyName || 'Agency'}`}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleAddToAppleCal}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Add this shoot to Apple Calendar (.ics)"
            >
              <Calendar className="w-4 h-4 text-ios-blue" />
            </button>
            <button
              onClick={() => onEdit(shoot)}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Edit Shoot"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-rose-100 text-zinc-500 hover:text-rose-600 dark:bg-zinc-800 dark:hover:bg-red-950/80 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-140px)]">
          
          {/* Shoot Title & Category */}
          <div>
            <span className="text-xs font-bold text-ios-blue tracking-wide">{shoot.category}</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white mt-0.5 tracking-tight">
              {shoot.title}
            </h2>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {formatDate(shoot.primaryDate)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                {shoot.location || 'Location Not Specified'}
              </span>
            </div>
          </div>

          {/* Pipeline Status Stepper */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2.5">
              Workflow Status Progression
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {STATUS_ORDER.map((st) => {
                const isActive = shoot.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`py-2 px-2 rounded-xl text-center text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-ios-blue text-white shadow-glow-blue scale-[1.02]' 
                        : 'bg-white dark:bg-zinc-950/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 shadow-xs'
                    }`}
                  >
                    {STATUS_LABELS[st].label.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

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
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-black/10 dark:bg-black/40 border border-current">
                  {retention.badgeText}
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="w-full bg-black/10 dark:bg-black/40 h-2 rounded-full overflow-hidden">
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
                <span className="text-xs flex items-center gap-1 font-medium">
                  <HardDrive className="w-3.5 h-3.5" />
                  {shoot.storageDevice || 'SSD Storage'} ({shoot.rawFilesSizeGb || 80} GB)
                </span>

                {!shoot.isDataCleared && (
                  <button
                    onClick={() => handleStatusChange('data_cleared')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-glow-red"
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

          {/* Client & Communication */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Client & Quick Actions
              </label>
              <button
                onClick={() => onOpenReminder(shoot)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-green transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Template Reminder</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-zinc-900 dark:text-white">{shoot.clientName}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">{shoot.clientPhone || 'No phone number'}</p>
                {shoot.clientEmail && <p className="text-xs text-zinc-500">{shoot.clientEmail}</p>}
                {shoot.clientInstagram && <p className="text-xs text-ios-blue font-semibold">{shoot.clientInstagram}</p>}
              </div>

              {shoot.clientPhone && (
                <div className="flex items-center space-x-2">
                  <a
                    href={`tel:${shoot.clientPhone}`}
                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs"
                    title="Call Client"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={getWhatsAppLink(shoot.clientPhone, `Hi ${shoot.clientName}, regarding our shoot with AKHIL 360...`)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green transition-colors"
                    title="WhatsApp Client"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Event Schedule & Time-to-Time Breakdown */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
              Event Schedule & Time-to-Time Income
            </label>
            <div className="space-y-2">
              {shoot.events && shoot.events.length > 0 ? (
                shoot.events.map((evt) => (
                  <div key={evt.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{evt.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          {evt.date}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-ios-blue" />
                        {evt.startTime} - {evt.endTime} • {evt.venue}
                      </p>
                    </div>
                    {evt.allocatedIncome ? (
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
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

          {/* Financials & Payment Ledger */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Financial Summary & Payment Entries
              </label>
              <button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="flex items-center space-x-1 text-xs text-ios-blue hover:underline font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Cash / Bank Payment</span>
              </button>
            </div>

            {/* Numbers row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total</span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-zinc-900 dark:text-white">
                  {formatCurrency(shoot.totalAmount)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block">Received</span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(shoot.advanceAmount)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold block">Balance</span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-rose-600 dark:text-rose-400">
                  {formatCurrency(shoot.balanceAmount)}
                </span>
              </div>
            </div>

            {/* Add Payment Sub-form */}
            {showPaymentForm && (
              <form onSubmit={handleRecordPayment} className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 animate-fade-in shadow-sm">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Record Payment Received</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      required
                      min={1}
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-bold"
                    >
                      <option value="Cash">💵 Cash</option>
                      <option value="UPI">📱 UPI / GPay</option>
                      <option value="Bank Transfer">🏦 Bank Transfer</option>
                      <option value="Card">💳 Card</option>
                      <option value="Cheque">📝 Cheque</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Note (e.g. 2nd Installment)"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white"
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
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Payment History</span>
                {shoot.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/60 shadow-xs">
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                      {p.date} • <strong className="text-zinc-900 dark:text-white">{p.method === 'Cash' ? '💵 Cash' : p.method}</strong> {p.notes ? `(${p.notes})` : ''}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between">
          <button
            onClick={() => onOpenReminder(shoot)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-green transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send Reminder</span>
          </button>

          <button
            onClick={() => onEdit(shoot)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-ios-blue hover:bg-blue-600 text-white text-xs font-bold shadow-glow-blue transition-all"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Shoot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
