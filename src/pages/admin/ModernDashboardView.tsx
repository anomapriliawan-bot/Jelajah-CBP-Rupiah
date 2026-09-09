import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Award,
  TrendingUp,
  Download,
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  BarChart3,
  Filter,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  Target,
  FileSpreadsheet,
  Crown,
} from 'lucide-react';
import { db } from '../../services/db';
import { sounds } from '../../utils/audio';
import {
  getSchoolDashboardAnalytics,
  getNationalDashboardAnalytics,
  exportSchoolExcelReport,
  exportNationalExcelReport,
  SchoolDashboardData,
  NationalDashboardData,
} from '../../services/dashboardAnalyticsService';

interface ModernDashboardViewProps {
  onNavigateToUsers?: () => void;
  onNavigateToEvent?: () => void;
}

export const ModernDashboardView: React.FC<ModernDashboardViewProps> = ({
  onNavigateToUsers,
  onNavigateToEvent,
}) => {
  const currentUser = db.getCurrentUser();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  // Selected school for Super Admin filter
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('all');

  // Analytics data
  const [schoolData, setSchoolData] = useState<SchoolDashboardData>(() =>
    getSchoolDashboardAnalytics(isSuperAdmin && selectedSchool !== 'all' ? selectedSchool : undefined)
  );
  const [nationalData, setNationalData] = useState<NationalDashboardData>(() =>
    getNationalDashboardAnalytics()
  );

  const refreshData = () => {
    if (isSuperAdmin) {
      setNationalData(getNationalDashboardAnalytics());
    }
    setSchoolData(
      getSchoolDashboardAnalytics(isSuperAdmin && selectedSchool !== 'all' ? selectedSchool : undefined)
    );
  };

  useEffect(() => {
    refreshData();
    const unsub = db.subscribe(refreshData);
    return () => unsub();
  }, [selectedSchool, isSuperAdmin]);

  const allSchools = useMemo(() => db.getSchools(), []);

  // Filtered students in school view
  const filteredStudents = useMemo(() => {
    return schoolData.studentReports.filter((st) => {
      const matchSearch =
        !searchStudent.trim() ||
        st.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
        st.nisn.toLowerCase().includes(searchStudent.toLowerCase());
      const matchGrade = filterGrade === 'all' || st.grade === filterGrade;
      return matchSearch && matchGrade;
    });
  }, [schoolData.studentReports, searchStudent, filterGrade]);

  const handleExportExcel = () => {
    sounds.playPop();
    if (isSuperAdmin && selectedSchool === 'all') {
      exportNationalExcelReport(nationalData);
    } else {
      exportSchoolExcelReport(schoolData);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Banner - Compact, Detailed & Executive */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Daya Jelajah Sekolah dan Siswa</span>
              {!isSuperAdmin && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-blue-200 border border-white/10">
                  {schoolData.schoolName}
                </span>
              )}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-0.5">
              {isSuperAdmin && selectedSchool === 'all' ? (
                <>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <strong>{nationalData.totalSchools}</strong> Sekolah Mitra Terdaftar
                  </span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <strong>{nationalData.totalStudents}</strong> Siswa ({nationalData.nationalParticipationRate}% Aktif)
                  </span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Award className="w-3.5 h-3.5 text-teal-400" />
                    <strong>{nationalData.nationalFinalPassedCount}</strong> Bersertifikat Sang Penjelajah
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <strong>{schoolData.totalStudents}</strong> Siswa Terdaftar
                  </span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Rata-rata Ketuntasan <strong>{schoolData.avgMissionsCompleted}/9 Misi</strong>
                  </span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Award className="w-3.5 h-3.5 text-teal-400" />
                    <strong>{schoolData.finalMissionPassedCount}</strong> Siswa Lulus Asesmen
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Area: Filter & Excel Export */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Super Admin School Filter */}
            {isSuperAdmin && (
              <div className="relative">
                <select
                  value={selectedSchool}
                  onChange={(e) => {
                    sounds.playPop();
                    setSelectedSchool(e.target.value);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer shadow-sm"
                >
                  <option value="all" className="bg-slate-900 text-white">
                    🏛️ Semua Sekolah ({allSchools.length})
                  </option>
                  {allSchools.map((sch) => (
                    <option key={sch.id} value={sch.name} className="bg-slate-900 text-white">
                      🏫 {sch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Export Excel Button - Official Bank Indonesia Blue Theme */}
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 rounded-xl bg-[#002D62] hover:bg-[#005596] active:bg-[#001D42] text-white text-xs font-bold shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer border border-blue-400/30"
              title="Unduh Rapor Jelajah Rupiah format rapi siap print berstandar Bank Indonesia"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-200" />
              <span>
                {isSuperAdmin && selectedSchool === 'all'
                  ? 'Download Rapor Jelajah Rupiah (Semua Sekolah Mitra)'
                  : 'Download Rapor Jelajah Rupiah'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CASE 1: CONSOLIDATED OVERVIEW FOR SUPER ADMIN (When 'all' schools selected) */}
      {/* ========================================================================= */}
      {isSuperAdmin && selectedSchool === 'all' ? (
        <div className="space-y-6">
          {/* 5 Aggregate KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* KPI 1: Sekolah Mitra */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold text-slate-500">Sekolah Mitra</span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {nationalData.totalSchools}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Satuan Pendidikan Binaan</div>
            </div>

            {/* KPI 2: Total Siswa */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold text-slate-500">Total Siswa Binaan</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-950 font-mono">
                {nationalData.totalStudents}
              </div>
              <div className="text-[10px] text-indigo-700 font-medium">
                {nationalData.nationalParticipationRate}% Partisipasi Siswa
              </div>
            </div>

            {/* KPI 3: Guru Pembina */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold text-slate-500">Guru Pembina</span>
                <GraduationCap className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-950 font-mono">
                {nationalData.totalTeachers}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Fasilitator Terdaftar</div>
            </div>

            {/* KPI 4: Rata-rata Skor Agregat */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold text-slate-500">Indeks Agregat CBP</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 font-mono">
                {nationalData.nationalAvgScore}%
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Pemahaman Materi CBP</div>
            </div>

            {/* KPI 5: Lulus Misi Akhir */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold text-slate-500">Lulus Misi Akhir</span>
                <Award className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-teal-700 font-mono">
                {nationalData.nationalFinalPassedCount}
              </div>
              <div className="text-[10px] text-teal-700 font-medium">Gelar Sang Penjelajah</div>
            </div>
          </div>

          {/* 3 Pillars Visual Breakdown (Cinta, Bangga, Paham) */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Analisis Penguasaan 3 Pilar CBP Rupiah (Seluruh Sekolah Mitra)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Data penguasaan materi siswa pada 3 pilar kurikulum Jelajah Rupiah di sekolah rintisan binaan Bank Indonesia.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Skala 0 - 100
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Pillar 1: Cinta */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-rose-950">
                  <span>1. Cinta Rupiah (Misi 1-3)</span>
                  <span className="text-sm font-black font-mono text-rose-700">
                    {nationalData.cintaAvg}%
                  </span>
                </div>
                <div className="text-[11px] text-rose-800 font-medium">
                  Mengenali, Merawat & Menjaga Rupiah
                </div>
                <div className="w-full bg-rose-200/80 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, nationalData.cintaAvg)}%` }}
                  />
                </div>
              </div>

              {/* Pillar 2: Bangga */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-amber-950">
                  <span>2. Bangga Rupiah (Misi 4-6)</span>
                  <span className="text-sm font-black font-mono text-amber-700">
                    {nationalData.banggaAvg}%
                  </span>
                </div>
                <div className="text-[11px] text-amber-800 font-medium">
                  Simbol Kedaulatan & Pembayaran Sah
                </div>
                <div className="w-full bg-amber-200/80 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, nationalData.banggaAvg)}%` }}
                  />
                </div>
              </div>

              {/* Pillar 3: Paham */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-emerald-950">
                  <span>3. Paham Rupiah (Misi 7-9)</span>
                  <span className="text-sm font-black font-mono text-emerald-700">
                    {nationalData.pahamAvg}%
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 font-medium">
                  Bertransaksi, Berbelanja Bijak & Menabung
                </div>
                <div className="w-full bg-emerald-200/80 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, nationalData.pahamAvg)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* School Comparison Table */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Komparasi & Peringkat Seluruh Sekolah Mitra</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Peringkat keaktifan, capaian belajar siswa, dan tingkat kelulusan Misi Akhir antar satuan pendidikan.
                </p>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Klik baris sekolah untuk inspeksi detail
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-600 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Peringkat & Satuan Pendidikan Mitra</th>
                    <th className="py-3 px-3">Wilayah</th>
                    <th className="py-3 px-3 text-center">Total Siswa</th>
                    <th className="py-3 px-3 text-center">❤️ Cinta Rupiah</th>
                    <th className="py-3 px-3 text-center">🦅 Bangga Rupiah</th>
                    <th className="py-3 px-3 text-center">💡 Paham Rupiah</th>
                    <th className="py-3 px-3 text-center">Rata Nilai</th>
                    <th className="py-3 px-3 text-center">🏆 Misi Akhir</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {nationalData.schoolComparisons.map((sc, idx) => (
                    <tr
                      key={sc.schoolName}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      onClick={() => {
                        sounds.playPop();
                        setSelectedSchool(sc.schoolName);
                      }}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                              idx === 0
                                ? 'bg-amber-400 text-amber-950 shadow-xs'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-800'
                                : idx === 2
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                              {sc.schoolName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              NPSN: {sc.npsn}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">{sc.city}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                        {sc.totalStudents}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-rose-700">{sc.cintaAvg}%</span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-amber-700">{sc.banggaAvg}%</span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-emerald-700">{sc.pahamAvg}%</span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-blue-700 font-mono">
                        {sc.avgScore}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">
                          {sc.finalMissionPassedCount} Lulus ({sc.finalMissionPassedRate}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="px-2.5 py-1.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Buka Detail</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE 2: SCHOOL LEVEL VIEW (Admin Sekolah OR Super Admin inspecting school) */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Back button if Super Admin is inspecting a specific school */}
          {isSuperAdmin && selectedSchool !== 'all' && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl p-3 px-4">
              <div className="text-xs text-blue-900 font-bold flex items-center gap-2">
                <span>Sedang memeriksa data detail sekolah:</span>
                <span className="px-2 py-0.5 bg-blue-200 rounded-lg text-blue-950 font-black">
                  {schoolData.schoolName}
                </span>
              </div>
              <button
                onClick={() => setSelectedSchool('all')}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
              >
                ← Kembali ke Konsolidasi Seluruh Sekolah Mitra
              </button>
            </div>
          )}

          {/* 5 KPI Cards for School */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* KPI 1: Total Siswa */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold text-slate-500">Siswa Terdaftar</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {schoolData.totalStudents}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">NPSN: {schoolData.npsn}</div>
            </div>

            {/* KPI 2: Siswa Aktif */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold text-slate-500">Siswa Aktif</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {schoolData.activeStudents}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">
                {schoolData.participationRate}% Partisipasi Belajar
              </div>
            </div>

            {/* KPI 3: Rata-rata Misi Selesai */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold text-slate-500">Rata-Rata Misi</span>
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-950 font-mono">
                {schoolData.avgMissionsCompleted} <span className="text-xs text-slate-400 font-normal">/ 9</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Kurikulum Tuntas</div>
            </div>

            {/* KPI 4: Rata-rata Nilai Ujian */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold text-slate-500">Rata-Rata Nilai</span>
                <Target className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 font-mono">
                {schoolData.avgScore}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Skor Latihan & Kuis</div>
            </div>

            {/* KPI 5: Lulus Misi Akhir */}
            <div
              onClick={() => {
                if (onNavigateToEvent) {
                  sounds.playPop();
                  onNavigateToEvent();
                }
              }}
              className={`p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1 col-span-2 lg:col-span-1 ${
                onNavigateToEvent ? 'cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group' : ''
              }`}
              title={onNavigateToEvent ? 'Klik untuk atur sesi Main Bareng & Papan Peringkat' : undefined}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-amber-700 transition-colors">Lulus Misi Akhir</span>
                <Award className="w-4 h-4 text-teal-600 group-hover:text-amber-600 transition-colors" />
              </div>
              <div className="text-2xl font-black text-teal-700 font-mono">
                {schoolData.finalMissionPassedCount}
              </div>
              <div className="text-[10px] text-teal-700 font-medium flex items-center justify-between">
                <span>{schoolData.finalMissionPassedRate}% Lulus Asesmen BI</span>
                {onNavigateToEvent && <span className="text-[9px] font-bold text-amber-700 underline group-hover:text-amber-800">Atur Event &rarr;</span>}
              </div>
            </div>
          </div>

          {/* Grid 2 Columns: 3 Pillars Progress & Final Mission Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: 3 Pilar CBP Rupiah */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Penguasaan 3 Dimensi CBP Rupiah Sekolah</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Rata-rata skor pemahaman siswa per kelompok dimensi kurikulum.
                </p>
              </div>

              <div className="space-y-3.5 pt-1">
                {/* Cinta */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-rose-900">❤️ 1. Cinta Rupiah (Misi 1-3)</span>
                    <span className="font-mono text-rose-700 font-black">{schoolData.cintaAvg}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-rose-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, schoolData.cintaAvg)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Mengenali 3D, Merawat 5J, dan Menjaga Rupiah</p>
                </div>

                {/* Bangga */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-amber-900">🦅 2. Bangga Rupiah (Misi 4-6)</span>
                    <span className="font-mono text-amber-700 font-black">{schoolData.banggaAvg}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, schoolData.banggaAvg)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Simbol Kedaulatan, Alat Pembayaran Sah & Pemersatu Bangsa</p>
                </div>

                {/* Paham */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-900">💡 3. Paham Rupiah (Misi 7-9)</span>
                    <span className="font-mono text-emerald-700 font-black">{schoolData.pahamAvg}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, schoolData.pahamAvg)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Bertransaksi, Berbelanja Bijak & Gemar Menabung</p>
                </div>
              </div>
            </div>

            {/* Box 2: Status Kelulusan Misi Akhir */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span>Sebaran Kelulusan Misi Akhir: Sang Penjelajah</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Status pencapaian 3 tingkatan asesmen resmi Bank Indonesia.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Stage 3: Master */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="text-[10px] font-extrabold text-amber-900 uppercase">
                    Tahap 3: Sang Penjelajah
                  </div>
                  <div className="text-2xl font-black text-amber-700 font-mono mt-1">
                    {schoolData.stageCounts.master}
                  </div>
                  <div className="text-[10px] text-amber-800 font-medium">Tingkat Master</div>
                </div>

                {/* Stage 2: Terampil */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <div className="text-[10px] font-extrabold text-blue-900 uppercase">
                    Tahap 2: Penjelajah Terampil
                  </div>
                  <div className="text-2xl font-black text-blue-700 font-mono mt-1">
                    {schoolData.stageCounts.terampil}
                  </div>
                  <div className="text-[10px] text-blue-800 font-medium">Tingkat Lanjutan</div>
                </div>

                {/* Stage 1: Pemula */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[10px] font-extrabold text-emerald-900 uppercase">
                    Tahap 1: Penjelajah Pemula
                  </div>
                  <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                    {schoolData.stageCounts.pemula}
                  </div>
                  <div className="text-[10px] text-emerald-800 font-medium">Tingkat Dasar</div>
                </div>

                {/* Belum Selesai */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-extrabold text-slate-600 uppercase">
                    Dalam Pembelajaran
                  </div>
                  <div className="text-2xl font-black text-slate-600 font-mono mt-1">
                    {schoolData.stageCounts.notStarted}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Belum Ikut Asesmen</div>
                </div>
              </div>

              {onNavigateToEvent && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    onNavigateToEvent();
                  }}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-slate-950" />
                  <span>Atur Sesi Main Bareng & Papan Peringkat</span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </button>
              )}
            </div>
          </div>

          {/* Class Breakdown */}
          {schoolData.classSummaries.length > 0 && (
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Rekapitulasi Capaian per Kelas / Rombel</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan ketuntasan belajar siswa antar rombongan belajar di sekolah ini.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {schoolData.classSummaries.map((cls) => (
                  <div
                    key={cls.grade}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900">{cls.grade}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {cls.totalStudents} Siswa
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                      <div>
                        <div className="text-slate-400 text-[10px]">Ketuntasan Misi</div>
                        <div className="font-black text-slate-800 font-mono">{cls.avgCompletionRate}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Rata-Rata Nilai</div>
                        <div className="font-black text-blue-600 font-mono">{cls.avgScore}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Detailed Roster & Progress Table */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Rapor Capaian Siswa Terperinci</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar nilai kuis, misi terselesaikan, dan status kelulusan Misi Akhir siswa.
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Cari nama / NISN..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Kelas</option>
                  {schoolData.classSummaries.map((c) => (
                    <option key={c.grade} value={c.grade}>
                      {c.grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-600 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Nama Siswa & NISN</th>
                    <th className="py-3 px-3">Kelas</th>
                    <th className="py-3 px-3 text-center">Misi Tuntas</th>
                    <th className="py-3 px-3 text-center">Progress</th>
                    <th className="py-3 px-3 text-center">Nilai Latihan</th>
                    <th className="py-3 px-3 text-center">Gelar Misi Akhir</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada data siswa yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => (
                      <tr key={st.studentId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-black text-slate-900">{st.name}</div>
                          <div className="text-[10px] text-slate-400">NISN: {st.nisn}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{st.grade}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {st.missionsCompleted} / 9
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-700">{st.completionRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-black font-mono text-blue-700">
                          {st.avgQuizScore}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              st.finalStageTitle === 'Sang Penjelajah Rupiah'
                                ? 'bg-amber-100 text-amber-800'
                                : st.finalStageTitle === 'Penjelajah Terampil'
                                ? 'bg-blue-100 text-blue-800'
                                : st.finalStageTitle === 'Penjelajah Pemula'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {st.finalStageTitle}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {st.passedFinalMission ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Lulus</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                              <span>Belum Selesai</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              st.predicate === 'Sangat Baik'
                                ? 'bg-indigo-100 text-indigo-800'
                                : st.predicate === 'Baik'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {st.predicate}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
