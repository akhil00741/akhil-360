import React, { useState, useMemo, useRef } from 'react';
import { useShoots } from '../context/useShoots';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
  MapPin, Plus, Upload, CheckCircle2, UserRound
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { Shoot } from '../types/shoot';
import { downloadAppleCalendar, parseAppleCalendarICS } from '../utils/calendarSync';

interface CalendarViewProps {
  onOpenAppleSync?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenAppleSync }) => {
  const { shoots, setSelectedShoot, setIsCreateModalOpen, importShoots } = useShoots();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Index shoots by date
  const shootsByDate = useMemo(() => {
    const map = new Map<string, Shoot[]>();
    shoots.forEach((shoot) => {
      const d = shoot.primaryDate;
      if (!map.has(d)) {
        map.set(d, []);
      }
      map.get(d)!.push(shoot);

      shoot.events?.forEach((evt) => {
        if (evt.date && evt.date !== d) {
          if (!map.has(evt.date)) {
            map.set(evt.date, []);
          }
          if (!map.get(evt.date)!.some(s => s.id === shoot.id)) {
            map.get(evt.date)!.push(shoot);
          }
        }
      });
    });
    return map;
  }, [shoots]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const shootsForSelectedDate = useMemo(
    () => shootsByDate.get(selectedDateStr) || [],
    [shootsByDate, selectedDateStr]
  );

  // Calculate day total allocated income
  const selectedDayTotalIncome = useMemo(() => {
    return shootsForSelectedDate.reduce((total, shoot) => {
      const dayEvents = shoot.events?.filter(e => e.date === selectedDateStr) || [];
      if (dayEvents.length > 0) {
        const eventsIncome = dayEvents.reduce((sum, e) => sum + (e.allocatedIncome || 0), 0);
        return total + (eventsIncome > 0 ? eventsIncome : shoot.totalAmount);
      }
      return total + shoot.totalAmount;
    }, 0);
  }, [shootsForSelectedDate, selectedDateStr]);

  const handleExportAppleCal = () => {
    downloadAppleCalendar(shoots);
  };

  const handleImportICSFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseAppleCalendarICS(text);
        if (parsed.length > 0) {
          importShoots(parsed);
          setImportSuccessMsg(`Successfully imported ${parsed.length} reservations from Apple Calendar!`);
          setTimeout(() => setImportSuccessMsg(null), 4000);
        } else {
          alert('Could not find any calendar events in the selected file.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 pb-24">
      
      {/* Calendar Header & Month Navigation */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Calendar
          </h2>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {format(currentMonth, 'MMMM yyyy')} • {shootsForSelectedDate.length} shoot{shootsForSelectedDate.length === 1 ? '' : 's'} on selected day
          </p>
        </div>

        {/* Action Controls: Apple Calendar Sync & Month Stepper */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Apple Calendar Live Auto-Sync */}
          <button
            onClick={onOpenAppleSync || handleExportAppleCal}
            className="inline-flex min-h-11 items-center space-x-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-ios-blue shadow-xs transition-colors hover:bg-blue-100 dark:bg-ios-blue/15 dark:border-ios-blue/30"
            title="Apple Calendar Live Auto-Sync"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Sync Calendar</span>
          </button>

          {/* Import from Apple Calendar */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-11 items-center space-x-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-300"
            title="Import .ics file from Apple Calendar"
          >
            <Upload className="w-3.5 h-3.5 text-purple-600" />
            <span>Import ICS</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportICSFile}
            accept=".ics,text/calendar"
            className="hidden"
          />

          <button
            onClick={() => setSelectedDate(new Date())}
            className="min-h-11 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
          >
            Today
          </button>
          
          <div className="flex min-h-11 items-center space-x-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-extrabold text-zinc-900 dark:text-white">
              {format(currentMonth, 'MMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Import Success Banner */}
      {importSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{importSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Calendar Month Matrix + Day Schedule Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Calendar Month Grid (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-4 space-y-3">
          
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="text-ios-blue">Sat</span>
            <span className="text-ios-pink">Sun</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);
              const dayShoots = shootsByDate.get(dayStr) || [];
              const hasShoots = dayShoots.length > 0;

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[56px] sm:min-h-[64px] p-1.5 rounded-xl flex flex-col justify-between text-left transition-all relative ${
                    isSelected
                      ? 'bg-ios-blue text-white shadow-glow-blue scale-[1.02] border-2 border-blue-400'
                      : isCurrentDay
                      ? 'bg-blue-50 dark:bg-zinc-900 border border-ios-blue/60 text-zinc-900 dark:text-white'
                      : isCurrentMonth
                      ? 'bg-white dark:bg-zinc-950/70 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-300'
                      : 'bg-zinc-100/50 dark:bg-zinc-950/20 text-zinc-400 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold ${
                      isSelected ? 'text-white' : isCurrentDay ? 'text-ios-blue font-extrabold' : ''
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {hasShoots && (
                      <span className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-emerald-500 animate-pulse'
                      }`} />
                    )}
                  </div>

                  {/* Tiny Shoot Pills on calendar cell */}
                  {hasShoots && (
                    <div className={`mt-1 inline-flex w-fit items-center rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                      isSelected ? 'bg-black/20 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300'
                    }`}>
                      {dayShoots.length} shoot{dayShoots.length === 1 ? '' : 's'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day's Detailed Time-to-Time Breakdown */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-4 space-y-4 flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Selected Date Header with Daily Income Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[11px] font-bold text-ios-blue uppercase tracking-wider">
                  Day Schedule & Income
                </span>
                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                  {format(selectedDate, 'EEEE, dd MMMM yyyy')}
                </h3>
              </div>

              {selectedDayTotalIncome > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">Daily Income</span>
                  <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedDayTotalIncome)}
                  </span>
                </div>
              )}
            </div>

            {/* List of shoots & event time slots for the selected day */}
            <div className="space-y-3">
              {shootsForSelectedDate.length > 0 ? (
                shootsForSelectedDate.map((shoot) => {
                  const dayEvents = shoot.events?.filter(e => e.date === selectedDateStr) || [];
                  const firstDayEvent = dayEvents[0] || shoot.events?.[0];
                  const venue = firstDayEvent?.venue || shoot.location || 'Location Pending';
                  const timeLabel = firstDayEvent
                    ? `${firstDayEvent.startTime} - ${firstDayEvent.endTime}`
                    : 'Time Pending';

                  return (
                    <article
                      key={shoot.id}
                      onClick={() => setSelectedShoot(shoot)}
                      className="cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 transition-all hover:border-[#C9440A]/30 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/80 dark:hover:bg-zinc-900 group"
                    >
                      <div className="p-3.5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#C9440A]/20 bg-[#FFF4EE] text-[#B83A08]">
                            <UserRound className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                                {shoot.category}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                shoot.shootType === 'own'
                                  ? 'bg-blue-50 text-ios-blue'
                                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                              }`}>
                                {shoot.shootType === 'own' ? 'Own Shoot' : shoot.agencyName || '3rd Party'}
                              </span>
                            </div>

                            <h4 className="mt-1.5 break-words text-base font-black leading-snug text-zinc-950 transition-colors group-hover:text-[#B83A08] dark:text-white">
                              {shoot.clientName || 'Client Name Pending'}
                            </h4>
                            <p className="mt-0.5 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                              {shoot.title}
                            </p>

                            <div className="mt-2 grid gap-1 text-[11px] font-semibold text-zinc-500">
                              <span className="flex min-w-0 items-center gap-1">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-ios-blue" />
                                <span className="truncate">{timeLabel}</span>
                              </span>
                              <span className="flex min-w-0 items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                <span className="truncate">{venue}</span>
                              </span>
                            </div>
                          </div>

                          <span className="shrink-0 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(shoot.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Time-to-Time Slots & Allocated Income */}
                      {dayEvents.length > 0 ? (
                        <div className="space-y-1.5 border-t border-zinc-200 bg-white/70 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/50">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                            Today&apos;s Sessions
                          </span>
                          {dayEvents.map((evt) => (
                            <div
                              key={evt.id}
                              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-2.5 text-xs shadow-xs dark:bg-zinc-900/90 dark:border-zinc-800/80"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-zinc-900 dark:text-white">{evt.name}</p>
                                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1 mt-0.5 font-medium min-w-0">
                                  <Clock className="w-3 h-3 text-ios-blue" />
                                  <span className="truncate">{evt.startTime} - {evt.endTime} • {evt.venue}</span>
                                </p>
                              </div>
                              {evt.allocatedIncome ? (
                                <div className="shrink-0 pl-2 text-right">
                                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                    {formatCurrency(evt.allocatedIncome)}
                                  </span>
                                  <span className="text-[9px] text-zinc-500 block font-semibold">Slot Income</span>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border-t border-zinc-200 bg-white/70 p-3 text-xs text-zinc-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span>{shoot.location}</span>
                        </div>
                      )}
                    </article>
                  );
                })
              ) : (
                <div className="py-12 text-center space-y-2">
                  <CalendarIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">No shoots scheduled for this day.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Add Shoot on this date */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-zinc-900 hover:bg-black dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-white shadow-md transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Shoot for {format(selectedDate, 'dd MMM')}</span>
          </button>

        </div>

      </div>

    </div>
  );
};
