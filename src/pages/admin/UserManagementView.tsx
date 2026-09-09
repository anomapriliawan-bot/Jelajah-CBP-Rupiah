import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Building,
  School as SchoolIcon,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Crown,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  Edit2,
  Trash2,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { db, generateMemorableUsername, generateMemorablePassword } from '../../services/db';
import { User, School } from '../../types';
import {
  generateSchoolsTemplateExcel,
  generateUsersTemplateExcel,
  parseSchoolsExcel,
  parseUsersExcel,
  exportUsersToExcel,
} from '../../services/userExcelService';
import { sounds } from '../../utils/audio';

interface UserManagementViewProps {
  currentUser?: User | null;
}

type ManagementSubTab = 'schools' | 'users' | 'admins';

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const activeUser = currentUser || db.getCurrentUser();
  const isSuperAdmin = activeUser?.role === 'superadmin';
  const isAdminSekolah = activeUser?.role === 'admin' || activeUser?.role === 'reviewer';

  // Sub tab (Super Admin can switch between Sekolah, Pengguna & Instansi)
  const [subTab, setSubTab] = useState<ManagementSubTab>(isSuperAdmin ? 'schools' : 'users');

  // Data states
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>(
    isSuperAdmin ? 'all' : activeUser?.schoolId || activeUser?.school || 'all'
  );
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Forms
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
  const [isEditSchoolModalOpen, setIsEditSchoolModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Selected for Edit
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'schools' | 'users'>('users');
  const [isUploading, setIsUploading] = useState(false);

  // Form State for New/Edit User
  const [userFormData, setUserFormData] = useState({
    name: '',
    role: 'student' as 'student' | 'teacher' | 'admin' | 'superadmin' | 'reviewer',
    school: '',
    schoolId: '',
    institution: '',
    username: '',
    password: '',
    nisn: '',
    nip: '',
    gender: 'male' as 'male' | 'female',
    grade: 'Kelas 5',
    phone: '',
    email: '',
  });

  // Real-time Uniqueness Validation State
  const [uniquenessStatus, setUniquenessStatus] = useState<{
    valid: boolean;
    field?: string;
    message?: string;
  }>({ valid: true });

  // Form State for New/Edit School
  const [schoolFormData, setSchoolFormData] = useState({
    name: '',
    code: '',
    npsn: '',
    principalName: '',
    address: '',
    phone: '',
    email: '',
    adminName: '',
    adminUsername: '',
    adminPassword: '',
  });

  // Load data from DB
  const loadData = () => {
    const allSchools = db.getSchools();
    const allUsers = db.getUsers();
    setSchools(allSchools);
    setUsers(allUsers);
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return unsub;
  }, []);

  // Update default school in user form when active user is school admin
  useEffect(() => {
    if (!isSuperAdmin && activeUser?.school) {
      setUserFormData((prev) => ({
        ...prev,
        school: activeUser.school || '',
        schoolId: activeUser.schoolId || '',
      }));
    }
  }, [activeUser, isSuperAdmin]);

  // Real-time check uniqueness on form data changes
  useEffect(() => {
    if (!isAddUserModalOpen && !isEditUserModalOpen) {
      setUniquenessStatus({ valid: true });
      return;
    }

    const validation = db.validateUserUniqueness(editingUser ? editingUser.id : null, {
      username: userFormData.username.trim() || undefined,
      nisn: userFormData.role === 'student' ? userFormData.nisn.trim() || undefined : undefined,
      nip: userFormData.role !== 'student' ? userFormData.nip.trim() || undefined : undefined,
      email: userFormData.email.trim() || undefined,
    });

    setUniquenessStatus(validation);
  }, [
    userFormData.username,
    userFormData.nisn,
    userFormData.nip,
    userFormData.email,
    userFormData.role,
    editingUser,
    isAddUserModalOpen,
    isEditUserModalOpen,
  ]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    if (type === 'success') sounds.playSuccess();
    else sounds.playError();
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyCredentials = (u: User) => {
    sounds.playPop();
    const instansiText = u.institution || u.school || 'Sistem Jelajah Rupiah';
    const text = `Akun Jelajah Rupiah\nNama: ${u.name}\nPeran: ${u.role}\nInstansi / Sekolah: ${instansiText}\nUsername: ${u.username || u.id}\nKata Sandi: ${u.password || '123'}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(u.id);
      showToast(`Kredensial untuk ${u.name} berhasil disalin ke clipboard!`);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  // ----------------------------------------------------
  // GENERATORS
  // ----------------------------------------------------
  const handleRegenerateUserCredentials = () => {
    sounds.playPop();
    const schoolOrInst =
      userFormData.role === 'superadmin' || userFormData.role === 'reviewer'
        ? userFormData.institution || 'instansi'
        : userFormData.school || activeUser?.school || 'sekolah';

    const genUser = generateMemorableUsername(
      userFormData.role,
      schoolOrInst,
      userFormData.name || 'user',
      users
    );
    const genPass = generateMemorablePassword();
    setUserFormData((prev) => ({
      ...prev,
      username: genUser,
      password: genPass,
    }));
  };

  const handleRegenerateSchoolAdminCredentials = () => {
    sounds.playPop();
    const schoolName = schoolFormData.name || 'sekolah';
    const genUser = generateMemorableUsername(
      'admin',
      schoolName,
      schoolFormData.principalName || 'admin',
      users
    );
    const genPass = generateMemorablePassword();
    setSchoolFormData((prev) => ({
      ...prev,
      adminUsername: genUser,
      adminPassword: genPass,
    }));
  };

  // ----------------------------------------------------
  // USER CRUD
  // ----------------------------------------------------
  const handleOpenAddUser = (
    defaultRole: 'student' | 'teacher' | 'admin' | 'superadmin' | 'reviewer' = 'student'
  ) => {
    sounds.playPop();
    const isInstansiRole = defaultRole === 'superadmin' || defaultRole === 'reviewer';
    const defaultSchool = !isSuperAdmin
      ? activeUser?.school || 'SD Negeri 2 Medewi'
      : schools[0]?.name || 'SD Negeri 2 Medewi';
    const matchedSchool = schools.find((s) => s.name === defaultSchool);
    const defaultInst = isInstansiRole ? 'Bank Indonesia KPw Provinsi Bali' : '';

    const genUser = generateMemorableUsername(
      defaultRole,
      isInstansiRole ? defaultInst : defaultSchool,
      'baru',
      users
    );
    const genPass = generateMemorablePassword();

    setUserFormData({
      name: '',
      role: defaultRole,
      school: isInstansiRole ? defaultInst : defaultSchool,
      schoolId: isInstansiRole ? '' : matchedSchool?.id || '',
      institution: defaultInst,
      username: genUser,
      password: genPass,
      nisn: '',
      nip: '',
      gender: 'male',
      grade: 'Kelas 5',
      phone: '',
      email: '',
    });
    setIsAddUserModalOpen(true);
  };

  const handleSaveAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim()) {
      showToast('Nama pengguna tidak boleh kosong!', 'error');
      return;
    }

    if (!uniquenessStatus.valid) {
      showToast(uniquenessStatus.message || 'Data akun duplikat atau sudah digunakan.', 'error');
      return;
    }

    const isInstansiRole = userFormData.role === 'superadmin' || userFormData.role === 'reviewer';

    const res = db.addUser({
      name: userFormData.name.trim(),
      role: userFormData.role,
      school: isInstansiRole
        ? userFormData.institution.trim() || 'Bank Indonesia'
        : userFormData.school.trim(),
      schoolId: isInstansiRole ? undefined : userFormData.schoolId || undefined,
      institution: isInstansiRole ? userFormData.institution.trim() : undefined,
      username: userFormData.username.trim() || undefined,
      password: userFormData.password.trim() || undefined,
      nisn: userFormData.role === 'student' ? userFormData.nisn.trim() || undefined : undefined,
      nip: userFormData.role !== 'student' ? userFormData.nip.trim() || undefined : undefined,
      gender: userFormData.gender,
      grade: userFormData.role === 'student' ? userFormData.grade : undefined,
      phone: userFormData.phone.trim() || undefined,
      email: userFormData.email.trim() || undefined,
    });

    if (res.success) {
      showToast(`Pengguna "${userFormData.name}" berhasil dibuat dengan username "${res.user?.username}"!`);
      setIsAddUserModalOpen(false);
      loadData();
    } else {
      showToast(res.message || 'Gagal menambahkan pengguna.', 'error');
    }
  };

  const handleOpenEditUser = (u: User) => {
    sounds.playPop();
    setEditingUser(u);
    setUserFormData({
      name: u.name,
      role: (u.role as any) || 'student',
      school: u.school || '',
      schoolId: u.schoolId || '',
      institution: u.institution || (['superadmin', 'reviewer', 'viewer'].includes(u.role) ? u.school || '' : ''),
      username: u.username || '',
      password: u.password || '',
      nisn: u.nisn || '',
      nip: u.nip || '',
      gender: u.gender === 'female' || (u.gender as any) === 'perempuan' ? 'female' : 'male',
      grade: u.grade || 'Kelas 5',
      phone: u.phone || '',
      email: u.email || '',
    });
    setIsEditUserModalOpen(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!uniquenessStatus.valid) {
      showToast(uniquenessStatus.message || 'Data akun duplikat atau sudah digunakan.', 'error');
      return;
    }

    const isInstansiRole = userFormData.role === 'superadmin' || userFormData.role === 'reviewer';

    const updated = db.updateUser(editingUser.id, {
      name: userFormData.name.trim(),
      role: userFormData.role,
      school: isInstansiRole
        ? userFormData.institution.trim() || 'Bank Indonesia'
        : userFormData.school.trim(),
      schoolId: isInstansiRole ? undefined : userFormData.schoolId || undefined,
      institution: isInstansiRole ? userFormData.institution.trim() : undefined,
      username: userFormData.username.trim() || undefined,
      password: userFormData.password.trim() || undefined,
      nisn: userFormData.role === 'student' ? userFormData.nisn.trim() || undefined : undefined,
      nip: userFormData.role !== 'student' ? userFormData.nip.trim() || undefined : undefined,
      gender: userFormData.gender,
      grade: userFormData.role === 'student' ? userFormData.grade : undefined,
      phone: userFormData.phone.trim() || undefined,
      email: userFormData.email.trim() || undefined,
    });

    if (updated) {
      showToast(`Data akun "${updated.name}" berhasil diperbarui!`);
      setIsEditUserModalOpen(false);
      setEditingUser(null);
      loadData();
    } else {
      showToast('Gagal memperbarui akun.', 'error');
    }
  };

  const handleDeleteUser = (u: User) => {
    sounds.playPop();
    if (u.username === 'kepsek' || u.role === 'superadmin') {
      showToast('Akun Super Administrator utama (kepsek) tidak dapat dihapus.', 'error');
      return;
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun "${u.name}" (${u.username || u.id}) secara permanen dari sistem?`)) {
      db.deleteUser(u.id);
      showToast(`Akun "${u.name}" berhasil dihapus permanen.`);
      loadData();
    }
  };

  const handleResetPassword = (u: User) => {
    sounds.playPop();
    const res = db.resetUserPassword(u.id);
    if (res.success && res.newPassword) {
      showToast(`Kata sandi untuk ${u.name} berhasil direset menjadi: ${res.newPassword}`);
      loadData();
    }
  };

  // ----------------------------------------------------
  // SCHOOL CRUD
  // ----------------------------------------------------
  const handleOpenAddSchool = () => {
    sounds.playPop();
    const nextIndex = schools.length + 1;
    const defaultCode = `SCH-${nextIndex < 10 ? '0' + nextIndex : nextIndex}`;
    const genUser = generateMemorableUsername('admin', `sdn${nextIndex}`, 'kepsek');
    const genPass = generateMemorablePassword();

    setSchoolFormData({
      name: '',
      code: defaultCode,
      npsn: '',
      principalName: '',
      address: '',
      phone: '',
      email: '',
      adminName: '',
      adminUsername: genUser,
      adminPassword: genPass,
    });
    setIsAddSchoolModalOpen(true);
  };

  const handleSaveAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolFormData.name.trim()) {
      showToast('Nama sekolah wajib diisi!', 'error');
      return;
    }

    const res = db.addSchool(
      {
        name: schoolFormData.name.trim(),
        code: schoolFormData.code.trim(),
        npsn: schoolFormData.npsn.trim(),
        principalName: schoolFormData.principalName.trim(),
        address: schoolFormData.address.trim(),
        phone: schoolFormData.phone.trim(),
        email: schoolFormData.email.trim(),
        adminName: schoolFormData.adminName.trim() || schoolFormData.principalName.trim() || `Admin ${schoolFormData.name.trim()}`,
        adminUsername: schoolFormData.adminUsername.trim(),
      },
      true
    );

    if (res.adminUser && schoolFormData.adminPassword) {
      db.updateUser(res.adminUser.id, { password: schoolFormData.adminPassword.trim() });
    }

    showToast(`Sekolah "${res.school.name}" & Akun Admin "${res.adminUser?.username}" berhasil dibuat!`);
    setIsAddSchoolModalOpen(false);
    loadData();
  };

  const handleOpenEditSchool = (s: School) => {
    sounds.playPop();
    setEditingSchool(s);
    setSchoolFormData({
      name: s.name,
      code: s.code || '',
      npsn: s.npsn || '',
      principalName: s.principalName || '',
      address: s.address || '',
      phone: s.phone || '',
      email: s.email || '',
      adminName: s.adminName || '',
      adminUsername: s.adminUsername || '',
      adminPassword: '',
    });
    setIsEditSchoolModalOpen(true);
  };

  const handleSaveEditSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;

    const updated = db.updateSchool(editingSchool.id, {
      name: schoolFormData.name.trim(),
      code: schoolFormData.code.trim(),
      npsn: schoolFormData.npsn.trim(),
      principalName: schoolFormData.principalName.trim(),
      address: schoolFormData.address.trim(),
      phone: schoolFormData.phone.trim(),
      email: schoolFormData.email.trim(),
      adminName: schoolFormData.adminName.trim() || schoolFormData.principalName.trim(),
      adminUsername: schoolFormData.adminUsername.trim() || undefined,
    });

    // If admin username/password changed, update the user record
    if (editingSchool.adminId) {
      const updates: Partial<User> = {};
      if (schoolFormData.adminUsername) updates.username = schoolFormData.adminUsername.trim();
      if (schoolFormData.adminPassword) updates.password = schoolFormData.adminPassword.trim();
      if (schoolFormData.adminName) updates.name = schoolFormData.adminName.trim();
      if (Object.keys(updates).length > 0) {
        db.updateUser(editingSchool.adminId, updates);
      }
    }

    if (updated) {
      showToast(`Data sekolah "${updated.name}" berhasil diperbarui!`);
      setIsEditSchoolModalOpen(false);
      setEditingSchool(null);
      loadData();
    }
  };

  const handleDeleteSchool = (s: School) => {
    sounds.playPop();
    if (window.confirm(`Hapus sekolah "${s.name}"? Siswa dan guru terkait tidak akan terhapus otomatis.`)) {
      db.deleteSchool(s.id);
      showToast(`Sekolah "${s.name}" berhasil dihapus.`);
      loadData();
    }
  };

  // ----------------------------------------------------
  // TEMPLATES & EXPORT/IMPORT
  // ----------------------------------------------------
  const handleDownloadSchoolTemplate = () => {
    sounds.playPop();
    const bytes = generateSchoolsTemplateExcel();
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Data_Sekolah_Jelajah_Rupiah.xlsx';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Template Data Sekolah berhasil diunduh!');
  };

  const handleDownloadUserTemplate = (role: 'student' | 'teacher' | 'all') => {
    sounds.playPop();
    const bytes = generateUsersTemplateExcel(role);
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_Data_${role === 'student' ? 'Siswa' : role === 'teacher' ? 'Guru' : 'Pengguna'}_Jelajah_Rupiah.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Template Data Pengguna berhasil diunduh!');
  };

  const handleExportAllUsers = () => {
    sounds.playPop();
    const filteredUsers = getFilteredUsers();
    const bytes = exportUsersToExcel(filteredUsers);
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Kredensial_Akun_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${filteredUsers.length} akun berhasil diekspor ke Excel!`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    sounds.playPop();

    try {
      const buffer = await file.arrayBuffer();

      if (uploadType === 'schools') {
        const parsed = parseSchoolsExcel(buffer);
        if (parsed.length === 0) {
          showToast('Tidak ada data sekolah yang valid dalam file Excel.', 'error');
          setIsUploading(false);
          return;
        }

        const res = db.bulkImportSchools(parsed);
        showToast(`Impor Sekolah Selesai: ${res.added} Ditambahkan, ${res.updated} Diperbarui.`);
      } else {
        const parsed = parseUsersExcel(buffer);
        if (parsed.length === 0) {
          showToast('Tidak ada data pengguna yang valid dalam file Excel.', 'error');
          setIsUploading(false);
          return;
        }

        const defaultSchool = !isSuperAdmin ? activeUser?.school : schools[0]?.name;
        const res = db.bulkImportUsers(parsed, defaultSchool);
        showToast(`Impor Pengguna Selesai: ${res.added} Ditambahkan, ${res.updated} Diperbarui.`);
      }

      loadData();
      setIsUploadModalOpen(false);
    } catch (err: any) {
      console.error('Error importing Excel:', err);
      showToast('Gagal memproses file Excel: ' + (err.message || 'Format tidak sesuai'), 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ----------------------------------------------------
  // FILTERING LOGIC
  // ----------------------------------------------------
  const getFilteredUsers = (): User[] => {
    let list = users;

    // School filter
    if (selectedSchoolFilter !== 'all') {
      list = list.filter(
        (u) =>
          u.schoolId === selectedSchoolFilter ||
          (u.school && u.school.toLowerCase() === selectedSchoolFilter.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'admin') {
        list = list.filter((u) => ['admin', 'reviewer', 'viewer', 'superadmin'].includes(u.role));
      } else {
        list = list.filter((u) => u.role === roleFilter);
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.nisn && u.nisn.toLowerCase().includes(q)) ||
          (u.nip && u.nip.toLowerCase().includes(q)) ||
          (u.school && u.school.toLowerCase().includes(q)) ||
          (u.grade && u.grade.toLowerCase().includes(q))
      );
    }

    return list;
  };

  const getFilteredSchools = (): School[] => {
    if (!searchQuery.trim()) return schools;
    const q = searchQuery.toLowerCase().trim();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.npsn && s.npsn.toLowerCase().includes(q)) ||
        (s.principalName && s.principalName.toLowerCase().includes(q)) ||
        (s.adminUsername && s.adminUsername.toLowerCase().includes(q))
    );
  };

  const filteredUsers = getFilteredUsers();
  const filteredSchools = getFilteredSchools();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs sm:text-sm animate-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-rose-600 text-white shadow-rose-600/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {isSuperAdmin ? 'Super Administrator' : `Admin Sekolah • ${activeUser?.school || 'SD'}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Manajemen Akun Pengguna
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
              {isSuperAdmin
                ? 'Kelola data satuan pendidikan, generate akun, dan pantau seluruh pengguna sistem secara terpusat.'
                : 'Kelola dan generate akun Guru Pembina serta Siswa sekolah dengan kredensial unik yang aman.'}
            </p>
          </div>

          {/* Action Buttons for Super Admin / Admin Sekolah */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => handleOpenAddUser('superadmin')}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                  title="Tambah Akun Super Admin atau Pengawas/Reviewer Instansi"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>+ Akun Instansi</span>
                </button>

                <button
                  onClick={handleOpenAddSchool}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-blue-500/30 flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Sekolah</span>
                </button>
              </>
            )}

            <button
              onClick={() => handleOpenAddUser('student')}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>

            <button
              onClick={() => handleOpenAddUser('teacher')}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Upload Excel</span>
            </button>

            <button
              onClick={handleExportAllUsers}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Akun</span>
            </button>
          </div>
        </div>

        {/* Super Admin Tab Selector */}
        {isSuperAdmin && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSubTab('schools')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'schools'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Data Sekolah ({schools.length})</span>
            </button>

            <button
              onClick={() => setSubTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'users'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Siswa & Guru ({users.filter((u) => ['student', 'teacher', 'admin'].includes(u.role)).length})</span>
            </button>

            <button
              onClick={() => setSubTab('admins')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'admins'
                  ? 'bg-gradient-to-r from-amber-600 to-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>
                Super Admin & Pengawas Instansi ({users.filter((u) => ['superadmin', 'reviewer', 'viewer'].includes(u.role)).length})
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: DATA SEKOLAH (SUPER ADMIN ONLY)               */}
      {/* ---------------------------------------------------- */}
      {isSuperAdmin && subTab === 'schools' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama sekolah, NPSN, Kepsek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleDownloadSchoolTemplate}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template Sekolah</span>
              </button>
            </div>
          </div>

          {/* Schools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchools.map((sch) => {
              const schoolUsers = users.filter((u) => u.schoolId === sch.id || u.school === sch.name);
              const adminAcc = users.find((u) => u.id === sch.adminId || (u.school === sch.name && u.role === 'admin'));
              const studentCount = schoolUsers.filter((u) => u.role === 'student').length;
              const teacherCount = schoolUsers.filter((u) => u.role === 'teacher').length;

              return (
                <div
                  key={sch.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shrink-0 border border-blue-100">
                          <SchoolIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{sch.name}</h3>
                          <span className="text-[11px] text-slate-500 font-medium">
                            NPSN: {sch.npsn || '-'} • Kode: {sch.code || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* School Details */}
                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Kepala Sekolah:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[170px]">
                          {sch.principalName || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Total Pengguna:</span>
                        <span className="font-bold text-blue-600">
                          {teacherCount} Guru • {studentCount} Siswa
                        </span>
                      </div>
                      {sch.address && (
                        <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-slate-200/60">
                          📍 {sch.address}
                        </div>
                      )}
                    </div>

                    {/* Admin Sekolah Credential Card */}
                    <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Akun Admin Sekolah:</span>
                        </span>
                        {adminAcc && (
                          <button
                            onClick={() => handleCopyCredentials(adminAcc)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                            title="Salin Kredensial"
                          >
                            {copiedId === adminAcc.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedId === adminAcc.id ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        )}
                      </div>
                      <div className="text-xs font-mono flex items-center justify-between text-indigo-950">
                        <span>User: <strong className="text-indigo-700">{adminAcc?.username || sch.adminUsername || '-'}</strong></span>
                        <span>PIN: <strong className="text-indigo-700">{adminAcc?.password || '123'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedSchoolFilter(sch.name);
                        setSubTab('users');
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Lihat Siswa & Guru ({schoolUsers.length}) &rarr;
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditSchool(sch)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                        title="Edit Data Sekolah & Admin"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchool(sch)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Hapus Sekolah"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: DATA PENGGUNA (GURU & SISWA)                  */}
      {/* ---------------------------------------------------- */}
      {(!isSuperAdmin || subTab === 'users') && (
        <div className="space-y-4">
          {/* Filters & Actions Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, username, NISN, NIP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* School Filter (Super Admin) */}
              {isSuperAdmin && (
                <select
                  value={selectedSchoolFilter}
                  onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Semua Sekolah ({schools.length})</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Semua Peran</option>
                <option value="student">Siswa Saja</option>
                <option value="teacher">Guru Saja</option>
                {isSuperAdmin && <option value="admin">Admin Saja</option>}
              </select>
            </div>

            {/* Right Action Templates */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => handleDownloadUserTemplate('student')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Download Template Excel untuk Siswa"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template Siswa</span>
              </button>

              <button
                onClick={() => handleDownloadUserTemplate('teacher')}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Download Template Excel untuk Guru"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template Guru</span>
              </button>
            </div>
          </div>

          {/* Users Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Menampilkan <strong>{filteredUsers.length}</strong> pengguna
                {selectedSchoolFilter !== 'all' ? ` di ${selectedSchoolFilter}` : ''}
              </span>
              <span className="text-[11px] text-slate-400">
                Klik ikon salin untuk membagikan akun ke siswa/guru
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Peran & Sekolah</th>
                    <th className="py-3 px-4">Username & PIN</th>
                    <th className="py-3 px-4">NISN / NIP / Kelas</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        Tidak ada pengguna yang cocok dengan pencarian / filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isStudent = u.role === 'student';
                      const isTeacher = u.role === 'teacher';
                      const isAdmin = ['admin', 'reviewer', 'viewer', 'superadmin'].includes(u.role);

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Nama & Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                  isStudent
                                    ? u.gender === 'female'
                                      ? 'bg-pink-100 text-pink-700'
                                      : 'bg-blue-100 text-blue-700'
                                    : isTeacher
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}
                              >
                                {isStudent ? (u.gender === 'female' ? '👧' : '👦') : isTeacher ? '👩‍🏫' : '🏛️'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 truncate">{u.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{u.id}</div>
                              </div>
                            </div>
                          </td>

                          {/* Peran & Sekolah */}
                          <td className="py-3.5 px-4">
                            <div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide ${
                                  isStudent
                                    ? 'bg-blue-100 text-blue-800'
                                    : isTeacher
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : u.role === 'superadmin'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {u.role === 'superadmin'
                                  ? 'Super Admin'
                                  : isStudent
                                  ? 'Siswa'
                                  : isTeacher
                                  ? 'Guru'
                                  : 'Admin Sekolah'}
                              </span>
                              <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5 max-w-[180px]">
                                {u.school || '-'}
                              </div>
                            </div>
                          </td>

                          {/* Username & PIN */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <div className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                <span className="text-slate-400 text-[10px] mr-1">User:</span>
                                <strong className="text-blue-700">{u.username || u.id}</strong>
                                <span className="text-slate-300 mx-1.5">|</span>
                                <span className="text-slate-400 text-[10px] mr-1">PIN:</span>
                                <strong className="text-emerald-700">{u.password || '123'}</strong>
                              </div>
                              <button
                                onClick={() => handleCopyCredentials(u)}
                                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Salin Akun & Password"
                              >
                                {copiedId === u.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* NISN / NIP */}
                          <td className="py-3.5 px-4 text-slate-600">
                            {isStudent && (
                              <div>
                                <span className="font-bold text-slate-800">NISN: {u.nisn || '-'}</span>
                                <div className="text-[10px] text-slate-500">{u.grade || 'Kelas 5'}</div>
                              </div>
                            )}
                            {isTeacher && (
                              <div>
                                <span className="font-bold text-slate-800">NIP: {u.nip || '-'}</span>
                                <div className="text-[10px] text-slate-500">{u.phone || u.email || 'Guru Pembina'}</div>
                              </div>
                            )}
                            {isAdmin && (
                              <div className="text-[11px] text-slate-500">
                                {u.nip ? `NIP: ${u.nip}` : u.email || 'Administrator'}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Aktif</span>
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleResetPassword(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Reset Kata Sandi"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Akun"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {u.role !== 'superadmin' && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: SUPER ADMIN & PENGAWAS INSTANSI               */}
      {/* ---------------------------------------------------- */}
      {isSuperAdmin && subTab === 'admins' && (
        <div className="space-y-4">
          {/* Header Description & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-indigo-800/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Super Administrator</span>
                <h4 className="text-2xl font-black mt-1">
                  {users.filter((u) => u.role === 'superadmin').length} Akun
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">Akses penuh ke semua sekolah & modul</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Crown className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-blue-800/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">Pengawas / Reviewer</span>
                <h4 className="text-2xl font-black mt-1">
                  {users.filter((u) => u.role === 'reviewer' || u.role === 'viewer').length} Akun
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">Monitoring & evaluasi lintas instansi</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Instansi Terdaftar</span>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  {
                    new Set(
                      users
                        .filter((u) => ['superadmin', 'reviewer', 'viewer'].includes(u.role))
                        .map((u) => u.institution || u.school || 'Instansi')
                    ).size
                  }{' '}
                  Lembaga
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">BI, Dinas Pendidikan, BPMP, dll.</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Building className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, instansi, username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => handleOpenAddUser('superadmin')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun Super Admin / Instansi</span>
            </button>
          </div>

          {/* Admins Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <th className="py-3 px-4">Pengguna & Instansi</th>
                    <th className="py-3 px-4">Peran & Hak Akses</th>
                    <th className="py-3 px-4">Username & Kredensial</th>
                    <th className="py-3 px-4">Kontak / NIP</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users
                    .filter((u) => ['superadmin', 'reviewer', 'viewer'].includes(u.role))
                    .filter((u) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase().trim();
                      return (
                        u.name.toLowerCase().includes(q) ||
                        (u.username && u.username.toLowerCase().includes(q)) ||
                        (u.institution && u.institution.toLowerCase().includes(q)) ||
                        (u.school && u.school.toLowerCase().includes(q)) ||
                        (u.email && u.email.toLowerCase().includes(q)) ||
                        (u.nip && u.nip.toLowerCase().includes(q))
                      );
                    }).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Tidak ada akun Super Admin atau Pengawas yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    users
                      .filter((u) => ['superadmin', 'reviewer', 'viewer'].includes(u.role))
                      .filter((u) => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase().trim();
                        return (
                          u.name.toLowerCase().includes(q) ||
                          (u.username && u.username.toLowerCase().includes(q)) ||
                          (u.institution && u.institution.toLowerCase().includes(q)) ||
                          (u.school && u.school.toLowerCase().includes(q)) ||
                          (u.email && u.email.toLowerCase().includes(q)) ||
                          (u.nip && u.nip.toLowerCase().includes(q))
                        );
                      })
                      .map((u) => {
                        const isPrimary = u.id === activeUser?.id;
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Pengguna & Instansi */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                    u.role === 'superadmin'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {u.avatar || (u.role === 'superadmin' ? '🏛️' : '🔍')}
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {isPrimary && (
                                      <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold">
                                        Akun Anda
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mt-0.5">
                                    <Building className="w-3 h-3 text-slate-400" />
                                    <span>{u.institution || u.school || 'Instansi Terdaftar'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Peran & Hak Akses */}
                            <td className="py-3.5 px-4">
                              {u.role === 'superadmin' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300/60 text-[10px] font-black">
                                  <Crown className="w-3 h-3 text-amber-600" />
                                  <span>Super Admin (Penuh)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-black">
                                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                  <span>Pengawas / Reviewer</span>
                                </span>
                              )}
                            </td>

                            {/* Username & PIN */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-mono font-black text-slate-900 text-xs">
                                    {u.username || '-'}
                                  </div>
                                  <div className="font-mono text-[10px] text-slate-500">
                                    PIN: {u.password || '******'}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCopyCredentials(u)}
                                  className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                  title="Salin Kredensial"
                                >
                                  {copiedId === u.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Kontak / NIP */}
                            <td className="py-3.5 px-4 text-slate-600">
                              <div>
                                {u.nip && <div className="font-bold text-slate-800">NIP: {u.nip}</div>}
                                <div className="text-[11px] text-slate-500">{u.email || u.phone || '-'}</div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Aktif</span>
                              </span>
                            </td>

                            {/* Aksi */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleResetPassword(u)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                  title="Reset Kata Sandi"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Edit Akun"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {u.id !== activeUser?.id && u.username !== 'kepsek' && u.role !== 'superadmin' && (
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Hapus Akun"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Datalist for Institution Quick Suggestions */}
      <datalist id="instansi-suggestions">
        <option value="Bank Indonesia KPw Provinsi Bali" />
        <option value="Dinas Pendidikan Kepemudaan dan Olahraga Kab. Jembrana" />
        <option value="Dinas Pendidikan Kepemudaan dan Olahraga Provinsi Bali" />
        <option value="BPMP Provinsi Bali (Balai Penjaminan Mutu Pendidikan)" />
        <option value="Balai Guru Penggerak Provinsi Bali" />
        <option value="Kantor Wilayah Kementerian Agama Provinsi Bali" />
        <option value="Inspektorat Daerah" />
        <option value="Badan Perencanaan Pembangunan Daerah (Bappeda)" />
      </datalist>

      {/* ---------------------------------------------------- */}
      {/* MODAL: TAMBAH USER BARU                              */}
      {/* ---------------------------------------------------- */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg ${
                    userFormData.role === 'superadmin'
                      ? 'bg-amber-100 text-amber-800'
                      : userFormData.role === 'reviewer'
                      ? 'bg-indigo-100 text-indigo-800'
                      : userFormData.role === 'teacher'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {userFormData.role === 'student'
                    ? '👦'
                    : userFormData.role === 'teacher'
                    ? '👩‍🏫'
                    : userFormData.role === 'superadmin'
                    ? '🏛️'
                    : userFormData.role === 'reviewer'
                    ? '🔍'
                    : '🏫'}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Tambah Akun{' '}
                    {userFormData.role === 'student'
                      ? 'Siswa'
                      : userFormData.role === 'teacher'
                      ? 'Guru Pembina'
                      : userFormData.role === 'superadmin'
                      ? 'Super Administrator'
                      : userFormData.role === 'reviewer'
                      ? 'Pengawas / Reviewer Instansi'
                      : 'Admin Sekolah'}
                  </h3>
                  <p className="text-xs text-slate-500">Kredensial otomatis dibuat unik dan bebas tabrakan data</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddUser} className="space-y-4 pt-4">
              {/* Uniqueness Alert Banner */}
              {!uniquenessStatus.valid && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5 animate-in shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black">Duplikasi Terdeteksi: </span>
                    <span>{uniquenessStatus.message}</span>
                    <div className="text-[11px] font-normal text-rose-700 mt-0.5">
                      Ganti username, NISN, atau NIP, atau tekan tombol "Acak Ulang" di bawah untuk mencegah salah login.
                    </div>
                  </div>
                </div>
              )}

              {/* Role Picker (Super Admin can change role freely) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Peran Pengguna & Hak Akses</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as any;
                      const defaultInstansi =
                        newRole === 'superadmin'
                          ? userFormData.institution || 'Bank Indonesia'
                          : newRole === 'reviewer'
                          ? userFormData.institution || 'Dinas Pendidikan'
                          : '';
                      setUserFormData((prev) => ({
                        ...prev,
                        role: newRole,
                        institution: defaultInstansi || prev.institution,
                        school:
                          newRole === 'superadmin' || newRole === 'reviewer'
                            ? defaultInstansi || prev.institution || 'Instansi'
                            : prev.school || schools[0]?.name || '',
                        username: generateMemorableUsername(newRole, prev.school, prev.name || 'user'),
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  >
                    <option value="student">Siswa (SD Pilot)</option>
                    <option value="teacher">Guru Pembina (Sekolah)</option>
                    <option value="admin">Admin Sekolah</option>
                    <option value="superadmin">Super Administrator (Akses Penuh Seluruh Sistem)</option>
                    <option value="reviewer">Pengawas / Reviewer (Monitoring & Evaluasi Lintas Instansi)</option>
                  </select>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap*</label>
                <input
                  type="text"
                  required
                  placeholder={
                    userFormData.role === 'superadmin'
                      ? 'Contoh: I Gusti Ngurah Dharma, S.E.'
                      : userFormData.role === 'reviewer'
                      ? 'Contoh: Drs. I Wayan Suta, M.Pd.'
                      : 'Contoh: Ni Made Dwi Anggraeni'
                  }
                  value={userFormData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setUserFormData((prev) => ({
                      ...prev,
                      name: newName,
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Instansi Input for Super Admin & Reviewer */}
              {userFormData.role === 'superadmin' || userFormData.role === 'reviewer' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instansi / Lembaga Asal* (Ketik Bebas atau Pilih)
                  </label>
                  <input
                    type="text"
                    required
                    list="instansi-suggestions"
                    placeholder="Contoh: Bank Indonesia, Dinas Pendidikan, BPMP, Kemenag..."
                    value={userFormData.institution || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUserFormData((prev) => ({
                        ...prev,
                        institution: val,
                        school: val,
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-amber-50/30"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Anda dapat mengetik instansi apa saja secara bebas (contoh: Bank Indonesia, Dinas Pendidikan Kab. Jembrana, BPMP, dll.)
                  </p>
                </div>
              ) : (
                /* Sekolah Dropdown for Student/Teacher/School Admin */
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sekolah*</label>
                  {isSuperAdmin ? (
                    <select
                      value={userFormData.school}
                      onChange={(e) => {
                        const schName = e.target.value;
                        const matched = schools.find((s) => s.name === schName);
                        setUserFormData((prev) => ({
                          ...prev,
                          school: schName,
                          schoolId: matched?.id || '',
                          username: generateMemorableUsername(prev.role, schName, prev.name || 'user'),
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      {schools.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={userFormData.school}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600"
                    />
                  )}
                </div>
              )}

              {/* NISN / NIP & Gender / Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {userFormData.role === 'student' ? 'NISN (Unik)' : 'NIP / ID Pegawai (Unik)'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      userFormData.role === 'student'
                        ? '0094821031'
                        : userFormData.role === 'superadmin' || userFormData.role === 'reviewer'
                        ? '197805142003121002'
                        : '198504122010012015'
                    }
                    value={userFormData.role === 'student' ? userFormData.nisn : userFormData.nip}
                    onChange={(e) =>
                      setUserFormData((prev) =>
                        userFormData.role === 'student'
                          ? { ...prev, nisn: e.target.value }
                          : { ...prev, nip: e.target.value }
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={userFormData.gender}
                    onChange={(e) => setUserFormData((prev) => ({ ...prev, gender: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Email / Telepon untuk Admin & Pengawas */}
              {(userFormData.role === 'superadmin' || userFormData.role === 'reviewer') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi</label>
                    <input
                      type="email"
                      placeholder="admin@bi.go.id / disdik@jembrana.go.id"
                      value={userFormData.email || ''}
                      onChange={(e) => setUserFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                    <input
                      type="tel"
                      placeholder="081234567890"
                      value={userFormData.phone || ''}
                      onChange={(e) => setUserFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Generated Credentials Card with Re-generate & Collision Protection */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kredensial Akun (Otomatis & Terverifikasi Unik)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateUserCredentials}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Acak Ulang</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Username Unik</label>
                    <input
                      type="text"
                      required
                      value={userFormData.username}
                      onChange={(e) => setUserFormData((prev) => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-blue-700 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Kata Sandi / PIN</label>
                    <input
                      type="text"
                      required
                      value={userFormData.password}
                      onChange={(e) => setUserFormData((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {uniquenessStatus.valid && userFormData.username && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Username & kredensial unik, aman dan siap disimpan.</span>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!uniquenessStatus.valid}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-lg transition-all cursor-pointer ${
                    uniquenessStatus.valid
                      ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25'
                      : 'bg-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EDIT USER                                     */}
      {/* ---------------------------------------------------- */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Edit Akun Pengguna</h3>
              <button
                onClick={() => {
                  setIsEditUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 pt-4">
              {/* Uniqueness Alert Banner */}
              {!uniquenessStatus.valid && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black">Duplikasi Terdeteksi: </span>
                    <span>{uniquenessStatus.message}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap*</label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Instansi or Sekolah for Edit */}
              {userFormData.role === 'superadmin' || userFormData.role === 'reviewer' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instansi / Lembaga Asal* (Ketik Bebas atau Pilih)
                  </label>
                  <input
                    type="text"
                    required
                    list="instansi-suggestions"
                    value={userFormData.institution || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUserFormData((prev) => ({
                        ...prev,
                        institution: val,
                        school: val,
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-amber-50/30"
                  />
                </div>
              ) : (
                isSuperAdmin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sekolah</label>
                    <select
                      value={userFormData.school}
                      onChange={(e) => {
                        const sch = e.target.value;
                        const matched = schools.find((s) => s.name === sch);
                        setUserFormData((prev) => ({ ...prev, school: sch, schoolId: matched?.id || '' }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                    >
                      {schools.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={userFormData.username}
                    onChange={(e) => setUserFormData((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs font-bold text-blue-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi / PIN</label>
                  <input
                    type="text"
                    required
                    value={userFormData.password}
                    onChange={(e) => setUserFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {userFormData.role === 'student' ? 'NISN' : 'NIP'}
                  </label>
                  <input
                    type="text"
                    value={userFormData.role === 'student' ? userFormData.nisn : userFormData.nip}
                    onChange={(e) =>
                      setUserFormData((prev) =>
                        userFormData.role === 'student'
                          ? { ...prev, nisn: e.target.value }
                          : { ...prev, nip: e.target.value }
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={userFormData.gender}
                    onChange={(e) => setUserFormData((prev) => ({ ...prev, gender: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditUserModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!uniquenessStatus.valid}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-lg transition-all cursor-pointer ${
                    uniquenessStatus.valid
                      ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25'
                      : 'bg-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: TAMBAH SEKOLAH BARU (SUPER ADMIN ONLY)        */}
      {/* ---------------------------------------------------- */}
      {isAddSchoolModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  🏫
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Tambah Sekolah & Akun Admin</h3>
                  <p className="text-xs text-slate-500">Daftarkan sekolah mitra baru dan akun pimpinan sekolah</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddSchoolModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddSchool} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sekolah*</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SD Negeri 3 Melaya"
                  value={schoolFormData.name}
                  onChange={(e) => {
                    const n = e.target.value;
                    setSchoolFormData((prev) => ({
                      ...prev,
                      name: n,
                      adminUsername: generateMemorableUsername('admin', n, prev.principalName || 'admin'),
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NPSN</label>
                  <input
                    type="text"
                    placeholder="Contoh: 50101234"
                    value={schoolFormData.npsn}
                    onChange={(e) => setSchoolFormData((prev) => ({ ...prev, npsn: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Sekolah</label>
                  <input
                    type="text"
                    placeholder="SCH-05"
                    value={schoolFormData.code}
                    onChange={(e) => setSchoolFormData((prev) => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Sekolah / Admin</label>
                <input
                  type="text"
                  placeholder="Contoh: I Wayan Sudarta, S.Pd., M.Pd."
                  value={schoolFormData.principalName}
                  onChange={(e) => {
                    const p = e.target.value;
                    setSchoolFormData((prev) => ({
                      ...prev,
                      principalName: p,
                      adminName: p,
                      adminUsername: generateMemorableUsername('admin', prev.name, p),
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Sekolah</label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Ngurah Rai No. 10, Melaya, Jembrana"
                  value={schoolFormData.address}
                  onChange={(e) => setSchoolFormData((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Generated Admin Account Card */}
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Akun Login Admin Sekolah</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateSchoolAdminCredentials}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Acak Ulang</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-600 mb-1">Username Admin</label>
                    <input
                      type="text"
                      required
                      value={schoolFormData.adminUsername}
                      onChange={(e) => setSchoolFormData((prev) => ({ ...prev, adminUsername: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white font-mono text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-600 mb-1">Kata Sandi / PIN</label>
                    <input
                      type="text"
                      required
                      value={schoolFormData.adminPassword}
                      onChange={(e) => setSchoolFormData((prev) => ({ ...prev, adminPassword: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white font-mono text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSchoolModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  Simpan Sekolah & Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EDIT SEKOLAH                                  */}
      {/* ---------------------------------------------------- */}
      {isEditSchoolModalOpen && editingSchool && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Edit Data Sekolah & Akun Admin</h3>
              <button
                onClick={() => {
                  setIsEditSchoolModalOpen(false);
                  setEditingSchool(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSchool} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sekolah*</label>
                <input
                  type="text"
                  required
                  value={schoolFormData.name}
                  onChange={(e) => setSchoolFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NPSN</label>
                  <input
                    type="text"
                    value={schoolFormData.npsn}
                    onChange={(e) => setSchoolFormData((prev) => ({ ...prev, npsn: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Sekolah</label>
                  <input
                    type="text"
                    value={schoolFormData.code}
                    onChange={(e) => setSchoolFormData((prev) => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Sekolah / Admin</label>
                <input
                  type="text"
                  value={schoolFormData.principalName}
                  onChange={(e) => setSchoolFormData((prev) => ({ ...prev, principalName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Sekolah</label>
                <input
                  type="text"
                  value={schoolFormData.address}
                  onChange={(e) => setSchoolFormData((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-3">
                <span className="text-xs font-black text-indigo-900 block">Kredensial Admin Sekolah</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-600 mb-1">Username</label>
                    <input
                      type="text"
                      value={schoolFormData.adminUsername}
                      onChange={(e) => setSchoolFormData((prev) => ({ ...prev, adminUsername: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white font-mono text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-600 mb-1">
                      Kata Sandi Baru (Kosongkan jika tidak ubah)
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan sandi baru..."
                      value={schoolFormData.adminPassword}
                      onChange={(e) => setSchoolFormData((prev) => ({ ...prev, adminPassword: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white font-mono text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditSchoolModalOpen(false);
                    setEditingSchool(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: UPLOAD DATA EXCEL                             */}
      {/* ---------------------------------------------------- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Upload Data Excel</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Type selector if Super Admin */}
            {isSuperAdmin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Data yang Diupload:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadType('schools')}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      uploadType === 'schools'
                        ? 'bg-blue-50 border-blue-500 text-blue-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏢 Data Sekolah & Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('users')}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      uploadType === 'users'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    👥 Data Guru & Siswa
                  </button>
                </div>
              </div>
            )}

            {/* Download Template Reminder */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <span className="font-bold text-slate-800 block">Belum punya template Excel?</span>
              <div className="flex flex-wrap gap-2">
                {uploadType === 'schools' ? (
                  <button
                    onClick={handleDownloadSchoolTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-700 font-bold rounded-lg border border-blue-200 text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Template Sekolah (.xlsx)</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleDownloadUserTemplate('student')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Template Siswa (.xlsx)</span>
                    </button>
                    <button
                      onClick={() => handleDownloadUserTemplate('teacher')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Template Guru (.xlsx)</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-sky-300 hover:border-blue-500 bg-sky-50/50 hover:bg-sky-50 rounded-2xl p-6 text-center space-y-3 transition-colors cursor-pointer relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
                📁
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isUploading ? 'Sedang memproses file...' : 'Klik atau Tarik File Excel (.xlsx) ke Sini'}
                </span>
                <span className="text-[11px] text-slate-500">
                  Sistem otomatis men-generate Username & Kata Sandi yang mudah diingat
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
