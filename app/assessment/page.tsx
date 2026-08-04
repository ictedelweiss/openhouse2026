'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  GraduationCap, 
  Ticket, 
  Printer, 
  LogOut, 
  CreditCard,
  Building2,
  Phone,
  ShieldCheck,
  ChevronRight
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
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [schedules, setSchedules] = useState<AssessmentSchedule[]>([]);
  const [category, setCategory] = useState<string>('');
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [confirmModalId, setConfirmModalId] = useState<number | null>(null);

  // Restore session from localStorage if present
  useEffect(() => {
    const saved = localStorage.getItem('assessment_student_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStudent(parsed.student);
        setAllocation(parsed.allocation || null);
        if (parsed.student && parsed.student.id) {
          fetchSchedules(parsed.student.id);
        }
      } catch (e) {
        localStorage.removeItem('assessment_student_session');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPaymentRequired(false);

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
        localStorage.setItem(
          'assessment_student_session',
          JSON.stringify({ student: result.student, allocation: result.allocation })
        );
        fetchSchedules(result.student.id);
      } else if (result.status === 'payment_required') {
        setStudent(result.student);
        setPaymentRequired(true);
        setErrorMsg(result.message);
      } else {
        setErrorMsg(result.message || 'Login gagal. Periksa kembali email dan tanggal lahir anak Anda.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server. Silakan periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
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
        body: JSON.stringify({
          student_id: student.id,
          schedule_id: scheduleId
        })
      });

      const result = await res.json();

      if (result.status === 'success') {
        setSuccessMsg('Selamat! Sesi Profiling Assessment anak Anda telah berhasil dijadwalkan.');
        // Refresh schedules and allocation status
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
          localStorage.setItem(
            'assessment_student_session',
            JSON.stringify({ student, allocation: newAlloc })
          );
        }
        fetchSchedules(student.id);
      } else {
        setErrorMsg(result.message || 'Gagal memilih jadwal.');
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan sistem saat menyimpan jadwal.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('assessment_student_session');
    setStudent(null);
    setAllocation(null);
    setPaymentRequired(false);
    setEmail('');
    setPassword('');
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  return (
    <main className="min-h-screen bg-slate-900 font-poppins text-slate-100 relative overflow-hidden flex flex-col justify-between">
      {/* Dynamic Background Design Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#293C88]/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FED700]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo-square.png" alt="Edelweiss School Logo" width={36} height={36} className="rounded-xl shadow-lg group-hover:scale-105 transition bg-white p-1" />
            <div>
              <h1 className="text-sm font-extrabold text-white leading-tight">Edelweiss Open House</h1>
              <p className="text-[10px] text-slate-400">Portal Profiling Assessment</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Beranda
            </Link>
            {student && (
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Keluar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 relative z-10">
        
        {/* LOGIN SCREEN */}
        {!student && (
          <div className="max-w-md mx-auto my-8">
            <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#293C88] to-blue-600 border border-white/20 text-[#FED700] flex items-center justify-center mx-auto mb-3 shadow-xl">
                  <Calendar className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black text-white">Login Portal Orang Tua</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Penjadwalan Mandiri Profiling Assessment Siswa
                </p>
              </div>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5 mb-5">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#FED700]" /> Email Terdaftar saat Registrasi
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#FED700] text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#FED700]" /> Password (DDMMYYYY Tanggal Lahir Anak)
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={10}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contoh: 15082017"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#FED700] text-white placeholder-slate-500 font-mono tracking-widest"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    💡 <em>Gunakan 8 digit angka tanggal lahir anak (DDMMYYYY). Misal lahir 15 Agustus 2017 = <strong>15082017</strong>.</em>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FED700] to-amber-400 text-[#293C88] font-black text-sm transition shadow-lg hover:shadow-amber-500/20 mt-3 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Memverifikasi Data...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Masuk Portal Assessment</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
                Belum mendaftar Open House?{' '}
                <Link href="/" className="text-[#FED700] underline font-semibold">
                  Daftar Sekarang
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT REQUIRED SCREEN */}
        {student && paymentRequired && (
          <div className="max-w-md mx-auto my-8">
            <div className="bg-slate-800/90 border border-amber-500/30 rounded-3xl p-8 shadow-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Pembayaran Belum Diverifikasi</h2>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Halo Bpk/Ibu dari <strong>{student.child_name}</strong> ({student.level_name}). 
                Penjadwalan Profiling Assessment secara mandiri membutuhkan konfirmasi bukti pembayaran pendaftaran.
              </p>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 text-xs text-left space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Kode Tiket:</span>
                  <strong className="text-[#FED700] font-mono">{student.ticket_code}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Anak:</span>
                  <strong className="text-white">{student.child_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tingkat:</span>
                  <strong className="text-white">{student.level_name}</strong>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={`https://wa.me/6281234567890?text=Halo%20Admin%20Edelweiss,%20saya%20sudah%20mendaftar%20dengan%20Kode%20Tiket%20${student.ticket_code}%20an%20${encodeURIComponent(student.child_name)}.%20Mohon%20bantuan%20konfirmasi%20pembayaran.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Phone className="w-4 h-4" /> Hubungi Admin via WhatsApp
                </a>

                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition"
                >
                  Kembali ke Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOGGED IN DASHBOARD - SCHEDULING VIEW */}
        {student && !paymentRequired && (
          <div className="space-y-8">
            
            {/* Student Banner Header */}
            <div className="bg-gradient-to-r from-[#293C88] via-indigo-900 to-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#FED700] text-[#293C88] font-black text-2xl flex items-center justify-center shadow-lg border border-white/20 flex-shrink-0">
                  {student.child_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FED700]/20 border border-[#FED700]/40 text-[#FED700] text-[10px] font-extrabold uppercase">
                      {student.ticket_code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                      Terverifikasi
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white leading-tight">{student.child_name}</h2>
                  <p className="text-xs text-slate-300 flex items-center gap-2 mt-1">
                    <GraduationCap className="w-3.5 h-3.5 text-[#FED700]" /> Program: <strong>{student.level_name}</strong>
                  </p>
                </div>
              </div>

              {/* Status Alokasi Jadwal Saat Ini */}
              <div className="bg-slate-950/60 border border-white/10 p-4 rounded-2xl min-w-[260px] text-xs">
                <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">
                  Status Jadwal Assessment:
                </span>
                {allocation ? (
                  <div>
                    <div className="text-emerald-400 font-extrabold flex items-center gap-1.5 text-sm mb-1">
                      <CheckCircle2 className="w-4 h-4" /> Terjadwal
                    </div>
                    <div className="text-slate-200 font-bold">
                      {formatDateIndo(allocation.date)}
                    </div>
                    <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[#FED700]" /> Pukul {formatTime(allocation.start_time)} - {formatTime(allocation.end_time)} WIB
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-400 font-bold flex items-center gap-1.5 text-xs py-1">
                    <AlertCircle className="w-4 h-4" /> Belum Memilih Jadwal
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            {successMsg && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-4 rounded-2xl text-xs text-emerald-200 flex items-center gap-3 shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-500/20 border border-rose-500/40 p-4 rounded-2xl text-xs text-rose-200 flex items-center gap-3 shadow-lg">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Main Section: Choose Schedule */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#FED700]" /> Sesi Profiling Assessment yang Tersedia
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Silakan pilih salah satu jadwal di bawah ini yang sesuai dengan waktu Anda.
                  </p>
                </div>
                <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
                  Kategori: <strong className="text-[#FED700] capitalize">{category || 'Umum'}</strong>
                </div>
              </div>

              {schedules.length === 0 ? (
                <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 text-center text-slate-400 text-xs">
                  Belum ada jadwal assessment yang dibuka untuk kategori level ini. Silakan hubungi admin sekolah.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schedules.map((sch) => {
                    const isSelected = allocation?.schedule_id === sch.id;
                    const isFull = sch.allocated_count >= sch.capacity && !isSelected;
                    const remaining = Math.max(0, sch.capacity - sch.allocated_count);

                    return (
                      <div
                        key={sch.id}
                        className={`rounded-2xl border p-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                            : isFull
                            ? 'bg-slate-900/40 border-white/5 opacity-60'
                            : 'bg-slate-800/40 border-white/10 hover:border-white/20 hover:bg-slate-800'
                        }`}
                      >
                        {/* Header Badge */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#FED700]" /> Kampus Edelweiss
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isSelected
                                ? 'bg-[#FED700] text-[#293C88]'
                                : isFull
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isSelected ? 'JADWAL ANDA' : isFull ? 'KUOTA PENUH' : `Sisa ${remaining} Kuota`}
                          </span>
                        </div>

                        {/* Schedule Info */}
                        <div className="space-y-2 mb-4">
                          <div className="text-base font-bold text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#FED700]" /> {formatDateIndo(sch.date)}
                          </div>
                          <div className="text-xs text-slate-300 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Pukul {formatTime(sch.start_time)} - {formatTime(sch.end_time)} WIB
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => setConfirmModalId(sch.id)}
                          disabled={isFull || submitting === sch.id || isSelected}
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                            isSelected
                              ? 'bg-emerald-500 text-white cursor-default'
                              : isFull
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-[#FED700] hover:bg-amber-400 text-[#293C88] shadow-md hover:scale-[1.02]'
                          }`}
                        >
                          {submitting === sch.id ? (
                            <span>Memproses...</span>
                          ) : isSelected ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> Sesi Terpilih
                            </>
                          ) : isFull ? (
                            <span>Sesi Penuh</span>
                          ) : (
                            <>
                              <span>Pilih Jadwal Ini</span>
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Instruction Card & Printing */}
            {allocation && (
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-6 text-xs text-slate-300 space-y-3">
                <h4 className="font-extrabold text-[#FED700] text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Petunjuk Pelaksanaan Profiling Assessment
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300 leading-relaxed">
                  <li>Harap hadir 15 menit sebelum sesi Profiling Assessment dimulai.</li>
                  <li>Membawa alat tulis dan perlengkapan diri secukupnya.</li>
                  <li>Menunjukkan Kode Tiket Pendaftaran <strong>({student.ticket_code})</strong> kepada petugas di lokasi.</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500 bg-slate-950/80 backdrop-blur-md">
        © 2026 Edelweiss Open House — Profiling Assessment Self-Service Portal
      </footer>

      {/* Confirmation Modal */}
      {confirmModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fadeIn">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Konfirmasi Jadwal</h3>
              <p className="text-xs text-slate-300">
                Apakah Anda yakin ingin memilih jadwal ini untuk Profiling Assessment? Pastikan waktu sudah sesuai karena kuota terbatas.
              </p>
              <div className="flex items-center gap-3 w-full mt-4">
                <button
                  onClick={() => setConfirmModalId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleSelectSchedule(confirmModalId)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FED700] hover:bg-amber-400 text-[#002B5B] text-xs font-bold transition shadow-md"
                >
                  Ya, Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
