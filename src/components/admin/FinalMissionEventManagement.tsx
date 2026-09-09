import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Trophy,
  Crown,
  Medal,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Save,
  Download,
  Filter,
  ShieldCheck,
  Lock,
  Unlock,
  Radio,
  Timer,
  Zap,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../../services/db';
import {
  FinalMissionEventSchedule,
  FinalMissionLeaderboardEntry,
  FinalMissionStage,
  FinalMissionStageAccessConfig,
} from '../../types';
import { sounds } from '../../utils/audio';

interface FinalMissionEventManagementProps {
  onPlayAsStudent?: () => void;
  compact?: boolean;
}

export const FinalMissionEventManagement: React.FC<FinalMissionEventManagementProps> = ({
  onPlayAsStudent,
  compact = false,
}) => {
  const currentUser = db.getCurrentUser();
  const [accessConfig, setAccessConfig] = useState<FinalMissionStageAccessConfig>(() =>
    db.getFinalMissionStageAccess()
  );

  const [leaderboard, setLeaderboard] = useState<FinalMissionLeaderboardEntry[]>([]);
  const [stageFilter, setStageFilter] = useState<FinalMissionStage | 'all'>('all');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Form State for Event Schedule
  const [isEnabled, setIsEnabled] = useState<boolean>(
    accessConfig.eventSchedule?.enabled ?? false
  );
  const [eventTitle, setEventTitle] = useState<string>(
    accessConfig.eventSchedule?.title || 'Main Bareng Misi Akhir CBP Rupiah'
  );
  const [startDate, setStartDate] = useState<string>(
    accessConfig.eventSchedule?.startDate || ''
  );
  const [endDate, setEndDate] = useState<string>(
    accessConfig.eventSchedule?.endDate || ''
  );
  const [description, setDescription] = useState<string>(
    accessConfig.eventSchedule?.description ||
      'Sesi pengerjaan Misi Akhir bersama seluruh siswa di sekolah.'
  );

  // Load Leaderboard & Config
  const loadData = () => {
    const config = db.getFinalMissionStageAccess();
    setAccessConfig(config);
    const schedule = config.eventSchedule;
    if (schedule) {
      setIsEnabled(schedule.enabled);
      setEventTitle(schedule.title || 'Main Bareng Misi Akhir CBP Rupiah');
      setStartDate(schedule.startDate || '');
      setEndDate(schedule.endDate || '');
      setDescription(schedule.description || '');
    }

    const lb = db.getFinalMissionLeaderboard({
      stage: stageFilter,
      classId: classFilter,
      schoolId: currentUser?.role !== 'superadmin' ? currentUser?.schoolId : undefined,
    });
    setLeaderboard(lb);
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [stageFilter, classFilter]);

  // Event status evaluation
  const eventStatus = useMemo(() => {
    return db.getFinalMissionEventStatus(currentUser?.id, currentUser);
  }, [accessConfig, currentUser]);

  // Quick Preset Handlers
  const handlePreset2Hours = () => {
    sounds.playPop();
    const now = new Date();
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toInputVal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setStartDate(toInputVal(now));
    setEndDate(toInputVal(end));
    setIsEnabled(true);
  };

  const handlePresetToday = () => {
    sounds.playPop();
    const now = new Date();
    const end = new Date(now);
    end.setHours(16, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toInputVal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setStartDate(toInputVal(now));
    setEndDate(toInputVal(end));
    setIsEnabled(true);
  };

  const handlePresetTomorrow = () => {
    sounds.playPop();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const endTomorrow = new Date(tomorrow);
    endTomorrow.setHours(11, 30, 0, 0);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const toInputVal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setStartDate(toInputVal(tomorrow));
    setEndDate(toInputVal(endTomorrow));
    setIsEnabled(true);
  };

  // Save Event Schedule
  const handleSaveSchedule = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sounds.playSuccess();

    if (isEnabled && (!startDate || !endDate)) {
      alert('Mohon tentukan tanggal & jam mulai serta tanggal & jam selesai event.');
      return;
    }

    if (isEnabled && new Date(startDate).getTime() >= new Date(endDate).getTime()) {
      alert('Waktu selesai harus lebih besar (setelah) dari waktu mulai.');
      return;
    }

    const schedule: FinalMissionEventSchedule = {
      enabled: isEnabled,
      title: eventTitle.trim() || 'Main Bareng Misi Akhir CBP Rupiah',
      startDate,
      endDate,
      schoolId: currentUser?.school || 'ALL',
      description: description.trim(),
      updatedBy: currentUser?.name || currentUser?.username || 'Admin Sekolah',
      updatedAt: new Date().toISOString(),
    };

    db.saveFinalMissionStageAccess({
      eventSchedule: schedule,
    });

    setIsEditingSchedule(false);
    setSaveSuccessMsg(
      isEnabled
        ? 'Jadwal Main Bareng berhasil diaktifkan dan disimpan!'
        : 'Mode Main Bareng dinonaktifkan (Misi Akhir kembali ke Mode Mandiri).'
    );
    setTimeout(() => setSaveSuccessMsg(''), 4500);
  };

  const handleDisableEvent = () => {
    sounds.playPop();
    if (window.confirm('Nonaktifkan sesi Main Bareng? Siswa yang sudah tuntas 9 misi akan dapat mengakses Misi Akhir secara mandiri.')) {
      setIsEnabled(false);
      const schedule: FinalMissionEventSchedule = {
        ...(accessConfig.eventSchedule || {
          title: 'Main Bareng Misi Akhir CBP Rupiah',
          startDate: '',
          endDate: '',
        }),
        enabled: false,
        updatedBy: currentUser?.name || 'Admin Sekolah',
        updatedAt: new Date().toISOString(),
      };
      db.saveFinalMissionStageAccess({ eventSchedule: schedule });
      setSaveSuccessMsg('Sesi Main Bareng dinonaktifkan. Mode mandiri aktif.');
      setTimeout(() => setSaveSuccessMsg(''), 4500);
    }
  };

  // Export Leaderboard to Excel
  const handleExportExcel = () => {
    sounds.playPop();
    if (leaderboard.length === 0) {
      alert('Belum ada data pengerjaan pada papan peringkat untuk diekspor.');
      return;
    }

    const exportRows = leaderboard.map((row) => ({
      Peringkat: row.rank,
      'Nama Siswa': row.studentName,
      NISN: row.nisn || '-',
      Kelas: row.className || '-',
      Sekolah: row.schoolName || '-',
      Tahap: row.stageTitle,
      'Nilai Akhir': row.score,
      'Waktu Pengerjaan': row.formattedDuration,
      'Durasi (Detik)': row.durationSeconds,
      'Jumlah Benar': `${row.correctCount} / ${row.totalQuestions}`,
      'Status Kelulusan': row.passed ? 'Lulus' : 'Belum Lulus',
      'Waktu Selesai': new Date(row.completedAt).toLocaleString('id-ID'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leaderboard Misi Akhir');

    const fileName = `Peringkat_Main_Bareng_Misi_Akhir_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Podium Winners (Top 3)
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  // Distinct classes for filter
  const classesList = useMemo(() => {
    return db.getClasses();
  }, []);

  return (
    <div className="space-y-6">
      {/* SUCCESS NOTIFICATION */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* TOP HEADER & EVENT STATUS OVERVIEW */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 text-[11px] font-black uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Event Khusus Misi Akhir Sekolah</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Main Bareng & Papan Peringkat</span>
              {eventStatus.isEventMode ? (
                eventStatus.status === 'active' ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Sedang Aktif
                  </span>
                ) : eventStatus.status === 'upcoming' ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Terjadwal (Akan Datang)
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold">
                    Sesi Telah Berakhir
                  </span>
                )
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-bold">
                  Mode Mandiri
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Atur jadwal pelaksanaan evaluasi Misi Akhir secara serentak bersama siswa di sekolah.
              Siswa yang sudah menyelesaikan <strong>9 misi utama</strong> dapat mengerjakan pada rentang waktu ini,
              dan sistem secara otomatis menyusun peringkat juara berdasarkan nilai dan kecepatan waktu pengerjaan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {!isEditingSchedule ? (
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsEditingSchedule(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-slate-950" />
                <span>Atur Jadwal Main Bareng</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsEditingSchedule(false);
                }}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Batal Edit
              </button>
            )}

            {eventStatus.isEventMode && (
              <button
                type="button"
                onClick={handleDisableEvent}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition-all cursor-pointer"
                title="Nonaktifkan event dan kembalikan ke pengerjaan mandiri"
              >
                Nonaktifkan Event
              </button>
            )}

            {onPlayAsStudent && (
              <button
                type="button"
                onClick={onPlayAsStudent}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Uji Sebagai Siswa</span>
              </button>
            )}
          </div>
        </div>

        {/* RULE CALLOUT: Otoritas Admin Sekolah & Syarat 9 Misi */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-blue-950">Kewenangan Terbatas Admin Sekolah:</span>
              <p className="text-blue-800 mt-0.5">
                Admin sekolah hanya mengendalikan jadwal/periode event. Butir soal dan bobot evaluasi tetap
                terpusat di bawah kendali Admin Pusat BI.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-2.5 text-amber-900">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-amber-950">Syarat Mutlak 9 Misi:</span>
              <p className="text-amber-800 mt-0.5">
                Walaupun jadwal main bareng dibuka, siswa yang belum menuntaskan 9 misi (Cinta, Bangga, Paham)
                tetap tidak dapat membuka Misi Akhir sampai menyelesaikannya.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULE CONFIGURATION FORM (COLLAPSIBLE / MODAL-LIKE DRAWER) */}
      {isEditingSchedule && (
        <form
          onSubmit={handleSaveSchedule}
          className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 sm:p-7 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-3"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Form Pengaturan Periode Main Bareng</h3>
                <p className="text-xs text-slate-400">
                  Tentukan rentang tanggal dan jam pelaksanaan evaluasi bersama di sekolah
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Admin Sekolah
            </span>
          </div>

          {/* Mode Selector Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsEnabled(true)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                isEnabled
                  ? 'bg-amber-500/15 border-amber-400 text-amber-200 ring-2 ring-amber-400/40'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${isEnabled ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'}`}>
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-black text-white">Mode Main Bareng (Terjadwal)</div>
                <div className="text-xs text-slate-400 mt-1">
                  Misi Akhir hanya terbuka serentak pada periode tanggal dan jam yang Anda tentukan di bawah ini.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsEnabled(false)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                !isEnabled
                  ? 'bg-blue-500/15 border-blue-400 text-blue-200 ring-2 ring-blue-400/40'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${!isEnabled ? 'bg-blue-400 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'}`}>
                <Unlock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-black text-white">Mode Mandiri (Standar)</div>
                <div className="text-xs text-slate-400 mt-1">
                  Tidak ada jadwal event. Siswa dapat membuka Misi Akhir kapan saja segera setelah menuntaskan 9 misi.
                </div>
              </div>
            </button>
          </div>

          {isEnabled && (
            <div className="space-y-4 pt-2">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Judul Sesi Main Bareng
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Contoh: Main Bareng Misi Akhir Kelas 5 Semester Genap"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Quick Presets */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Preset Jadwal Cepat:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePreset2Hours}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                  >
                    ⚡ Mulai Sekarang (Durasi 2 Jam)
                  </button>
                  <button
                    type="button"
                    onClick={handlePresetToday}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                  >
                    ☀️ Hari Ini (Sampai Pukul 16:00 WIB)
                  </button>
                  <button
                    type="button"
                    onClick={handlePresetTomorrow}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                  >
                    📅 Besok Pagi (08:00 - 11:30 WIB)
                  </button>
                </div>
              </div>

              {/* Date & Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tanggal & Jam Mulai (WIB)
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sebelum waktu ini, Misi Akhir akan tetap terkunci dengan pesan hitung mundur.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tanggal & Jam Selesai (WIB)
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Setelah waktu ini, pengerjaan ditutup dan leaderboard final terkunci.
                  </p>
                </div>
              </div>

              {/* Instructions / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Catatan / Instruksi Sekolah untuk Siswa
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Sesi pengerjaan dilakukan di Lab Komputer. Dilarang membuka catatan."
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditingSchedule(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Terapkan Jadwal</span>
            </button>
          </div>
        </form>
      )}

      {/* PODIUM 3 BESAR (JUARA 1, 2, 3) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-indigo-500/20 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
              <Trophy className="w-3 h-3" />
              <span>Podium Kehormatan Siswa</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Pemenang Sesi Main Bareng Misi Akhir
            </h3>
            <p className="text-xs text-slate-300">
              Diurutkan berdasarkan <strong>Nilai Tertinggi</strong>, dan jika nilai kembar diambil siswa dengan{' '}
              <strong>Waktu Paling Cepat</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unduh Rekap Excel</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Perbarui Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Podium Layout */}
        {leaderboard.length === 0 ? (
          <div className="rounded-2xl bg-slate-800/60 border border-slate-700/70 p-8 sm:p-10 text-center relative z-10 max-w-xl mx-auto my-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-3xl mx-auto mb-3 border border-amber-400/30 shadow-inner">
              👑
            </div>
            <h4 className="text-base sm:text-lg font-black text-white mb-2">
              Belum Ada Siswa yang Menyelesaikan Misi Akhir
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Podium Juara 1, 2, dan 3 serta rekap skor akan otomatis terisi secara <em>real-time</em> begitu siswa sekolah Anda menyelesaikan evaluasi Misi Akhir. Data siswa dapat didaftarkan mandiri melalui menu <strong>Kelola Akun Guru & Siswa</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsEditingSchedule(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Atur Jadwal Sesi Main Bareng</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 pt-2">
            {/* JUARA 2 (Perak) */}
            <div className="order-2 md:order-1 rounded-2xl bg-slate-800/70 border border-slate-700/80 p-5 flex flex-col justify-between items-center text-center relative hover:border-slate-500 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-slate-600/30 border border-slate-400/40 flex items-center justify-center text-slate-200 text-xl font-black mb-3 shadow-inner">
                🥈
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 mb-2">
                Juara 2
              </span>
              {top2 ? (
                <div className="space-y-1.5 w-full">
                  <div className="text-base font-black text-white truncate px-2">{top2.studentName}</div>
                  <div className="text-xs text-slate-400">{top2.className} • NISN: {top2.nisn || '-'}</div>
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-around text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Skor Akhir</div>
                      <div className="text-lg font-black text-amber-300">{top2.score}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Waktu Pengerjaan</div>
                      <div className="text-sm font-black text-slate-200 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-sky-400" />
                        {top2.formattedDuration}
                      </div>
                    </div>
                  </div>
                  {top1 && top1.score === top2.score && (
                    <div className="mt-2 text-[10px] px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20">
                      Nilai kembar {top2.score} (selisih +{top2.durationSeconds - top1.durationSeconds}s)
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-6">Belum ada peserta</div>
              )}
            </div>

            {/* JUARA 1 (Emas - Grand Champion) */}
            <div className="order-1 md:order-2 rounded-3xl bg-gradient-to-b from-amber-500/25 via-slate-800 to-slate-900 border-2 border-amber-400 p-6 flex flex-col justify-between items-center text-center relative shadow-2xl shadow-amber-500/20 -mt-2 md:-mt-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 text-3xl font-black mb-3 shadow-lg shadow-amber-500/30">
                👑
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-400 text-slate-950 shadow-sm mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Juara 1 Utama
              </span>
              {top1 ? (
                <div className="space-y-2 w-full">
                  <div className="text-lg font-black text-white tracking-tight px-2">{top1.studentName}</div>
                  <div className="text-xs text-amber-200 font-medium">{top1.className} • NISN: {top1.nisn || '-'}</div>
                  <div className="mt-3 pt-3 border-t border-amber-400/30 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/40 p-2 rounded-xl">
                      <div className="text-[10px] text-slate-400">Nilai Tertinggi</div>
                      <div className="text-2xl font-black text-yellow-300">{top1.score}</div>
                    </div>
                    <div className="bg-slate-950/40 p-2 rounded-xl">
                      <div className="text-[10px] text-slate-400">Waktu Tercepat</div>
                      <div className="text-sm font-black text-emerald-400 mt-1 flex items-center justify-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        {top1.formattedDuration}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-300 font-bold bg-emerald-500/15 py-1 px-2.5 rounded-lg border border-emerald-500/30">
                    ⚡ Tercepat & Tertinggi di Sesi Ini
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-6">Belum ada peserta</div>
              )}
            </div>

            {/* JUARA 3 (Perunggu) */}
            <div className="order-3 rounded-2xl bg-slate-800/70 border border-slate-700/80 p-5 flex flex-col justify-between items-center text-center relative hover:border-slate-500 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-800/30 border border-amber-600/40 flex items-center justify-center text-amber-300 text-xl font-black mb-3 shadow-inner">
                🥉
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 mb-2">
                Juara 3
              </span>
              {top3 ? (
                <div className="space-y-1.5 w-full">
                  <div className="text-base font-black text-white truncate px-2">{top3.studentName}</div>
                  <div className="text-xs text-slate-400">{top3.className} • NISN: {top3.nisn || '-'}</div>
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-around text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Skor Akhir</div>
                      <div className="text-lg font-black text-amber-300">{top3.score}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Waktu Pengerjaan</div>
                      <div className="text-sm font-black text-slate-200 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-sky-400" />
                        {top3.formattedDuration}
                      </div>
                    </div>
                  </div>
                  {top2 && top2.score === top3.score && (
                    <div className="mt-2 text-[10px] px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20">
                      Nilai kembar {top3.score} (selisih +{top3.durationSeconds - top2.durationSeconds}s)
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-6">Belum ada peserta</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FULL LEADERBOARD TABLE WITH FILTERS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Daftar Seluruh Peserta & Skor Pengerjaan</span>
            </h3>
            <p className="text-xs text-slate-500">
              Total {leaderboard.length} peserta tercatat telah mengirimkan lembar evaluasi
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Stage */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setStageFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stageFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Tahap
              </button>
              <button
                onClick={() => setStageFilter('pemula')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stageFilter === 'pemula' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tahap 1
              </button>
              <button
                onClick={() => setStageFilter('terampil')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stageFilter === 'terampil' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tahap 2
              </button>
              <button
                onClick={() => setStageFilter('master')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stageFilter === 'master' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tahap 3
              </button>
            </div>

            {/* Filter Class */}
            {classesList.length > 0 && (
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Semua Kelas</option>
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-3 px-3 w-14 text-center">Posisi</th>
                <th className="py-3 px-4">Nama Siswa & NISN</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3">Tahap Misi</th>
                <th className="py-3 px-3 text-center">Nilai (Skor)</th>
                <th className="py-3 px-3 text-center">Waktu Pengerjaan</th>
                <th className="py-3 px-3 text-center">Jawaban Benar</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Waktu Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Belum ada rekaman pengerjaan untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                leaderboard.map((item) => {
                  const isTop1 = item.rank === 1;
                  const isTop2 = item.rank === 2;
                  const isTop3 = item.rank === 3;

                  return (
                    <tr
                      key={`${item.userId}_${item.stage}_${item.completedAt}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTop1 ? 'bg-amber-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        {isTop1 ? (
                          <span className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 font-black inline-flex items-center justify-center shadow-xs">
                            1
                          </span>
                        ) : isTop2 ? (
                          <span className="w-7 h-7 rounded-xl bg-slate-300 text-slate-900 font-black inline-flex items-center justify-center">
                            2
                          </span>
                        ) : isTop3 ? (
                          <span className="w-7 h-7 rounded-xl bg-amber-200 text-amber-900 font-black inline-flex items-center justify-center">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">#{item.rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.studentName}</div>
                        <div className="text-[11px] text-slate-400">NISN: {item.nisn || '-'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {item.className}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-800">{item.stageTitle}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                          {item.score}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Timer className="w-3 h-3 text-slate-500" />
                          {item.formattedDuration}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {item.correctCount} / {item.totalQuestions}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.passed ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Lulus
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                            Remidi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-[11px] text-slate-400">
                        {new Date(item.completedAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} WIB
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
