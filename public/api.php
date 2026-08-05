<?php
// Enable zlib output compression if supported
if (!ob_start("ob_gzhandler")) {
    ob_start();
}

// CORS headers - must be set before ANY output
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Optimize Database Connection
// Menggunakan 127.0.0.1 alih-alih localhost untuk membypass delay DNS lookup IPv6 (biasanya memakan waktu 5-7 detik)
$db_host = '127.0.0.1';
$db_user = 'eliteac1_aris';
$db_pass = '12345Q@zaqw';
$db_name = 'eliteac1_openhouse2026';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit();
}
$conn->set_charset("utf8mb4");


// Upload directory configuration
$upload_dir = __DIR__ . '/uploads/';
$upload_url_base = 'https://eliteacademia.id/openhouse/uploads/';

// Create uploads directory if it doesn't exist
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
    chmod($upload_dir, 0777);
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// ============================
// HELPER: Handle file upload
// ============================
function handleFileUpload($file, $upload_dir, $upload_url_base)
{
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    $max_size = 2 * 1024 * 1024; // 2MB (disesuaikan dengan php_upload_max server)

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $error_messages = [
            UPLOAD_ERR_INI_SIZE => 'Ukuran file melebihi batas maksimal server (2MB). Silakan kecilkan ukuran foto Anda.',
            UPLOAD_ERR_FORM_SIZE => 'File melebihi batas MAX_FILE_SIZE.',
            UPLOAD_ERR_PARTIAL => 'File hanya terupload sebagian.',
            UPLOAD_ERR_NO_FILE => 'Tidak ada file yang dikirim.',
            UPLOAD_ERR_NO_TMP_DIR => 'Folder temporary tidak ditemukan di server.',
            UPLOAD_ERR_CANT_WRITE => 'Gagal menulis file ke disk.',
            UPLOAD_ERR_EXTENSION => 'Upload dihentikan oleh extension PHP.',
        ];
        $msg = isset($error_messages[$file['error']]) ? $error_messages[$file['error']] : 'Error code: ' . $file['error'];
        return ['status' => 'error', 'message' => 'Upload gagal: ' . $msg];
    }

    if ($file['size'] > $max_size) {
        return ['status' => 'error', 'message' => 'Ukuran file terlalu besar. Maksimal 2MB.'];
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime_type, $allowed_types)) {
        return ['status' => 'error', 'message' => 'Tipe file tidak diizinkan (' . $mime_type . '). Gunakan JPG, PNG, GIF, WebP, atau PDF.'];
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safe_ext = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $ext));
    if (empty($safe_ext))
        $safe_ext = 'jpg';

    $unique_name = 'proof_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $safe_ext;
    $dest_path = $upload_dir . $unique_name;

    if (move_uploaded_file($file['tmp_name'], $dest_path)) {
        return [
            'status' => 'success',
            'file_url' => $upload_url_base . $unique_name,
            'file_name' => $unique_name
        ];
    }

    return ['status' => 'error', 'message' => 'Gagal menyimpan file ke server. Periksa permission folder uploads/.'];
}

// ============================
// HELPER: Send Notification Email
// ============================
function sendNotificationEmail($subject, $messageHTML) {
    global $action;

    if ($action === 'internal_send_email') {
        $to = 'oh@edelweiss.sch.id';
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: Open House Edelweiss <noreply@eliteacademia.id>" . "\r\n";
        @mail($to, $subject, $messageHTML, $headers);
        return;
    }

    $url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . explode('?', $_SERVER['REQUEST_URI'])[0] . "?action=internal_send_email";
    $postData = json_encode(['subject' => $subject, 'message' => $messageHTML]);

    $parts = parse_url($url);
    $host = $parts['host'];
    $port = isset($parts['port']) ? $parts['port'] : (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 443 : 80);
    $path = $parts['path'] . (isset($parts['query']) ? '?' . $parts['query'] : '');
    
    if ($port == 443) {
        $host = 'ssl://' . $host;
    }

    $fp = @fsockopen($host, $port, $errno, $errstr, 1);
    if ($fp) {
        $out = "POST " . $path . " HTTP/1.1\r\n";
        $out .= "Host: " . $parts['host'] . "\r\n";
        $out .= "Content-Type: application/json\r\n";
        $out .= "Content-Length: " . strlen($postData) . "\r\n";
        $out .= "Connection: Close\r\n\r\n";
        $out .= $postData;
        fwrite($fp, $out);
        fclose($fp);
    }
}

// ============================
// HELPER: Send Async JSON Response
// ============================
function sendAsyncJsonResponse($data) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit();
}

// ============================
// DEBUG: Test upload endpoint
// ============================
if ($action === 'debug_upload') {
    echo json_encode([
        'status' => 'success',
        'message' => 'API is reachable',
        'upload_dir' => $upload_dir,
        'upload_dir_exists' => is_dir($upload_dir),
        'upload_dir_writable' => is_writable($upload_dir),
        'php_upload_max' => ini_get('upload_max_filesize'),
        'php_post_max' => ini_get('post_max_size'),
        'php_file_uploads' => ini_get('file_uploads'),
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'files_received' => !empty($_FILES) ? array_keys($_FILES) : 'none',
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown'
    ]);
    exit();
}

// ============================
// 0. UPLOAD FILE (Standalone endpoint)
// ============================
if ($action === 'upload_file' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Tidak ada file yang dikirim.',
            'debug_files' => !empty($_FILES) ? array_keys($_FILES) : 'empty',
            'debug_content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set'
        ]);
        exit();
    }

    $result = handleFileUpload($_FILES['file'], $upload_dir, $upload_url_base);
    echo json_encode($result);
    exit();
}

