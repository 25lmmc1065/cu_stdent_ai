import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { departmentsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import { format } from 'date-fns'
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#8b5cf6' }

function StatusBadge({ status }) {
  const map = { pending: 'badge-pending', in_progress: 'badge-inprogress', resolved: 'badge-resolved', rejected: 'badge-rejected', under_review: 'badge-inprogress' }
  const labels = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected', under_review: 'Under Review' }
  return <span className={map[status] || 'badge bg-gray-100 text-gray-600'}>{labels[status] || status}</span>
}

export default function DepartmentDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentComplaints, setRecentComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          departmentsAPI.getStats(),
          departmentsAPI.getComplaints({ limit: 5, page: 1 }),
        ])
        setStats(statsRes.data)
        setRecentComplaints(complaintsRes.data?.complaints || complaintsRes.data?.data || [])
      } catch {
        setStats({ total: 0, pending: 0, inProgress: 0, resolved: 0 })
        setRecentComplaints([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const priorityData = [
    { name: 'Low', value: stats?.priorityBreakdown?.low || 0, color: PRIORITY_COLORS.low },
    { name: 'Medium', value: stats?.priorityBreakdown?.medium || 0, color: PRIORITY_COLORS.medium },
    { name: 'High', value: stats?.priorityBreakdown?.high || 0, color: PRIORITY_COLORS.high },
    { name: 'Critical', value: stats?.priorityBreakdown?.critical || 0, color: PRIORITY_COLORS.critical },
  ].filter((d) => d.value > 0)

  const statCards = [
    { label: 'Total Assigned', value: stats?.total || 0, icon: DocumentTextIcon, color: 'bg-blue-50 text-blue-600' },
    { label: t('dashboard.pending'), value: stats?.pending || 0, icon: ClockIcon, color: 'bg-yellow-50 text-yellow-600' },
    { label: t('dashboard.inProgress'), value: stats?.inProgress || 0, icon: ExclamationTriangleIcon, color: 'bg-orange-50 text-orange-600' },
    { label: t('dashboard.resolvedToday'), value: stats?.resolvedToday || 0, icon: CheckCircleIcon, color: 'bg-green-50 text-green-600' },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {/* Welcome */}
      <div className="gradient-header rounded-2xl p-6 text-white mb-6 shadow-md">
        <h1 className="text-2xl font-bold">Department Dashboard</h1>
        <p className="text-blue-100 text-sm mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${color}`}><Icon className="h-6 w-6" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Priority Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.priorityBreakdown')}</h2>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.performanceMetrics')}</h2>
          <div className="space-y-4">
            {[
              { label: 'Resolution Rate', value: stats?.resolutionRate ? `${stats.resolutionRate.toFixed(1)}%` : '—', color: 'bg-green-500' },
              { label: 'Avg Resolution Time', value: stats?.avgResolutionTime ? `${stats.avgResolutionTime} ${t('dashboard.days')}` : '—', color: 'bg-blue-500' },
              { label: 'Pending > 7 days', value: stats?.overdue || 0, color: 'bg-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Complaints</h2>
          <button onClick={() => navigate('/department/complaints')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View all <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        {recentComplaints.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No complaints assigned yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">ID</th>
                  <th className="table-th">Title</th>
                  <th className="table-th hidden sm:table-cell">Priority</th>
                  <th className="table-th">Status</th>
                  <th className="table-th hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((c) => (
                  <tr key={c._id} className="table-row" onClick={() => navigate('/department/complaints')}>
                    <td className="table-td font-mono text-xs text-gray-500">#{c._id?.slice(-6).toUpperCase()}</td>
                    <td className="table-td">
                      <p className="font-medium text-gray-900 truncate max-w-[160px]">{c.title}</p>
                    </td>
                    <td className="table-td hidden sm:table-cell">
                      <span className={`badge capitalize ${
                        c.priority === 'high' || c.priority === 'critical' ? 'badge-high' :
                        c.priority === 'medium' ? 'badge-medium' : 'badge-low'
                      }`}>{c.priority || '—'}</span>
                    </td>
                    <td className="table-td"><StatusBadge status={c.status} /></td>
                    <td className="table-td hidden md:table-cell text-gray-500 text-xs">
                      {c.createdAt ? format(new Date(c.createdAt), 'dd MMM yy') : '—'}
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
