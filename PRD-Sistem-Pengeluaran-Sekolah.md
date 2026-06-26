# Product Requirements Document (PRD)
## Sistem Pengajuan dan Approval Pengeluaran Sekolah

| | |
|---|---|
| **Versi** | 1.0 (MVP) |
| **Status** | Draft |
| **Tanggal** | 24 Juni 2026 |
| **Dibuat oleh** | — |

---

## 1. Latar Belakang

Sekolah membutuhkan sistem digital untuk mengelola alur pengajuan dan persetujuan pengeluaran dana. Saat ini proses pengajuan masih dilakukan secara manual (kertas atau pesan instan), yang menyebabkan sulitnya pelacakan status, transparansi anggaran, dan pembuatan laporan keuangan yang akurat dan tepat waktu.

Sistem ini dirancang untuk mendigitalisasi seluruh alur — mulai dari pengajuan oleh guru, proses approval oleh kepala sekolah, pencairan dana oleh bendahara, hingga verifikasi nota dan pelaporan akhir.

---

## 2. Tujuan Produk

- Menyederhanakan dan mendokumentasikan proses pengajuan pembelian barang/kebutuhan sekolah.
- Memberikan transparansi alur persetujuan antar pihak (guru, kepala sekolah, bendahara).
- Menyediakan laporan pengeluaran yang akurat dan dapat diekspor.
- Mengontrol realisasi anggaran per kategori secara real-time.

---

## 3. Ruang Lingkup (MVP v1)

**Termasuk:**
- Manajemen login dan role pengguna
- Pengajuan pembelian oleh guru
- Approval/reject oleh kepala sekolah
- Pencairan dana oleh bendahara
- Upload dan verifikasi nota
- Dashboard pengeluaran
- Laporan bulanan
- Export Excel

**Tidak termasuk (dipertimbangkan untuk versi berikutnya):**
- Notifikasi WhatsApp
- Approval multi-tingkat
- Laporan per guru
- Integrasi sistem akuntansi eksternal

---

## 4. Pengguna (User Roles)

### 4.1 Guru
Pengguna yang mengajukan kebutuhan pembelian dan bertanggung jawab mengunggah bukti pembelian.

**Dapat:**
- Membuat pengajuan pembelian
- Mengisi alasan dan estimasi biaya
- Melihat status pengajuan miliknya
- Mengunggah foto nota setelah pembelian dilakukan

### 4.2 Kepala Sekolah (Approver)
Pengguna yang berwenang menyetujui atau menolak pengajuan.

**Dapat:**
- Melihat semua pengajuan yang masuk
- Menyetujui (approve) pengajuan
- Menolak (reject) pengajuan beserta catatan alasan
- Memantau status anggaran per kategori

### 4.3 Bendahara
Pengguna yang mengelola pencairan dana dan memverifikasi bukti transaksi.

**Dapat:**
- Melihat pengajuan yang telah disetujui
- Menandai dana sudah dicairkan
- Memverifikasi nota yang diunggah guru
- Mengelola dan mengekspor laporan pengeluaran

---

## 5. Alur Bisnis (Business Flow)

```
Guru membuat pengajuan
        ↓
Status: Draft
        ↓
Guru submit pengajuan
        ↓
Status: Pending Approval
        ↓
Kepala Sekolah meninjau
        ↓
   ┌────┴────┐
Approve    Reject
   ↓          ↓
Status:    Status:
Approved   Rejected (selesai)
   ↓
Bendahara mencairkan dana
        ↓
Status: Dana Dicairkan
        ↓
Guru melakukan pembelian
        ↓
Status: Menunggu Nota
        ↓
Guru upload foto nota
        ↓
Bendahara memverifikasi nota
        ↓
Status: Nota Diverifikasi
        ↓
Status: Selesai → Masuk Laporan
```

---

## 6. Status Workflow

| Status | Keterangan | Aktor |
|---|---|---|
| **Draft** | Pengajuan baru dibuat, belum disubmit | Guru |
| **Pending Approval** | Menunggu persetujuan kepala sekolah | Sistem |
| **Approved** | Pengajuan disetujui | Kepala Sekolah |
| **Rejected** | Pengajuan ditolak (disertai catatan) | Kepala Sekolah |
| **Dana Dicairkan** | Uang sudah diberikan kepada guru | Bendahara |
| **Menunggu Nota** | Menunggu bukti pembelian dari guru | Guru |
| **Nota Diverifikasi** | Nota valid dan telah diverifikasi | Bendahara |
| **Selesai** | Transaksi selesai, masuk laporan pengeluaran | Sistem |

