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
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#002B5B] text-[#FED700] rounded-full p-4 shadow-md flex items-center justify-center mx-auto border-4 border-white">
              <School className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#293C88] px-3 py-1 rounded-full text-[11px] font-bold border border-blue-100 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#293C88]" /> Portal Pendaftaran Resmi
            </span>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#002B5B] tracking-tight font-poppins">
              Edelweiss Learning Center
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
              Ikuti <strong>School Tour</strong> &amp; pengenalan fasilitas lingkungan belajar Edelweiss sebelum Open House Utama.
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

            {/* Expander Jadwal Clean */}
            {showSchedule && (
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 text-xs space-y-3 text-amber-950 font-inter animate-fadeIn">
                <div className="font-bold text-[#002B5B] border-b border-amber-200/60 pb-1.5 flex items-center justify-between">
                  <span>Jadwal Pra Open House - School Tour</span>
                  <span className="text-[10px] text-amber-800 font-normal">Agustus 2026</span>
                </div>

                {/* Weekday */}
                <div className="space-y-1">
                  <strong className="block text-[#002B5B]">1. Weekday (Senin - Jumat)</strong>
                  <p className="text-[11px] text-slate-600">📅 Tanggal: 3 - 7 Agt &amp; 10 - 14 Agt 2026</p>
                  <ul className="text-[11px] text-slate-700 pl-3 list-disc space-y-0.5 mt-1">
                    <li>Kiddy &amp; Kindergarten: 13.00 - 16.00 WIB</li>
                    <li>SD (Primary): 15.00 - 17.00 WIB</li>
                    <li>SMP (Secondary): 15.00 - 17.00 WIB</li>
                  </ul>
                </div>

                {/* Weekend */}
                <div className="space-y-1 pt-1 border-t border-amber-200/60">
                  <strong className="block text-[#002B5B]">2. Weekend (Sabtu)</strong>
                  <p className="text-[11px] text-slate-600">📅 Tanggal: 8 Agustus 2026</p>
                  <p className="text-[11px] text-slate-700">Pukul (Semua Jenjang): 09.00 - 16.00 WIB</p>
                </div>

                {/* Lokasi */}
                <div className="pt-1 border-t border-amber-200/60 text-[11px]">
                  <strong className="text-[#002B5B] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" /> Lokasi:
                  </strong>
                  <span className="text-slate-700 block mt-0.5">Edelweiss Jatibening Estate &amp; Edelweiss Ratna</span>
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
        &copy; 2026 Edelweiss Learning Center. All rights reserved.
      </footer>

    </div>
  );
}
