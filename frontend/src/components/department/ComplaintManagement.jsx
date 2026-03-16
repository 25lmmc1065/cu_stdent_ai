import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { departmentsAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronRightIcon,
  ClockIcon,
  TagIcon,
} from '@heroicons/react/24/outline'

const STATUS_OPTIONS = ['pending', 'in_progress', 'under_review', 'resolved', 'rejected', 'closed']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical']

function StatusBadge({ status }) {
  const map = { pending: 'badge-pending', in_progress: 'badge-inprogress', resolved: 'badge-resolved', rejected: 'badge-rejected', under_review: 'badge-inprogress', closed: 'badge bg-gray-100 text-gray-600' }
  const labels = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected', under_review: 'Under Review', closed: 'Closed' }
  return <span className={map[status] || 'badge bg-gray-100 text-gray-600'}>{labels[status] || status}</span>
}

function PriorityBadge({ priority }) {
  const map = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', critical: 'badge-critical' }
  return priority ? <span className={`badge capitalize ${map[priority] || 'badge bg-gray-100 text-gray-600'}`}>{priority}</span> : null
}

export default function ComplaintManagement() {
  const { t } = useTranslation()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 15

  const [actionForm, setActionForm] = useState({ status: '', response: '', note: '' })
  const [saving, setSaving] = useState(false)

  const fetchComplaints = useCallback(async () => {
    setLoading(true)
    try {
      const res = await departmentsAPI.getComplaints({
        page, limit, status: statusFilter || undefined, priority: priorityFilter || undefined,
      })
      const data = res.data
      setComplaints(data?.complaints || data?.data || [])
      setTotal(data?.total || 0)
    } catch {
      setComplaints([])
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, priorityFilter])

  useEffect(() => { fetchComplaints() }, [fetchComplaints])

  const openDetail = (c) => {
    setSelected(c)
    setActionForm({ status: c.status, response: c.response || '', note: '' })
  }

  const saveChanges = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const updates = {}
      if (actionForm.status !== selected.status) updates.status = actionForm.status
      if (actionForm.response) updates.response = actionForm.response
      if (actionForm.note) updates.note = actionForm.note

      await departmentsAPI.updateComplaint(selected._id, updates)
      toast.success('Complaint updated successfully!')
      setSelected(null)
      fetchComplaints()
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.serverError'))
    } finally {
      setSaving(false)
    }
  }

  const filtered = complaints.filter(
    (c) => !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c._id?.includes(search)
  )
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.complaints')}</h1>
        <p className="page-subtitle">{total} total complaints assigned</p>
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
                <option value="">All Status</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1) }} className="form-select text-sm">
              <option value="">All Priority</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Complaint List */}
        <div className={`${selected ? 'hidden lg:block lg:w-1/2' : 'w-full'}`}>
          <div className="card">
            {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No complaints found</div>
            ) : (
              <>
                <div className="space-y-2">
                  {filtered.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => openDetail(c)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                        selected?._id === c._id ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-gray-400">#{c._id?.slice(-6).toUpperCase()}</span>
                            <StatusBadge status={c.status} />
                            <PriorityBadge priority={c.priority} />
                          </div>
                          <p className="font-medium text-gray-900 truncate">{c.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {c.category && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <TagIcon className="h-3 w-3" />{c.category}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <ClockIcon className="h-3 w-3" />
                              {c.createdAt ? format(new Date(c.createdAt), 'dd MMM yy') : '—'}
                            </span>
                          </div>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">{(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="btn-secondary px-2 py-1 text-xs disabled:opacity-40">Prev</button>
                    <span className="text-xs text-gray-600">{page}/{totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="btn-secondary px-2 py-1 text-xs disabled:opacity-40">Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-full lg:w-1/2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">{selected.title}</h2>
                  <span className="font-mono text-xs text-gray-400">#{selected._id?.slice(-8).toUpperCase()}</span>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-xl text-sm">
                <div><p className="text-xs text-gray-400">Status</p><StatusBadge status={selected.status} /></div>
                <div><p className="text-xs text-gray-400">Priority</p><PriorityBadge priority={selected.priority} /></div>
                <div><p className="text-xs text-gray-400">Category</p><p className="font-medium capitalize">{selected.category || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Filed</p><p className="font-medium">{selected.createdAt ? format(new Date(selected.createdAt), 'dd MMM yy') : '—'}</p></div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {selected.description}
                </p>
              </div>

              {/* AI Analysis */}
              {selected.aiAnalysis && (
                <div className="mb-4 p-3 bg-indigo-50 rounded-xl">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">AI Analysis</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selected.aiAnalysis.category && <div><span className="text-xs text-gray-500">Category: </span><span className="capitalize">{selected.aiAnalysis.category}</span></div>}
                    {selected.aiAnalysis.sentiment && <div><span className="text-xs text-gray-500">Sentiment: </span><span className="capitalize">{selected.aiAnalysis.sentiment}</span></div>}
                  </div>
                </div>
              )}

              {/* Update Status */}
              <div className="mb-4">
                <label className="form-label">{t('complaint.updateStatus')}</label>
                <select
                  value={actionForm.status} onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}
                  className="form-select"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Official Response */}
              <div className="mb-4">
                <label className="form-label">{t('complaint.addResponse')}</label>
                <textarea
                  value={actionForm.response} onChange={(e) => setActionForm({ ...actionForm, response: e.target.value })}
                  placeholder={t('complaint.responsePlaceholder')} className="form-input min-h-[90px] resize-none"
                />
              </div>

              {/* Internal Note */}
              <div className="mb-4">
                <label className="form-label">{t('complaint.internalNote')}</label>
                <textarea
                  value={actionForm.note} onChange={(e) => setActionForm({ ...actionForm, note: e.target.value })}
                  placeholder={t('complaint.notePlaceholder')} className="form-input min-h-[70px] resize-none text-xs"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="btn-secondary flex-1">{t('common.cancel')}</button>
                <button onClick={saveChanges} disabled={saving} className="btn-primary flex-1">
                  {saving ? t('common.loading') : t('common.update')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
