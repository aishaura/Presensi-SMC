'use client'

import { useState } from 'react'
import { createEmployee, toggleUserStatus, updateEmployee, deleteEmployee } from './actions'

interface UserItem {
  id: string
  name: string
  phone: string | null
  role: string
  email: string
  created_at: string
}

interface ManageUsersClientProps {
  initialUsers: UserItem[]
}

export default function ManageUsersClient({ initialUsers }: ManageUsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState<string | null>(null) // id user yang sedang diproses statusnya
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('employee')

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState('employee')
  const [editFormLoading, setEditFormLoading] = useState(false)
  const [editFormError, setEditFormError] = useState<string | null>(null)


  // Filtered Users
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleStatus = async (userId: string, currentRole: string) => {
    if (!confirm('Apakah Anda yakin ingin mengubah status aktif akun ini?')) return

    setLoading(userId)
    const res = await toggleUserStatus(userId, currentRole)
    setLoading(null)

    if (res.error) {
      alert(res.error)
    } else {
      // Update state lokal
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            return {
              ...u,
              role: currentRole === 'inactive' ? 'employee' : 'inactive',
            }
          }
          return u
        })
      )
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('email', email)
    formData.append('phone', phone)
    formData.append('password', password)
    formData.append('role', role)

    const res = await createEmployee(formData)
    setFormLoading(false)

    if (res.error) {
      setFormError(res.error)
    } else {
      alert('Akun magang/karyawan berhasil dibuat!')
      setShowAddModal(false)
      // Reset Form
      setName('')
      setEmail('')
      setPhone('')
      setPassword('')
      setRole('employee')
      // Refresh page to load fresh mapped list
      window.location.reload()
    }
  }

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditPhone(user.phone || '')
    setEditRole(user.role === 'inactive' ? 'employee' : user.role)
    setEditFormError(null)
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setEditFormLoading(true)
    setEditFormError(null)

    const formData = new FormData()
    formData.append('userId', editingUser.id)
    formData.append('name', editName)
    formData.append('email', editEmail)
    formData.append('phone', editPhone)
    formData.append('role', editRole)

    const res = await updateEmployee(formData)
    setEditFormLoading(false)

    if (res.error) {
      setEditFormError(res.error)
    } else {
      alert('Data karyawan/admin berhasil diperbarui!')
      setShowEditModal(false)
      window.location.reload()
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun "${userName}" secara permanen? Seluruh riwayat presensi terkait juga akan dihapus.`)) {
      return
    }

    setLoading(userId)
    const res = await deleteEmployee(userId)
    setLoading(null)

    if (res.error) {
      alert(res.error)
    } else {
      alert(`Akun "${userName}" berhasil dihapus secara permanen.`)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Cari nama atau email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-xs border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
        />

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Akun Baru
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-bold text-gray-800 uppercase tracking-wider">
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Kontak</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y text-gray-600">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-600 font-medium">
                    Tidak ada akun ditemukan
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-600 font-bold">{u.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{u.email}</div>
                      <div className="text-xs text-gray-700 font-bold">{u.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 capitalize">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          u.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {u.role === 'employee' ? 'Magang' : u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'inactive'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.role === 'inactive' ? 'bg-red-600' : 'bg-green-600'}`} />
                        {u.role === 'inactive' ? 'Ditangguhkan' : 'Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {u.email === 'admin@saungmirza.com' ? (
                        <span className="text-xs text-gray-400 italic">Sistem Utama</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-xs"
                          >
                            Edit
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              disabled={loading === u.id}
                              onClick={() => handleToggleStatus(u.id, u.role)}
                              className={`font-semibold hover:underline text-xs ${
                                u.role === 'inactive'
                                  ? 'text-green-600 hover:text-green-800'
                                  : 'text-red-600 hover:text-red-800'
                              } disabled:opacity-50`}
                            >
                              {loading === u.id
                                ? 'Memproses...'
                                : u.role === 'inactive'
                                ? 'Aktifkan Akun'
                                : 'Nonaktifkan Akun'}
                            </button>
                          )}
                          <button
                            disabled={loading === u.id}
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="font-semibold text-red-600 hover:text-red-800 hover:underline text-xs disabled:opacity-50"
                          >
                            {loading === u.id ? 'Memproses...' : 'Hapus'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Daftarkan Akun Karyawan / Magang</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap Anak Magang"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Nomor HP (WhatsApp)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                >
                  <option value="employee">Magang (Employee)</option>
                  <option value="admin">Admin / HR</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {formLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Buat Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Edit Akun Karyawan / Admin</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editFormError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {editFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Nomor HP (WhatsApp)
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                >
                  <option value="employee">Magang (Employee)</option>
                  <option value="admin">Admin / HR</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editFormLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {editFormLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
