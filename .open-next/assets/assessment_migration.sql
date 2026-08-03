-- Migrasi Schema Database untuk Modul Profiling Assessment

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS assessment_allocations;
DROP TABLE IF EXISTS assessment_schedules;
SET FOREIGN_KEY_CHECKS = 1;

-- Table for Assessment Schedules
CREATE TABLE assessment_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    level ENUM('kiddy', 'primary', 'secondary') NOT NULL,
    capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Assessment Allocations (Pivot Table)
CREATE TABLE assessment_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('allocated', 'completed', 'cancelled') DEFAULT 'allocated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES assessment_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES registrations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_allocation (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tambahkan indeks untuk mempercepat pencarian berdasarkan level dan schedule_id
CREATE INDEX idx_schedule_level ON assessment_schedules(level);
CREATE INDEX idx_allocation_schedule ON assessment_allocations(schedule_id);
