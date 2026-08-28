import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { login } from './action'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect jika sudah login
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    redirect(profile?.role === 'admin' ? '/admin' : '/dashboard')
  }

  const { error } = await searchParams

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/80 px-4 py-12 sm:px-6 lg:px-8">
      {/* Container Utama */}
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457-.39-2.823-1.07-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Presensi Digital
          </h1>
          <p className="text-sm text-slate-500">
            Masuk ke akun kamu untuk melakukan presensi
          </p>
        </div>

        {/* Alert Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50/80 border border-red-200/60 rounded-xl animate-shake">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form Login */}
        <form action={login} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                placeholder="nama@perusahaan.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-blue-500/20"
          >
            Masuk Ke Akun
          </button>
        </form>

        {/* Footer Info */}
        <div className="pt-2 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Presensi App. All rights reserved.
        </div>
      </div>
    </div>
  )
}