// ============================
// 1. ADMIN LOGIN AUTHENTICATION
// ============================
if ($action === 'admin_login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    $username = isset($input['username']) ? trim($input['username']) : '';
    $password = isset($input['password']) ? trim($input['password']) : '';

    if (empty($username) || empty($password)) {
        echo json_encode(['status' => 'error', 'message' => 'Username dan Password wajib diisi.']);
        exit();
    }

    if ($username === 'admin' && ($password === 'Bunga.edelweiss' || $password === 'admin123')) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Login Admin Berhasil!',
            'token' => 'ADMIN-TOKEN-SECURE-' . md5('admin-secret-' . time()),
            'admin' => [
                'name' => 'Administrator Edelweiss',
                'username' => 'admin'
            ]
        ]);
        exit();
    }

    $stmt = $conn->prepare("SELECT * FROM admins WHERE username = ? AND password = ?");
    $stmt->bind_param("ss", $username, $password);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res && $res->num_rows > 0) {
        $admin = $res->fetch_assoc();
        echo json_encode([
            'status' => 'success',
            'message' => 'Login Admin Berhasil!',
            'token' => 'ADMIN-TOKEN-SECURE-' . md5($admin['username'] . time()),
            'admin' => [
                'name' => $admin['name'],
                'username' => $admin['username']
            ]
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Username atau Password salah!']);
    }
    exit();
}

// ============================
// 2. GET ALL LEVELS & SLOTS DATA (OPTIMIZED SINGLE QUERY)
// ============================
if ($action === 'get_data' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    // Single JOIN query to eliminate N+1 query latency
    $query = "SELECT 
                    l.id, l.name, l.code, l.category, l.quota,
                    s.slot_number, s.status as slot_status, s.holder_name,
                    (SELECT COUNT(*) FROM registrations r WHERE r.level_id = l.id AND r.slot_number = 0) as waiting_count
                FROM levels l
                LEFT JOIN slots s ON l.id = s.level_id
                ORDER BY FIELD(l.id, 'fs-kiddy1', 'fs-kiddy2', 'fs-k1', 'fs-k2', 'fs-p1', 'fs-s1', 'hs-p1', 'hs-ls1', 'hs-us1'), s.slot_number ASC";

    $result = $conn->query($query);

    $levels_map = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $id = $row['id'];
            if (!isset($levels_map[$id])) {
                $levels_map[$id] = [
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'code' => $row['code'],
                    'category' => $row['category'],
                    'quota' => (int) $row['quota'],
                    'booked' => 0,
                    'available' => (int) $row['quota'],
                    'waitingList' => (int) ($row['waiting_count'] ?? 0),
                    'slots' => []
                ];
            }

            if ($row['slot_number'] !== null) {
                $is_booked = ($row['slot_status'] === 'booked');
                $levels_map[$id]['slots'][] = [
                    'number' => (int) $row['slot_number'],
                    'status' => $row['slot_status'],
                    'holder' => $row['holder_name']
                ];
                if ($is_booked) {
                    $levels_map[$id]['booked']++;
                }
            }
        }

        // Recalculate available slots
        foreach ($levels_map as &$lvl) {
            $lvl['available'] = max(0, $lvl['quota'] - $lvl['booked']);
        }
    }

    echo json_encode(['status' => 'success', 'data' => array_values($levels_map)]);
    exit();
}

// ============================
// 3. GET ALL REGISTRATIONS FOR ADMIN DASHBOARD
// ============================
if ($action === 'get_registrations' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT r.*, l.name as level_name, l.code as level_code, l.category as level_category 
                FROM registrations r 
                JOIN levels l ON r.level_id = l.id 
                ORDER BY r.id DESC";
    $result = $conn->query($query);

    $registrations = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $registrations[] = $row;
        }
    }

    echo json_encode(['status' => 'success', 'data' => $registrations]);
    exit();
}

