'use client';

import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck, User } from 'lucide-react';

interface AdminNavbarProps {
  adminName?: string;
  isLiveDb?: boolean;
}

export default function AdminNavbar({ adminName = 'Administrator', isLiveDb = false }: AdminNavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  return (
    <header className="bg-[#002B5B] text-white py-3 px-6 shadow-md border-b border-blue-900 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Admin Title */}
        <div className="flex items-center gap-3">
          <div className="bg-[#FED700] text-[#293C88] p-1.5 rounded-lg font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold font-poppins text-white leading-tight">
              Edelweiss Open House Dashboard
            </h1>
            <span className="text-[11px] text-blue-200 block">
              Panel Pengelola System &amp; Data Pendaftar
            </span>
          </div>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-blue-950/80 px-3 py-1.5 rounded-xl border border-blue-800/60 text-xs">
            <User className="w-3.5 h-3.5 text-[#FED700]" />
            <span className="text-slate-200">Hi, <strong>{adminName}</strong></span>
          </div>

          <button
            onClick={handleLogout}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
