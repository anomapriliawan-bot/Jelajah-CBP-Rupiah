import React, { useState } from 'react';
import { X, User, School, Star, Flame, Trophy, Check, Sparkles } from 'lucide-react';
import { StudentProfile } from '../types';
import { sounds } from '../utils/audio';
import { RupiCharacter } from './RupiCharacter';

interface ProfileModalProps {
  profile: StudentProfile;
  onUpdateProfile: (updated: Partial<StudentProfile>) => void;
  onClose: () => void;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
  onLogout,
  onSwitchAccount,
}) => {
  const [selectedGrade, setSelectedGrade] = useState(profile.grade);
  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState<'male' | 'female'>(
    profile.gender === 'female' || profile.gender === ('perempuan' as any) ? 'female' : 'male'
  );

  const handleSave = () => {
    sounds.playSuccess();
    onUpdateProfile({
      grade: selectedGrade,
      name,
      gender,
      avatar: gender === 'female' ? '👧' : '👦',
    });
    onClose();
  };

  const grades = ['Kelas 4', 'Kelas 5', 'Kelas 6'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
        
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

        {/* Header Avatar & Info */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${gender === 'female' ? 'from-pink-400 via-rose-500 to-amber-400 shadow-pink-500/20' : 'from-sky-400 via-blue-500 to-indigo-600 shadow-blue-500/20'} p-1 shadow-lg mb-2.5 transition-all`}>
            <div className="w-full h-full rounded-full bg-amber-50 flex items-center justify-center text-3xl">
              {gender === 'female' ? '👧' : '👦'}
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900">{name || profile.name}</h3>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
            <School className="w-3.5 h-3.5 text-blue-500" />
            <span>{profile.school}</span>
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-2.5 text-center">
            <Star className="w-4 h-4 text-amber-500 mx-auto mb-0.5" />
            <span className="text-[11px] font-bold text-slate-600 block">Poin</span>
            <span className="text-xs font-black text-amber-950 font-mono">
              {profile.points.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-2.5 text-center">
            <Trophy className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
            <span className="text-[11px] font-bold text-slate-600 block">Level</span>
            <span className="text-xs font-black text-blue-950">
              Lv. {profile.level}
            </span>
          </div>

          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-2.5 text-center">
            <Flame className="w-4 h-4 text-rose-500 mx-auto mb-0.5" />
            <span className="text-[11px] font-bold text-slate-600 block">Streak</span>
            <span className="text-xs font-black text-rose-950">
              {profile.streakDays} Hari
            </span>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Siswa
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama siswa..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Gender Selection: Laki-laki / Perempuan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Jenis Kelamin</span>
              <span className="text-[10px] text-blue-600 font-medium">Menyesuaikan Tampilan Rupi</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Laki-laki */}
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setGender('male');
                }}
                className={`py-2.5 px-3 rounded-2xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  gender === 'male'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">👦</span>
                <div className="text-left leading-tight">
                  <div className="font-black text-xs">Laki-laki</div>
                  <div className="text-[10px] text-slate-500 font-normal">Anak Laki-Laki</div>
                </div>
                {gender === 'male' && <Check className="w-4 h-4 text-blue-600 ml-auto shrink-0" />}
              </button>

              {/* Perempuan */}
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setGender('female');
                }}
                className={`py-2.5 px-3 rounded-2xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  gender === 'female'
                    ? 'bg-pink-50 border-pink-500 text-pink-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">👧</span>
                <div className="text-left leading-tight">
                  <div className="font-black text-xs">Perempuan</div>
                  <div className="text-[10px] text-slate-500 font-normal">Kebaya Rupiah</div>
                </div>
                {gender === 'female' && <Check className="w-4 h-4 text-pink-600 ml-auto shrink-0" />}
              </button>
            </div>
          </div>

          {/* Interactive Mascot Adaptation Preview */}
          <div className={`p-3 rounded-2xl border ${gender === 'female' ? 'bg-gradient-to-r from-pink-50/70 to-amber-50/60 border-pink-200' : 'bg-gradient-to-r from-sky-50/70 to-blue-50/60 border-sky-200'} flex items-center gap-3 transition-colors`}>
            <div className="shrink-0 scale-85 -my-2 -ml-1">
              <RupiCharacter
                size="sm"
                gender={gender}
                speechText={gender === 'female' ? 'Halo, aku Rupi!' : 'Halo, aku Rupi!'}
              />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-slate-900">
                  Tampilan Maskot Rupi
                </span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                  {gender === 'female' ? 'Perempuan' : 'Laki-Laki'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                {gender === 'female'
                  ? 'Karakter anak Bali perempuan dengan kebaya putih berlogo Rupiah, hiasan bunga kamboja, dan selendang anggun.'
                  : 'Karakter anak Bali laki-laki dengan udeng tradisional dan busana putih berlogo Rupiah.'}
              </p>
            </div>
          </div>

          {/* Grade Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Tingkat Kelas
            </label>
            <div className="grid grid-cols-3 gap-2">
              {grades.map((gr) => (
                <button
                  key={gr}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedGrade(gr);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    selectedGrade === gr
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{gr}</span>
                  {selectedGrade === gr && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save & Account Actions Button */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  onLogout();
                }}
                className="px-3.5 py-2 rounded-full border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex-1 sm:flex-initial text-center"
              >
                Keluar Akun
              </button>
            )}
            {onSwitchAccount && (
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  onSwitchAccount();
                }}
                className="px-3.5 py-2 rounded-full border border-sky-200 text-xs font-bold text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer flex-1 sm:flex-initial text-center"
              >
                Ganti Akun
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                sounds.playPop();
                onClose();
              }}
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              Simpan Profil
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