// ============================
// 4. REGISTER APPLICANT WITH ATTENDANCE & PAYMENT
// ============================
if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    if (!$input) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
        exit();
    }

    $level_id = isset($input['level_id']) ? $conn->real_escape_string($input['level_id']) : '';
    $slot_number = isset($input['slot_number']) ? (int) $input['slot_number'] : 0;
    $registration_type = isset($input['registration_type']) ? $conn->real_escape_string($input['registration_type']) : 'new';
    $child_name = isset($input['child_name']) ? $conn->real_escape_string($input['child_name']) : '';
    $birth_date = isset($input['birth_date']) ? $conn->real_escape_string($input['birth_date']) : '';
    $gender = isset($input['gender']) ? $conn->real_escape_string($input['gender']) : 'Laki-laki';
    $parent_name = isset($input['parent_name']) ? $conn->real_escape_string($input['parent_name']) : '';
    $payment_method = isset($input['payment_method']) ? $conn->real_escape_string($input['payment_method']) : 'pay_now';
    $payment_proof_raw = isset($input['payment_proof']) ? $input['payment_proof'] : '';
    $payment_proof = '';

    // Limit file upload size for base64 (2MB file = ~2.66MB base64 overhead)
    if (!empty($payment_proof_raw) && strlen($payment_proof_raw) > 2.8 * 1024 * 1024) {
        echo json_encode(['status' => 'error', 'message' => 'Ukuran file bukti pembayaran terlalu besar. Maksimal 2MB.']);
        exit();
    }

    // Auto-convert Base64 string to physical image file in uploads/ folder
    if (!empty($payment_proof_raw)) {
        if (strpos($payment_proof_raw, 'data:image/') === 0 || strpos($payment_proof_raw, 'data:application/pdf') === 0) {
            $parts = explode(',', $payment_proof_raw);
            if (count($parts) === 2) {
                $meta = $parts[0];
                $data = base64_decode($parts[1]);

                $ext = 'jpg';
                if (strpos($meta, 'png') !== false)
                    $ext = 'png';
                else if (strpos($meta, 'webp') !== false)
                    $ext = 'webp';
                else if (strpos($meta, 'pdf') !== false)
                    $ext = 'pdf';

                $file_name = 'proof_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                $file_path = $upload_dir . $file_name;

                if (file_put_contents($file_path, $data)) {
                    $payment_proof = $conn->real_escape_string($upload_url_base . $file_name);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Sistem gagal menyimpan file foto di server. Mohon hubungi admin.']);
                    exit();
                }
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Format file foto tidak valid.']);
                exit();
            }
        } else {
            $payment_proof = $conn->real_escape_string($payment_proof_raw);
        }
    }
    $whatsapp = isset($input['whatsapp']) ? $conn->real_escape_string($input['whatsapp']) : '';
    $email = isset($input['email']) ? $conn->real_escape_string($input['email']) : '';
    $school_origin = isset($input['school_origin']) ? $conn->real_escape_string($input['school_origin']) : '';
    $attendance_session = isset($input['attendance_session']) ? $conn->real_escape_string($input['attendance_session']) : '';
    $is_waiting_list = ($slot_number === 0 || $registration_type === 'waiting_list');
    $db_registration_type = in_array($registration_type, ['new', 'transfer']) ? $registration_type : 'new';
    $db_payment_method = in_array($payment_method, ['pay_now', 'pay_onsite']) ? $payment_method : 'pay_onsite';

    // Always fallback attendance_session for waiting list
    if ($is_waiting_list) {
        if (empty($attendance_session) || $attendance_session === 'Waiting List') {
            $attendance_session = 'Waiting List (Antrean Kuota)';
        }
        // Force safe payment method for waiting list
        $db_payment_method = 'pay_onsite';
    }

    if (empty($level_id) || $slot_number < 0 || empty($child_name) || empty($birth_date) || empty($parent_name) || empty($whatsapp) || empty($email) || empty($attendance_session)) {
        echo json_encode(['status' => 'error', 'message' => 'Mohon lengkapi seluruh bidang data wajib termasuk Email aktif dan Sesi Kedatangan.']);
        exit();
    }

    $prefix = $is_waiting_list ? 'WAIT' : (($registration_type === 'transfer') ? 'TRF' : 'NEW');
    $ticket_code = 'ELC-' . $prefix . '-' . ($is_waiting_list ? 'WL' : sprintf("%02d", $slot_number)) . '-' . rand(100, 999);

    $conn->begin_transaction();
    try {
        if (!$is_waiting_list) {
            $upd_stmt = $conn->prepare("UPDATE slots SET status = 'booked', holder_name = ? WHERE level_id = ? AND slot_number = ?");
            $upd_stmt->bind_param("ssi", $child_name, $level_id, $slot_number);
            $upd_stmt->execute();
        }

        $ins_stmt = $conn->prepare("INSERT INTO registrations (ticket_code, level_id, slot_number, registration_type, child_name, birth_date, gender, parent_name, whatsapp, email, school_origin, attendance_session, payment_method, payment_proof) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $ins_stmt->bind_param("ssisssssssssss", $ticket_code, $level_id, $slot_number, $db_registration_type, $child_name, $birth_date, $gender, $parent_name, $whatsapp, $email, $school_origin, $attendance_session, $db_payment_method, $payment_proof);
        $ins_stmt->execute();

        $conn->commit();

        $tipe = $is_waiting_list ? 'Waiting List' : 'Reguler';
        $emailSubject = "Pendaftaran Baru [$tipe]: " . $ticket_code;
        $emailBody = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;'>
            <div style='background-color: #002B5B; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;'>
                <h2 style='color: #FED700; margin: 0;'>Notifikasi Open House</h2>
            </div>
            <div style='background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;'>
                <h3 style='color: #1e293b; margin-top: 0;'>Pendaftaran Baru Masuk</h3>
                <p style='color: #475569; line-height: 1.6;'>Terdapat pendaftaran baru yang perlu diverifikasi di sistem Open House dengan rincian sebagai berikut:</p>
                
                <table style='width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; font-size: 14px;'>
                    <tr>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 40%;'>Kode Tiket</td>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: bold;'>$ticket_code</td>
                    </tr>
                    <tr>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Tipe Pendaftaran</td>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: bold;'>$tipe</td>
                    </tr>
                    <tr>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Nama Anak</td>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: bold;'>$child_name</td>
                    </tr>
                    <tr>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Nama Orang Tua</td>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: bold;'>$parent_name</td>
                    </tr>
                    <tr>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>WhatsApp</td>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: bold;'>$whatsapp</td>
                    </tr>
                    <tr>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Email</td>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: bold;'>$email</td>
                    </tr>
                </table>
                
                <div style='text-align: center; margin-top: 30px;'>
                    <a href='https://openhouse.edelweiss.sch.id/admin/login' style='background-color: #293C88; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;'>Cek Dashboard Admin</a>
                </div>
            </div>
            <div style='text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;'>
                <p>Email ini dikirim secara otomatis oleh Sistem Pendaftaran Terpadu Open House Edelweiss.</p>
            </div>
        </div>";
        sendNotificationEmail($emailSubject, $emailBody);

        sendAsyncJsonResponse([
            'status' => 'success',
            'message' => $is_waiting_list ? 'Pendaftaran Waiting List berhasil disimpan!' : 'Pendaftaran berhasil disimpan!',
            'ticket_code' => $ticket_code,
            'slot_number' => $slot_number,
            'is_waiting_list' => $is_waiting_list
        ]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan pendaftaran: ' . $e->getMessage()]);
    }
    exit();
}

// ============================
// 5. UPDATE PAYMENT PROOF (Admin uploads file via FormData)
// ============================
if ($action === 'upload_payment_proof' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Support both: FormData with file, or JSON with file_url
    if (isset($_FILES['file']) && isset($_POST['id'])) {
        // FormData upload with actual file
        $reg_id = (int) $_POST['id'];

        if ($reg_id <= 0) {
            echo json_encode(['status' => 'error', 'message' => 'ID Pendaftaran tidak valid.']);
            exit();
        }

        $upload_result = handleFileUpload($_FILES['file'], $upload_dir, $upload_url_base);

        if ($upload_result['status'] !== 'success') {
            echo json_encode($upload_result);
            exit();
        }

        $file_url = $upload_result['file_url'];
        $upd = $conn->prepare("UPDATE registrations SET payment_proof = ? WHERE id = ?");
        $upd->bind_param("si", $file_url, $reg_id);

        if ($upd->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Bukti pembayaran berhasil di-upload!',
                'file_url' => $file_url
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui bukti pembayaran.']);
        }
    } else {
        // JSON payload with file_url string
        $raw_input = file_get_contents('php://input');
        $input = json_decode($raw_input, true);

        $reg_id = isset($input['id']) ? (int) $input['id'] : 0;
        $payment_proof = isset($input['file_url']) ? $conn->real_escape_string($input['file_url']) : '';

        if ($reg_id <= 0 || empty($payment_proof)) {
            echo json_encode(['status' => 'error', 'message' => 'ID Pendaftaran atau URL Bukti Bayar tidak boleh kosong.']);
            exit();
        }

        $upd = $conn->prepare("UPDATE registrations SET payment_proof = ? WHERE id = ?");
        $upd->bind_param("si", $payment_proof, $reg_id);
        if ($upd->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Bukti pembayaran berhasil di-upload!']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui bukti pembayaran.']);
        }
    }
    exit();
}

