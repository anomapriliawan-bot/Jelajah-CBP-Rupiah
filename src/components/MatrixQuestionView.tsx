import React from 'react';
import { Check, X, Edit3, HelpCircle } from 'lucide-react';

export interface MatrixColumnChoice {
  label: string;
  code?: string;
  color?: 'emerald' | 'rose' | 'amber' | 'blue' | 'slate';
}

export interface MatrixStatement {
  id: string;
  text: string;
  allowsText?: boolean;
}

export interface ParsedMatrixQuestion {
  headerLabel: string;
  columns: MatrixColumnChoice[];
  statements: MatrixStatement[];
  customNoteEnabled?: boolean;
}

/**
 * Parsing options string/array menjadi struktur tabel matriks yang fleksibel
 */
export function parseMatrixQuestionOptions(
  rawOptions: string[] | string | undefined,
  questionTitle?: string
): ParsedMatrixQuestion {
  let list: string[] = [];
  if (Array.isArray(rawOptions)) {
    list = [...rawOptions];
  } else if (typeof rawOptions === 'string' && rawOptions.trim()) {
    try {
      const parsed = JSON.parse(rawOptions);
      if (Array.isArray(parsed)) list = parsed;
      else list = rawOptions.split('\n').filter(Boolean);
    } catch {
      list = rawOptions.split('\n').filter(Boolean);
    }
  }

  // Nilai default
  let headerLabel = 'Cara Merawat Rupiah';
  if (questionTitle && questionTitle.toLowerCase().includes('merawat')) {
    headerLabel = 'Cara Merawat Rupiah';
  } else {
    headerLabel = 'Pernyataan / Kriteria';
  }

  // Default kolom: Ya (1) & Tidak (2) seperti gambar kuesioner asli
  let columns: MatrixColumnChoice[] = [
    { label: 'Ya', code: '1', color: 'emerald' },
    { label: 'Tidak', code: '2', color: 'rose' },
  ];

  const statements: MatrixStatement[] = [];
  let customNoteEnabled = false;

  list.forEach((rawItem, idx) => {
    const item = String(rawItem).trim();
    if (!item) return;

    // Cek apakah ada deklarasi kustom kolom, misal: [Kolom: Ya | Tidak] atau Kolom: Sering, Jarang, Tidak
    if (item.toLowerCase().startsWith('[kolom:') || item.toLowerCase().startsWith('kolom:')) {
      const colStr = item.replace(/^\[?kolom:\s*/i, '').replace(/\]$/, '').trim();
      const splitted = colStr.includes('|') ? colStr.split('|') : colStr.split(',');
      if (splitted.length > 0) {
        columns = splitted.map((c, cIdx) => {
          const trimmed = c.trim();
          // Extract possible code, e.g. "Ya (1)" -> label: "Ya", code: "1"
          const codeMatch = trimmed.match(/^(.*?)\s*\((\d+)\)$/);
          if (codeMatch) {
            return {
              label: codeMatch[1].trim(),
              code: codeMatch[2].trim(),
              color: cIdx === 0 ? 'emerald' : cIdx === 1 ? 'rose' : 'blue',
            };
          }
          return {
            label: trimmed,
            code: String(cIdx + 1),
            color: cIdx === 0 ? 'emerald' : cIdx === 1 ? 'rose' : 'blue',
          };
        });
      }
      return;
    }

    // Cek jika ada custom note flag
    if (item.toLowerCase().includes('[isian]') || item.toLowerCase().includes('[catatan]')) {
      customNoteEnabled = true;
      return;
    }

    // Normal statement item
    const cleanText = item.replace(/^[0-9]+[\.\)]\s*/, '').trim();
    const isCustomTextInput = cleanText.toLowerCase().includes('lainnya') || cleanText.toLowerCase().includes('ketik');

    statements.push({
      id: `stmt_${idx}_${cleanText.slice(0, 15).replace(/\s+/g, '_')}`,
      text: cleanText,
      allowsText: isCustomTextInput,
    });
  });

  // Jika statements kosong, fallback ke 5T prinsip merawat Rupiah
  if (statements.length === 0) {
    const default5T = ['Tidak Dilipat', 'Tidak Distapler', 'Tidak Diremas', 'Tidak Dibasahi', 'Tidak Dicoret'];
    default5T.forEach((text, i) => {
      statements.push({
        id: `stmt_${i}_${text.replace(/\s+/g, '_')}`,
        text,
      });
    });
  }

  return {
    headerLabel,
    columns,
    statements,
    customNoteEnabled,
  };
}

interface MatrixQuestionViewProps {
  options: string[] | string | undefined;
  questionTitle?: string;
  userAnswer: any; // Record<string, string> atau { [statementText]: columnLabel, note?: string }
  onChange: (newAnswer: any) => void;
  disabled?: boolean;
}

