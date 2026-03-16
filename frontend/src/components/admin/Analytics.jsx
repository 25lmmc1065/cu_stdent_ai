import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { analyticsAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'
import { format, subMonths } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  DocumentArrowDownIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

const COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#f97316']
const PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#8b5cf6' }

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon className="h-6 w-6" /></div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-green-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Analytics() {
  const { t } = useTranslation()
  const [dateFrom, setDateFrom] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState([])
  const [deptData, setDeptData] = useState([])
  const [priorityData, setPriorityData] = useState([])
  const [perfTable, setPerfTable] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = { from: dateFrom, to: dateTo }
      const [statsRes, trendsRes, perfRes] = await Promise.all([
        analyticsAPI.getStats(params),
        analyticsAPI.getTrends(params),
        analyticsAPI.getPerformance(params),
      ])

      const s = statsRes.data
      setStats(s)

      const tData = trendsRes.data?.trends || trendsRes.data || []
      setTrends(tData)

      const perf = perfRes.data?.departments || perfRes.data || []
      setPerfTable(perf)
      setDeptData(perf.map((d) => ({ name: d.name || d._id, complaints: d.total || 0 })))

      const prio = s?.priorityBreakdown || s?.byPriority || {}
      setPriorityData(
        Object.entries(prio).map(([key, val]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: val,
          color: PRIORITY_COLORS[key] || '#6b7280',
        })).filter((d) => d.value > 0)
      )
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type) => {
    setExporting(true)
    try {
      const res = await analyticsAPI.exportReport({ from: dateFrom, to: dateTo, format: type })
      const blob = new Blob([res.data], {
        type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.${type === 'pdf' ? 'pdf' : 'xlsx'}`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded!')
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">{t('analytics.title')}</h1>
          <p className="page-subtitle">System-wide complaint analytics and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} disabled={exporting} className="btn-secondary text-sm">
            <DocumentArrowDownIcon className="h-4 w-4" />
            {exporting ? t('analytics.exporting') : t('analytics.downloadPDF')}
          </button>
          <button onClick={() => handleExport('excel')} disabled={exporting} className="btn-secondary text-sm">
            <DocumentArrowDownIcon className="h-4 w-4" />
            {t('analytics.downloadExcel')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex gap-3 flex-1">
            <div>
              <label className="form-label text-xs">{t('analytics.dateFrom')}</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label text-xs">{t('analytics.dateTo')}</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input text-sm" />
            </div>
          </div>
          <button onClick={fetchAll} className="btn-primary">{t('analytics.applyFilter')}</button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard label="Total" value={stats?.total || 0} icon={DocumentTextIcon} color="bg-blue-50 text-blue-600" />
            <StatCard label="Pending" value={stats?.pending || 0} icon={ClockIcon} color="bg-yellow-50 text-yellow-600" />
            <StatCard label="Resolved" value={stats?.resolved || 0} icon={CheckCircleIcon} color="bg-green-50 text-green-600" />
            <StatCard label="Resolution Rate" value={`${(stats?.resolutionRate || 0).toFixed(1)}%`} icon={ChartBarIcon} color="bg-indigo-50 text-indigo-600" />
            <StatCard label="Avg Time" value={`${stats?.avgResolutionTime || 0}d`} icon={ClockIcon} color="bg-purple-50 text-purple-600" />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Bar Chart: By Department */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">{t('analytics.complaintsByDepartment')}</h3>
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={deptData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="complaints" name="Complaints" radius={[4, 4, 0, 0]}>
                      {deptData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">{t('analytics.noData')}</div>
              )}
            </div>

            {/* Pie Chart: By Priority */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">{t('analytics.complaintsByPriority')}</h3>
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="45%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value">
                      {priorityData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [val, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">{t('analytics.noData')}</div>
              )}
            </div>
          </div>

          {/* Line Chart: Trends */}
          <div className="card mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('analytics.complaintTrends')}</h3>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trends} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pending" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">{t('analytics.noData')}</div>
            )}
          </div>

          {/* Department Performance Table */}
          {perfTable.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.departmentPerformance')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="table-th">Department</th>
                      <th className="table-th text-center">Total</th>
                      <th className="table-th text-center">Pending</th>
                      <th className="table-th text-center">Resolved</th>
                      <th className="table-th text-center">Resolution Rate</th>
                      <th className="table-th text-center">Avg Time (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfTable.map((dept, i) => {
                      const rate = dept.resolutionRate || (dept.total ? (dept.resolved / dept.total * 100) : 0)
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="table-td font-medium">{dept.name || dept._id}</td>
                          <td className="table-td text-center font-semibold">{dept.total || 0}</td>
                          <td className="table-td text-center">
                            <span className="text-yellow-600 font-medium">{dept.pending || 0}</span>
                          </td>
                          <td className="table-td text-center">
                            <span className="text-green-600 font-medium">{dept.resolved || 0}</span>
                          </td>
                          <td className="table-td text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 bg-gray-100 rounded-full h-2">
                                <div className="rounded-full h-2"
                                  style={{ width: `${Math.min(100, rate)}%`, backgroundColor: rate >= 70 ? '#22c55e' : rate >= 40 ? '#f59e0b' : '#ef4444' }} />
                              </div>
                              <span className="text-xs font-medium text-gray-700">{rate.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="table-td text-center text-gray-500">
                            {dept.avgResolutionTime || dept.avgTime || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
