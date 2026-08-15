import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLOUD_DB_URL = 'https://api.restful-api.dev/objects/ff8081819ff5b11001a003b9052f218f';

// Format Date for iCal UTC
const formatToICalDate = (dateStr: string, timeStr = '09:00'): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const cloudRes = await fetch(CLOUD_DB_URL, { cache: 'no-store' });
    const json = await cloudRes.json();
    const shoots = json.data?.shoots || [];
    const deletedIds = new Set(json.data?.deletedIds || []);

    const activeShoots = shoots.filter((s: any) => !deletedIds.has(s.id));

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AKHIL 360//Photography Studio Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:AKHIL 360 Shoots (Live Feed)',
      'X-WR-TIMEZONE:Asia/Kolkata',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1M',
      'X-PUBLISHED-TTL:PT1M',
    ];

    activeShoots.forEach((shoot: any) => {
      if (shoot.events && shoot.events.length > 0) {
        shoot.events.forEach((evt: any) => {
          const dtStart = formatToICalDate(evt.date || shoot.primaryDate, evt.startTime || '09:00');
          const dtEnd = formatToICalDate(evt.date || shoot.primaryDate, evt.endTime || '13:00');
          const uid = `${shoot.id}-${evt.id}@akhil360.com`;

          lines.push('BEGIN:VEVENT');
          lines.push(`UID:${uid}`);
          lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
          lines.push(`DTSTART:${dtStart}`);
          lines.push(`DTEND:${dtEnd}`);
          lines.push(`SUMMARY:📸 ${shoot.category || 'Shoot'}: ${shoot.title} (${evt.name || 'Session'})`);
          lines.push(`DESCRIPTION:Client: ${shoot.clientName || 'Client'}\\nPhone: ${shoot.clientPhone || ''}\\nVenue: ${evt.venue || shoot.location || 'Studio'}\\nTotal: ₹${shoot.totalAmount || 0}`);
          lines.push(`LOCATION:${evt.venue || shoot.location || 'Studio'}`);
          lines.push('STATUS:CONFIRMED');

          // 4-Hour Early Route Alarm
          lines.push('BEGIN:VALARM');
          lines.push('ACTION:DISPLAY');
          lines.push(`DESCRIPTION:🚦 AKHIL 360 (4-Hour Alert): Prepare camera gear & check traffic for ${shoot.title}`);
          lines.push('TRIGGER:-PT4H');
          lines.push('END:VALARM');

          // 2-Hour Beat the Traffic Alarm
          lines.push('BEGIN:VALARM');
          lines.push('ACTION:DISPLAY');
          lines.push(`DESCRIPTION:🚗 AKHIL 360 (2-Hour Alert): Start driving now to beat the traffic for ${shoot.title}!`);
          lines.push('TRIGGER:-PT2H');
          lines.push('END:VALARM');

          lines.push('END:VEVENT');
        });
      } else {
        const dtStart = formatToICalDate(shoot.primaryDate, '09:00');
        const dtEnd = formatToICalDate(shoot.primaryDate, '18:00');
        const uid = `${shoot.id}@akhil360.com`;

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
        lines.push(`DTSTART:${dtStart}`);
        lines.push(`DTEND:${dtEnd}`);
        lines.push(`SUMMARY:📸 ${shoot.category || 'Shoot'}: ${shoot.title}`);
        lines.push(`DESCRIPTION:Client: ${shoot.clientName}\\nPhone: ${shoot.clientPhone}\\nTotal: ₹${shoot.totalAmount}`);
        lines.push(`LOCATION:${shoot.location || 'Studio'}`);
        lines.push('STATUS:CONFIRMED');

        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:🚦 AKHIL 360: 4 Hours until ${shoot.title}. Check traffic to ${shoot.location}.`);
        lines.push('TRIGGER:-PT4H');
        lines.push('END:VALARM');

        lines.push('END:VEVENT');
      }
    });

    lines.push('END:VCALENDAR');
    const icsContent = lines.join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="calendar.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).send(icsContent);
  } catch (err: any) {
    console.error('Calendar generation error:', err);
    return res.status(500).json({ error: 'Failed to generate live calendar' });
  }
}
