import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNavigation from '@/components/DashboardNavigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profil lengkap sekaligus (role & nama)
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'inactive') {
    await supabase.auth.signOut()
    redirect('/login?error=Akun%20Anda%20telah%20dinonaktifkan')
  }

  // Definisikan variabel pendukung
  const userName = profile?.name || user.email?.split('@')[0] || 'Pengguna'
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <DashboardNavigation userName={userName} isAdmin={isAdmin} />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  )
}