---

## 7. Fitur dan Persyaratan Fungsional

### 7.1 Modul Autentikasi & Manajemen User

- Login menggunakan email dan password
- Sistem role berbasis akses (RBAC): Guru, Kepala Sekolah, Bendahara
- Satu akun hanya memiliki satu role aktif
- Manajemen pengguna (tambah, edit, nonaktifkan) oleh admin/bendahara

### 7.2 Modul Pengajuan Pembelian

Guru mengisi form pengajuan dengan data berikut:

**Data Pengajuan:**

| Field | Tipe | Wajib |
|---|---|---|
| Tanggal Pengajuan | Date (auto-fill) | Ya |
| Nama Guru | Text (auto-fill dari akun) | Ya |
| Nama Barang | Text | Ya |
| Kategori | Dropdown | Ya |
| Alasan Pembelian | Textarea | Ya |
| Estimasi Harga | Currency (Rp) | Ya |
| Vendor/Toko | Text | Tidak |
| Lampiran Penawaran | File upload (PDF/JPG) | Tidak |

**Kategori yang tersedia (dapat dikonfigurasi):**
- ATK (Alat Tulis Kantor)
- Sarana Prasarana
- Kegiatan Sekolah
- Listrik & Utilitas
- Lainnya

**Contoh pengajuan:**
```
Nama Barang  : Proyektor Epson EB-X41
Kategori     : Sarana Prasarana
Alasan       : Kebutuhan pembelajaran kelas 9, proyektor lama rusak
Estimasi     : Rp 5.000.000
Vendor       : Toko Elektronik Maju
```

### 7.3 Modul Approval

- Kepala sekolah melihat daftar pengajuan berstatus **Pending Approval**
- Dapat melihat detail lengkap pengajuan sebelum memutuskan
- Tombol **Approve** dan **Reject**
- Jika reject, wajib mengisi catatan alasan penolakan
- Guru mendapatkan notifikasi in-app setelah keputusan dibuat

### 7.4 Modul Pencairan Dana

- Bendahara melihat daftar pengajuan berstatus **Approved**
- Tombol **Tandai Dana Dicairkan** mengubah status menjadi *Dana Dicairkan*, lalu otomatis ke *Menunggu Nota*
- Bendahara dapat menambahkan catatan pencairan (opsional)

### 7.5 Modul Upload & Verifikasi Nota

**Form Realisasi Pembelian (diisi guru):**

| Field | Tipe | Wajib |
|---|---|---|
| Nominal Aktual | Currency (Rp) | Ya |
| Foto Nota | File upload (JPG/PNG/PDF) | Ya |
| Tanggal Pembelian | Date | Ya |
| Catatan Tambahan | Textarea | Tidak |

- Bendahara meninjau nota yang diunggah
- Tombol **Verifikasi** atau **Minta Perbaikan** (jika nota tidak valid)
- Setelah diverifikasi, status berubah menjadi *Selesai* dan transaksi masuk laporan

### 7.6 Modul Dashboard

Dashboard menampilkan ringkasan real-time untuk masing-masing role.

**Summary Cards:**

| Card | Deskripsi |
|---|---|
| Pengeluaran Bulan Ini | Total realisasi bulan berjalan |
| Pengeluaran Tahun Ini | Total realisasi tahun berjalan |
| Pengajuan Menunggu Approval | Jumlah pengajuan berstatus Pending Approval |
| Menunggu Nota | Jumlah transaksi yang belum upload nota |

**Grafik Bulanan:** Bar chart pengeluaran per bulan (Jan–Des)

**Grafik Kategori:** Pie/donut chart distribusi pengeluaran per kategori

**Tabel Budget per Kategori:**

