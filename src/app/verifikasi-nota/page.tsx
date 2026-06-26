import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import VerifikasiNotaClient from './VerifikasiNotaClient'

export default async function VerifikasiNotaPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'bendahara') redirect('/dashboard')

  return <VerifikasiNotaClient session={session} />
}
