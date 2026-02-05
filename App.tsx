
import React, { useState, useEffect, useRef } from 'react';
import Calendar from './components/Calendar';
import WidgetView from './components/WidgetView';
import ShiftModal from './components/ShiftModal';
import SettingsModal from './components/SettingsModal';
import BannerAd from './components/BannerAd';
import { Shift, ShiftType, ShiftColorMap, UITheme } from './types';
import { Icons, DEFAULT_SHIFT_COLORS, DEFAULT_BACKGROUND, DEFAULT_UI_THEME } from './constants';

type ViewMode = 'calendar' | 'widget';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftColors, setShiftColors] = useState<ShiftColorMap>(DEFAULT_SHIFT_COLORS);
  const [uiTheme, setUiTheme] = useState<UITheme>(DEFAULT_UI_THEME);
  const [appBackground, setAppBackground] = useState(DEFAULT_BACKGROUND);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Swipe logic
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const swipeThreshold = 50; // pixels

  // Batch Edit Mode States
  const [isBatchEditMode, setIsBatchEditMode] = useState(false);
  const [activeStamp, setActiveStamp] = useState<ShiftType>(ShiftType.DAY);

  // Load from localStorage
  useEffect(() => {
    const savedShifts = localStorage.getItem('shifts');
    if (savedShifts) {
      try { setShifts(JSON.parse(savedShifts)); } catch (e) { console.error(e); }
    }

    const savedColors = localStorage.getItem('shiftColors');
    if (savedColors) {
      try { setShiftColors(JSON.parse(savedColors)); } catch (e) { console.error(e); }
    }

    const savedTheme = localStorage.getItem('uiTheme');
    if (savedTheme) {
      try { setUiTheme(JSON.parse(savedTheme)); } catch (e) { console.error(e); }
    }

    const savedBg = localStorage.getItem('appBackground');
    if (savedBg) {
      setAppBackground(savedBg);
    }

    const savedView = localStorage.getItem('viewMode') as ViewMode;
    if (savedView) {
      setViewMode(savedView);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('shiftColors', JSON.stringify(shiftColors));
  }, [shiftColors]);

  useEffect(() => {
    localStorage.setItem('uiTheme', JSON.stringify(uiTheme));
  }, [uiTheme]);

  useEffect(() => {
    localStorage.setItem('appBackground', appBackground);
  }, [appBackground]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Touch event handlers for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > swipeThreshold;
    const isRightSwipe = distance < -swipeThreshold;

    if (isLeftSwipe) {
      handleNextMonth();
    } else if (isRightSwipe) {
      handlePrevMonth();
    }

    // Reset values
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const existingShift = shifts.find(s => s.date === getLocalDateString(date)) || null;
    setEditingShift(existingShift);
    
    if (isBatchEditMode) {
      const dateStr = getLocalDateString(date);
      setShifts(prev => {
        const existingIndex = prev.findIndex(s => s.date === dateStr);
        if (existingIndex > -1) {
          const newShifts = [...prev];
          newShifts[existingIndex] = { ...newShifts[existingIndex], type: activeStamp };
          return newShifts;
        } else {
          return [...prev, { id: crypto.randomUUID(), date: dateStr, type: activeStamp }];
        }
      });
      return;
    }
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedDate(new Date(shift.date));
    setEditingShift(shift);
    
    if (isBatchEditMode) {
      handleDateClick(new Date(shift.date));
      return;
    }
  };

  const handleSaveShift = (newShift: Shift) => {
    setShifts(prev => {
      const exists = prev.find(s => s.id === newShift.id);
      if (exists) {
        return prev.map(s => s.id === newShift.id ? newShift : s);
      }
      return [...prev, newShift];
    });
  };

  const handleDeleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const handleColorChange = (type: string, key: 'bg' | 'text', value: string) => {
    setShiftColors(prev => ({
      ...prev,
      [type]: { ...prev[type], [key]: value }
    }));
  };

  const handleUIThemeChange = (key: keyof UITheme, value: string) => {
    setUiTheme(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetSettings = () => {
    if (confirm("すべての表示設定を初期状態に戻しますか？")) {
      setShiftColors(DEFAULT_SHIFT_COLORS);
      setUiTheme(DEFAULT_UI_THEME);
      setAppBackground(DEFAULT_BACKGROUND);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const selectedDateStr = selectedDate ? getLocalDateString(selectedDate) : null;
  const selectedShift = shifts.find(s => s.date === selectedDateStr);

  return (
    <div 
      className="min-h-screen pb-20 md:pb-8 text-slate-100 selection:bg-blue-500/30 transition-colors duration-500"
      style={{ backgroundColor: appBackground }}
    >
      <nav 
        className="border-b border-slate-700/50 sticky top-0 z-40 transition-all shadow-xl backdrop-blur-md"
        style={{ backgroundColor: `${appBackground}ee` }}
      >
        <div className="max-w-[1800px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                <span className="text-slate-500 text-sm sm:text-base font-bold">{year}年</span>
                <span className="text-blue-500 text-2xl sm:text-3xl">{month}月</span>
              </h2>
            </div>
            
            <div className="flex gap-1">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-900 border border-slate-700/50 rounded-lg transition-all active:scale-90 text-slate-500 hover:text-white"
                title="前の月"
              >
                <Icons.ChevronLeft />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-900 border border-slate-700/50 rounded-lg transition-all active:scale-90 text-slate-500 hover:text-white"
                title="次の月"
              >
                <Icons.ChevronRight />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800/50">
              <button 
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                title="カレンダー表示"
              >
                <Icons.Calendar />
              </button>
              <button 
                onClick={() => setViewMode('widget')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'widget' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                title="ダッシュボード表示"
              >
                <Icons.Layout />
              </button>
            </div>

            <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block" />

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-900/50 transition-all active:scale-95"
              title="設定"
            >
              <Icons.Settings />
            </button>

            {viewMode === 'calendar' && (
              <button 
                onClick={() => setIsBatchEditMode(!isBatchEditMode)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                  isBatchEditMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20' 
                  : 'bg-slate-900/50 border border-slate-700/50 text-slate-400 hover:border-blue-500/50 hover:text-blue-400'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span className="hidden sm:inline">{isBatchEditMode ? '完了' : 'スタンプ'}</span>
              </button>
            )}
          </div>
        </div>
        
        {isBatchEditMode && viewMode === 'calendar' && (
          <div className="border-t border-slate-700/50 bg-blue-900/10 p-2 animate-in slide-in-from-top duration-300">
            <div className="max-w-[1800px] mx-auto px-4 flex flex-wrap items-center gap-2">
              {Object.values(ShiftType).map(t => {
                const colors = shiftColors[t];
                const isActive = activeStamp === t;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveStamp(t)}
                    className="px-4 py-1.5 rounded-lg text-xs font-black transition-all border-2"
                    style={{
                      backgroundColor: isActive ? colors.bg : '#00000055',
                      color: isActive ? colors.text : '#64748b',
                      borderColor: isActive ? colors.text : '#1e293b',
                      transform: isActive ? 'scale(1.05)' : 'none'
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <main 
        className={`max-w-[1800px] mx-auto px-4 py-4 md:py-6 touch-pan-y`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="space-y-4 relative overflow-hidden">
          {viewMode === 'calendar' ? (
            <>
              <div key={currentDate.toISOString()} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Calendar 
                  currentDate={currentDate}
                  shifts={shifts}
                  shiftColors={shiftColors}
                  uiTheme={uiTheme}
                  onDateClick={handleDateClick}
                  onEditShift={handleEditShift}
                  selectedDate={selectedDate}
                />
              </div>

              {/* Compact Note Display Area */}
              <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div 
                  className="bg-slate-900/30 border border-slate-700/50 rounded-3xl p-4 md:p-5 shadow-lg overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/50"></div>
                  
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm md:text-base font-black text-white">
                        {selectedDate?.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })}
                      </span>
                      {selectedShift && (
                        <span 
                          className="px-2.5 py-0.5 rounded-lg text-[10px] font-black"
                          style={{ backgroundColor: shiftColors[selectedShift.type]?.bg, color: shiftColors[selectedShift.type]?.text }}
                        >
                          {selectedShift.type}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => {
                        setEditingShift(selectedShift || null);
                        setIsModalOpen(true);
                      }}
                      className="p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700/50"
                      title="編集"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>

                  <div className="bg-black/20 border border-slate-800/30 rounded-2xl p-3 mb-3">
                    {selectedShift?.note ? (
                      <p className="text-slate-300 text-sm font-medium leading-snug whitespace-pre-wrap">
                        {selectedShift.note}
                      </p>
                    ) : (
                      <p className="text-slate-600 text-xs italic">メモなし</p>
                    )}
                  </div>
                  
                  {selectedShift && (selectedShift.startTime || selectedShift.endTime) && (
                    <div className="flex gap-2">
                       <div className="flex-1 bg-blue-500/5 border border-blue-500/10 rounded-xl py-1.5 flex flex-col items-center">
                          <span className="text-[8px] font-black text-blue-500/50 uppercase">Start</span>
                          <span className="text-sm font-black text-blue-400/80">{selectedShift.startTime || '--:--'}</span>
                       </div>
                       <div className="flex-1 bg-rose-500/5 border border-rose-500/10 rounded-xl py-1.5 flex flex-col items-center">
                          <span className="text-[8px] font-black text-rose-500/50 uppercase">End</span>
                          <span className="text-sm font-black text-rose-400/80">{selectedShift.endTime || '--:--'}</span>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div key={currentDate.toISOString()} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <WidgetView 
                currentDate={currentDate}
                shifts={shifts}
                shiftColors={shiftColors}
                onEditShift={handleEditShift}
                onAddShift={(date) => {
                  setSelectedDate(date);
                  setEditingShift(null);
                  setIsModalOpen(true);
                }}
              />
            </div>
          )}
        </div>

        {/* Banner Ad Area */}
        <BannerAd appBackground={appBackground} />
      </main>

      {!isBatchEditMode && (
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => {
              const date = selectedDate || new Date();
              setSelectedDate(date);
              setEditingShift(shifts.find(s => s.date === getLocalDateString(date)) || null);
              setIsModalOpen(true);
            }}
            className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all border-4 border-black"
          >
            <Icons.Plus />
          </button>
        </div>
      )}

      {isModalOpen && (
        <ShiftModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
          shiftColors={shiftColors}
          initialDate={selectedDate || undefined}
          initialShift={editingShift}
          appBackground={appBackground}
        />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        colors={shiftColors}
        onColorChange={handleColorChange}
        uiTheme={uiTheme}
        onUIThemeChange={handleUIThemeChange}
        background={appBackground}
        onBackgroundChange={setAppBackground}
        onReset={handleResetSettings}
      />
    </div>
  );
};

export default App;
