import { Shoot, ShootEventSlot } from '../types/shoot';

// Helper to format date to iCal Local Time (YYYYMMDDTHHmmss) without UTC offset shifting
const formatToICalDate = (dateStr: string, timeStr = '09:00'): string => {
  if (!dateStr) return '20260815T090000';
  const parts = dateStr.split('-');
  const timeParts = (timeStr || '09:00').split(':');
  
  const y = parts[0] || '2026';
  const m = (parts[1] || '08').padStart(2, '0');
  const d = (parts[2] || '15').padStart(2, '0');
  const hh = (timeParts[0] || '09').padStart(2, '0');
  const mm = (timeParts[1] || '00').padStart(2, '0');

  return `${y}${m}${d}T${hh}${mm}00`;
};

// Generate iCal string with accurate local time and 4-Hour / 2-Hour Alarms
export const generateICalendar = (shoots: Shoot[], calendarTitle = 'AKHIL 360 Photography Shoots'): string => {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AKHIL 360//Photography Studio//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarTitle}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  shoots.forEach((shoot) => {
    // If shoot has specific events, create VEVENT for each slot
    if (shoot.events && shoot.events.length > 0) {
      shoot.events.forEach((evt) => {
        const dtStart = formatToICalDate(evt.date || shoot.primaryDate, evt.startTime || '09:00');
        const dtEnd = formatToICalDate(evt.date || shoot.primaryDate, evt.endTime || '13:00');
        const uid = `${shoot.id}-${evt.id}@akhil360.com`;

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
        lines.push(`DTSTART;TZID=Asia/Kolkata:${dtStart}`);
        lines.push(`DTEND;TZID=Asia/Kolkata:${dtEnd}`);
        lines.push(`SUMMARY:📸 ${shoot.category}: ${shoot.title} (${evt.name})`);
        lines.push(`DESCRIPTION:Client: ${shoot.clientName}\\nPhone: ${shoot.clientPhone}\\nVenue: ${evt.venue || shoot.location}\\nTotal: ₹${shoot.totalAmount}\\nAdvance Paid: ₹${shoot.advanceAmount}\\nBalance Due: ₹${shoot.balanceAmount}\\nwfolio: ${shoot.wfolioUrl || 'None'}`);
        lines.push(`LOCATION:${evt.venue || shoot.location || 'Studio'}`);
        lines.push('STATUS:CONFIRMED');

        // 4-Hour Early Traffic & Preparation Alarm for iPhone
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:🚦 AKHIL 360 (4-Hour Alert): Prepare camera gear and check live traffic for ${shoot.title} at ${evt.venue || shoot.location}`);
        lines.push('TRIGGER:-PT4H');
        lines.push('END:VALARM');

        // 2-Hour "Beat the Traffic" Departure Alarm
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:🚗 AKHIL 360 (2-Hour Alert): Time to start driving to beat the traffic for ${shoot.title}!`);
        lines.push('TRIGGER:-PT2H');
        lines.push('END:VALARM');

        // 1-Hour Final Countdown Alarm
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:⏰ AKHIL 360 (1-Hour Alert): 1 hour remaining until ${shoot.title} shoot starts.`);
        lines.push('TRIGGER:-PT1H');
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
      lines.push(`DTSTART;TZID=Asia/Kolkata:${dtStart}`);
      lines.push(`DTEND;TZID=Asia/Kolkata:${dtEnd}`);
      lines.push(`SUMMARY:📸 ${shoot.category}: ${shoot.title}`);
      lines.push(`DESCRIPTION:Client: ${shoot.clientName}\\nPhone: ${shoot.clientPhone}\\nVenue: ${shoot.location}\\nTotal: ₹${shoot.totalAmount}\\nAdvance Paid: ₹${shoot.advanceAmount}\\nBalance: ₹${shoot.balanceAmount}\\nwfolio: ${shoot.wfolioUrl || 'None'}`);
      lines.push(`LOCATION:${shoot.location || 'Studio'}`);
      lines.push('STATUS:CONFIRMED');

      // 4-Hour Alarm
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:🚦 AKHIL 360 (4-Hour Alert): 4 hours until ${shoot.title}. Check traffic to ${shoot.location}.`);
      lines.push('TRIGGER:-PT4H');
      lines.push('END:VALARM');

      // 2-Hour Alarm
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:🚗 AKHIL 360 (2-Hour Alert): Start now to beat the traffic for ${shoot.title}!`);
      lines.push('TRIGGER:-PT2H');
      lines.push('END:VALARM');

      lines.push('END:VEVENT');
    }
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

// Trigger download / open in Apple Calendar
export const downloadAppleCalendar = (shoots: Shoot[], filename = 'AKHIL_360_Apple_Calendar.ics') => {
  const icsData = generateICalendar(shoots);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Parse an Apple Calendar (.ics) file to extract reservations and shoots
export const parseAppleCalendarICS = (icsText: string): Partial<Shoot>[] => {
  const shoots: Partial<Shoot>[] = [];
  const events = icsText.split('BEGIN:VEVENT');

  for (let i = 1; i < events.length; i++) {
    const block = events[i].split('END:VEVENT')[0];
    
    const summaryMatch = block.match(/SUMMARY:(.*?)(\r\n|\n|\r)/);
    const dtStartMatch = block.match(/DTSTART.*?:(\d{8}(T\d{4,6}Z?)?)/);
    const locationMatch = block.match(/LOCATION:(.*?)(\r\n|\n|\r)/);
    const descriptionMatch = block.match(/DESCRIPTION:(.*?)(\r\n|\n|\r)/);

    const summary = summaryMatch ? summaryMatch[1].trim().replace(/^📸\s*/, '') : 'Imported Shoot';
    const location = locationMatch ? locationMatch[1].trim() : 'Location TBD';
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';

    let primaryDate = new Date().toISOString().split('T')[0];
    let startTime = '09:00';
    let endTime = '13:00';

    if (dtStartMatch) {
      const raw = dtStartMatch[1];
      const y = raw.substring(0, 4);
      const m = raw.substring(4, 6);
      const d = raw.substring(6, 8);
      primaryDate = `${y}-${m}-${d}`;

      if (raw.includes('T')) {
        const tIndex = raw.indexOf('T');
        startTime = `${raw.substring(tIndex + 1, tIndex + 3)}:${raw.substring(tIndex + 3, tIndex + 5)}`;
      }
    }

    shoots.push({
      title: summary,
      category: 'Wedding',
      shootType: 'own',
      clientName: summary.split(':')[0] || 'Client from Apple Calendar',
      clientPhone: '+91 ',
      location,
      primaryDate,
      totalAmount: 30000,
      advanceAmount: 0,
      balanceAmount: 30000,
      paymentStatus: 'unpaid',
      status: 'booked',
      events: [
        {
          id: `evt-${Date.now()}-${i}`,
          name: summary,
          date: primaryDate,
          startTime,
          endTime,
          venue: location,
          allocatedIncome: 30000,
        },
      ],
      notes: `Imported from Apple Calendar: ${description}`,
    });
  }

  return shoots;
};