export const MatrixQuestionView: React.FC<MatrixQuestionViewProps> = ({
  options,
  questionTitle,
  userAnswer,
  onChange,
  disabled = false,
}) => {
  const { headerLabel, columns, statements, customNoteEnabled } = parseMatrixQuestionOptions(
    options,
    questionTitle
  );

  // Normalisasi jawaban siswa
  const currentAnswers: Record<string, string> =
    typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)
      ? { ...userAnswer }
      : {};

  const handleSelect = (statementText: string, choiceLabel: string) => {
    if (disabled) return;
    const updated = {
      ...currentAnswers,
      [statementText]: choiceLabel,
    };
    onChange(updated);
  };

  const handleNoteChange = (noteText: string) => {
    if (disabled) return;
    const updated = {
      ...currentAnswers,
      _customNote: noteText,
    };
    onChange(updated);
  };

  const answeredCount = statements.filter((st) => Boolean(currentAnswers[st.text])).length;
  const isComplete = answeredCount === statements.length;

  return (
    <div className="space-y-4">
      {/* Header Info & Progress */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Beri pilihan pada setiap baris di bawah:</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
              isComplete
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {answeredCount} dari {statements.length} Terjawab
          </span>
        </div>
      </div>

      {/* Tabel Matriks - Tampilan Desktop / Tablet */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[340px]">
            <thead>
              <tr className="bg-slate-800/90 border-b border-slate-700 text-slate-200">
                <th className="py-3.5 px-3 sm:px-4 font-black text-xs sm:text-sm text-slate-100 w-auto">
                  {headerLabel}
                </th>
                {columns.map((col, cIdx) => (
                  <th
                    key={cIdx}
                    className="py-3.5 px-2 sm:px-4 text-center font-black text-xs sm:text-sm whitespace-nowrap w-[90px] sm:w-[110px]"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-slate-100">{col.label}</span>
                      {col.code && (
                        <span className="text-[10px] font-mono text-slate-400 font-medium">
                          ({col.code})
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-200">
              {statements.map((stmt, sIdx) => {
                const selectedVal = currentAnswers[stmt.text];
                const isEven = sIdx % 2 === 0;

                return (
                  <tr
                    key={stmt.id}
                    className={`transition-colors ${
                      isEven ? 'bg-slate-900/60' : 'bg-slate-850/40'
                    } hover:bg-slate-800/50`}
                  >
                    {/* Pernyataan */}
                    <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500 shrink-0 w-4">
                          {sIdx + 1}.
                        </span>
                        <span className="leading-snug">{stmt.text}</span>
                      </div>

                      {/* Jika pernyataan ini memiliki opsi isian ketik teks */}
                      {stmt.allowsText && (
                        <div className="mt-2 pl-6">
                          <input
                            type="text"
                            placeholder="Ketik jawaban / keterangan Adik di sini..."
                            value={currentAnswers[`${stmt.text}_text`] || ''}
                            onChange={(e) => {
                              onChange({
                                ...currentAnswers,
                                [`${stmt.text}_text`]: e.target.value,
                              });
                            }}
                            disabled={disabled}
                            className="w-full text-xs px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                          />
                        </div>
                      )}
                    </td>

                    {/* Kolom Pilihan */}
                    {columns.map((col, cIdx) => {
                      const isChosen =
                        selectedVal === col.label ||
                        selectedVal === col.code ||
                        (selectedVal && String(selectedVal).toLowerCase() === col.label.toLowerCase());

                      return (
                        <td key={cIdx} className="py-2.5 px-2 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleSelect(stmt.text, col.label)}
                            disabled={disabled}
                            className={`w-full py-2 px-2 sm:px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                              isChosen
                                ? col.color === 'emerald'
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md shadow-emerald-500/25 font-black scale-105'
                                  : col.color === 'rose'
                                  ? 'bg-rose-500 text-white border-rose-300 shadow-md shadow-rose-500/25 font-black scale-105'
                                  : 'bg-amber-400 text-slate-950 border-amber-200 shadow-md shadow-amber-400/25 font-black scale-105'
                                : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            <span className="hidden sm:inline">{col.label}</span>
                            <span className="sm:hidden">{col.code || col.label}</span>
                            {isChosen && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bagian Isian Tambahan Jika Diperlukan / Diaktifkan */}
      {customNoteEnabled && (
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Edit3 className="w-4 h-4 text-amber-400" />
            <span>Keterangan / Catatan Tambahan Adik (Opsional):</span>
          </div>
          <input
            type="text"
            placeholder="Tuliskan jika ada cara merawat lainnya..."
            value={currentAnswers._customNote || ''}
            onChange={(e) => handleNoteChange(e.target.value)}
            disabled={disabled}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
          />
        </div>
      )}
    </div>
  );
};
