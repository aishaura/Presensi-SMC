import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ManageUsersClient from './ManageUsersClient'

export const revalidate = 0 // Disable cache agar daftar user selalu terbaru

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // 1. Cek User saat ini
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Cek Role Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const supabaseAdmin = createAdminClient()

  // 3. Ambil data dari profiles
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('Error loading profiles:', profilesError)
  }

  // 4. Ambil data user dari auth menggunakan Admin Client
  let authUsersMap: Record<string, { email: string; isBanned: boolean }> = {}
  try {
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) throw authError

    authUsers.forEach((u) => {
      if (u.email) {
        const isBanned = !!u.banned_until && new Date(u.banned_until) > new Date()
        authUsersMap[u.id] = { email: u.email, isBanned }
      }
    })
  } catch (err) {
    console.error('Gagal mengambil data auth users dari admin API:', err)
  }

  // 5. Gabungkan data profile dan email auth
  const mappedUsers = (profiles || []).map((p) => {
    const authData = authUsersMap[p.id] || { email: p.email || '-', isBanned: false }
    return {
      id: p.id,
      name: p.name,
      phone: p.phone,
      role: authData.isBanned ? 'inactive' : p.role,
      email: authData.email,
      created_at: p.created_at || '',
    }
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Kelola Akun Magang / Karyawan</h2>
        <p className="text-sm text-gray-500 font-medium">
          Daftarkan akun anak magang baru, ubah status keaktifan, atau kelola peranan di Saung Mirza Community.
        </p>
      </div>

      <ManageUsersClient initialUsers={mappedUsers} />
    </div>
  )
}
