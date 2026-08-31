'use client'

import { useState } from 'react'
import {
  createEmployee,
  toggleUserStatus,
  updateEmployee,
  deleteEmployee,
  resetUserPassword,
} from './actions'

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
  const [loading, setLoading] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Add Form State
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

  // Reset Password State
  const [newPassword, setNewPassword] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Custom Alert / Modal State
  const [alert, setAlert] = useState<{
    open: boolean
    type: 'success' | 'error' | 'confirm'
    title: string
    message: string
    onConfirm?: () => void
  }>({ open: false, type: 'success', title: '', message: '' })

  const closeAlert = () => setAlert((prev) => ({ ...prev, open: false }))
  const showSuccess = (title: string, message: string) =>
    setAlert({ open: true, type: 'success', title, message })
  const showError = (message: string) =>
    setAlert({ open: true, type: 'error', title: 'Terjadi Kesalahan', message })
  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setAlert({ open: true, type: 'confirm', title, message, onConfirm })

  // Filtered Users
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resetAddForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setRole('employee')
    setFormError(null)
  }

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditPhone(user.phone || '')
    setEditRole(user.role === 'admin' ? 'admin' : 'employee')
    setEditFormError(null)
    setNewPassword('')
    setShowPasswordField(false)
    setShowEditModal(true)
  }

  const handleToggleStatus = (userId: string, currentRole: string) => {
    showConfirm(
      'Ubah Status Akun',
      'Apakah Anda yakin ingin mengubah status aktif akun ini?',
      async () => {
        setLoading(userId)
        const res = await toggleUserStatus(userId, currentRole)
        setLoading(null)

        if (res.error) {
          showError(res.error)
        } else {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId
                ? { ...u, role: currentRole === 'inactive' ? 'employee' : 'inactive' }
                : u
            )
          )
          showSuccess('Berhasil', 'Status akun berhasil diperbarui!')
        }
      }
    )
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
      setShowAddModal(false)
      resetAddForm()

      if (res.data) {
        const newUser: UserItem = {
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
          phone: phone || null,
          role: role,
          created_at: new Date().toISOString(),
        }
        setUsers((prev) => [newUser, ...prev])
      }
      showSuccess('Berhasil', 'Akun karyawan/magang berhasil dibuat!')
    }
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
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: editName, email: editEmail, phone: editPhone || null, role: editRole }
            : u
        )
      )
      setShowEditModal(false)
      showSuccess('Berhasil', 'Data karyawan/admin berhasil diperbarui!')
    }
  }

  const handleResetPassword = async () => {
    if (!editingUser) return
    if (newPassword.length < 6) {
      setEditFormError('Password baru minimal 6 karakter')
      return
    }

    setPasswordLoading(true)
    const res = await resetUserPassword(editingUser.id, newPassword)
    setPasswordLoading(false)

    if (res.error) {
      setEditFormError(res.error)
    } else {
      setNewPassword('')
      setShowPasswordField(false)
      showSuccess('Berhasil', 'Password berhasil diperbarui.')
    }
  }

  const handleDeleteUser = (userId: string, userName: string) => {
    showConfirm(
      'Hapus Akun',
      `Apakah Anda yakin ingin menghapus akun "${userName}" secara permanen? Seluruh riwayat presensi terkait juga akan dihapus.`,
      async () => {
        setLoading(userId)
        const res = await deleteEmployee(userId)
        setLoading(null)

        if (res.error) {
          showError(res.error)
        } else {
          setUsers((prev) => prev.filter((u) => u.id !== userId))
          showSuccess('Berhasil', `Akun "${userName}" berhasil dihapus secara permanen.`)
        }
      }
    )
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
          onClick={() => {
            resetAddForm()
            setShowAddModal(true)
          }}
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
                    <td className="px-6 py-4 text-right">
                      {u.email === 'admin@saungmirza.com' ? (
                        <span className="text-xs text-gray-400 italic">Sistem Utama</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Toggle Status */}
                          {u.role !== 'admin' && (
                            <button
                              disabled={loading === u.id}
                              onClick={() => handleToggleStatus(u.id, u.role)}
                              title={u.role === 'inactive' ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
                              className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
                                u.role === 'inactive'
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-amber-600 hover:bg-amber-50'
                              }`}
                            >
                              {loading === u.id ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : u.role === 'inactive' ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Hapus */}
                          <button
                            disabled={loading === u.id}
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            title="Hapus"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                          >
                            {loading === u.id ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
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
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Daftarkan Akun Karyawan / Magang</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

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

              <div className="pt-4 flex items-center gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:text-slate-900 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
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
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Edit Akun Karyawan / Admin</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

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

              {/* Reset Password Section */}
              <div className="pt-4 border-t space-y-3">
                {!showPasswordField ? (
                  <button
                    type="button"
                    onClick={() => setShowPasswordField(true)}
                    className="text-sm text-blue-600 hover:underline font-semibold"
                  >
                    Ganti Password Akun
                  </button>
                ) : (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordField(false)
                          setNewPassword('')
                        }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={passwordLoading}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                      >
                        {passwordLoading ? 'Menyimpan...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:text-slate-900 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editFormLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
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

      {/* Global Alert & Confirmation Modal */}
      {alert.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{alert.title}</h3>
            <p className="text-sm text-gray-600 font-medium">{alert.message}</p>
            <div className="flex gap-3 pt-2">
              {alert.type === 'confirm' ? (
                <>
                  <button
                    type="button"
                    onClick={closeAlert}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 transition active:scale-[0.98]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert.onConfirm?.()
                      closeAlert()
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-[0.98]"
                  >
                    Ya, Lanjutkan
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={closeAlert}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-[0.98]"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}