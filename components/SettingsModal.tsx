
import React from 'react';
import { ShiftColorMap, UITheme, ShiftType } from '../types';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-700/50 overflow-hidden my-8"
        style={{ backgroundColor: background === '#000000' ? '#0f172a' : background }}
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-inherit z-10">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>
            表示設定
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Shift Colors Section */}
          <section>
            <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-4">シフトカラー設定</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(ShiftType).map(type => (
                <div key={type} className="bg-black/20 p-4 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="px-3 py-1 rounded-lg text-xs font-black shadow-sm"
                      style={{ backgroundColor: colors[type].bg, color: colors[type].text }}
                    >
                      {type}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">背景</label>
                      <input 
                        type="color" 
                        value={colors[type].bg}
                        onChange={(e) => onColorChange(type, 'bg', e.target.value)}
                        className="w-full h-8 bg-transparent cursor-pointer rounded overflow-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">文字</label>
                      <input 
                        type="color" 
                        value={colors[type].text}
                        onChange={(e) => onColorChange(type, 'text', e.target.value)}
                        className="w-full h-8 bg-transparent cursor-pointer rounded overflow-hidden"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* UI Theme Section */}
          <section>
            <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-4">カレンダー配色</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: '日付文字', key: 'dateColor' },
                { label: '土曜日', key: 'satColor' },
                { label: '日曜日/祝日', key: 'sunColor' },
                { label: 'ヘッダー文字', key: 'headerColor' },
                { label: 'セルの背景', key: 'cellBg' },
                { label: '枠線の色', key: 'borderColor' },
              ].map(item => (
                <div key={item.key} className="bg-black/20 p-3 rounded-2xl border border-slate-800/50">
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 truncate">{item.label}</label>
                  <input 
                    type="color" 
                    value={uiTheme[item.key as keyof UITheme]}
                    onChange={(e) => onUIThemeChange(item.key as keyof UITheme, e.target.value)}
                    className="w-full h-8 bg-transparent cursor-pointer rounded overflow-hidden"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Background Presets */}
          <section>
            <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-4">アプリ背景</h4>
            <div className="flex flex-wrap gap-3">
              {BACKGROUND_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => onBackgroundChange(preset.color)}
                  className={`group relative w-12 h-12 rounded-xl transition-all border-2 flex items-center justify-center ${background === preset.color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:border-slate-600'}`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                >
                  {background === preset.color && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M20 6L9 17l-5-5"/></svg>
                  )}
                </button>
              ))}
              <div className="flex flex-col items-center justify-center p-1 bg-black/20 rounded-xl border border-slate-800/50">
                <input 
                  type="color" 
                  value={background}
                  onChange={(e) => onBackgroundChange(e.target.value)}
                  className="w-8 h-8 bg-transparent cursor-pointer rounded"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-800 flex gap-4">
          <button 
            onClick={onReset}
            className="px-6 py-3 rounded-2xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-bold flex-1"
          >
            初期設定に戻す
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex-[2] active:scale-95"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
