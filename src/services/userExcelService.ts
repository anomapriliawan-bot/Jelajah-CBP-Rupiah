import * as XLSX from 'xlsx';
import { User, School } from '../types';
import { generateMemorableUsername, generateMemorablePassword } from './db';

/**
 * Generate Excel Template for Super Admin to bulk import Schools & Admin Sekolah accounts.
 */
export function generateSchoolsTemplateExcel(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const sampleSchoolsData = [
    {
      'Nama Sekolah*': 'SD Negeri 2 Medewi',
      'NPSN': '50101234',
      'Kode Sekolah': 'SCH-01',
      'Nama Kepala Sekolah / Admin': 'I Ketut Sudarsana, S.Pd., M.Pd.',
      'Alamat Sekolah': 'Kec. Pekutatan, Kab. Jembrana, Bali',
      'No Telepon / WA': '081234567890',
      'Email Sekolah': 'sdn2medewi@sekolah.id',
      'Username Admin (Kosongkan utk Auto-Generate)': 'adm.sdn2medewi.01',
      'Password Admin (Kosongkan utk Auto-Generate)': 'Rupiah2026',
    },
    {
      'Nama Sekolah*': 'SD Negeri 1 Negara',
      'NPSN': '50105678',
      'Kode Sekolah': 'SCH-02',
      'Nama Kepala Sekolah / Admin': 'Drs. I Wayan Sudarta, M.Pd.',
      'Alamat Sekolah': 'Jl. Ngurah Rai No. 12, Negara, Jembrana',
      'No Telepon / WA': '081298765432',
      'Email Sekolah': 'sdn1negara@sekolah.id',
      'Username Admin (Kosongkan utk Auto-Generate)': '',
      'Password Admin (Kosongkan utk Auto-Generate)': '',
    },
    {
      'Nama Sekolah*': 'SD Negeri 4 Dauhwaru',
      'NPSN': '50109012',
      'Kode Sekolah': 'SCH-03',
      'Nama Kepala Sekolah / Admin': 'Ni Luh Putu Ariani, S.Pd.',
      'Alamat Sekolah': 'Jl. Pahlawan No. 45, Dauhwaru, Jembrana',
      'No Telepon / WA': '081377889900',
      'Email Sekolah': 'sdn4dauhwaru@sekolah.id',
      'Username Admin (Kosongkan utk Auto-Generate)': '',
      'Password Admin (Kosongkan utk Auto-Generate)': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleSchoolsData);

  // Column width configuration
  ws['!cols'] = [
    { wch: 28 }, // Nama Sekolah
    { wch: 14 }, // NPSN
    { wch: 14 }, // Kode Sekolah
    { wch: 32 }, // Nama Kepsek / Admin
    { wch: 38 }, // Alamat
    { wch: 18 }, // Telepon
    { wch: 26 }, // Email
    { wch: 36 }, // Username
    { wch: 36 }, // Password
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Sekolah');

  const instructionsData = [
    { 'Petunjuk Pengisian Template Data Sekolah': '1. Kolom dengan tanda bintang (*) wajib diisi.' },
    { 'Petunjuk Pengisian Template Data Sekolah': '2. Jika Username dan Password dikosongkan, sistem akan otomatis membuat Username unik dan Kata Sandi ceria Jelajah Rupiah.' },
    { 'Petunjuk Pengisian Template Data Sekolah': '3. Akun Admin Sekolah yang dibuat dapat langsung login menggunakan Username / Email dan Password yang telah dibuat.' },
    { 'Petunjuk Pengisian Template Data Sekolah': '4. Super Admin dapat mengedit data sekolah dan akun kapan saja melalui menu Kelola User & Sekolah.' },
  ];
  const wsInst = XLSX.utils.json_to_sheet(instructionsData);
  wsInst['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Petunjuk');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}

/**
 * Generate Excel Template for Admin Sekolah (or Super Admin) to bulk import Teachers and Students.
 */
export function generateUsersTemplateExcel(targetRole: 'student' | 'teacher' | 'all' = 'all'): Uint8Array {
  const wb = XLSX.utils.book_new();

  let sampleData: any[] = [];

  if (targetRole === 'student') {
    sampleData = [
      {
        'Nama Lengkap*': 'Budi Santoso',
        'Peran (Siswa/Guru/Admin)': 'Siswa',
        'Nama Sekolah (Opsional)': 'SD Negeri 2 Medewi',
        'NISN (Siswa)': '0094821031',
        'NIP (Guru)': '',
        'Jenis Kelamin (Laki-laki / Perempuan)': 'Laki-laki',
        'Kelas': 'Kelas 5A',
        'No Telepon / WA': '08123456789',
        'Email': 'budi.santoso@siswa.id',
        'Username (Kosongkan utk Auto-Generate)': 'std.budi.208',
        'Password (Kosongkan utk Auto-Generate)': 'Cinta88',
      },
      {
        'Nama Lengkap*': 'Siti Nurhaliza',
        'Peran (Siswa/Guru/Admin)': 'Siswa',
        'Nama Sekolah (Opsional)': 'SD Negeri 2 Medewi',
        'NISN (Siswa)': '0094821032',
        'NIP (Guru)': '',
        'Jenis Kelamin (Laki-laki / Perempuan)': 'Perempuan',
        'Kelas': 'Kelas 5A',
        'No Telepon / WA': '08123456790',
        'Email': 'siti.nurhaliza@siswa.id',
        'Username (Kosongkan utk Auto-Generate)': '',
        'Password (Kosongkan utk Auto-Generate)': '',
      },
    ];
  } else if (targetRole === 'teacher') {
    sampleData = [
      {
        'Nama Lengkap*': 'Ibu Dewi Anggraeni, S.Pd.',
        'Peran (Siswa/Guru/Admin)': 'Guru',
        'Nama Sekolah (Opsional)': 'SD Negeri 2 Medewi',
        'NISN (Siswa)': '',
        'NIP (Guru)': '198504122010012015',
        'Jenis Kelamin (Laki-laki / Perempuan)': 'Perempuan',
        'Kelas': 'Kelas 5A',
        'No Telepon / WA': '081234567891',
        'Email': 'dewi.anggraeni@guru.id',
        'Username (Kosongkan utk Auto-Generate)': 'guru.dewi.14',
        'Password (Kosongkan utk Auto-Generate)': 'Bangga123',
      },
    ];
  } else {
    sampleData = [
      {
        'Nama Lengkap*': 'Ibu Dewi Anggraeni, S.Pd.',
        'Peran (Siswa/Guru/Admin)': 'Guru',
        'Nama Sekolah (Opsional)': 'SD Negeri 2 Medewi',
        'NISN (Siswa)': '',
        'NIP (Guru)': '198504122010012015',
        'Jenis Kelamin (Laki-laki / Perempuan)': 'Perempuan',
        'Kelas': 'Kelas 5A',
        'No Telepon / WA': '081234567891',
        'Email': 'dewi.anggraeni@guru.id',
        'Username (Kosongkan utk Auto-Generate)': '',
        'Password (Kosongkan utk Auto-Generate)': '',
      },
      {
        'Nama Lengkap*': 'Budi Santoso',
        'Peran (Siswa/Guru/Admin)': 'Siswa',
        'Nama Sekolah (Opsional)': 'SD Negeri 2 Medewi',
        'NISN (Siswa)': '0094821031',
        'NIP (Guru)': '',
        'Jenis Kelamin (Laki-laki / Perempuan)': 'Laki-laki',
        'Kelas': 'Kelas 5A',
        'No Telepon / WA': '08123456789',
        'Email': 'budi.santoso@siswa.id',
        'Username (Kosongkan utk Auto-Generate)': '',
        'Password (Kosongkan utk Auto-Generate)': '',
      },
      {
        'Nama Lengkap*': 'Siti Nurhaliza',
        'Peran (Siswa/Guru/Admin)': 'Siswa',
        'Nama Sekolah (Opsional)': 'SD Negeri 2 Medewi',
        'NISN (Siswa)': '0094821032',
        'NIP (Guru)': '',
        'Jenis Kelamin (Laki-laki / Perempuan)': 'Perempuan',
        'Kelas': 'Kelas 5A',
        'No Telepon / WA': '08123456790',
        'Email': 'siti.nurhaliza@siswa.id',
        'Username (Kosongkan utk Auto-Generate)': '',
        'Password (Kosongkan utk Auto-Generate)': '',
      },
    ];
  }

  const ws = XLSX.utils.json_to_sheet(sampleData);

  ws['!cols'] = [
    { wch: 30 }, // Nama Lengkap
    { wch: 20 }, // Peran
    { wch: 28 }, // Nama Sekolah
    { wch: 16 }, // NISN
    { wch: 22 }, // NIP
    { wch: 22 }, // Jenis Kelamin
    { wch: 14 }, // Kelas
    { wch: 18 }, // Telepon
    { wch: 26 }, // Email
    { wch: 34 }, // Username
    { wch: 34 }, // Password
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Pengguna');

  const instructionsData = [
    { 'Petunjuk Pengisian Akun Pengguna': '1. Kolom "Nama Lengkap*" wajib diisi.' },
    { 'Petunjuk Pengisian Akun Pengguna': '2. Peran dapat diisi: Siswa, Guru, atau Admin.' },
    { 'Petunjuk Pengisian Akun Pengguna': '3. Username & Password: jika dikosongkan, sistem akan membuatkan kode unik yang mudah diingat (contoh: guru.dewi.14 / std.budi.208 dan PIN Rupiah2026).' },
    { 'Petunjuk Pengisian Akun Pengguna': '4. Data dapat langsung dicetak atau diexport ke Excel untuk dibagikan kepada siswa dan guru.' },
  ];
  const wsInst = XLSX.utils.json_to_sheet(instructionsData);
  wsInst['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Petunjuk');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}

/**
 * Parse Excel file containing school rows.
 */
export function parseSchoolsExcel(fileBuffer: ArrayBuffer): any[] {
  const wb = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = wb.SheetNames.find((s) => !s.toLowerCase().includes('petunjuk')) || wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(ws);

  return rawRows.map((r) => {
    // Find matching keys regardless of slight variations in header name
    const getVal = (patterns: string[]) => {
      for (const p of patterns) {
        const key = Object.keys(r).find((k) => k.toLowerCase().includes(p.toLowerCase()));
        if (key && r[key] !== undefined && r[key] !== null) return String(r[key]).trim();
      }
      return '';
    };

    return {
      name: getVal(['nama sekolah', 'sekolah', 'school']),
      npsn: getVal(['npsn']),
      code: getVal(['kode sekolah', 'kode', 'code']),
      principalName: getVal(['nama kepala sekolah', 'kepala sekolah', 'kepsek', 'admin']),
      address: getVal(['alamat']),
      phone: getVal(['telepon', 'wa', 'hp', 'phone']),
      email: getVal(['email']),
      adminUsername: getVal(['username']),
      adminPassword: getVal(['password', 'sandi']),
    };
  }).filter((s) => Boolean(s.name));
}

/**
 * Parse Excel file containing user rows (teachers, students, admins).
 */
export function parseUsersExcel(fileBuffer: ArrayBuffer): any[] {
  const wb = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = wb.SheetNames.find((s) => !s.toLowerCase().includes('petunjuk')) || wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(ws);

  return rawRows.map((r) => {
    const getVal = (patterns: string[]) => {
      for (const p of patterns) {
        const key = Object.keys(r).find((k) => k.toLowerCase().includes(p.toLowerCase()));
        if (key && r[key] !== undefined && r[key] !== null) return String(r[key]).trim();
      }
      return '';
    };

    let role = getVal(['peran', 'role', 'jabatan', 'tipe']).toLowerCase();
    if (role.includes('guru') || role.includes('teacher') || role.includes('pendidik')) {
      role = 'teacher';
    } else if (role.includes('admin') || role.includes('kepsek') || role.includes('kepala')) {
      role = 'admin';
    } else {
      role = 'student';
    }

    return {
      name: getVal(['nama lengkap', 'nama', 'name']),
      role,
      school: getVal(['nama sekolah', 'sekolah', 'school']),
      nisn: getVal(['nisn']),
      nip: getVal(['nip']),
      gender: getVal(['jenis kelamin', 'gender', 'jk', 'kelamin']),
      className: getVal(['kelas', 'class', 'rombel']),
      phone: getVal(['telepon', 'wa', 'hp', 'phone']),
      email: getVal(['email']),
      username: getVal(['username', 'user']),
      password: getVal(['password', 'sandi', 'pin']),
    };
  }).filter((u) => Boolean(u.name));
}

/**
 * Export a list of users to Excel with credentials and school info.
 */
export function exportUsersToExcel(users: User[], title: string = 'Data_Akun_Pengguna_Jelajah_Rupiah'): Uint8Array {
  const wb = XLSX.utils.book_new();

  const formattedRows = users.map((u, idx) => ({
    'No': idx + 1,
    'ID Pengguna': u.id,
    'Nama Lengkap': u.name,
    'Peran': u.role === 'superadmin' ? 'Super Admin' : u.role === 'admin' ? 'Admin Sekolah' : u.role === 'teacher' ? 'Guru' : 'Siswa',
    'Sekolah': u.school || '-',
    'Username': u.username || '-',
    'Kata Sandi / PIN': u.password || '-',
    'NISN': u.nisn || '-',
    'NIP': u.nip || '-',
    'Kelas': u.grade || '-',
    'Jenis Kelamin': u.gender === 'female' ? 'Perempuan' : 'Laki-laki',
    'Email': u.email || '-',
    'No Telepon': u.phone || '-',
    'Status': u.isActive ? 'Aktif' : 'Non-aktif',
    'Tanggal Terdaftar': u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-',
  }));

  const ws = XLSX.utils.json_to_sheet(formattedRows);

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 16 }, // ID
    { wch: 28 }, // Nama
    { wch: 16 }, // Peran
    { wch: 26 }, // Sekolah
    { wch: 24 }, // Username
    { wch: 20 }, // Password
    { wch: 16 }, // NISN
    { wch: 20 }, // NIP
    { wch: 14 }, // Kelas
    { wch: 16 }, // JK
    { wch: 24 }, // Email
    { wch: 16 }, // Telp
    { wch: 12 }, // Status
    { wch: 18 }, // Tanggal
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Daftar Akun');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}
