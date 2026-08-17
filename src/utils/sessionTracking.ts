import { Shoot, ShootEventSlot, ShootStatus } from '../types/shoot';

export type SessionPhase = 'upcoming' | 'live' | 'finished';

export interface SessionTrackerState {
  event: ShootEventSlot;
  startsAt: number;
  endsAt: number;
  phase: SessionPhase;
  progressPercent: number;
  statusLabel: string;
  timeLabel: string;
  rangeLabel: string;
}

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const parseDateTime = (date: string, time: string, fallbackTime: string) => {
  const safeTime = time || fallbackTime;
  const parsed = new Date(`${date}T${safeTime}:00`).getTime();
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const formatDuration = (milliseconds: number) => {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / MINUTE_MS));

  if (totalMinutes >= 24 * 60) {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${totalMinutes}m`;
};

export const getSessionWindow = (event: ShootEventSlot) => {
  const startsAt = parseDateTime(event.date, event.startTime, '09:00');
  let endsAt = parseDateTime(event.date, event.endTime, '');

  if (!event.endTime) {
    endsAt = startsAt + (4 * HOUR_MS);
  } else if (endsAt <= startsAt) {
    endsAt += 24 * HOUR_MS;
  }

  return { startsAt, endsAt };
};

export const getSessionTrackerState = (
  event: ShootEventSlot,
  nowMs = Date.now(),
): SessionTrackerState => {
  const { startsAt, endsAt } = getSessionWindow(event);
  const duration = Math.max(MINUTE_MS, endsAt - startsAt);

  if (nowMs < startsAt) {
    return {
      event,
      startsAt,
      endsAt,
      phase: 'upcoming',
      progressPercent: 0,
      statusLabel: 'Upcoming',
      timeLabel: `Starts in ${formatDuration(startsAt - nowMs)}`,
      rangeLabel: `${event.startTime || '09:00'} - ${event.endTime || 'TBD'}`,
    };
  }

  if (nowMs > endsAt) {
    return {
      event,
      startsAt,
      endsAt,
      phase: 'finished',
      progressPercent: 100,
      statusLabel: 'Finished',
      timeLabel: `Ended ${formatDuration(nowMs - endsAt)} ago`,
      rangeLabel: `${event.startTime || '09:00'} - ${event.endTime || 'TBD'}`,
    };
  }

  return {
    event,
    startsAt,
    endsAt,
    phase: 'live',
    progressPercent: Math.min(100, Math.max(1, Math.round(((nowMs - startsAt) / duration) * 100))),
    statusLabel: 'Live Now',
    timeLabel: `Ends in ${formatDuration(endsAt - nowMs)}`,
    rangeLabel: `${event.startTime || '09:00'} - ${event.endTime || 'TBD'}`,
  };
};

export const getShootSessionStates = (shoot: Shoot, nowMs = Date.now()) => {
  const eventSlots = shoot.events?.length
    ? shoot.events
    : [{
      id: `${shoot.id}-primary`,
      name: 'Main Shoot Session',
      date: shoot.primaryDate,
      startTime: '09:00',
      endTime: '17:00',
      venue: shoot.location || 'Studio',
      allocatedIncome: shoot.totalAmount,
    }];

  return eventSlots
    .map((event) => getSessionTrackerState(event, nowMs))
    .sort((a, b) => a.startsAt - b.startsAt);
};

export const getAutomaticShootStatus = (shoot: Shoot, nowMs = Date.now()): ShootStatus => {
  if (shoot.isDataCleared || shoot.status === 'data_cleared') {
    return 'data_cleared';
  }

  if (shoot.deliveredAt || shoot.status === 'delivered') {
    return 'delivered';
  }

  const sessions = getShootSessionStates(shoot, nowMs);
  const firstSession = sessions[0];
  const lastSession = sessions[sessions.length - 1];

  if (!firstSession || !lastSession) {
    return shoot.status;
  }

  if (nowMs < firstSession.startsAt) {
    return 'booked';
  }

  if (nowMs <= lastSession.endsAt) {
    return 'in_progress';
  }

  return 'editing';
};
