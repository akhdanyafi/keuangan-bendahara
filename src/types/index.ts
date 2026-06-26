export type Role = 'guru' | 'kepala_sekolah' | 'bendahara'

export type StatusPengajuan =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'dana_dicairkan'
  | 'menunggu_nota'
  | 'nota_diverifikasi'
  | 'selesai'

export interface User {
  id: number
  nama: string
  email: string
  role: Role
  aktif: number
  created_at: string
}

export interface Kategori {
  id: number
  nama: string
  aktif: number
}

export interface Budget {
  id: number
  kategori_id: number
  kategori_nama: string
  tahun: number
  jumlah: number
  terpakai: number
  sisa: number
  persen: number
}

export interface Pengajuan {
  id: number
  guru_id: number
  guru_nama: string
  nama_barang: string
  quantity: number
  kategori_id: number
  kategori_nama: string
  alasan: string
  estimasi_harga: number
  vendor: string | null
  lampiran_penawaran: string | null
  status: StatusPengajuan
  catatan_penolakan: string | null
  catatan_pencairan: string | null
  nominal_aktual: number | null
  foto_nota: string | null
  tanggal_pembelian: string | null
  catatan_nota: string | null
  tanggal_pengajuan: string
  submitted_at: string | null
  approved_at: string | null
  approved_by_nama: string | null
  dicairkan_at: string | null
  dicairkan_by_nama: string | null
  nota_uploaded_at: string | null
  nota_verified_at: string | null
  nota_verified_by_nama: string | null
  selesai_at: string | null
  created_at: string
}

export interface Notifikasi {
  id: number
  pengajuan_id: number
  pesan: string
  dibaca: number
  created_at: string
}

export const STATUS_LABEL: Record<StatusPengajuan, string> = {
  draft: 'Draft',
  pending_approval: 'Menunggu Approval',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  dana_dicairkan: 'Dana Dicairkan',
  menunggu_nota: 'Menunggu Nota',
  nota_diverifikasi: 'Nota Diverifikasi',
  selesai: 'Selesai',
}

export const STATUS_COLOR: Record<StatusPengajuan, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  dana_dicairkan: 'bg-blue-100 text-blue-800',
  menunggu_nota: 'bg-orange-100 text-orange-800',
  nota_diverifikasi: 'bg-teal-100 text-teal-800',
  selesai: 'bg-purple-100 text-purple-800',
}

export function formatRupiah(value: number | null | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
