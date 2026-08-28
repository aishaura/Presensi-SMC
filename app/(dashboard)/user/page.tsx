import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CheckInOutClient from './CheckInOutClient'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role === 'inactive') redirect('/login?error=...')

  const today = new Date()
  const offset = today.getTimezoneOffset()
  const localDate = new Date(today.getTime() - offset * 60 * 1000)
  const todayStr = localDate.toISOString().split('T')[0]

  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', todayStr)
    .maybeSingle()

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Halo, {profile?.name} 👋</h2>
        <p className="text-sm text-gray-500 font-medium">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <CheckInOutClient initialAttendance={todayAttendance} />
    </div>
  )
}