| Kategori | Budget | Terpakai | Sisa | % |
|---|---|---|---|---|
| ATK | Rp 10.000.000 | Rp 8.000.000 | Rp 2.000.000 | 80% |
| Sarana | Rp 50.000.000 | Rp 42.000.000 | Rp 8.000.000 | 84% |
| Kegiatan | Rp 30.000.000 | Rp 12.000.000 | Rp 18.000.000 | 40% |

### 7.7 Modul Laporan & Export

- Laporan pengeluaran bulanan dan tahunan
- Filter berdasarkan: periode, kategori, status
- Export ke format **Excel (.xlsx)**
- Laporan hanya menampilkan transaksi berstatus **Selesai**

---

## 8. Persyaratan Non-Fungsional

| Aspek | Ketentuan |
|---|---|
| **Performa** | Halaman utama load < 3 detik pada koneksi 4G |
| **Keamanan** | Autentikasi JWT, data sensitif dienkripsi |
| **Aksesibilitas** | Dapat diakses via browser desktop dan mobile |
| **Ketersediaan** | Uptime minimal 99% pada jam kerja (07.00–17.00) |
| **Backup** | Data di-backup otomatis harian |

---

## 9. Asumsi & Batasan

- Setiap pengajuan hanya memerlukan **satu tingkat approval** (kepala sekolah).
- Nominal realisasi boleh berbeda dari estimasi (perlu konfirmasi ke klien).
- Tidak ada batas maksimal jumlah pengajuan per guru per bulan (perlu konfirmasi).
- Notifikasi menggunakan sistem in-app, bukan WhatsApp (untuk MVP).
- Budget per kategori diinput manual oleh bendahara di awal periode.

---

## 10. Pertanyaan Terbuka (Perlu Konfirmasi ke Klien)

Berikut adalah hal-hal yang perlu diklarifikasi sebelum pengembangan dimulai:

| No | Pertanyaan | Opsi / Catatan |
|---|---|---|
| 1 | Siapa yang berwenang melakukan approval? | Kepala Sekolah / Wakil Kepala / Yayasan? |
| 2 | Apakah approval bisa lebih dari 1 tingkat? | Jika ya, urutan approval perlu dipetakan |
| 3 | Jika nota tidak diupload dalam N hari, apa yang terjadi? | Reminder otomatis? Sanksi tertentu? |
| 4 | Apakah nominal realisasi boleh berbeda dari estimasi? | Jika ya, apakah ada batas selisih? |
| 5 | Apakah perlu export PDF selain Excel? | — |
| 6 | Apakah perlu notifikasi WhatsApp? | Bisa via Fonnte / WA Business API |
| 7 | Apakah perlu laporan pengeluaran per guru? | — |
| 8 | Apakah ada batas maksimal nominal per pengajuan? | Misalnya: max Rp 10.000.000 tanpa persetujuan yayasan |
| 9 | Siapa yang menginput budget awal per kategori? | Bendahara / Kepala Sekolah? |
| 10 | Apakah satu guru bisa punya lebih dari satu pengajuan aktif sekaligus? | — |

---

## 11. Milestone & Deliverable (Rencana Awal)

| Fase | Deliverable | Estimasi |
|---|---|---|
| **Discovery** | Konfirmasi requirement, finalisasi PRD | Minggu 1 |
| **Design** | ERD Database, Wireframe Figma, Product Backlog | Minggu 2 |
| **Sprint 1** | Login, manajemen user, pengajuan, approval | Minggu 3–4 |
| **Sprint 2** | Pencairan dana, upload nota, verifikasi | Minggu 5–6 |
| **Sprint 3** | Dashboard, laporan, export Excel | Minggu 7–8 |
| **UAT** | User Acceptance Testing bersama klien | Minggu 9 |
| **Launch** | Deploy ke production | Minggu 10 |

---

## 12. Referensi Teknis (Saran Awal)

Dokumen ini dapat menjadi dasar untuk menyusun:

- **Product Backlog Scrum** — breakdown user story per sprint
- **ERD Database** — entitas utama: `users`, `submissions`, `approvals`, `disbursements`, `receipts`, `categories`, `budgets`
- **Wireframe Figma** — halaman: Dashboard, Form Pengajuan, List Pengajuan, Detail Pengajuan, Laporan

---

*Dokumen ini bersifat living document dan akan diperbarui seiring hasil konfirmasi dengan klien.*
