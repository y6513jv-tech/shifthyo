
import React, { useMemo } from 'react';
import { Shift, ShiftType, ShiftColorMap, UITheme } from '../types';
import { WEEKDAYS, Icons } from '../constants';
import { getJapaneseHolidays } from '../utils/holidayUtils';

interface CalendarProps {
  currentDate: Date;
  shifts: Shift[];
  shiftColors: ShiftColorMap;
  uiTheme: UITheme;
  onDateClick: (date: Date) => void;
  onEditShift: (shift: Shift) => void;
  selectedDate: Date | null;
}

const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  shifts,
  shiftColors,
  uiTheme,
  onDateClick,
  onEditShift,
  selectedDate
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const holidays = useMemo(() => getJapaneseHolidays(year, month + 1), [year, month]);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Calculate total cells needed to complete the grid rows (multiples of 7)
  const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
  
  const days = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < startingDayOfWeek || i >= startingDayOfWeek + daysInMonth) {
      days.push(null);
    } else {
      days.push(new Date(year, month, i - startingDayOfWeek + 1));
    }
  }

  // Helper to get YYYY-MM-DD in local time
  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getShiftsForDate = (dateStr: string) => {
    return shifts.filter(s => s.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <div 
      className="rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-700 backdrop-blur-sm border"
      style={{ backgroundColor: uiTheme.cellBg, borderColor: uiTheme.borderColor }}
    >
      <div 
        className="grid grid-cols-7 border-b bg-black/10"
        style={{ borderColor: uiTheme.borderColor }}
      >
        {WEEKDAYS.map((day, idx) => {
          let color = uiTheme.headerColor;
          if (idx === 0) color = uiTheme.sunColor;
          if (idx === 6) color = uiTheme.satColor;
          return (
            <div 
              key={day} 
              className="py-4 text-center text-xs md:text-sm font-black uppercase tracking-widest"
              style={{ color }}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          const isLastInRow = (index + 1) % 7 === 0;
          const borderStyle = { 
            borderColor: uiTheme.borderColor,
            borderBottomWidth: '1px',
            borderRightWidth: isLastInRow ? '0px' : '1px'
          };

          if (!date) {
            return (
              <div 
                key={`empty-${index}`} 
                className="min-h-[85px] md:min-h-[160px] bg-black/5" 
                style={borderStyle}
              />
            );
          }

          const dateStr = getLocalDateString(date);
          const holidayName = holidays[dateStr];
          const isHoliday = !!holidayName;
          const dayShifts = getShiftsForDate(dateStr);
          const currentDayIsToday = isToday(date);
          const currentDayIsSelected = isSelected(date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const hasNote = dayShifts.some(s => s.note && s.note.trim() !== '');

          // Text color logic
          let dateTextColor = uiTheme.dateColor;
          if (date.getDay() === 0 || isHoliday) dateTextColor = uiTheme.sunColor;
          if (date.getDay() === 6 && !isHoliday) dateTextColor = uiTheme.satColor;

          return (
            <div 
              key={dateStr}
              onClick={() => onDateClick(date)}
              className={`group min-h-[85px] md:min-h-[160px] p-1.5 md:p-3 hover:bg-white/5 transition-all cursor-pointer relative select-none flex flex-col ${currentDayIsSelected ? 'bg-blue-600/10' : ''}`}
              style={borderStyle}
            >
              {/* Note indicator in top right */}
              {hasNote && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-400/80 rounded-full z-10" />
              )}

              <div className="flex flex-col items-start mb-1">
                <div className="flex items-start justify-between w-full">
                  <span 
                    className={`inline-flex items-center justify-center w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl text-sm md:text-xl font-black transition-all ${
                      currentDayIsToday 
                      ? 'bg-blue-600 !text-white shadow-lg shadow-blue-500/30' 
                      : ''
                    } ${currentDayIsSelected && !currentDayIsToday ? 'ring-2 ring-blue-500/50' : ''}`}
                    style={!currentDayIsToday ? { color: dateTextColor } : {}}
                  >
                    {date.getDate()}
                  </span>
                </div>
                
                {isHoliday && (
                  <span className="text-[7px] md:text-[9px] font-bold mt-0.5 truncate max-w-full" style={{ color: uiTheme.sunColor }}>
                    {holidayName}
                  </span>
                )}
              </div>

              {/* Spacer to push shifts to the bottom */}
              <div className="flex-grow" />

              <div className="flex flex-col gap-0.5 md:gap-1 mt-1">
                {dayShifts.map(s => {
                  const colors = shiftColors[s.type];
                  return (
                    <div 
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditShift(s);
                      }}
                      className="px-1 md:px-2 py-0.5 md:py-1 text-[8px] md:text-[10px] rounded-md md:rounded-lg border font-black shadow-sm transition-all hover:scale-[1.03] active:scale-95"
                      style={{ 
                        backgroundColor: colors?.bg, 
                        color: colors?.text,
                        borderColor: colors ? `${colors.text}40` : '#1e293b'
                      }}
                    >
                      <div className="flex justify-between items-center overflow-hidden">
                        <span className="tracking-tighter truncate">{s.type}</span>
                        {s.startTime && <span className="hidden sm:inline text-[7px] md:text-[8px] opacity-70 font-bold ml-1">{s.startTime}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className={`absolute inset-0 border-2 transition-all pointer-events-none rounded-[1rem] m-0.5 ${currentDayIsSelected ? 'border-blue-500/40' : 'border-blue-500/0 group-hover:border-blue-500/5'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
