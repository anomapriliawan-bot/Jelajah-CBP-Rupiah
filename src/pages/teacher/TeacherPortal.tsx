import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  GraduationCap,
  FileSpreadsheet,
  LogOut,
  UserCheck,
  Crown,
} from 'lucide-react';
import { TeacherDashboardView } from './TeacherDashboardView';
import { TeacherClassesView } from './TeacherClassesView';
import { TeacherClassDetailView } from './TeacherClassDetailView';
import { TeacherConceptAnalysisView } from './TeacherConceptAnalysisView';
import { FinalMissionEventManagement } from '../../components/admin/FinalMissionEventManagement';
import { db } from '../../services/db';
import { Footer } from '../../components/Footer';

interface TeacherPortalProps {
  onBackToStudent: () => void;
  onOpenAdminImport?: () => void;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
  initialRoute?: string;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  onBackToStudent,
  onOpenAdminImport,
  onLogout,
  onSwitchAccount,
  initialRoute = 'dashboard',
}) => {
  const currentUser = db.getCurrentUser();
  const [schoolSettings, setSchoolSettings] = useState(db.getSchoolSettings());
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'classes' | 'class_detail' | 'analytics' | 'final_mission_event'
  >(
    initialRoute === 'classes'
      ? 'classes'
      : initialRoute === 'final-mission'
      ? 'final_mission_event'
      : 'dashboard'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('CLS-001');

  // Subscribe to DB for real-time school settings updates
  useEffect(() => {
    setSchoolSettings(db.getSchoolSettings());
    const unsub = db.subscribe(() => {
      setSchoolSettings(db.getSchoolSettings());
    });
    return unsub;
  }, []);

  // Handle URL hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'teacher' || hash === 'teacher/dashboard') {
        setCurrentTab('dashboard');
      } else if (hash === 'teacher/classes') {
        setCurrentTab('classes');
      } else if (hash.startsWith('teacher/classes/')) {
        const clsId = hash.replace('teacher/classes/', '');
        setSelectedClassId(clsId);
        setCurrentTab('class_detail');
      } else if (hash === 'teacher/analytics') {
        setCurrentTab('analytics');
      } else if (hash === 'teacher/final-mission' || hash === 'teacher/event') {
        setCurrentTab('final_mission_event');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (tab: typeof currentTab, hashSuffix: string) => {
    setCurrentTab(tab);
    window.location.hash = hashSuffix;
  };

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    navigateTo('class_detail', `teacher/classes/${classId}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Teacher Top Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Portal Identity */}
            <div className="flex items-center gap-3">
              {schoolSettings.schoolLogo ? (
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-700 p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={schoolSettings.schoolLogo}
                    alt={schoolSettings.schoolName}
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
                  <span className="text-white font-extrabold text-lg tracking-tighter">JR</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-tight text-white">Jelajah Rupiah</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/30 text-[10px] font-extrabold text-blue-300 uppercase">
                    Portal Guru
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {currentUser?.school || 'Satuan Pendidikan'} • Bank Indonesia
                </div>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2.5">
              {/* Teacher Profile Tag */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-800 border border-slate-700 text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-400 text-slate-900 flex items-center justify-center font-bold text-xs">
                  👩‍🏫
                </div>
                <div>
                  <div className="font-bold text-slate-200">{currentUser?.name || 'Ibu Dewi Anggraeni, S.Pd.'}</div>
                  <div className="text-[10px] text-slate-400">
                    {currentUser?.nip ? `NIP: ${currentUser.nip}` : 'Guru Pembina'}
                  </div>
                </div>
              </div>

              {/* Switch Account */}
              {onSwitchAccount && (
                <button
                  onClick={onSwitchAccount}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Ganti Akun"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden md:inline">Ganti Akun</span>
                </button>
              )}

              {/* Back to Student Mode */}
              <button
                onClick={onBackToStudent}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Mode Siswa</span>
              </button>

              {/* Admin Import shortcut */}
              {onOpenAdminImport && (
                <button
                  onClick={onOpenAdminImport}
                  className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors items-center gap-1.5 cursor-pointer"
                  title="Import Content Master"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin / CMS</span>
                </button>
              )}

              {/* Logout */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition-colors cursor-pointer"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 border-t border-slate-800/80 overflow-x-auto py-1">
            <button
              onClick={() => navigateTo('dashboard', 'teacher')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dasbor</span>
            </button>

            <button
              onClick={() => navigateTo('classes', 'teacher/classes')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                currentTab === 'classes' || currentTab === 'class_detail'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kelas</span>
            </button>

            <button
              onClick={() => navigateTo('analytics', 'teacher/analytics')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                currentTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analisis</span>
            </button>

            <button
              onClick={() => navigateTo('final_mission_event', 'teacher/final-mission')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                currentTab === 'final_mission_event'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-amber-300/80 hover:text-amber-200 hover:bg-slate-800'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-500" />
              <span>Main Bareng & Peringkat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main View Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'dashboard' && (
          <TeacherDashboardView
            onNavigateToClasses={() => navigateTo('classes', 'teacher/classes')}
            onNavigateToAnalytics={() => navigateTo('analytics', 'teacher/analytics')}
            onSelectClass={handleSelectClass}
          />
        )}

        {currentTab === 'classes' && (
          <TeacherClassesView onSelectClass={handleSelectClass} />
        )}

        {currentTab === 'class_detail' && (
          <TeacherClassDetailView
            classId={selectedClassId}
            onBack={() => navigateTo('classes', 'teacher/classes')}
          />
        )}

        {currentTab === 'analytics' && (
          <TeacherConceptAnalysisView />
        )}

        {currentTab === 'final_mission_event' && (
          <FinalMissionEventManagement onPlayAsStudent={onBackToStudent} />
        )}
      </main>

      {/* System Footer Credit */}
      <Footer />
    </div>
  );
};
