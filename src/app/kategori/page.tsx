import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import KategoriClient from './KategoriClient'

export default async function KategoriPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'bendahara') redirect('/dashboard')
  return <KategoriClient session={session} />
}
