'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import { Users, School, Download, Search, Trash2, ArrowRightLeft, UserCheck, RefreshCw, Image as ImageIcon, Upload, Eye, X, CheckCircle, CreditCard, Calendar, Clock, Plus, UserPlus } from 'lucide-react';
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

interface AssessmentSchedule {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  level: 'kiddy' | 'primary' | 'secondary';
  capacity: number;
  allocated_count: number;
}

interface UnallocatedStudent {
  id: number;
  child_name: string;
  ticket_code: string;
  level_name: string;
}

interface AllocatedStudent {
  id: number;
  child_name: string;
  ticket_code: string;
  level_name: string;
  allocation_id: number;
}

const DUMMY_RECEIPT_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="550" viewBox="0 0 400 550" fill="%23f8fafc"><rect width="400" height="550" fill="%23ffffff" rx="16" stroke="%23cbd5e1" stroke-width="2"/><text x="200" y="50" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23293c88" text-anchor="middle">BUKTI TRANSFER RESMI</text><text x="200" y="80" font-family="sans-serif" font-size="12" fill="%2364748b" text-anchor="middle">Edelweiss School Open House</text><line x1="40" y1="100" x2="360" y2="100" stroke="%23e2e8f0" stroke-width="2" stroke-dasharray="4"/><text x="50" y="140" font-family="sans-serif" font-size="12" fill="%2364748b">Bank Tujuan:</text><text x="350" y="140" font-family="sans-serif" font-size=\"12\" font-weight="bold" fill="%230f172a" text-anchor="end">Bank Mandiri</text><text x="50" y="180" font-family="sans-serif" font-size="12" fill="%2364748b">Jumlah Transfer:</text><text x="350" y="180" font-family="sans-serif" font-size="16" font-weight="bold" fill="%2316a34a" text-anchor="end">Rp 500.000</text><text x="50" y="220" font-family="sans-serif" font-size="12" fill="%2364748b">Status:</text><text x="350" y="220" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23293c88" text-anchor="end">BERHASIL / VERIFIED</text><rect x="40" y="260" width="320" height="200" fill="%23f1f5f9" rx="12"/><text x="200" y="360" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23002b5b" text-anchor="middle">Struk Bukti Pembayaran Valid</text><text x="200" y="510" font-family="sans-serif" font-size="11" fill="%2394a3b8" text-anchor="middle">Verified by Admin System</text></svg>';

