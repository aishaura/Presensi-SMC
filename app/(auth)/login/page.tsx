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

    redirect(profile?.role === 'admin' ? '/admin' : '/user')
  }

  const { error } = await searchParams

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/80 px-4 py-12 sm:px-6 lg:px-8">
      {/* Container Utama */}
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-2">
            <img
              src="/logo.svg"
              alt="Logo Presensi SMC"
              className="w-16 h-16 rounded-full object-contain shadow-md bg-white p-0.5"
            />
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