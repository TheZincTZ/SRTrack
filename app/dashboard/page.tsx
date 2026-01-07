import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardContent from '@/components/DashboardContent'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get commander info
  const { data: commander, error: commanderError } = await supabase
    .from('commanders')
    .select('*')
    .eq('id', user.id)
    .single()

  if (commanderError || !commander) {
    // Commander not found, redirect to login
    redirect('/login')
  }

  return <DashboardContent commander={commander} />
}

