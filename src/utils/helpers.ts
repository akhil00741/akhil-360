import { format, parseISO, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { Shoot, ShootStatus, ReminderTemplate } from '../types/shoot';

// Currency Formatter (INR with fallback)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Format standard readable date
export const formatDate = (dateString?: string, formatStr = 'dd MMM yyyy'): string => {
  if (!dateString) return '—';
  try {
    const date = parseISO(dateString);
    return format(date, formatStr);
  } catch (e) {
    return dateString;
  }
};

// Calculate 30-day Data Retention info
export interface RetentionStatus {
  daysLeft: number;
  totalDays: number;
  progressPercent: number;
  deadlineFormatted: string;
  isExpired: boolean;
  urgency: 'safe' | 'warning' | 'critical' | 'expired' | 'cleared';
  badgeColor: string;
  badgeText: string;
}

export const calculateRetentionStatus = (shoot: Shoot): RetentionStatus | null => {
  if (shoot.isDataCleared) {
    return {
      daysLeft: 0,
      totalDays: shoot.retentionDaysLimit || 30,
      progressPercent: 100,
      deadlineFormatted: formatDate(shoot.dataRetentionDeadline),
      isExpired: false,
      urgency: 'cleared',
      badgeColor: 'bg-ios-gray4 text-ios-gray border-ios-gray3',
      badgeText: 'Data Cleared',
    };
  }

  if (!shoot.deliveredAt) {
    return null; // Not yet delivered, so retention countdown has not started
  }

  const deliveredDate = parseISO(shoot.deliveredAt);
  const deadline = shoot.dataRetentionDeadline 
    ? parseISO(shoot.dataRetentionDeadline) 
    : addDays(deliveredDate, shoot.retentionDaysLimit || 30);
  
  const today = new Date();
  const daysLeft = differenceInDays(deadline, today);
  const totalDays = shoot.retentionDaysLimit || 30;
  const elapsedDays = totalDays - daysLeft;
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
  const isExpired = daysLeft <= 0;

  let urgency: 'safe' | 'warning' | 'critical' | 'expired' = 'safe';
  let badgeColor = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
  let badgeText = `${daysLeft} Days Hold`;

  if (isExpired) {
    urgency = 'expired';
    badgeColor = 'bg-red-950/80 text-red-400 border-red-700/80 animate-pulse';
    badgeText = 'Clearance Due!';
  } else if (daysLeft <= 5) {
    urgency = 'critical';
    badgeColor = 'bg-rose-950/70 text-rose-400 border-rose-700/70';
    badgeText = `${daysLeft}d Final Notice`;
  } else if (daysLeft <= 14) {
    urgency = 'warning';
    badgeColor = 'bg-amber-950/70 text-amber-300 border-amber-700/70';
    badgeText = `${daysLeft} Days Left`;
  }

  return {
    daysLeft: Math.max(0, daysLeft),
    totalDays,
    progressPercent,
    deadlineFormatted: format(deadline, 'dd MMM yyyy'),
    isExpired,
    urgency,
    badgeColor,
    badgeText,
  };
};

// Generate WhatsApp Link
export const getWhatsAppLink = (phone: string, text: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  // Default to +91 if 10 digits
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://wa.me/${fullPhone}?text=${encodedText}`;
};

// Standard Photography Reminder Templates
export const REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    id: 'delivery_ready',
    title: '✨ Delivery & wfolio Gallery Link',
    description: 'Sent when photos are edited and uploaded to wfolio.',
    type: 'delivery_ready',
    badge: 'Delivery',
    template: (shoot) => {
      const wfolio = shoot.wfolioUrl 
        ? `\n🖼️ *Client Gallery:* ${shoot.wfolioUrl}${shoot.wfolioPassword ? `\n🔑 *PIN / Password:* ${shoot.wfolioPassword}` : ''}`
        : '';
      const balance = shoot.balanceAmount > 0 
        ? `\n💳 *Pending Balance:* ${formatCurrency(shoot.balanceAmount)}` 
        : '\n✅ *Payment:* Fully Settled';

      return `Hello ${shoot.clientName}! 👋\n\nYour photos for *"${shoot.title}"* are ready and delivered! 📸✨\n${wfolio}${balance}\n\n⚠️ *Note:* As per our 30-day data policy, please download and back up all high-resolution photos on your devices within 30 days.\n\nThank you for choosing *AKHIL 360*! Let me know your favorite shots! 😊`;
    },
  },
  {
    id: 'payment_balance',
    title: '💳 Balance Payment Reminder',
    description: 'Gentle reminder to settle outstanding shoot invoice balance.',
    type: 'payment_balance',
    badge: 'Payment',
    template: (shoot) => {
      return `Hi ${shoot.clientName}, hope you are doing well! 😊\n\nThis is a friendly reminder regarding the balance payment for *${shoot.title}*.\n\n💰 *Total Package:* ${formatCurrency(shoot.totalAmount)}\n✅ *Advance Paid:* ${formatCurrency(shoot.advanceAmount)}\n⚡ *Pending Balance:* ${formatCurrency(shoot.balanceAmount)}\n\nKindly clear the remaining balance at your earliest convenience via UPI or Bank Transfer.\n\nThank you!\n*AKHIL 360 Photography*`;
    },
  },
  {
    id: 'retention_15day',
    title: '⏳ 15-Day Storage Notice (Halfway)',
    description: 'Notifies client that 15 days of data hold remain.',
    type: 'retention_15day',
    badge: '15d Hold',
    template: (shoot) => {
      const wfolio = shoot.wfolioUrl ? `\n🔗 Gallery Link: ${shoot.wfolioUrl}` : '';
      return `Hi ${shoot.clientName}! 📢\n\nQuick reminder regarding your photo gallery for *${shoot.title}*.${wfolio}\n\n⏳ *15 Days Remaining:* We hold full RAW & JPEG shoot backups on our server storage for 30 days from delivery. 15 days have passed.\n\nPlease ensure you have downloaded all photos to your personal drive/laptop.\n\nWarm regards,\n*AKHIL 360*`;
    },
  },
  {
    id: 'retention_48hr_final',
    title: '⚠️ 48-Hour Final Data Purge Warning',
    description: 'Crucial alert before clearing local SSD storage.',
    type: 'retention_48hr_final',
    badge: 'Final 48h',
    template: (shoot) => {
      const wfolio = shoot.wfolioUrl ? `\n🔗 ${shoot.wfolioUrl}` : '';
      return `⚠️ *URGENT STORAGE CLEARANCE NOTICE* ⚠️\n\nDear ${shoot.clientName},\n\nThe 30-day storage retention period for *${shoot.title}* concludes in *48 HOURS*.${wfolio}\n\nOur system will clear local RAW and drive backups to free storage for upcoming shoots. Please ensure you have downloaded your full album.\n\nLet us know immediately if you require an archive extension.\n\nThank you,\n*AKHIL 360 Studio*`;
    },
  },
  {
    id: 'shoot_confirmation',
    title: '📅 Shoot Schedule & Timings Confirmation',
    description: 'Send event slot timings and venue to client/team.',
    type: 'shoot_confirmation',
    badge: 'Schedule',
    template: (shoot) => {
      const eventDetails = shoot.events && shoot.events.length > 0
        ? shoot.events.map((e, idx) => `  ${idx + 1}. *${e.name}*: ${e.date} (${e.startTime} - ${e.endTime}) @ ${e.venue}`).join('\n')
        : `  • Date: ${shoot.primaryDate} @ ${shoot.location}`;

      return `Hi ${shoot.clientName}! 📸\n\nYour upcoming shoot *"${shoot.title}"* is locked with *AKHIL 360*! Here are the scheduled timings:\n\n${eventDetails}\n\n📍 *Primary Location:* ${shoot.location}\n💰 *Package:* ${formatCurrency(shoot.totalAmount)} (Advance Paid: ${formatCurrency(shoot.advanceAmount)})\n\nSee you there on time with the full gear! Looking forward to an amazing shoot. 🌟`;
    },
  },
  {
    id: 'feedback',
    title: '🌟 Google / wfolio Review Request',
    description: 'Ask happy clients for feedback & testimonials.',
    type: 'feedback',
    badge: 'Review',
    template: (shoot) => {
      return `Dear ${shoot.clientName}! ❤️\n\nIt was an absolute pleasure capturing *${shoot.title}* for you! I hope you and your family loved the photos.\n\nIf you enjoyed working with me, I'd deeply appreciate a short 5-star review. It helps my freelance business grow!\n\nThank you once again for your trust!\n*Akhil | AKHIL 360*`;
    },
  },
];
