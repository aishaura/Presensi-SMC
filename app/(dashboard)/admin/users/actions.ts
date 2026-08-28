'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createEmployee(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string // 'employee' atau 'admin'

  if (!name || !email || !password || !role) {
    return { error: 'Nama, Email, Password, dan Role wajib diisi' }
  }

  const supabaseAdmin = createAdminClient()

  try {
    // 1. Buat user di Supabase Auth (email_confirm true agar bisa langsung login)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
    })

    if (authError) {
      throw authError
    }

    if (!authUser.user) {
      throw new Error('Gagal membuat user auth')
    }

    // 2. Buat data profil di tabel profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        name,
        phone: phone || null,
        role: role,
      })

    if (profileError) {
      // Rollback auth jika profil gagal dibuat
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw profileError
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error creating employee:', error)
    return { error: error.message || 'Gagal menambahkan karyawan' }
  }
}

export async function toggleUserStatus(userId: string, currentRole: string) {
  const supabaseAdmin = createAdminClient()
  const isDeactivating = currentRole !== 'inactive'

  try {
    // Update di Supabase Auth (Ban user jika dinonaktifkan)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        ban_duration: isDeactivating ? '876600h' : 'none', // Ban 100 tahun atau lepas ban
      }
    )

    if (authError) {
      throw authError
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    console.error('Error toggling user status:', error)
    return { error: error.message || 'Gagal mengubah status akun' }
  }
}

export async function updateEmployee(formData: FormData) {
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
    // Proteksi: Main admin (admin@saungmirza.com) tidak boleh diubah
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (targetUser?.user?.email === 'admin@saungmirza.com') {
      return { error: 'Akun Sistem Utama (admin@saungmirza.com) tidak dapat diubah' }
    }

    // 1. Update di Supabase Auth (email)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email,
        user_metadata: { name, phone },
      }
    )

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

