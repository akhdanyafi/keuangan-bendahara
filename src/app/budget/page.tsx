import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import BudgetClient from './BudgetClient'

export default async function BudgetPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'bendahara') redirect('/dashboard')

  return <BudgetClient session={session} />
}