// ============================
// 6. DELETE REGISTRATION
// ============================
if ($action === 'delete_registration' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    $reg_id = isset($input['id']) ? (int) $input['id'] : 0;

    if ($reg_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'ID Registrasi tidak valid.']);
        exit();
    }

    $conn->begin_transaction();
    try {
        $get_stmt = $conn->prepare("SELECT level_id, slot_number, payment_proof FROM registrations WHERE id = ?");
        $get_stmt->bind_param("i", $reg_id);
        $get_stmt->execute();
        $reg_data = $get_stmt->get_result()->fetch_assoc();

        if ($reg_data) {
            $free_stmt = $conn->prepare("UPDATE slots SET status = 'available', holder_name = NULL WHERE level_id = ? AND slot_number = ?");
            $free_stmt->bind_param("si", $reg_data['level_id'], $reg_data['slot_number']);
            $free_stmt->execute();

            // Delete the uploaded file if it exists
            if (!empty($reg_data['payment_proof']) && strpos($reg_data['payment_proof'], $upload_url_base) === 0) {
                $file_name = basename($reg_data['payment_proof']);
                $file_path = $upload_dir . $file_name;
                if (file_exists($file_path)) {
                    unlink($file_path);
                }
            }
        }

        $del_stmt = $conn->prepare("DELETE FROM registrations WHERE id = ?");
        $del_stmt->bind_param("i", $reg_id);
        $del_stmt->execute();

        $conn->commit();

        echo json_encode(['status' => 'success', 'message' => 'Data pendaftaran berhasil dihapus.']);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus pendaftaran: ' . $e->getMessage()]);
    }
    exit();
}
// ============================
// 7. GET SCHEDULES
// ============================
if ($action === 'get_schedules' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT s.id, s.date, s.start_time, s.end_time, s.level, s.capacity,
                COALESCE(cnt.allocated_count, 0) as allocated_count
              FROM assessment_schedules s
              LEFT JOIN (
                SELECT schedule_id, COUNT(*) as allocated_count
                FROM assessment_allocations
                GROUP BY schedule_id
              ) cnt ON cnt.schedule_id = s.id
              ORDER BY s.date ASC, s.start_time ASC";
    $result = $conn->query($query);
    $schedules = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $schedules[] = $row;
        }
    }
    echo json_encode(['status' => 'success', 'data' => $schedules]);
    exit();
}

// ============================
// 8. CREATE SCHEDULE
// ============================
if ($action === 'create_schedule' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    $date = $input['date'] ?? '';
    $start_time = $input['start_time'] ?? '';
    $end_time = $input['end_time'] ?? '';
    $level = $input['level'] ?? '';
    $capacity = isset($input['capacity']) ? (int) $input['capacity'] : 10;

    if (empty($date) || empty($start_time) || empty($end_time) || empty($level)) {
        echo json_encode(['status' => 'error', 'message' => 'Semua kolom wajib diisi.']);
        exit();
    }

    if ($level === 'kiddy') {
        $capacity = 1; // Locked for kiddy
    } else {
        if ($capacity > 10)
            $capacity = 10;
        if ($capacity < 1)
            $capacity = 1;
    }

    $stmt = $conn->prepare("INSERT INTO assessment_schedules (date, start_time, end_time, level, capacity) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssi", $date, $start_time, $end_time, $level, $capacity);
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Jadwal assessment berhasil dibuat.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal membuat jadwal.']);
    }
    exit();
}

// ============================
// 9. DELETE SCHEDULE
// ============================
if ($action === 'delete_schedule' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);
    $id = isset($input['id']) ? (int) $input['id'] : 0;

    // Check if there are allocations
    $check = $conn->prepare("SELECT COUNT(*) as count FROM assessment_allocations WHERE schedule_id = ?");
    $check->bind_param("i", $id);
    $check->execute();
    $res = $check->get_result()->fetch_assoc();
    if ($res['count'] > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus: Jadwal sudah memiliki siswa yang dialokasikan.']);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM assessment_schedules WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Jadwal berhasil dihapus.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus jadwal.']);
    }
    exit();
}

