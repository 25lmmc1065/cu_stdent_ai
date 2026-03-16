import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { complaintsAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import { format } from 'date-fns'
import { MagnifyingGlassIcon, FunnelIcon, ExclamationCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

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
  const labels = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected', under_review: 'Under Review', escalated: 'Escalated', closed: 'Closed' }
  return <span className={map[status] || 'badge bg-gray-100 text-gray-600'}>{labels[status] || status}</span>
}

function PriorityBadge({ priority }) {
  const map = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', critical: 'badge-critical', urgent: 'badge-high' }
  return <span className={map[priority] || 'badge bg-gray-100 text-gray-600 badge'}>{priority || '—'}</span>
}

export default function ComplaintList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  useEffect(() => {
    fetchComplaints()
  }, [page, statusFilter, priorityFilter])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const params = { page, limit, status: statusFilter || undefined, priority: priorityFilter || undefined }
      const res = await complaintsAPI.myComplaints(params)
      const data = res.data
      setComplaints(data?.complaints || data?.data || [])
      setTotal(data?.total || 0)
    } catch {
      setComplaints([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = complaints.filter(
    (c) => !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c._id?.includes(search)
  )
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">{t('nav.myComplaints')}</h1>
          <p className="page-subtitle">{total} {t('common.results')}</p>
        </div>
        <button onClick={() => navigate('/student/file-complaint')} className="btn-primary">
          + {t('complaint.fileNew')}
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('complaint.search')} className="form-input pl-9"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="form-select text-sm">
                <option value="">{t('complaint.all')} Status</option>
                <option value="pending">{t('status.pending')}</option>
                <option value="in_progress">{t('status.inProgress')}</option>
                <option value="resolved">{t('status.resolved')}</option>
                <option value="rejected">{t('status.rejected')}</option>
                <option value="under_review">{t('status.under_review')}</option>
              </select>
            </div>
            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1) }} className="form-select text-sm">
              <option value="">{t('complaint.all')} Priority</option>
              <option value="low">{t('priority.low')}</option>
              <option value="medium">{t('priority.medium')}</option>
              <option value="high">{t('priority.high')}</option>
              <option value="critical">{t('priority.critical')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ExclamationCircleIcon className="h-14 w-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t('complaint.noComplaints')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('complaint.noComplaintsHint')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-th">{t('complaint.id')}</th>
                    <th className="table-th">{t('complaint.complaintTitle')}</th>
                    <th className="table-th hidden sm:table-cell">{t('complaint.categoryLabel')}</th>
                    <th className="table-th hidden md:table-cell">{t('complaint.departmentLabel')}</th>
                    <th className="table-th">{t('complaint.status')}</th>
                    <th className="table-th hidden lg:table-cell">{t('complaint.priority')}</th>
                    <th className="table-th hidden md:table-cell">{t('complaint.date')}</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c._id} className="table-row" onClick={() => navigate(`/student/complaints/${c._id}`)}>
                      <td className="table-td font-mono text-xs text-gray-500">#{c._id?.slice(-6).toUpperCase()}</td>
                      <td className="table-td">
                        <p className="font-medium text-gray-900 truncate max-w-[180px]">{c.title}</p>
                      </td>
                      <td className="table-td hidden sm:table-cell capitalize text-gray-500 text-xs">{c.category || '—'}</td>
                      <td className="table-td hidden md:table-cell text-gray-500 text-xs">{c.department?.name || c.department || '—'}</td>
                      <td className="table-td"><StatusBadge status={c.status} /></td>
                      <td className="table-td hidden lg:table-cell"><PriorityBadge priority={c.priority} /></td>
                      <td className="table-td hidden md:table-cell text-gray-500 text-xs">
                        {c.createdAt ? format(new Date(c.createdAt), 'dd MMM yy') : '—'}
                      </td>
                      <td className="table-td">
                        <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">{t('complaint.view')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {t('common.showing')} {(page - 1) * limit + 1}–{Math.min(page * limit, total)} {t('common.of')} {total}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-2 py-1 disabled:opacity-40">
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-2 py-1 disabled:opacity-40">
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
