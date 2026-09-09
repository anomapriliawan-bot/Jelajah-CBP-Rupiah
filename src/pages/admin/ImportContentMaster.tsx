import React, { useState, useEffect } from 'react';
import {
  Layers,
  HelpCircle,
  School,
  Download,
  ArrowRight,
  LogOut,
  UserCheck,
  Crown,
  Users,
  LayoutDashboard,
} from 'lucide-react';
import { db } from '../../services/db';
import { generateCanonicalExcelWorkbook } from '../../services/excelImporter';
import { sounds } from '../../utils/audio';
import { SchoolSettingsView } from './SchoolSettingsView';
import { AdminMissionsView } from './AdminMissionsView';
import { AdminQuestionsHubView } from './AdminQuestionsHubView';
import { AdminFinalMissionView } from './AdminFinalMissionView';
import { UserManagementView } from './UserManagementView';
import { ModernDashboardView } from './ModernDashboardView';
import { FinalMissionEventManagement } from '../../components/admin/FinalMissionEventManagement';
import { Footer } from '../../components/Footer';

interface ImportContentMasterProps {
  onBackToApp?: () => void;
  onOpenFinalMission?: () => void;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
}

export type AdminTab =
  | 'dashboard'
  | 'missions'
  | 'questions_hub'
  | 'final_mission'
  | 'final_mission_event'
  | 'user_management'
  | 'school_settings';

