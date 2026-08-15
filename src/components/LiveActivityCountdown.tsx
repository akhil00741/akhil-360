import React, { useState, useEffect } from 'react';
import { Shoot } from '../types/shoot';
import { Clock, Navigation, MapPin, Sparkles, MessageSquare, AlertCircle, CheckCircle2, Bell } from 'lucide-react';
import { getWhatsAppLink } from '../utils/helpers';
import { downloadAppleCalendar } from '../utils/calendarSync';

interface LiveActivityCountdownProps {
  upcomingShoot: Shoot | null;
  onOpenShoot: (shoot: Shoot) => void;
}

export const LiveActivityCountdown: React.FC<LiveActivityCountdownProps> = ({ upcomingShoot, onOpenShoot }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; totalMinutes: number; isPast: boolean } | null>(null);
  const [notifSent, setNotifSent] = useState(false);

  useEffect(() => {
    if (!upcomingShoot) return;

    const calculateTime = () => {
      const shootDateStr = upcomingShoot.events?.[0]?.date || upcomingShoot.primaryDate;
      const startTimeStr = upcomingShoot.events?.[0]?.startTime || '09:00';
      
      const targetTime = new Date(`${shootDateStr}T${startTimeStr}:00`).getTime();
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalMinutes: 0, isPast: true });
        return;
      }

      const totalMinutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, totalMinutes, isPast: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [upcomingShoot]);

  const handleTriggerImmediateNotification = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!upcomingShoot || !timeLeft) return;
    const venue = upcomingShoot.events?.[0]?.venue || upcomingShoot.location || 'Main Venue';
    const shootTime = upcomingShoot.events?.[0]?.startTime || '11:00';

    const title = `⏰ ${timeLeft.totalMinutes} Minutes Left: ${upcomingShoot.title}`;
    const body = `Starts at ${shootTime} (${timeLeft.hours > 0 ? `${timeLeft.hours}h ` : ''}${timeLeft.minutes}m remaining) at ${venue}. Check live traffic & beat the rush!`;

    const sendNativeNotif = () => {
      // 1. Try Service Worker for Native iOS Lock Screen Notification
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body: body,
            icon: './apple-touch-icon.png',
            badge: './favicon.png',
            vibrate: [200, 100, 200],
            tag: 'shoot-countdown',
          } as NotificationOptions);
        });
      }

      // 2. Standard Web Notification fallback
      try {
        new Notification(title, {
          body: body,
          icon: './apple-touch-icon.png',
          badge: './favicon.png',
        });
      } catch (err) {
        console.log('Standard notif error, handled by SW:', err);
      }

      setNotifSent(true);
      setTimeout(() => setNotifSent(false), 3500);
    };

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        sendNativeNotif();
      } else {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            sendNativeNotif();
          } else {
            alert('Please enable notifications in iPhone Settings ➔ Safari / AKHIL 360 to see lock screen banners.');
          }
        });
      }
    } else {
      alert('Your browser does not support web notifications directly. Please use "Sync Apple Cal" for lock screen alarms.');
    }
  };

  if (!upcomingShoot || !timeLeft) return null;

  const eventSlot = upcomingShoot.events?.[0];
  const venue = eventSlot?.venue || upcomingShoot.location || 'Studio';

  // Dynamic traffic advisory text
  const getTrafficAdvisory = () => {
    if (timeLeft.isPast) {
      return <span className="text-emerald-400 font-bold">Session is currently in progress on location.</span>;
    }
    if (timeLeft.hours >= 4) {
      return <span>Traffic status: <strong>Clear</strong> (Start 4h gear check)</span>;
    }
    if (timeLeft.hours >= 2) {
      return <span>Departure Advisory: <strong className="text-amber-400">Start Driving (2h to shoot)</strong></span>;
    }
    if (timeLeft.hours === 1) {
      return <span>Rush Alert: <strong className="text-amber-300">1 Hour Remaining (Head to {venue})</strong></span>;
    }
    return <span>Arrival & Setup: <strong className="text-rose-400">{timeLeft.minutes}m Left (Setup lighting now)</strong></span>;
  };

  return (
    <div 
      onClick={() => onOpenShoot(upcomingShoot)}
      className="p-4 sm:p-5 rounded-3xl bg-zinc-900 text-white shadow-xl space-y-3 relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all group animate-fade-in"
    >
      {/* Top Dynamic Island Style Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
            <span>LIVE ACTIVITY</span>
            <span className="text-zinc-500">•</span>
            <span>LOCK SCREEN TRACKER</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span className="text-[11px] font-mono font-bold text-emerald-400">
            {timeLeft.isPast ? 'IN PROGRESS' : `${timeLeft.totalMinutes} MIN TO GO`}
          </span>
        </div>
      </div>

      {/* Main Content: Title and Big Live Countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ios-blue bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
            {upcomingShoot.category}
          </span>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1 group-hover:text-ios-blue transition-colors">
            {upcomingShoot.title}
          </h3>
          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="truncate">{venue}</span>
          </p>
        </div>

        {/* Live Digits Box */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-zinc-950/80 p-2.5 rounded-2xl border border-zinc-800 shadow-inner">
          <div className="text-center px-1.5">
            <span className="text-xl sm:text-2xl font-mono font-black text-white block">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase font-bold text-zinc-500 block">HRS</span>
          </div>

          <span className="text-lg font-mono font-bold text-zinc-600 animate-pulse">:</span>

          <div className="text-center px-1.5">
            <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400 block">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase font-bold text-zinc-500 block">MIN</span>
          </div>

          <span className="text-lg font-mono font-bold text-zinc-600 animate-pulse">:</span>

          <div className="text-center px-1.5">
            <span className="text-xl sm:text-2xl font-mono font-black text-white block">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase font-bold text-zinc-500 block">SEC</span>
          </div>
        </div>
      </div>

      {/* Live Route & Action Capsule */}
      <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 text-zinc-300 font-medium">
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          {getTrafficAdvisory()}
        </div>

        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleTriggerImmediateNotification}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 border border-amber-500/40 text-xs"
            title="Trigger Immediate Minutes Countdown Notification to Lock Screen"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>{notifSent ? '✅ Alert Fired!' : '🔔 Notify Minutes Now'}</span>
          </button>

          <button
            type="button"
            onClick={() => downloadAppleCalendar([upcomingShoot], `${upcomingShoot.title.replace(/\s+/g, '_')}.ics`)}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95 border border-zinc-700 text-xs"
            title="Sync this shoot to Apple Calendar with 4h, 2h, and 1h alerts"
          >
            <Clock className="w-3 h-3 text-ios-blue" />
            <span>🍎 Sync Apple Cal</span>
          </button>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue)}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-ios-blue hover:bg-blue-600 text-white font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95 text-xs"
          >
            <Navigation className="w-3 h-3" />
            <span>Google Maps Route</span>
          </a>

          {upcomingShoot.clientPhone && (
            <a
              href={getWhatsAppLink(upcomingShoot.clientPhone, `Hi ${upcomingShoot.clientName}, I am on track for our shoot today at ${venue}!`)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95 text-xs"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
