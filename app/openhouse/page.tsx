'use client';

import { useState, useEffect } from 'react';
import { LevelQuota, SavedParentSession } from '@/types/registration';
import RegistrationModal from '@/components/RegistrationModal';
import { School, Home, ArrowRightLeft, Database, RefreshCw, Zap, CheckCircle2, ChevronRight, Users, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api-config';

const INITIAL_MOCK_LEVELS: LevelQuota[] = [
  // 1. EDELWEISS FORMAL SCHOOL (Preschool + P1 + S1)
  {
    id: 'fs-kiddy1',
    code: 'Kiddy 1',
    name: 'Edelweiss Formal School - Kiddy 1 (Preschool)',
    category: 'formal',
    quota: 20,
    booked: 3,
    available: 17,
    slots: Array.from({ length: 20 }, (_, i) => ({
      number: i + 1,
      status: [1, 4, 8].includes(i + 1) ? 'booked' : 'available',
      holder: [1, 4, 8].includes(i + 1) ? 'Siswa Terdaftar' : null
    }))
  },
  {
    id: 'fs-kiddy2',
    code: 'Kiddy 2',
    name: 'Edelweiss Formal School - Kiddy 2 (Preschool)',
    category: 'formal',
    quota: 25,
    booked: 4,
    available: 21,
    slots: Array.from({ length: 25 }, (_, i) => ({
      number: i + 1,
      status: [2, 5, 9, 12].includes(i + 1) ? 'booked' : 'available',
      holder: [2, 5, 9, 12].includes(i + 1) ? 'Siswa Terdaftar' : null
    }))
  },
  {
    id: 'fs-k1',
    code: 'Kindergarten 1',
    name: 'Edelweiss Formal School - Kindergarten 1 (Preschool)',
    category: 'formal',
    quota: 40,
    booked: 6,
    available: 34,
    slots: Array.from({ length: 40 }, (_, i) => ({
      number: i + 1,
      status: [3, 4, 7, 10, 15, 18].includes(i + 1) ? 'booked' : 'available',
      holder: [3, 4, 7, 10, 15, 18].includes(i + 1) ? 'Siswa Terdaftar' : null
    }))
  },
  {
    id: 'fs-k2',
    code: 'Kindergarten 2',
    name: 'Edelweiss Formal School - Kindergarten 2 (Preschool)',
    category: 'formal',
    quota: 40,
    booked: 5,
    available: 35,
    slots: Array.from({ length: 40 }, (_, i) => ({
      number: i + 1,
      status: [1, 6, 11, 14, 20].includes(i + 1) ? 'booked' : 'available',
      holder: [1, 6, 11, 14, 20].includes(i + 1) ? 'Siswa Terdaftar' : null
    }))
  },
  {
    id: 'fs-p1',
    code: 'Primary 1',
    name: 'Edelweiss Formal School - Primary 1 (Kelas 1 SD)',
    category: 'formal',
    quota: 40,
    booked: 8,
    available: 32,
    slots: Array.from({ length: 40 }, (_, i) => ({
      number: i + 1,
      status: [1, 2, 5, 8, 12, 15, 22, 25].includes(i + 1) ? 'booked' : 'available',
      holder: [1, 2, 5, 8, 12, 15, 22, 25].includes(i + 1) ? 'Siswa Terdaftar' : null
    }))
  },
  {
    id: 'fs-s1',
    code: 'Secondary 1',
    name: 'Edelweiss Formal School - Secondary 1 (Kelas 7 SMP)',
    category: 'formal',
    quota: 30,
    booked: 4,
    available: 26,
    slots: Array.from({ length: 30 }, (_, i) => ({
      number: i + 1,
      status: [2, 5, 9, 14].includes(i + 1) ? 'booked' : 'available',
      holder: [2, 5, 9, 14].includes(i + 1) ? 'Siswa Terdaftar' : null
    }))
  },

  // 2. EDELWEISS ACADEMIA HOME SCHOOLING (Kuota @ 10 Anak)
  {
    id: 'hs-p1',
    code: 'Primary 1 (HS)',
    name: 'Edelweiss Academia Home Schooling - Primary 1',
    category: 'homeschooling',
    quota: 10,
    booked: 2,
    available: 8,
    slots: Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      status: [1, 3].includes(i + 1) ? 'booked' : 'available',
      holder: [1, 3].includes(i + 1) ? 'Siswa Terdaftar' : null
    }))
  },
  {
    id: 'hs-ls1',
    code: 'Lower Secondary 1',
    name: 'Edelweiss Academia Home Schooling - Lower Secondary 1',
    category: 'homeschooling',
    quota: 10,
    booked: 3,
    available: 7,
    slots: Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      status: [2, 4, 7].includes(i + 1) ? 'booked' : 'available',
      holder: [2, 4, 7].includes(i + 1) ? 'Siswa Terdaftar' : null
    }))
  },
  {
    id: 'hs-us1',
    code: 'Upper Secondary 1',
    name: 'Edelweiss Academia Home Schooling - Upper Secondary 1',
    category: 'homeschooling',
    quota: 10,
    booked: 1,
    available: 9,
    slots: Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      status: [5].includes(i + 1) ? 'booked' : 'available',
      holder: [5].includes(i + 1) ? 'Siswa Terdaftar' : null
    }))
  },

  // 3. EDELWEISS SISWA PINDAHAN (TRANSFER)
  {
    id: 'tr-ps-kiddy2',
    code: 'Kiddy 2',
    name: 'Siswa Pindahan Preschool - Kiddy 2',
    category: 'transfer',
    quota: 15,
    booked: 2,
    available: 13,
    slots: Array.from({ length: 15 }, (_, i) => ({
      number: i + 1,
      status: [1, 5].includes(i + 1) ? 'booked' : 'available',
      holder: [1, 5].includes(i + 1) ? 'Siswa Pindahan' : null
    }))
  },
  {
    id: 'tr-ps-k2',
    code: 'K2',
    name: 'Siswa Pindahan Preschool - K2',
    category: 'transfer',
    quota: 15,
    booked: 1,
    available: 14,
    slots: Array.from({ length: 15 }, (_, i) => ({
      number: i + 1,
      status: [3].includes(i + 1) ? 'booked' : 'available',
      holder: [3].includes(i + 1) ? 'Siswa Pindahan' : null
    }))
  },
  {
    id: 'tr-p2',
    code: 'Primary 2',
    name: 'Siswa Pindahan Primary - Primary 2',
    category: 'transfer',
    quota: 20,
    booked: 4,
    available: 16,
    slots: Array.from({ length: 20 }, (_, i) => ({
      number: i + 1,
      status: [2, 4, 7, 10].includes(i + 1) ? 'booked' : 'available',
      holder: [2, 4, 7, 10].includes(i + 1) ? 'Siswa Pindahan' : null
    }))
  },
  {
    id: 'tr-p3',
    code: 'Primary 3',
    name: 'Siswa Pindahan Primary - Primary 3',
    category: 'transfer',
    quota: 20,
    booked: 2,
    available: 18,
    slots: Array.from({ length: 20 }, (_, i) => ({
      number: i + 1,
      status: [1, 8].includes(i + 1) ? 'booked' : 'available',
      holder: [1, 8].includes(i + 1) ? 'Siswa Pindahan' : null
    }))
  },
  {
    id: 'tr-p4',
    code: 'Primary 4',
    name: 'Siswa Pindahan Primary - Primary 4',
    category: 'transfer',
    quota: 20,
    booked: 3,
    available: 17,
    slots: Array.from({ length: 20 }, (_, i) => ({
      number: i + 1,
      status: [3, 6, 9].includes(i + 1) ? 'booked' : 'available',
      holder: [3, 6, 9].includes(i + 1) ? 'Siswa Pindahan' : null
    }))
  },
  {
    id: 'tr-p5',
    code: 'Primary 5',
    name: 'Siswa Pindahan Primary - Primary 5',
    category: 'transfer',
    quota: 20,
    booked: 1,
    available: 19,
    slots: Array.from({ length: 20 }, (_, i) => ({
      number: i + 1,
      status: [4].includes(i + 1) ? 'booked' : 'available',
      holder: [4].includes(i + 1) ? 'Siswa Pindahan' : null
    }))
  },
  {
    id: 'tr-p6',
    code: 'Primary 6',
    name: 'Siswa Pindahan Primary - Primary 6',
    category: 'transfer',
    quota: 20,
    booked: 2,
    available: 18,
    slots: Array.from({ length: 20 }, (_, i) => ({
      number: i + 1,
      status: [2, 11].includes(i + 1) ? 'booked' : 'available',
      holder: [2, 11].includes(i + 1) ? 'Siswa Pindahan' : null
    }))
  },
  {
    id: 'tr-s1',
    code: 'Secondary 1',
    name: 'Siswa Pindahan Secondary - Secondary 1',
    category: 'transfer',
    quota: 15,
    booked: 2,
    available: 13,
    slots: Array.from({ length: 15 }, (_, i) => ({
      number: i + 1,
      status: [3, 7].includes(i + 1) ? 'booked' : 'available',
      holder: [3, 7].includes(i + 1) ? 'Siswa Pindahan' : null
    }))
  },
  {
    id: 'tr-s2',
    code: 'Secondary 2',
    name: 'Siswa Pindahan Secondary - Secondary 2',
    category: 'transfer',
    quota: 15,
    booked: 1,
    available: 14,
    slots: Array.from({ length: 15 }, (_, i) => ({
      number: i + 1,
      status: [5].includes(i + 1) ? 'booked' : 'available',
      holder: [5].includes(i + 1) ? 'Siswa Pindahan' : null
    }))
  },
  {
    id: 'tr-s3',
    code: 'Secondary 3',
    name: 'Siswa Pindahan Secondary - Secondary 3',
    category: 'transfer',
    quota: 15,
    booked: 1,
    available: 14,
    slots: Array.from({ length: 15 }, (_, i) => ({
      number: i + 1,
      status: [8].includes(i + 1) ? 'booked' : 'available',
      holder: [8].includes(i + 1) ? 'Siswa Pindahan' : null
    }))
  }
];

