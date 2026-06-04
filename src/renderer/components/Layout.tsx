import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/pos', label: 'POS Terminal', icon: '🛒' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/sales', label: 'Sales', icon: '💰' },
  { to: '/expenses', label: 'Expenses', icon: '📉' },
  { to: '/employees', label: 'Employees', icon: '👤' },
  { to: '/ai', label: 'AI Assistant', icon: '🤖' },
  { to: '/settings', label: 'Settings', icon: '⚙️' }
]

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-surface-800 text-surface-100 flex flex-col shrink-0">
        <div className="p-6 border-b border-surface-700">
          <h1 className="text-xl font-bold tracking-tight">Business OS</h1>
          <p className="text-sm text-surface-400 mt-1">Management System</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-surface-300 hover:bg-surface-700 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-surface-700 text-xs text-surface-500">
          v1.0.0 &middot; Offline
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-surface-50 dark:bg-surface-900">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
