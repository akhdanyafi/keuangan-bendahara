import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import FormPengajuan from './FormPengajuan'

export default async function BaruPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'guru') redirect('/dashboard')

  return <FormPengajuan session={session} />
}
