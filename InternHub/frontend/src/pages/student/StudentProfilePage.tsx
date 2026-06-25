import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { updateMyProfile, changePassword, uploadProfilePhoto, getDownloadUrl, getMe } from '../../services'
import { LoadingSpinner } from '../../components/ui/Common'
import { UserCircleIcon, CameraIcon, CheckCircleIcon, XCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function StudentProfilePage() {
  const { user, setUser } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    college: '',
    department: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        college: user.college || '',
        department: user.department || '',
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updated = await updateMyProfile(user.id, form)
      setUser(updated)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5MB')
      return
    }
    setUploading(true)
    try {
      const updated = await uploadProfilePhoto(user.id, file)
      setUser(updated)
      toast.success('Profile photo updated!')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setChangingPassword(true)
    try {
      await changePassword(user.id, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })
      toast.success('Password changed!')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch {
      toast.error('Failed to change password. Check your current password.')
    } finally {
      setChangingPassword(false)
    }
  }

  const profileFields = [
    { key: 'Profile Photo', filled: !!user?.profile_pic },
    { key: 'Full Name', filled: !!user?.full_name },
    { key: 'Email', filled: !!user?.email },
    { key: 'Phone Number', filled: !!user?.phone },
    { key: 'College', filled: !!user?.college },
    { key: 'Department', filled: !!user?.department },
  ]
  const filledCount = profileFields.filter(f => f.filled).length
  const completionPct = Math.round((filledCount / profileFields.length) * 100)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">My Profile</h1>
          <p className="section-subtitle">Manage your personal information</p>
        </div>
      </div>

      {/* Profile Completion */}
      <div className="premium-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <UserCircleIcon className="w-5 h-5 text-primary-500" />
            <h2 className="section-title">Profile Completion</h2>
          </div>
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{completionPct}%</span>
        </div>
        <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2.5 mb-3">
          <div className="h-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all" style={{ width: `${completionPct}%` }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {profileFields.map((f) => (
            <div key={f.key} className="flex items-center gap-2 text-sm">
              {f.filled ? (
                <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span className={f.filled ? 'text-surface-700 dark:text-surface-300' : 'text-surface-400'}>{f.key}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo */}
        <div className="premium-card p-6 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden shadow-lg">
              {user?.profile_pic ? (
                <img src={getDownloadUrl(user.profile_pic)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircleIcon className="w-16 h-16 text-white/80" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-lg hover:bg-primary-600 transition-all disabled:opacity-50 border-4 border-white dark:border-surface-900"
            >
              <CameraIcon className="w-5 h-5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <h3 className="font-semibold text-surface-900 dark:text-white text-lg">{user?.full_name}</h3>
          <p className="text-sm text-surface-500">{user?.email}</p>
          {uploading && <p className="text-xs text-primary-500 mt-2">Uploading...</p>}
        </div>

        {/* Edit Profile */}
        <div className="lg:col-span-2 premium-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <PencilSquareIcon className="w-5 h-5 text-primary-500" />
            <h2 className="section-title">Edit Profile</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Full Name</label>
              <input type="text" className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input type="email" className="input-field bg-surface-50 dark:bg-surface-800 cursor-not-allowed" value={user?.email || ''} disabled />
            </div>
            <div>
              <label className="input-label">Phone Number</label>
              <input type="text" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="input-label">College</label>
              <input type="text" className="input-field" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Department</label>
              <input type="text" className="input-field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="premium-card p-6">
        <h2 className="section-title mb-4">Change Password</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="input-label">Current Password</label>
            <input type="password" className="input-field" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
          </div>
          <div>
            <label className="input-label">New Password</label>
            <input type="password" className="input-field" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Confirm New Password</label>
            <input type="password" className="input-field" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleChangePassword} disabled={changingPassword} className="btn-primary">
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
