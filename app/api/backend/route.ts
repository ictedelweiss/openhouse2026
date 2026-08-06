import { NextRequest, NextResponse } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';

// Helper to get D1 and R2 bindings safely in Cloudflare environment
function getBindings() {
  let db, bucket, envObj;
  try {
    const { env } = getCloudflareContext();
    envObj = env;
    db = (env as any).DB;
    bucket = (env as any).UPLOAD_BUCKET;
  } catch (e) {
    envObj = process.env;
    db = (process.env.DB || (globalThis as any).DB) as any;
    bucket = (process.env.UPLOAD_BUCKET || (globalThis as any).UPLOAD_BUCKET) as any;
  }
  return { db, bucket, env: envObj };
}

// MS Graph API Email Helper
async function sendEmailViaGraphAPI(env: any, to: string, subject: string, htmlBody: string) {
  try {
    const tenantId = (env as any)?.MS_TENANT_ID || (process.env as any).MS_TENANT_ID;
    const clientId = (env as any)?.MS_CLIENT_ID || (process.env as any).MS_CLIENT_ID;
    const clientSecret = (env as any)?.MS_CLIENT_SECRET || (process.env as any).MS_CLIENT_SECRET;
    const senderEmail = (env as any)?.MS_SENDER_EMAIL || (process.env as any).MS_SENDER_EMAIL;

    if (!tenantId || !clientId || !clientSecret || !senderEmail) {
      console.error('Missing MS Graph credentials in environment variables');
      return false;
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenBody = new URLSearchParams();
    tokenBody.append('grant_type', 'client_credentials');
    tokenBody.append('client_id', clientId);
    tokenBody.append('client_secret', clientSecret);
    tokenBody.append('scope', 'https://graph.microsoft.com/.default');

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    });

    if (!tokenRes.ok) {
      console.error('Failed to get MS Graph token:', await tokenRes.text());
      return false;
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const sendUrl = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`;
    const emailPayload = {
      message: {
        subject: subject,
        body: { contentType: 'HTML', content: htmlBody },
        toRecipients: [{ emailAddress: { address: to } }]
      },
      saveToSentItems: false
    };

    const sendRes = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!sendRes.ok) {
      console.error('Failed to send email:', await sendRes.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in sendEmailViaGraphAPI:', error);
    return false;
  }
}

// Generate unique ID for files
function generateFileId(extension: string) {
  const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 15);
  const random = Math.random().toString(36).substring(2, 8);
  return `proof_${dateStr}_${random}.${extension}`;
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}

async function handleRequest(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || '';
  const { db, bucket, env } = getBindings();

  if (!db) {
    return NextResponse.json({ status: 'error', message: 'D1 Database binding not found' }, { status: 500 });
  }

  try {
    // 0. UPLOAD FILE
    if (action === 'upload_file' && request.method === 'POST') {
      if (!bucket) return NextResponse.json({ status: 'error', message: 'R2 Bucket not found' });
      
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ status: 'error', message: 'Tidak ada file yang dikirim.' });

      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ status: 'error', message: 'Ukuran file terlalu besar. Maksimal 2MB.' });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ status: 'error', message: 'Tipe file tidak diizinkan.' });
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const uniqueName = generateFileId(ext);
      
      const buffer = await file.arrayBuffer();
      await bucket.put(uniqueName, buffer, {
        httpMetadata: { contentType: file.type }
      });

      // We'll serve files via a custom route /api/assets?key=
      const fileUrl = `/api/assets?key=${uniqueName}`;
      
      return NextResponse.json({
        status: 'success',
        file_url: fileUrl,
        file_name: uniqueName
      });
    }

    // 1. ADMIN LOGIN
    if (action === 'admin_login' && request.method === 'POST') {
      const input = await request.json() as any;
      const username = input.username?.trim() || '';
      const password = input.password?.trim() || '';

      if (!username || !password) {
        return NextResponse.json({ status: 'error', message: 'Username dan Password wajib diisi.' });
      }

      if (username === 'admin' && (password === 'Edelweiss2026' || password === 'admin123')) {
        return NextResponse.json({
          status: 'success',
          message: 'Login Admin Berhasil!',
          token: 'ADMIN-TOKEN-SECURE-' + Date.now(),
          admin: { name: 'Administrator Edelweiss', username: 'admin' }
        });
      }

      const res = await db.prepare("SELECT * FROM admins WHERE username = ? AND password = ?").bind(username, password).first();
      if (res) {
        return NextResponse.json({
          status: 'success',
          message: 'Login Admin Berhasil!',
          token: 'ADMIN-TOKEN-SECURE-' + Date.now(),
          admin: { name: res.name, username: res.username }
        });
      }
      return NextResponse.json({ status: 'error', message: 'Username atau Password salah!' });
    }

    // 2. GET ALL LEVELS & SLOTS
    if (action === 'get_data' && request.method === 'GET') {
      const orderCase = `
        CASE l.id
          WHEN 'fs-kiddy1' THEN 1 WHEN 'fs-kiddy2' THEN 2 WHEN 'fs-k1' THEN 3 WHEN 'fs-k2' THEN 4
          WHEN 'fs-p1' THEN 5 WHEN 'fs-s1' THEN 6 WHEN 'hs-p1' THEN 7 WHEN 'hs-ls1' THEN 8 WHEN 'hs-us1' THEN 9
          ELSE 10
        END`;
      
      const query = `
        SELECT 
            l.id, l.name, l.code, l.category, l.quota,
            s.slot_number, s.status as slot_status, s.holder_name,
            (SELECT COUNT(*) FROM registrations r WHERE r.level_id = l.id AND r.slot_number = 0) as waiting_count
        FROM levels l
        LEFT JOIN slots s ON l.id = s.level_id
        ORDER BY ${orderCase}, s.slot_number ASC
      `;
      
      const { results } = await db.prepare(query).all();
      const levelsMap: Record<string, any> = {};
      
      for (const row of results as any[]) {
        if (!levelsMap[row.id]) {
          levelsMap[row.id] = {
            id: row.id, name: row.name, code: row.code, category: row.category,
            quota: row.quota, booked: 0, available: row.quota,
            waitingList: row.waiting_count || 0, slots: []
          };
        }
        if (row.slot_number !== null) {
          const isBooked = row.slot_status === 'booked';
          levelsMap[row.id].slots.push({
            number: row.slot_number, status: row.slot_status, holder: row.holder_name
          });
          if (isBooked) levelsMap[row.id].booked++;
        }
      }
      
      const data = Object.values(levelsMap).map((lvl: any) => ({
        ...lvl, available: Math.max(0, lvl.quota - lvl.booked)
      }));
      
      return NextResponse.json({ status: 'success', data });
    }

    // 3. GET REGISTRATIONS
    if (action === 'get_registrations' && request.method === 'GET') {
      const { results } = await db.prepare(`
        SELECT r.*, l.name as level_name, l.code as level_code, l.category as level_category 
        FROM registrations r JOIN levels l ON r.level_id = l.id ORDER BY r.id DESC
      `).all();
      return NextResponse.json({ status: 'success', data: results });
    }

    // 4. REGISTER
    if (action === 'register' && request.method === 'POST') {
      const input = await request.json() as any;
      if (!input) return NextResponse.json({ status: 'error', message: 'Invalid JSON input' });

      const level_id = input.level_id || '';
      const slot_number = parseInt(input.slot_number) || 0;
      const registration_type = input.registration_type || 'new';
      const child_name = input.child_name || '';
      const birth_date = input.birth_date || '';
      const gender = input.gender || 'Laki-laki';
      const parent_name = input.parent_name || '';
      const whatsapp = input.whatsapp || '';
      const email = input.email || '';
      const school_origin = input.school_origin || '';
      let attendance_session = input.attendance_session || '';
      let payment_method = input.payment_method || 'pay_now';
      const payment_proof = input.payment_proof || '';

      const is_waiting_list = slot_number === 0 || registration_type === 'waiting_list';
      if (is_waiting_list) {
        if (!attendance_session || attendance_session === 'Waiting List') attendance_session = 'Waiting List (Antrean Kuota)';
        payment_method = 'pay_onsite';
      }

      if (!level_id || slot_number < 0 || !child_name || !birth_date || !parent_name || !whatsapp || !email || !attendance_session) {
        return NextResponse.json({ status: 'error', message: 'Lengkapi seluruh data wajib.' });
      }

      const prefix = is_waiting_list ? 'WAIT' : (registration_type === 'transfer' ? 'TRF' : 'NEW');
      const ticket_code = `ELC-${prefix}-${is_waiting_list ? 'WL' : slot_number.toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

      // Use a batch for transaction-like behaviour in D1
      const stmts = [];
      if (!is_waiting_list) {
        stmts.push(db.prepare("UPDATE slots SET status = 'booked', holder_name = ? WHERE level_id = ? AND slot_number = ?").bind(child_name, level_id, slot_number));
      }
      stmts.push(
        db.prepare(`INSERT INTO registrations (ticket_code, level_id, slot_number, registration_type, child_name, birth_date, gender, parent_name, whatsapp, email, school_origin, attendance_session, payment_method, payment_proof) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(ticket_code, level_id, slot_number, registration_type, child_name, birth_date, gender, parent_name, whatsapp, email, school_origin, attendance_session, payment_method, payment_proof)
      );

      await db.batch(stmts);

      let level_name = level_id;
      try {
        const levelObj = await db.prepare("SELECT name FROM levels WHERE id = ?").bind(level_id).first();
        if (levelObj) level_name = (levelObj as any).name;
      } catch (e) {}

      // --- Send Emails ---
      try {
        const { ctx } = getCloudflareContext();
        if (ctx && ctx.waitUntil) {
          const parentSubject = "Pendaftaran Berhasil - Edelweiss Open House 2026";
          const parentHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="background-color: #002B5B; padding: 20px; text-align: center;">
                <h1 style="color: #FED700; margin: 0; font-size: 24px;">Edelweiss School</h1>
              </div>
              <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                <h2 style="color: #002B5B;">Halo Bapak/Ibu dari ${child_name},</h2>
                <p>Terima kasih telah mendaftar di <strong>Openhouse Edelweiss School TA 2026-2027</strong>.</p>
                <p>Pendaftaran Anda telah kami terima dengan detail sebagai berikut:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee; width: 40%;"><strong>Nama Anak</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${child_name}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Jenjang yang dituju</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${level_name}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Sesi Kehadiran</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${attendance_session}</td></tr>
                </table>
                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #002B5B; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #002B5B;">Langkah Selanjutnya:</h3>
                  <p>Silakan datang pada waktu yang tertera di atas dan menunjukkan email berikut kepada staff kami.</p>
                </div>
                <p>Jika ada pertanyaan, silakan hubungi Customer Service kami melalui WhatsApp di <a href="https://wa.me/628118817757">0811-8817-757</a>.</p>
                <p>Salam hangat,<br><strong>Tim Penerimaan Siswa Baru Edelweiss School</strong></p>
              </div>
            </div>
          `;

          const adminSubject = `Pendaftar Baru: ${child_name} - ${ticket_code}`;
          const adminHtml = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #002B5B; padding: 15px 20px;">
                <h2 style="color: #ffffff; margin: 0; font-size: 18px;">Pendaftar Baru Open House 2026</h2>
              </div>
              <div style="padding: 20px;">
                <p>Halo Admin,</p>
                <p>Telah masuk pendaftar baru dengan rincian sebagai berikut:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                  <tr><td style="padding: 10px; border-bottom: 1px solid #eee; width: 35%; color: #666;"><strong>Kode Tiket</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #002B5B;">${ticket_code}</td></tr>
                  <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;"><strong>Nama Anak</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${child_name}</td></tr>
                  <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;"><strong>Program / Level</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${level_name}</td></tr>
                  <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;"><strong>Nama Orang Tua</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${parent_name}</td></tr>
                  <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;"><strong>WhatsApp</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="https://wa.me/62${whatsapp.startsWith('0') ? whatsapp.slice(1) : whatsapp}" style="color: #25D366; text-decoration: none; font-weight: bold;">${whatsapp}</a></td></tr>
                  <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;"><strong>Email</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${email}</td></tr>
                  <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;"><strong>Metode Pembayaran</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${payment_method === 'pay_now' ? '<span style="color: #002B5B; font-weight: bold;">Transfer</span>' : '<span style="color: #e67e22; font-weight: bold;">Bayar di Tempat</span>'}</td></tr>
                </table>
                <p style="margin-top: 20px; font-size: 14px; color: #666;">Silakan login ke <a href="https://openhouse.edelweiss.sch.id/admin/login" style="color: #002B5B; font-weight: bold;">Dashboard Admin</a> untuk melihat detail lebih lanjut.</p>
              </div>
            </div>
          `;

          const adminEmail = (env as any)?.MS_SENDER_EMAIL || (process.env as any).MS_SENDER_EMAIL || "oh@edelweiss.sch.id";

          ctx.waitUntil(sendEmailViaGraphAPI(env, email, parentSubject, parentHtml));
          ctx.waitUntil(sendEmailViaGraphAPI(env, adminEmail, adminSubject, adminHtml));
        }
      } catch (e) {
        console.error("Failed to schedule emails", e);
      }

      return NextResponse.json({
        status: 'success',
        message: is_waiting_list ? 'Pendaftaran Waiting List berhasil!' : 'Pendaftaran berhasil disimpan!',
        ticket_code, slot_number, is_waiting_list
      });
    }

    // 5. UPDATE PAYMENT PROOF
    if (action === 'upload_payment_proof' && request.method === 'POST') {
      const formData = await request.formData();
      const id = parseInt(formData.get('id') as string) || 0;
      const file = formData.get('file') as File | null;
      
      if (id <= 0 || !file) return NextResponse.json({ status: 'error', message: 'Data tidak valid.' });
      if (!bucket) return NextResponse.json({ status: 'error', message: 'R2 Bucket not found' });
      
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const uniqueName = generateFileId(ext);
      const buffer = await file.arrayBuffer();
      await bucket.put(uniqueName, buffer, { httpMetadata: { contentType: file.type } });
      const fileUrl = `/api/assets?key=${uniqueName}`;

      await db.prepare("UPDATE registrations SET payment_proof = ? WHERE id = ?").bind(fileUrl, id).run();
      return NextResponse.json({ status: 'success', message: 'Bukti pembayaran di-upload!', file_url: fileUrl });
    }

    // 6. DELETE REGISTRATION
    if (action === 'delete_registration' && request.method === 'POST') {
      const input = await request.json() as any;
      const id = parseInt(input.id) || 0;
      if (id <= 0) return NextResponse.json({ status: 'error', message: 'ID tidak valid.' });

      const reg = await db.prepare("SELECT level_id, slot_number, payment_proof FROM registrations WHERE id = ?").bind(id).first();
      if (reg) {
        const stmts = [];
        stmts.push(db.prepare("UPDATE slots SET status = 'available', holder_name = NULL WHERE level_id = ? AND slot_number = ?").bind((reg as any).level_id, (reg as any).slot_number));
        stmts.push(db.prepare("DELETE FROM registrations WHERE id = ?").bind(id));
        await db.batch(stmts);

        // Delete from R2 if possible
        if (bucket && (reg as any).payment_proof && typeof (reg as any).payment_proof === 'string' && (reg as any).payment_proof.includes('key=')) {
          const key = new URL((reg as any).payment_proof, 'http://localhost').searchParams.get('key');
          if (key) await bucket.delete(key);
        }
      }
      return NextResponse.json({ status: 'success', message: 'Dihapus.' });
    }

    // 7. GET SCHEDULES
    if (action === 'get_schedules' && request.method === 'GET') {
      const { results } = await db.prepare(`
        SELECT s.id, s.date, s.start_time, s.end_time, s.level, s.capacity, COALESCE(cnt.allocated_count, 0) as allocated_count
        FROM assessment_schedules s
        LEFT JOIN (SELECT schedule_id, COUNT(*) as allocated_count FROM assessment_allocations GROUP BY schedule_id) cnt ON cnt.schedule_id = s.id
        ORDER BY s.date ASC, s.start_time ASC
      `).all();
      return NextResponse.json({ status: 'success', data: results });
    }

    // 8. CREATE SCHEDULE
    if (action === 'create_schedule' && request.method === 'POST') {
      const input = await request.json() as any;
      if (!input.date || !input.start_time || !input.end_time || !input.level) {
        return NextResponse.json({ status: 'error', message: 'Kolom wajib diisi.' });
      }
      let cap = parseInt(input.capacity) || 10;
      if (input.level === 'kiddy') cap = 1; else cap = Math.min(Math.max(cap, 1), 10);
      
      await db.prepare("INSERT INTO assessment_schedules (date, start_time, end_time, level, capacity) VALUES (?, ?, ?, ?, ?)")
        .bind(input.date, input.start_time, input.end_time, input.level, cap).run();
      return NextResponse.json({ status: 'success', message: 'Tersimpan.' });
    }

    // 9. DELETE SCHEDULE
    if (action === 'delete_schedule' && request.method === 'POST') {
      const input = await request.json() as any;
      const id = parseInt(input.id) || 0;
      const check = await db.prepare("SELECT COUNT(*) as c FROM assessment_allocations WHERE schedule_id = ?").bind(id).first();
      if ((check as any)?.c > 0) return NextResponse.json({ status: 'error', message: 'Sudah ada alokasi siswa.' });
      await db.prepare("DELETE FROM assessment_schedules WHERE id = ?").bind(id).run();
      return NextResponse.json({ status: 'success', message: 'Dihapus.' });
    }

    // 10. GET UNALLOCATED STUDENTS
    if (action === 'get_unallocated_students' && request.method === 'GET') {
      const lvl = url.searchParams.get('level') || '';
      const { results } = await db.prepare(`
        SELECT r.id, r.child_name, r.ticket_code, r.level_id, l.name as level_name 
        FROM registrations r JOIN levels l ON r.level_id = l.id
        LEFT JOIN assessment_allocations a ON r.id = a.student_id WHERE a.id IS NULL
      `).all();
      
      const filtered = results.filter((row: any) => {
        const ln = row.level_name.toLowerCase();
        let cat = 'primary';
        if (ln.includes('kiddy') || ln.includes('kindergarten') || ln.includes('k2')) cat = 'kiddy';
        else if (ln.includes('secondary')) cat = 'secondary';
        return lvl === '' || cat === lvl;
      });
      return NextResponse.json({ status: 'success', data: filtered });
    }

    // 11. ALLOCATE STUDENT
    if (action === 'allocate_student' && request.method === 'POST') {
      const input = await request.json() as any;
      const sch_id = parseInt(input.schedule_id) || 0;
      const stu_id = parseInt(input.student_id) || 0;
      if (sch_id <= 0 || stu_id <= 0) return NextResponse.json({ status: 'error', message: 'Invalid ID' });
      
      const sch = await db.prepare("SELECT capacity, (SELECT COUNT(*) FROM assessment_allocations WHERE schedule_id = ?) as c FROM assessment_schedules WHERE id = ?").bind(sch_id, sch_id).first();
      if (!sch) return NextResponse.json({ status: 'error', message: 'Jadwal tidak ditemukan' });
      if ((sch as any).c >= (sch as any).capacity) return NextResponse.json({ status: 'error', message: 'Penuh' });

      try {
        await db.prepare("INSERT INTO assessment_allocations (schedule_id, student_id) VALUES (?, ?)").bind(sch_id, stu_id).run();
        return NextResponse.json({ status: 'success', message: 'Dialokasikan' });
      } catch (e: any) {
        return NextResponse.json({ status: 'error', message: 'Sudah dialokasikan atau error lain' });
      }
    }

    // 12. UNALLOCATE STUDENT
    if (action === 'unallocate_student' && request.method === 'POST') {
      const input = await request.json() as any;
      await db.prepare("DELETE FROM assessment_allocations WHERE schedule_id = ? AND student_id = ?").bind(input.schedule_id, input.student_id).run();
      return NextResponse.json({ status: 'success', message: 'Dihapus' });
    }

    // 13. GET ALLOCATED STUDENTS
    if (action === 'get_allocated_students' && request.method === 'GET') {
      const sch_id = parseInt(url.searchParams.get('schedule_id') || '0');
      const { results } = await db.prepare(`
        SELECT r.id, r.child_name, r.ticket_code, r.level_id, l.name as level_name, a.id as allocation_id
        FROM assessment_allocations a JOIN registrations r ON a.student_id = r.id JOIN levels l ON r.level_id = l.id
        WHERE a.schedule_id = ?
      `).bind(sch_id).all();
      return NextResponse.json({ status: 'success', data: results });
    }

    // 14. IMPORT SCHEDULES
    if (action === 'import_schedules' && request.method === 'POST') {
      const input = await request.json() as any;
      if (!input.schedules || !Array.isArray(input.schedules)) return NextResponse.json({ status: 'error', message: 'Invalid data' });
      
      const stmts = [];
      for (const row of input.schedules) {
        if (!row.tanggal) continue;
        let lvl = 'primary';
        let cap = 10;
        const rawLvl = (row.tingkat || '').toLowerCase();
        if (rawLvl.includes('kiddy') || rawLvl.includes('tk')) { lvl = 'kiddy'; cap = 1; }
        else if (rawLvl.includes('smp') || rawLvl.includes('sma')) lvl = 'secondary';
        
        let dateStr = row.tanggal;
        if (dateStr.includes('/')) dateStr = dateStr.split('/').reverse().join('-');
        stmts.push(db.prepare("INSERT INTO assessment_schedules (date, start_time, end_time, level, capacity) VALUES (?, ?, ?, ?, ?)").bind(dateStr, row.jam_mulai, row.jam_selesai, lvl, cap));
      }
      if (stmts.length > 0) {
        await db.batch(stmts);
        return NextResponse.json({ status: 'success', message: `${stmts.length} diimpor.` });
      }
      return NextResponse.json({ status: 'error', message: 'Tidak ada data.' });
    }

    // 15. STUDENT LOGIN
    if (action === 'student_login' && request.method === 'POST') {
      const input = await request.json() as any;
      const email = input.email?.trim().toLowerCase() || '';
      const password = input.password?.trim() || '';
      
      const st = await db.prepare("SELECT r.*, l.name as level_name FROM registrations r JOIN levels l ON r.level_id = l.id WHERE r.email = ? ORDER BY r.id DESC LIMIT 1").bind(email).first();
      if (!st) return NextResponse.json({ status: 'error', message: 'Email tidak ditemukan.' });

      const pwdClean = password.replace(/\D/g, '');
      const dbBirth = (st as any).birth_date;
      const dbBirthClean = dbBirth.replace(/-/g, '');
      if (pwdClean !== dbBirthClean && password !== dbBirth) {
        return NextResponse.json({ status: 'error', message: 'Password salah (Gunakan YYYY-MM-DD atau DDMMYYYY).' });
      }

      if (!(st as any).payment_proof) return NextResponse.json({ status: 'payment_required', message: 'Belum bayar', student: st });
      if ((st as any).payment_status === 'pending') return NextResponse.json({ status: 'payment_pending', message: 'Verifikasi pending', student: st });
      if ((st as any).payment_status === 'rejected') return NextResponse.json({ status: 'payment_rejected', message: 'Ditolak', student: st });

      const alloc = await db.prepare("SELECT a.id as allocation_id, s.* FROM assessment_allocations a JOIN assessment_schedules s ON a.schedule_id = s.id WHERE a.student_id = ?").bind((st as any).id).first();
      
      let cat = 'primary';
      const ln = (st as any).level_name.toLowerCase();
      if (ln.includes('kiddy') || ln.includes('tk') || ln.includes('k1') || ln.includes('k2')) cat = 'kiddy';
      else if (ln.includes('secondary') || ln.includes('smp') || ln.includes('sma')) cat = 'secondary';
      
      const { results: schedules } = await db.prepare(`
        SELECT s.id, s.date, s.start_time, s.end_time, s.level, s.capacity, COALESCE(cnt.allocated_count, 0) as allocated_count
        FROM assessment_schedules s LEFT JOIN (SELECT schedule_id, COUNT(*) as allocated_count FROM assessment_allocations GROUP BY schedule_id) cnt ON cnt.schedule_id = s.id
        WHERE s.level = ? ORDER BY s.date ASC, s.start_time ASC
      `).bind(cat).all();

      return NextResponse.json({ status: 'success', student: st, allocation: alloc, category: cat, schedules });
    }

    // 16. GET STUDENT SCHEDULES
    if (action === 'get_student_schedules' && request.method === 'GET') {
      const student_id = parseInt(url.searchParams.get('student_id') || '0');
      const st = await db.prepare("SELECT r.id, r.level_id, r.payment_proof, r.payment_status, l.name as level_name FROM registrations r JOIN levels l ON r.level_id = l.id WHERE r.id = ?").bind(student_id).first();
      if (!st) return NextResponse.json({ status: 'error', message: 'Not found' });
      
      let cat = 'primary';
      const ln = (st as any).level_name.toLowerCase();
      if (ln.includes('kiddy') || ln.includes('tk')) cat = 'kiddy';
      else if (ln.includes('secondary')) cat = 'secondary';
      
      const { results: schedules } = await db.prepare(`
        SELECT s.id, s.date, s.start_time, s.end_time, s.level, s.capacity, COALESCE(cnt.allocated_count, 0) as allocated_count
        FROM assessment_schedules s LEFT JOIN (SELECT schedule_id, COUNT(*) as allocated_count FROM assessment_allocations GROUP BY schedule_id) cnt ON cnt.schedule_id = s.id
        WHERE s.level = ? ORDER BY s.date ASC, s.start_time ASC
      `).bind(cat).all();
      return NextResponse.json({ status: 'success', category: cat, schedules, payment_proof: (st as any).payment_proof, payment_status: (st as any).payment_status });
    }

    // 17. STUDENT SELECT SCHEDULE
    if (action === 'student_select_schedule' && request.method === 'POST') {
      const input = await request.json() as any;
      const stu_id = parseInt(input.student_id);
      const sch_id = parseInt(input.schedule_id);
      
      const st = await db.prepare("SELECT child_name, payment_proof, payment_status FROM registrations WHERE id = ?").bind(stu_id).first();
      if (!st || (st as any).payment_status !== 'verified') return NextResponse.json({ status: 'error', message: 'Belum terverifikasi.' });
      
      const sch = await db.prepare("SELECT capacity, (SELECT COUNT(*) FROM assessment_allocations WHERE schedule_id = ?) as c FROM assessment_schedules WHERE id = ?").bind(sch_id, sch_id).first();
      if (!sch || (sch as any).c >= (sch as any).capacity) return NextResponse.json({ status: 'error', message: 'Penuh.' });
      
      const stmts = [];
      stmts.push(db.prepare("DELETE FROM assessment_allocations WHERE student_id = ?").bind(stu_id));
      stmts.push(db.prepare("INSERT INTO assessment_allocations (schedule_id, student_id) VALUES (?, ?)").bind(sch_id, stu_id));
      await db.batch(stmts);
      return NextResponse.json({ status: 'success', message: 'Disimpan.' });
    }

    // 18. ADMINS
    if (action === 'get_admins') {
      const { results } = await db.prepare("SELECT id, username, name, created_at FROM admins ORDER BY id ASC").all();
      return NextResponse.json({ status: 'success', data: results });
    }
    if (action === 'create_admin') {
      const input = await request.json() as any;
      await db.prepare("INSERT INTO admins (username, password, name) VALUES (?, ?, ?)").bind(input.username, input.password, input.name).run();
      return NextResponse.json({ status: 'success', message: 'Berhasil ditambahkan.' });
    }
    if (action === 'delete_admin') {
      const input = await request.json() as any;
      await db.prepare("DELETE FROM admins WHERE id = ?").bind(input.id).run();
      return NextResponse.json({ status: 'success', message: 'Dihapus.' });
    }
    if (action === 'verify_payment') {
      const input = await request.json() as any;
      await db.prepare("UPDATE registrations SET payment_status = ? WHERE id = ?").bind(input.status, input.id).run();
      return NextResponse.json({ status: 'success', message: 'Diperbarui.' });
    }

    return NextResponse.json({ status: 'error', message: 'Invalid action' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
