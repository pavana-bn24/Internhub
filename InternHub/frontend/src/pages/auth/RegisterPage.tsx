import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../services'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    department: '',
    college: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created successfully')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-50 dark:from-surface-950 dark:via-primary-950/20 dark:to-surface-950 p-4 py-8">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-xl shadow-primary-500/20 mb-4">
            <span className="text-white font-bold text-2xl">IH</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Create account</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Join InternHub Enterprise as a student</p>
        </div>

        <form onSubmit={handleSubmit} className="premium-card p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Full Name</label>
              <input type="text" name="full_name" className="input-field" placeholder="John Doe" value={form.full_name} onChange={handleChange} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
              <input type="email" name="email" className="input-field" placeholder="john@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Username</label>
              <input type="text" name="username" className="input-field" placeholder="john" value={form.username} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
              <input type="password" name="password" className="input-field" placeholder="Min 8 characters" value={form.password} onChange={handleChange} required minLength={8} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Phone</label>
              <input type="tel" name="phone" className="input-field" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Department</label>
              <input type="text" name="department" className="input-field" placeholder="Computer Science" value={form.department} onChange={handleChange} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">College</label>
              <input type="text" name="college" className="input-field" placeholder="Your college name" value={form.college} onChange={handleChange} />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>
          <p className="text-center text-sm text-surface-500 dark:text-surface-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
