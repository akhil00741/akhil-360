import React, { useState } from 'react';
import { useShoots } from '../context/useShoots';
import { Shoot, ShootCategory, ShootType, ShootStatus, ShootEventSlot, PaymentMethod } from '../types/shoot';
import { X, Plus, Trash2, Clock, IndianRupee, Globe, User, Building, MapPin, Camera, Landmark, Smartphone, CreditCard, FileText, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/helpers';
import { normalizeOnlinePaymentMethod } from '../utils/paymentMethods';

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

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'UPI', label: 'UPI (GPay / PhonePe)', icon: Smartphone },
  { id: 'Bank Transfer', label: 'Bank IMPS / NEFT', icon: Landmark },
  { id: 'Card', label: 'Card / POS', icon: CreditCard },
  { id: 'Cheque', label: 'Cheque', icon: FileText },
  { id: 'Other', label: 'Other Online', icon: CreditCard },
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

  // Financials & Payment Types (in Rupees)
  const [totalAmount, setTotalAmount] = useState<number>(shootToEdit?.totalAmount || 0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(shootToEdit?.advanceAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(normalizeOnlinePaymentMethod(shootToEdit?.primaryPaymentMethod));
  
  // Workflow & Storage
  const [status, setStatus] = useState<ShootStatus>(shootToEdit?.status || 'booked');
  const [deliveredAt] = useState(shootToEdit?.deliveredAt || '');
  const [storageDevice, setStorageDevice] = useState(shootToEdit?.storageDevice || 'SanDisk SSD-01');
  const [rawFilesSizeGb] = useState<number>(shootToEdit?.rawFilesSizeGb || 100);

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
        endTime: '21:00',
        venue: location || 'Venue',
        allocatedIncome: 0,
      },
    ]);
  };

  const handleRemoveEvent = (id: string) => {
    if (events.length <= 1) {
      alert('A shoot must have at least one scheduled session.');
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateEvent = (id: string, field: keyof ShootEventSlot, val: any) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const balanceAmount = Math.max(0, totalAmount - advanceAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a shoot title');
      return;
    }
    if (!clientName.trim()) {
      alert('Please enter client name');
      return;
    }
    if (totalAmount <= 0) {
      alert('Please enter total shoot package amount in Rupees (₹)');
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
          date: primaryDate,
          method: paymentMethod,
          notes: 'Advance Booking Deposit',
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/35 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white border border-zinc-200/90 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-sheet-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grabber Pill */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-300 mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Camera className="w-5 h-5 text-ios-blue" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">
                {shootToEdit ? 'Edit Shoot Entry' : 'New Shoot Registration'}
              </h2>
              <p className="text-xs text-zinc-500 font-medium">AKHIL 360 Studio Registry</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-130px)]">
          
          {/* Shoot Type Toggle (Own vs Third Party) */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              Shoot Ownership
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
              <button
                type="button"
                onClick={() => setShootType('own')}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  shootType === 'own'
                    ? 'bg-ios-blue text-white shadow-glow-blue'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>My Own Shoot (Direct Client)</span>
              </button>

              <button
                type="button"
                onClick={() => setShootType('third_party')}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  shootType === 'third_party'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>3rd Party / Agency Shoot</span>
              </button>
            </div>
          </div>

          {/* 3rd Party details if enabled */}
          {shootType === 'third_party' && (
            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-3 animate-fade-in">
              <div className="flex items-center space-x-2 text-purple-900 text-xs font-bold">
                <Building className="w-4 h-4 text-purple-600" />
                <span>3rd Party Studio / Agency Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-purple-900 block mb-1">Agency Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash Films Studio"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-purple-900 block mb-1">Referred By / Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-purple-900 block mb-1">Agency Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={thirdPartyContact}
                    onChange={(e) => setThirdPartyContact(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 1: General Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              1. Shoot Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Shoot Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sneha & Rahul Wedding"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-ios-blue focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Photography Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ShootCategory)}
                  className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-ios-blue focus:bg-white font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Primary Shoot Date *</label>
                <input
                  type="date"
                  required
                  value={primaryDate}
                  onChange={(e) => setPrimaryDate(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-ios-blue focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Shoot Location / Venue</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Taj Falaknuma, Hyderabad"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-ios-blue focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Client Contact */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                2. Client Contact
              </h3>
              <p className="mt-1 text-[11px] font-medium text-zinc-500">
                Saved to the in-app contact book automatically when this shoot is saved.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Client Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sneha Reddy"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-ios-blue focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Client WhatsApp Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-ios-blue focus:bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1 mb-1">
                  <Mail className="w-3.5 h-3.5 text-ios-blue" />
                  <span>Client Gmail / Email ID</span>
                </label>
                <input
                  type="email"
                  placeholder="client@gmail.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-ios-blue focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Instagram Handle</label>
                <input
                  type="text"
                  placeholder="@snehareddy"
                  value={clientInstagram}
                  onChange={(e) => setClientInstagram(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-ios-blue focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Multi-Event Time Slots (Time-to-Time Basis) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  3. Event Schedule Slots (Time-to-Time)
                </h3>
                <p className="text-[11px] text-zinc-400">Log morning/evening sessions and allocated session earnings in Rupees (₹)</p>
              </div>
              <button
                type="button"
                onClick={handleAddEvent}
                className="flex items-center space-x-1 text-xs text-ios-blue hover:underline font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Session</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {events.map((evt, idx) => (
                <div key={evt.id} className="p-3.5 rounded-2xl bg-[#F8F9FB] border border-zinc-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-ios-blue" />
                      <span>Session #{idx + 1}</span>
                    </span>
                    {events.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEvent(evt.id)}
                        className="text-zinc-400 hover:text-rose-600 text-xs p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">Session Name</label>
                      <input
                        type="text"
                        value={evt.name}
                        onChange={(e) => handleUpdateEvent(evt.id, 'name', e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">Date</label>
                      <input
                        type="date"
                        value={evt.date}
                        onChange={(e) => handleUpdateEvent(evt.id, 'date', e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">Venue</label>
                      <input
                        type="text"
                        value={evt.venue}
                        onChange={(e) => handleUpdateEvent(evt.id, 'venue', e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">Start Time</label>
                      <input
                        type="time"
                        value={evt.startTime}
                        onChange={(e) => handleUpdateEvent(evt.id, 'startTime', e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">End Time</label>
                      <input
                        type="time"
                        value={evt.endTime}
                        onChange={(e) => handleUpdateEvent(evt.id, 'endTime', e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">Session Income (₹)</label>
                      <input
                        type="number"
                        placeholder="₹ Amount"
                        value={evt.allocatedIncome || ''}
                        onChange={(e) => handleUpdateEvent(evt.id, 'allocatedIncome', Number(e.target.value))}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Financials & Online Payment Types (Rupees ₹) */}
          <div className="space-y-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center space-x-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                4. Financial Package & Online Payment Method (₹ Rupees)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Total Agreed Price (₹) *</label>
                <div className="relative">
                  <span className="text-zinc-500 font-bold absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="50000"
                    value={totalAmount || ''}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-200 rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 font-mono font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Online Advance Received (₹)</label>
                <div className="relative">
                  <span className="text-zinc-500 font-bold absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">₹</span>
                  <input
                    type="number"
                    min={0}
                    max={totalAmount || undefined}
                    placeholder="20000"
                    value={advanceAmount || ''}
                    onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-200 rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 font-mono font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Primary Online Payment Mode</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Balance preview */}
            <div className="p-3 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
              <span className="text-xs text-zinc-600 font-semibold">Remaining Balance Due:</span>
              <span className={`text-sm font-mono font-extrabold ${balanceAmount === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(balanceAmount)}
              </span>
            </div>
          </div>

          {/* Section 5: wfolio Gallery Link */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                5. wfolio Client Delivery Gallery
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">wfolio Gallery URL</label>
                <input
                  type="url"
                  placeholder="https://akhil360.wfolio.pro/gallery/..."
                  value={wfolioUrl}
                  onChange={(e) => setWfolioUrl(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">wfolio Gallery PIN / Password</label>
                <input
                  type="text"
                  placeholder="e.g. 4829 or secret password"
                  value={wfolioPassword}
                  onChange={(e) => setWfolioPassword(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Workflow Status & Storage */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              6. Workflow Status & Storage
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Current Shoot Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ShootStatus)}
                  className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-ios-blue focus:bg-white font-semibold"
                >
                  <option value="booked">Booked (Upcoming)</option>
                  <option value="in_progress">In Progress (Shooting)</option>
                  <option value="editing">Editing / Post-Processing</option>
                  <option value="delivered">Delivered (Starts 30-Day Hold)</option>
                  <option value="data_cleared">Data Cleared (Archive Purged)</option>
                </select>
                <p className="text-[11px] text-zinc-500 font-medium mt-1.5 leading-relaxed">
                  Booked, In Progress, and Editing are auto-tracked from the session start/end times. Use Delivered or Data Cleared only after the real action is done.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Local SSD Device Name</label>
                <input
                  type="text"
                  placeholder="e.g. SanDisk SSD 2TB - Black"
                  value={storageDevice}
                  onChange={(e) => setStorageDevice(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-ios-blue focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Private Shoot Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Client requested drone shots, 85mm prime lens for portraits..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F8F9FB] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-ios-blue focus:bg-white"
            />
          </div>

          {/* Sticky Form Footer */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#B83A08] hover:bg-[#923006] text-white text-xs font-extrabold shadow-glow-blue ring-1 ring-[#923006]/20 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#B83A08]/35"
            >
              {shootToEdit ? 'Save Changes' : 'Register Shoot'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
