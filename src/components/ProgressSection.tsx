import React from 'react';
import { Award, ChevronRight, Sparkles } from 'lucide-react';
import { Badge, StudentProfile } from '../types';
import { sounds } from '../utils/audio';

interface ProgressSectionProps {
  profile: StudentProfile;
  badges: Badge[];
  onOpenBadges: () => void;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({
  profile,
  badges = [],
  onOpenBadges,
}) => {
  const currentXp = profile?.currentXp ?? 0;
  const maxXp = profile?.maxXp || 600;
  const level = profile?.level || 1;
  const levelTitle = profile?.levelTitle || 'Ksatria Rupiah Pratama';
  const progressPercent = Math.min(100, Math.round((currentXp / maxXp) * 100));
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Compact Level & XP Bar */}
        <div className="w-full md:w-1/2 flex items-center gap-3">
          {/* Level Pill */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex flex-col items-center justify-center text-slate-900 shadow-xs shrink-0 font-black">
            <span className="text-[11px] uppercase tracking-tighter leading-none">Lv</span>
            <span className="text-sm leading-none">{level}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-slate-800 truncate">
                {levelTitle}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 font-mono shrink-0">
                {currentXp}/{maxXp} XP
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Divider for desktop */}
        <div className="hidden md:block w-px h-8 bg-slate-200" />

        {/* Right: Compact Badges Preview & Action */}
        <div className="w-full md:w-1/2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-slate-500 shrink-0">
              Lencana ({unlockedCount}/{badges.length || 9}):
            </span>
            {/* Mini Badges Avatars */}
            <div className="flex items-center -space-x-1 overflow-hidden py-0.5">
              {badges.slice(0, 5).map((badge) => (
                <div
                  key={badge.id}
                  title={badge.name}
                  onClick={() => {
                    sounds.playPop();
                    onOpenBadges();
                  }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ring-2 ring-white cursor-pointer transition-transform hover:scale-115 hover:z-10 ${
                    badge.unlocked
                      ? 'shadow-xs'
                      : 'bg-slate-100 text-slate-400 opacity-60'
                  }`}
                  style={{
                    backgroundColor: badge.unlocked ? badge.bgColor : '#F1F5F9',
                  }}
                >
                  <Award
                    className="w-3.5 h-3.5"
                    style={{ color: badge.unlocked ? badge.color : '#94A3B8' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              onOpenBadges();
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <span>Koleksi</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