// ============================
// 10. GET UNALLOCATED STUDENTS (Filtered by broad level category)
// ============================
if ($action === 'get_unallocated_students' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $target_level = $_GET['level'] ?? '';

    // Base query: get students who are not in assessment_allocations
    $query = "SELECT r.id, r.child_name, r.ticket_code, r.level_id, l.name as level_name 
                FROM registrations r
                JOIN levels l ON r.level_id = l.id
                LEFT JOIN assessment_allocations a ON r.id = a.student_id
                WHERE a.id IS NULL";

    $result = $conn->query($query);
    $students = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $lvl_name = strtolower($row['level_name']);
            // Determine broad category from level name
            $cat = '';
            if (strpos($lvl_name, 'kiddy') !== false || strpos($lvl_name, 'kindergarten') !== false || strpos($lvl_name, 'k2') !== false) {
                $cat = 'kiddy';
            } elseif (strpos($lvl_name, 'primary') !== false) {
                $cat = 'primary';
            } elseif (strpos($lvl_name, 'secondary') !== false) {
                $cat = 'secondary';
            }

            if ($cat === $target_level || $target_level === '') {
                $students[] = $row;
            }
        }
    }
    echo json_encode(['status' => 'success', 'data' => $students]);
    exit();
}

// ============================
// 11. ALLOCATE STUDENT TO SCHEDULE
// ============================
if ($action === 'allocate_student' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    $schedule_id = isset($input['schedule_id']) ? (int) $input['schedule_id'] : 0;
    $student_id = isset($input['student_id']) ? (int) $input['student_id'] : 0;

    if ($schedule_id <= 0 || $student_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Schedule ID atau Student ID tidak valid.']);
        exit();
    }

    $conn->begin_transaction();
    try {
        // Double booking check is handled by UNIQUE KEY unique_student_allocation (student_id), but let's check it directly
        $check_student = $conn->prepare("SELECT id FROM assessment_allocations WHERE student_id = ?");
        $check_student->bind_param("i", $student_id);
        $check_student->execute();
        if ($check_student->get_result()->num_rows > 0) {
            throw new Exception('Siswa ini sudah dialokasikan ke jadwal lain.');
        }

        // Capacity check
        $check_cap = $conn->prepare("
                SELECT s.capacity, (SELECT COUNT(*) FROM assessment_allocations a WHERE a.schedule_id = s.id) as allocated_count
                FROM assessment_schedules s
                WHERE s.id = ? FOR UPDATE
            ");
        $check_cap->bind_param("i", $schedule_id);
        $check_cap->execute();
        $res = $check_cap->get_result()->fetch_assoc();

        if (!$res)
            throw new Exception('Jadwal tidak ditemukan.');
        if ($res['allocated_count'] >= $res['capacity']) {
            throw new Exception('Gagal: Kapasitas jadwal ini sudah penuh.');
        }

        $insert = $conn->prepare("INSERT INTO assessment_allocations (schedule_id, student_id) VALUES (?, ?)");
        $insert->bind_param("ii", $schedule_id, $student_id);
        $insert->execute();

        $conn->commit();
        echo json_encode(['status' => 'success', 'message' => 'Siswa berhasil dialokasikan.']);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit();
}

// ============================
// 12. UNALLOCATE STUDENT
// ============================
if ($action === 'unallocate_student' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    $schedule_id = isset($input['schedule_id']) ? (int) $input['schedule_id'] : 0;
    $student_id = isset($input['student_id']) ? (int) $input['student_id'] : 0;

    $stmt = $conn->prepare("DELETE FROM assessment_allocations WHERE schedule_id = ? AND student_id = ?");
    $stmt->bind_param("ii", $schedule_id, $student_id);
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Siswa berhasil dihapus dari jadwal.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus siswa dari jadwal.']);
    }
    exit();
}

// ============================
// 13. GET ALLOCATED STUDENTS FOR SCHEDULE
// ============================
if ($action === 'get_allocated_students' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $schedule_id = isset($_GET['schedule_id']) ? (int) $_GET['schedule_id'] : 0;

    $query = "SELECT r.id, r.child_name, r.ticket_code, r.level_id, l.name as level_name, a.id as allocation_id
                FROM assessment_allocations a
                JOIN registrations r ON a.student_id = r.id
                JOIN levels l ON r.level_id = l.id
                WHERE a.schedule_id = ?";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $schedule_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $students = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $students[] = $row;
        }
    }
    echo json_encode(['status' => 'success', 'data' => $students]);
    exit();
}

