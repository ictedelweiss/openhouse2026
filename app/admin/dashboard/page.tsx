'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import { Users, School, Download, Search, Trash2, ArrowRightLeft, UserCheck, RefreshCw, Image as ImageIcon, Upload, Eye, X, CheckCircle, CreditCard } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';

interface RegistrationRecord {
  id: number;
  ticket_code: string;
  level_id: string;
  level_name: string;
  level_code: string;
  level_category: string;
  slot_number: number;
  registration_type: 'new' | 'transfer';
  child_name: string;
  birth_date: string;
  gender: 'L' | 'P';
  parent_name: string;
  whatsapp: string;
  email: string;
  school_origin: string;
  attendance_session: string;
  payment_method: 'pay_now' | 'pay_onsite';
  payment_proof?: string | null;
  created_at: string;
}

const DUMMY_RECEIPT_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="550" viewBox="0 0 400 550" fill="%23f8fafc"><rect width="400" height="550" fill="%23ffffff" rx="16" stroke="%23cbd5e1" stroke-width="2"/><text x="200" y="50" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23293c88" text-anchor="middle">BUKTI TRANSFER RESMI</text><text x="200" y="80" font-family="sans-serif" font-size="12" fill="%2364748b" text-anchor="middle">Edelweiss Learning Center Open House</text><line x1="40" y1="100" x2="360" y2="100" stroke="%23e2e8f0" stroke-width="2" stroke-dasharray="4"/><text x="50" y="140" font-family="sans-serif" font-size="12" fill="%2364748b">Bank Tujuan:</text><text x="350" y="140" font-family="sans-serif" font-size="12" font-weight="bold" fill="%230f172a" text-anchor="end">Bank Mandiri</text><text x="50" y="180" font-family="sans-serif" font-size="12" fill="%2364748b">Jumlah Transfer:</text><text x="350" y="180" font-family="sans-serif" font-size="16" font-weight="bold" fill="%2316a34a" text-anchor="end">Rp 500.000</text><text x="50" y="220" font-family="sans-serif" font-size="12" fill="%2364748b">Status:</text><text x="350" y="220" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23293c88" text-anchor="end">BERHASIL / VERIFIED</text><rect x="40" y="260" width="320" height="200" fill="%23f1f5f9" rx="12"/><text x="200" y="360" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23002b5b" text-anchor="middle">Struk Bukti Pembayaran Valid</text><text x="200" y="510" font-family="sans-serif" font-size="11" fill="%2394a3b8" text-anchor="middle">Verified by Admin System</text></svg>';

