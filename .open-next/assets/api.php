<?php
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

$db_host = 'localhost';
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

// Upload directory configuration
$upload_dir = __DIR__ . '/uploads/';
$upload_url_base = 'https://eliteacademia.id/openhouse/uploads/';

// Create uploads directory if it doesn't exist
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// ============================
// HELPER: Handle file upload
// ============================
function handleFileUpload($file, $upload_dir, $upload_url_base) {
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
    if (empty($safe_ext)) $safe_ext = 'jpg';

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

    if ($username === 'admin' && $password === 'admin123') {
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
                s.slot_number, s.status as slot_status, s.holder_name
              FROM levels l
              LEFT JOIN slots s ON l.id = s.level_id
              ORDER BY l.category ASC, l.id ASC, s.slot_number ASC";
              
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
                    'quota' => (int)$row['quota'],
                    'booked' => 0,
                    'available' => (int)$row['quota'],
                    'slots' => []
                ];
            }
            
            if ($row['slot_number'] !== null) {
                $is_booked = ($row['slot_status'] === 'booked');
                $levels_map[$id]['slots'][] = [
                    'number' => (int)$row['slot_number'],
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
              ORDER BY r.created_at DESC";
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
    $slot_number = isset($input['slot_number']) ? (int)$input['slot_number'] : 0;
    $registration_type = isset($input['registration_type']) ? $conn->real_escape_string($input['registration_type']) : 'new';
    $child_name = isset($input['child_name']) ? $conn->real_escape_string($input['child_name']) : '';
    $birth_date = isset($input['birth_date']) ? $conn->real_escape_string($input['birth_date']) : '';
    $payment_method = isset($input['payment_method']) ? $conn->real_escape_string($input['payment_method']) : 'pay_now';
    $payment_proof_raw = isset($input['payment_proof']) ? $input['payment_proof'] : '';
    $payment_proof = '';

    // Auto-convert Base64 string to physical image file in uploads/ folder
    if (!empty($payment_proof_raw)) {
        if (strpos($payment_proof_raw, 'data:image/') === 0 || strpos($payment_proof_raw, 'data:application/pdf') === 0) {
            $parts = explode(',', $payment_proof_raw);
            if (count($parts) === 2) {
                $meta = $parts[0];
                $data = base64_decode($parts[1]);

                $ext = 'jpg';
                if (strpos($meta, 'png') !== false) $ext = 'png';
                else if (strpos($meta, 'webp') !== false) $ext = 'webp';
                else if (strpos($meta, 'pdf') !== false) $ext = 'pdf';

                $file_name = 'proof_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                $file_path = $upload_dir . $file_name;

                if (file_put_contents($file_path, $data)) {
                    $payment_proof = $conn->real_escape_string($upload_url_base . $file_name);
                }
            }
        } else {
            $payment_proof = $conn->real_escape_string($payment_proof_raw);
        }
    }
    $whatsapp = isset($input['whatsapp']) ? $conn->real_escape_string($input['whatsapp']) : '';
    $email = isset($input['email']) ? $conn->real_escape_string($input['email']) : '';
    $school_origin = isset($input['school_origin']) ? $conn->real_escape_string($input['school_origin']) : '';
    $attendance_session = isset($input['attendance_session']) ? $conn->real_escape_string($input['attendance_session']) : '';
    $payment_proof = isset($input['payment_proof']) ? $conn->real_escape_string($input['payment_proof']) : '';

    if (empty($level_id) || $slot_number <= 0 || empty($child_name) || empty($birth_date) || empty($parent_name) || empty($whatsapp) || empty($email) || empty($attendance_session)) {
        echo json_encode(['status' => 'error', 'message' => 'Mohon lengkapi seluruh bidang data wajib termasuk Email aktif dan Sesi Kedatangan.']);
        exit();
    }

    $prefix = ($registration_type === 'transfer') ? 'TRF' : 'NEW';
    $ticket_code = 'ELC-' . $prefix . '-' . sprintf("%02d", $slot_number) . '-' . rand(100, 999);

    $conn->begin_transaction();
    try {
        $upd_stmt = $conn->prepare("UPDATE slots SET status = 'booked', holder_name = ? WHERE level_id = ? AND slot_number = ?");
        $upd_stmt->bind_param("ssi", $child_name, $level_id, $slot_number);
        $upd_stmt->execute();

        $ins_stmt = $conn->prepare("INSERT INTO registrations (ticket_code, level_id, slot_number, registration_type, child_name, birth_date, gender, parent_name, whatsapp, email, school_origin, attendance_session, payment_method, payment_proof) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $ins_stmt->bind_param("ssisssssssssss", $ticket_code, $level_id, $slot_number, $registration_type, $child_name, $birth_date, $gender, $parent_name, $whatsapp, $email, $school_origin, $attendance_session, $payment_method, $payment_proof);
        $ins_stmt->execute();

        $conn->commit();

        echo json_encode([
            'status' => 'success',
            'message' => 'Pendaftaran berhasil disimpan!',
            'ticket_code' => $ticket_code,
            'slot_number' => $slot_number
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
        $reg_id = (int)$_POST['id'];
        
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
        
        $reg_id = isset($input['id']) ? (int)$input['id'] : 0;
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
    
    $reg_id = isset($input['id']) ? (int)$input['id'] : 0;
    
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

echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
