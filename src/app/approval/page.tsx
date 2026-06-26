import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ApprovalClient from './ApprovalClient'

export default async function ApprovalPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'kepala_sekolah') redirect('/dashboard')

  return <ApprovalClient session={session} />
}
