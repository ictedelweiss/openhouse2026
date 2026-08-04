'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  LogOut,
  CreditCard,
  Phone,
  ShieldCheck,
  ChevronRight,
  Loader2,
  User,
  MapPin,
  Info
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';

interface StudentProfile {
  id: number;
  ticket_code: string;
  child_name: string;
  birth_date: string;
  parent_name: string;
  email: string;
  whatsapp: string;
  level_id: string;
  level_name: string;
  payment_proof: string;
  payment_status?: 'pending' | 'verified' | 'rejected';
}

interface Allocation {
  allocation_id: number;
  schedule_id: number;
  date: string;
  start_time: string;
  end_time: string;
  level: string;
}

interface AssessmentSchedule {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  level: string;
  capacity: number;
  allocated_count: number;
}

export default function AssessmentPortalPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [schedules, setSchedules] = useState<AssessmentSchedule[]>([]);
  const [category, setCategory] = useState<string>('');
  const [paymentState, setPaymentState] = useState<'ok'|'required'|'pending'|'rejected'>('ok');
  const [confirmModalId, setConfirmModalId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('assessment_student_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStudent(parsed.student);
        setAllocation(parsed.allocation || null);
        if (parsed.student?.id) {
          fetchSchedules(parsed.student.id);
        }
      } catch {
        localStorage.removeItem('assessment_student_session');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPaymentState('ok');

    try {
      const res = await fetch(`${API_BASE_URL}?action=student_login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setStudent(result.student);
        setAllocation(result.allocation || null);
        setSchedules(result.schedules || []);
        setCategory(result.category || '');
        localStorage.setItem('assessment_student_session', JSON.stringify({ student: result.student, allocation: result.allocation }));
      } else if (result.status === 'payment_required') {
        setStudent(result.student);
        setPaymentState('required');
        setErrorMsg(result.message);
      } else if (result.status === 'payment_pending') {
        setStudent(result.student);
        setPaymentState('pending');
        setErrorMsg(result.message);
      } else if (result.status === 'payment_rejected') {
        setStudent(result.student);
        setPaymentState('rejected');
        setErrorMsg(result.message);
      } else {
        setErrorMsg(result.message || 'Login gagal. Periksa kembali email dan tanggal lahir anak Anda.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server. Silakan periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const fetchSchedules = async (studentId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}?action=get_student_schedules&student_id=${studentId}`);
      const result = await res.json();
      if (result.status === 'success') {
        setSchedules(result.schedules || []);
        setCategory(result.category || '');
      }
    } catch (err) {
      console.error('Failed to fetch schedules', err);
    }
  };

  const handleSelectSchedule = async (scheduleId: number) => {
    if (!student) return;
    setConfirmModalId(null);
    setSubmitting(scheduleId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}?action=student_select_schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, schedule_id: scheduleId })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setSuccessMsg('Jadwal Profiling Assessment berhasil dipilih!');
        const selectedSch = schedules.find((s) => s.id === scheduleId);
        if (selectedSch) {
          const newAlloc: Allocation = {
            allocation_id: Date.now(),
            schedule_id: scheduleId,
            date: selectedSch.date,
            start_time: selectedSch.start_time,
            end_time: selectedSch.end_time,
            level: selectedSch.level
          };
          setAllocation(newAlloc);
          localStorage.setItem('assessment_student_session', JSON.stringify({ student, allocation: newAlloc }));
        }
        fetchSchedules(student.id);
      } else {
        setErrorMsg(result.message || 'Gagal memilih jadwal.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan sistem saat menyimpan jadwal.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('assessment_student_session');
    setStudent(null);
    setAllocation(null);
    setPaymentState('ok');
    setEmail('');
    setPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
    } catch { return dateStr; }
  };

  const formatTime = (t: string) => (t ? t.substring(0, 5) : '');

  const formatDayName = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[new Date(dateStr).getDay()];
    } catch { return ''; }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="mt-3 text-sm font-semibold text-gray-700">Memuat data...</p>
        </div>
      )}

      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo-square.png"
              alt="Edelweiss School"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <div className="leading-tight">
              <p className="text-xs font-bold text-[#002B5B]">Edelweiss Open House</p>
              <p className="text-[10px] text-gray-500">Portal Profiling Assessment</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Beranda
            </Link>
            {student && (
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Keluar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* ─── LOGIN SCREEN ─── */}
        {!student && (
          <div className="max-w-md mx-auto">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-[#002B5B] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-[#FED700]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Portal Penjadwalan Mandiri</h1>
              <p className="text-gray-500 text-sm mt-1">Profiling Assessment — Edelweiss Open House 2026</p>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-2xl border border-gray-200  p-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-gray-50 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password (Tanggal Lahir Anak)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      maxLength={10}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="DDMMYYYY — contoh: 15082017"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-gray-50 font-mono tracking-wide transition"
                    />
                  </div>
                  <div className="flex items-start gap-2 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800">Gunakan 8 digit tanggal lahir anak format DDMMYYYY. Misal lahir 15 Agustus 2017 → <strong>15082017</strong></p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#002B5B] hover:bg-blue-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...</> : 'Masuk ke Portal'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
                Belum mendaftar Open House?{' '}
                <Link href="/" className="text-blue-600 hover:underline font-semibold">Daftar Sekarang</Link>
              </div>
            </div>
          </div>
        )}

        {/* ─── PAYMENT REQUIRED / PENDING / REJECTED ─── */}
        {student && paymentState !== 'ok' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl border border-amber-200  p-8 text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {paymentState === 'required' ? 'Bukti Pembayaran Belum Diunggah' :
                 paymentState === 'pending' ? 'Pembayaran Sedang Diverifikasi' :
                 'Bukti Pembayaran Ditolak'}
              </h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {paymentState === 'required' ? 
                  <><span className="font-semibold text-gray-800">Halo Bpk/Ibu dari {student.child_name} ({student.level_name}).</span><br/>Penjadwalan mandiri memerlukan konfirmasi bukti pembayaran terlebih dahulu.</> :
                 paymentState === 'pending' ? 
                  <><span className="font-semibold text-gray-800">Halo Bpk/Ibu dari {student.child_name}.</span><br/>Bukti pembayaran Anda sedang dalam proses verifikasi oleh Admin. Silakan tunggu atau hubungi Admin untuk info lebih lanjut.</> :
                  <><span className="font-semibold text-gray-800">Halo Bpk/Ibu dari {student.child_name}.</span><br/>Bukti pembayaran Anda <strong>ditolak</strong> oleh Admin. Silakan kirimkan bukti pembayaran yang benar melalui WhatsApp Admin.</>}
              </p>
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-left space-y-2 mb-6">
                <div className="flex justify-between"><span className="text-gray-500">Kode Tiket</span><strong className="font-mono text-[#002B5B]">{student.ticket_code}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Nama Anak</span><strong className="text-gray-800">{student.child_name}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Program</span><strong className="text-gray-800">{student.level_name}</strong></div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500 block text-xs mb-1 font-semibold">Rekening Transfer Pembayaran:</span>
                  <div className="bg-white p-3 rounded-lg border border-amber-300 bg-amber-50/50">
                    <p className="font-bold text-gray-900 text-xs">BCA a/n YAY SINAR PUTIH EDELWEISS</p>
                    <p className="font-mono font-black text-[#002B5B] text-base mt-0.5 tracking-wider">7510828768</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <a
                  href={`https://wa.me/628118817757?text=Halo%20Admin%20Edelweiss,%20saya%20sudah%20mendaftar%20dengan%20Kode%20Tiket%20${student.ticket_code}%20an%20${encodeURIComponent(student.child_name)}.%20Mohon%20bantuan%20konfirmasi%20pembayaran.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-sm"
                >
                  <Phone className="w-4 h-4" /> Hubungi Admin via WhatsApp (+62 811-8817-757)
                </a>
                <button onClick={handleLogout} className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">
                  Kembali ke Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── DASHBOARD UTAMA ─── */}
        {student && paymentState === 'ok' && (
          <div className="space-y-6">

            {/* Student Card */}
            <div className="bg-white rounded-2xl border border-gray-200 border-l-4 border-l-[#002B5B] p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-[#002B5B] text-[#FED700] flex items-center justify-center text-lg font-black flex-shrink-0">
                    {student.child_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-[#FED700] text-[#002B5B] px-2 py-0.5 rounded">{student.ticket_code}</span>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">✓ Terverifikasi</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-900">{student.child_name}</h2>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5" /> {student.level_name}
                    </p>
                  </div>
                </div>

                {/* Status Box */}
                <div className={`rounded-xl border px-4 py-3 text-sm min-w-[220px] ${allocation ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-700 mb-1.5">Status Assessment</p>
                  {allocation ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
                        <CheckCircle2 className="w-4 h-4" /> Sudah Terjadwal
                      </div>
                      <p className="text-gray-900 font-semibold text-sm">{formatDayName(allocation.date)}, {formatDateIndo(allocation.date)}</p>
                      <p className="text-gray-700 text-xs mt-0.5 font-medium">Pukul {formatTime(allocation.start_time)} – {formatTime(allocation.end_time)} WIB</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                      <AlertCircle className="w-4 h-4" /> Belum Memilih Jadwal
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alert messages */}
            {successMsg && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Lock Banner */}
            {allocation && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900">Jadwal sudah ditetapkan dan tidak dapat diubah</p>
                    <p className="text-blue-700 mt-0.5">Jika perlu mengubah jadwal (reschedule), silakan hubungi admin Edelweiss School secara langsung.</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/628118817757?text=Halo%20Admin%20Edelweiss,%20saya%20ingin%20mengubah%20jadwal%20assessment%20untuk%20siswa%20${encodeURIComponent(student.child_name)}%20(Kode%20Tiket:%20${student.ticket_code}).`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shrink-0 whitespace-nowrap"
                >
                  <Phone className="w-3.5 h-3.5" /> Hubungi Admin via WhatsApp
                </a>
              </div>
            )}

            {/* Schedule Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Pilih Sesi Assessment</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Kategori: <span className="font-semibold text-[#002B5B] capitalize">{category || 'Umum'}</span></p>
                </div>
              </div>

              {schedules.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-500">Belum ada jadwal yang tersedia</p>
                  <p className="text-xs text-gray-400 mt-1">Silakan hubungi admin sekolah untuk informasi lebih lanjut</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {schedules.map((sch) => {
                    const isSelected = allocation?.schedule_id === sch.id;
                    const isFull = sch.allocated_count >= sch.capacity && !isSelected;
                    const hasAllocation = !!allocation;
                    const remaining = Math.max(0, sch.capacity - sch.allocated_count);
                    const isDisabled = hasAllocation || isFull;

                    return (
                      <div
                        key={sch.id}
                        className={`bg-white rounded-xl border-2 p-4 flex flex-col gap-3 transition-all ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-50'
                            : isFull || (hasAllocation && !isSelected)
                            ? 'border-gray-200 opacity-50'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <MapPin className="w-3.5 h-3.5" /> Kampus Edelweiss
                          </div>
                          {isSelected ? (
                            <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">JADWAL ANDA</span>
                          ) : isFull ? (
                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">PENUH</span>
                          ) : (
                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Sisa {remaining} kursi</span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div>
                          <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wide">{formatDayName(sch.date)}</p>
                          <p className="text-base font-bold text-gray-900 mt-0.5">{formatDateIndo(sch.date)}</p>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formatTime(sch.start_time)} – {formatTime(sch.end_time)} WIB
                          </div>
                        </div>

                        {/* Action */}
                        <button
                          onClick={() => !isDisabled && setConfirmModalId(sch.id)}
                          disabled={isDisabled || submitting === sch.id}
                          className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                            isSelected
                              ? 'bg-emerald-500 text-white cursor-default'
                              : isDisabled
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-[#002B5B] hover:bg-blue-900 text-white'
                          }`}
                        >
                          {submitting === sch.id ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                          ) : isSelected ? (
                            <><CheckCircle2 className="w-4 h-4" /> Sesi Terpilih</>
                          ) : isFull ? (
                            'Sesi Penuh'
                          ) : hasAllocation ? (
                            'Tidak Tersedia'
                          ) : (
                            <>Pilih Jadwal <ChevronRight className="w-4 h-4" /></>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Instruction Card */}
            {allocation && (
              <div className="bg-white rounded-2xl border border-gray-200  p-5">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-[#002B5B]" /> Petunjuk Pelaksanaan
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> Harap hadir 15 menit sebelum sesi Profiling Assessment dimulai.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> Membawa alat tulis dan perlengkapan diri secukupnya.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> Tunjukkan Kode Tiket <strong>{student.ticket_code}</strong> kepada petugas di lokasi.</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-5 text-center text-xs text-gray-400">
        © 2026 Edelweiss Open House — Profiling Assessment Self-Service Portal
      </footer>

      {/* Confirmation Modal */}
      {confirmModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Jadwal</h3>
              <p className="text-sm text-gray-500 mt-1">
                {(() => {
                  const sch = schedules.find(s => s.id === confirmModalId);
                  return sch ? (
                    <span>
                      <strong className="text-gray-800">{formatDayName(sch.date)}, {formatDateIndo(sch.date)}</strong><br />
                      Pukul {formatTime(sch.start_time)} – {formatTime(sch.end_time)} WIB
                    </span>
                  ) : 'Pastikan waktu yang dipilih sudah sesuai.';
                })()}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-5 text-center">
              ⚠️ Jadwal yang sudah dipilih <strong>tidak dapat diubah</strong>. Pastikan waktunya sesuai.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModalId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleSelectSchedule(confirmModalId)}
                className="flex-1 py-2.5 rounded-xl bg-[#002B5B] hover:bg-blue-900 text-white text-sm font-semibold transition-colors"
              >
                Ya, Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
