
import React from 'react';
import { Shift, ShiftColorMap } from '../types';
import { WEEKDAYS } from '../constants';

interface WidgetViewProps {
  currentDate: Date;
  shifts: Shift[];
  shiftColors: ShiftColorMap;
  onEditShift: (shift: Shift) => void;
  onAddShift: (date: Date) => void;
}

const WidgetView: React.FC<WidgetViewProps> = ({ currentDate, shifts, shiftColors, onEditShift, onAddShift }) => {
  const realToday = new Date();
  
  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Reality indicators (always fixed to actual current time)
  const realTodayStr = getLocalDateString(realToday);
  const realTomorrowStr = getLocalDateString(new Date(realToday.getTime() + 24 * 60 * 60 * 1000));
  
  const todayShift = shifts.find(s => s.date === realTodayStr);
  const tomorrowShift = shifts.find(s => s.date === realTomorrowStr);

  // Month-dependent data (based on navigation)
  const targetYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const monthShifts = shifts
    .filter(s => s.date.startsWith(targetYearMonth))
    .sort((a, b) => a.date.localeCompare(b.date));

  const renderShiftCard = (shift: Shift | undefined, title: string, date: Date) => {
    const colors = shift ? shiftColors[shift.type] : null;
    
    return (
      <div 
        onClick={() => shift ? onEditShift(shift) : onAddShift(date)}
        className="flex-1 bg-slate-900/30 border border-slate-800 rounded-3xl p-4 md:p-6 transition-all hover:bg-slate-900/50 cursor-pointer group active:scale-[0.98] min-w-0"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-4">
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">{title}</span>
          <span className="text-[10px] md:text-xs font-bold text-slate-500">
            {date.getMonth() + 1}/{date.getDate()} ({WEEKDAYS[date.getDay()]})
          </span>
        </div>
        
        {shift ? (
          <div>
            <div 
              className="inline-block px-2 py-0.5 rounded-lg text-[9px] md:text-[10px] font-black mb-2"
              style={{ backgroundColor: colors?.bg, color: colors?.text }}
            >
              {shift.type}
            </div>
            <div className="text-lg md:text-2xl font-black text-white tracking-tighter truncate">
              {shift.startTime || '--:--'} <span className="text-slate-600 text-sm md:text-lg mx-0.5">-</span> {shift.endTime || '--:--'}
            </div>
            {shift.note && (
              <p className="mt-2 text-[10px] md:text-xs text-slate-500 line-clamp-1 italic">
                {shift.note}
              </p>
            )}
          </div>
        ) : (
          <div className="h-16 md:h-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/30 rounded-2xl group-hover:border-blue-500/20 transition-colors">
            <span className="text-xs md:text-sm font-bold text-slate-700 group-hover:text-blue-500/40">予定なし</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Reality section - Today and Tomorrow always visible */}
      <div className="flex flex-row gap-3 md:gap-6">
        {renderShiftCard(todayShift, "Today", realToday)}
        {renderShiftCard(tomorrowShift, "Tomorrow", new Date(realToday.getTime() + 24 * 60 * 60 * 1000))}
      </div>

      {/* Monthly Stats Summary - Now month dependent */}
      <div className="bg-slate-900/10 border border-slate-800/50 p-4 md:p-6 rounded-[2rem]">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          {currentDate.getMonth() + 1}月の集計
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['早番', '日勤', '夜勤', '休日'].map(type => {
            const count = monthShifts.filter(s => s.type === type).length;
            const colors = shiftColors[type];
            return (
              <div key={type} className="bg-black/20 border border-slate-800/30 p-4 rounded-2xl text-center">
                <div className="text-[10px] font-black text-slate-600 mb-1">{type}</div>
                <div className="text-xl md:text-2xl font-black" style={{ color: colors?.text }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule List for the selected month */}
      <div className="bg-slate-900/10 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
          {currentDate.getMonth() + 1}月のスケジュール
        </h3>
        
        <div className="space-y-3">
          {monthShifts.length > 0 ? (
            monthShifts.map(shift => {
              const d = new Date(shift.date);
              const colors = shiftColors[shift.type];
              return (
                <div 
                  key={shift.id}
                  onClick={() => onEditShift(shift)}
                  className="flex items-center justify-between p-4 bg-black/20 border border-slate-800/50 rounded-2xl hover:border-slate-700 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[2.5rem]">
                      <div className={`text-[9px] font-black uppercase leading-none ${d.getDay() === 0 ? 'text-rose-500' : d.getDay() === 6 ? 'text-blue-500' : 'text-slate-600'}`}>
                        {WEEKDAYS[d.getDay()]}
                      </div>
                      <div className="text-xl font-black text-white leading-none mt-1">{d.getDate()}</div>
                    </div>
                    <div 
                      className="px-2.5 py-1 rounded-lg text-[10px] font-black"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {shift.type}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-300">
                      {shift.startTime && shift.endTime ? `${shift.startTime} - ${shift.endTime}` : '時間未設定'}
                    </div>
                    {shift.note && (
                      <div className="text-[10px] font-bold text-slate-600 truncate max-w-[120px]">
                        {shift.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-700 font-bold border-2 border-dashed border-slate-900/50 rounded-2xl">
              この月の予定はありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetView;
