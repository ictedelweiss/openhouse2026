-- Database Schema for Open House Registration & Seat Quota
-- Import this SQL file into your phpMyAdmin database

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS levels;
SET FOREIGN_KEY_CHECKS = 1;

-- Table for Admin Users
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Levels / Programs
CREATE TABLE levels (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quota INT NOT NULL DEFAULT 40,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Seats / Slots
CREATE TABLE slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_id VARCHAR(50) NOT NULL,
    slot_number INT NOT NULL,
    status ENUM('available', 'reserved', 'booked') DEFAULT 'available',
    holder_name VARCHAR(100) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_level_slot (level_id, slot_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Registrations Data
CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_code VARCHAR(30) NOT NULL UNIQUE,
    level_id VARCHAR(50) NOT NULL,
    slot_number INT NOT NULL,
    registration_type ENUM('new', 'transfer') DEFAULT 'new',
    child_name VARCHAR(150) NOT NULL,
    birth_date DATE NOT NULL,
    gender ENUM('L', 'P') NOT NULL,
    parent_name VARCHAR(150) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    email VARCHAR(100) NOT NULL, -- Mandatory
    school_origin VARCHAR(150) NULL,
    attendance_session VARCHAR(100) NOT NULL,
    payment_method ENUM('pay_now', 'pay_onsite') NOT NULL DEFAULT 'pay_now',
    payment_proof VARCHAR(500) NULL, -- File URL on server (uploads/ directory)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_child_registration (child_name, birth_date),
    INDEX idx_level_id (level_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Additional Performance Indexes
CREATE INDEX IF NOT EXISTS idx_slots_level_status ON slots(level_id, status);
CREATE INDEX IF NOT EXISTS idx_levels_category ON levels(category);


-- Default Admin User
INSERT INTO admins (username, password, name) VALUES ('admin', 'admin123', 'Administrator Edelweiss');

-- Seed Data:
INSERT INTO levels (id, code, name, category, quota) VALUES
('fs-kiddy1', 'Kiddy 1', 'Edelweiss Formal School - Kiddy 1 (Preschool)', 'formal', 20),
('fs-kiddy2', 'Kiddy 2', 'Edelweiss Formal School - Kiddy 2 (Preschool)', 'formal', 25),
('fs-k1', 'K1', 'Edelweiss Formal School - K1 / TK A (Preschool)', 'formal', 40),
('fs-k2', 'K2', 'Edelweiss Formal School - K2 / TK B (Preschool)', 'formal', 40),
('fs-p1', 'Primary 1', 'Edelweiss Formal School - Primary 1 (Kelas 1 SD)', 'formal', 40),
('fs-s1', 'Secondary 1', 'Edelweiss Formal School - Secondary 1 (Kelas 7 SMP)', 'formal', 30),
('hs-p1', 'Primary 1 (HS)', 'Edelweiss Academia Home Schooling - Primary 1', 'homeschooling', 10),
('hs-ls1', 'Lower Secondary 1', 'Edelweiss Academia Home Schooling - Lower Secondary 1', 'homeschooling', 10),
('hs-us1', 'Upper Secondary 1', 'Edelweiss Academia Home Schooling - Upper Secondary 1', 'homeschooling', 10),
('tr-ps-kiddy2', 'Kiddy 2 (Pindahan)', 'Siswa Pindahan Preschool - Kiddy 2', 'transfer', 15),
('tr-ps-k2', 'K2 (Pindahan)', 'Siswa Pindahan Preschool - K2', 'transfer', 15),
('tr-p2', 'Primary 2', 'Siswa Pindahan Primary - Primary 2', 'transfer', 20),
('tr-p3', 'Primary 3', 'Siswa Pindahan Primary - Primary 3', 'transfer', 20),
('tr-p4', 'Primary 4', 'Siswa Pindahan Primary - Primary 4', 'transfer', 20),
('tr-p5', 'Primary 5', 'Siswa Pindahan Primary - Primary 5', 'transfer', 20),
('tr-p6', 'Primary 6', 'Siswa Pindahan Primary - Primary 6', 'transfer', 20),
('tr-s1', 'Secondary 1', 'Siswa Pindahan Secondary - Secondary 1', 'transfer', 15),
('tr-s2', 'Secondary 2', 'Siswa Pindahan Secondary - Secondary 2', 'transfer', 15),
('tr-s3', 'Secondary 3', 'Siswa Pindahan Secondary - Secondary 3', 'transfer', 15);

-- Procedure to generate initial slots automatically
DELIMITER //
CREATE PROCEDURE PopulateSlots()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE lvl_id VARCHAR(50);
    DECLARE lvl_quota INT;
    DECLARE cur CURSOR FOR SELECT id, quota FROM levels;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO lvl_id, lvl_quota;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET @i = 1;
        WHILE @i <= lvl_quota DO
            INSERT IGNORE INTO slots (level_id, slot_number, status) VALUES (lvl_id, @i, 'available');
            SET @i = @i + 1;
        END WHILE;
    END LOOP;

    CLOSE cur;
END //
DELIMITER ;

CALL PopulateSlots();

-- Initial Seed Registrations
INSERT INTO registrations (ticket_code, level_id, slot_number, registration_type, child_name, birth_date, gender, parent_name, whatsapp, email, school_origin, attendance_session, payment_method) VALUES
('ELC-NEW-P1-01-382', 'fs-p1', 1, 'new', 'Rayhan Pratama', '2018-05-12', 'L', 'Budi Pratama', '081234567890', 'budi@gmail.com', 'TK Edelweiss', 'Hari 1: Sabtu, 8 Agustus 2026 (08.00 - 10.00)', 'pay_now'),
('ELC-NEW-P1-02-491', 'fs-p1', 2, 'new', 'Aisha Humaira', '2018-07-18', 'P', 'Siti Rahma', '081987654321', 'siti@gmail.com', 'TK Melati', 'Hari 1: Sabtu, 8 Agustus 2026 (10.00 - 12.00)', 'pay_onsite'),
('ELC-TRF-P2-01-102', 'tr-p2', 1, 'transfer', 'Kevin Alexander', '2017-03-05', 'L', 'Alexander', '081122334455', 'alex@gmail.com', 'SD Nusantara', 'Hari 2: Sabtu, 15 Agustus 2026 (08.00 - 10.00)', 'pay_now');

UPDATE slots SET status = 'booked', holder_name = 'Rayhan Pratama' WHERE level_id = 'fs-p1' AND slot_number = 1;
UPDATE slots SET status = 'booked', holder_name = 'Aisha Humaira' WHERE level_id = 'fs-p1' AND slot_number = 2;
UPDATE slots SET status = 'booked', holder_name = 'Kevin Alexander' WHERE level_id = 'tr-p2' AND slot_number = 1;
