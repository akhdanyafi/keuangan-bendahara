-- ============================================================
-- Database: sikaya (Sistem Keuangan Anggaran Yaspida)
-- Import via phpMyAdmin atau: mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS sikaya
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sikaya;

-- ============================================================
-- Tabel: users
-- role:
--   ketua_yayasan   -> menyetujui/menolak pengajuan (Ketua Umum Yayasan)
--   bendahara       -> mencairkan dana & verifikasi nota
--   komponen_sekolah, karyawan_yayasan -> mengajukan anggaran
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('ketua_yayasan','bendahara','komponen_sekolah','karyawan_yayasan') NOT NULL,
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
-- pengaju_id -> pembuat pengajuan (komponen_sekolah / karyawan_yayasan)
-- Satu pengajuan bisa berisi banyak barang (lihat tabel pengajuan_item).
-- nama_barang/quantity/estimasi_harga di sini adalah ringkasan (judul gabungan,
-- total qty, total estimasi) yang dihitung dari item-item di pengajuan_item saat dibuat.
-- ============================================================
CREATE TABLE IF NOT EXISTS pengajuan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pengaju_id INT NOT NULL,
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
  FOREIGN KEY (pengaju_id) REFERENCES users(id),
  FOREIGN KEY (kategori_id) REFERENCES kategori(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (dicairkan_by) REFERENCES users(id),
  FOREIGN KEY (nota_verified_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- Tabel: pengajuan_item
-- Rincian barang per pengajuan (satu pengajuan >= 1 barang).
-- ============================================================
CREATE TABLE IF NOT EXISTS pengajuan_item (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pengajuan_id INT NOT NULL,
  nama_barang VARCHAR(200) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  estimasi_harga DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (pengajuan_id) REFERENCES pengajuan(id)
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

-- Akun Ketua Yayasan (approval) — 6 orang sesuai daftar client
INSERT INTO users (nama, email, password, role) VALUES
('Hj. Lani Melani', 'lani.melani@yaspida.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'ketua_yayasan'),
('Risya Ainun', 'risya.ainun@yaspida.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'ketua_yayasan'),
('Khalida Zia', 'khalida.zia@yaspida.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'ketua_yayasan'),
('Nurfitriani Fauziah', 'nurfitriani.fauziah@yaspida.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'ketua_yayasan'),
('Rio Firmansyah', 'rio.firmansyah@yaspida.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'ketua_yayasan'),
('Syamsa Kriza', 'syamsa.kriza@yaspida.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'ketua_yayasan');

-- Akun Bendahara — 2 orang sesuai daftar client
INSERT INTO users (nama, email, password, role) VALUES
('Pak Andi', 'andi.bendahara@yaspida.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'bendahara'),
('Bu Gita', 'gita.bendahara@yaspida.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'bendahara');

-- Akun Karyawan Yayasan & Komponen Sekolah — daftar nama dari client masih TBD,
-- akun contoh di bawah ini placeholder agar alur bisa dites, ganti/tambah setelah data final diterima.
INSERT INTO users (nama, email, password, role) VALUES
('Karyawan Yayasan (Contoh)', 'karyawan1@yaspida.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'karyawan_yayasan'),
('Komponen Sekolah (Contoh)', 'komponen1@yaspida.id', '$2b$10$03M8xbrfvb5wfuW4WWtDfuS2WjDbyJNpF/88x8/kc1YYtAz5EFE3u', 'komponen_sekolah');

-- Kategori pengajuan (19 bagian sesuai daftar client, item ke-19 masih TBD -> "Lainnya")
INSERT INTO kategori (nama) VALUES
('Aset dan Pembangunan'),
('Acara Event'),
('Transportasi'),
('Peternakan Ayam'),
('Peternakan Sapi'),
('Peternakan Kuda'),
('Pertanian'),
('Perikanan'),
('Protokoler Yayasan'),
('Perawatan Kendaraan'),
('Media dan Promosi'),
('Komponen Sekolah'),
('Logistik'),
('Maintenance'),
('Bisnis Centre'),
('Koperasi'),
('Pembuatan Seragam'),
('Alat Tulis Kantor'),
('Lainnya');

-- Budget contoh per kategori untuk tahun 2026 (placeholder, sesuaikan dengan anggaran riil)
INSERT INTO budget (kategori_id, tahun, jumlah) VALUES
(1, 2026, 100000000),
(2, 2026, 40000000),
(3, 2026, 25000000),
(4, 2026, 15000000),
(5, 2026, 20000000),
(6, 2026, 10000000),
(7, 2026, 15000000),
(8, 2026, 10000000),
(9, 2026, 20000000),
(10, 2026, 15000000),
(11, 2026, 10000000),
(12, 2026, 30000000),
(13, 2026, 15000000),
(14, 2026, 20000000),
(15, 2026, 15000000),
(16, 2026, 10000000),
(17, 2026, 10000000),
(18, 2026, 10000000),
(19, 2026, 5000000);

-- ============================================================
-- Contoh Data Pengajuan
-- pengaju_id 9 = Karyawan Yayasan (Contoh), 10 = Komponen Sekolah (Contoh)
-- approved_by mengacu ke akun ketua_yayasan (id 1-6), dicairkan_by/nota_verified_by ke bendahara (id 7-8)
-- ============================================================
INSERT INTO pengajuan (pengaju_id, nama_barang, quantity, kategori_id, alasan, estimasi_harga, vendor, status, tanggal_pengajuan, submitted_at, approved_at, approved_by, dicairkan_at, dicairkan_by, nominal_aktual, foto_nota, tanggal_pembelian, nota_uploaded_at, nota_verified_at, nota_verified_by, selesai_at) VALUES
(10, 'Proyektor Epson EB-X41', 1, 12, 'Kebutuhan pembelajaran kelas 9, proyektor lama rusak', 5000000, 'Toko Elektronik Maju', 'selesai', '2026-06-01', '2026-06-01 08:00:00', '2026-06-02 09:00:00', 1, '2026-06-03 10:00:00', 7, 4900000, NULL, '2026-06-05', '2026-06-05 14:00:00', '2026-06-06 09:00:00', 7, '2026-06-06 09:00:00'),
(10, 'Kertas HVS A4', 5, 18, 'Stok kertas habis untuk ujian semester', 250000, 'ATK Makmur', 'selesai', '2026-06-10', '2026-06-10 08:00:00', '2026-06-10 12:00:00', 1, '2026-06-11 08:00:00', 7, 240000, NULL, '2026-06-11', '2026-06-11 15:00:00', '2026-06-12 09:00:00', 7, '2026-06-12 09:00:00'),
(9, 'Sound System Portable', 1, 2, 'Kebutuhan acara perpisahan kelas 12', 3500000, 'Audio Central', 'dana_dicairkan', '2026-06-15', '2026-06-15 09:00:00', '2026-06-16 10:00:00', 2, '2026-06-17 08:00:00', 8, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'Cat Tembok Kelas', 10, 14, 'Renovasi kelas 7A, tembok terkelupas', 1500000, NULL, 'pending_approval', '2026-06-20', '2026-06-20 10:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 'Meja Guru Baru +1 barang lainnya', 2, 12, 'Meja & kursi guru kelas 8 rusak', 2500000, 'Toko Mebel Jaya', 'approved', '2026-06-22', '2026-06-22 08:00:00', '2026-06-23 09:00:00', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Rincian barang per pengajuan di atas (id 1-5 mengikuti urutan INSERT di atas pada database baru)
INSERT INTO pengajuan_item (pengajuan_id, nama_barang, quantity, estimasi_harga) VALUES
(1, 'Proyektor Epson EB-X41', 1, 5000000),
(2, 'Kertas HVS A4', 5, 250000),
(3, 'Sound System Portable', 1, 3500000),
(4, 'Cat Tembok Kelas', 10, 1500000),
(5, 'Meja Guru Baru', 1, 2000000),
(5, 'Kursi Guru', 1, 500000);
