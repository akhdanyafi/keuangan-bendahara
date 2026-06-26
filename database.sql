-- ============================================================
-- Database: keuangan_bendahara
-- Import via phpMyAdmin atau: mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS keuangan_bendahara
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE keuangan_bendahara;

-- ============================================================
-- Tabel: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('guru','kepala_sekolah','bendahara') NOT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: kategori
-- ============================================================
CREATE TABLE IF NOT EXISTS kategori (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: budget
-- ============================================================
CREATE TABLE IF NOT EXISTS budget (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kategori_id INT NOT NULL,
  tahun YEAR NOT NULL,
  jumlah DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori(id),
  UNIQUE KEY uq_budget (kategori_id, tahun)
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: pengajuan
-- ============================================================
CREATE TABLE IF NOT EXISTS pengajuan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guru_id INT NOT NULL,
  nama_barang VARCHAR(200) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  kategori_id INT NOT NULL,
  alasan TEXT NOT NULL,
  estimasi_harga DECIMAL(15,2) NOT NULL,
  vendor VARCHAR(200) DEFAULT NULL,
  lampiran_penawaran VARCHAR(500) DEFAULT NULL,
  status ENUM(
    'draft',
    'pending_approval',
    'approved',
    'rejected',
    'dana_dicairkan',
    'menunggu_nota',
    'nota_diverifikasi',
    'selesai'
  ) NOT NULL DEFAULT 'draft',
  catatan_penolakan TEXT DEFAULT NULL,
  catatan_pencairan TEXT DEFAULT NULL,
  nominal_aktual DECIMAL(15,2) DEFAULT NULL,
  foto_nota VARCHAR(500) DEFAULT NULL,
  tanggal_pembelian DATE DEFAULT NULL,
  catatan_nota TEXT DEFAULT NULL,
  tanggal_pengajuan DATE NOT NULL,
  submitted_at DATETIME DEFAULT NULL,
  approved_at DATETIME DEFAULT NULL,
  approved_by INT DEFAULT NULL,
  dicairkan_at DATETIME DEFAULT NULL,
  dicairkan_by INT DEFAULT NULL,
  nota_uploaded_at DATETIME DEFAULT NULL,
  nota_verified_at DATETIME DEFAULT NULL,
  nota_verified_by INT DEFAULT NULL,
  selesai_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (guru_id) REFERENCES users(id),
  FOREIGN KEY (kategori_id) REFERENCES kategori(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (dicairkan_by) REFERENCES users(id),
  FOREIGN KEY (nota_verified_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: notifikasi
-- ============================================================
CREATE TABLE IF NOT EXISTS notifikasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pengajuan_id INT NOT NULL,
  pesan TEXT NOT NULL,
  dibaca TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (pengajuan_id) REFERENCES pengajuan(id)
) ENGINE=InnoDB;

-- ============================================================
-- Seed Data
-- ============================================================

-- Password untuk semua akun: password123
-- Hash bcrypt (password123): $2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u

INSERT INTO users (nama, email, password, role) VALUES
('Admin Bendahara', 'bendahara@sekolah.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'bendahara'),
('Budi Santoso', 'kepala@sekolah.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'kepala_sekolah'),
('Siti Rahayu', 'guru1@sekolah.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'guru'),
('Ahmad Fauzi', 'guru2@sekolah.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'guru');

INSERT INTO kategori (nama) VALUES
('ATK (Alat Tulis Kantor)'),
('Sarana Prasarana'),
('Kegiatan Sekolah'),
('Listrik & Utilitas'),
('Lainnya');

INSERT INTO budget (kategori_id, tahun, jumlah) VALUES
(1, 2026, 10000000),
(2, 2026, 50000000),
(3, 2026, 30000000),
(4, 2026, 15000000),
(5, 2026, 5000000);

-- ============================================================
-- Contoh Data Pengajuan
-- ============================================================
INSERT INTO pengajuan (guru_id, nama_barang, quantity, kategori_id, alasan, estimasi_harga, vendor, status, tanggal_pengajuan, submitted_at, approved_at, approved_by, dicairkan_at, dicairkan_by, nominal_aktual, foto_nota, tanggal_pembelian, nota_uploaded_at, nota_verified_at, nota_verified_by, selesai_at) VALUES
(3, 'Proyektor Epson EB-X41', 1, 2, 'Kebutuhan pembelajaran kelas 9, proyektor lama rusak', 5000000, 'Toko Elektronik Maju', 'selesai', '2026-06-01', '2026-06-01 08:00:00', '2026-06-02 09:00:00', 2, '2026-06-03 10:00:00', 1, 4900000, NULL, '2026-06-05', '2026-06-05 14:00:00', '2026-06-06 09:00:00', 1, '2026-06-06 09:00:00'),
(3, 'Kertas HVS A4', 5, 1, 'Stok kertas habis untuk ujian semester', 250000, 'ATK Makmur', 'selesai', '2026-06-10', '2026-06-10 08:00:00', '2026-06-10 12:00:00', 2, '2026-06-11 08:00:00', 1, 240000, NULL, '2026-06-11', '2026-06-11 15:00:00', '2026-06-12 09:00:00', 1, '2026-06-12 09:00:00'),
(4, 'Sound System Portable', 1, 3, 'Kebutuhan acara perpisahan kelas 12', 3500000, 'Audio Central', 'dana_dicairkan', '2026-06-15', '2026-06-15 09:00:00', '2026-06-16 10:00:00', 2, '2026-06-17 08:00:00', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'Cat Tembok Kelas', 10, 2, 'Renovasi kelas 7A, tembok terkelupas', 1500000, NULL, 'pending_approval', '2026-06-20', '2026-06-20 10:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'Meja Guru Baru', 1, 2, 'Meja guru kelas 8 rusak', 2000000, 'Toko Mebel Jaya', 'approved', '2026-06-22', '2026-06-22 08:00:00', '2026-06-23 09:00:00', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
