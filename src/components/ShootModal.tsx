import React, { useState } from 'react';
import { useShoots } from '../context/ShootContext';
import { Shoot, ShootCategory, ShootType, ShootStatus, ShootEventSlot, PaymentMethod } from '../types/shoot';
import { X, Plus, Trash2, Calendar, Clock, DollarSign, Globe, Shield, User, Building, MapPin, Camera, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/helpers';

interface ShootModalProps {
  shootToEdit?: Shoot | null;
  onClose: () => void;
}

const CATEGORIES: ShootCategory[] = [
  'Wedding',
  'Pre-Wedding',
  'Engagement',
  'Haldi / Mehendi',
  'Reception',
  'Birthday / Kids',
  'Maternity / Newborn',
  'Fashion / Portfolio',
  'Commercial / Brand',
  'Corporate / Event',
  'Architecture / Interior',
  'Other',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Card',
  'Cheque',
  'Other',
];

export const ShootModal: React.FC<ShootModalProps> = ({ shootToEdit, onClose }) => {
  const { addShoot, updateShoot } = useShoots();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [title, setTitle] = useState(shootToEdit?.title || '');
  const [category, setCategory] = useState<ShootCategory>(shootToEdit?.category || 'Wedding');
  const [shootType, setShootType] = useState<ShootType>(shootToEdit?.shootType || 'own');
  
  // 3rd Party fields
  const [agencyName, setAgencyName] = useState(shootToEdit?.agencyName || '');
  const [referredBy, setReferredBy] = useState(shootToEdit?.referredBy || '');
  const [thirdPartyContact, setThirdPartyContact] = useState(shootToEdit?.thirdPartyContact || '');

  // Client info
  const [clientName, setClientName] = useState(shootToEdit?.clientName || '');
  const [clientPhone, setClientPhone] = useState(shootToEdit?.clientPhone || '');
  const [clientEmail, setClientEmail] = useState(shootToEdit?.clientEmail || '');
  const [clientInstagram, setClientInstagram] = useState(shootToEdit?.clientInstagram || '');
  const [location, setLocation] = useState(shootToEdit?.location || '');
  const [primaryDate, setPrimaryDate] = useState(shootToEdit?.primaryDate || todayStr);

  // Financials & Payment Types
  const [totalAmount, setTotalAmount] = useState<number>(shootToEdit?.totalAmount || 0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(shootToEdit?.advanceAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(shootToEdit?.primaryPaymentMethod || 'Cash');
  
  // Workflow & Storage
  const [status, setStatus] = useState<ShootStatus>(shootToEdit?.status || 'booked');
  const [deliveredAt, setDeliveredAt] = useState(shootToEdit?.deliveredAt || '');
  const [storageDevice, setStorageDevice] = useState(shootToEdit?.storageDevice || 'SanDisk SSD-01');
  const [rawFilesSizeGb, setRawFilesSizeGb] = useState<number>(shootToEdit?.rawFilesSizeGb || 100);

  // wfolio
  const [wfolioUrl, setWfolioUrl] = useState(shootToEdit?.wfolioUrl || '');
  const [wfolioPassword, setWfolioPassword] = useState(shootToEdit?.wfolioPassword || '');

  const [notes, setNotes] = useState(shootToEdit?.notes || '');

  // Multi-Event Time Slots
  const [events, setEvents] = useState<ShootEventSlot[]>(() => {
    if (shootToEdit?.events && shootToEdit.events.length > 0) {
      return shootToEdit.events;
    }
    return [
      {
        id: `evt-${Date.now()}`,
        name: 'Main Shoot Session',
        date: shootToEdit?.primaryDate || todayStr,
        startTime: '09:00',
        endTime: '14:00',
        venue: shootToEdit?.location || 'Main Venue',
        allocatedIncome: shootToEdit?.totalAmount || 0,
      },
    ];
  });

  const handleAddEvent = () => {
    setEvents(prev => [
      ...prev,
      {
        id: `evt-${Date.now()}`,
        name: `Session ${prev.length + 1}`,
        date: primaryDate,
        startTime: '16:00',
        endTime: '20:00',
        venue: location || 'Venue',
        allocatedIncome: 0,
      },
    ]);
  };

  const handleUpdateEvent = (id: string, field: keyof ShootEventSlot, value: any) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleRemoveEvent = (id: string) => {
    if (events.length <= 1) return;
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const autoSumEvents = () => {
    const sum = events.reduce((acc, curr) => acc + (Number(curr.allocatedIncome) || 0), 0);
    if (sum > 0) {
      setTotalAmount(sum);
    }
  };

  const balanceAmount = Math.max(0, totalAmount - advanceAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a shoot title');
      return;
    }
    if (!clientName.trim()) {
      alert('Please enter a client name');
      return;
    }

    if (shootToEdit) {
      updateShoot(shootToEdit.id, {
        title,
        category,
        shootType,
        agencyName: shootType === 'third_party' ? agencyName : undefined,
        referredBy: shootType === 'third_party' ? referredBy : undefined,
        thirdPartyContact: shootType === 'third_party' ? thirdPartyContact : undefined,
        clientName,
        clientPhone,
        clientEmail,
        clientInstagram,
        location,
        primaryDate,
        events,
        totalAmount,
        advanceAmount,
        primaryPaymentMethod: paymentMethod,
        status,
        deliveredAt: status === 'delivered' ? (deliveredAt || format(new Date(), 'yyyy-MM-dd')) : undefined,
        storageDevice,
        rawFilesSizeGb,
        wfolioUrl,
        wfolioPassword,
        wfolioStatus: wfolioUrl ? (status === 'delivered' ? 'delivered' : 'published') : 'none',
        notes,
      });
    } else {
      addShoot({
        title,
        category,
        shootType,
        agencyName: shootType === 'third_party' ? agencyName : undefined,
        referredBy: shootType === 'third_party' ? referredBy : undefined,
        thirdPartyContact: shootType === 'third_party' ? thirdPartyContact : undefined,
        clientName,
        clientPhone,
        clientEmail,
        clientInstagram,
        location,
        primaryDate,
        events,
        totalAmount,
        advanceAmount,
        paymentStatus: balanceAmount === 0 && totalAmount > 0 ? 'paid' : advanceAmount > 0 ? 'partial' : 'unpaid',
        primaryPaymentMethod: paymentMethod,
        payments: advanceAmount > 0 ? [{
          id: `pay-${Date.now()}`,
          amount: advanceAmount,
          date: todayStr,
          method: paymentMethod,
          notes: 'Advance at registry',
        }] : [],
        status,
        bookedAt: todayStr,
        deliveredAt: status === 'delivered' ? (deliveredAt || todayStr) : undefined,
        retentionDaysLimit: 30,
        isDataCleared: false,
        storageDevice,
        rawFilesSizeGb,
        wfolioUrl,
        wfolioPassword,
        wfolioStatus: wfolioUrl ? (status === 'delivered' ? 'delivered' : 'published') : 'none',
        notes,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-sheet-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/60 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-ios-blue/20 border border-blue-200 dark:border-ios-blue/30 flex items-center justify-center">
              <Camera className="w-5 h-5 text-ios-blue" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                {shootToEdit ? 'Edit Shoot Entry' : 'New Shoot Registration'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">AKHIL 360 Shoot & Revenue Registry</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-140px)]">
          
          {/* Shoot Type Toggle (Own vs Third Party) */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              Shoot Ownership
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShootType('own')}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  shootType === 'own'
                    ? 'bg-ios-blue text-white shadow-glow-blue'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Own Shoot (Direct Client)</span>
              </button>

              <button
                type="button"
                onClick={() => setShootType('third_party')}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  shootType === 'third_party'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>3rd Party / Agency Shoot</span>
              </button>
            </div>
          </div>

          {/* Third Party Agency Details */}
          {shootType === 'third_party' && (
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-3">
              <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300 text-xs font-bold">
                <Building className="w-4 h-4" />
                <span>Agency / Subcontract Info</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-500 font-bold block mb-1">Studio / Agency Name *</label>
                  <input
                    type="text"
                    required={shootType === 'third_party'}
                    placeholder="e.g. Vogue Studio"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 font-bold block mb-1">Referred By (Lead)</label>
                  <input
                    type="text"
                    placeholder="e.g. Kabir"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 font-bold block mb-1">Agency Phone</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={thirdPartyContact}
                    onChange={(e) => setThirdPartyContact(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Basic Shoot Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Shoot Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Shoot Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya & Rohan Grand Wedding"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-ios-blue shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Shoot Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ShootCategory)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-ios-blue shadow-xs font-semibold"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Primary Shoot Date *</label>
                <input
                  type="date"
                  required
                  value={primaryDate}
                  onChange={(e) => setPrimaryDate(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-ios-blue shadow-xs font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Primary Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Taj Falaknuma Palace, Hyderabad"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-ios-blue shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Client & Contact Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Sharma"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-ios-blue shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Client Phone (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-ios-blue shadow-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Instagram Handle</label>
                <input
                  type="text"
                  placeholder="@handle"
                  value={clientInstagram}
                  onChange={(e) => setClientInstagram(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Multi-Event Time Slots (Time-to-Time Basis Income) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Event Schedule & Time Slots
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium">Track multi-event timings & time-to-time allocated income</p>
              </div>
              <button
                type="button"
                onClick={handleAddEvent}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-xs text-zinc-800 dark:text-zinc-200 font-bold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slot</span>
              </button>
            </div>

            <div className="space-y-3">
              {events.map((evt, idx) => (
                <div key={evt.id} className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ios-blue">Slot #{idx + 1}</span>
                    {events.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEvent(evt.id)}
                        className="text-zinc-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Session Name (e.g. Haldi / Muhurtham)"
                        value={evt.name}
                        onChange={(e) => handleUpdateEvent(evt.id, 'name', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-semibold"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Venue / Spot"
                        value={evt.venue}
                        onChange={(e) => handleUpdateEvent(evt.id, 'venue', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-0.5">Date</label>
                      <input
                        type="date"
                        value={evt.date}
                        onChange={(e) => handleUpdateEvent(evt.id, 'date', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-0.5">Start Time</label>
                      <input
                        type="time"
                        value={evt.startTime}
                        onChange={(e) => handleUpdateEvent(evt.id, 'startTime', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-0.5">End Time</label>
                      <input
                        type="time"
                        value={evt.endTime}
                        onChange={(e) => handleUpdateEvent(evt.id, 'endTime', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold block mb-0.5">Slot Allocated Income (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={evt.allocatedIncome || ''}
                      onChange={(e) => handleUpdateEvent(evt.id, 'allocatedIncome', Number(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>

            {events.length > 1 && (
              <button
                type="button"
                onClick={autoSumEvents}
                className="text-xs text-ios-blue hover:underline font-bold"
              >
                ↻ Auto-calculate total package from slots sum
              </button>
            )}
          </div>

          {/* Financials & Payment Method (Cash, UPI, Bank Transfer, Card, etc.) */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Financials & Payment Modes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Total Agreed Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="0"
                  value={totalAmount || ''}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white font-mono font-bold focus:outline-none focus:border-ios-blue"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Advance Received (₹)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={advanceAmount || ''}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-bold"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m === 'Cash' ? '💵 Cash' : m === 'UPI' ? '📱 UPI (GPay/PhonePe)' : m === 'Bank Transfer' ? '🏦 Bank Transfer' : m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-medium">Pending Balance Due:</span>
              <span className="font-mono font-extrabold text-sm text-rose-600 dark:text-rose-400">
                {formatCurrency(balanceAmount)}
              </span>
            </div>
          </div>

          {/* wfolio Delivery Integration */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
              <Globe className="w-4 h-4" />
              <span>wfolio Client Delivery Gallery</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-zinc-500 font-bold block mb-1">wfolio Gallery Link</label>
                <input
                  type="url"
                  placeholder="https://akhil360.wfolio.pro/gallery/client-album"
                  value={wfolioUrl}
                  onChange={(e) => setWfolioUrl(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/40 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-500 font-bold block mb-1">Gallery PIN / Password (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 2026"
                  value={wfolioPassword}
                  onChange={(e) => setWfolioPassword(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/40 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Workflow Status & 30-Day Storage Policy */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 text-xs font-bold">
              <Shield className="w-4 h-4 text-ios-orange" />
              <span>Workflow & 30-Day Storage Hold</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Workflow Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ShootStatus)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-semibold"
                >
                  <option value="booked">Booked (Upcoming)</option>
                  <option value="in_progress">In Progress (Shot)</option>
                  <option value="editing">Editing / Post-Processing</option>
                  <option value="delivered">Delivered (Starts 30-Day Hold)</option>
                  <option value="data_cleared">Data Cleared / Storage Purged</option>
                </select>
              </div>

              {status === 'delivered' && (
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Delivered Date</label>
                  <input
                    type="date"
                    value={deliveredAt || todayStr}
                    onChange={(e) => setDeliveredAt(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Storage Drive / Location</label>
                <input
                  type="text"
                  placeholder="e.g. SanDisk 4TB SSD (A1)"
                  value={storageDevice}
                  onChange={(e) => setStorageDevice(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Estimated RAW Size (GB)</label>
                <input
                  type="number"
                  placeholder="120"
                  value={rawFilesSizeGb || ''}
                  onChange={(e) => setRawFilesSizeGb(Number(e.target.value))}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Gear Notes & Instructions</label>
            <textarea
              rows={2}
              placeholder="e.g. Specific lenses, drone permissions, lighting setup..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-ios-blue resize-none shadow-xs"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-ios-blue hover:bg-blue-600 text-white text-xs font-bold shadow-glow-blue transition-all active:scale-95"
          >
            {shootToEdit ? 'Save Changes' : 'Register Shoot'}
          </button>
        </div>
      </div>
    </div>
  );
};
