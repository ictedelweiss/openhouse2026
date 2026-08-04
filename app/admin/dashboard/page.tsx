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
  payment_status?: 'pending' | 'verified' | 'rejected';
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

interface AdminRecord {
  id: number;
  username: string;
  name: string;
  created_at: string;
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