export const ImportContentMaster: React.FC<ImportContentMasterProps> = ({
  onBackToApp,
  onOpenFinalMission,
  onLogout,
  onSwitchAccount,
}) => {
  const currentUser = db.getCurrentUser();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [schoolSettings, setSchoolSettings] = useState(db.getSchoolSettings());

  useEffect(() => {
    setSchoolSettings(db.getSchoolSettings());
    const unsub = db.subscribe(() => {
      setSchoolSettings(db.getSchoolSettings());
    });
    return unsub;
  }, []);

  // Synchronize hash with tab
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();

      if (!isSuperAdmin) {
        if (
          hash.includes('final') ||
          hash.includes('akhir') ||
          hash.includes('event') ||
          hash.includes('bareng') ||
          hash.includes('peringkat') ||
          hash.includes('jadwal')
        ) {
          setAdminTab('final_mission_event');
        } else if (hash.includes('user') || hash.includes('pengguna') || hash.includes('guru') || hash.includes('siswa') || hash.includes('sekolah')) {
          setAdminTab('user_management');
        } else {
          setAdminTab('dashboard');
        }
        return;
      }

      if (hash.includes('school_settings') || hash.includes('settings') || hash.includes('logo')) {
        setAdminTab('school_settings');
      } else if (hash.includes('user') || hash.includes('pengguna') || hash.includes('guru') || hash.includes('siswa') || hash.includes('sekolah')) {
        setAdminTab('user_management');
      } else if (hash.includes('final') || hash.includes('akhir') || hash.includes('penjelajah')) {
        setAdminTab('final_mission');
      } else if (
        hash.includes('question') ||
        hash.includes('tournament') ||
        hash.includes('activit') ||
        hash.includes('soal')
      ) {
        setAdminTab('questions_hub');
      } else if (hash.includes('mission') || hash.includes('misi')) {
        setAdminTab('missions');
      } else {
        setAdminTab('dashboard');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isSuperAdmin]);

  const handleDownloadTemplate = () => {
    sounds.playPop();
    const bytes = generateCanonicalExcelWorkbook();
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Content_Master_Jelajah_Rupiah.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const allTabsConfig: {
    id: AdminTab;
    label: string;
    description: string;
    icon: any;
    badge?: string;
    superAdminOnly?: boolean;
    schoolAdminOnly?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: isSuperAdmin ? '1. Dashboard & Rapor Jelajah Rupiah' : '1. Download Rapor Jelajah Rupiah',
      description: isSuperAdmin
        ? 'Daya Jelajah Sekolah dan Siswa, Analisis 3 Pilar CBP, dan Rekapitulasi Rapor Excel'
        : 'Statistik Belajar Siswa, Capaian Kelas, dan Download Rapor Jelajah Rupiah Siap Cetak',
      icon: LayoutDashboard,
      badge: isSuperAdmin ? 'Capaian' : 'Rapor BI',
    },
    {
      id: 'missions',
      label: '2. Kelola Misi',
      description: 'Upload Excel, Hapus, Aktifkan & Kelola Foto/Aktivitas Misi 1-9',
      icon: Layers,
      badge: 'Misi 1-9',
      superAdminOnly: true,
    },
    {
      id: 'questions_hub',
      label: '3. Kelola Latihan & Aktivitas',
      description: 'Bank Soal Latihan Misi & Aktivitas Interaktif',
      icon: HelpCircle,
      badge: 'Soal & Aktivitas',
      superAdminOnly: true,
    },
    {
      id: 'final_mission',
      label: '4. Misi Akhir: Sang Penjelajah',
      description: 'Bank Soal 9 Kolom, Upload Foto Gambar & Kelola Soal Anak, Remaja, Dewasa',
      icon: Crown,
      badge: 'Assessment BI',
      superAdminOnly: true,
    },
    {
      id: 'user_management',
      label: isSuperAdmin ? '5. Kelola User & Sekolah' : '2. Kelola Akun Guru & Siswa',
      description: isSuperAdmin
        ? 'Kelola Satuan Pendidikan, Generate Akun Admin Sekolah, Guru, dan Siswa'
        : 'Kelola & Generate Akun Guru Pembina dan Siswa Sekolah',
      icon: Users,
      badge: isSuperAdmin ? 'Data Akun' : 'Akun & PIN',
    },
    {
      id: 'final_mission_event',
      label: '3. Main Bareng Misi Akhir',
      description: 'Atur Jadwal Pelaksanaan Bersama & Pantau Papan Peringkat Juara Sekolah',
      icon: Crown,
      badge: 'Jadwal & Juara',
      schoolAdminOnly: true,
    },
    {
      id: 'school_settings',
      label: '6. Logo & Pengaturan Sistem',
      description: 'Pengaturan Logo Resmi Aplikasi (Super Admin)',
      icon: School,
      badge: 'Logo',
      superAdminOnly: true,
    },
  ];

  const adminTabsConfig = allTabsConfig.filter((tab) => {
    if (tab.superAdminOnly && !isSuperAdmin) return false;
    if (tab.schoolAdminOnly && isSuperAdmin) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo: School Logo if uploaded, or JR logo */}
            {schoolSettings.schoolLogo ? (
              <div className="w-10 h-10 rounded-2xl bg-white border border-sky-200 p-0.5 flex items-center justify-center shadow-md shadow-blue-500/15 overflow-hidden shrink-0">
                <img
                  src={schoolSettings.schoolLogo}
                  alt={schoolSettings.schoolName}
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                <span className="text-white font-extrabold text-xl tracking-tighter">JR</span>
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-lg sm:text-xl font-black text-[#1E3A8A] tracking-tight">Jelajah</span>
                <span className="text-lg sm:text-xl font-black text-[#2563EB] tracking-tight ml-1 font-['Grandstander',_'Comfortaa',_sans-serif]">Rupiah</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 ml-2 hidden sm:inline-block">
                  Admin Panel
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-tight leading-tight -mt-0.5 truncate max-w-[180px] sm:max-w-[300px]">
                {currentUser?.school || currentUser?.institution || (isSuperAdmin ? 'Super Administrator' : 'Admin Satuan Pendidikan')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Current Admin Account Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {currentUser?.id === 'USR-VIEW-001' ? '🏫' : '🏛️'}
              </div>
              <div className="text-left">
                <div className="font-bold text-indigo-950 truncate max-w-[140px]">{currentUser?.name || 'Administrator'}</div>
                <div className="text-[10px] text-indigo-700">{currentUser?.levelTitle || 'Admin Kurikulum'}</div>
              </div>
            </div>

            {isSuperAdmin && (
              <button
                onClick={handleDownloadTemplate}
                className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                title="Unduh format file Master Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Template Excel</span>
              </button>
            )}

            {onSwitchAccount && (
              <button
                onClick={onSwitchAccount}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                title="Ganti Akun"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Ganti Akun</span>
              </button>
            )}

            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Portal Siswa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="bg-slate-100/90 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
            {adminTabsConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = adminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playPop();
                    setAdminTab(tab.id);
                    window.location.hash = `admin/${tab.id}`;
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-600/30'
                      : 'bg-white hover:bg-slate-200 text-slate-700 hover:text-slate-950 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                            isActive ? 'bg-amber-400 text-slate-950' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Menu 1: Dashboard & Capaian Sekolah Mitra */}
        {adminTab === 'dashboard' && (
          <ModernDashboardView
            onNavigateToUsers={() => setAdminTab('user_management')}
            onNavigateToEvent={() => setAdminTab('final_mission_event')}
          />
        )}

        {/* Menu 2: Kelola Misi (Khusus Super Admin) */}
        {isSuperAdmin && adminTab === 'missions' && <AdminMissionsView />}

        {/* Menu 3: Kelola Latihan & Turnamen (Khusus Super Admin) */}
        {isSuperAdmin && adminTab === 'questions_hub' && (
          <AdminQuestionsHubView onNavigateToMissions={() => setAdminTab('missions')} />
        )}

        {/* Menu 4: Misi Akhir: Sang Penjelajah Rupiah (Khusus Super Admin) */}
        {isSuperAdmin && adminTab === 'final_mission' && (
          <AdminFinalMissionView
            onNavigateToMissions={() => setAdminTab('missions')}
            onPlayAsStudent={onOpenFinalMission}
          />
        )}

        {/* Menu Khusus Admin Sekolah: Pengaturan Sesi Main Bareng & Papan Peringkat Juara */}
        {adminTab === 'final_mission_event' && (
          <FinalMissionEventManagement onPlayAsStudent={onOpenFinalMission} />
        )}

        {/* Fallback proteksi jika bukan superadmin mencoba membuka tab terlarang */}
        {!isSuperAdmin && ['missions', 'questions_hub', 'final_mission', 'school_settings'].includes(adminTab) && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center text-amber-900">
            <h3 className="font-bold text-base mb-1">Akses Menu Dibatasi</h3>
            <p className="text-xs text-amber-700 mb-4">
              Menu ini dikhususkan untuk pengelolaan terpusat oleh Super Administrator Bank Indonesia.
            </p>
            <button
              onClick={() => setAdminTab('dashboard')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer shadow-sm"
            >
              Kembali ke Dashboard Capaian Siswa
            </button>
          </div>
        )}

        {/* Menu 5: Kelola User & Sekolah */}
        {adminTab === 'user_management' && <UserManagementView currentUser={currentUser} />}

        {/* Menu 6: Profil & Logo Sistem (Khusus Super Admin) */}
        {isSuperAdmin && adminTab === 'school_settings' && (
          <SchoolSettingsView
            currentUser={currentUser}
            onSaved={() => setSchoolSettings(db.getSchoolSettings())}
          />
        )}
      </div>

      {/* System Footer Credit */}
      <div className="mt-auto pt-16">
        <Footer />
      </div>
    </div>
  );
};
