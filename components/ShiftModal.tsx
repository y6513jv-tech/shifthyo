
import React, { useState, useEffect } from 'react';
import { Shift, ShiftType, ShiftColorMap } from '../types';
import { Icons } from '../constants';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Shift) => void;
  onDelete?: (id: string) => void;
  shiftColors: ShiftColorMap;
  initialDate?: Date;
  initialShift?: Shift | null;
  appBackground?: string;
}

const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  shiftColors,
  initialDate,
  initialShift,
  appBackground = '#000000'
}) => {
  const [type, setType] = useState<ShiftType>(ShiftType.DAY);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialShift) {
      setType(initialShift.type);
      setStartTime(initialShift.startTime || '');
      setEndTime(initialShift.endTime || '');
      setNote(initialShift.note || '');
    } else {
      setType(ShiftType.DAY);
      setStartTime('');
      setEndTime('');
      setNote('');
    }
  }, [initialShift, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = initialShift?.date || initialDate?.toISOString().split('T')[0] || '';
    onSave({
      id: initialShift?.id || crypto.randomUUID(),
      date: dateStr,
      type,
      startTime,
      endTime,
      note
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-md rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden animate-in fade-in zoom-in duration-200 text-slate-100"
        style={{ backgroundColor: appBackground }}
      >
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">
            {initialShift ? 'シフトを編集' : `${initialDate?.toLocaleDateString('ja-JP')} のシフト`}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-900/50 rounded-full transition-colors text-slate-500">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">シフト種別</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(ShiftType).map(t => {
                const colors = shiftColors[t];
                const isActive = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="py-2.5 px-1 text-xs rounded-xl border-2 transition-all font-black"
                    style={{
                      backgroundColor: isActive ? colors.bg : '#00000033',
                      color: isActive ? colors.text : '#555',
                      borderColor: isActive ? colors.text : '#1e293b'
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">開始時間</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-slate-700/50 rounded-xl text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">終了時間</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-slate-700/50 rounded-xl text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">メモ (任意)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例: 会議あり、残業予定など"
              rows={3}
              className="w-full px-4 py-2 bg-black/40 border border-slate-700/50 rounded-xl text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-slate-700"
            />
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.98]"
            >
              保存する
            </button>
            
            {initialShift && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialShift.id);
                  onClose();
                }}
                className="w-full py-3 px-4 text-rose-500 font-semibold hover:bg-rose-500/10 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Icons.Trash />
                このシフトを削除
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftModal;
