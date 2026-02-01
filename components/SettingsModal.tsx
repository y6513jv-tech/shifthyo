
import React from 'react';
import { ShiftType, ShiftColorMap, UITheme } from '../types';
import { BACKGROUND_PRESETS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: ShiftColorMap;
  onColorChange: (type: string, key: 'bg' | 'text', value: string) => void;
  uiTheme: UITheme;
  onUIThemeChange: (key: keyof UITheme, value: string) => void;
  background: string;
  onBackgroundChange: (color: string) => void;
  onReset: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  colors,
  onColorChange,
  uiTheme,
  onUIThemeChange,
  background,
  onBackgroundChange,
  onReset
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-black w-full max-w-lg rounded-3xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-black">
          <div>
            <h3 className="text-xl font-bold text-white">設定</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">アプリの表示をカスタマイズできます</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-900 rounded-full transition-colors text-slate-500">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
          {/* Background Settings */}
          <section>
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">全体の背景色</h4>
            <div className="flex flex-wrap gap-3 mb-4">
              {BACKGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => onBackgroundChange(preset.color)}
                  className={`w-10 h-10 rounded-xl border-2 transition-all ${background === preset.color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black' : 'border-slate-800'}`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                />
              ))}
              <div className="relative">
                <input 
                  type="color" 
                  value={background.startsWith('#') ? background : '#000000'}
                  onChange={(e) => onBackgroundChange(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-2 border-slate-700 p-0 bg-transparent overflow-hidden"
                />
              </div>
            </div>
          </section>

          {/* UI Color Settings (Calendar specific) */}
          <section>
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">カレンダー配色</h4>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800">
                     <span className="text-[10px] font-black text-slate-400 uppercase">マス背景</span>
                     <input type="color" value={uiTheme.cellBg.substring(0, 7)} onChange={(e) => onUIThemeChange('cellBg', e.target.value + '40')} className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent" />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800">
                     <span className="text-[10px] font-black text-slate-400 uppercase">枠線</span>
                     <input type="color" value={uiTheme.borderColor.substring(0, 7)} onChange={(e) => onUIThemeChange('borderColor', e.target.value + '50')} className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent" />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800">
                     <span className="text-[10px] font-black text-slate-400 uppercase">ヘッダー</span>
                     <input type="color" value={uiTheme.headerColor} onChange={(e) => onUIThemeChange('headerColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent" />
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800">
                     <span className="text-[10px] font-black text-slate-400 uppercase">平日 (日付)</span>
                     <input type="color" value={uiTheme.dateColor} onChange={(e) => onUIThemeChange('dateColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent" />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800">
                     <span className="text-[10px] font-black text-slate-400 uppercase">土曜 (日付)</span>
                     <input type="color" value={uiTheme.satColor} onChange={(e) => onUIThemeChange('satColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent" />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800">
                     <span className="text-[10px] font-black text-slate-400 uppercase">日祝 (日付)</span>
                     <input type="color" value={uiTheme.sunColor} onChange={(e) => onUIThemeChange('sunColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent" />
                  </div>
               </div>
            </div>
          </section>

          {/* Shift Color Settings */}
          <section>
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">シフトカラー</h4>
            <div className="space-y-3">
              {Object.values(ShiftType).map(type => (
                <div key={type} className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-slate-800 bg-slate-900/10">
                  <div 
                    className="px-3 py-1 rounded-xl border text-[10px] font-black shadow-sm min-w-[60px] text-center"
                    style={{ 
                      backgroundColor: colors[type].bg, 
                      color: colors[type].text,
                      borderColor: `${colors[type].text}40`
                    }}
                  >
                    {type}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-slate-600 uppercase">背景</span>
                      <input 
                        type="color" 
                        value={colors[type].bg}
                        onChange={(e) => onColorChange(type, 'bg', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-slate-600 uppercase">文字</span>
                      <input 
                        type="color" 
                        value={colors[type].text}
                        onChange={(e) => onColorChange(type, 'text', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 bg-black border-t border-slate-700 flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 py-3 px-4 bg-slate-950 border border-slate-700 text-slate-500 font-bold rounded-xl hover:bg-slate-900 transition-all active:scale-95 text-xs"
          >
            初期値に戻す
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-xs"
          >
            設定を閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