export default function OpenHousePage() {
  const [levels, setLevels] = useState<LevelQuota[]>(INITIAL_MOCK_LEVELS);
  
  const [selectedCategory, setSelectedCategory] = useState<'formal' | 'homeschooling' | 'transfer'>('formal');
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ levelId: string; slotNumber: number } | null>(null);
  
  const [parentSession, setParentSession] = useState<SavedParentSession | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnlineBackend, setIsOnlineBackend] = useState<boolean>(false);

  const fetchQuotaData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}?action=get_data`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
          setLevels(json.data);
          setIsOnlineBackend(true);
        }
      }
    } catch (err) {
      console.log('Backend fallback to client state');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuotaData();
  }, []);

const FIXED_LEVEL_ORDER = [
  'fs-kiddy1',
  'fs-kiddy2',
  'fs-k1',
  'fs-k2',
  'fs-p1',
  'fs-s1',
  'hs-p1',
  'hs-ls1',
  'hs-us1'
];

  const availableClassesInCategory = levels
    .filter((lvl) => lvl.category === selectedCategory)
    .sort((a, b) => {
      const idxA = FIXED_LEVEL_ORDER.indexOf(a.id);
      const idxB = FIXED_LEVEL_ORDER.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.id.localeCompare(b.id);
    });

  const activeLevelObj = selectedLevelId
    ? levels.find((l) => l.id === selectedLevelId)
    : null;

  const handleCategorySelect = (category: 'formal' | 'homeschooling' | 'transfer') => {
    setSelectedCategory(category);
    setSelectedLevelId(null);
  };

  const handleClassClickToRegister = (level: LevelQuota) => {
    const availableSlot = level.slots.find((s) => s.status === 'available');
    const slotNumberToUse = availableSlot ? availableSlot.number : 0; // 0 indicates Waiting List

    setSelectedLevelId(level.id);
    setSelectedSlot({ levelId: level.id, slotNumber: slotNumberToUse });
  };

  const handleRegistrationSuccess = (updatedParentSession: SavedParentSession) => {
    setParentSession(updatedParentSession);

    if (selectedSlot) {
      setLevels((prev) =>
        prev.map((lvl) => {
          if (lvl.id === selectedSlot.levelId) {
            if (selectedSlot.slotNumber === 0) {
              return {
                ...lvl,
                waitingList: (lvl.waitingList || 0) + 1
              };
            }
            const updatedSlots = lvl.slots.map((s) =>
              s.number === selectedSlot.slotNumber
                ? { ...s, status: 'booked' as const, holder: 'Baru Terdaftar' }
                : s
            );
            const bookedCount = updatedSlots.filter((s) => s.status === 'booked').length;
            return {
              ...lvl,
              booked: bookedCount,
              available: lvl.quota - bookedCount,
              slots: updatedSlots
            };
          }
          return lvl;
        })
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#293C88] font-poppins selection:bg-[#FED700] selection:text-[#293C88] pb-16">
      
      {/* Top Banner Status App & Admin Access Button */}
      <div className="bg-[#002B5B] text-white text-xs py-2.5 px-4 border-b border-blue-900/60 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between font-inter">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-white/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Portal Utama
            </Link>
            <span className="bg-[#FED700] text-[#293C88] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase hidden sm:flex items-center gap-1">
              <Zap className="w-3 h-3" /> Cloudflare Ready
            </span>
            <span className="text-slate-200 hidden md:inline">Pendaftaran Edelweiss Open House</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] text-blue-200 hidden md:flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Status DB: <strong>{isOnlineBackend ? 'Terhubung (phpMyAdmin Live)' : 'Demo Mode'}</strong></span>
            </div>

            <button
              onClick={fetchQuotaData}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition text-[11px] flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>

            {/* TOMBOL AKSES KE HALAMAN ADMIN */}
            <Link
              href="/admin/login"
              className="bg-[#FED700] hover:bg-[#e5c200] text-[#293C88] px-3 py-1.5 rounded-lg font-extrabold text-[11px] transition shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Admin Panel
            </Link>
          </div>
        </div>
      </div>

      {/* Header Utama Banner */}
      <section className="bg-gradient-to-r from-[#293C88] to-[#002B5B] text-white py-10 px-4 shadow-md">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3.5 py-1 rounded-full text-xs font-medium text-[#FED700] mb-3">
            <Sparkles className="w-4 h-4" /> Sistem Pendaftaran Edelweiss Open House
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-poppins text-white tracking-tight mb-3">
            Pendaftaran Open House Edelweiss
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto font-inter">
            Pilih program pendidikan &amp; klik kelas di bawah ini untuk langsung melakukan pendaftaran calon siswa.
          </p>
        </div>
      </section>

      {/* Section Utama Alur Pemilihan 2 Langkah */}
      <section className="max-w-4xl mx-auto px-4 -mt-5 relative z-20 space-y-6">
        
        {/* LANGKAH 1: PILIH PROGRAM UTAMA */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/80">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#293C88] text-white font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h2 className="text-base font-bold text-[#002B5B]">
              Langkah 1: Pilih Program / Jalur Pendaftaran
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Opsi 1: Edelweiss Formal School */}
            <button
              onClick={() => handleCategorySelect('formal')}
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                selectedCategory === 'formal'
                  ? 'border-[#293C88] bg-blue-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2.5 rounded-xl ${selectedCategory === 'formal' ? 'bg-[#293C88] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#002B5B]">Edelweiss Formal School</div>
                  <div className="text-[11px] text-slate-500">Preschool, Kindergarten, Primary 1, Sec 1</div>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#293C88] flex items-center justify-between pt-2 border-t border-slate-100">
                <span>Gedung Sekolah Utama</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* Opsi 2: Edelweiss Academia Home Schooling */}
            <button
              onClick={() => handleCategorySelect('homeschooling')}
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                selectedCategory === 'homeschooling'
                  ? 'border-[#293C88] bg-blue-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2.5 rounded-xl ${selectedCategory === 'homeschooling' ? 'bg-[#293C88] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#002B5B]">Edelweiss Academia</div>
                  <div className="text-[11px] text-slate-500">Home Schooling (Kuota @ 10)</div>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#293C88] flex items-center justify-between pt-2 border-t border-slate-100">
                <span>Primary 1, Lower &amp; Upper Sec 1</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>

        {/* LANGKAH 2: KLIK KELAS DAFAR LANGSUNG */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#293C88] text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h2 className="text-base font-bold text-[#002B5B]">
                Langkah 2: Klik Kelas Untuk Langsung mendaftar (
                {selectedCategory === 'formal' && 'Edelweiss Formal School'}
                {selectedCategory === 'homeschooling' && 'Academia Home Schooling'}
                )
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-4 font-medium">
            👇 Silakan **klik pada salah satu kotak kelas** di bawah ini yang masih memiliki sisa kuota untuk membuka form registrasi data diri calon siswa:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {availableClassesInCategory.map((lvl) => {
              const isFull = lvl.available <= 0;
              const wlCount = lvl.waitingList || 0;
              return (
                <button
                  key={lvl.id}
                  onClick={() => handleClassClickToRegister(lvl)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative group flex flex-col justify-between ${
                    isFull
                      ? 'border-amber-300 bg-amber-50/70 hover:bg-amber-100/80 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                      : 'border-blue-100 hover:border-[#293C88] bg-slate-50/70 hover:bg-blue-50/60 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#293C88]">
                        Kelas {lvl.code}
                      </span>
                      {isFull ? (
                        <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                          Waiting List
                        </span>
                      ) : (
                        <span className="bg-[#FED700] text-[#293C88] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Daftar &rarr;
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-bold text-[#002B5B] line-clamp-1">
                      {lvl.name}
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {isFull ? 'Waiting List:' : 'Sisa Kuota:'}
                    </span>
                    {isFull ? (
                      <span className="text-xs font-extrabold text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded-lg border border-amber-300">
                        {wlCount > 0 ? `${wlCount} Orang Antri` : 'Daftar Waiting List'}
                      </span>
                    ) : (
                      <span className="text-sm font-extrabold text-emerald-600">
                        {lvl.available} / {lvl.quota} Kursi
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-Child Session Info */}
        {parentSession && parentSession.registeredChildren.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <div>
                <strong>Histori Orang Tua:</strong> {parentSession.parent_name} ({parentSession.whatsapp})
                <div className="text-[11px] text-emerald-700">
                  Sudah mendaftarkan: {parentSession.registeredChildren.join(', ')}
                </div>
              </div>
            </div>
            <span className="bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-full text-[10px] font-bold">
              Multi-Child Session
            </span>
          </div>
        )}
      </section>

      {/* Modal Pendaftaran Data Diri */}
      {selectedSlot && activeLevelObj && (
        <RegistrationModal
          level={activeLevelObj}
          slotNumber={selectedSlot.slotNumber}
          isTransferMenu={selectedCategory === 'transfer'}
          isWaitingList={activeLevelObj.available <= 0 || selectedSlot.slotNumber === 0}
          savedParentSession={parentSession}
          onClose={() => {
            setSelectedSlot(null);
            setSelectedLevelId(null);
          }}
          onSuccess={handleRegistrationSuccess}
          apiBaseUrl={API_BASE_URL}
        />
      )}
    </main>
  );
}
