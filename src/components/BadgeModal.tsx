import React from 'react';
import { X, Award, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '../types';
import { sounds } from '../utils/audio';

interface BadgeModalProps {
  badges: Badge[];
  onClose: () => void;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({ badges, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playPop();
            onClose();
          }}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-md text-white shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Galeri Prestasi
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Lencana & Medali Petualangan
            </h2>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${
                badge.unlocked
                  ? 'bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-xs'
                  : 'bg-slate-50/70 border-dashed border-slate-200 opacity-75'
              }`}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: badge.unlocked ? badge.bgColor : '#F1F5F9',
                  borderColor: badge.borderColor,
                }}
              >
                {badge.unlocked ? (
                  <div className="relative">
                    <Award className="w-8 h-8" style={{ color: badge.color }} />
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
                  </div>
                ) : (
                  <Lock className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {badge.name}
                  </h4>
                  {badge.unlocked && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Terbuka
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {badge.description}
                </p>
                <span className="inline-block mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                  +{badge.xpReward} XP Reward
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