// ============================
// 14. IMPORT SCHEDULES
// ============================
if ($action === 'import_schedules' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    if (!isset($input['schedules']) || !is_array($input['schedules'])) {
        echo json_encode(['status' => 'error', 'message' => 'Format data tidak valid.']);
        exit();
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("INSERT INTO assessment_schedules (date, start_time, end_time, level, capacity) VALUES (?, ?, ?, ?, ?)");

        $inserted_count = 0;
        foreach ($input['schedules'] as $row) {
            $date = $row['tanggal'] ?? '';
            $start_time = $row['jam_mulai'] ?? '';
            $end_time = $row['jam_selesai'] ?? '';
            $level_raw = strtolower(trim($row['tingkat'] ?? ''));

            // Skip empty rows
            if (empty($date) && empty($start_time) && empty($level_raw))
                continue;

            // Validate required fields
            if (empty($date) || empty($start_time) || empty($end_time) || empty($level_raw)) {
                throw new Exception('Ada baris data yang belum lengkap (Tanggal, Jam Mulai, Jam Selesai, atau Tingkat).');
            }

            // Normalize level and capacity
            $level = 'primary'; // fallback
            $capacity = 10;

            if (strpos($level_raw, 'kiddy') !== false || strpos($level_raw, 'kindergarten') !== false || strpos($level_raw, 'tk') !== false || strpos($level_raw, 'k2') !== false || strpos($level_raw, 'k1') !== false) {
                $level = 'kiddy';
                $capacity = 1; // Locked for one on one
            } elseif (strpos($level_raw, 'secondary') !== false || strpos($level_raw, 'smp') !== false || strpos($level_raw, 'sma') !== false) {
                $level = 'secondary';
                $capacity = 10;
            } else {
                $level = 'primary';
                $capacity = 10;
            }

            // Basic format validation
            if (!preg_match("/^\d{4}-\d{2}-\d{2}$/", $date)) {
                // Try converting MM/DD/YYYY or DD/MM/YYYY to YYYY-MM-DD
                $time = strtotime(str_replace('/', '-', $date));
                if ($time !== false) {
                    $date = date('Y-m-d', $time);
                } else {
                    throw new Exception("Format tanggal salah: $date. Gunakan YYYY-MM-DD.");
                }
            }

            $stmt->bind_param("ssssi", $date, $start_time, $end_time, $level, $capacity);
            if (!$stmt->execute()) {
                throw new Exception("Gagal menyimpan jadwal untuk tanggal $date.");
            }
            $inserted_count++;
        }

        if ($inserted_count === 0) {
            throw new Exception("Tidak ada data jadwal valid yang ditemukan.");
        }

        $conn->commit();
        echo json_encode(['status' => 'success', 'message' => "$inserted_count jadwal berhasil diimpor."]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit();
}

// ============================
// 15. STUDENT / PARENT LOGIN
// ============================
if ($action === 'student_login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    $email = isset($input['email']) ? strtolower(trim($input['email'])) : '';
    $password = isset($input['password']) ? trim($input['password']) : '';

    if (empty($email) || empty($password)) {
        echo json_encode(['status' => 'error', 'message' => 'Email dan Password (DDMMYYYY) wajib diisi.']);
        exit();
    }

    $stmt = $conn->prepare("SELECT r.*, l.name as level_name, l.code as level_code 
                            FROM registrations r 
                            JOIN levels l ON r.level_id = l.id 
                            WHERE r.email = ? 
                            ORDER BY r.id DESC LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$result || $result->num_rows === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Email tidak ditemukan. Pastikan menggunakan email yang terdaftar saat registrasi.']);
        exit();
    }

    $student = $result->fetch_assoc();

    // Check birth_date formatting DDMMYYYY
    $db_birth = $student['birth_date']; // YYYY-MM-DD
    $formatted_birth_ddmmyyyy = date('dmY', strtotime($db_birth));
    $formatted_birth_ymd = date('Y-m-d', strtotime($db_birth));
    $formatted_birth_clean = str_replace('-', '', $db_birth);

    $input_clean = preg_replace('/[^0-9]/', '', $password);

    if ($input_clean !== $formatted_birth_ddmmyyyy && $password !== $formatted_birth_ymd && $input_clean !== $formatted_birth_clean) {
        echo json_encode(['status' => 'error', 'message' => 'Password salah! Gunakan tanggal lahir anak dengan format DDMMYYYY (contoh: 15082017 untuk 15 Agustus 2017).']);
        exit();
    }

    // Check payment proof
    if (empty($student['payment_proof'])) {
        echo json_encode([
            'status' => 'payment_required',
            'message' => 'Bukti pembayaran belum diunggah. Silakan unggah bukti bayar terlebih dahulu agar dapat memilih jadwal assessment.',
            'student' => [
                'id' => (int) $student['id'],
                'child_name' => $student['child_name'],
                'ticket_code' => $student['ticket_code'],
                'email' => $student['email'],
                'level_name' => $student['level_name'],
                'payment_status' => $student['payment_status'] ?? 'pending'
            ]
        ]);
        exit();
    }

    if (!isset($student['payment_status']) || $student['payment_status'] === 'pending') {
        echo json_encode([
            'status' => 'payment_pending',
            'message' => 'Pembayaran Anda sedang diverifikasi oleh admin. Silakan tunggu atau hubungi admin.',
            'student' => [
                'id' => (int) $student['id'],
                'payment_status' => 'pending'
            ]
        ]);
        exit();
    }

    if ($student['payment_status'] === 'rejected') {
        echo json_encode([
            'status' => 'payment_rejected',
            'message' => 'Bukti pembayaran Anda ditolak. Silakan hubungi admin.',
            'student' => [
                'id' => (int) $student['id'],
                'payment_status' => 'rejected'
            ]
        ]);
        exit();
    }

    // Fetch allocation if exists
    $alloc_stmt = $conn->prepare("SELECT a.id as allocation_id, a.schedule_id, s.date, s.start_time, s.end_time, s.level 
                                  FROM assessment_allocations a 
                                  JOIN assessment_schedules s ON a.schedule_id = s.id 
                                  WHERE a.student_id = ?");
    $alloc_stmt->bind_param("i", $student['id']);
    $alloc_stmt->execute();
    $alloc_res = $alloc_stmt->get_result();
    $allocation = $alloc_res ? $alloc_res->fetch_assoc() : null;

    // Fetch schedules in same request to avoid 2nd HTTP round-trip
    $lvl_name = strtolower($student['level_name']);
    $cat = 'primary';
    if (strpos($lvl_name, 'kiddy') !== false || strpos($lvl_name, 'kindergarten') !== false || strpos($lvl_name, 'tk') !== false || strpos($lvl_name, 'k2') !== false || strpos($lvl_name, 'k1') !== false) {
        $cat = 'kiddy';
    } elseif (strpos($lvl_name, 'secondary') !== false || strpos($lvl_name, 'smp') !== false || strpos($lvl_name, 'sma') !== false) {
        $cat = 'secondary';
    }

    $sch_query = "SELECT s.id, s.date, s.start_time, s.end_time, s.level, s.capacity,
                    COALESCE(cnt.allocated_count, 0) as allocated_count
                  FROM assessment_schedules s
                  LEFT JOIN (
                    SELECT schedule_id, COUNT(*) as allocated_count
                    FROM assessment_allocations
                    GROUP BY schedule_id
                  ) cnt ON cnt.schedule_id = s.id
                  WHERE s.level = ?
                  ORDER BY s.date ASC, s.start_time ASC";
    $sch_stmt = $conn->prepare($sch_query);
    $sch_stmt->bind_param("s", $cat);
    $sch_stmt->execute();
    $sch_res = $sch_stmt->get_result();

    $schedules = [];
    if ($sch_res && $sch_res->num_rows > 0) {
        while ($row = $sch_res->fetch_assoc()) {
            $schedules[] = $row;
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Login berhasil!',
        'student' => [
            'id' => (int) $student['id'],
            'ticket_code' => $student['ticket_code'],
            'child_name' => $student['child_name'],
            'birth_date' => $student['birth_date'],
            'parent_name' => $student['parent_name'],
            'email' => $student['email'],
            'whatsapp' => $student['whatsapp'],
            'level_id' => $student['level_id'],
            'level_name' => $student['level_name'],
            'payment_proof' => $student['payment_proof']
        ],
        'allocation' => $allocation,
        'category' => $cat,
        'schedules' => $schedules
    ]);
    exit();
}

// ============================
// 16. GET SCHEDULES FOR LOGGED IN STUDENT
// ============================
if ($action === 'get_student_schedules' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $student_id = isset($_GET['student_id']) ? (int) $_GET['student_id'] : 0;

    if ($student_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'ID Siswa tidak valid.']);
        exit();
    }

    // Get student's broad level category
    $stmt = $conn->prepare("SELECT r.id, r.level_id, r.payment_proof, r.payment_status, l.name as level_name FROM registrations r JOIN levels l ON r.level_id = l.id WHERE r.id = ?");
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $st_res = $stmt->get_result()->fetch_assoc();

    if (!$st_res) {
        echo json_encode(['status' => 'error', 'message' => 'Data siswa tidak ditemukan.']);
        exit();
    }

    $lvl_name = strtolower($st_res['level_name']);
    $cat = 'primary';
    if (strpos($lvl_name, 'kiddy') !== false || strpos($lvl_name, 'kindergarten') !== false || strpos($lvl_name, 'tk') !== false || strpos($lvl_name, 'k2') !== false || strpos($lvl_name, 'k1') !== false) {
        $cat = 'kiddy';
    } elseif (strpos($lvl_name, 'secondary') !== false || strpos($lvl_name, 'smp') !== false || strpos($lvl_name, 'sma') !== false) {
        $cat = 'secondary';
    }

    // Efficient query: LEFT JOIN with GROUP BY instead of correlated subquery
    $query = "SELECT s.id, s.date, s.start_time, s.end_time, s.level, s.capacity,
                COALESCE(cnt.allocated_count, 0) as allocated_count
              FROM assessment_schedules s
              LEFT JOIN (
                SELECT schedule_id, COUNT(*) as allocated_count
                FROM assessment_allocations
                GROUP BY schedule_id
              ) cnt ON cnt.schedule_id = s.id
              WHERE s.level = ?
              ORDER BY s.date ASC, s.start_time ASC";
    $sch_stmt = $conn->prepare($query);
    $sch_stmt->bind_param("s", $cat);
    $sch_stmt->execute();
    $res = $sch_stmt->get_result();

    $schedules = [];
    if ($res && $res->num_rows > 0) {
        while ($row = $res->fetch_assoc()) {
            $schedules[] = $row;
        }
    }

    echo json_encode([
        'status' => 'success',
        'category' => $cat,
        'schedules' => $schedules,
        'payment_proof' => $st_res['payment_proof'],
        'payment_status' => $st_res['payment_status']
    ]);
    exit();
}

// ============================
// 17. STUDENT SELECT SCHEDULE
// ============================
if ($action === 'student_select_schedule' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    $student_id = isset($input['student_id']) ? (int) $input['student_id'] : 0;
    $schedule_id = isset($input['schedule_id']) ? (int) $input['schedule_id'] : 0;

    if ($student_id <= 0 || $schedule_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Data jadwal atau siswa tidak valid.']);
        exit();
    }

    $conn->begin_transaction();
    try {
        // Verify payment proof
        $st_check = $conn->prepare("SELECT child_name, payment_proof, payment_status FROM registrations WHERE id = ?");
        $st_check->bind_param("i", $student_id);
        $st_check->execute();
        $st_data = $st_check->get_result()->fetch_assoc();

        if (!$st_data || empty($st_data['payment_proof']) || $st_data['payment_status'] !== 'verified') {
            throw new Exception('Gagal: Bukti pembayaran belum diunggah atau belum diverifikasi oleh admin.');
        }

        // Check schedule capacity
        $cap_check = $conn->prepare("SELECT capacity, date, start_time, (SELECT COUNT(*) FROM assessment_allocations WHERE schedule_id = ?) as current_count FROM assessment_schedules WHERE id = ? FOR UPDATE");
        $cap_check->bind_param("ii", $schedule_id, $schedule_id);
        $cap_check->execute();
        $sch_data = $cap_check->get_result()->fetch_assoc();

        if (!$sch_data) {
            throw new Exception('Jadwal yang dipilih tidak ditemukan.');
        }

        // Check if user is re-selecting current schedule
        $existing = $conn->prepare("SELECT schedule_id FROM assessment_allocations WHERE student_id = ?");
        $existing->bind_param("i", $student_id);
        $existing->execute();
        $ex_res = $existing->get_result()->fetch_assoc();

        $is_same_schedule = ($ex_res && (int)$ex_res['schedule_id'] === $schedule_id);

        if (!$is_same_schedule && (int)$sch_data['current_count'] >= (int)$sch_data['capacity']) {
            throw new Exception('Maaf, kuota untuk sesi jadwal ini sudah penuh. Silakan pilih sesi lainnya.');
        }

        // Remove old allocation if exists
        $del = $conn->prepare("DELETE FROM assessment_allocations WHERE student_id = ?");
        $del->bind_param("i", $student_id);
        $del->execute();

        // Insert new allocation
        $ins = $conn->prepare("INSERT INTO assessment_allocations (schedule_id, student_id) VALUES (?, ?)");
        $ins->bind_param("ii", $schedule_id, $student_id);
        $ins->execute();

        $conn->commit();

        $st_name = $st_data['child_name'] ?? 'Siswa';
        $tanggal = $sch_data['date'] ?? '';
        $jam = $sch_data['start_time'] ?? '';
        $emailSubject = "Jadwal Assessment Telah Dipilih: " . $st_name;
        $emailBody = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;'>
            <div style='background-color: #002B5B; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;'>
                <h2 style='color: #FED700; margin: 0;'>Notifikasi Open House</h2>
            </div>
            <div style='background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;'>
                <h3 style='color: #1e293b; margin-top: 0;'>Pemilihan Jadwal Assessment</h3>
                <p style='color: #475569; line-height: 1.6;'>Siswa telah berhasil memilih jadwal Profiling Assessment dengan rincian sebagai berikut:</p>
                
                <table style='width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; font-size: 14px;'>
                    <tr>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 40%;'>Nama Anak</td>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: bold;'>$st_name</td>
                    </tr>
                    <tr>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Tanggal Assessment</td>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: bold;'>$tanggal</td>
                    </tr>
                    <tr>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;'>Jam Assessment</td>
                        <td style='padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: bold;'>$jam</td>
                    </tr>
                </table>
                
                <div style='text-align: center; margin-top: 30px;'>
                    <a href='https://openhouse.edelweiss.sch.id/admin/login' style='background-color: #293C88; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;'>Cek Dashboard Admin</a>
                </div>
            </div>
            <div style='text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;'>
                <p>Email ini dikirim secara otomatis oleh Sistem Pendaftaran Terpadu Open House Edelweiss.</p>
            </div>
        </div>";
        sendNotificationEmail($emailSubject, $emailBody);

        sendAsyncJsonResponse([
            'status' => 'success',
            'message' => 'Jadwal Profiling Assessment berhasil disimpan!'
        ]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit();
}

// ============================
// 18. ADMIN MANAGEMENT
// ============================
if ($action === 'get_admins' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $res = $conn->query("SELECT id, username, name, created_at FROM admins ORDER BY id ASC");
    $admins = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $admins[] = $row;
        }
    }
    echo json_encode(['status' => 'success', 'data' => $admins]);
    exit();
}

if ($action === 'create_admin' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);
    
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');
    $name = trim($input['name'] ?? '');
    
    if(empty($username) || empty($password) || empty($name)) {
        echo json_encode(['status' => 'error', 'message' => 'Semua field wajib diisi.']);
        exit();
    }
    
    $check = $conn->prepare("SELECT id FROM admins WHERE username = ?");
    $check->bind_param("s", $username);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Username sudah digunakan.']);
        exit();
    }
    
    $stmt = $conn->prepare("INSERT INTO admins (username, password, name) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $username, $password, $name);
    if($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Admin berhasil ditambahkan.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal menambahkan admin.']);
    }
    exit();
}

