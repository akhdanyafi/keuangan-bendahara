import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import PenggunaClient from './PenggunaClient'

export default async function PenggunaPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'bendahara') redirect('/dashboard')

  return <PenggunaClient session={session} />
}
