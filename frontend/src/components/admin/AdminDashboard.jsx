import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { adminAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import { format } from 'date-fns'
import {
  UsersIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getSystemStats()
        setStats(res.data)
      } catch {
        setStats({
          totalComplaints: 0, totalUsers: 0, totalDepartments: 0,
          resolutionRate: 0, pendingComplaints: 0, resolvedComplaints: 0,
          avgResolutionTime: 0, departments: [], recentActivity: [],
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { label: t('dashboard.totalComplaints'), value: stats?.totalComplaints || 0, icon: DocumentTextIcon, color: 'bg-blue-50 text-blue-600', trend: '+12%' },
    { label: t('dashboard.totalUsers'), value: stats?.totalUsers || 0, icon: UsersIcon, color: 'bg-indigo-50 text-indigo-600', trend: '+5%' },
    { label: t('dashboard.totalDepartments'), value: stats?.totalDepartments || 0, icon: BuildingOfficeIcon, color: 'bg-purple-50 text-purple-600', trend: null },
    { label: t('dashboard.resolutionRate'), value: `${(stats?.resolutionRate || 0).toFixed(1)}%`, icon: CheckCircleIcon, color: 'bg-green-50 text-green-600', trend: '+3%' },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {/* Welcome */}
      <div className="gradient-header rounded-2xl p-6 text-white mb-6 shadow-md">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-blue-100 text-sm mt-1">
          {user?.role === 'pvc' ? 'PVC View — ' : ''}Welcome, {user?.name}
        </p>
        <p className="text-blue-200 text-xs mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, trend }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${color}`}><Icon className="h-6 w-6" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              {trend && <p className="text-xs text-green-500 mt-0.5">{trend} this month</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Overview Cards */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.systemStats')}</h2>
          <div className="space-y-3">
            {[
              { label: 'Pending Complaints', value: stats?.pendingComplaints || 0, color: 'bg-yellow-400' },
              { label: 'Resolved This Month', value: stats?.resolvedComplaints || 0, color: 'bg-green-500' },
              { label: 'Avg Resolution Time', value: `${stats?.avgResolutionTime || 0} days`, color: 'bg-blue-500' },
              { label: 'Active Appeals', value: stats?.activeAppeals || 0, color: 'bg-purple-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
                <span className="font-semibold text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
          <div className="space-y-3">
            {[
              { label: 'View Analytics', desc: 'Charts, trends & performance', to: '/admin/analytics', color: 'bg-blue-100 text-blue-600' },
              { label: 'Manage Users', desc: 'View and manage user accounts', to: '/admin/users', color: 'bg-indigo-100 text-indigo-600' },
              { label: 'Departments', desc: 'Configure department settings', to: '/admin/departments', color: 'bg-purple-100 text-purple-600' },
            ].map(({ label, desc, to, color }) => (
              <button key={to} onClick={() => navigate(to)}
                className="w-full flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                    <ArrowRightIcon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Department Performance Table */}
      {stats?.departments?.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.departmentPerformance')}</h2>
            <button onClick={() => navigate('/admin/analytics')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Full Analytics →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Department</th>
                  <th className="table-th text-center">Total</th>
                  <th className="table-th text-center">Pending</th>
                  <th className="table-th text-center">Resolved</th>
                  <th className="table-th text-center">Rate</th>
                  <th className="table-th hidden md:table-cell text-center">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.departments.slice(0, 8).map((dept) => (
                  <tr key={dept._id || dept.name} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-td font-medium">{dept.name}</td>
                    <td className="table-td text-center">{dept.total || 0}</td>
                    <td className="table-td text-center">
                      <span className="text-yellow-600 font-medium">{dept.pending || 0}</span>
                    </td>
                    <td className="table-td text-center">
                      <span className="text-green-600 font-medium">{dept.resolved || 0}</span>
                    </td>
                    <td className="table-td text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-green-500 rounded-full h-1.5"
                            style={{ width: `${dept.resolutionRate || 0}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{(dept.resolutionRate || 0).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="table-td hidden md:table-cell text-center text-gray-500 text-xs">
                      {dept.avgTime ? `${dept.avgTime} days` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats?.recentActivity?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h2>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 8).map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message || activity.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activity.timestamp ? format(new Date(activity.timestamp), 'dd MMM yyyy, hh:mm a') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
