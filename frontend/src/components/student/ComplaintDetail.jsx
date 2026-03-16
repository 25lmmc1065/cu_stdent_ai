import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { complaintsAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  ArrowLeftIcon,
  PaperClipIcon,
  StarIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  TagIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

function StatusBadge({ status }) {
  const map = { pending: 'badge-pending', in_progress: 'badge-inprogress', resolved: 'badge-resolved', rejected: 'badge-rejected', under_review: 'badge-inprogress', escalated: 'badge bg-purple-100 text-purple-800', closed: 'badge bg-gray-100 text-gray-600' }
  const labels = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected', under_review: 'Under Review', escalated: 'Escalated', closed: 'Closed' }
  return <span className={`${map[status] || 'badge bg-gray-100 text-gray-600'} text-sm px-3 py-1`}>{labels[status] || status}</span>
}

function PriorityBadge({ priority }) {
  const colors = { low: 'text-green-600 bg-green-50', medium: 'text-yellow-600 bg-yellow-50', high: 'text-red-600 bg-red-50', critical: 'text-purple-600 bg-purple-50' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[priority] || 'text-gray-600 bg-gray-50'}`}>{priority || '—'}</span>
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="text-yellow-400 focus:outline-none">
          {star <= (hover || value) ? <StarSolid className="h-7 w-7" /> : <StarIcon className="h-7 w-7 text-gray-300" />}
        </button>
      ))}
    </div>
  )
}

export default function ComplaintDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' })
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  useEffect(() => {
    fetchComplaint()
  }, [id])

  const fetchComplaint = async () => {
    setLoading(true)
    try {
      const res = await complaintsAPI.getById(id)
      const data = res.data?.complaint || res.data
      setComplaint(data)
      if (data?.feedback?.rating) setFeedbackSubmitted(true)
    } catch {
      toast.error('Failed to load complaint')
      navigate('/student/complaints')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (e) => {
    e.preventDefault()
    if (!feedback.rating) { toast.error('Please select a rating'); return }
    setSubmittingFeedback(true)
    try {
      await complaintsAPI.submitFeedback(id, feedback)
      toast.success('Feedback submitted!')
      setFeedbackSubmitted(true)
    } catch {
      toast.error('Failed to submit feedback')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!complaint) return null

  const canAppeal = ['resolved', 'rejected'].includes(complaint.status)
  const isResolved = complaint.status === 'resolved'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary px-3 py-2">
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <div>
          <h1 className="page-title">Complaint Details</h1>
          <p className="text-xs text-gray-400 font-mono">#{complaint._id?.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{complaint.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              {complaint.category && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <TagIcon className="h-3.5 w-3.5" />
                  <span className="capitalize">{complaint.category}</span>
                </span>
              )}
            </div>
          </div>
          {canAppeal && (
            <Link to="/student/appeals" state={{ complaintId: complaint._id }} className="btn-secondary text-xs flex-shrink-0">
              <MegaphoneIcon className="h-4 w-4" />
              {t('complaint.fileAppeal')}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b border-gray-100 mb-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-1">Department</p>
            <p className="font-medium text-gray-900">{complaint.department?.name || complaint.department || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Language</p>
            <p className="font-medium text-gray-900 capitalize">{complaint.language === 'hi' ? 'Hindi' : 'English'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Filed On</p>
            <p className="font-medium text-gray-900">{complaint.createdAt ? format(new Date(complaint.createdAt), 'dd MMM yyyy') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Last Updated</p>
            <p className="font-medium text-gray-900">{complaint.updatedAt ? format(new Date(complaint.updatedAt), 'dd MMM yyyy') : '—'}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">{t('complaint.description')}</p>
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
        </div>
      </div>

      {/* AI Analysis */}
      {complaint.aiAnalysis && (
        <div className="card mb-4 border-l-4 border-indigo-400">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="h-5 w-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-900">{t('complaint.aiAnalysis')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {complaint.aiAnalysis.category && (
              <div className="bg-indigo-50 rounded-lg p-3">
                <p className="text-xs text-indigo-600 font-medium mb-1">Detected Category</p>
                <p className="font-semibold text-indigo-900 capitalize">{complaint.aiAnalysis.category}</p>
              </div>
            )}
            {complaint.aiAnalysis.sentiment && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">{t('complaint.sentiment')}</p>
                <p className="font-semibold text-blue-900 capitalize">{complaint.aiAnalysis.sentiment}</p>
              </div>
            )}
            {complaint.aiAnalysis.priority && (
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs text-orange-600 font-medium mb-1">Suggested Priority</p>
                <p className="font-semibold text-orange-900 capitalize">{complaint.aiAnalysis.priority}</p>
              </div>
            )}
          </div>
          {complaint.aiAnalysis.keywords?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">{t('complaint.keywords')}</p>
              <div className="flex flex-wrap gap-1.5">
                {complaint.aiAnalysis.keywords.map((kw) => (
                  <span key={kw} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">{kw}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attachments */}
      {complaint.attachments?.length > 0 && (
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <PaperClipIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">{t('complaint.attachments')}</h3>
          </div>
          <div className="space-y-2">
            {complaint.attachments.map((att, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700 truncate">{att.originalName || att.filename || `File ${i + 1}`}</span>
                <a href={att.url || att.path} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-4 flex-shrink-0">
                  {t('complaint.downloadAttachment')} ↓
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Response */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">{t('complaint.departmentResponse')}</h3>
        </div>
        {complaint.response ? (
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{complaint.response}</p>
            {complaint.respondedAt && (
              <p className="text-xs text-gray-400 mt-2">
                {format(new Date(complaint.respondedAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">{t('complaint.noResponse')}</p>
        )}
      </div>

      {/* Timeline */}
      {complaint.timeline?.length > 0 && (
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">{t('complaint.timeline')}</h3>
          </div>
          <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
            {complaint.timeline.map((event, i) => (
              <div key={i} className="relative timeline-item">
                <div>
                  <p className="text-sm font-medium text-gray-900">{event.action || event.status}</p>
                  {event.note && <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {event.timestamp ? format(new Date(event.timestamp), 'dd MMM yyyy, hh:mm a') : ''}
                    {event.by && ` · ${event.by}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {isResolved && !feedbackSubmitted && (
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">{t('complaint.feedbackTitle')}</h3>
          <form onSubmit={handleFeedback} className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">How satisfied are you with the resolution?</p>
              <StarRating value={feedback.rating} onChange={(r) => setFeedback({ ...feedback, rating: r })} />
            </div>
            <div>
              <textarea
                value={feedback.comment} onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                placeholder={t('complaint.feedbackPlaceholder')} className="form-input min-h-[80px] resize-none"
              />
            </div>
            <button type="submit" disabled={submittingFeedback} className="btn-primary">
              {submittingFeedback ? t('common.loading') : t('complaint.submitFeedback')}
            </button>
          </form>
        </div>
      )}
      {feedbackSubmitted && isResolved && (
        <div className="card mb-4 text-center py-6">
          <p className="text-green-600 font-medium">✓ Thank you for your feedback!</p>
        </div>
      )}
    </div>
  )
}
