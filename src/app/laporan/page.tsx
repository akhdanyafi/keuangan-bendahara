import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LaporanClient from './LaporanClient'

export default async function LaporanPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!['bendahara', 'kepala_sekolah'].includes(session.role)) redirect('/dashboard')

  return <LaporanClient session={session} />
}
