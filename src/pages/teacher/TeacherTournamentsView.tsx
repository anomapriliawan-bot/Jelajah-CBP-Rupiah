import React, { useState, useEffect } from 'react';
import {
  Trophy,
  PlusCircle,
  Calendar,
  Clock,
  Users,
  Play,
  CheckCircle2,
  AlertCircle,
  Radio,
  BarChart3,
  Search,
  Filter,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../services/db';
import { TournamentEvent, TournamentPackage, Class } from '../../types';

interface TeacherTournamentsViewProps {
  onOpenLiveMonitor: (eventId: string) => void;
  onOpenResults: (eventId: string) => void;
}

export const TeacherTournamentsView: React.FC<TeacherTournamentsViewProps> = ({
  onOpenLiveMonitor,
  onOpenResults,
}) => {
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'active' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Form state for Create Tournament Modal
  const [selectedPackageId, setSelectedPackageId] = useState<string>('PKG-001');
  const [selectedClassId, setSelectedClassId] = useState<string>('CLS-001');
  const [eventTitle, setEventTitle] = useState('Turnamen Cinta Rupiah Kelas 5A');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('08:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingScore, setPassingScore] = useState(75);
  const [eventCode, setEventCode] = useState('CIN-5A');

  const packages = db.getTournamentPackages();
  const teacherClasses = db.getTeacherClasses();

  const loadEvents = () => {
    const list = db.getTournamentEvents();
    setEvents(list);
  };

  useEffect(() => {
    loadEvents();
    const unsub = db.subscribe(loadEvents);
    return () => unsub();
  }, []);

  const handlePackageChange = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const pkg = packages.find((p) => p.id === pkgId);
    const cls = teacherClasses.find((c) => c.id === selectedClassId);
    if (pkg && cls) {
      setEventTitle(`Turnamen ${pkg.title} ${cls.name}`);
      const prefix = pkg.worldId === 'cinta' ? 'CIN' : pkg.worldId === 'bangga' ? 'BGG' : 'PHM';
      setEventCode(`${prefix}-${cls.grade.replace(/\D/g, '') || '5'}${cls.name.slice(-1)}`);
    }
  };

  const handleClassChange = (clsId: string) => {
    setSelectedClassId(clsId);
    const pkg = packages.find((p) => p.id === selectedPackageId);
    const cls = teacherClasses.find((c) => c.id === clsId);
    if (pkg && cls) {
      setEventTitle(`Turnamen ${pkg.title} ${cls.name}`);
      const prefix = pkg.worldId === 'cinta' ? 'CIN' : pkg.worldId === 'bangga' ? 'BGG' : 'PHM';
      setEventCode(`${prefix}-${cls.grade.replace(/\D/g, '') || '5'}${cls.name.slice(-1)}`);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = packages.find((p) => p.id === selectedPackageId);
    const cls = teacherClasses.find((c) => c.id === selectedClassId);

    const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endIso = new Date(new Date(`${startDate}T${startTime}:00`).getTime() + durationMinutes * 60 * 1000).toISOString();

    const newEvt = db.createTournamentEvent({
      packageId: selectedPackageId,
      code: eventCode.toUpperCase(),
      title: eventTitle,
      school: 'SDN Percobaan 01 Bank Indonesia',
      classId: selectedClassId,
      className: cls ? cls.name : 'Kelas 5A',
      teacherId: 'TCH-001',
      category: (pkg?.category || (pkg?.worldId === 'cinta' ? 'cinta' : pkg?.worldId === 'bangga' ? 'bangga' : 'paham')) as 'cinta' | 'bangga' | 'paham' | 'grand',
      startTime: startIso,
      endTime: endIso,
      targetDurationMinutes: durationMinutes,
      totalQuestions: pkg?.totalQuestions || 20,
      passingScore: passingScore,
      status: 'scheduled',
    });

    // Populate students of class as registered participants
    const classMembers = db.getClassMembers().filter((m) => m.classId === selectedClassId);
    const users = db.getUsers();
    classMembers.forEach((m) => {
      const u = users.find((usr) => usr.id === m.userId);
      db.addTournamentParticipant({
        eventId: newEvt.id,
        studentId: m.userId,
        studentName: u?.name || 'Siswa',
        registeredAt: new Date().toISOString(),
        status: 'registered',
        currentQuestion: 0,
        score: 0,
      });
    });

    setIsCreateModalOpen(false);
    setNotificationMsg(`Turnamen "${eventTitle}" berhasil dibuat dan dijadwalkan!`);
    loadEvents();
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleOpenWaitingRoom = (eventId: string) => {
    db.updateTournamentEventStatus(eventId, 'waiting');
    setNotificationMsg('Ruang tunggu ujian dibuka. Siswa dapat mulai masuk.');
    loadEvents();
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleStartNow = (eventId: string) => {
    db.updateTournamentEventStatus(eventId, 'active');
    setNotificationMsg('Turnamen dimulai! Mengalihkan ke Live Monitor...');
    loadEvents();
    setTimeout(() => {
      onOpenLiveMonitor(eventId);
    }, 600);
  };

  const handleCancelEvent = (eventId: string) => {
    if (window.confirm('Batalkan jadwal sesi turnamen ini?')) {
      db.updateTournamentEventStatus(eventId, 'cancelled');
      setNotificationMsg('Jadwal turnamen dibatalkan.');
      loadEvents();
      setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  const handleCreateMakeup = (parentEventId: string) => {
    const makeUp = db.createMakeUpEvent(parentEventId);
    if (makeUp) {
      setNotificationMsg(`Sesi susulan "${makeUp.title}" berhasil dijadwalkan!`);
      loadEvents();
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Filter events
  const filteredEvents = events.filter((evt) => {
    const matchQuery = (evt.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (evt.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (evt.className || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchQuery) return false;

    if (activeStatusTab === 'active') {
      return evt.status === 'active' || evt.status === 'waiting';
    }
    if (activeStatusTab === 'scheduled') {
      return evt.status === 'scheduled';
    }
    if (activeStatusTab === 'completed') {
      return evt.status === 'completed';
    }
    if (activeStatusTab === 'cancelled') {
      return evt.status === 'cancelled';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Turnamen Jelajah Rupiah</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwalkan, buka ruang ujian langsung, pantau pengerjaan secara real-time, dan verifikasi sertifikat siswa.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Buat Turnamen Baru</span>
        </button>
      </div>

      {notificationMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveStatusTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStatusTab === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({events.length})
          </button>
          <button
            onClick={() => setActiveStatusTab('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStatusTab === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            🟢 Berlangsung / Live ({events.filter((e) => e.status === 'active' || e.status === 'waiting').length})
          </button>
          <button
            onClick={() => setActiveStatusTab('scheduled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStatusTab === 'scheduled' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            🔵 Terjadwal ({events.filter((e) => e.status === 'scheduled').length})
          </button>
          <button
            onClick={() => setActiveStatusTab('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStatusTab === 'completed' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            🟣 Selesai ({events.filter((e) => e.status === 'completed').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode / judul turnamen..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tournaments Grid */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak Ada Turnamen Pada Kategori Ini</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Buat jadwal turnamen baru untuk menguji pemahaman siswa mengenai materi Cinta, Bangga, dan Paham Rupiah.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
          >
            + Buat Turnamen Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEvents.map((evt) => {
            const isLive = evt.status === 'active';
            const isWaiting = evt.status === 'waiting';
            const isScheduled = evt.status === 'scheduled';
            const isCompleted = evt.status === 'completed';
            const isCancelled = evt.status === 'cancelled';

            const participants = db.getTournamentParticipants(evt.id);
            const results = db.getTournamentResults(evt.id);

            const categoryBadgeColor =
              evt.category?.includes('Cinta') || evt.packageId === 'PKG-001'
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : evt.category?.includes('Bangga') || evt.packageId === 'PKG-002'
                ? 'bg-amber-100 text-amber-900 border-amber-200'
                : 'bg-emerald-100 text-emerald-900 border-emerald-200';

            return (
              <div
                key={evt.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all bg-white shadow-xs flex flex-col justify-between space-y-4 ${
                  isLive
                    ? 'border-emerald-300 ring-2 ring-emerald-400/20'
                    : isWaiting
                    ? 'border-amber-300 ring-2 ring-amber-400/20'
                    : 'border-slate-200 hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${categoryBadgeColor}`}>
                        {evt.category || 'Turnamen BI'}
                      </span>
                      {evt.isMakeup && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">
                          Sesi Susulan
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-slate-500">{evt.code}</span>
                    </div>

                    {/* Status Badge */}
                    {isLive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 animate-pulse">
                        <Radio className="w-3.5 h-3.5 text-emerald-600" /> LIVE BERLANGSUNG
                      </span>
                    ) : isWaiting ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3.5 h-3.5" /> RUANG TUNGGU
                      </span>
                    ) : isScheduled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Terjadwal
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                        Dibatalkan
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-900 tracking-tight">{evt.title}</h3>
                  <p className="text-xs text-slate-500">Kelas: <span className="font-semibold text-slate-700">{evt.className || 'Kelas 5'}</span> • {evt.school || 'SDN Percobaan 01'}</p>
                </div>

                {/* Event Specs Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Jadwal Mulai</div>
                    <div className="font-bold text-slate-800 font-mono mt-0.5">
                      {new Date(evt.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {new Date(evt.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Durasi & Soal</div>
                    <div className="font-bold text-slate-800 font-mono mt-0.5">
                      {evt.targetDurationMinutes || 30}m ({evt.totalQuestions || 20} Soal)
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Peserta</div>
                    <div className="font-bold text-blue-700 font-mono mt-0.5">
                      {isCompleted ? `${results.length} Nilai` : `${participants.length} Siswa`}
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  {/* Left sub-actions */}
                  <div className="flex items-center gap-2">
                    {isScheduled && (
                      <button
                        onClick={() => handleOpenWaitingRoom(evt.id)}
                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Buka Ruang Tunggu
                      </button>
                    )}
                    {(isScheduled || isWaiting) && (
                      <button
                        onClick={() => handleCancelEvent(evt.id)}
                        className="text-xs text-rose-600 hover:underline cursor-pointer"
                      >
                        Batalkan
                      </button>
                    )}
                    {isCompleted && (
                      <button
                        onClick={() => handleCreateMakeup(evt.id)}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Sesi Susulan</span>
                      </button>
                    )}
                  </div>

                  {/* Right primary action */}
                  <div>
                    {isLive ? (
                      <button
                        onClick={() => onOpenLiveMonitor(evt.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Pantau Live Monitor</span>
                      </button>
                    ) : isWaiting ? (
                      <button
                        onClick={() => handleStartNow(evt.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Mulai Sekarang</span>
                      </button>
                    ) : isCompleted ? (
                      <button
                        onClick={() => onOpenResults(evt.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Lihat Hasil & Analisis</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenLiveMonitor(evt.id)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Detail Sesi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TOURNAMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Buat Turnamen Kelas Baru</h3>
                <p className="text-xs text-slate-300">Pilih paket master materi dan jadwalkan sesi ujian.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              {/* Package Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Paket Turnamen</label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 focus:outline-hidden"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.code} - {pkg.title} ({pkg.totalQuestions} Soal • Kategori {pkg.worldId.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Kelas / Rombel</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 focus:outline-hidden"
                >
                  {teacherClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade} • {cls.academicYear})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Code */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Judul Sesi Turnamen</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Akses</label>
                  <input
                    type="text"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono uppercase font-bold focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Schedule Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai (WIB)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Duration & Passing Score */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durasi Pengerjaan (Menit)</label>
                  <input
                    type="number"
                    min={10}
                    max={90}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Passing Grade (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Simpan & Jadwalkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
