import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Save,
  X,
  FileText,
  Search,
} from 'lucide-react';
import { Reference } from '../../types';
import { db } from '../../services/db';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

export const AdminReferencesView: React.FC = () => {
  const [references, setReferences] = useState<Reference[]>(db.getReferences());
  const [editingRef, setEditingRef] = useState<Reference | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form
  const [formData, setFormData] = useState<{
    code: string;
    title: string;
    citation: string;
    url: string;
    publicationYear: number;
    status: 'draft' | 'review' | 'approved' | 'published';
  }>({
    code: '',
    title: '',
    citation: '',
    url: '',
    publicationYear: 2022,
    status: 'approved',
  });

  const refreshData = () => {
    setReferences(db.getReferences());
  };

  const handleOpenCreate = () => {
    const nextCode = `REF-${String(references.length + 1).padStart(2, '0')}`;
    setFormData({
      code: nextCode,
      title: '',
      citation: 'Departemen Komunikasi Bank Indonesia, Jakarta.',
      url: 'https://www.bi.go.id/id/rupiah/gambar-uang/default.aspx',
      publicationYear: 2022,
      status: 'approved',
    });
    setEditingRef(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (r: Reference) => {
    setEditingRef(r);
    setFormData({
      code: r.code,
      title: r.title,
      citation: r.citation || '',
      url: r.url || '',
      publicationYear: Number(r.publicationYear) || 2022,
      status: r.status as any,
    });
    setIsCreateOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<Reference> = {
      code: formData.code,
      title: formData.title,
      citation: formData.citation,
      url: formData.url,
      publicationYear: Number(formData.publicationYear),
      status: formData.status,
    };

    if (editingRef) {
      db.updateReference(editingRef.id, payload);
    } else {
      db.createReference(payload as Omit<Reference, 'id'>);
    }

    refreshData();
    setIsCreateOpen(false);
    setEditingRef(null);
  };

  const handleDelete = (id: string) => {
    db.deleteReference(id);
    refreshData();
    setConfirmDeleteId(null);
  };

  const filteredRefs = references.filter((r) => {
    if (!searchQuery.trim()) return true;
    const s = searchQuery.toLowerCase();
    return r.title.toLowerCase().includes(s) || r.code.toLowerCase().includes(s) || r.citation.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Manajemen Sumber Referensi Resmi BI</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar regulasi, PBI (Peraturan Bank Indonesia), PADG, modul edukasi CBP, dan rujukan ilmiah kurikulum (Hanya terlihat oleh Tim Admin & Reviewer).
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Sumber Referensi</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari regulasi atau referensi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRefs.map((ref) => (
          <div
            key={ref.id}
            className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {ref.code}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {ref.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                {ref.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                "{ref.citation}"
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Tahun Terbit: <strong>{ref.publicationYear || 2022}</strong></span>
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Buka Tautan BI</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => handleOpenEdit(ref)}
                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 px-3"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setConfirmDeleteId(ref.id)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col min-h-0 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
              <h3 className="font-bold text-base text-slate-900">
                {editingRef ? `Edit Referensi (${formData.code})` : 'Tambah Referensi Regulasi'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kode Referensi</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Publikasi</label>
                    <input
                      type="number"
                      value={formData.publicationYear}
                      onChange={(e) => setFormData({ ...formData, publicationYear: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Dokumen / Regulasi</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Contoh: Peraturan Bank Indonesia No. 24/10/PBI/2022..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sitasi Resmi (Citation)</label>
                  <textarea
                    rows={2}
                    value={formData.citation}
                    onChange={(e) => setFormData({ ...formData, citation: e.target.value })}
                    required
                    placeholder="Contoh: Bank Indonesia. (2022). Panduan Pengenalan Ciri Keaslian Rupiah TE 2022."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL Sumber Resmi</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://www.bi.go.id/..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-2.5 sm:gap-3 p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Simpan Referensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Hapus Sumber Referensi?"
        message="Referensi ini akan dihapus dari sistem."
        confirmLabel="Ya, Hapus"
        variant="danger"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
