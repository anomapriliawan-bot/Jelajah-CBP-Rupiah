import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Building,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  Users,
  Compass,
} from 'lucide-react';
import { db } from '../../services/db';
import { User as UserType } from '../../types';
import { sounds } from '../../utils/audio';
import { RupiCharacter } from '../../components/RupiCharacter';
import { BalineseBackdrop } from '../../components/BalineseBackdrop';

interface LoginPageProps {
  onLoginSuccess: (user: UserType) => void;
  onExploreAsGuest?: () => void;
}

type RoleTab = 'student' | 'teacher' | 'admin';

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onExploreAsGuest,
}) => {
  const [activeRole, setActiveRole] = useState<RoleTab>('student');
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [schoolSettings, setSchoolSettings] = useState(db.getSchoolSettings());

  React.useEffect(() => {
    setSchoolSettings(db.getSchoolSettings());
    const unsub = db.subscribe(() => {
      setSchoolSettings(db.getSchoolSettings());
    });
    return unsub;
  }, []);

  const allUsers = db.getUsers();

  // Determine current mascot gender for preview
  const currentSelectedUser = allUsers.find(
    (u) =>
      u.id.toLowerCase() === identifier.toLowerCase() ||
      (u.nisn && u.nisn === identifier) ||
      (u.email && u.email.toLowerCase() === identifier.toLowerCase())
  );

  const mascotGender =
    activeRole === 'student'
      ? currentSelectedUser?.gender || 'male'
      : 'male';

  const handleRoleChange = (role: RoleTab) => {
    sounds.playPop();
    setActiveRole(role);
    setErrorMsg('');
    setIdentifier('');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      sounds.playError();
      setErrorMsg('Harap masukkan NISN, NIP, atau Email akun Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const result = db.login(identifier, password, activeRole);
      setIsLoading(false);

      if (result.success && result.user) {
        sounds.playSuccess();
        onLoginSuccess(result.user);
      } else {
        sounds.playError();
        setErrorMsg(result.message || 'Login gagal. Periksa kembali data akun Anda.');
      }
    }, 350);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Balinese Temple Panorama Landscape */}
      <BalineseBackdrop variant="full" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {schoolSettings.schoolLogo ? (
            <div className="w-11 h-11 rounded-2xl bg-white border border-sky-200 p-1 flex items-center justify-center shadow-lg shadow-blue-500/15 overflow-hidden shrink-0">
              <img
                src={schoolSettings.schoolLogo}
                alt={schoolSettings.schoolName}
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              <span className="text-white font-extrabold text-2xl tracking-tighter">JR</span>
            </div>
          )}
          <div>
            <div className="flex items-baseline">
              <span className="text-2xl font-black text-[#1E3A8A] tracking-tight">Jelajah</span>
              <span className="text-2xl font-black text-[#2563EB] tracking-tight ml-1 font-['Grandstander',_'Comfortaa',_sans-serif]">Rupiah</span>
            </div>
            <p className="text-[11px] font-bold text-slate-600">
              Portal Edukasi Cinta, Bangga, & Paham Rupiah
            </p>
          </div>
        </div>

        {/* Quick Guest Exploration Button */}
        {onExploreAsGuest && (
          <button
            onClick={() => {
              sounds.playPop();
              onExploreAsGuest();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 text-xs font-bold border border-sky-200 shadow-xs transition-all cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Mode Tamu</span>
          </button>
        )}
      </header>

      {/* Main Login Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Mascot Greeting & Educational Info */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            
            {/* Mascot Character with Speech */}
            <div className="flex flex-col items-center lg:items-start">
              <RupiCharacter
                size="md"
                gender={mascotGender}
                speechText={
                  activeRole === 'student'
                    ? 'Yuk Mulai Jelajahi Rupiah!'
                    : activeRole === 'teacher'
                    ? 'Selamat datang, Bapak & Ibu Guru Pembina!'
                    : 'Selamat datang, Pimpinan & Administrator!'
                }
                onClick={() => sounds.playPop()}
              />
            </div>
          </div>

          {/* Right Column: Multi-Role Login Form Card */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-sky-200/80 shadow-2xl relative">
            
            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/90 rounded-2xl mb-6">
              
              {/* Tab Siswa */}
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  activeRole === 'student'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-102'
                    : 'text-slate-600 hover:text-blue-900 hover:bg-white/60'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Siswa</span>
              </button>

              {/* Tab Guru */}
              <button
                type="button"
                onClick={() => handleRoleChange('teacher')}
                className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  activeRole === 'teacher'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 scale-102'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-white/60'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Guru</span>
              </button>

              {/* Tab Admin / Kepsek */}
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  activeRole === 'admin'
                    ? 'bg-indigo-700 text-white shadow-md shadow-indigo-500/30 scale-102'
                    : 'text-slate-600 hover:text-indigo-900 hover:bg-white/60'
                }`}
              >
                <Building className="w-4 h-4" />
                <span className="truncate">Admin / Kepsek</span>
              </button>
            </div>

            {/* Header info based on selected role */}
            <div className="mb-5 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">
                {activeRole === 'student' && 'Masuk Akun Siswa'}
                {activeRole === 'teacher' && 'Masuk Portal Guru'}
                {activeRole === 'admin' && 'Masuk Panel Admin & Kepala Sekolah'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeRole === 'student' && 'Masukkan NISN atau ID Siswa untuk melanjutkan misi pembelajaran.'}
                {activeRole === 'teacher' && 'Masukkan NIP atau Email Guru untuk mengelola kelas dan turnamen.'}
                {activeRole === 'admin' && 'Masukkan Akun Administrator Kurikulum BI atau Kepala Sekolah.'}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {activeRole === 'student' ? 'NISN / ID Siswa / Email' : activeRole === 'teacher' ? 'NIP / Email Guru' : 'NIP / Email Administrator'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeRole === 'student'
                        ? 'Contoh: 0094821031 atau USR-001'
                        : activeRole === 'teacher'
                        ? 'Contoh: 198504122010012015 atau dewi.anggraeni@sdnusantara.sch.id'
                        : 'Contoh: kepsek'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi / PIN Akun
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Help */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Ingat Saya di Perangkat Ini</span>
                </label>
                <span className="text-blue-600 hover:underline cursor-pointer">Bantuan Login</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-2xl text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeRole === 'student'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25'
                    : activeRole === 'teacher'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                    : 'bg-indigo-700 hover:bg-indigo-600 shadow-indigo-500/25'
                }`}
              >
                {isLoading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <span>Masuk ke Akun {activeRole === 'student' ? 'Siswa' : activeRole === 'teacher' ? 'Guru' : 'Admin'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      </main>

      {/* Footer Credentials Info */}
      <footer className="relative z-10 w-full py-3.5 text-center text-[11px] sm:text-xs text-slate-500 border-t border-sky-100/80 bg-white/70 backdrop-blur-xs font-medium">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-1.5 flex-wrap">
          <span>Jelajah Cinta Bangga Paham Rupiah</span>
          <span className="opacity-40">•</span>
          <span>Developed by I Gede Anom Apriliawan.</span>
        </div>
      </footer>
    </div>
  );
};
