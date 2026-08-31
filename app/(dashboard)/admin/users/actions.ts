'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function ensureCallerIsAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const supabaseAdmin = createAdminClient()

  try {
    // Proteksi: Main admin tidak boleh dinonaktifkan
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (targetUser?.user?.email === 'admin@saungmirza.com') {
      return { error: 'Akun Sistem Utama (admin@saungmirza.com) tidak dapat dinonaktifkan' }
    }

    const isDeactivating = currentRole !== 'inactive'
    const newRole = isDeactivating ? 'inactive' : 'employee'

    // 1. Update di Supabase Auth (Ban / Unban)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: isDeactivating ? '876600h' : 'none', // Ban 100 tahun atau lepas ban
    })

    if (authError) {
      throw authError
    }

    // 2. Update role di tabel profiles agar sinkron di Database & UI
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (profileError) {
      throw profileError
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error toggling user status:', error)
    return { error: error.message || 'Gagal mengubah status akun' }
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const check = await ensureCallerIsAdmin()
  if (!check.ok) return { error: check.error }

  if (newPassword.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) {
    return { error: 'Gagal mengubah password: ' + error.message }
  }

  return { data: { success: true } }
}

export async function updateEmployee(formData: FormData) {
  const check = await ensureCallerIsAdmin()
  if (!check.ok) return { error: check.error }

  const userId = formData.get('userId') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const role = formData.get('role') as string // 'employee' atau 'admin'

  if (!userId || !name || !email || !role) {
    return { error: 'ID User, Nama, Email, dan Role wajib diisi' }
  }

  const supabaseAdmin = createAdminClient()

  try {
    // Proteksi: Main admin tidak boleh diubah
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (targetUser?.user?.email === 'admin@saungmirza.com') {
      return { error: 'Akun Sistem Utama (admin@saungmirza.com) tidak dapat diubah' }
    }

    // 1. Update di Supabase Auth (email & metadata)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email,
      user_metadata: { name, phone },
    })

    if (authError) {
      throw authError
    }

    // 2. Update di tabel profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        name,
        phone: phone || null,
        role: role,
      })
      .eq('id', userId)

    if (profileError) {
      throw profileError
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating employee:', error)
    return { error: error.message || 'Gagal memperbarui data karyawan' }
  }
}

export async function deleteEmployee(userId: string) {
  const check = await ensureCallerIsAdmin()
  if (!check.ok) return { error: check.error }

  if (!userId) {
    return { error: 'ID User wajib diisi' }
  }

  const supabaseAdmin = createAdminClient()

  try {
    // Proteksi: Main admin tidak boleh dihapus
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (targetUser?.user?.email === 'admin@saungmirza.com') {
      return { error: 'Akun Sistem Utama (admin@saungmirza.com) tidak dapat dihapus' }
    }

    // 1. Hapus riwayat presensi dari tabel attendance
    const { error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('user_id', userId)

    if (attendanceError) {
      throw attendanceError
    }

    // 2. Hapus profil dari tabel profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      throw profileError
    }

    // 3. Hapus user dari Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      throw authError
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting employee:', error)
    return { error: error.message || 'Gagal menghapus akun karyawan' }
  }
}