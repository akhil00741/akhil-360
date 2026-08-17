import React, { useState, useEffect } from 'react';
import { Shoot } from '../types/shoot';
import { Clock, Navigation, MapPin, Sparkles, MessageSquare, AlertCircle, CheckCircle2, Bell, Camera, Car } from 'lucide-react';
import { getWhatsAppLink } from '../utils/helpers';
import { downloadAppleCalendar } from '../utils/calendarSync';
import { LiveActivity } from '../utils/liveActivityPlugin';

let liveActivityId: string | null = null;

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
      
      // Update Native iOS Live Activity
      const venue = upcomingShoot.events?.[0]?.venue || upcomingShoot.location || 'Studio';
      const progressPercent = Math.min(100, Math.max(10, 100 - (totalMinutes / 360) * 100));
      
      try {
        if (!liveActivityId) {
          LiveActivity.startActivity({
            name: upcomingShoot.title,
            timeRemaining: totalMinutes,
            venue: venue,
            progress: progressPercent
          }).then(res => { liveActivityId = res.id; }).catch(() => {});
        } else {
          LiveActivity.updateActivity({
            id: liveActivityId,
            timeRemaining: totalMinutes,
            progress: progressPercent
          }).catch(() => {});
        }
      } catch (e) {
        // Plugin not running (i.e. web context)
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => {
      clearInterval(timer);
      if (liveActivityId) {
        LiveActivity.endActivity({ id: liveActivityId }).catch(() => {});
        liveActivityId = null;
      }
    };
  }, [upcomingShoot]);

  const handleTriggerImmediateNotification = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!upcomingShoot || !timeLeft) return;
    const venue = upcomingShoot.events?.[0]?.venue || upcomingShoot.location || 'Main Venue';
    const shootTime = upcomingShoot.events?.[0]?.startTime || '11:00';

    const title = `⏰ ${timeLeft.totalMinutes} Minutes Left: ${upcomingShoot.title}`;
    const body = `Starts at ${shootTime} (${timeLeft.hours > 0 ? `${timeLeft.hours}h ` : ''}${timeLeft.minutes}m remaining) at ${venue}. Check live traffic & beat the rush!`;

    const sendNativeNotif = () => {
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

      try {
        new Notification(title, {
          body: body,
          icon: './apple-touch-icon.png',
          badge: './favicon.png',
        });
      } catch (err) {}

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
            alert('Please enable notifications in Safari Settings to receive lock screen alerts.');
          }
        });
      }
    } else {
      alert('Use "Sync Apple Cal" button below to load alarms natively on your Lock Screen.');
    }
  };

  if (!upcomingShoot || !timeLeft) return null;

  const eventSlot = upcomingShoot.events?.[0];
  const venue = eventSlot?.venue || upcomingShoot.location || 'Studio';
  const shootTime = eventSlot?.startTime || '09:00';

  // Calculate progress percentage (assume 6 hours window before shoot)
  const totalWindowMinutes = 360;
  const progressPercent = Math.min(100, Math.max(10, 100 - (timeLeft.totalMinutes / totalWindowMinutes) * 100));

  return (
    <div className="space-y-3">
      {/* 📱 PIXEL-PERFECT APPLE LOCK SCREEN LIVE ACTIVITY CARD (MATCHING USER SCREENSHOT) */}
      <div 
        onClick={() => onOpenShoot(upcomingShoot)}
        className="p-5 sm:p-6 rounded-[28px] bg-black/95 text-white shadow-2xl border border-white/10 space-y-4 relative overflow-hidden cursor-pointer hover:border-blue-500/40 transition-all group animate-fade-in backdrop-blur-xl"
      >
        {/* Top Header of Apple Live Activity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-glow-green">
              <Camera className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                AKHIL 360 • LIVE ACTIVITY
              </span>
              <span className="text-sm font-extrabold text-white">
                {upcomingShoot.title}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/15">
            <span className="text-xs font-mono font-bold text-emerald-400">
              {venue}
            </span>
            <Car className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Center Main Countdown Display */}
        <div className="flex items-end justify-between pt-1">
          <div className="space-y-1.5">
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-sm font-mono font-bold text-zinc-400">
                :{String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>

            {/* Apple Green Progress Line */}
            <div className="w-48 sm:w-60 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <span className="text-xs font-bold text-zinc-400 block pt-0.5">
              {timeLeft.isPast ? 'Session in progress' : 'Time Remaining'}
            </span>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-xs text-zinc-400 font-medium block">Starts</span>
            <span className="text-lg sm:text-xl font-extrabold font-mono text-white block">
              {shootTime}
            </span>
            <span className="text-[11px] text-zinc-500 font-medium block truncate max-w-[130px]">
              {upcomingShoot.category}
            </span>
          </div>
        </div>

        {/* Live Route & Quick Actions */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center space-x-1.5 text-zinc-300 font-medium">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Traffic: <strong>Clear</strong> (Beat rush hour)</span>
          </div>

          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleTriggerImmediateNotification}
              className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 border border-amber-400/30 text-xs"
              title="Test Instant Notification"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>{notifSent ? '✅ Alert Fired!' : '🔔 Notify'}</span>
            </button>

            <button
              type="button"
              onClick={() => downloadAppleCalendar([upcomingShoot], `${upcomingShoot.title.replace(/\s+/g, '_')}.ics`)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95 border border-white/15 text-xs"
              title="Sync to Apple Calendar"
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
              <span>Maps</span>
            </a>
          </div>
        </div>
      </div>

      {/* 🔔 ATTACHED LOCK SCREEN NOTIFICATION BANNER (MATCHING USER SCREENSHOT) */}
      <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200/80 shadow-xs flex items-center space-x-3 text-zinc-900 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-black shrink-0 shadow-xs">
          <Camera className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-900">Pre-Shoot Reminder</h4>
            <span className="text-[10px] text-zinc-500 font-medium">Live</span>
          </div>
          <p className="text-xs text-zinc-700 font-medium mt-0.5 truncate">
            {upcomingShoot.title} at {venue} starts in {timeLeft.totalMinutes} minutes. Prepare camera gear & check route!
          </p>
        </div>
      </div>
    </div>
  );
};
