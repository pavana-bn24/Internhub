import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getUnreadCount, globalSearch } from '../../services'
import {
  HomeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  BellIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { Toaster } from 'react-hot-toast'

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/student/profile', label: 'Profile', icon: UserCircleIcon },
  { to: '/student/enrollments/browse', label: 'Browse Internships', icon: BookOpenIcon },
  { to: '/student/enrollments', label: 'My Enrollments', icon: ClipboardDocumentListIcon },
  { to: '/student/materials', label: 'Materials', icon: AcademicCapIcon },
  { to: '/student/attendance', label: 'Attendance', icon: CalendarDaysIcon },
  { to: '/student/offer-letter', label: 'Offer Letters', icon: DocumentTextIcon },
  { to: '/student/certificate', label: 'Certificates', icon: CheckBadgeIcon },
  { to: '/student/projects', label: 'Projects', icon: ClipboardDocumentCheckIcon },
  { to: '/student/notifications', label: 'Notifications', icon: BellIcon },
]

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/admin/enrollments', label: 'Enrollments', icon: ClipboardDocumentListIcon },
  { to: '/admin/payments', label: 'Payments', icon: ClipboardDocumentCheckIcon },
  { to: '/admin/materials', label: 'Materials', icon: AcademicCapIcon },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarDaysIcon },
  { to: '/admin/offer-letters', label: 'Offer Letters', icon: DocumentTextIcon },
  { to: '/admin/certificates', label: 'Certificates', icon: CheckBadgeIcon },
  { to: '/admin/project-reviews', label: 'Projects', icon: ClipboardDocumentCheckIcon },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [unread, setUnread] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  useEffect(() => {
    if (!isAdmin) {
      const interval = setInterval(() => {
        getUnreadCount().then((r) => setUnread(r.count)).catch(() => {})
      }, 30000)
      getUnreadCount().then((r) => setUnread(r.count)).catch(() => {})
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  const links = isAdmin ? adminLinks : studentLinks

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      globalSearch(searchQuery).then(setSearchResults).catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[270px] bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-surface-200 dark:border-surface-800">
          <Link to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-white font-bold text-base">IH</span>
            </div>
            <div>
              <span className="font-bold text-base text-surface-900 dark:text-white">InternHub</span>
              <span className="block text-[10px] font-medium text-primary-500 dark:text-primary-400 uppercase tracking-wider">Enterprise</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-0.5 overflow-y-auto scrollbar-thin" style={{ height: 'calc(100% - 140px)' }}>
          <p className="px-4 py-2 text-[11px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest">
            {isAdmin ? 'Administration' : 'Student Portal'}
          </p>
          {links.map((link) => {
            const Icon = link.icon
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${
                  isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
                {link.label === 'Notifications' && unread > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm shadow-red-500/20">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/95">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-surface-900 dark:text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main area */}
      <div className="lg:pl-[270px]">
        {/* Header */}
        <header className="sticky top-0 z-30 glass-effect">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="hidden sm:block flex-1 max-w-md" ref={searchRef}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  className="input-field pl-10 py-2 text-sm bg-surface-100/50 dark:bg-surface-800/50 border-surface-200 dark:border-surface-700 focus:bg-white dark:focus:bg-surface-800"
                  placeholder="Search courses, materials..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true) }}
                  onFocus={() => setShowSearch(true)}
                />
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 left-0 right-0 glass-card rounded-xl shadow-premium-lg max-h-80 overflow-y-auto z-50 animate-slide-down">
                    {searchResults.map((r, i) => (
                      <Link
                        key={`${r.type}-${r.id}-${i}`}
                        to={r.link}
                        onClick={() => { setShowSearch(false); setSearchQuery('') }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <span className="text-[10px] font-semibold uppercase text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-md w-16 text-center">{r.type}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{r.title}</p>
                          {r.subtitle && <p className="text-xs text-surface-500 truncate">{r.subtitle}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2">
              {/* Mobile search */}
              <div className="sm:hidden relative" ref={searchRef}>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
                {showSearch && (
                  <div className="absolute top-full right-0 mt-2 w-72">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
                title="Toggle theme"
              >
                {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>

              {/* Notifications */}
              <Link
                to={isAdmin ? '/admin/notifications' : '/student/notifications'}
                className="relative p-2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                {unread > 0 && (
                  <span className="notification-dot">
                    <span className="notification-dot-inner" />
                  </span>
                )}
              </Link>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-xs shadow-md">
                    {user?.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-xl shadow-premium-lg animate-slide-down overflow-hidden">
                    <div className="p-4 border-b border-surface-200 dark:border-surface-700/50">
                      <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{user?.full_name}</p>
                      <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                      <p className="text-[10px] text-surface-400 dark:text-surface-500 capitalize mt-0.5">{user?.role}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => { setProfileOpen(false); handleLogout() }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 xl:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
