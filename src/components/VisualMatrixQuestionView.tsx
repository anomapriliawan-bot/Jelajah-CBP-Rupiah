import React from 'react';
import { Check, Eye, HelpCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { FinalMissionQuestion, FinalMissionMatrixItem } from '../types';
import { db } from '../services/db';
import { SafeImage } from './common/SafeImage';

interface VisualMatrixQuestionViewProps {
  question: FinalMissionQuestion;
  userAnswer: any; // Record<string, string> misal: { item_1: 'Tunai', item_2: 'Non Tunai' }
  onChange: (newAnswer: Record<string, string>) => void;
  onPreviewImage?: (imageUrl: string) => void;
  disabled?: boolean;
}

export const VisualMatrixQuestionView: React.FC<VisualMatrixQuestionViewProps> = ({
  question,
  userAnswer,
  onChange,
  onPreviewImage,
  disabled = false,
}) => {
  const items: FinalMissionMatrixItem[] = Array.isArray(question.matrixItems)
    ? question.matrixItems
    : [];

  const categories: string[] =
    Array.isArray(question.categories) && question.categories.length > 0
      ? question.categories
      : ['Tunai', 'Non Tunai'];

  // Normalisasi jawaban siswa menjadi map { [itemId]: categoryName }
  const currentAnswers: Record<string, string> =
    typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)
      ? { ...userAnswer }
      : {};

  const handleSelectCategory = (itemId: string, category: string) => {
    if (disabled) return;
    const updated = {
      ...currentAnswers,
      [itemId]: category,
    };
    onChange(updated);
  };

  const answeredCount = items.filter((it) => Boolean(currentAnswers[it.id] || currentAnswers[it.label])).length;
  const isComplete = items.length > 0 && answeredCount === items.length;

  return (
    <div className="space-y-4">
      {/* Header Info & Progress Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 font-medium">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">Kelompokkan Setiap Gambar:</span>
            <span className="text-slate-400 text-xs block sm:inline sm:ml-1.5">
              Pilih apakah termasuk kategori <strong className="text-emerald-400 font-bold">{categories[0]}</strong> atau <strong className="text-sky-400 font-bold">{categories[1] || 'Lainnya'}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span
            className={`text-xs font-black px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
              isComplete
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
            <span>
              {answeredCount} dari {items.length} Dikelompokkan
            </span>
          </span>
        </div>
      </div>

      {/* Grid of Visual Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {items.map((item, idx) => {
          const itemImg = db.getFinalMissionMatrixItemImage(question.id, item) || item.imageUrl || '';
          const selectedCategory = currentAnswers[item.id] || currentAnswers[item.label] || '';
          const hasSelected = Boolean(selectedCategory);

          return (
            <div
              key={item.id || idx}
              className={`rounded-2xl border p-4 sm:p-4.5 transition-all flex flex-col justify-between gap-3.5 ${
                hasSelected
                  ? 'bg-slate-900/95 border-slate-600 shadow-md ring-1 ring-slate-700'
                  : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 shadow-sm'
              }`}
            >
              {/* Top: Item Index & Title */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                    {item.label}
                  </h3>
                </div>

                {hasSelected && (
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
                      selectedCategory.toLowerCase().includes('non')
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {selectedCategory}
                  </span>
                )}
              </div>

              {/* Middle: Visual Image Box */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 p-2 flex items-center justify-center min-h-[140px] max-h-[180px] group">
                {itemImg ? (
                  <>
                    <SafeImage
                      src={itemImg}
                      alt={item.label}
                      lookupKeys={[
                        `fm_item_${question.id}_${item.id}`,
                        `fm_item_${item.id}`,
                        item.id,
                        item.imageFileName || '',
                      ]}
                      showPlaceholderOnMissing={true}
                      fallbackTitle={item.label}
                      className="max-h-36 w-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    {onPreviewImage && (
                      <button
                        type="button"
                        onClick={() => onPreviewImage(itemImg)}
                        className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/85 hover:bg-slate-850 border border-slate-700 text-[11px] font-bold text-slate-200 opacity-90 group-hover:opacity-100 backdrop-blur-xs transition-opacity cursor-pointer shadow-md"
                        title="Klik untuk melihat gambar ukuran besar"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Perbesar</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-500 italic flex items-center justify-center h-28">
                    Gambar: {item.imageFileName || item.label}
                  </div>
                )}
              </div>

              {/* Bottom: Interactive Category Selection Buttons */}
              <div className="pt-1">
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat, cIdx) => {
                    const isSelected =
                      selectedCategory.toLowerCase() === cat.toLowerCase();
                    const isNonTunai = cat.toLowerCase().includes('non');

                    return (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleSelectCategory(item.id, cat)}
                        disabled={disabled}
                        className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? isNonTunai
                              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 border-sky-300 shadow-md shadow-sky-500/25 scale-[1.02]'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 shadow-md shadow-emerald-500/25 scale-[1.02]'
                            : 'bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <span>{cat}</span>
                        {isSelected && <Check className="w-4 h-4 stroke-[3] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
