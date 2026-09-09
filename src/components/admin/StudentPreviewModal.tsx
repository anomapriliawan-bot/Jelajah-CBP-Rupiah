import React from 'react';
import { X, Smartphone, Monitor, BookOpen, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { Lesson, Activity } from '../../types';

interface StudentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson?: Lesson;
  activity?: Activity;
}

export const StudentPreviewModal: React.FC<StudentPreviewModalProps> = ({
  isOpen,
  onClose,
  lesson,
  activity,
}) => {
  if (!isOpen || (!lesson && !activity)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] shadow-2xl border-2 sm:border-4 border-slate-800 flex flex-col min-h-0 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Device Top Bar Simulator */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono text-slate-400 ml-2">Pratinjau Layar Siswa (Preview Mode)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device Screen Content */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-sky-50/40 p-4 sm:p-6">
          {lesson && (
            <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 shadow-md border border-sky-100 space-y-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {lesson.missionId} &bull; Materi Belajar
                </span>
                <span className="text-slate-400 font-medium">Estimasi: {lesson.readTimeMinutes || 3} Menit</span>
              </div>

              <h2 className="text-xl font-black text-slate-900 leading-snug">
                {lesson.title}
              </h2>

              {/* Lesson Hero Visual (only rendered if image exists) */}
              {lesson.imageUrl && lesson.imageUrl.trim() !== '' && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group flex items-center justify-center">
                  <img
                    src={lesson.imageUrl}
                    alt={lesson.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-72 object-contain"
                  />
                  {(lesson.imageCaption || lesson.imageBrief) && (
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-slate-900/80 text-white text-[11px] text-center">
                      {lesson.imageCaption || lesson.imageBrief}
                    </div>
                  )}
                </div>
              )}

              {/* Lesson Text (student_text) */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
                {lesson.studentText || lesson.content || 'Isi materi belum diisi.'}
              </div>

              {/* Key Takeaway / Prompt */}
              {(lesson.interactionPrompt || lesson.keyTakeaway) && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-900 font-bold mb-0.5">
                      {lesson.interactionPrompt ? 'Ayo Berpikir Sejenak:' : 'Pesan Penting Rupi:'}
                    </strong>
                    <p className="text-[11px] leading-relaxed">
                      {lesson.interactionPrompt || lesson.keyTakeaway}
                    </p>
                  </div>
                </div>
              )}

              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2">
                <span>Lanjut ke Aktivitas Interaktif</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {activity && (
            <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 shadow-md border border-sky-100 space-y-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {activity.missionId} &bull; Tipe: {activity.type}
                </span>
                <span className="text-amber-600 font-bold">+{activity.pointsAwarded || 50} Poin</span>
              </div>

              <h2 className="text-lg font-black text-slate-900">
                {activity.title}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed bg-sky-50 p-3 rounded-xl border border-sky-100">
                <strong>Instruksi Siswa:</strong> {activity.instruction}
              </p>

              {/* Activity Interaction Preview Config */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-blue-600 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800">Modul Interaksi Gamifikasi</h4>
                <p className="text-xs text-slate-500">
                  Siswa akan menyelesaikan interaksi tipe <strong className="font-mono text-blue-700">{activity.type}</strong> langsung di kanvas bermain.
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-slate-700">
                    Kunci Interaksi: Terverifikasi
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-slate-700">
                    Animasi Feedback: Aktif
                  </span>
                </div>
              </div>

              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2">
                <span>Periksa Jawaban Aktivitas</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
