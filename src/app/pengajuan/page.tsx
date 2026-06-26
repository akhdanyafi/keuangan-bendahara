import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import PengajuanList from './PengajuanList'

export default async function PengajuanPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return <PengajuanList session={session} />
}
