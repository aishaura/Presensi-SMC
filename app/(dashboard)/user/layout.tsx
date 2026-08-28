import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'inactive') {
    await supabase.auth.signOut()
    redirect('/login?error=Akun%20Anda%20telah%20dinonaktifkan')
  }

  // Definisikan variabel pendukung
  const userName = profile?.full_name || user.email?.split('@')[0] || 'Pengguna'
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Branding */}
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-lg font-bold tracking-tight">Presensi SMC</h1>
            <p className="text-xs text-slate-400 mt-0.5">Saung Mirza Community</p>
          </div>

          {/* User Profile Summary */}
          <div className="p-6 bg-slate-800/50 border-b border-slate-800">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pengguna</p>
            <p className="font-semibold text-white truncate text-sm mt-1">{userName}</p>
            <p className="text-xs text-slate-400 mt-0.5 capitalize bg-slate-700/50 inline-block px-1.5 py-0.5 rounded">
              {isAdmin ? 'Admin / HR' : 'Magang / Karyawan'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {!isAdmin ? (
              <>
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition text-slate-300 hover:text-white"
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Presensi Hari Ini</span>
                </Link>
                <Link
                  href="/riwayat"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition text-slate-300 hover:text-white"
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Riwayat Presensi</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition text-slate-300 hover:text-white"
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                  <span>Rekap Presensi</span>
                </Link>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition text-slate-300 hover:text-white"
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Kelola Karyawan</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-800">
          <form action="/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-950/40 text-red-400 hover:text-red-300 transition"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Keluar Akun</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  )
}