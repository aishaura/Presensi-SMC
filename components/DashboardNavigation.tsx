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

  const navItems = !isAdmin
    ? [
        {
          name: 'Presensi Hari Ini',
          href: '/',
          icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
        },
        {
          name: 'Riwayat Presensi',
          href: '/riwayat',
          icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ]
    : [
        {
          name: 'Rekap Presensi',
          href: '/admin',
          icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          ),
        },
        {
          name: 'Kelola Karyawan',
          href: '/admin/users',
          icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ]

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 relative">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.svg"
              alt="Logo Presensi SMC"
              className="w-8 h-8 rounded-full object-contain bg-white shrink-0 shadow-sm"
            />
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">Presensi SMC</h1>
              <p className="text-[10px] text-slate-400">Saung Mirza Community</p>
            </div>
          </div>
          <button
            onClick={toggleMenu}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Backdrop Transparan untuk Klik di Luar Menu Mobile */}
          {isOpen && (
            <div className="fixed inset-0 z-40 bg-black/20" onClick={closeMenu} />
          )}

          {/* Compact Dropdown Menu Mobile (Bukan Full Width) */}
          {isOpen && (
            <div className="absolute right-4 top-14 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pengguna</p>
                <p className="font-semibold text-white truncate text-xs mt-0.5">{userName}</p>
                <p className="text-[10px] text-blue-400 font-medium mt-0.5">
                  {isAdmin ? 'Admin / HR' : 'Magang / Karyawan'}
                </p>
              </div>

              <nav className="space-y-0.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="pt-1.5 border-t border-slate-800">
                <form action="/logout" method="POST">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-slate-800 transition"
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
        </div>
      </header>

      {/* Desktop Sidebar (Clean, Solid, Professional) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Logo / Branding */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Logo Presensi SMC"
              className="w-10 h-10 rounded-full object-contain bg-white shrink-0 shadow-sm"
            />
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">Presensi SMC</h1>
              <p className="text-[11px] text-slate-400">Saung Mirza Community</p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="p-4 border-b border-slate-800 bg-slate-800/40">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pengguna</p>
            <p className="font-semibold text-white truncate text-sm mt-0.5">{userName}</p>
            <span className="inline-block text-[10px] text-blue-400 font-medium bg-blue-950/60 border border-blue-800/50 px-2 py-0.5 rounded mt-1">
              {isAdmin ? 'Admin / HR' : 'Magang / Karyawan'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Menu Utama
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-800">
          <form action="/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition"
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