import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../../context/authStore'
import { authApi } from '../../services/api'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  Code2,
  FileCheck,
  TestTube2,
  FileText,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Shield
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/requirements', label: 'Requirements', icon: FileCheck },
  { path: '/code-analysis', label: 'Code Analysis', icon: Code2 },
  { path: '/test-generation', label: 'Test Generation', icon: TestTube2 },
  // { path: '/documents', label: 'Documents', icon: FileText },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout API errors
    }
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-secondary-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } lg:relative`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary-400" />
              <span className="font-bold text-lg">SQA System</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-secondary-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-secondary-300 hover:bg-secondary-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-secondary-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-secondary-800">
              AI-Powered Quality Assurance
            </h1>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
              <span className="text-sm font-medium text-secondary-700">
                {user?.full_name || user?.email || 'User'}
              </span>
              <ChevronDown size={16} className="text-secondary-400" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-20">
                  <div className="px-4 py-2 border-b border-secondary-100">
                    <p className="text-sm font-medium text-secondary-900">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-secondary-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