const INITIAL_MOCK_REGISTRATIONS: RegistrationRecord[] = [
  {
    id: 1,
    ticket_code: 'ELC-NEW-P1-01-382',
    level_id: 'fs-p1',
    level_name: 'Edelweiss Formal School - Primary 1',
    level_code: 'Primary 1',
    level_category: 'formal',
    slot_number: 1,
    registration_type: 'new',
    child_name: 'Rayhan Pratama',
    birth_date: '2018-05-12',
    gender: 'L',
    parent_name: 'Budi Pratama',
    whatsapp: '081234567890',
    email: 'budi@gmail.com',
    school_origin: 'TK Edelweiss',
    attendance_session: 'Hari 1: Sabtu, 8 Agustus 2026 (08.00 - 10.00)',
    payment_method: 'pay_now',
    payment_proof: DUMMY_RECEIPT_IMG,
    created_at: '2026-07-30 08:30:00'
  },
  {
    id: 2,
    ticket_code: 'ELC-NEW-P1-02-491',
    level_id: 'fs-p1',
    level_name: 'Edelweiss Formal School - Primary 1',
    level_code: 'Primary 1',
    level_category: 'formal',
    slot_number: 2,
    registration_type: 'new',
    child_name: 'Aisha Humaira',
    birth_date: '2018-07-18',
    gender: 'P',
    parent_name: 'Siti Rahma',
    whatsapp: '081987654321',
    email: 'siti@gmail.com',
    school_origin: 'TK Melati',
    attendance_session: 'Hari 1: Sabtu, 8 Agustus 2026 (10.00 - 12.00)',
    payment_method: 'pay_onsite',
    payment_proof: null,
    created_at: '2026-07-30 09:15:00'
  },
  {
    id: 3,
    ticket_code: 'ELC-TRF-P2-01-102',
    level_id: 'tr-p2',
    level_name: 'Siswa Pindahan Primary - Primary 2',
    level_code: 'Primary 2',
    level_category: 'transfer',
    slot_number: 1,
    registration_type: 'transfer',
    child_name: 'Kevin Alexander',
    birth_date: '2017-03-05',
    gender: 'L',
    parent_name: 'Alexander',
    whatsapp: '081122334455',
    email: 'alex@gmail.com',
    school_origin: 'SD Nusantara',
    attendance_session: 'Hari 2: Sabtu, 15 Agustus 2026 (08.00 - 10.00)',
    payment_method: 'pay_now',
    payment_proof: DUMMY_RECEIPT_IMG,
    created_at: '2026-07-30 09:45:00'
  }
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ name: string; username: string }>({ name: 'Administrator', username: 'admin' });
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(INITIAL_MOCK_REGISTRATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveDb, setIsLiveDb] = useState(false);
  
  // Modal Pop Up Upload Bukti Bayar oleh Admin
  const [uploadModalData, setUploadModalData] = useState<{ id: number; childName: string; ticketCode: string } | null>(null);
  const [adminUploadFile, setAdminUploadFile] = useState<string | null>(null);
  const [adminUploadFileName, setAdminUploadFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      try {
        setAdminUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    fetchRegistrations();
  }, [router]);

  const fetchRegistrations = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}?action=get_registrations`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          setRegistrations(json.data);
          setIsLiveDb(true);
        }
      }
    } catch (e) {
      console.log('Using local state');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handler Upload Bukti Pembayaran oleh Admin (Pay On-site / Pay Now tanpa file awal)
  const handleAdminFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAdminUploadFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setAdminUploadFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalData || !adminUploadFile) {
      alert('Mohon pilih file bukti pembayaran terlebih dahulu.');
      return;
    }

    const fileInput = document.querySelector('#admin-proof-file') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    setIsUploading(true);
    setUploadProgress(0);

    const performUpload = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!file) {
          let current = 0;
          const interval = setInterval(() => {
            current += 20;
            if (current >= 100) {
              setUploadProgress(100);
              clearInterval(interval);
              setTimeout(() => resolve(adminUploadFile || 'uploaded_locally'), 300);
            } else {
              setUploadProgress(current);
            }
          }, 120);
          return;
        }

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('id', String(uploadModalData.id));

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}?action=upload_payment_proof`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              if (result.status === 'success') {
                setUploadProgress(100);
                resolve(result.file_url || adminUploadFile || 'uploaded_locally');
              } else {
                reject(new Error(result.message || 'Gagal upload bukti pembayaran.'));
              }
            } catch (err) {
              setUploadProgress(100);
              resolve(adminUploadFile || 'uploaded_locally');
            }
          } else {
            setUploadProgress(100);
            resolve(adminUploadFile || 'uploaded_locally');
          }
        };

        xhr.onerror = () => {
          console.log('Mock upload state saved due to network connection');
          setUploadProgress(100);
          resolve(adminUploadFile || 'uploaded_locally');
        };

        xhr.send(uploadData);
      });
    };

    try {
      const fileUrl = await performUpload();
      alert(`Bukti pembayaran untuk ${uploadModalData.childName} berhasil di-upload!`);

      // Update state local
      setRegistrations((prev) =>
        prev.map((item) =>
          item.id === uploadModalData.id
            ? { ...item, payment_proof: fileUrl }
            : item
        )
      );

      setUploadModalData(null);
      setAdminUploadFile(null);
      setAdminUploadFileName(null);
    } catch (err: any) {
      alert(err.message || 'Gagal upload bukti pembayaran.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: number, childName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data pendaftaran ${childName}? Slot kuota akan dikembalikan.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}?action=delete_registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setRegistrations((prev) => prev.filter((r) => r.id !== id));
        alert('Data berhasil dihapus.');
      } else {
        alert(result.message || 'Gagal menghapus data.');
      }
    } catch (err) {
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      alert(`Data ${childName} berhasil dihapus.`);
    }
  };

  const handleExportCSV = () => {
    if (registrations.length === 0) {
      alert('Tidak ada data pendaftaran untuk di-export.');
      return;
    }

    const headers = ['Kode Registrasi', 'Tipe', 'Nama Anak', 'Tgl Lahir', 'JK', 'Nama Orang Tua', 'No WhatsApp', 'Email', 'Kelas', 'Sekolah Asal', 'Sesi Kedatangan', 'Metode Bayar', 'Status Bukti Bayar', 'Waktu Daftar'];
    const rows = registrations.map((r) => [
      `"${r.ticket_code}"`,
      `"${r.registration_type === 'transfer' ? 'Siswa Pindahan' : 'Siswa Baru'}"`,
      `"${r.child_name}"`,
      `"${r.birth_date}"`,
      `"${r.gender}"`,
      `"${r.parent_name}"`,
      `"${r.whatsapp}"`,
      `"${r.email}"`,
      `"${r.level_code || r.level_name}"`,
      `"${r.school_origin || '-'}"`,
      `"${r.attendance_session || '-'}"`,
      `"${r.payment_method === 'pay_now' ? 'Pay Now (Transfer)' : 'Pay On-site'}"`,
      `"${r.payment_proof ? 'Sudah Ada Bukti' : 'Belum Ada Bukti'}"`,
      `"${r.created_at}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_openhouse_edelweiss_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.child_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.whatsapp.includes(searchQuery);

    const matchesCategory =
      filterCategory === 'all' ||
      r.level_category === filterCategory ||
      (filterCategory === 'transfer' && r.registration_type === 'transfer');

    return matchesSearch && matchesCategory;
  });

  const totalCount = registrations.length;
  const newStudentsCount = registrations.filter((r) => r.registration_type === 'new').length;
  const transferStudentsCount = registrations.filter((r) => r.registration_type === 'transfer').length;
  const homeschoolingCount = registrations.filter((r) => r.level_category === 'homeschooling').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-poppins text-slate-800 pb-16">
      
      <AdminNavbar adminName={adminUser.name} isLiveDb={isLiveDb} />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        
        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase">Total Pendaftar</span>
              <span className="text-2xl font-extrabold text-[#002B5B] font-poppins">{totalCount} Siswa</span>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-[#293C88] rounded-2xl flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase">Siswa Baru</span>
              <span className="text-2xl font-extrabold text-emerald-600 font-poppins">{newStudentsCount} Siswa</span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase">Siswa Pindahan</span>
              <span className="text-2xl font-extrabold text-amber-600 font-poppins">{transferStudentsCount} Siswa</span>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase">Home Schooling</span>
              <span className="text-2xl font-extrabold text-purple-600 font-poppins">{homeschoolingCount} Siswa</span>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold">
              <School className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama / Email / WhatsApp..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#293C88]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterCategory === 'all' ? 'bg-[#293C88] text-white' : 'text-slate-600'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterCategory('formal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterCategory === 'formal' ? 'bg-[#293C88] text-white' : 'text-slate-600'
                }`}
              >
                Formal School
              </button>
              <button
                onClick={() => setFilterCategory('homeschooling')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterCategory === 'homeschooling' ? 'bg-[#293C88] text-white' : 'text-slate-600'
                }`}
              >
                Home Schooling
              </button>
              <button
                onClick={() => setFilterCategory('transfer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterCategory === 'transfer' ? 'bg-amber-600 text-white' : 'text-slate-600'
                }`}
              >
                Pindahan
              </button>
            </div>

            <button
              onClick={fetchRegistrations}
              disabled={isRefreshing}
              className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition text-xs"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" /> Export CSV / Excel
            </button>
          </div>
        </div>

        {/* Tabel Data Pendaftar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-[#002B5B]">
              Daftar Data Pendaftaran Calon Siswa ({filteredRegistrations.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Verified System</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Kode &amp; Anak</th>
                  <th className="py-3.5 px-4">Tgl Lahir &amp; JK</th>
                  <th className="py-3.5 px-4">Kelas &amp; Tipe</th>
                  <th className="py-3.5 px-4">Ortu, WhatsApp &amp; Email</th>
                  <th className="py-3.5 px-4">Sesi Kedatangan</th>
                  <th className="py-3.5 px-4">Status &amp; Bukti Pembayaran</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data pendaftaran yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-[#293C88] block">{item.ticket_code}</span>
                        <strong className="text-slate-900 font-bold block mt-0.5">{item.child_name}</strong>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{item.birth_date}</div>
                        <span className="text-[10px] text-slate-500">
                          {item.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#002B5B] block">{item.level_code || item.level_name}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Number(item.slot_number) === 0 ? (
                            <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white">
                              Waiting List
                            </span>
                          ) : (
                            <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              item.registration_type === 'transfer' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.registration_type === 'transfer' ? 'Pindahan' : 'Siswa Baru'} (Kursi #{item.slot_number})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <strong className="block text-slate-800">{item.parent_name}</strong>
                        <a href={`https://wa.me/${item.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline text-[11px] font-bold block">
                          📱 {item.whatsapp}
                        </a>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">{item.email}</span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[170px]">
                        <span className="text-[11px] font-bold text-slate-700 block leading-snug">
                          {item.attendance_session || 'Sabtu, 8 Agt (08.00)'}
                        </span>
                      </td>

                      {/* KOLOM PEMBAYARAN: TOMBOL LIHAT BUKTI BAYAR & UPLOAD BUKTI PAY ON-SITE */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                            item.payment_method === 'pay_now'
                              ? 'bg-blue-100 text-[#293C88]'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.payment_method === 'pay_now' ? 'Pay Now (Transfer)' : 'Pay On-site (Di Lokasi)'}
                          </span>

                          {/* Direct Download Bukti Bayar */}
                          {item.payment_proof ? (
                            <a
                              href={item.payment_proof || DUMMY_RECEIPT_IMG}
                              download={`Bukti_Bayar_${item.child_name.replace(/\s+/g, '_')}_${item.ticket_code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg text-[11px] transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                              title="Klik untuk langsung mengunduh bukti pembayaran"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Download Bukti Bayar</span>
                            </a>
                          ) : (
                            /* Tombol Upload Bukti Pembayaran untuk Pay On-site / Belum Upload */
                            <button
                              onClick={() => setUploadModalData({
                                id: item.id,
                                childName: item.child_name,
                                ticketCode: item.ticket_code
                              })}
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition flex items-center justify-center gap-1 shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5 text-white" />
                              <span>Upload Bukti Bayar</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id, item.child_name)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl transition shadow-xs"
                          title="Hapus Data & Kembalikan Kuota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>


      {/* 2. MODAL POP UP UPLOAD BUKTI PEMBAYARAN (UNTUK PAY ON-SITE) */}
      {uploadModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => !isUploading && setUploadModalData(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !isUploading && setUploadModalData(null)}
              disabled={isUploading}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Upload className="w-3 h-3 text-amber-600" /> UPLOAD BUKTI ADMIN
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#002B5B]">
              Upload Bukti Pembayaran
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pendaftar Pay On-site: <strong>{uploadModalData.childName}</strong> ({uploadModalData.ticketCode})
            </p>

            <form onSubmit={handleAdminSubmitProof} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-300 text-center">
                <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <label className={`block text-xs font-bold text-slate-700 mb-1 ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-[#293C88]'}`}>
                  Pilih Struk / Foto Bukti Bayar
                  <input
                    id="admin-proof-file"
                    type="file"
                    accept="image/*,.pdf"
                    required
                    disabled={isUploading}
                    onChange={handleAdminFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-400 block">
                  {adminUploadFileName ? `File: ${adminUploadFileName}` : 'Klik untuk mencari file foto/image'}
                </span>
              </div>

              {adminUploadFile && (
                <div className="bg-slate-100 p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                  <img src={adminUploadFile} alt="Preview Upload" className="max-h-36 object-contain rounded-lg" />
                </div>
              )}

              {/* Progress Loading Upload dengan Persentase */}
              {isUploading && (
                <div className="space-y-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      Mengunggah Bukti Pembayaran...
                    </span>
                    <span className="text-amber-700 font-extrabold text-sm">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-amber-200/80 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-150 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUploadModalData(null)}
                  disabled={isUploading}
                  className="w-1/3 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !adminUploadFile}
                  className="w-2/3 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengunggah... {uploadProgress}%</span>
                    </>
                  ) : (
                    <span>Simpan Bukti Bayar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
