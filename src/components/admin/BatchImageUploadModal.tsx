import React, { useState } from 'react';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Lesson, Mission } from '../../types';
import { db, normalizeMissionId } from '../../services/db';
import { compressImageFile } from '../../utils/imageCompressor';
import { uploadDataUrlToServer } from '../../services/uploadService';
import { sounds } from '../../utils/audio';

interface MatchedImageItem {
  id: string;
  file: File;
  dataUrl: string;
  sizeKb: number;
  fileName: string;
  matchedLessonId: string;
  status: 'ready' | 'saving' | 'saved' | 'error';
}

interface BatchImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  missions: Mission[];
  onSuccess: (count: number) => void;
}

export const BatchImageUploadModal: React.FC<BatchImageUploadModalProps> = ({
  isOpen,
  onClose,
  lessons,
  missions,
  onSuccess,
}) => {
  const [items, setItems] = useState<MatchedImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  // Auto match helper based on filename
  const autoMatchLesson = (fileName: string): string => {
    const cleanName = fileName.toLowerCase();

    // 0. Mission cover match (e.g. cover_misi_1, cover_c01, misi_01, mis-01, c01.jpg)
    if (
      cleanName.includes('cover') ||
      cleanName.match(/^misi[-_ ]?\d+\.(png|jpg|jpeg|webp)$/i) ||
      cleanName.match(/^(?:jr-)?([cbp]\d+)\.(png|jpg|jpeg|webp)$/i)
    ) {
      const misMatch = cleanName.match(/(?:cover[-_ ]?)?(?:jr-)?([cbp]\d+|misi[-_ ]?\d+|mis[-_ ]?\d+)/i);
      if (misMatch) {
        const canonical = normalizeMissionId(misMatch[1]);
        const foundMis = missions.find((m) => normalizeMissionId(m.id || m.code) === canonical);
        if (foundMis) return `mission:${foundMis.id}`;
      }
    }

    // 1. Direct MAT code match (e.g. MAT-001, MAT-1, mat01)
    const matMatch = cleanName.match(/mat[-_]?(\d+)/i);
    if (matMatch) {
      const num = parseInt(matMatch[1], 10);
      const code = `MAT-${String(num).padStart(3, '0')}`;
      const found = lessons.find((l) => l.code === code || l.id === code || l.id === `MAT-${num}`);
      if (found) return `lesson:${found.id}`;
    }

    // 2. Mission code and card order match (e.g. C01_1, JR-C01-2, MISI 1 KARTU 2, MISI-1-2)
    const missionCardMatch = cleanName.match(/(?:jr-)?([cbp]\d+|misi[-_ ]?\d+)[-_ ]+(?:kartu[-_ ]?)?(\d+)/i);
    if (missionCardMatch) {
      const missionRaw = missionCardMatch[1];
      const cardOrder = parseInt(missionCardMatch[2], 10);
      const canonicalMission = normalizeMissionId(missionRaw);
      const found = lessons.find(
        (l) =>
          normalizeMissionId(l.missionId) === canonicalMission &&
          Number(l.contentOrder || l.orderIndex || 1) === cardOrder
      );
      if (found) return `lesson:${found.id}`;
    }

    // 3. Simple numeric match if only number in filename (e.g. 1.jpg -> MAT-001)
    const singleNumMatch = cleanName.match(/^(\d+)\.(png|jpg|jpeg|webp)$/i);
    if (singleNumMatch) {
      const num = parseInt(singleNumMatch[1], 10);
      const code = `MAT-${String(num).padStart(3, '0')}`;
      const found = lessons.find((l) => l.code === code || l.id === code);
      if (found) return `lesson:${found.id}`;
    }

    // 4. Match by title similarity
    for (const l of lessons) {
      const titleClean = l.title.toLowerCase().replace(/[^a-z0-9]/g, ' ');
      const words = titleClean.split(/\s+/).filter((w) => w.length > 3);
      const matches = words.filter((w) => cleanName.includes(w));
      if (matches.length >= 2) {
        return `lesson:${l.id}`;
      }
    }

    return lessons[0]?.id ? `lesson:${lessons[0].id}` : '';
  };

  const handleFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newItems: MatchedImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const res = await compressImageFile(file, 860, 0.76);
        if (res.dataUrl) {
          const matchedId = autoMatchLesson(file.name);
          newItems.push({
            id: `item-${Date.now()}-${i}`,
            file,
            dataUrl: res.dataUrl,
            sizeKb: res.compressedSizeKb,
            fileName: file.name,
            matchedLessonId: matchedId,
            status: 'ready',
          });
        }
      } catch (err) {
        console.warn('Gagal memproses file:', file.name, err);
      }
    }

    setItems((prev) => [...prev, ...newItems]);
    setIsProcessing(false);
  };

  const handleApplyAll = async () => {
    if (items.length === 0) return;
    setIsApplying(true);
    let successCount = 0;

    for (const item of items) {
      if (!item.dataUrl) continue;

      // Case A: Matched to a Mission Cover
      if (item.matchedLessonId.startsWith('mission:')) {
        const misId = item.matchedLessonId.replace('mission:', '');
        const mission = missions.find(
          (m) =>
            m.id === misId ||
            m.code === misId ||
            normalizeMissionId(m.id || m.code) === normalizeMissionId(misId)
        );
        if (mission) {
          try {
            const uploadRes = await uploadDataUrlToServer(item.fileName, item.dataUrl, 'missions');
            const finalUrl = uploadRes?.url || item.dataUrl;

            db.updateMission(
              mission.id,
              {
                imageUrl: finalUrl,
                openingImageUrl: finalUrl,
              },
              'Admin Kurikulum',
              `Unggah cover misi: ${item.fileName}`
            );
            item.status = 'saved';
            successCount++;
            continue;
          } catch (err) {
            console.error('Error saving image for mission:', mission.id, err);
            item.status = 'error';
            continue;
          }
        }
      }

      // Case B: Matched to a Lesson Slide
      const cleanLessonId = item.matchedLessonId.replace('lesson:', '');
      const lesson = lessons.find((l) => l.id === cleanLessonId || l.code === cleanLessonId);
      if (lesson && item.dataUrl) {
        try {
          // Upload to server disk & Firestore uploaded_images
          const uploadRes = await uploadDataUrlToServer(item.fileName, item.dataUrl, 'lessons');
          const finalUrl = uploadRes?.url || item.dataUrl;

          db.updateLesson(
            lesson.id,
            {
              imageUrl: finalUrl,
              image_url: finalUrl,
              missionId: lesson.missionId,
              contentOrder: Number(lesson.contentOrder || lesson.orderIndex || 1),
              orderIndex: Number(lesson.orderIndex || lesson.contentOrder || 1),
            },
            'Admin Kurikulum',
            `Unggah massal gambar: ${item.fileName} -> ${lesson.title}`
          );
          item.status = 'saved';
          successCount++;
        } catch (err) {
          console.error('Error saving image for lesson:', lesson.id, err);
          item.status = 'error';
        }
      }
    }

    sounds.playSuccess();
    setIsApplying(false);
    onSuccess(successCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Unggah Gambar Massal (Batch Sync)</h3>
              <p className="text-xs text-slate-500">
                Pilih atau seret beberapa berkas gambar sekaligus untuk otomatis dipetakan ke kartu materi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Dropzone */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              {isProcessing ? 'Sedang Memproses Gambar...' : 'Klik untuk Pilih Banyak File atau Seret ke Sini'}
            </span>
            <span className="text-xs text-slate-500 mt-1 max-w-md">
              Sistem akan otomatis mencocokkan nama berkas (misal: <code>MAT-001.png</code>, <code>Misi 1 Kartu 2.jpg</code>, <code>C01_1.webp</code>) dengan materi.
            </span>
            <input
              type="file"
              multiple
              accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />
          </label>

          {/* List of Loaded Images */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  {items.length} Gambar Siap Dipasang:
                </span>
                <button
                  onClick={() => setItems([])}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Hapus Semua
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const targetLesson = lessons.find((l) => l.id === item.matchedLessonId);
                  const mission = missions.find(
                    (m) => targetLesson && (m.id === targetLesson.missionId || m.code === targetLesson.missionId)
                  );

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                          <img
                            src={item.dataUrl}
                            alt={item.fileName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{item.fileName}</div>
                          <div className="text-[11px] text-slate-400">{item.sizeKb} KB (Teroptimasi)</div>
                        </div>
                      </div>

                      {/* Lesson Match Dropdown */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Dipasang ke Kartu:</span>
                          <select
                            value={item.matchedLessonId}
                            onChange={(e) => {
                              const newId = e.target.value;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, matchedLessonId: newId } : it))
                              );
                            }}
                            className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 max-w-[280px] truncate"
                          >
                            <optgroup label="Cover Misi (Sampul Utama)">
                              {missions.map((m) => (
                                <option key={`mis-${m.id}`} value={`mission:${m.id}`}>
                                  Cover Misi: {m.code || m.id} - {m.title.slice(0, 24)}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Kartu Materi (Slide Misi)">
                              {lessons.map((l) => (
                                <option key={`les-${l.id}`} value={`lesson:${l.id}`}>
                                  Materi: {l.code} - {l.title.slice(0, 24)}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>

                        <button
                          onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Batalkan gambar ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <button
            onClick={handleApplyAll}
            disabled={items.length === 0 || isApplying}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              items.length > 0 && !isApplying
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isApplying
                ? 'Menyimpan Gambar...'
                : `Terapkan Semua (${items.length} Gambar)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
