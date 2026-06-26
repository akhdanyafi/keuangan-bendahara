import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import PengajuanDetail from './PengajuanDetail'

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  return <PengajuanDetail id={id} session={session} />
}
