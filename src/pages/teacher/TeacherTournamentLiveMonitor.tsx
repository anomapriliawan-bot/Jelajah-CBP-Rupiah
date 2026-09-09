import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  Play,
  CheckCircle,
  AlertCircle,
  Radio,
  PlusCircle,
  Square,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  ArrowLeft,
  Award,
  Sparkles,
} from 'lucide-react';
import { db } from '../../services/db';
import { TournamentEvent, TournamentParticipant } from '../../types';

interface TeacherTournamentLiveMonitorProps {
  eventId: string;
  onBack: () => void;
  onViewResults?: (eventId: string) => void;
}

export const TeacherTournamentLiveMonitor: React.FC<TeacherTournamentLiveMonitorProps> = ({
  eventId,
  onBack,
  onViewResults,
}) => {
  const [event, setEvent] = useState<TournamentEvent | undefined>(
    () => db.getTournamentEvents().find((e) => e.id === eventId) || db.getTournamentEvents()[0]
  );
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'submitted' | 'registered' | 'absent'>('all');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(30 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const loadEventData = () => {
    const currentEvents = db.getTournamentEvents();
    const currentEvt = currentEvents.find((e) => e.id === eventId) || currentEvents[0];
    setEvent(currentEvt);

    if (currentEvt) {
      const parts = db.getTournamentParticipants(currentEvt.id);
      setParticipants(parts);
      if (currentEvt.status === 'active') {
        setIsTimerRunning(true);
      }
    }
  };

  useEffect(() => {
    loadEventData();
    const unsub = db.subscribe(loadEventData);
    return () => unsub();
  }, [eventId]);

  // Timer countdown simulation
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (event) {
              db.updateTournamentEventStatus(event.id, 'completed');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeftSeconds, event]);

  if (!event) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-600 font-bold">Turnamen tidak ditemukan.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
        >
          Kembali ke Daftar Turnamen
        </button>
      </div>
    );
  }

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Participant counts
  const totalRegistered = participants.length;
  const activeCount = participants.filter((p) => p.status === 'active').length;
  const submittedCount = participants.filter((p) => p.status === 'submitted').length;
  const absentCount = participants.filter((p) => p.status === 'absent' || p.status === 'registered').length;

  const handleStartTournament = () => {
    db.updateTournamentEventStatus(event.id, 'active');
    setIsTimerRunning(true);
    // Mark registered participants as active
    participants.forEach((p) => {
      if (p.status === 'registered') {
        db.updateTournamentParticipant(p.id, { status: 'active', currentQuestion: 1 });
      }
    });
    setNotificationMsg('Turnamen berhasil dimulai! Siswa dapat mulai mengerjakan.');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleExtendTime = () => {
    setTimeLeftSeconds((prev) => prev + 5 * 60);
    setNotificationMsg('Waktu tambahan +5 menit telah ditambahkan ke semua peserta.');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleForceFinish = () => {
    if (window.confirm('Apakah Anda yakin ingin mengakhiri sesi turnamen ini sekarang? Semua siswa yang aktif akan otomatis tersimpan nilainya.')) {
      db.updateTournamentEventStatus(event.id, 'completed');
      setIsTimerRunning(false);
      participants.forEach((p) => {
        if (p.status === 'active') {
          db.updateTournamentParticipant(p.id, { status: 'submitted' });
        }
      });
      setNotificationMsg('Turnamen telah selesai. Data nilai siap diverifikasi.');
      if (onViewResults) {
        setTimeout(() => onViewResults(event.id), 1200);
      }
    }
  };

  const filteredParticipants = participants.filter((p) => {
    const matchQuery = (p.studentName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Live Banner */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Turnamen</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Live Monitor Aktif
          </span>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-semibold text-blue-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Main Monitoring Header Box */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white uppercase">
                {event.category || 'Turnamen BI'}
              </span>
              <span className="text-xs text-slate-400 font-mono">Kode Sesi: {event.code || 'TRN-2025'}</span>
              <span className="text-xs text-slate-400">• Kelas: {event.className || 'Kelas 5'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{event.title}</h2>
            <p className="text-xs text-slate-300">
              Total {event.totalQuestions || 20} Soal • Ambang Batas Kelulusan: {event.passingScore || 75}% • Durasi: {event.targetDurationMinutes || 30} Menit
            </p>
          </div>

          {/* Large Live Countdown */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800/80 p-4 sm:p-6 rounded-2xl border border-slate-700 shrink-0">
            <div className="text-center sm:text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center sm:justify-end gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Sisa Waktu Sesi</span>
              </div>
              <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${timeLeftSeconds < 300 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                {formatTimer(timeLeftSeconds)}
              </div>
            </div>

            {/* Quick Live Controls */}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {event.status === 'waiting' || event.status === 'scheduled' ? (
                <button
                  onClick={handleStartTournament}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Mulai Sekarang</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleExtendTime}
                    className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
                    <span>+5 Menit Waktu</span>
                  </button>
                  <button
                    onClick={handleForceFinish}
                    className="px-3.5 py-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Akhiri Sesi</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice: Academic Integrity */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
        <div>
          <span className="font-bold">Keamanan & Integritas:</span> Kunci jawaban dan bobot penilaian disembunyikan selama sesi berlangsung untuk menjaga objektivitas ujian sekolah.
        </div>
      </div>

      {/* 4 Participant Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500">Total Terdaftar</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalRegistered}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siswa dalam rombel</div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-800">Sedang Mengerjakan</div>
          <div className="text-2xl font-black text-emerald-900 mt-1 font-mono">{activeCount}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Aktif di ruang ujian</div>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="text-[11px] font-bold text-blue-800">Sudah Selesai / Kirim</div>
          <div className="text-2xl font-black text-blue-900 mt-1 font-mono">{submittedCount}</div>
          <div className="text-[10px] text-blue-700 mt-0.5">Jawaban tersimpan</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-600">Belum Bergabung / Absen</div>
          <div className="text-2xl font-black text-slate-800 mt-1 font-mono">{absentCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Dapat dibuatkan susulan</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({participants.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            🟢 Aktif ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('submitted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'submitted' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            🔵 Selesai ({submittedCount})
          </button>
          <button
            onClick={() => setStatusFilter('absent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'absent' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⚪ Absen ({absentCount})
          </button>
        </div>
      </div>

      {/* Participants Live Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4 text-center">Status Live</th>
                <th className="p-4 text-center">Kemajuan Pengerjaan</th>
                <th className="p-4 text-center">Koneksi</th>
                <th className="p-4 text-right">Waktu Masuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((part) => {
                  const isActive = part.status === 'active';
                  const isSubmitted = part.status === 'submitted';
                  const isAbsent = part.status === 'absent' || part.status === 'registered';

                  return (
                    <tr key={part.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center font-bold text-amber-900 text-xs">
                            👦
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{part.studentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{part.studentId}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Sedang Mengerjakan
                          </span>
                        ) : isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Selesai Dikirim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                            Belum Masuk
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1 min-w-[120px]">
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            Soal {part.currentQuestion || (isSubmitted ? 20 : 0)} / {event.totalQuestions || 20}
                          </span>
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isSubmitted ? 'bg-blue-600' : isActive ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                              style={{
                                width: `${Math.min(100, (((part.currentQuestion || (isSubmitted ? 20 : 0))) / (event.totalQuestions || 20)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${isActive || isSubmitted ? 'bg-emerald-500' : 'bg-slate-300'}`} title="Koneksi stabil" />
                      </td>

                      <td className="p-4 text-right font-mono text-[11px] text-slate-400">
                        {part.joinedAt ? new Date(part.joinedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
