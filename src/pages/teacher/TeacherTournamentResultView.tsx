import React, { useState, useEffect } from 'react';
import {
  Trophy,
  ArrowLeft,
  CheckCircle2,
  Download,
  Award,
  Users,
  TrendingUp,
  Percent,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { db } from '../../services/db';
import { TournamentEvent, TournamentResult } from '../../types';

interface TeacherTournamentResultViewProps {
  eventId: string;
  onBack: () => void;
  onCreateMakeup?: (parentEventId: string) => void;
}

export const TeacherTournamentResultView: React.FC<TeacherTournamentResultViewProps> = ({
  eventId,
  onBack,
  onCreateMakeup,
}) => {
  const [event, setEvent] = useState<TournamentEvent | undefined>(
    () => db.getTournamentEvents().find((e) => e.id === eventId) || db.getTournamentEvents()[0]
  );
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMedal, setFilterMedal] = useState<string>('all');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const loadData = () => {
    const currentEvt = db.getTournamentEvents().find((e) => e.id === eventId) || db.getTournamentEvents()[0];
    setEvent(currentEvt);
    if (currentEvt) {
      const res = db.getTournamentResults(currentEvt.id).sort((a, b) => b.score - a.score || a.durationSeconds - b.durationSeconds);
      // Ensure ranks are assigned
      const ranked = res.map((r, idx) => ({ ...r, rank: idx + 1 }));
      setResults(ranked);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return () => unsub();
  }, [eventId]);

  if (!event) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-600 font-bold">Turnamen tidak ditemukan.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">
          Kembali
        </button>
      </div>
    );
  }

  // Statistical calculations
  const totalSubmissions = results.length;
  const passingScore = event.passingScore || 75;
  const passedCount = results.filter((r) => r.score >= passingScore).length;
  const passingRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;

  const scores = results.map((r) => r.score);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;

  // Median
  const sortedScores = [...scores].sort((a, b) => a - b);
  const medianScore = sortedScores.length > 0
    ? sortedScores.length % 2 === 0
      ? Math.round((sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2)
      : sortedScores[Math.floor(sortedScores.length / 2)]
    : 0;

  // Distribution
  const dist = {
    expert: results.filter((r) => r.score >= 90).length,
    competent: results.filter((r) => r.score >= 75 && r.score < 90).length,
    developing: results.filter((r) => r.score >= 60 && r.score < 75).length,
    remedial: results.filter((r) => r.score < 60).length,
  };

  const handleVerifyAll = () => {
    results.forEach((r) => {
      // update result verification
      const allResults = db.getTournamentResults();
      const idx = allResults.findIndex((item) => item.id === r.id);
      if (idx >= 0) {
        allResults[idx].isVerified = true;
      }
    });
    setNotificationMsg('Semua nilai peserta berhasil diverifikasi sekolah.');
    loadData();
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['Peringkat', 'NISN', 'Nama Siswa', 'Skor', 'Medali', 'Waktu Pengerjaan (Detik)', 'Status Verifikasi', 'Tanggal Kirim'];
    const rows = results.map((r) => [
      r.rank || 1,
      `"${r.studentId}"`,
      `"${(r.studentName || 'Siswa').replace(/"/g, '""')}"`,
      r.score,
      r.medal || 'participant',
      r.durationSeconds,
      r.isVerified ? 'Terverifikasi Sekolah' : 'Belum Diverifikasi',
      `"${new Date(r.submittedAt).toLocaleString('id-ID')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hasil_turnamen_${event.code || 'TRN'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = results.filter((r) => {
    const matchQuery = (r.studentName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchMedal = filterMedal === 'all' || r.medal === filterMedal;
    return matchQuery && matchMedal;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Turnamen</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyAll}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verifikasi Semua Nilai</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Ekspor Hasil (CSV)</span>
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Hero Summary Box */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white uppercase">
                {event.category || 'Turnamen BI'}
              </span>
              <span className="text-xs text-slate-300 font-mono">Kode: {event.code}</span>
              <span className="text-xs text-slate-300">• {event.className || 'Kelas 5'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{event.title}</h2>
            <p className="text-xs text-slate-300">
              Laporan hasil evaluasi turnamen standar Bank Indonesia • Nilai kelulusan minimal: {passingScore}%
            </p>
          </div>

          {onCreateMakeup && (
            <button
              onClick={() => onCreateMakeup(event.id)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Sesi Ujian Susulan</span>
            </button>
          )}
        </div>

        {/* 5 Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 p-3.5 rounded-2xl">
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Peserta Hadir</div>
            <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">{totalSubmissions} Siswa</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tingkat kehadiran 100%</div>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl">
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Kelulusan (≥{passingScore})</div>
            <div className="text-xl sm:text-2xl font-black font-mono mt-0.5 text-emerald-400">{passingRate}%</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{passedCount} dari {totalSubmissions} siswa</div>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl">
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Rata-Rata Nilai</div>
            <div className="text-xl sm:text-2xl font-black font-mono mt-0.5 text-amber-300">{avgScore}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Median: {medianScore}</div>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl">
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Nilai Tertinggi</div>
            <div className="text-xl sm:text-2xl font-black font-mono mt-0.5 text-emerald-300">{maxScore}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Skor maksimal</div>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl">
            <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Nilai Terendah</div>
            <div className="text-xl sm:text-2xl font-black font-mono mt-0.5 text-rose-300">{minScore}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Perlu remedial</div>
          </div>
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900">Distribusi Capaian Nilai Siswa</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Sangat Mahir (90-100)</span>
              <span className="text-lg font-black font-mono text-emerald-900">{dist.expert}</span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-2 mt-2">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(dist.expert / (totalSubmissions || 1)) * 100}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800">Mahir (75-89)</span>
              <span className="text-lg font-black font-mono text-blue-900">{dist.competent}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(dist.competent / (totalSubmissions || 1)) * 100}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">Cukup (60-74)</span>
              <span className="text-lg font-black font-mono text-amber-900">{dist.developing}</span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2 mt-2">
              <div className="bg-amber-600 h-full rounded-full" style={{ width: `${(dist.developing / (totalSubmissions || 1)) * 100}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800">Perlu Bimbingan (&lt;60)</span>
              <span className="text-lg font-black font-mono text-rose-900">{dist.remedial}</span>
            </div>
            <div className="w-full bg-rose-200 rounded-full h-2 mt-2">
              <div className="bg-rose-600 h-full rounded-full" style={{ width: `${(dist.remedial / (totalSubmissions || 1)) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table with Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Medali:
            </span>
            <button
              onClick={() => setFilterMedal('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMedal === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterMedal('gold')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMedal === 'gold' ? 'bg-amber-400 text-amber-950' : 'bg-amber-50 text-amber-800'
              }`}
            >
              🥇 Emas
            </button>
            <button
              onClick={() => setFilterMedal('silver')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMedal === 'silver' ? 'bg-slate-400 text-slate-950' : 'bg-slate-100 text-slate-700'
              }`}
            >
              🥈 Perak
            </button>
            <button
              onClick={() => setFilterMedal('bronze')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMedal === 'bronze' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900'
              }`}
            >
              🥉 Perunggu
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4 text-center">Peringkat</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4 text-center">Nilai Akhir</th>
                <th className="p-4 text-center">Medali</th>
                <th className="p-4 text-center">Durasi</th>
                <th className="p-4 text-center">Verifikasi Sekolah</th>
                <th className="p-4 text-right">Waktu Kirim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada hasil yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredResults.map((res) => {
                  const medalEmoji = res.medal === 'gold' ? '🥇 Emas' : res.medal === 'silver' ? '🥈 Perak' : res.medal === 'bronze' ? '🥉 Perunggu' : '🎖️ Peserta';
                  const medalBadge = res.medal === 'gold' ? 'bg-amber-100 text-amber-900 border-amber-300' : res.medal === 'silver' ? 'bg-slate-200 text-slate-900 border-slate-300' : 'bg-amber-50 text-amber-800 border-amber-200';

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-mono font-bold text-xs ${
                          res.rank === 1 ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300' : res.rank === 2 ? 'bg-slate-300 text-slate-900' : res.rank === 3 ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{res.rank}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs">
                            👦
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{res.studentName || 'Siswa'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{res.studentId}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full font-mono font-black text-sm ${
                          res.score >= 90 ? 'bg-emerald-100 text-emerald-900' : res.score >= 75 ? 'bg-blue-100 text-blue-900' : 'bg-rose-100 text-rose-900'
                        }`}>
                          {res.score}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs border ${medalBadge}`}>
                          {medalEmoji}
                        </span>
                      </td>

                      <td className="p-4 text-center font-mono text-slate-600">
                        {Math.floor(res.durationSeconds / 60)}m {res.durationSeconds % 60}s
                      </td>

                      <td className="p-4 text-center">
                        {res.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Belum
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right font-mono text-[11px] text-slate-400">
                        {new Date(res.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
