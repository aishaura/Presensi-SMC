'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Ambil autentikasi dari Supabase
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  })

  // 2. Jika gagal login, kembalikan ke /login dengan pesan error
  if (error || !data.user) {
    redirect('/login?error=' + encodeURIComponent('Email atau password salah'))
  }

  // 3. Ambil data role pengguna dari tabel profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  // 4. Pengalihan route berdasarkan role pengguna
  // Jika admin -> /admin, Jika user biasa -> /user (sesuai folder app/(dashboard)/user)
  if (profile?.role === 'admin') {
    redirect('/admin')
  } else {
    redirect('/user')
  }
}