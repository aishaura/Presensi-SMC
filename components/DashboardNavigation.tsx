'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardNavigationProps {
  userName: string
  isAdmin: boolean
}

export default function DashboardNavigation({ userName, isAdmin }: DashboardNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Header */}
      <header className="relative md:hidden bg-slate-900 text-white flex flex-col shrink-0 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-base font-bold tracking-tight">Presensi SMC</h1>
            <p className="text-[10px] text-slate-400">Saung Mirza Community</p>
          </div>
          <button
            onClick={toggleMenu}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Toggle menu"
          >
            {/* Hamburger Icon (☰) */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Backdrop for click-away */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-transparent z-40"
            onClick={closeMenu}
          />
        )}

        {/* Floating Mobile Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-4 top-[85%] w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 space-y-1">
            <div className="px-2.5 py-2 border-b border-slate-800 mb-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pengguna</p>
              <p className="font-semibold text-white truncate text-xs mt-0.5">{userName}</p>
              <p className="text-[9px] text-slate-400 mt-0.5 capitalize bg-slate-800/80 inline-block px-1 py-0.2 rounded">
                {isAdmin ? 'Admin / HR' : 'Magang / Karyawan'}
              </p>
            </div>
            
            <nav className="space-y-1">
              {!isAdmin ? (
                <>
                  <Link
                    href="/"
                    onClick={closeMenu}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      pathname === '/' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span>Presensi Hari Ini</span>
                  </Link>
                  <Link
                    href="/riwayat"
                    onClick={closeMenu}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      pathname === '/riwayat' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Riwayat Presensi</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      pathname === '/admin' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                    </svg>
                    <span>Rekap Presensi</span>
                  </Link>
                  <Link
                    href="/admin/users"
                    onClick={closeMenu}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      pathname === '/admin/users' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Kelola Karyawan</span>
                  </Link>
                </>
              )}
            </nav>

            <div className="pt-1.5 border-t border-slate-800">
              <form action="/logout" method="POST">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-950/40 text-red-400 hover:text-red-300 transition text-left"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Keluar Akun</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col justify-between shrink-0">
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
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    pathname === '/' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Presensi Hari Ini</span>
                </Link>
                <Link
                  href="/riwayat"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    pathname === '/riwayat' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
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
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    pathname === '/admin' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                  <span>Rekap Presensi</span>
                </Link>
                <Link
                  href="/admin/users"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    pathname === '/admin/users' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
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
    </>
  )
}
