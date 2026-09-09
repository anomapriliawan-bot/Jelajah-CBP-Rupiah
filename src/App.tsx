/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { RealmCards } from './components/RealmCards';
import { ProgressSection } from './components/ProgressSection';
import { MissionModal } from './components/MissionModal';
import { BadgeModal } from './components/BadgeModal';
import { ProfileModal } from './components/ProfileModal';
import { Footer } from './components/Footer';
import { ImportContentMaster } from './pages/admin/ImportContentMaster';
import { TeacherPortal } from './pages/teacher/TeacherPortal';
import { LoginPage } from './pages/auth/LoginPage';
import { JourneyPage } from './pages/student/JourneyPage';
import { FinalMissionPage } from './pages/student/FinalMissionPage';
import { MissionDetailPage } from './pages/student/MissionDetailPage';
import { MissionLearnPage } from './pages/student/MissionLearnPage';
import { MissionActivityPage } from './pages/student/MissionActivityPage';
import { MissionPracticePage } from './pages/student/MissionPracticePage';
import { MissionReflectionPage } from './pages/student/MissionReflectionPage';
import { MissionResultPage } from './pages/student/MissionResultPage';
import { initialProfile, realmsData, dailyActivitiesData } from './data/mockData';
import { Realm, DailyActivity, StudentProfile, Badge, User } from './types';
import { db, normalizeMissionId } from './services/db';
import { sounds } from './utils/audio';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => db.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>(() => {
    const user = db.getCurrentUser();
    if (!user) return 'login';
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (hash === 'login' || hash === 'auth') return 'login';
    if (hash.startsWith('teacher')) return 'teacher';
    if (hash.includes('admin') || hash.includes('import')) return 'admin_import';
    if (hash.includes('final') || hash.includes('akhir') || hash.includes('penjelajah')) return 'final_mission';
    if (hash.includes('journey') || hash === 'misi') return 'journey';
    return 'beranda';
  });
  const [currentMissionId, setCurrentMissionId] = useState<string>('JR-C01');
  const [profile, setProfile] = useState<StudentProfile>(initialProfile);
  const [realms, setRealms] = useState<Realm[]>(realmsData);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>(dailyActivitiesData);

  // Modal States
  const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);
  const [selectedStep, setSelectedStep] = useState<number>(1);
  const [isBadgesOpen, setIsBadgesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Sync with DB & Active User Profile
  useEffect(() => {
    const loadDbData = () => {
      const dbBadges = db.getBadges();
      setBadges(dbBadges);

      const user = db.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setProfile((prev) => ({
          ...prev,
          name: user.name,
          currentXp: user.currentXp ?? prev.currentXp,
          maxXp: user.maxXp ?? prev.maxXp,
          level: user.level ?? prev.level,
          points: user.points ?? prev.points,
          gender: user.gender ?? prev.gender,
          grade: user.grade ?? prev.grade,
          school: user.school ?? prev.school,
        }));
      } else {
        setCurrentUser(null);
      }
    };

    loadDbData();
    const unsub = db.subscribe(loadDbData);

    // Hash Router Parser
    const checkHash = () => {
      const user = db.getCurrentUser();
      const hash = window.location.hash.replace(/^#\/?/, '');
      const lower = hash.toLowerCase();

      // If user is not logged in, enforce login page
      if (!user) {
        setActiveTab('login');
        return;
      }

      if (lower === 'login' || lower === 'auth') {
        setActiveTab('login');
      } else if (lower.startsWith('teacher')) {
        setActiveTab('teacher');
      } else if (lower.includes('admin') || lower.includes('import')) {
        if (['admin', 'superadmin', 'reviewer', 'viewer'].includes(user.role)) {
          setActiveTab('admin_import');
        } else {
          setActiveTab('beranda');
          window.location.hash = '';
        }
      } else if (lower.includes('final') || lower.includes('akhir') || lower.includes('penjelajah')) {
        setActiveTab('final_mission');
      } else if (lower.includes('journey') || lower === 'student/journey' || lower === 'misi') {
        setActiveTab('journey');
      } else if (lower.startsWith('student/mission/') || lower.startsWith('mission/')) {
        const parts = hash.split('/');
        let rawId = 'JR-C01';
        let section = '';

        if (parts[0].toLowerCase() === 'student' && parts[1]?.toLowerCase() === 'mission') {
          rawId = parts[2] || 'JR-C01';
          section = (parts[3] || '').toLowerCase();
        } else if (parts[0].toLowerCase() === 'mission') {
          rawId = parts[1] || 'JR-C01';
          section = (parts[2] || '').toLowerCase();
        }

        const canonicalId = normalizeMissionId(rawId);
        setCurrentMissionId(canonicalId);

        if (section === 'learn') {
          setActiveTab('mission_learn');
        } else if (section === 'activity') {
          setActiveTab('mission_activity');
        } else if (section === 'practice') {
          setActiveTab('mission_practice');
        } else if (section === 'reflection') {
          setActiveTab('mission_reflection');
        } else if (section === 'result') {
          setActiveTab('mission_result');
        } else {
          setActiveTab('mission_detail');
        }
      } else {
        setActiveTab('beranda');
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);

    return () => {
      unsub();
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  // Navigation Helpers with Hash Updates
  const navigateTo = (tab: string, hash?: string) => {
    setActiveTab(tab);
    if (hash !== undefined) {
      window.location.hash = hash;
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    db.setCurrentUser(user);

    // Update profile accordingly
    setProfile((prev) => ({
      ...prev,
      name: user.name,
      currentXp: user.currentXp ?? prev.currentXp,
      maxXp: user.maxXp ?? prev.maxXp,
      level: user.level ?? prev.level,
      points: user.points ?? prev.points,
      gender: user.gender ?? prev.gender,
      grade: user.grade ?? prev.grade,
      school: user.school ?? prev.school,
    }));

    // Redirect to designated role home
    if (user.role === 'teacher') {
      navigateTo('teacher', 'teacher');
    } else if (['admin', 'reviewer', 'viewer', 'superadmin'].includes(user.role)) {
      navigateTo('admin_import', 'admin/import');
    } else {
      navigateTo('beranda', '');
    }
  };

  const handleLogout = () => {
    sounds.playPop();
    db.logout();
    setCurrentUser(null);
    navigateTo('login', 'login');
  };

  const handleSwitchAccount = () => {
    sounds.playPop();
    navigateTo('login', 'login');
  };

  const handleSelectMission = (missionId: string) => {
    setCurrentMissionId(missionId);
    navigateTo('mission_detail', `student/mission/${missionId}`);
  };

  const handleStartLearn = (missionId: string) => {
    setCurrentMissionId(missionId);
    navigateTo('mission_learn', `student/mission/${missionId}/learn`);
  };

  const handleStartActivity = (missionId: string) => {
    setCurrentMissionId(missionId);
    navigateTo('mission_activity', `student/mission/${missionId}/activity`);
  };

  const handleStartPractice = (missionId: string) => {
    setCurrentMissionId(missionId);
    navigateTo('mission_practice', `student/mission/${missionId}/practice`);
  };

  const handleStartReflection = (missionId: string) => {
    setCurrentMissionId(missionId);
    navigateTo('mission_reflection', `student/mission/${missionId}/reflection`);
  };

  const handleViewResult = (missionId: string) => {
    setCurrentMissionId(missionId);
    navigateTo('mission_result', `student/mission/${missionId}/result`);
  };

  // Handlers for Homepage Interactions
  const handleOpenRealm = (realm?: Realm) => {
    sounds.playPop();
    navigateTo('journey', 'student/journey');
  };

  const handleOpenStep = (realm?: Realm, stepId: number = 1) => {
    sounds.playPop();
    let missionCode = 'JR-C01';
    if (realm?.id === 'cinta') {
      missionCode = stepId === 1 ? 'JR-C01' : stepId === 2 ? 'JR-C02' : 'JR-C03';
    } else if (realm?.id === 'bangga') {
      missionCode = stepId === 1 ? 'JR-B04' : stepId === 2 ? 'JR-B05' : 'JR-B06';
    } else if (realm?.id === 'paham') {
      missionCode = stepId === 1 ? 'JR-P07' : stepId === 2 ? 'JR-P08' : 'JR-P09';
    }
    setCurrentMissionId(missionCode);
    navigateTo('mission_detail', `student/mission/${missionCode}`);
  };

  const handleCompleteStep = (pointsGain: number, xpGain: number) => {
    setProfile((prev) => {
      const newPoints = (prev?.points || 0) + pointsGain;
      const newXp = (prev?.currentXp || 0) + xpGain;
      let newLevel = prev?.level || 1;
      let maxXp = prev?.maxXp || 600;
      let currentXp = newXp;

      if (newXp >= maxXp) {
        newLevel += 1;
        currentXp = newXp - maxXp;
        maxXp = Math.round(maxXp * 1.25);
      }

      return {
        ...prev,
        points: newPoints,
        level: newLevel,
        currentXp,
        maxXp,
      };
    });
  };

  const handleClaimDaily = () => {
    setProfile((prev) => ({
      ...prev,
      points: (prev?.points || 0) + 100,
      currentXp: (prev?.currentXp || 0) + 50,
    }));
  };

  const handleActivityClick = (act?: DailyActivity) => {
    navigateTo('journey', 'student/journey');
  };

  const handleUpdateProfile = (updated: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  // VIEW ROUTING
  if (!currentUser || activeTab === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onExploreAsGuest={() => {
          sounds.playPop();
          const guest = db.setGuestSession();
          setCurrentUser(guest);
          navigateTo('beranda', '');
        }}
      />
    );
  }

  if (activeTab === 'teacher' || activeTab.startsWith('teacher')) {
    const isGuest = currentUser?.isGuest || currentUser?.id === 'USR-GUEST' || db.isCurrentGuest();
    if (currentUser?.role === 'student' || isGuest) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🔒
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Khusus Guru</h2>
            <p className="text-sm text-slate-600 mb-6">
              Halaman ini diperuntukkan bagi Bapak/Ibu Guru dan Tenaga Pendidik. Akun Anda saat ini masuk sebagai <strong>{isGuest ? 'Pengguna Tamu' : 'Siswa'}</strong>.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigateTo('beranda', '')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                Kembali ke Mode Siswa
              </button>
              <button
                onClick={handleSwitchAccount}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all cursor-pointer"
              >
                Ganti Akun (Guru / Admin)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <TeacherPortal
        onBackToStudent={() => {
          sounds.playPop();
          navigateTo('beranda', '');
        }}
        onOpenAdminImport={() => {
          sounds.playPop();
          navigateTo('admin_import', 'admin/import');
        }}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
      />
    );
  }

  if (activeTab === 'admin_import') {
    const isGuest = currentUser?.isGuest || currentUser?.id === 'USR-GUEST' || db.isCurrentGuest();
    if (currentUser?.role === 'student' || isGuest) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🛡️
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Admin / CMS</h2>
            <p className="text-sm text-slate-600 mb-6">
              Halaman ini diperuntukkan bagi Administrator Konten Master. Akun Anda saat ini masuk sebagai <strong>{isGuest ? 'Pengguna Tamu' : 'Siswa'}</strong>.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigateTo('beranda', '')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                Kembali ke Mode Siswa
              </button>
              <button
                onClick={handleSwitchAccount}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all cursor-pointer"
              >
                Ganti Akun (Admin)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <ImportContentMaster
        onBackToApp={() => {
          sounds.playPop();
          navigateTo('beranda', '');
        }}
        onOpenFinalMission={() => {
          sounds.playPop();
          navigateTo('final_mission', 'final-mission');
        }}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
      />
    );
  }

  if (activeTab === 'journey' || activeTab === 'misi') {
    return (
      <JourneyPage
        onSelectMission={handleSelectMission}
        onBackToHome={() => {
          sounds.playPop();
          navigateTo('beranda', '');
        }}
        onOpenBadgeShowcase={() => setIsBadgesOpen(true)}
        onOpenFinalMission={() => {
          sounds.playPop();
          navigateTo('final_mission', 'final-mission');
        }}
      />
    );
  }

  if (activeTab === 'final_mission') {
    return (
      <FinalMissionPage
        onBack={() => {
          sounds.playPop();
          if (currentUser?.role === 'admin') {
            navigateTo('admin_import', 'admin/import#final-mission');
          } else {
            navigateTo('journey', 'student/journey');
          }
        }}
        onNavigateHome={() => {
          sounds.playPop();
          navigateTo('beranda', '');
        }}
        onOpenMissions={() => {
          sounds.playPop();
          navigateTo('journey', 'student/journey');
        }}
        onOpenAdmin={() => {
          sounds.playPop();
          navigateTo('admin_import', 'admin/import#final-mission');
        }}
      />
    );
  }

  if (activeTab === 'mission_detail') {
    return (
      <MissionDetailPage
        missionId={currentMissionId}
        onBackToJourney={() => {
          sounds.playPop();
          navigateTo('journey', 'student/journey');
        }}
        onStartLearn={handleStartLearn}
        onStartActivity={handleStartActivity}
        onStartPractice={handleStartPractice}
        onStartReflection={handleStartReflection}
        onViewResult={handleViewResult}
      />
    );
  }

  if (activeTab === 'mission_learn') {
    return (
      <MissionLearnPage
        missionId={currentMissionId}
        onBackToDetail={handleSelectMission}
        onContinueToActivity={handleStartActivity}
      />
    );
  }

  if (activeTab === 'mission_activity') {
    return (
      <MissionActivityPage
        missionId={currentMissionId}
        onBackToDetail={handleSelectMission}
        onContinueToPractice={handleStartPractice}
      />
    );
  }

  if (activeTab === 'mission_practice') {
    return (
      <MissionPracticePage
        missionId={currentMissionId}
        onBackToDetail={handleSelectMission}
        onContinueToReflection={handleStartReflection}
      />
    );
  }

  if (activeTab === 'mission_reflection') {
    return (
      <MissionReflectionPage
        missionId={currentMissionId}
        onBackToDetail={handleSelectMission}
        onFinishMission={handleViewResult}
      />
    );
  }

  if (activeTab === 'mission_result') {
    return (
      <MissionResultPage
        missionId={currentMissionId}
        onBackToJourney={() => {
          sounds.playPop();
          navigateTo('journey', 'student/journey');
        }}
        onGoToNextMission={(nextId) => {
          sounds.playPop();
          handleSelectMission(nextId);
        }}
      />
    );
  }

  // DEFAULT: HOMEPAGE (Preserved exactly as requested)
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 selection:bg-blue-200 selection:text-blue-900 font-sans antialiased">
      {/* Top Fixed / Sticky Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'misi' || tab === 'journey') {
            navigateTo('journey', 'student/journey');
          } else if (tab === 'final_mission') {
            navigateTo('final_mission', 'final-mission');
          } else {
            navigateTo(tab, tab === 'beranda' ? '' : tab);
          }
        }}
        profile={profile}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenBadges={() => setIsBadgesOpen(true)}
        onOpenFinalMission={() => navigateTo('final_mission', 'final-mission')}
        onOpenAdminImport={() => navigateTo('admin_import', 'admin/import')}
        onOpenTeacherPortal={() => navigateTo('teacher', 'teacher')}
        onOpenLogin={() => navigateTo('login', 'login')}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
      />

      {/* Main Page Layout */}
      <main className="flex-1 flex flex-col w-full pb-16">
        {/* Hero Section with Balinese Atmosphere, Mascot Rupi, Official Logo & Welcome */}
        <HeroSection
          gender={profile.gender}
          onStartLearning={() => navigateTo('journey', 'student/journey')}
          onExploreMissions={() => navigateTo('journey', 'student/journey')}
          onRupiClick={() => {
            sounds.playPop();
            navigateTo('journey', 'student/journey');
          }}
        />

        {/* 3 Main World Cards (Cinta, Bangga, Paham Rupiah) & Misi Akhir */}
        <RealmCards
          realms={realms}
          onSelectRealm={handleOpenRealm}
          onSelectStep={handleOpenStep}
          onOpenFinalMission={() => {
            sounds.playPop();
            navigateTo('final_mission', 'final-mission');
          }}
        />

        {/* Bottom 2-Column Section: Kemajuan Belajarmu & Lencana Terkini */}
        <ProgressSection
          profile={profile}
          badges={badges}
          onOpenBadges={() => setIsBadgesOpen(true)}
        />
      </main>

      {/* System Footer Credit */}
      <Footer />

      {/* Interactive Mission & 5J Simulator Modal */}
      {selectedRealm && (
        <MissionModal
          realm={selectedRealm}
          initialStep={selectedStep}
          onClose={() => setSelectedRealm(null)}
          onCompleteStep={handleCompleteStep}
        />
      )}

      {/* Badge Showcase Modal */}
      {isBadgesOpen && (
        <BadgeModal
          badges={badges}
          onClose={() => setIsBadgesOpen(false)}
        />
      )}

      {/* Profile & Grade Settings Modal */}
      {isProfileOpen && (
        <ProfileModal
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setIsProfileOpen(false)}
          onLogout={() => {
            setIsProfileOpen(false);
            handleLogout();
          }}
          onSwitchAccount={() => {
            setIsProfileOpen(false);
            handleSwitchAccount();
          }}
        />
      )}
    </div>
  );
}
