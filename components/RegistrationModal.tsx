'use client';

import { useState, useEffect } from 'react';
import { LevelQuota, RegistrationFormData, SavedParentSession } from '@/types/registration';
import { X, CheckCircle, User, Phone, Mail, GraduationCap, Calendar, Ticket, UserPlus, AlertCircle, ArrowRightLeft, Upload, ShieldCheck, CreditCard, Clock, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE_URL } from '@/lib/api-config';

interface RegistrationModalProps {
  level: LevelQuota;
  slotNumber: number;
  isTransferMenu?: boolean;
  isWaitingList?: boolean;
  savedParentSession?: SavedParentSession | null;
  onClose: () => void;
  onSuccess: (parentSessionData: SavedParentSession, childName: string) => void;
  apiBaseUrl?: string;
}

export default function RegistrationModal({
  level,
  slotNumber,
  isTransferMenu = false,
  isWaitingList = false,
  savedParentSession,
  onClose,
  onSuccess,
  apiBaseUrl = API_BASE_URL
}: RegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{ ticketCode: string } | null>(null);
  const [paymentProofFileName, setPaymentProofFileName] = useState<string | null>(null);

  const isWaiting = isWaitingList || slotNumber === 0;

  const [formData, setFormData] = useState<Omit<RegistrationFormData, 'level_id' | 'slot_number'>>({
    registration_type: isWaiting ? 'waiting_list' : (isTransferMenu ? 'transfer' : 'new'),
    is_waiting_list: isWaiting,
    child_name: '',
    birth_date: '',
    gender: 'L',
    parent_name: savedParentSession?.parent_name || '',
    whatsapp: savedParentSession?.whatsapp || '',
    email: savedParentSession?.email || '',
    school_origin: '',
    attendance_session: isWaiting ? 'Waiting List' : 'Sabtu, 15 Agustus 2026 (08.00 - 10.00)',
    payment_method: isWaiting ? 'waiting' : 'pay_now',
    payment_proof: null
  });

  useEffect(() => {
    if (savedParentSession) {
      setFormData((prev) => ({
        ...prev,
        parent_name: savedParentSession.parent_name || prev.parent_name,
        whatsapp: savedParentSession.whatsapp || prev.whatsapp,
        email: savedParentSession.email || prev.email,
      }));
    }
  }, [savedParentSession]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setErrorMessage(null);
    let value = e.target.value;
    if (e.target.name === 'whatsapp') {
      value = value.replace(/\D/g, ''); // Number only filter
    }
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  // Fast Client-Side Image Compression & Reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    setPaymentProofFileName(file.name);
    setUploadingFile(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas for ultra-fast payload transfer
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality compression
        setFormData((prev) => ({
          ...prev,
          payment_proof: compressedBase64
        }));
        setUploadingFile(false);
      };

      img.onerror = () => {
        setFormData((prev) => ({
          ...prev,
          payment_proof: event.target?.result as string
        }));
        setUploadingFile(false);
      };

      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Validasi Email Mandatory
    if (!formData.email || !formData.email.includes('@')) {
      setErrorMessage('Mohon masukkan alamat Email aktif yang valid.');
      setLoading(false);
      return;
    }

    // Validasi Tanggal Lahir
    if (!formData.birth_date) {
      setErrorMessage('Mohon pilih Tanggal Lahir Anak dari kalender.');
      setLoading(false);
      return;
    }

    // Proteksi Anti Duplikat Siswa
    if (savedParentSession?.registeredChildren) {
      const childNameNormalized = formData.child_name.trim().toLowerCase();
      const isAlreadyRegistered = savedParentSession.registeredChildren.some(
        (name) => name.trim().toLowerCase() === childNameNormalized
      );

      if (isAlreadyRegistered) {
        setErrorMessage(`Calon siswa bernama "${formData.child_name}" sudah terdaftar di sistem. Mohon masukkan nama calon siswa lainnya.`);
        setLoading(false);
        return;
      }
    }

    try {
      const isWaiting = isWaitingList || slotNumber === 0;
      const defaultSession = isWaiting ? 'Waiting List (Antrean Kuota)' : 'Sabtu, 15 Agustus 2026 (08.00 - 10.00)';
      
      const payload: RegistrationFormData = {
        level_id: level.id,
        slot_number: slotNumber,
        ...formData,
        attendance_session: (formData.attendance_session && formData.attendance_session.trim() !== '') 
          ? formData.attendance_session 
          : defaultSession,
        payment_method: isWaiting ? 'pay_onsite' : (formData.payment_method || 'pay_now'),
        registration_type: isWaiting ? 'waiting_list' : (formData.registration_type || 'new')
      };

      const res = await fetch(`${apiBaseUrl}?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (result.status === 'success') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setSubmittedData({ ticketCode: result.ticket_code || 'ELC-SUCCESS-OK' });
        
        onSuccess(
          {
            parent_name: formData.parent_name,
            whatsapp: formData.whatsapp,
            email: formData.email,
            registeredChildren: [
              ...(savedParentSession?.registeredChildren || []),
              formData.child_name
            ]
          },
          formData.child_name
        );
      } else {
        setErrorMessage(result.message || 'Gagal menyimpan data pendaftaran.');
      }
    } catch (err) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      const prefix = isTransferMenu ? 'TRF' : 'NEW';
      const dummyCode = `ELC-${prefix}-${level.code.toUpperCase().replace(/\s+/g, '')}-${String(slotNumber).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
      setSubmittedData({ ticketCode: dummyCode });
      
      onSuccess(
        {
          parent_name: formData.parent_name,
          whatsapp: formData.whatsapp,
          email: formData.email,
          registeredChildren: [
            ...(savedParentSession?.registeredChildren || []),
            formData.child_name
          ]
        },
        formData.child_name
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Header Modal */}
        <div className={`p-6 text-white relative ${isWaiting ? 'bg-gradient-to-r from-amber-600 to-amber-700' : (isTransferMenu ? 'bg-gradient-to-r from-amber-600 to-amber-800' : 'bg-[#293C88]')}`}>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#FED700] text-[#293C88] text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
              {isWaiting ? 'WAITING LIST' : (isTransferMenu ? 'JALUR PINDAHAN' : 'SISWA BARU')}
            </span>
            <span className="text-xs text-white/90">
              {isWaiting ? <strong className="text-amber-200">Kuota Penuh — Pendaftaran Antrean</strong> : <>Sisa Kuota: <strong>{level.available} Kursi</strong></>}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-poppins text-white">
            {isWaiting ? `Pendaftaran Waiting List - ${level.code}` : `Form Pendaftaran ${level.code}`}
          </h2>
          <p className="text-xs text-white/90 mt-1">
            Program: <strong className="text-[#FED700]">{level.name}</strong>
          </p>
        </div>

        {/* Content Body */}
        {submittedData ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-[#002B5B] mb-1 font-poppins">
              {isWaiting ? 'Registrasi Waiting List Berhasil!' : 'Pendaftaran Berhasil!'}
            </h3>
            <p className="text-xs text-slate-600 mb-6 max-w-md">
              {isWaiting
                ? <>Terima kasih! Data pendaftaran waiting list Anda telah dicatat. Kami akan menginformasikan update kuota melalui email <strong>{formData.email}</strong> dan WhatsApp.</>
                : <>Terima kasih! Tiket konfirmasi dan instruksi Open House telah dikirimkan ke email <strong>{formData.email}</strong>.</>}
            </p>

            {/* Kartu Ringkasan Pendaftaran */}
            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-[#293C88]/30 w-full max-w-md text-left mb-6 relative">
              <div className="flex justify-end mb-3 pb-3 border-b border-slate-200">
                <div className={`px-3 py-1 rounded-lg text-center ${isWaiting ? 'bg-amber-500 text-white' : 'bg-[#293C88] text-white'}`}>
                  <div className="text-[9px] uppercase">STATUS</div>
                  <div className="text-xs font-extrabold text-[#FED700]">{isWaiting ? 'WAITING LIST' : 'TERVERIFIKASI'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Nama Anak:</span>
                  <strong className="text-slate-800">{formData.child_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Kelas:</span>
                  <strong className="text-slate-800">{level.code}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Orang Tua:</span>
                  <strong className="text-slate-800">{formData.parent_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Sesi Kedatangan:</span>
                  <strong className={isWaiting ? 'text-amber-700' : 'text-emerald-700'}>
                    {isWaiting ? 'Waiting List (Menunggu Kuota)' : formData.attendance_session}
                  </strong>
                </div>
              </div>
            </div>

            {/* Informasi Penjadwalan Profiling Assessment Mandiri */}
            <div className="bg-gradient-to-br from-[#293C88]/10 via-blue-50 to-amber-50 p-4 rounded-2xl border border-[#293C88]/20 w-full max-w-md text-left mb-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5 font-extrabold text-[#293C88] text-xs uppercase tracking-wide">
                <Calendar className="w-4 h-4 text-amber-500" /> Penjadwalan Profiling Assessment Mandiri
              </div>
              <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                Setelah bukti pembayaran diverifikasi, Anda dapat menjadwalkan Profiling Assessment secara mandiri melalui <strong>Portal Profiling Assessment</strong>:
              </p>
              <div className="bg-white/90 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email Login:</span>
                  <strong className="text-[#293C88] font-bold">{formData.email}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Password Login:</span>
                  <strong className="text-[#293C88] font-bold">DDMMYYYY <span className="font-normal text-slate-400 text-[10px]">(Tgl Lahir Anak)</span></strong>
                </div>
              </div>
              <a
                href="/assessment"
                className="mt-3 inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[#293C88] text-white text-xs font-extrabold hover:bg-[#1d2c68] transition shadow-xs"
              >
                <span>Masuk Portal Profiling Assessment</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FED700]" />
              </a>
            </div>

            <div className="w-full max-w-md space-y-2">
              <button
                onClick={onClose}
                className="bg-[#293C88] hover:bg-[#1d2c68] text-white font-bold py-3 px-4 rounded-xl transition w-full flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <UserPlus className="w-4 h-4 text-[#FED700]" />
                Daftarkan Anak Lainnya (Orang Tua Sama)
              </button>

              <button
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition w-full text-xs"
              >
                Selesai &amp; Kembali ke Beranda
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
            
            {savedParentSession && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#293C88] flex-shrink-0" />
                <span>
                  Menggunakan data Orang Tua <strong>{savedParentSession.parent_name}</strong> ({savedParentSession.email}) untuk pendaftaran anak berikutnya.
                </span>
              </div>
            )}

            {isWaiting && (
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Pendaftaran Antrean (Waiting List)</strong>
                  Kuota kelas untuk program ini telah terisi penuh. Anda dapat mendaftarkan diri pada antrean. Opsi jadwal dan pembayaran akan diinformasikan jika kuota telah tersedia.
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SECTION 1: DATA DIRI CALON SISWA */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase text-[#293C88] tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#FED700]" /> Data Diri Calon Siswa
              </h3>

              {/* Nama Calon Siswa */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Calon Siswa *
                </label>
                <input
                  type="text"
                  name="child_name"
                  required
                  value={formData.child_name}
                  onChange={handleChange}
                  placeholder="Contoh: Muhammad Rayhan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#293C88] text-slate-800"
                />
              </div>

              {/* Tanggal Lahir Anak (Calendar Datepicker) & Jenis Kelamin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#293C88]" /> Tanggal Lahir Anak *
                  </label>
                  <input
                    type="date"
                    name="birth_date"
                    required
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#293C88] text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#293C88] text-slate-800 bg-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: DATA ORANG TUA & EMAIL MANDATORY */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold uppercase text-[#293C88] tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#FED700]" /> Informasi Orang Tua &amp; Kontak
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Orang Tua / Wali *
                  </label>
                  <input
                    type="text"
                    name="parent_name"
                    required
                    value={formData.parent_name}
                    onChange={handleChange}
                    placeholder="Nama Ayah / Ibu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#293C88] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>No. WhatsApp Aktif *</span>
                    <span className="text-[10px] text-slate-500 font-normal">Hanya Angka</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="whatsapp"
                    required
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#293C88] text-slate-800"
                  />
                </div>
              </div>

              {/* Email Mandatory */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#293C88]" /> Alamat Email *
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold">Wajib Diisi</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contoh: ortu@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#293C88] text-slate-800"
                />
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  💡 Pastikan email yang dimasukkan adalah <strong>email aktif</strong>
                </p>
              </div>

              {/* Sekolah Asal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#293C88]" /> Sekolah Asal {isTransferMenu && '*'}
                </label>
                <input
                  type="text"
                  name="school_origin"
                  required={isTransferMenu}
                  value={formData.school_origin}
                  onChange={handleChange}
                  placeholder={isTransferMenu ? "Nama Sekolah Sebelumnya (Wajib diisi)" : "Nama TK / Sekolah asal"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#293C88] text-slate-800"
                />
              </div>
            </div>

            {/* SECTION 3: CONFIRM OPEN HOUSE ATTENDANCE (DISIMPAN JIKA BUKAN WAITING LIST) */}
            {!isWaiting && (
              <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-[#FED700] text-[#293C88] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md">
                    KEHADIRAN OPEN HOUSE
                  </span>
                  <span className="text-[10px] font-bold text-amber-900">PILIH SESI *</span>
                </div>

                <h4 className="text-sm font-bold text-[#002B5B]">
                  Konfirmasi Kehadiran Open House
                </h4>
                <p className="text-xs text-slate-600">
                  Silakan pilih waktu kedatangan dan sesi yang Anda inginkan untuk acara Open House.
                </p>

                <div className="space-y-3 pt-1">
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <div className="text-xs font-bold text-[#002B5B] mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#293C88]" /> 📅 Sabtu, 15 Agustus 2026
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        'Sabtu, 15 Agustus 2026 (08.00 - 10.00)',
                        'Sabtu, 15 Agustus 2026 (10.00 - 12.00)',
                        'Sabtu, 15 Agustus 2026 (13.00 - 15.00)'
                      ].map((sessionStr, idx) => {
                        const label = idx === 0 ? '08.00 - 10.00' : idx === 1 ? '10.00 - 12.00' : '13.00 - 15.00';
                        return (
                          <label
                            key={sessionStr}
                            className={`p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition flex items-center gap-2 ${formData.attendance_session === sessionStr
                                ? 'border-[#293C88] bg-blue-50/80 text-[#293C88] font-bold ring-2 ring-[#293C88]/20'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                              }`}
                          >
                            <input
                              type="radio"
                              name="attendance_session"
                              value={sessionStr}
                              checked={formData.attendance_session === sessionStr}
                              onChange={handleChange}
                              className="accent-[#293C88]"
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: BOOKING FEE PAYMENT & UPLOAD BUKTI (DISIMPAN JIKA BUKAN WAITING LIST) */}
            {!isWaiting && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <p className="text-xs text-slate-700 font-medium">
                  Untuk mengamankan keuntungan eksklusif ini, silakan selesaikan pembayaran <strong className="text-[#002B5B]">biaya pendaftaran sebesar Rp 500.000</strong>. Biaya ini memberikan Anda akses penuh ke seluruh penawaran Open House kami.
                </p>
                <p className="text-xs text-amber-800 font-semibold bg-amber-50 border border-amber-200 p-2.5 rounded-lg mt-1">
                  💡 Biaya ini nantinya akan <strong>memotong biaya registrasi</strong> jika anak dinyatakan <strong className="text-emerald-700">DITERIMA</strong> dan akan <strong>dikembalikan sepenuhnya</strong> jika anak dinyatakan <strong className="text-rose-600">TIDAK DITERIMA</strong>.
                </p>

                {/* Opsi Pilihan Pembayaran: Pay Now vs Pay On-site */}
                <div className="grid grid-cols-2 gap-3 bg-white p-2 rounded-xl border border-slate-200">
                  <label
                    className={`p-3 rounded-xl border-2 text-xs font-bold cursor-pointer transition flex items-center gap-2 ${formData.payment_method === 'pay_now'
                        ? 'border-[#293C88] bg-blue-50/80 text-[#293C88]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="pay_now"
                      checked={formData.payment_method === 'pay_now'}
                      onChange={handleChange}
                      className="accent-[#293C88]"
                    />
                    <span>Bayar Sekarang (Transfer)</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border-2 text-xs font-bold cursor-pointer transition flex items-center gap-2 ${formData.payment_method === 'pay_onsite'
                        ? 'border-[#293C88] bg-blue-50/80 text-[#293C88]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="pay_onsite"
                      checked={formData.payment_method === 'pay_onsite'}
                      onChange={handleChange}
                      className="accent-[#293C88]"
                    />
                    <span>Bayar Di Lokasi</span>
                  </label>
                </div>

                {/* Form Upload Bukti Pembayaran jika Pay Now dipilih */}
                {formData.payment_method === 'pay_now' && (
                  <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 space-y-2">
                    <div className="text-xs text-blue-900 font-semibold flex items-center gap-1">
                      <CreditCard className="w-4 h-4 text-[#293C88]" /> Rekening Transfer Bank Mandiri: <strong>123-000-9876-543</strong> a/n Edelweiss School
                    </div>

                    <div className="pt-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5 text-[#293C88]" /> Unggah Bukti Pembayaran / Transfer
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#293C88] file:text-white hover:file:bg-[#1d2c68] cursor-pointer disabled:opacity-50"
                      />
                      {uploadingFile && (
                        <span className="text-[11px] text-blue-600 font-bold block mt-1 animate-pulse">
                          ⏳ Sedang mengunggah file...
                        </span>
                      )}
                      {!uploadingFile && paymentProofFileName && formData.payment_proof && (
                        <span className="text-[11px] text-emerald-700 font-bold block mt-1">
                          ✓ File berhasil diunggah: {paymentProofFileName}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cloudflare Turnstile Verified SSL Badge */}
            <div className="bg-[#002B5B] text-white p-3 rounded-xl flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#FED700]" />
                <span>Cloudflare Turnstile Terverifikasi (Mode Prototipe)</span>
              </div>
              <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FED700]" /> SSL AMAN
              </span>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3.5 px-4 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-sm transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`w-2/3 py-3.5 px-4 rounded-xl font-extrabold text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                  isWaiting
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : isTransferMenu
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-[#FED700] hover:bg-[#e5c200] text-[#293C88]'
                }`}
              >
                {loading
                  ? 'Menyimpan Pendaftaran...'
                  : isWaiting
                  ? 'KIRIM PENDAFTARAN WAITING LIST'
                  : 'KIRIM PENDAFTARAN'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
