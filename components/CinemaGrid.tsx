import { LevelQuota } from '@/types/registration';
import { UserCheck, Lock } from 'lucide-react';

interface CinemaGridProps {
  level: LevelQuota;
  onSelectSlot: (levelId: string, slotNumber: number) => void;
}

export default function CinemaGrid({ level, onSelectSlot }: CinemaGridProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80">
      
      {/* Header Informasi Kelas & Sisa Kuota */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#293C88] text-white px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide">
              Kelas {level.code}
            </span>
            <span className="text-xs text-slate-500 font-medium">Kapasitas Kelas: {level.quota} Siswa</span>
          </div>
          <h3 className="text-xl font-bold text-[#002B5B] mt-1 font-poppins">
            {level.name}
          </h3>
        </div>

        {/* Ringkasan Sisa Kuota Terbuka */}
        <div className="bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Sisa Tempat Duduk:</span>
            <span className="text-base font-extrabold text-emerald-600 font-poppins">
              {level.available} <span className="text-xs font-normal text-slate-500">dari {level.quota} Kursi Tersedia</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200">
            {level.available}
          </div>
        </div>
      </div>

      {/* Grid Kotak Tempat Duduk / Slot Kelas */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-3 font-medium flex items-center gap-1.5">
          👉 Klik salah satu <strong className="text-[#293C88]">Kotak Nomor Kursi</strong> di bawah ini yang berwarna hijau untuk memilih tempat duduk calon siswa:
        </p>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
          {level.slots.map((slot) => {
            const isBooked = slot.status === 'booked';

            return (
              <button
                key={slot.number}
                disabled={isBooked}
                onClick={() => onSelectSlot(level.id, slot.number)}
                title={
                  isBooked
                    ? `Kursi #${slot.number} Sudah Terisi`
                    : `Klik untuk mendaftar di Kursi #${slot.number}`
                }
                className={`
                  relative flex flex-col items-center justify-center h-12 rounded-xl text-xs font-bold transition-all duration-150
                  ${
                    isBooked
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : 'bg-emerald-50 hover:bg-[#FED700] text-emerald-800 hover:text-[#293C88] border-2 border-emerald-300 hover:border-[#FED700] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95'
                  }
                `}
              >
                <div className="flex items-center gap-1">
                  {isBooked ? (
                    <Lock className="w-3 h-3 text-slate-400" />
                  ) : (
                    <UserCheck className="w-3 h-3 text-emerald-600 group-hover:text-[#293C88]" />
                  )}
                  <span>#{slot.number}</span>
                </div>
                <span className={`text-[9px] font-normal leading-none mt-0.5 ${isBooked ? 'text-slate-400' : 'text-emerald-700'}`}>
                  {isBooked ? 'Terisi' : 'Kosong'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Keterangan Warna Sederhana */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-600 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-emerald-50 border-2 border-emerald-300"></div>
          <span className="font-medium">Kursi Kosong (Bisa Diklik)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-slate-200 border border-slate-300"></div>
          <span className="font-medium">Kursi Sudah Terisi</span>
        </div>
      </div>
    </div>
  );
}
