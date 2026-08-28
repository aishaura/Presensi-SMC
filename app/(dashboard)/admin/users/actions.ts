'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function ensureCallerIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Unauthorized' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return { ok: false, error: 'Hanya admin yang bisa melakukan aksi ini' }
  }

  return { ok: true }
}

export async function createEmployee(formData: FormData) {
  const check = await ensureCallerIsAdmin()
  if (!check.ok) return { error: check.error }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string
  const role = (formData.get('role') as string) || 'employee'

  if (!name || !email || !password) {
    return { error: 'Nama, email, dan password wajib diisi' }
  }
  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  const adminClient = createAdminClient()

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !newUser.user) {
    return { error: createError?.message ?? 'Gagal membuat akun' }
  }

  const { error: profileError } = await adminClient.from('profiles').insert({
    id: newUser.user.id,
    name,
    phone: phone || null,
    role,
  })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return { error: 'Gagal menyimpan profil: ' + profileError.message }
  }

  revalidatePath('/admin/users')
  return { data: { id: newUser.user.id, name, email } }
}

export async function toggleUserStatus(userId: string, currentRole: string) {
  const check = await ensureCallerIsAdmin()
  if (!check.ok) return { error: check.error }

  const adminClient = createAdminClient()
  const isCurrentlyInactive = currentRole === 'inactive'
  const newRole = isCurrentlyInactive ? 'employee' : 'inactive'

  // 1. Update kolom role (buat tampilan admin)
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (profileError) {
    return { error: 'Gagal mengubah status: ' + profileError.message }
  }

  // 2. Ban/unban akun Auth-nya (biar beneran gak bisa login kalau nonaktif)
  const { error: banError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: isCurrentlyInactive ? 'none' : '876000h', // 'none' = unban, ~100 tahun = permanent ban
  })

  if (banError) {
    // rollback role kalau ban gagal, biar data konsisten
    await adminClient.from('profiles').update({ role: currentRole }).eq('id', userId)
    return { error: 'Gagal mengubah status login: ' + banError.message }
  }

  revalidatePath('/admin/users')
  return { data: { newRole } }
}