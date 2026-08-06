-- Cloudflare D1 (SQLite) Schema for Open House Helpdesk

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS levels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    category TEXT NOT NULL,
    quota INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level_id TEXT NOT NULL,
    slot_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    holder_name TEXT,
    FOREIGN KEY (level_id) REFERENCES levels(id)
);

CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_code TEXT UNIQUE NOT NULL,
    level_id TEXT NOT NULL,
    slot_number INTEGER NOT NULL,
    registration_type TEXT NOT NULL,
    child_name TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    gender TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    school_origin TEXT,
    attendance_session TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    payment_proof TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (level_id) REFERENCES levels(id)
);

CREATE TABLE IF NOT EXISTS assessment_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    level TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS assessment_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (schedule_id) REFERENCES assessment_schedules(id),
    FOREIGN KEY (student_id) REFERENCES registrations(id)
);

-- Insert Default Super Admin
INSERT INTO admins (username, password, name) VALUES ('admin', 'Edelweiss2026', 'Super Admin');

-- Note: You will need to insert your 'levels' and 'slots' data here.
-- Example:
-- INSERT INTO levels (id, name, code, category, quota) VALUES ('fs-kiddy1', 'Foundation Stage Kiddy 1', 'FS-K1', 'kiddy', 20);
-- INSERT INTO slots (level_id, slot_number) VALUES ('fs-kiddy1', 1), ('fs-kiddy1', 2);
