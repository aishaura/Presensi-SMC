import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized / Belum Login' }, { status: 401 })
    }

    // Ambil tanggal local hari ini (YYYY-MM-DD)
    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - offset * 60 * 1000)
    const todayStr = localDate.toISOString().split('T')[0]

    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('id, keterangan, check_in_time, check_out_time')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({ attendance })
  } catch (error: any) {
    console.error('Error fetching today attendance:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