if ($action === 'delete_admin' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);
    $id = (int)($input['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'ID tidak valid.']);
        exit();
    }
    
    $check = $conn->prepare("SELECT username FROM admins WHERE id = ?");
    $check->bind_param("i", $id);
    $check->execute();
    $admin = $check->get_result()->fetch_assoc();
    
    if ($admin && $admin['username'] === 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Super Admin tidak bisa dihapus.']);
        exit();
    }
    
    $stmt = $conn->prepare("DELETE FROM admins WHERE id = ?");
    $stmt->bind_param("i", $id);
    if($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Admin berhasil dihapus.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus admin.']);
    }
    exit();
}

// ============================
// 19. VERIFY PAYMENT
// ============================
if ($action === 'verify_payment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);
    
    $id = (int)($input['id'] ?? 0);
    $status = $input['status'] ?? 'pending';
    
    if ($id <= 0 || !in_array($status, ['pending', 'verified', 'rejected'])) {
        echo json_encode(['status' => 'error', 'message' => 'Data tidak valid.']);
        exit();
    }
    
    $stmt = $conn->prepare("UPDATE registrations SET payment_status = ? WHERE id = ?");
    $stmt->bind_param("si", $status, $id);
    if($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Status pembayaran berhasil diperbarui.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui status.']);
    }
    exit();
}

// ============================
// INTERNAL: Async Email Worker
// ============================
if ($action === 'internal_send_email' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);
    if ($input && isset($input['subject']) && isset($input['message'])) {
        sendNotificationEmail($input['subject'], $input['message']);
    }
    echo json_encode(['status' => 'success']);
    exit();
}

echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
