import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import PencairanClient from './PencairanClient'

export default async function PencairanPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'bendahara') redirect('/dashboard')

  return <PencairanClient session={session} />
}
