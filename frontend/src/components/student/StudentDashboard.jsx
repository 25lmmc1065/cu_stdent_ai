import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { complaintsAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import { format } from 'date-fns'
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  MegaphoneIcon,
  PlusIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

function StatusBadge({ status }) {
  const map = {
    pending: 'badge-pending',
    in_progress: 'badge-inprogress',
    resolved: 'badge-resolved',
    rejected: 'badge-rejected',
    under_review: 'badge-inprogress',
    escalated: 'badge bg-purple-100 text-purple-800',
    closed: 'badge bg-gray-100 text-gray-600',
  }
  const labels = {
    pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved',
    rejected: 'Rejected', under_review: 'Under Review', escalated: 'Escalated', closed: 'Closed',
  }
  return <span className={map[status] || 'badge bg-gray-100 text-gray-600'}>{labels[status] || status}</span>
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, appeals: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await complaintsAPI.myComplaints({ limit: 5, page: 1 })
        const complaints = res.data?.complaints || res.data?.data || []
        const total = res.data?.total || complaints.length
        const pending = complaints.filter((c) => c.status === 'pending').length
        const resolved = complaints.filter((c) => c.status === 'resolved').length
        setStats({ total, pending, resolved, appeals: 0 })
        setRecent(complaints.slice(0, 5))
      } catch {
        setRecent([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    { label: t('dashboard.totalComplaints'), value: stats.total, icon: DocumentTextIcon, color: 'bg-blue-50 text-blue-600', bg: 'bg-blue-600' },
    { label: t('dashboard.pending'), value: stats.pending, icon: ClockIcon, color: 'bg-yellow-50 text-yellow-600', bg: 'bg-yellow-400' },
    { label: t('dashboard.resolved'), value: stats.resolved, icon: CheckCircleIcon, color: 'bg-green-50 text-green-600', bg: 'bg-green-500' },
    { label: t('dashboard.totalAppeals'), value: stats.appeals, icon: MegaphoneIcon, color: 'bg-purple-50 text-purple-600', bg: 'bg-purple-500' },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {/* Welcome banner */}
      <div className="gradient-header rounded-2xl p-6 text-white mb-6 shadow-md">
        <h1 className="text-2xl font-bold">{t('dashboard.welcome')}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-blue-100 text-sm mt-1">
          {user?.enrollmentNumber && `Enrollment: ${user.enrollmentNumber} · `}
          {user?.program && `${user.program} · `}
          {user?.department}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link
          to="/student/file-complaint"
          className="card flex items-center justify-between hover:shadow-lg transition-shadow group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <PlusIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{t('complaint.fileNew')}</p>
              <p className="text-xs text-gray-500">Submit a new complaint</p>
            </div>
          </div>
          <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </Link>

        <Link
          to="/student/complaints"
          className="card flex items-center justify-between hover:shadow-lg transition-shadow group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{t('complaint.viewAll')}</p>
              <p className="text-xs text-gray-500">Track your complaints</p>
            </div>
          </div>
          <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
        </Link>
      </div>

      {/* Recent Complaints */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recentComplaints')}</h2>
          <Link to="/student/complaints" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('complaint.noComplaints')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('complaint.noComplaintsHint')}</p>
            <Link to="/student/file-complaint" className="btn-primary mt-4 inline-flex">
              {t('complaint.fileNew')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">ID</th>
                  <th className="table-th">Title</th>
                  <th className="table-th hidden sm:table-cell">Category</th>
                  <th className="table-th">Status</th>
                  <th className="table-th hidden md:table-cell">Date</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr
                    key={c._id}
                    className="table-row"
                    onClick={() => navigate(`/student/complaints/${c._id}`)}
                  >
                    <td className="table-td font-mono text-xs text-gray-500">
                      #{c._id?.slice(-6).toUpperCase()}
                    </td>
                    <td className="table-td">
                      <p className="font-medium text-gray-900 truncate max-w-[160px]">{c.title}</p>
                    </td>
                    <td className="table-td hidden sm:table-cell capitalize text-gray-500">{c.category || '—'}</td>
                    <td className="table-td"><StatusBadge status={c.status} /></td>
                    <td className="table-td hidden md:table-cell text-gray-500">
                      {c.createdAt ? format(new Date(c.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="table-td">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
