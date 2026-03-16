import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  MegaphoneIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

const studentLinks = [
  { to: '/student', label: 'nav.dashboard', icon: HomeIcon, end: true },
  { to: '/student/file-complaint', label: 'nav.fileComplaint', icon: PlusCircleIcon },
  { to: '/student/complaints', label: 'nav.myComplaints', icon: ClipboardDocumentListIcon },
  { to: '/student/appeals', label: 'nav.appeals', icon: MegaphoneIcon },
]

const departmentLinks = [
  { to: '/department', label: 'nav.dashboard', icon: HomeIcon, end: true },
  { to: '/department/complaints', label: 'nav.complaints', icon: DocumentTextIcon },
]

const adminLinks = [
  { to: '/admin', label: 'nav.dashboard', icon: HomeIcon, end: true },
  { to: '/admin/analytics', label: 'nav.analytics', icon: ChartBarIcon },
  { to: '/admin/users', label: 'nav.users', icon: UsersIcon },
  { to: '/admin/departments', label: 'nav.departments', icon: BuildingOfficeIcon },
]

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const { t } = useTranslation()

  const linksByRole = {
    student: studentLinks,
    department: departmentLinks,
    admin: adminLinks,
    pvc: adminLinks,
  }

  const links = linksByRole[user?.role] || []

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 z-30 transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-auto lg:z-auto`}
      >
        <nav className="flex flex-col gap-1 p-4 h-full overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            {user?.role === 'student' ? 'Student Portal' :
             user?.role === 'department' ? 'Department Portal' : 'Admin Portal'}
          </p>

          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? 'sidebar-link-active' : 'sidebar-link'
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{t(label)}</span>
            </NavLink>
          ))}

          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="px-3 py-2">
              <p className="text-xs text-gray-400">CU Student AI v1.0</p>
              <p className="text-xs text-gray-400">Chandigarh University</p>
            </div>
          </div>
        </nav>
      </aside>
    </>
  )
}
