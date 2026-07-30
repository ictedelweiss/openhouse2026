<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'openhouse_db';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. ADMIN LOGIN AUTHENTICATION
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

// 2. GET ALL LEVELS & SLOTS DATA
if ($action === 'get_data' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $levels_query = "SELECT * FROM levels ORDER BY category ASC, id ASC";
    $levels_result = $conn->query($levels_query);
    
    $data = [];
    if ($levels_result && $levels_result->num_rows > 0) {
        while ($level = $levels_result->fetch_assoc()) {
            $level_id = $level['id'];
            
            $slots_stmt = $conn->prepare("SELECT slot_number, status, holder_name FROM slots WHERE level_id = ? ORDER BY slot_number ASC");
            $slots_stmt->bind_param("s", $level_id);
            $slots_stmt->execute();
            $slots_res = $slots_stmt->get_result();
            
            $slots = [];
            $booked_count = 0;
            while ($s = $slots_res->fetch_assoc()) {
                $slots[] = [
                    'number' => (int)$s['slot_number'],
                    'status' => $s['status'],
                    'holder' => $s['holder_name']
                ];
                if ($s['status'] === 'booked') {
                    $booked_count++;
                }
            }
            
            $data[] = [
                'id' => $level['id'],
                'name' => $level['name'],
                'code' => $level['code'],
                'category' => $level['category'],
                'quota' => (int)$level['quota'],
                'booked' => $booked_count,
                'available' => (int)$level['quota'] - $booked_count,
                'slots' => $slots
            ];
        }
    }
    
    echo json_encode(['status' => 'success', 'data' => $data]);
    exit();
}

// 3. GET ALL REGISTRATIONS FOR ADMIN DASHBOARD
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

// 4. REGISTER APPLICANT WITH ATTENDANCE & PAYMENT
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
    $gender = isset($input['gender']) ? $conn->real_escape_string($input['gender']) : 'L';
    $parent_name = isset($input['parent_name']) ? $conn->real_escape_string($input['parent_name']) : '';
    $whatsapp = isset($input['whatsapp']) ? $conn->real_escape_string($input['whatsapp']) : '';
    $email = isset($input['email']) ? $conn->real_escape_string($input['email']) : '';
    $school_origin = isset($input['school_origin']) ? $conn->real_escape_string($input['school_origin']) : '';
    $attendance_session = isset($input['attendance_session']) ? $conn->real_escape_string($input['attendance_session']) : '';
    $payment_method = isset($input['payment_method']) ? $conn->real_escape_string($input['payment_method']) : 'pay_now';
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

// 5. UPDATE PAYMENT PROOF (ADMIN UPLOAD BUKTI UNTUK PAY ON-SITE / PAY NOW)
if ($action === 'upload_payment_proof' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);
    
    $reg_id = isset($input['id']) ? (int)$input['id'] : 0;
    $payment_proof = isset($input['payment_proof']) ? $conn->real_escape_string($input['payment_proof']) : '';

    if ($reg_id <= 0 || empty($payment_proof)) {
        echo json_encode(['status' => 'error', 'message' => 'ID Pendaftaran atau Bukti Bayar tidak boleh kosong.']);
        exit();
    }

    $upd = $conn->prepare("UPDATE registrations SET payment_proof = ? WHERE id = ?");
    $upd->bind_param("si", $payment_proof, $reg_id);
    if ($upd->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Bukti pembayaran berhasil di-upload!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui bukti pembayaran.']);
    }
    exit();
}

// 6. DELETE REGISTRATION
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
        $get_stmt = $conn->prepare("SELECT level_id, slot_number FROM registrations WHERE id = ?");
        $get_stmt->bind_param("i", $reg_id);
        $get_stmt->execute();
        $reg_data = $get_stmt->get_result()->fetch_assoc();

        if ($reg_data) {
            $free_stmt = $conn->prepare("UPDATE slots SET status = 'available', holder_name = NULL WHERE level_id = ? AND slot_number = ?");
            $free_stmt->bind_param("si", $reg_data['level_id'], $reg_data['slot_number']);
            $free_stmt->execute();
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
