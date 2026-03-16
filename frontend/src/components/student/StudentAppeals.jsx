import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { appealsAPI, complaintsAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { XMarkIcon, MegaphoneIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

function StatusBadge({ status }) {
  const map = { pending: 'badge-pending', approved: 'badge-resolved', dismissed: 'badge-rejected', under_review: 'badge-inprogress', closed: 'badge bg-gray-100 text-gray-600' }
  return <span className={map[status] || 'badge bg-gray-100 text-gray-600'}>{status}</span>
}

export default function StudentAppeals() {
  const { t } = useTranslation()
  const location = useLocation()
  const [appeals, setAppeals] = useState([])
  const [myComplaints, setMyComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(!!location.state?.complaintId)
  const [form, setForm] = useState({ complaintId: location.state?.complaintId || '', reason: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [appealsRes, complaintsRes] = await Promise.all([
        appealsAPI.myAppeals(),
        complaintsAPI.myComplaints({ status: 'resolved,rejected', limit: 50 }),
      ])
      setAppeals(appealsRes.data?.appeals || appealsRes.data?.data || [])
      const comp = complaintsRes.data?.complaints || complaintsRes.data?.data || []
      setMyComplaints(comp.filter((c) => ['resolved', 'rejected'].includes(c.status)))
    } catch {
      setAppeals([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.complaintId || !form.reason) { toast.error(t('common.required')); return }
    if (form.reason.length < 20) { toast.error('Please provide a detailed reason (at least 20 characters)'); return }
    setSubmitting(true)
    try {
      await appealsAPI.create({ complaintId: form.complaintId, reason: form.reason })
      toast.success('Appeal submitted successfully!')
      setShowModal(false)
      setForm({ complaintId: '', reason: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.serverError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">{t('appeal.title')}</h1>
          <p className="page-subtitle">{appeals.length} {t('common.results')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <MegaphoneIcon className="h-4 w-4" />
          {t('appeal.newAppeal')}
        </button>
      </div>

      {loading ? <LoadingSpinner /> : appeals.length === 0 ? (
        <div className="card text-center py-16">
          <ExclamationCircleIcon className="h-14 w-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('appeal.noAppeals')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('appeal.noAppealsHint')}</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">{t('appeal.newAppeal')}</button>
        </div>
      ) : (
        <div className="space-y-3">
          {appeals.map((appeal) => (
            <div key={appeal._id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-400">#{appeal._id?.slice(-6).toUpperCase()}</span>
                    <StatusBadge status={appeal.status} />
                  </div>
                  <p className="font-medium text-gray-900 mb-1">
                    {t('appeal.complaintRef')}: #{appeal.complaint?._id?.slice(-6).toUpperCase() || appeal.complaintId?.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600">{appeal.reason}</p>
                  {appeal.resolution && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium mb-1">{t('appeal.resolution')}</p>
                      <p className="text-sm text-gray-800">{appeal.resolution}</p>
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-gray-400 flex-shrink-0">
                  {appeal.createdAt ? format(new Date(appeal.createdAt), 'dd MMM yyyy') : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Appeal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{t('appeal.newAppeal')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="form-label">{t('appeal.selectComplaint')} *</label>
                <select
                  value={form.complaintId} onChange={(e) => setForm({ ...form, complaintId: e.target.value })}
                  className="form-select" required
                >
                  <option value="">-- Select a complaint --</option>
                  {myComplaints.map((c) => (
                    <option key={c._id} value={c._id}>
                      #{c._id?.slice(-6).toUpperCase()} — {c.title?.slice(0, 40)} ({c.status})
                    </option>
                  ))}
                </select>
                {myComplaints.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No resolved/rejected complaints found to appeal.</p>
                )}
              </div>
              <div>
                <label className="form-label">{t('appeal.reason')} *</label>
                <textarea
                  value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder={t('appeal.reasonPlaceholder')} className="form-input min-h-[120px] resize-none" required
                />
                <p className="text-xs text-gray-400 mt-1">{form.reason.length} / minimum 20 characters</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  {t('appeal.cancelAppeal')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? t('common.loading') : t('appeal.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
