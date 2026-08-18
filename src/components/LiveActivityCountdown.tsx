import React, { useState, useEffect } from 'react';
import { Shoot, ShootEventSlot } from '../types/shoot';
import { Navigation, Camera, MapPin } from 'lucide-react';
import { LiveActivity } from '../utils/liveActivityPlugin';
import { getSessionTrackerState, SessionPhase } from '../utils/sessionTracking';

let liveActivityId: string | null = null;

interface LiveActivityCountdownProps {
  upcomingShoot: Shoot | null;
  upcomingEvent?: ShootEventSlot | null;
  onOpenShoot: (shoot: Shoot) => void;
}

interface LiveActivityTimeState {
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
  phase: SessionPhase;
  statusLabel: string;
  progressPercent: number;
}

export const LiveActivityCountdown: React.FC<LiveActivityCountdownProps> = ({ upcomingShoot, upcomingEvent, onOpenShoot }) => {
  const [timeLeft, setTimeLeft] = useState<LiveActivityTimeState | null>(null);

  useEffect(() => {
    if (!upcomingShoot) return;

    const calculateTime = () => {
      const eventSlot = upcomingEvent || upcomingShoot.events?.[0] || {
        id: `${upcomingShoot.id}-primary`,
        name: 'Main Shoot Session',
        date: upcomingShoot.primaryDate,
        startTime: '09:00',
        endTime: '17:00',
        venue: upcomingShoot.location || 'Studio',
        allocatedIncome: upcomingShoot.totalAmount,
      };
      const now = Date.now();
      const tracker = getSessionTrackerState(eventSlot, now);
      const targetTime = tracker.phase === 'upcoming' ? tracker.startsAt : tracker.endsAt;
      const diff = Math.max(0, targetTime - now);

      const totalMinutes = Math.ceil(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const prepProgressPercent = Math.min(100, Math.max(10, 100 - (totalMinutes / 360) * 100));
      const progressPercent = tracker.phase === 'upcoming' ? prepProgressPercent : tracker.progressPercent;

      setTimeLeft({
        hours,
        minutes,
        seconds,
        totalMinutes,
        phase: tracker.phase,
        statusLabel: tracker.statusLabel,
        progressPercent,
      });
      
      // Update Native iOS Live Activity
      const venue = eventSlot?.venue || upcomingShoot.location || 'Studio';
      
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
      } catch {
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
  }, [upcomingShoot, upcomingEvent]);

  if (!upcomingShoot || !timeLeft) return null;

  const eventSlot = upcomingEvent || upcomingShoot.events?.[0];
  const venue = eventSlot?.venue || upcomingShoot.location || 'Studio';
  const shootTime = eventSlot?.startTime || '09:00';
  const endTime = eventSlot?.endTime || 'TBD';
  const countdownLabel = timeLeft.phase === 'upcoming' ? 'Starts In' : timeLeft.phase === 'live' ? 'Ends In' : 'Session Finished';
  const reminderText = timeLeft.phase === 'live'
    ? `${upcomingShoot.title} at ${venue} is live now and ends in ${timeLeft.totalMinutes} minutes.`
    : `${upcomingShoot.title} at ${venue} starts in ${timeLeft.totalMinutes} minutes. Prepare camera gear and check route.`;

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
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
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
                style={{ width: `${timeLeft.progressPercent}%` }}
              />
            </div>

            <span className="text-xs font-bold text-zinc-400 block pt-0.5">
              {countdownLabel} • {timeLeft.statusLabel}
            </span>
          </div>

          <div className="text-right space-y-1">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">Start - End</span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-white block">
                {shootTime} <span className="text-zinc-500 font-medium mx-0.5">-</span> {endTime}
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold block truncate max-w-[130px] bg-emerald-400/10 px-2 py-0.5 rounded-md inline-block">
              {upcomingShoot.category}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue)}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open Google Maps for ${venue}`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white shadow-xs transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 active:scale-95"
          >
            <Navigation className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Attached live notification banner */}
      <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200/80 shadow-xs flex items-center space-x-3 text-zinc-900 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-black shrink-0 shadow-xs">
          <Camera className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-900">Session Live Tracker</h4>
            <span className="text-[10px] text-zinc-500 font-medium">Live</span>
          </div>
          <p className="text-xs text-zinc-700 font-medium mt-0.5 truncate">
            {reminderText}
          </p>
        </div>
      </div>
    </div>
  );
};
