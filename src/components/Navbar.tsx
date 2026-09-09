import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  Flag,
  Trophy,
  Award,
  User,
  Volume2,
  VolumeX,
  ChevronDown,
  FileSpreadsheet,
  GraduationCap,
  LogOut,
  UserCheck,
  Building,
  LogIn,
  Sparkles,
  Crown,
  Lock,
} from 'lucide-react';
import { StudentProfile, User as UserType } from '../types';
import { sounds } from '../utils/audio';
import { db } from '../services/db';
import { FirebaseStatusBadge } from './FirebaseStatusBadge';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: StudentProfile;
  currentUser?: UserType | null;
  onOpenProfile: () => void;
  onOpenBadges: () => void;
  onOpenFinalMission?: () => void;
  onOpenAdminImport?: () => void;
  onOpenTeacherPortal?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  currentUser,
  onOpenProfile,
  onOpenBadges,
  onOpenFinalMission,
  onOpenAdminImport,
  onOpenTeacherPortal,
  onOpenLogin,
  onLogout,
  onSwitchAccount,
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState(db.getSchoolSettings());
  const menuRef = useRef<HTMLDivElement>(null);

  // Subscribe to DB updates for real-time school settings changes
  useEffect(() => {
    setSchoolSettings(db.getSchoolSettings());
    const unsub = db.subscribe(() => {
      setSchoolSettings(db.getSchoolSettings());
    });
    return unsub;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (tabId: string) => {
    sounds.playPop();
    setActiveTab(tabId);
    if (tabId === 'profil') onOpenProfile();
    if (tabId === 'lencana') onOpenBadges();
    if (tabId === 'final_mission' && onOpenFinalMission) onOpenFinalMission();
    if (tabId === 'admin_import' && onOpenAdminImport) onOpenAdminImport();
    if (tabId === 'teacher' && onOpenTeacherPortal) onOpenTeacherPortal();
  };

  const handleSoundToggle = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playPop();
  };

  const isFinalMissionUnlocked = db.isFinalMissionUnlocked(currentUser?.id, currentUser);
  const completedMissionsCount = db.getCompletedMissionsCount(currentUser?.id);

  const isGuest = currentUser?.isGuest || currentUser?.id === 'USR-GUEST' || db.isCurrentGuest();
  const userRole = isGuest ? 'student' : (currentUser?.role || 'student');
  const isTeacher = !isGuest && userRole === 'teacher';
  const isAdminStaff = !isGuest && ['admin', 'reviewer', 'viewer', 'superadmin'].includes(userRole);
  const isFemale = profile.gender === 'female' || (profile.gender as any) === 'perempuan' || currentUser?.gender === 'female';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2">
        {/* Left: Brand "Jelajah Rupiah" with School Identity */}
        <div 
          onClick={() => handleNavClick('beranda')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          {/* Custom Brand / School Logo */}
          {schoolSettings.schoolLogo ? (
            <div className="w-10 h-10 rounded-2xl bg-white border border-sky-200 p-0.5 flex items-center justify-center shadow-md shadow-blue-500/15 overflow-hidden group-hover:scale-105 transition-transform shrink-0">
              <img
                src={schoolSettings.schoolLogo}
                alt={schoolSettings.schoolName}
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <span className="text-white font-extrabold text-xl tracking-tighter">JR</span>
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="text-xl sm:text-2xl font-black text-[#1E3A8A] tracking-tight">Jelajah</span>
              <span className="text-xl sm:text-2xl font-black text-[#2563EB] tracking-tight ml-1 font-['Grandstander',_'Comfortaa',_sans-serif]">Rupiah</span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-tight leading-tight -mt-0.5 truncate max-w-[150px] sm:max-w-[240px]">
              {currentUser?.school || (isAdminStaff ? (currentUser?.institution || 'Super Administrator') : 'Edukasi CBP Rupiah')}
            </span>
          </div>
        </div>

        {/* Center: Kid-friendly Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-sky-50/70 p-1.5 rounded-2xl border border-sky-100/80">
          <button
            id="nav-beranda"
            onClick={() => handleNavClick('beranda')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'beranda'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25 scale-102'
                : 'text-slate-600 hover:text-[#1E3A8A] hover:bg-sky-100/70'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Beranda</span>
          </button>

          <button
            id="nav-misi"
            onClick={() => handleNavClick('misi')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'misi' || activeTab === 'journey'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25 scale-102'
                : 'text-slate-600 hover:text-[#1E3A8A] hover:bg-sky-100/70'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Misi</span>
          </button>

          <button
            id="nav-lencana"
            onClick={() => handleNavClick('lencana')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'lencana'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25 scale-102'
                : 'text-slate-600 hover:text-[#1E3A8A] hover:bg-sky-100/70'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Lencana</span>
          </button>

          <button
            id="nav-misi-akhir"
            onClick={() => handleNavClick('final_mission')}
            title={
              isFinalMissionUnlocked
                ? 'Misi Akhir: Sang Penjelajah Rupiah Terbuka!'
                : `Misi Akhir Terkunci! Selesaikan semua 9 misi terlebih dahulu (${completedMissionsCount}/9 selesai)`
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'final_mission'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-500/25 scale-102'
                : !isFinalMissionUnlocked
                ? 'text-slate-600 bg-slate-100/90 hover:bg-amber-50 hover:text-amber-800 border border-slate-200'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 font-black'
            }`}
          >
            {isFinalMissionUnlocked ? (
              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500/20" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Misi Akhir</span>
            {!isFinalMissionUnlocked && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-200/90 text-slate-600">
                {completedMissionsCount}/9
              </span>
            )}
          </button>

          {/* Teacher Portal Button (Only visible for Teacher or Admin roles) */}
          {(isTeacher || isAdminStaff) && (
            <button
              id="nav-teacher-portal"
              onClick={() => handleNavClick('teacher')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab.startsWith('teacher')
                  ? 'bg-emerald-700 text-white shadow-md scale-102'
                  : 'bg-emerald-100/80 text-emerald-800 border border-emerald-300 font-extrabold hover:bg-emerald-200/80'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Portal Guru</span>
            </button>
          )}

          {/* Admin CMS Button (Only visible for Admin roles) */}
          {isAdminStaff && (
            <button
              id="nav-admin-import"
              onClick={() => handleNavClick('admin_import')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'admin_import'
                  ? 'bg-indigo-700 text-white shadow-md shadow-indigo-500/25 scale-102'
                  : 'bg-indigo-100/80 text-indigo-800 border border-indigo-300 font-extrabold hover:bg-indigo-200/80'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin / CMS</span>
            </button>
          )}
        </nav>

        {/* Right: Points Badge, Audio Toggle, Firebase Status & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Firebase Cloud Sync Status */}
          <FirebaseStatusBadge compact />

          {/* Sound FX Toggle */}
          <button
            onClick={handleSoundToggle}
            title={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-colors text-xs cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Points Pill (1.250 Poin Rupiah) - shown for students */}
          {userRole === 'student' && (
            <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100/80 border border-amber-200/90 px-3 py-1.5 rounded-full shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-inner font-extrabold text-xs">
                ★
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-xs sm:text-sm font-black text-amber-950 font-mono tracking-tight">
                  {profile.points.toLocaleString('id-ID')}
                </span>
                <span className="text-[9px] font-semibold text-amber-700">Poin Rupiah</span>
              </div>
            </div>
          )}

          {/* User Account Dropdown Container */}
          <div className="relative" ref={menuRef}>
            <button
              id="user-profile-button"
              onClick={() => {
                sounds.playPop();
                setIsUserMenuOpen(!isUserMenuOpen);
              }}
              className={`flex items-center gap-2 border rounded-full pl-1 pr-2.5 sm:pr-3 py-1 transition-all group cursor-pointer ${
                userRole === 'teacher'
                  ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950'
                  : ['admin', 'reviewer', 'viewer', 'superadmin'].includes(userRole)
                  ? 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-200 text-indigo-950'
                  : 'bg-sky-50 hover:bg-sky-100/80 border-sky-200/80 text-slate-800'
              }`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full p-0.5 shadow-xs bg-gradient-to-tr ${
                userRole === 'teacher'
                  ? 'from-emerald-400 to-teal-600'
                  : ['admin', 'reviewer', 'viewer', 'superadmin'].includes(userRole)
                  ? 'from-indigo-400 to-purple-600'
                  : isFemale
                  ? 'from-pink-400 to-rose-500'
                  : 'from-sky-400 to-indigo-500'
              }`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <span className="text-sm sm:text-base" role="img" aria-label="avatar">
                    {userRole === 'teacher'
                      ? '👩‍🏫'
                      : ['admin', 'reviewer', 'viewer', 'superadmin'].includes(userRole)
                      ? currentUser?.id === 'USR-VIEW-001' ? '🏫' : '🏛️'
                      : isFemale
                      ? '👧'
                      : '👦'}
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-xs font-bold truncate max-w-[130px]">
                  {currentUser ? currentUser.name.split(' ')[0] : profile.name}!
                </span>
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 mt-0.5">
                  <span className={`px-1.5 py-0.2 rounded-full font-bold text-[9px] ${
                    userRole === 'teacher'
                      ? 'bg-emerald-100 text-emerald-800'
                      : ['admin', 'reviewer', 'viewer', 'superadmin'].includes(userRole)
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {userRole === 'teacher' ? 'Guru' : ['admin', 'reviewer', 'viewer', 'superadmin'].includes(userRole) ? 'Admin/Kepsek' : profile.grade}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                </div>
              </div>
            </button>

            {/* Dropdown Menu Modal */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {currentUser?.name || profile.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {currentUser?.email || (currentUser?.nisn ? `NISN: ${currentUser.nisn}` : profile.school)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {isGuest ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        Mode Tamu (Sementara)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Peran: {userRole === 'student' ? 'Siswa' : userRole === 'teacher' ? 'Guru' : 'Admin & Kepsek'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  {userRole === 'student' && (
                    <button
                      onClick={() => {
                        sounds.playPop();
                        setIsUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-sky-50 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      <span>Pengaturan Profil Siswa</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      sounds.playPop();
                      setIsUserMenuOpen(false);
                      if (onSwitchAccount) onSwitchAccount();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-sky-50 flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Ganti Akun (Siswa / Guru / Admin)</span>
                  </button>

                  {userRole !== 'student' && (
                    <button
                      onClick={() => {
                        sounds.playPop();
                        setIsUserMenuOpen(false);
                        handleNavClick('beranda');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-sky-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Home className="w-4 h-4 text-amber-600" />
                      <span>Lihat Portal Siswa</span>
                    </button>
                  )}
                </div>

                {/* Logout / Login Item */}
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setIsUserMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Keluar / Halaman Login</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

