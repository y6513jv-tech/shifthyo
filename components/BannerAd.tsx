
import React from 'react';

interface BannerAdProps {
  appBackground: string;
}

const BannerAd: React.FC<BannerAdProps> = ({ appBackground }) => {
  return (
    <div className="max-w-4xl mx-auto w-full mt-8 mb-4 px-2">
      <div 
        className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/40 p-1 flex items-center justify-center min-h-[60px] md:min-h-[90px] group cursor-pointer transition-all hover:border-blue-500/30"
      >
        {/* 背景のアニメーション的な装飾 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* PRラベル */}
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-800 text-slate-500 border border-slate-700/50 z-10">
          PR
        </div>

        <div className="flex flex-col items-center justify-center text-center z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span className="text-xs md:text-sm font-black text-slate-300 tracking-tight">ShiftSync Pro Premium</span>
          </div>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium">
            広告なし版へアップグレードして全ての機能を解放しましょう
          </p>
        </div>
        
        {/* 右側の矢印アイコン */}
        <div className="absolute right-4 text-slate-700 group-hover:text-blue-500/50 transition-colors hidden sm:block">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
    </div>
  );
};

export default BannerAd;
