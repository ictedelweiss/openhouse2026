export interface Slot {
  number: number;
  status: 'available' | 'reserved' | 'booked';
  holder?: string | null;
}

export interface LevelQuota {
  id: string;
  name: string;
  code: string;
  category: 'formal' | 'homeschooling' | 'transfer';
  quota: number;
  booked: number;
  available: number;
  slots: Slot[];
}

export interface RegistrationFormData {
  level_id: string;
  slot_number: number;
  registration_type: 'new' | 'transfer';
  child_name: string;
  birth_date: string; // HTML5 date string (YYYY-MM-DD)
  gender: 'L' | 'P';
  parent_name: string;
  whatsapp: string;
  email: string; // Mandatory
  school_origin: string;
  attendance_session: string; // e.g. "Hari 1: Sabtu, 8 Agustus 2026 (08.00 - 10.00)"
  payment_method: 'pay_now' | 'pay_onsite';
  payment_proof?: string | null; // Base64 atau URL file bukti bayar
}

export interface SavedParentSession {
  parent_name: string;
  whatsapp: string;
  email: string;
  registeredChildren: string[];
}
