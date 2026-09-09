import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  Lightbulb,
} from 'lucide-react';
import { db } from '../../services/db';
import { FirebaseStatusBadge } from '../../components/FirebaseStatusBadge';

interface TeacherDashboardViewProps {
  onNavigateToClasses: () => void;
  onNavigateToAnalytics: () => void;
  onSelectClass: (classId: string) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  onNavigateToClasses,
  onNavigateToAnalytics,
  onSelectClass,
}) => {
  const currentUser = db.getCurrentUser();
  const teacherName = currentUser?.name || 'Ibu Siti Nurhaliza';
  const [summary, setSummary] = useState(db.getTeacherDashboardSummary());
  const classes = db.getTeacherClasses();

  const reloadData = () => {
    setSummary(db.getTeacherDashboardSummary());
  };

  useEffect(() => {
    reloadData();
    const unsub = db.subscribe(reloadData);
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Selamat Datang, {teacherName}</h2>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <FirebaseStatusBadge />
            <button
              onClick={onNavigateToClasses}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Kelola Kelas</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Siswa */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-500">Jumlah Siswa</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{summary.totalStudents}</div>
          <div className="text-[10px] text-slate-400 font-medium">{classes.length} Rombel Terdaftar</div>
        </div>

        {/* Card 2: Siswa Aktif */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-500">Siswa Aktif</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">{summary.activeStudents}</div>
          <div className="text-[10px] text-emerald-700 font-medium">
            {summary.totalStudents > 0 ? Math.round((summary.activeStudents / summary.totalStudents) * 100) : 0}% Partisipasi
          </div>
        </div>

        {/* Card 3: Rata-rata Progress */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-500">Rata-Rata Progress</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900 font-mono">{summary.avgProgress}%</div>
          <div className="text-[10px] text-slate-400 font-medium">9 Misi Kurikulum</div>
        </div>

        {/* Card 4: Misi Selesai */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-500">Misi Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{summary.totalMissionsCompleted}</div>
          <div className="text-[10px] text-slate-400 font-medium">Dari total materi</div>
        </div>

        {/* Card 5: Rata-rata Latihan */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-500">Rata-Rata Latihan</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900 font-mono">{summary.avgPracticeScore}</div>
          <div className="text-[10px] text-slate-400 font-medium">Skor kuis misi</div>
        </div>

        {/* Card 6: Nilai Terverifikasi */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-500">Nilai Terverifikasi</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">{summary.avgVerifiedScore}</div>
          <div className="text-[10px] text-emerald-800 font-medium">Standar Sekolah</div>
        </div>
      </div>

      {/* Visual Chart & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Across 3 Worlds Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Capaian Kurikulum 3 Dunia Literasi Rupiah
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Persentase ketuntasan materi siswa pada setiap dunia modul</p>
            </div>
            <button
              onClick={onNavigateToAnalytics}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Analisis Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* World 1: Cinta Rupiah */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-black text-rose-950">Dunia 1: Cinta Rupiah (Misi 1 - 3)</span>
                </div>
                <span className="font-mono font-bold text-rose-900">
                  {summary?.worldBreakdown?.cinta ?? summary?.worldStats?.cinta?.rate ?? 0}% Tuntas
                </span>
              </div>
              <div className="w-full bg-rose-200/60 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary?.worldBreakdown?.cinta ?? summary?.worldStats?.cinta?.rate ?? 0}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Mengenali, Merawat 5J, & Mendeteksi 3D Rupiah</span>
                <span>Target BI: 80%</span>
              </div>
            </div>

            {/* World 2: Bangga Rupiah */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-black text-amber-950">Dunia 2: Bangga Rupiah (Misi 4 - 6)</span>
                </div>
                <span className="font-mono font-bold text-amber-900">
                  {summary?.worldBreakdown?.bangga ?? summary?.worldStats?.bangga?.rate ?? 0}% Tuntas
                </span>
              </div>
              <div className="w-full bg-amber-200/60 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary?.worldBreakdown?.bangga ?? summary?.worldStats?.bangga?.rate ?? 0}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Simbol Kedaulatan, Pemersatu Bangsa, & Alat Pembayaran Sah</span>
                <span>Target BI: 80%</span>
              </div>
            </div>

            {/* World 3: Paham Rupiah */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-black text-emerald-950">Dunia 3: Paham Rupiah (Misi 7 - 9)</span>
                </div>
                <span className="font-mono font-bold text-emerald-900">
                  {summary?.worldBreakdown?.paham ?? summary?.worldStats?.paham?.rate ?? 0}% Tuntas
                </span>
              </div>
              <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary?.worldBreakdown?.paham ?? summary?.worldStats?.paham?.rate ?? 0}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Transaksi Bijak, Kebutuhan vs Keinginan, & Menabung Cerdas</span>
                <span>Target BI: 80%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Diagnostic Insights Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Rekomendasi Pembelajaran</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Berdasarkan hasil analisis latihan siswa terkini, konsep <span className="font-bold text-rose-700">Mendeteksi Keaslian 3D</span> memerlukan penguatan visual di kelas.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
              <div className="font-bold text-slate-800">Saran Aktivitas:</div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Adakan sesi demonstrasi langsung dengan kaca pembesar & sinar UV pada lembar uang Rupiah asli.
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToAnalytics}
            className="w-full py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Buka Analisis Konsep & Remedial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Classes Overview Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Kelas yang Anda Bina</h3>
            <p className="text-xs text-slate-500">Pilih kelas untuk melihat rekapitulasi nilai dan rapor siswa</p>
          </div>
          <button
            onClick={onNavigateToClasses}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Semua Kelas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const students = db.getClassStudents(cls.id);
            const total = students.length;
            const avgProg = total > 0 ? Math.round(students.reduce((a, b) => a + b.progressPercent, 0) / total) : 0;
            const completedCount = students.filter((s) => s.completedMissionsCount >= 9).length;

            return (
              <div
                key={cls.id}
                onClick={() => onSelectClass(cls.id)}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase">
                    {cls.grade}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{total} Siswa</span>
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                    {cls.name}
                  </h4>
                  <p className="text-xs text-slate-500">Wali: {cls.teacherName || 'Ibu Siti'}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Progress Kelas</span>
                    <span className="text-blue-900 font-mono font-bold">{avgProg}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${avgProg}%` }} />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Tuntas 9 Misi: <strong className="text-emerald-600">{completedCount}</strong></span>
                  <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Detail <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
