import React, { useState } from 'react';
import { useShoots } from '../context/ShootContext';
import { Shoot, ShootStatus, PaymentRecord, PaymentMethod } from '../types/shoot';
import { 
  X, Calendar, Clock, MapPin, Phone, Mail, 
  MessageSquare, Plus, IndianRupee, Shield, Check, HardDrive, 
  Trash2, Edit3, Banknote, AlertCircle, Globe, ChevronRight 
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
  booked: { label: 'Booked', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  editing: { label: 'Editing', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  delivered: { label: 'Delivered (30d Hold)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  data_cleared: { label: 'Data Cleared', color: 'bg-zinc-100 text-zinc-600 border-zinc-300' },
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  if (!shoot) return null;

  const retention = calculateRetentionStatus(shoot);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      alert('Please enter a valid amount in Rupees (₹)');
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
              </div>
            </div>

            {/* Pipeline Status Stepper */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
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
                          : 'bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200 shadow-2xs'
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

            {/* Client & Communication */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-base font-extrabold text-zinc-900">{shoot.clientName}</p>
                  <p className="text-xs text-zinc-600 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-zinc-400" />
                    <span>{shoot.clientPhone || 'No phone number'}</span>
                  </p>
                  {shoot.clientEmail ? (
                    <p className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                      <Mail className="w-3 h-3 text-ios-blue" />
                      <span>{shoot.clientEmail}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-400 italic">No Gmail / Email entered</p>
                  )}
                  {shoot.clientInstagram && <p className="text-xs text-purple-700 font-semibold">{shoot.clientInstagram}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  {shoot.clientPhone && (
                    <>
                      <a
                        href={`tel:${shoot.clientPhone}`}
                        className="p-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 transition-colors shadow-2xs"
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
                    </>
                  )}

                  {shoot.clientEmail && (
                    <a
                      href={`mailto:${shoot.clientEmail}?subject=Photos & Updates: ${encodeURIComponent(shoot.title)} - AKHIL 360&body=Hi ${encodeURIComponent(shoot.clientName)},%0D%0A%0D%0ARegarding our photography shoot "${encodeURIComponent(shoot.title)}"...`}
                      className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-ios-blue border border-blue-200 transition-colors shadow-2xs"
                      title="Open Gmail / Email Client"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
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

            {/* Financials & Payment Ledger (Rupees ₹) */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Financial Summary (₹ Rupees)
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
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Received</span>
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
                  <h4 className="text-xs font-bold text-zinc-800">Record Payment Received in Rupees (₹)</h4>
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
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-bold focus:bg-white"
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
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Payment History</span>
                  {shoot.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-white border border-zinc-200 shadow-2xs">
                      <span className="text-zinc-600 font-medium">
                        {p.date} • <strong className="text-zinc-900">{p.method === 'Cash' ? '💵 Cash' : p.method}</strong> {p.notes ? `(${p.notes})` : ''}
                      </span>
                      <span className="font-mono font-bold text-emerald-600">+{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Shoot Section */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-800">Delete Shoot Record</h4>
                <p className="text-[11px] text-rose-600">Permanently remove this shoot, schedule slots, and ledger data.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Shoot</span>
              </button>
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

      {/* In-App Apple Style Delete Confirmation Alert Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-zinc-900">
                Delete "{shoot.title}"?
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                This action cannot be undone. All time slots, payments, and 30-day retention logs will be permanently erased.
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
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
