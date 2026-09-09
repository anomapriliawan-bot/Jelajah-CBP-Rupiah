import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  History,
  Send,
  Save,
  X,
  Filter,
  Search,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Tag,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { PracticeQuestion, ContentStatus } from '../../types';
import { db } from '../../services/db';
import { sounds } from '../../utils/audio';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { VersionHistoryDrawer } from '../../components/admin/VersionHistoryDrawer';
import { WorkflowActionModal } from '../../components/admin/WorkflowActionModal';

export const AdminQuestionsView: React.FC = () => {
  const [questions, setQuestions] = useState<PracticeQuestion[]>(
    db.getPracticeQuestions().sort((a, b) => a.orderIndex - b.orderIndex)
  );
  const missions = db.getMissions();
  const references = db.getReferences();

  // Filters
  const [selectedMissionFilter, setSelectedMissionFilter] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [editingQuestion, setEditingQuestion] = useState<PracticeQuestion | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [historyEntity, setHistoryEntity] = useState<{ id: string; title: string } | null>(null);
  const [workflowEntity, setWorkflowEntity] = useState<{ question: PracticeQuestion } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmResetDefault, setConfirmResetDefault] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshData = () => {
    setQuestions(db.getPracticeQuestions().sort((a, b) => a.orderIndex - b.orderIndex));
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  const handleDeleteAll = () => {
    sounds.playPop();
    db.deleteAllPracticeQuestions();
    refreshData();
    setConfirmDeleteAll(false);
    showToast('Seluruh bank soal latihan berhasil dikosongkan.', 'info');
  };

  const handleResetDefault = () => {
    sounds.playFanfare();
    db.resetPracticeQuestionsToDefault();
    refreshData();
    setConfirmResetDefault(false);
    showToast('✨ 110 Butir Soal Latihan Standar BI berhasil dipulihkan!');
  };

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    missionId: string;
    grade: number;
    difficulty: 'easy' | 'medium' | 'hard';
    competencyCategory: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswerIndex: number;
    explanation: string;
    feedbackCorrect: string;
    feedbackIncorrect: string;
    points: number;
    status: ContentStatus;
    referenceSourceId: string;
  }>({
    code: '',
    missionId: 'MIS-01',
    grade: 4,
    difficulty: 'easy',
    competencyCategory: 'Metode 3D Rupiah',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswerIndex: 0,
    explanation: '',
    feedbackCorrect: 'Hebat! Jawabanmu tepat sekali.',
    feedbackIncorrect: 'Kurang tepat. Ingat kembali materi ciri uang rupiah.',
    points: 10,
    status: 'draft',
    referenceSourceId: 'REF-01',
  });

  const handleOpenCreate = () => {
    const nextOrder = questions.length + 1;
    const nextCode = `SOAL-${String(nextOrder).padStart(3, '0')}`;
    setFormData({
      code: nextCode,
      missionId: missions[0]?.id || 'MIS-01',
      grade: 4,
      difficulty: 'easy',
      competencyCategory: 'Metode 3D Rupiah',
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswerIndex: 0,
      explanation: 'Penjelasan konsep materi Bank Indonesia...',
      feedbackCorrect: 'Luar biasa! Pemahamanmu sangat tajam.',
      feedbackIncorrect: 'Yuk telaah kembali konsep uang rupiah yang benar.',
      points: 10,
      status: 'draft',
      referenceSourceId: references[0]?.id || 'REF-01',
    });
    setEditingQuestion(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (q: PracticeQuestion) => {
    setEditingQuestion(q);
    setFormData({
      code: q.code,
      missionId: q.missionId,
      grade: Number(q.grade) || 4,
      difficulty: (q.difficulty as any) || 'medium',
      competencyCategory: q.competencyCategory || 'Metode 3D Rupiah',
      question: q.question,
      optionA: q.options[0] || '',
      optionB: q.options[1] || '',
      optionC: q.options[2] || '',
      optionD: q.options[3] || '',
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation || '',
      feedbackCorrect: q.feedbackCorrect || 'Benar sekali!',
      feedbackIncorrect: q.feedbackIncorrect || 'Ayo pelajari kembali materinya.',
      points: q.points || 10,
      status: q.status,
      referenceSourceId: q.referenceSourceId || 'REF-01',
    });
    setIsCreateOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    const options = [formData.optionA, formData.optionB, formData.optionC, formData.optionD].filter(Boolean);

    const payload: Partial<PracticeQuestion> = {
      code: formData.code,
      missionId: formData.missionId,
      gradeLevel: `Kelas ${formData.grade}`,
      grade: String(formData.grade),
      difficulty: formData.difficulty,
      competencyCategory: formData.competencyCategory,
      question: formData.question,
      options,
      correctAnswerIndex: Number(formData.correctAnswerIndex),
      explanation: formData.explanation,
      feedbackCorrect: formData.feedbackCorrect,
      feedbackIncorrect: formData.feedbackIncorrect,
      points: Number(formData.points),
      status: formData.status,
      referenceSourceId: formData.referenceSourceId,
    };

    if (editingQuestion) {
      db.updatePracticeQuestion(
        editingQuestion.id,
        payload,
        'Admin Kurikulum BI',
        `Pembaruan butir soal latihan ${formData.code}`
      );
    } else {
      db.createPracticeQuestion(payload as Omit<PracticeQuestion, 'id'>);
    }

    refreshData();
    setIsCreateOpen(false);
    setEditingQuestion(null);
  };

  const handleDelete = (id: string) => {
    db.deletePracticeQuestion(id);
    refreshData();
    setConfirmDeleteId(null);
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedMissionFilter !== 'all' && q.missionId !== selectedMissionFilter) return false;
    if (selectedGradeFilter !== 'all' && String(q.grade) !== selectedGradeFilter) return false;
    if (selectedDifficultyFilter !== 'all' && q.difficulty !== selectedDifficultyFilter) return false;
    if (selectedStatusFilter !== 'all' && q.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      if (
        !q.question.toLowerCase().includes(s) &&
        !q.code.toLowerCase().includes(s) &&
        !(q.competencyCategory && q.competencyCategory.toLowerCase().includes(s))
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600/95 text-white border-emerald-500 shadow-emerald-600/20'
                : 'bg-slate-800/95 text-white border-slate-700 shadow-slate-900/20'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-600" />
            <span>Bank Soal Latihan & Evaluasi Misi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola {questions.length} butir soal pilihan ganda, tingkat kognitif, feedback adaptif, dan referensi regulasi Bank Indonesia.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {questions.length > 0 ? (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Hapus seluruh butir soal latihan untuk mencegah penumpukan data sebelum upload Excel baru"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Semua Soal Latihan</span>
            </button>
          ) : (
            <button
              onClick={() => setConfirmResetDefault(true)}
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Pulihkan 110 butir soal latihan standar Bank Indonesia"
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>Reset 110 Soal Standar BI</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Soal Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pertanyaan, kode, atau kompetensi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={selectedMissionFilter}
          onChange={(e) => setSelectedMissionFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
        >
          <option value="all">Semua Misi (1-9)</option>
          {missions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.code} - {m.title.slice(0, 20)}...
            </option>
          ))}
        </select>

        <select
          value={selectedGradeFilter}
          onChange={(e) => setSelectedGradeFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
        >
          <option value="all">Semua Kelas</option>
          <option value="4">Kelas 4 SD</option>
          <option value="5">Kelas 5 SD</option>
          <option value="6">Kelas 6 SD</option>
        </select>

        <select
          value={selectedDifficultyFilter}
          onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
        >
          <option value="all">Semua Tingkat Kesulitan</option>
          <option value="mudah">Mudah</option>
          <option value="sedang">Sedang</option>
          <option value="sulit">Sulit</option>
        </select>

        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
        >
          <option value="all">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-10 sm:p-14 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold border border-amber-100 shadow-inner">
              ?
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-black text-slate-800">
                {questions.length === 0
                  ? 'Bank Soal Latihan Sedang Kosong'
                  : 'Tidak Ada Soal Latihan Sesuai Filter'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {questions.length === 0
                  ? 'Seluruh butir soal latihan telah dikosongkan. Anda dapat mengunggah file Master Excel baru pada menu Kelola Misi atau memulihkan 110 butir soal latihan standar BI.'
                  : 'Coba ubah kata kunci pencarian atau sesuaikan filter misi, kelas, dan tingkat kesulitan di atas.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {questions.length === 0 ? (
                <>
                  <button
                    onClick={() => setConfirmResetDefault(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Pulihkan 110 Soal Standar BI</span>
                  </button>
                  <button
                    onClick={handleOpenCreate}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Soal Manual</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMissionFilter('all');
                    setSelectedGradeFilter('all');
                    setSelectedDifficultyFilter('all');
                    setSelectedStatusFilter('all');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredQuestions.map((q) => {
          const mission = missions.find((m) => m.id === q.missionId || m.code === q.missionId);
          const refSource = references.find((r) => r.id === q.referenceSourceId || r.code === q.referenceSourceId);

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {q.code}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {mission?.code || q.missionId} &bull; Kelas {q.grade || 4}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${
                      q.difficulty === 'hard'
                        ? 'bg-rose-100 text-rose-800'
                        : q.difficulty === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {q.difficulty === 'hard' ? 'Sulit' : q.difficulty === 'medium' ? 'Sedang' : 'Mudah'}
                  </span>
                  {q.competencyCategory && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {q.competencyCategory}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">+{q.points || 10} Poin</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {q.status}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {q.question}
              </h3>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, idx) => {
                  const isCorrect = idx === q.correctAnswerIndex;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>
                        <strong className="mr-1.5">{String.fromCharCode(65 + idx)}.</strong> {opt}
                      </span>
                      {isCorrect && (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md shrink-0">
                          Kunci Benar
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reference & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Referensi: <strong>{refSource ? `${refSource.code} (${refSource.title.slice(0, 30)}...)` : (q.referenceSourceId || 'Standar Bank Indonesia')}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => setWorkflowEntity({ question: q })}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg flex items-center gap-1"
                    title="Alur Status"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Workflow</span>
                  </button>

                  <button
                    onClick={() => setHistoryEntity({ id: q.id, title: q.question })}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                    title="Riwayat Versi"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
                    title="Edit Soal"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setConfirmDeleteId(q.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        }))}
      </div>

      {/* CREATE / EDIT QUESTION MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col min-h-0 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  {editingQuestion ? `Edit Soal (${formData.code})` : 'Tambah Butir Soal Latihan Baru'}
                </h3>
                <p className="text-xs text-slate-500">Tentukan pertanyaan, 4 pilihan, kunci jawaban, dan feedback</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kode Soal</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Misi Terkait</label>
                    <select
                      value={formData.missionId}
                      onChange={(e) => setFormData({ ...formData, missionId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    >
                      {missions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kelas</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    >
                      <option value={4}>Kelas 4 SD</option>
                      <option value={5}>Kelas 5 SD</option>
                      <option value={6}>Kelas 6 SD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kesulitan</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 capitalize"
                    >
                      <option value="mudah">Mudah</option>
                      <option value="sedang">Sedang</option>
                      <option value="sulit">Sulit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Kompetensi BI</label>
                  <input
                    type="text"
                    value={formData.competencyCategory}
                    onChange={(e) => setFormData({ ...formData, competencyCategory: e.target.value })}
                    placeholder="Contoh: Metode 3D, Ciri Keaslian TE 2022, Belanja Bijak"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teks Pertanyaan</label>
                  <textarea
                    rows={3}
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    required
                    placeholder="Tuliskan pertanyaan dengan narasi yang jelas dan tepat..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                {/* 4 Options Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Pilihan Jawaban (A, B, C, D) & Kunci</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswerIndex === 0}
                        onChange={() => setFormData({ ...formData, correctAnswerIndex: 0 })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">A.</span>
                      <input
                        type="text"
                        value={formData.optionA}
                        onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                        required
                        placeholder="Opsi A"
                        className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:ring-0"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswerIndex === 1}
                        onChange={() => setFormData({ ...formData, correctAnswerIndex: 1 })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">B.</span>
                      <input
                        type="text"
                        value={formData.optionB}
                        onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                        required
                        placeholder="Opsi B"
                        className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:ring-0"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswerIndex === 2}
                        onChange={() => setFormData({ ...formData, correctAnswerIndex: 2 })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">C.</span>
                      <input
                        type="text"
                        value={formData.optionC}
                        onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                        required
                        placeholder="Opsi C"
                        className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:ring-0"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswerIndex === 3}
                        onChange={() => setFormData({ ...formData, correctAnswerIndex: 3 })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">D.</span>
                      <input
                        type="text"
                        value={formData.optionD}
                        onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                        required
                        placeholder="Opsi D"
                        className="w-full px-2 py-1 text-xs border-0 bg-transparent focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-emerald-700 mb-1">Feedback Saat Jawaban Benar</label>
                    <input
                      type="text"
                      value={formData.feedbackCorrect}
                      onChange={(e) => setFormData({ ...formData, feedbackCorrect: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-emerald-200 bg-emerald-50/30 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-rose-700 mb-1">Feedback Saat Jawaban Salah</label>
                    <input
                      type="text"
                      value={formData.feedbackIncorrect}
                      onChange={(e) => setFormData({ ...formData, feedbackIncorrect: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-rose-200 bg-rose-50/30 rounded-xl focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penjelasan Kunci Konseptual (Explanation)</label>
                  <textarea
                    rows={2}
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Mengapa jawaban ini benar menurut panduan Bank Indonesia..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sumber Referensi Regulasi</label>
                    <select
                      value={formData.referenceSourceId}
                      onChange={(e) => setFormData({ ...formData, referenceSourceId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    >
                      {references.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.code} - {r.title.slice(0, 20)}...
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Poin</label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status Soal</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 uppercase font-bold"
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Review</option>
                      <option value="approved">Approved</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-2.5 sm:gap-3 p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Soal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History */}
      {historyEntity && (
        <VersionHistoryDrawer
          isOpen={true}
          onClose={() => setHistoryEntity(null)}
          entityId={historyEntity.id}
          entityTitle={historyEntity.title}
          entityType="question"
        />
      )}

      {/* Workflow */}
      {workflowEntity && (
        <WorkflowActionModal
          isOpen={true}
          onClose={() => setWorkflowEntity(null)}
          entityId={workflowEntity.question.id}
          entityTitle={workflowEntity.question.question}
          entityType="question"
          currentStatus={workflowEntity.question.status}
          onApplyAction={(targetStatus, reviewerInfo) => {
            db.updatePracticeQuestionStatus(workflowEntity.question.id, targetStatus, reviewerInfo);
            refreshData();
            setWorkflowEntity(null);
          }}
        />
      )}

      {/* Confirm Delete Single */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Hapus Butir Soal Latihan?"
        message="Soal ini akan dihapus dari bank latihan misi."
        confirmLabel="Ya, Hapus Soal"
        variant="danger"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Confirm Delete All */}
      <ConfirmDialog
        isOpen={confirmDeleteAll}
        title="Hapus SEMUA Soal Latihan?"
        message={`Tindakan ini akan mengosongkan seluruh ${questions.length} butir soal latihan dari database. Ini sangat berguna jika Anda ingin mengunggah file Master Excel baru yang berisi bank soal lengkap tanpa terjadinya penumpukan soal ganda.`}
        confirmLabel="Ya, Hapus Semua Soal Latihan"
        variant="danger"
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmDeleteAll(false)}
      />

      {/* Confirm Reset Default */}
      <ConfirmDialog
        isOpen={confirmResetDefault}
        title="Pulihkan Bank Soal Latihan Standar BI?"
        message="Bank soal latihan akan dipulihkan dengan 110 butir soal resmi standar kurikulum Bank Indonesia untuk 9 Misi."
        confirmLabel="Ya, Pulihkan 110 Soal Standar BI"
        variant="info"
        onConfirm={handleResetDefault}
        onCancel={() => setConfirmResetDefault(false)}
      />
    </div>
  );
};