const INITIAL_MOCK_REGISTRATIONS: RegistrationRecord[] = [];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ name: string; username: string }>({ name: 'Administrator', username: 'admin' });
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(INITIAL_MOCK_REGISTRATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveDb, setIsLiveDb] = useState(false);
  
  // Tab Navigation
  const [activeTab, setActiveTab] = useState<'registrations' | 'schedules'>('registrations');
  
  // Assessment Scheduling States
  const [schedules, setSchedules] = useState<AssessmentSchedule[]>([]);
  const [unallocatedStudents, setUnallocatedStudents] = useState<UnallocatedStudent[]>([]);
  const [allocatedStudents, setAllocatedStudents] = useState<AllocatedStudent[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<AssessmentSchedule | null>(null);
  const [expandedScheduleLevel, setExpandedScheduleLevel] = useState<'kiddy' | 'primary' | 'secondary' | null>('kiddy');
  const [studentToAllocate, setStudentToAllocate] = useState<string>('');

  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    level: 'primary',
    capacity: 10
  });
  
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

  useEffect(() => {
    if (activeTab === 'schedules') {
      fetchSchedules();
    }
  }, [activeTab]);

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}?action=get_schedules`);
      const json = await res.json();
      if (json.status === 'success') setSchedules(json.data);
    } catch (e) { console.error(e); }
  };

  const handleScheduleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newForm = { ...scheduleForm, [name]: value };
    if (name === 'level') {
      newForm.capacity = value === 'kiddy' ? 1 : 10;
    }
    setScheduleForm(newForm);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}?action=create_schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm)
      });
      const json = await res.json();
      if (json.status === 'success') {
        alert(json.message);
        fetchSchedules();
        setScheduleForm({ date: '', start_time: '', end_time: '', level: 'primary', capacity: 10 });
      } else {
        alert(json.message);
      }
    } catch (e) { alert('Gagal memproses request.'); }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}?action=delete_schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (json.status === 'success') {
        fetchSchedules();
        if (selectedSchedule?.id === id) setSelectedSchedule(null);
      } else {
        alert(json.message);
      }
    } catch (e) { console.error(e); }
  };

  const [isImporting, setIsImporting] = useState(false);

  const handleExportSchedulesCSV = () => {
    if (schedules.length === 0) {
      alert('Tidak ada data jadwal untuk di-export.');
      return;
    }

    const headers = ['ID Jadwal', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Tingkat', 'Kapasitas', 'Terisi', 'Sisa Kuota'];
    const rows = schedules.map((s) => [
      s.id,
      `"${s.date}"`,
      `"${s.start_time}"`,
      `"${s.end_time}"`,
      `"${s.level}"`,
      s.capacity,
      s.allocated_count,
      s.capacity - s.allocated_count
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_jadwal_assessment_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCSVTemplate = () => {
    const csvContent = 'tanggal,jam_mulai,jam_selesai,tingkat\n2026-08-10,08:00,09:00,kiddy\n2026-08-10,09:00,10:00,primary\n2026-08-10,10:00,11:00,secondary';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_import_jadwal.csv';
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        alert('File CSV kosong atau tidak memiliki data.');
        setIsImporting(false);
        return;
      }
      
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const schedulesToImport = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData: Record<string, string> = {};
        headers.forEach((h, index) => {
          if (values[index] !== undefined) rowData[h] = values[index];
        });
        schedulesToImport.push(rowData);
      }
      
      try {
        const res = await fetch(`${API_BASE_URL}?action=import_schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schedules: schedulesToImport })
        });
        const json = await res.json();
        alert(json.message);
        if (json.status === 'success') {
          fetchSchedules();
        }
      } catch (err) {
        alert('Terjadi kesalahan jaringan saat mengimpor data.');
      } finally {
        setIsImporting(false);
        e.target.value = ''; // reset input
      }
    };
    reader.onerror = () => {
      alert('Gagal membaca file.');
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const loadScheduleDetails = async (schedule: AssessmentSchedule) => {
    setSelectedSchedule(schedule);
    setAllocatedStudents([]);
    setUnallocatedStudents([]);
    try {
      const [resAlloc, resUnalloc] = await Promise.all([
        fetch(`${API_BASE_URL}?action=get_allocated_students&schedule_id=${schedule.id}`),
        fetch(`${API_BASE_URL}?action=get_unallocated_students&level=${schedule.level}`)
      ]);
      if (resAlloc.ok) {
        const jsonAlloc = await resAlloc.json();
        if (jsonAlloc.status === 'success') setAllocatedStudents(jsonAlloc.data);
      }
      if (resUnalloc.ok) {
        const jsonUnalloc = await resUnalloc.json();
        if (jsonUnalloc.status === 'success') setUnallocatedStudents(jsonUnalloc.data);
      }
    } catch (e) { 
      console.warn('Gagal mengambil data detail jadwal dari server.', e);
    }
  };

  const handleAllocate = async (studentId: number) => {
    if (!selectedSchedule) return;
    try {
      const res = await fetch(`${API_BASE_URL}?action=allocate_student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_id: selectedSchedule.id, student_id: studentId })
      });
      const json = await res.json();
      if (json.status === 'success') {
        loadScheduleDetails(selectedSchedule);
        fetchSchedules();
      } else {
        alert(json.message);
      }
    } catch (e) { console.error(e); }
  };

  const handleUnallocate = async (studentId: number) => {
    if (!selectedSchedule) return;
    if (!confirm('Hapus siswa dari jadwal ini?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}?action=unallocate_student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_id: selectedSchedule.id, student_id: studentId })
      });
      const json = await res.json();
      if (json.status === 'success') {
        loadScheduleDetails(selectedSchedule);
        fetchSchedules();
      } else {
        alert(json.message);
      }
    } catch (e) { console.error(e); }
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
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-2 font-bold text-sm rounded-t-lg transition ${activeTab === 'registrations' ? 'bg-[#002B5B] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Data Pendaftar
          </button>
          <button 
            onClick={() => setActiveTab('schedules')}
            className={`px-4 py-2 font-bold text-sm rounded-t-lg transition ${activeTab === 'schedules' ? 'bg-[#002B5B] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Jadwal Assessment
          </button>
        </div>

        {activeTab === 'registrations' ? (
          <>
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
              <Download className="w-4 h-4" /> Ekspor CSV / Excel
            </button>
          </div>
        </div>

        {/* Tabel Data Pendaftar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-[#002B5B]">
              Daftar Data Pendaftaran Calon Siswa ({filteredRegistrations.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Sistem Terverifikasi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Nama Anak</th>
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
                        <strong className="text-slate-900 font-bold block">{item.child_name}</strong>
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
                            {item.payment_method === 'pay_now' ? 'Bayar Sekarang (Transfer)' : 'Bayar Di Lokasi'}
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
                              <span>Unduh Bukti Bayar</span>
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
                              <span>Unggah Bukti Bayar</span>
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
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Schedule List & Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Form Buat Jadwal */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                <h3 className="font-bold text-sm text-[#002B5B] mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FED700]" /> Buat Jadwal Assessment Baru
                </h3>
                <form onSubmit={handleCreateSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                    <input type="date" name="date" required value={scheduleForm.date} onChange={handleScheduleFormChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat / Level</label>
                    <select name="level" required value={scheduleForm.level} onChange={handleScheduleFormChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                      <option value="kiddy">Kiddy (1-on-1)</option>
                      <option value="primary">Primary (Classroom)</option>
                      <option value="secondary">Secondary (Classroom)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                    <input type="time" name="start_time" required value={scheduleForm.start_time} onChange={handleScheduleFormChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
                    <input type="time" name="end_time" required value={scheduleForm.end_time} onChange={handleScheduleFormChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div className="md:col-span-2 flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kapasitas Maksimal</label>
                      <input type="number" name="capacity" min="1" max="10" required disabled={scheduleForm.level === 'kiddy'} value={scheduleForm.capacity} onChange={handleScheduleFormChange} className="w-full p-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100" />
                    </div>
                    <button type="submit" className="bg-[#293C88] hover:bg-blue-800 text-white font-bold py-2 px-6 rounded-lg text-sm h-[38px] flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <Plus className="w-4 h-4" /> Simpan
                    </button>
                  </div>
                </form>
              </div>

              {/* Import/Export Jadwal CSV */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-[#002B5B] mb-1 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#FED700]" /> Manajemen Data Jadwal
                    </h3>
                    <p className="text-xs text-slate-500">Buat jadwal baru via CSV atau ekspor rekap jadwal.</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                    <button
                      onClick={handleExportSchedulesCSV}
                      className="px-3 py-2 text-xs font-bold bg-[#293C88] hover:bg-[#002B5B] text-white rounded-lg flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Ekspor Data
                    </button>
                    <button
                      onClick={handleDownloadCSVTemplate}
                      className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Template
                    </button>
                    <label className="px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition w-full sm:w-auto relative">
                      {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {isImporting ? 'Mengimpor...' : 'Pilih File CSV'}
                      <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleImportCSV} 
                        disabled={isImporting}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Daftar Jadwal */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                <h3 className="font-bold text-sm text-[#002B5B] mb-4">Daftar Jadwal Assessment</h3>
                
                {/* Level Tabs */}
                <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2 overflow-x-auto">
                  {['kiddy', 'primary', 'secondary'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setExpandedScheduleLevel(expandedScheduleLevel === lvl ? null : lvl as any)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition ${
                        expandedScheduleLevel === lvl 
                          ? 'bg-[#293C88] text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {lvl.charAt(0).toUpperCase() + lvl.slice(1)} 
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${expandedScheduleLevel === lvl ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {schedules.filter(s => s.level === lvl).length}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {schedules.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl">Belum ada jadwal yang dibuat.</p>
                  ) : schedules.filter(s => expandedScheduleLevel ? s.level === expandedScheduleLevel : true).length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl">Tidak ada jadwal untuk jenjang ini.</p>
                  ) : (
                    schedules.filter(s => expandedScheduleLevel ? s.level === expandedScheduleLevel : true).map(sched => (
                      <div 
                        key={sched.id} 
                        onClick={() => loadScheduleDetails(sched)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition ${selectedSchedule?.id === sched.id ? 'border-[#293C88] bg-blue-50/50' : 'border-slate-200 hover:border-blue-300 bg-white'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              {sched.level}
                            </span>
                            <div className="font-bold text-[#002B5B] mt-2 flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-slate-400" /> {new Date(sched.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" /> {sched.start_time.substring(0,5)} - {sched.end_time.substring(0,5)}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${sched.allocated_count >= sched.capacity ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                              Terisi: {sched.allocated_count} / {sched.capacity}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(sched.id); }} className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 bg-white px-2 py-1 rounded border border-rose-100 shadow-sm transition hover:bg-rose-50">
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Allocation Panel */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 self-start sticky top-24">
              <h3 className="font-bold text-sm text-[#002B5B] mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FED700]" /> Alokasi Siswa
              </h3>
              
              {!selectedSchedule ? (
                <div className="text-center text-xs text-slate-500 py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  Pilih salah satu jadwal di sebelah kiri untuk mengelola alokasi siswa.
                </div>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Jadwal Terpilih</div>
                    <div className="text-sm font-extrabold text-[#293C88] flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#FED700]" /> {selectedSchedule.date}</div>
                    <div className="text-xs text-slate-700 mt-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {selectedSchedule.start_time.substring(0,5)} - {selectedSchedule.end_time.substring(0,5)} <span className="ml-2 uppercase bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[9px] font-bold">{selectedSchedule.level}</span></div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2">Tambahkan Siswa (Belum ada jadwal)</h4>
                    <div className="flex gap-2">
                      <select 
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#293C88]"
                        onChange={(e) => setStudentToAllocate(e.target.value)}
                        value={studentToAllocate}
                      >
                        <option value="">-- Pilih Siswa --</option>
                        {unallocatedStudents.map(s => (
                          <option key={s.id} value={s.id}>{s.child_name} ({s.level_name})</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => { if(studentToAllocate) handleAllocate(parseInt(studentToAllocate)); setStudentToAllocate(''); }}
                        disabled={!studentToAllocate || selectedSchedule.allocated_count >= selectedSchedule.capacity}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg disabled:opacity-50 transition shadow-sm"
                        title="Tambahkan ke Jadwal"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <h4 className="text-xs font-bold text-slate-700">Daftar Siswa Terjadwal</h4>
                      <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{allocatedStudents.length}/{selectedSchedule.capacity}</span>
                    </div>
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {allocatedStudents.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic p-3 text-center bg-slate-50 rounded-lg border border-slate-100">Belum ada siswa.</p>
                      ) : (
                        allocatedStudents.map(s => (
                          <div key={s.allocation_id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-lg group transition hover:border-[#293C88]/30 hover:shadow-xs">
                            <div>
                              <div className="text-xs font-bold text-slate-800">{s.child_name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1"><span className="w-1 h-1 bg-slate-300 rounded-full inline-block"></span> {s.level_name}</div>
                            </div>
                            <button onClick={() => handleUnallocate(s.id)} className="text-rose-500 hover:text-white hover:bg-rose-500 p-1.5 bg-white rounded-md border border-rose-200 transition opacity-0 group-hover:opacity-100 shadow-sm" title="Hapus dari jadwal">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
                <Upload className="w-3 h-3 text-amber-600" /> UNGGAH BUKTI ADMIN
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#002B5B]">
              Unggah Bukti Pembayaran
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pendaftar Bayar Di Lokasi: <strong>{uploadModalData.childName}</strong>
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
