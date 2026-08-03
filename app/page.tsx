'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  School, 
  Calendar, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Info,
  ArrowRight,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function LinktreeHomePage() {
  const [showSchedule, setShowSchedule] = useState(false);

  const PRA_OPENHOUSE_FORM_URL = 'https://forms.cloud.microsoft/r/qhcqbW8f3P';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-poppins flex flex-col justify-between selection:bg-[#FED700] selection:text-[#002B5B]">
      
      {/* Top Subtle Decoration Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#002B5B] via-[#293C88] to-[#FED700]" />

      {/* Main Container */}
      <main className="w-full max-w-lg mx-auto px-4 py-8 sm:py-12 space-y-6">
        
        {/* Header / Brand Profile Section */}
        <div className="text-center space-y-3">
          <div className="inline-block relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 shadow-md flex items-center justify-center mx-auto border-4 border-white bg-white overflow-hidden">
              <img src="/logo-square.png" alt="Edelweiss School Logo" className="w-full h-full object-contain p-2" />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#293C88] px-3 py-1 rounded-full text-[11px] font-bold border border-blue-100 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#293C88]" /> Portal Pendaftaran Resmi
            </span>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#002B5B] tracking-tight font-poppins mt-2">
              Edelweiss School
            </h1>

            <p className="text-xs text-slate-500 font-inter max-w-xs mx-auto mt-1 leading-relaxed">
              Silakan pilih jalur pendaftaran di bawah ini:
            </p>
          </div>
        </div>

        {/* LINKTREE CARDS SECTION */}
        <div className="space-y-4">
          
          {/* CARD 1: DAFTAR PRA OPEN HOUSE (SCHOOL TOUR) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4">
            
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                  <Calendar className="w-3 h-3 text-amber-600" /> 1. PRA OPEN HOUSE
                </span>
                <h2 className="text-base font-extrabold text-[#002B5B]">
                  Pendaftaran Pra Open House
                </h2>
              </div>

              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <p className="text-xs text-slate-600 font-inter leading-relaxed">
              Ikuti <strong>School Tour</strong> &amp; pengenalan fasilitas lingkungan belajar Edelweiss School sebelum Open House Utama.
            </p>

            {/* Tombol Aksi Utama Pra Open House */}
            <div className="space-y-2">
              <a
                href={PRA_OPENHOUSE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#FED700] hover:bg-[#e5c200] text-[#002B5B] font-extrabold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer text-center"
              >
                <span>Daftar Pra Open House (School Tour)</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#002B5B]" />
              </a>

              {/* Toggle Ringkasan Jadwal */}
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className="w-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold py-2 px-3 rounded-xl text-[11px] transition flex items-center justify-center gap-1"
              >
                <span>{showSchedule ? 'Sembunyikan Jadwal' : 'Lihat Jadwal School Tour'}</span>
                {showSchedule ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Expander Jadwal Clean & Ultra Structured */}
            {showSchedule && (
              <div className="bg-gradient-to-b from-amber-50/90 to-[#FFFBEB] p-4 rounded-2xl border border-amber-200 shadow-xs text-xs space-y-3.5 animate-fadeIn">
                
                {/* Header Jadwal */}
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#002B5B]">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>JADWAL PRA OPEN HOUSE - SCHOOL TOUR</span>
                  </div>
                  <span className="bg-amber-200/80 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Agustus 2026
                  </span>
                </div>

                {/* 1. WEEKDAY */}
                <div className="bg-white rounded-xl p-3 border border-amber-200/70 space-y-2 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-1 font-bold text-[#002B5B]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      1. Weekday
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                      3 - 7 Agt &amp; 10 - 13 Agt 2026
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 pt-1 text-[11px]">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100/60">
                      <span className="font-semibold text-slate-700">🧸 Kiddy &amp; Kindergarten</span>
                      <span className="font-extrabold text-[#002B5B] bg-white px-2 py-0.5 rounded border border-amber-200">13.00 – 16.00 WIB</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100/60">
                      <span className="font-semibold text-slate-700">🎒 SD (Primary)</span>
                      <span className="font-extrabold text-[#002B5B] bg-white px-2 py-0.5 rounded border border-amber-200">15.00 – 17.00 WIB</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100/60">
                      <span className="font-semibold text-slate-700">🎓 SMP (Secondary)</span>
                      <span className="font-extrabold text-[#002B5B] bg-white px-2 py-0.5 rounded border border-amber-200">15.00 – 17.00 WIB</span>
                    </div>
                  </div>
                </div>

                {/* 2. WEEKEND */}
                <div className="bg-white rounded-xl p-3 border border-amber-200/70 space-y-2 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-1 font-bold text-[#002B5B]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      2. Weekend (Sabtu)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
                      8 Agustus 2026
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/40 border border-emerald-100 text-[11px]">
                    <span className="font-semibold text-slate-700">🏫 Semua Jenjang (Preschool, SD, SMP)</span>
                    <span className="font-extrabold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">09.00 – 16.00 WIB</span>
                  </div>
                </div>

                {/* 3. LOKASI */}
                <div className="bg-[#002B5B] text-white p-3 rounded-xl flex items-start gap-2.5 shadow-2xs">
                  <MapPin className="w-4 h-4 text-[#FED700] shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-tight">
                    <strong className="text-[#FED700] block mb-0.5">Lokasi School Tour:</strong>
                    <span className="text-slate-100">Edelweiss Jatibening Estate &amp; Edelweiss Ratna</span>
                  </div>
                </div>

              </div>
            )}

          </div>


          {/* CARD 2: DAFTAR OPEN HOUSE UTAMA */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4">
            
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 bg-blue-100 text-[#293C88] font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                  <Building2 className="w-3 h-3 text-[#293C88]" /> 2. OPEN HOUSE UTAMA
                </span>
                <h2 className="text-base font-extrabold text-[#002B5B]">
                  Pendaftaran Open House Utama
                </h2>
              </div>

              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#293C88] flex items-center justify-center shrink-0 border border-blue-100">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <p className="text-xs text-slate-600 font-inter leading-relaxed">
              Pilih program sekolah (Formal, Home Schooling, Pindahan), booking nomor kursi kuota, dan dapatkan <strong>E-Tiket Resmi</strong>.
            </p>

            {/* Tombol Aksi Utama Open House */}
            <Link
              href="/openhouse"
              className="w-full bg-[#002B5B] hover:bg-[#293C88] text-white font-extrabold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer text-center"
            >
              <span>Masuk Pendaftaran Open House</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FED700]" />
            </Link>

          </div>

        </div>

        {/* Footer Admin Link */}
        <div className="text-center pt-2">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#002B5B] transition py-1 px-2 rounded-md"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Login Panel Admin</span>
          </Link>
        </div>

      </main>

      {/* Clean Footer Copyright */}
      <footer className="w-full text-center py-4 border-t border-slate-200 text-[11px] text-slate-400 font-inter">
        &copy; 2026 Edelweiss School. All rights reserved.
      </footer>

    </div>
  );
}
