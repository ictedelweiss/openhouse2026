'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User, Sparkles, ArrowLeft, KeyRound } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}?action=admin_login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await res.json();

      if (result.status === 'success') {
        localStorage.setItem('adminToken', result.token || 'LOGGED_IN');
        localStorage.setItem('adminUser', JSON.stringify(result.admin || { name: 'Administrator', username }));
        router.push('/admin/dashboard');
      } else {
        setErrorMsg(result.message || 'Username atau password salah.');
      }
    } catch (err) {
      // Fallback auth jika backend offline saat pengujian dev
      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('adminToken', 'LOGGED_IN_LOCAL');
        localStorage.setItem('adminUser', JSON.stringify({ name: 'Administrator Edelweiss', username: 'admin' }));
        router.push('/admin/dashboard');
      } else {
        setErrorMsg('Username/password salah! (Gunakan: admin / admin123)');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#293C88] via-[#1d2c68] to-[#002B5B] flex items-center justify-center p-4 font-poppins relative overflow-hidden">
      
      {/* Decorative Blur Effect */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-[#FED700]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-white/20 relative z-10">
        
        {/* Back Link */}
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#293C88] mb-6 font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Utama
        </a>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#293C88] text-[#FED700] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg ring-4 ring-blue-50">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#002B5B]">
            Admin Panel Login
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Edelweiss Open House Management System
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#293C88]" /> Username Admin
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username (admin)"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#293C88] text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#293C88]" /> Password Admin
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password (admin123)"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#293C88] text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#FED700] hover:bg-[#e5c200] text-[#293C88] font-extrabold text-sm transition shadow-md hover:shadow-xl mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Memverifikasi Auth...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Masuk Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Demo Default Auth: <strong className="text-slate-700">admin</strong> / <strong className="text-slate-700">admin123</strong>
        </div>
      </div>
    </main>
  );
}
