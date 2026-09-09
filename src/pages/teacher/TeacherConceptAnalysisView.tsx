import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  BookOpen,
  ArrowUpDown,
  Download,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import { db } from '../../services/db';

export const TeacherConceptAnalysisView: React.FC = () => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'danger' | 'warning' | 'good'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const rawAnalysis = db.getConceptAnalysisData();

  const filteredAnalysis = rawAnalysis
    .filter((item) => {
      if (filterSeverity === 'all') return true;
      return item.severity === filterSeverity;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.accuracy - b.accuracy;
      return b.accuracy - a.accuracy;
    });

  const lowestCompetency = rawAnalysis[0];

  const handleExportCSV = () => {
    const headers = ['Kompetensi', 'Tingkat Akurasi (%)', 'Soal Benar', 'Total Soal Dijawab', 'Status', 'Rekomendasi Tindakan Remedial'];
    const rows = rawAnalysis.map((c) => [
      `"${c.competency.replace(/"/g, '""')}"`,
      `${c.accuracy}%`,
      c.correctCount,
      c.totalAnswered,
      c.severity === 'danger' ? 'Butuh Perhatian Khusus' : c.severity === 'warning' ? 'Cukup Menguasai' : 'Sangat Menguasai',
      `"${c.recommendation.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analisis_konsep_rupiah_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Analisis Penguasaan Konsep</h2>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Ekspor Analisis (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Priority Alert Box if any weak concept exists */}
      {lowestCompetency && lowestCompetency.accuracy < 70 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-rose-900">Perhatian: Konsep Terlemah Perlu Pendampingan Guru</h4>
              <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-800 text-[10px] font-extrabold">
                Akurasi {lowestCompetency.accuracy}%
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-1 font-semibold">{lowestCompetency.competency}</p>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-rose-100">
              <span className="font-bold">Saran Aksi Guru:</span> {lowestCompetency.recommendation}
            </p>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </span>
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterSeverity === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({rawAnalysis.length})
          </button>
          <button
            onClick={() => setFilterSeverity('danger')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterSeverity === 'danger' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            🔴 Perlu Remedial
          </button>
          <button
            onClick={() => setFilterSeverity('warning')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterSeverity === 'warning' ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            🟡 Cukup Menguasai
          </button>
          <button
            onClick={() => setFilterSeverity('good')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterSeverity === 'good' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            🟢 Sangat Menguasai
          </button>
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <span>Urutan: {sortOrder === 'asc' ? 'Akurasi Terendah Dahulu' : 'Akurasi Tertinggi Dahulu'}</span>
        </button>
      </div>

      {/* Competencies Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAnalysis.map((item, idx) => {
          const isDanger = item.severity === 'danger';
          const isWarning = item.severity === 'warning';

          const cardBorder = isDanger
            ? 'border-rose-200 bg-rose-50/20'
            : isWarning
            ? 'border-amber-200 bg-amber-50/20'
            : 'border-emerald-200 bg-emerald-50/20';

          const badgeClass = isDanger
            ? 'bg-rose-100 text-rose-800 border-rose-300'
            : isWarning
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : 'bg-emerald-100 text-emerald-800 border-emerald-300';

          const barColor = isDanger
            ? 'bg-rose-500'
            : isWarning
            ? 'bg-amber-500'
            : 'bg-emerald-500';

          return (
            <div
              key={item.competency}
              className={`p-5 sm:p-6 rounded-3xl border ${cardBorder} bg-white shadow-xs space-y-4 transition-all hover:shadow-md`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeClass}`}>
                      {isDanger ? '🔴 Perlu Remedial' : isWarning ? '🟡 Cukup Menguasai' : '🟢 Sangat Menguasai'}
                    </span>
                    <span className="text-xs text-slate-500">
                      Total {item.totalAnswered} respon ({item.correctCount} benar)
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">{item.competency}</h3>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-slate-400">Tingkat Akurasi</div>
                    <div className={`text-2xl font-black font-mono ${isDanger ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {item.accuracy}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress visualizer */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>0%</span>
                  <span>Target BI: 75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Actionable recommendation */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900">Rekomendasi Instruksi Guru:</div>
                  <p className="text-slate-600 leading-relaxed">{item.recommendation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
