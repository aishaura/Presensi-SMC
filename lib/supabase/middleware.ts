import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Wajib dipanggil biar session ke-refresh
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteksi route: kalau belum login dan bukan di /login, redirect ke /login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Proteksi akun nonaktif: jika user terdeteksi nonaktif, hapus session dan redirect ke login
  if (user && !request.nextUrl.pathname.startsWith('/login')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'inactive') {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'Akun Anda dinonaktifkan oleh Admin')
      const redirectResponse = NextResponse.redirect(url)
      // Bersihkan cookie session Supabase
      request.cookies.getAll().forEach((c) => {
        if (c.name.startsWith('sb-')) {
          redirectResponse.cookies.delete(c.name)
        }
      })
      return redirectResponse
    }
  }

  return supabaseResponse
}