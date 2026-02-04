
import React, { useMemo } from 'react';
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
  
  const monthShifts = useMemo(() => 
    shifts.filter(s => s.date.startsWith(targetYearMonth)),
    [shifts, targetYearMonth]
  );

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(shiftColors).forEach(type => {
      counts[type] = monthShifts.filter(s => s.type === type).length;
    });
    return counts;
  }, [monthShifts, shiftColors]);

  // Fix: Explicitly type acc and curr as number to avoid 'unknown' operator errors
  const totalShifts = useMemo<number>(() => 
    Object.values(stats).reduce((acc: number, curr: number) => acc + curr, 0),
    [stats]
  );

  // Pie Chart SVG Generation
  const pieSlices = useMemo(() => {
    if (totalShifts === 0) return [];
    
    let cumulativePercent = 0;
    // Fix: Explicitly cast Object.entries to ensure type safety in filter/map
    return (Object.entries(stats) as [string, number][])
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => {
        const percent = count / totalShifts;
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += percent;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        const largeArcFlag = percent > 0.5 ? 1 : 0;
        const pathData = [
          `M ${startX} ${startY}`, // Move
          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
          `L 0 0`, // Line to center
        ].join(' ');
        
        return { type, pathData, color: shiftColors[type].text, percent: Math.round(percent * 100) };
      });
  }, [stats, totalShifts, shiftColors]);

  function getCoordinatesForPercent(percent: number) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

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

      {/* Monthly Stats Summary */}
      <div className="bg-slate-900/10 border border-slate-800/50 p-4 md:p-6 rounded-[2rem] shadow-xl">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          {currentDate.getMonth() + 1}月の集計
        </h3>
        
        {/* Changed grid-cols-2 sm:grid-cols-3 md:grid-cols-4 to grid-cols-3 consistently */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {Object.entries(stats).map(([type, count]) => {
            const colors = shiftColors[type];
            return (
              <div key={type} className="bg-black/20 border border-slate-800/30 p-2.5 md:p-4 rounded-2xl text-center transition-all hover:border-slate-700">
                <div className="text-[9px] md:text-[10px] font-black text-slate-600 mb-1 truncate">{type}</div>
                <div className="text-lg md:text-3xl font-black" style={{ color: colors?.text }}>{count}</div>
              </div>
            );
          })}
        </div>

        {/* Shift Distribution Chart */}
        <div className="border-t border-slate-800/50 pt-8">
          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 text-center">シフト割合</h4>
          
          {totalShifts > 0 ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="relative w-48 h-48 md:w-56 md:h-56">
                <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full drop-shadow-2xl">
                  {pieSlices.map((slice, i) => (
                    <path
                      key={slice.type}
                      d={slice.pathData}
                      fill={slice.color}
                      className="transition-all duration-500 hover:opacity-80 hover:scale-[1.05] cursor-pointer"
                      style={{ transformOrigin: '0 0' }}
                    />
                  ))}
                  {/* Hollow center for donut feel */}
                  <circle cx="0" cy="0" r="0.6" fill="#0c111c" className="pointer-events-none" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl md:text-3xl font-black text-white leading-none">{totalShifts}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Total</span>
                </div>
              </div>

              <div className="flex flex-wrap md:flex-col gap-3 justify-center max-w-sm">
                {pieSlices.map((slice) => (
                  <div key={slice.type} className="flex items-center gap-2 bg-black/30 border border-slate-800/50 px-3 py-1.5 rounded-xl">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                    <span className="text-[10px] font-black text-slate-300">{slice.type}</span>
                    <span className="text-[10px] font-bold text-slate-500 ml-auto">{slice.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-700 italic border-2 border-dashed border-slate-800/30 rounded-3xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-20"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              <p className="text-sm">データがありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetView;
