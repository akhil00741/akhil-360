import React, { useState, useMemo, useRef } from 'react';
import { useShoots } from '../context/useShoots';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
  MapPin, Plus, Upload, CheckCircle2
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
    <div className="space-y-6 pb-24">
      
      {/* Calendar Header & Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Shoot Schedule & Timeline
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Time-to-time basis events & daily shoot income breakdown
          </p>
        </div>

        {/* Action Controls: Apple Calendar Sync & Month Stepper */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Apple Calendar Live Auto-Sync */}
          <button
            onClick={onOpenAppleSync || handleExportAppleCal}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-ios-blue/15 hover:bg-blue-100 border border-blue-200 dark:border-ios-blue/30 text-xs font-bold text-ios-blue shadow-xs transition-colors"
            title="Apple Calendar Live Auto-Sync"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Apple Cal Auto-Sync</span>
          </button>

          {/* Import from Apple Calendar */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-sm transition-colors"
            title="Import .ics file from Apple Calendar"
          >
            <Upload className="w-3.5 h-3.5 text-purple-600" />
            <span>Import .ics</span>
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
            className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50"
          >
            Today
          </button>
          
          <div className="flex items-center space-x-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-zinc-900 dark:text-white px-2">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Calendar Month Grid (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-3xl ios-glass-card space-y-3">
          
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
                  className={`min-h-[66px] sm:min-h-[74px] p-1.5 rounded-2xl flex flex-col justify-between text-left transition-all relative ${
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
                    <div className="space-y-0.5 mt-1 overflow-hidden">
                      {dayShoots.slice(0, 1).map((s) => (
                        <div
                          key={s.id}
                          className={`text-[9px] font-bold truncate px-1 py-0.2 rounded ${
                            isSelected ? 'bg-black/20 text-white' : 'bg-blue-50 dark:bg-ios-blue/20 text-ios-blue dark:text-ios-teal border border-blue-100 dark:border-ios-blue/30'
                          }`}
                        >
                          {s.title.split(' ')[0]}
                        </div>
                      ))}
                      {dayShoots.length > 1 && (
                        <span className={`text-[8px] font-mono font-bold block ${isSelected ? 'text-white/90' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          +{dayShoots.length - 1} more
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day's Detailed Time-to-Time Breakdown */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-3xl ios-glass-card space-y-4 flex flex-col justify-between">
          
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

                  return (
                    <div
                      key={shoot.id}
                      onClick={() => setSelectedShoot(shoot)}
                      className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 cursor-pointer space-y-3 transition-all group"
                    >
                      {/* Shoot Title & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                              {shoot.category}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              shoot.shootType === 'own' ? 'text-ios-blue' : 'text-purple-600 dark:text-purple-400'
                            }`}>
                              {shoot.shootType === 'own' ? 'Own Shoot' : `3rd Party: ${shoot.agencyName || 'Agency'}`}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-1 group-hover:text-ios-blue transition-colors">
                            {shoot.title}
                          </h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Client: {shoot.clientName}</p>
                        </div>

                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(shoot.totalAmount)}
                        </span>
                      </div>

                      {/* Time-to-Time Slots & Allocated Income */}
                      {dayEvents.length > 0 ? (
                        <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800/60">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                            Time Slots for Today:
                          </span>
                          {dayEvents.map((evt) => (
                            <div
                              key={evt.id}
                              className="p-2.5 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs shadow-xs"
                            >
                              <div>
                                <p className="font-bold text-zinc-900 dark:text-white">{evt.name}</p>
                                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1 mt-0.5 font-medium">
                                  <Clock className="w-3 h-3 text-ios-blue" />
                                  {evt.startTime} - {evt.endTime} • {evt.venue}
                                </p>
                              </div>
                              {evt.allocatedIncome ? (
                                <div className="text-right">
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
                        <div className="text-xs text-zinc-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span>{shoot.location}</span>
                        </div>
                      )}
                    </div>
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
