import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date')       
  const startDate = searchParams.get('start') 
  const endDate = searchParams.get('end')
  const name = searchParams.get('name')       

  let query = supabase
    .from('attendance')
    .select(`
      id, user_id, date, keterangan,
      check_in_time, check_in_address, check_in_image_url,
      check_out_time, check_out_address, check_out_image_url,
      profile:profiles(name, phone)
    `)
    .order('date', { ascending: false })

  if (date) {
    query = query.eq('date', date)
  }
  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }
  if (name) {
    // filter by nama di tabel relasi, butuh cara sedikit beda di Supabase
    query = query.ilike('profile.name', `%${name}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, data })
}