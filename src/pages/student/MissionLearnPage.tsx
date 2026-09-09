import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Gamepad2,
  Image as ImageIcon,
  ShieldAlert,
  Upload,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Lesson, Mission } from '../../types';
import { db } from '../../services/db';
import { sounds } from '../../utils/audio';
import { compressImageFile } from '../../utils/imageCompressor';
import { uploadDataUrlToServer, deleteImageFromServer } from '../../services/uploadService';

interface MissionLearnPageProps {
  missionId: string;
  onBackToDetail: (missionId: string) => void;
  onContinueToActivity: (missionId: string) => void;
}

export const MissionLearnPage: React.FC<MissionLearnPageProps> = ({
  missionId,
  onBackToDetail,
  onContinueToActivity,
}) => {
  const [mission, setMission] = useState<Mission | undefined>(undefined);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'info' } | null>(null);

  const currentUser = db.getCurrentUser();
  const isAdminOrTeacher = currentUser?.role === 'admin' || currentUser?.role === 'teacher';

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    setLoading(true);
    const loadMissionAndLessons = () => {
      const m = db.getMissionById(missionId);
      setMission(m);
      if (m) {
        const les = db.getLessonsByMission(m.id);
        // Urutkan berdasarkan content_order / orderIndex ASC
        const sorted = [...les].sort((a, b) => {
          const orderA = a.content_order ?? a.contentOrder ?? a.orderIndex ?? 0;
          const orderB = b.content_order ?? b.contentOrder ?? b.orderIndex ?? 0;
          return orderA - orderB;
        });
        setLessons(sorted);
      } else {
        setLessons([]);
      }
      setLoading(false);
    };

    loadMissionAndLessons();
    const unsub = db.subscribe(loadMissionAndLessons);
    return () => unsub();
  }, [missionId]);

  const currentLesson = lessons[currentIndex];
  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === lessons.length - 1;

  // Resolving canonical fields with backward compatibility fallback
  const studentText =
    currentLesson?.student_text ??
    currentLesson?.studentText ??
    currentLesson?.text ??
    currentLesson?.body ??
    currentLesson?.content ??
    currentLesson?.description ??
    '';

  const interactionPrompt =
    currentLesson?.interaction_prompt ??
    currentLesson?.interactionPrompt ??
    (currentLesson as any)?.prompt_interaksi ??
    (currentLesson as any)?.ayo_berpikir ??
    '';

  const title = currentLesson?.title ?? (currentLesson as any)?.judul ?? 'Materi Pembelajaran';

  // Smart image resolution: check lesson image, and fallback to mission image if card 1
  const rawLessonImage = currentLesson?.image_url ?? currentLesson?.imageUrl ?? '';
  const missionFallbackImage = mission?.imageUrl || (mission as any)?.openingImageUrl || '';
  const imageUrl =
    rawLessonImage && rawLessonImage.trim() !== ''
      ? rawLessonImage
      : currentIndex === 0 && missionFallbackImage && missionFallbackImage.trim() !== ''
      ? missionFallbackImage
      : '';

  const contentId = currentLesson?.content_id ?? currentLesson?.id ?? currentLesson?.code ?? '';

  // Direct image upload handler for admin/teacher
  const handleUploadImage = async (file: File) => {
    if (!currentLesson) return;
    try {
      setIsUploading(true);
      const res = await compressImageFile(file, 960, 0.8);
      if (!res.dataUrl) {
        showToast('Gagal memproses gambar.', 'info');
        return;
      }

      // Upload physically to server disk (/public/images/lessons/)
      const serverRes = await uploadDataUrlToServer(file.name, res.dataUrl, 'lessons');
      const savedUrl = serverRes?.success && serverRes?.url ? serverRes.url : res.dataUrl;

      db.updateLesson(
        currentLesson.id,
        {
          imageUrl: savedUrl,
          missionId: currentLesson.missionId,
          contentOrder: currentLesson.contentOrder || currentLesson.orderIndex || currentIndex + 1,
          orderIndex: currentLesson.orderIndex || currentLesson.contentOrder || currentIndex + 1,
        },
        'Admin / Guru',
        `Unggah ilustrasi materi: ${title}`
      );
      showToast('Gambar materi berhasil disimpan permanen di sistem!');
    } catch (err) {
      console.error('Failed to compress image:', err);
      showToast('Gagal memproses gambar.', 'info');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentLesson) return;

    if (currentLesson.imageUrl && currentLesson.imageUrl.startsWith('/images/')) {
      await deleteImageFromServer(currentLesson.imageUrl);
    }

    db.updateLesson(
      currentLesson.id,
      {
        imageUrl: '',
        missionId: currentLesson.missionId,
        contentOrder: currentLesson.contentOrder || currentLesson.orderIndex || currentIndex + 1,
        orderIndex: currentLesson.orderIndex || currentLesson.contentOrder || currentIndex + 1,
      },
      'Admin / Guru',
      `Hapus ilustrasi materi: ${title}`
    );
    showToast('Gambar materi berhasil dihapus.', 'info');
  };

  // Debug check console (Placed before any conditional returns)
  useEffect(() => {
    if (currentLesson && mission) {
      console.log('[DEBUG Lesson]', {
        content_id: contentId,
        title: title,
        student_text: studentText,
        mission_id: mission.id,
        hasImage: Boolean(imageUrl),
      });
    }
  }, [currentLesson, contentId, title, studentText, mission, imageUrl]);

  // Loading State Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800 antialiased">
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs h-16 flex items-center justify-between px-6 max-w-4xl mx-auto">
          <div className="w-24 h-8 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="w-24 h-5 bg-slate-200 animate-pulse rounded-full" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-6 animate-pulse">
            <div className="w-full h-48 bg-slate-200 rounded-2xl" />
            <div className="w-3/4 h-8 bg-slate-200 rounded-xl" />
            <div className="w-full h-32 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!mission || lessons.length === 0 || !currentLesson) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-md max-w-md">
          <p className="text-base font-bold text-slate-800">Materi belum tersedia untuk misi ini.</p>
          <p className="text-xs text-slate-500 mt-1">ID Misi: {missionId}</p>
          <button
            onClick={() => onBackToDetail(missionId)}
            className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs cursor-pointer transition-colors shadow-sm"
          >
            Kembali ke Detail Misi
          </button>
        </div>
      </div>
    );
  }

  // Status diagnostics
  const totalCount = lessons.length;
  const publishedCount = lessons.filter((l) => l.status === 'published').length;
  const draftCount = lessons.filter((l) => l.status !== 'published').length;

  const handleNext = () => {
    sounds.playPop();
    if (!isLastCard) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Mark learn section as completed in DB
      db.saveMissionSectionProgress(mission.id, currentUser?.id || 'std_01', 'learn');
      sounds.playSuccess();
      onContinueToActivity(mission.id);
    }
  };

  const handlePrev = () => {
    sounds.playPop();
    if (!isFirstCard) {
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800 antialiased selection:bg-blue-200 selection:text-blue-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Fixed Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              sounds.playPop();
              onBackToDetail(missionId);
            }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Detail Misi</span>
          </button>

          {/* Step Progress Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {lessons.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sounds.playPop();
                  setCurrentIndex(idx);
                }}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-8 bg-blue-600'
                    : idx < currentIndex
                    ? 'w-4 bg-emerald-500'
                    : 'w-4 bg-slate-200'
                }`}
                title={`Kartu ${idx + 1}`}
              />
            ))}
          </div>

          <div className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-mono">
            Kartu {currentIndex + 1} / {lessons.length}
          </div>
        </div>
      </div>

      {/* Admin Diagnostic Bar (Only shown for Admin / Teacher) */}
      {isAdminOrTeacher && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3">
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-amber-900">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Mode Admin / Guru ({mission.id}): Total <strong>{totalCount}</strong> materi | 
                <span className="text-emerald-700 ml-1">Published: {publishedCount}</span> | 
                <span className="text-amber-700 ml-1">Draft: {draftCount}</span>
              </span>
            </div>
            <span className="text-slate-500 font-mono text-[10px]">
              Kartu ID: {contentId} (Urutan: {currentLesson.content_order || currentLesson.contentOrder || currentLesson.orderIndex})
            </span>
          </div>
        </div>
      )}

      {/* Main Card Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6">
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 overflow-hidden">
          {/* Visual Header / Illustration (Rendered only if image exists, or collapsed completely with 0px space for students) */}
          {imageUrl && imageUrl.trim() !== '' ? (
            <div className="p-3 sm:p-5 bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center relative group">
              <div className="w-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-slate-100/60 border border-slate-200 shadow-xs relative">
                <img
                  src={imageUrl}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[580px] object-contain rounded-2xl transition-all"
                />

                {/* Admin Quick Overlay Actions */}
                {isAdminOrTeacher && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-xs p-1.5 rounded-xl text-white shadow-lg">
                    <label className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>{isUploading ? 'Memproses...' : 'Ganti Gambar'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadImage(f);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-2 py-1 bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : isAdminOrTeacher ? (
            <div className="p-3 sm:p-5 bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center relative group">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type.startsWith('image/')) handleUploadImage(f);
                }}
                className="w-full py-6 px-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-100/70 flex flex-col items-center justify-center text-center select-none"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200/80 flex items-center justify-center mb-2 text-slate-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Mode Pengajar / Admin: Ilustrasi Belum Terpasang</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
                  (Khusus Guru/Admin: Kotak ini otomatis tersembunyi 100% pada akun siswa jika materi ini tanpa gambar)
                </p>

                <div className="mt-3">
                  <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Sedang Memproses...' : 'Unggah Gambar Materi'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadImage(f);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {/* Reading Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold border border-blue-200">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Materi Pembelajaran</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {title}
              </h2>
            </div>

            {/* Main Reading Paragraph (student_text) */}
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium space-y-4 whitespace-pre-line bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200/70">
              {studentText}
            </div>

            {/* Key Takeaways Highlight Box (If available) */}
            {currentLesson.keyTakeaways && currentLesson.keyTakeaways.length > 0 && (
              <div className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-200 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Poin Penting untuk Diingat:</span>
                </div>
                <ul className="space-y-1.5">
                  {currentLesson.keyTakeaways.map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2 text-xs sm:text-sm text-emerald-950 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interactive Prompt / Ayo Berpikir Sejenak (If available) */}
            {interactionPrompt && interactionPrompt.trim() !== '' && (
              <div className="p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Ayo Berpikir Sejenak:</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-950 font-bold leading-relaxed whitespace-pre-line">
                  {interactionPrompt}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Card Navigation */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={isFirstCard}
              className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                isFirstCard
                  ? 'opacity-40 text-slate-400 cursor-not-allowed'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={handleNext}
              className={`px-6 py-3 rounded-full font-black text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer group ${
                isLastCard
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
              }`}
            >
              <span>{isLastCard ? 'Lanjut ke Aktivitas' : 'Kartu Berikutnya'}</span>
              {isLastCard ? (
                <Gamepad2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              ) : (
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
