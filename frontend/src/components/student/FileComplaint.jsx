import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { complaintsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

const CATEGORIES = ['academic', 'financial', 'hostel', 'examination', 'library', 'transportation', 'ragging', 'discrimination', 'infrastructure', 'other']

export default function FileComplaint() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ title: '', description: '', category: '', language: 'en' })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, { preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null })
    )
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [], 'application/msword': [], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [] },
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => toast.error('File too large or unsupported format'),
  })

  const removeFile = (name) => setFiles((prev) => prev.filter((f) => f.name !== name))

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description) {
      toast.error(t('common.required'))
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('category', form.category)
      formData.append('language', form.language)
      files.forEach((file) => formData.append('attachments', file))

      const res = await complaintsAPI.create(formData)
      const complaint = res.data?.complaint || res.data

      setAiProcessing(true)
      setTimeout(() => {
        setAiProcessing(false)
        setSubmitted(complaint)
        setLoading(false)
      }, 2000)
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.serverError'))
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('complaint.successTitle')}</h2>
          <p className="text-gray-500 mb-4">{t('complaint.successMessage')}</p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-700 font-medium">{t('complaint.complaintId')}</p>
            <p className="text-lg font-bold text-blue-900 font-mono">
              #{submitted._id?.slice(-8).toUpperCase() || 'N/A'}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSubmitted(null); setForm({ title: '', description: '', category: '', language: 'en' }); setFiles([]) }}
              className="btn-secondary">
              {t('complaint.fileNew')}
            </button>
            <Link to="/student/complaints" className="btn-primary">{t('complaint.viewAll')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">{t('complaint.fileNew')}</h1>
        <p className="page-subtitle">Describe your issue and our AI will classify it automatically</p>
      </div>

      {/* AI banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 mb-6 flex items-center gap-3">
        <SparklesIcon className="h-6 w-6 text-indigo-500 flex-shrink-0" />
        <p className="text-sm text-indigo-700">
          <strong>AI-Powered:</strong> Our system will automatically categorize your complaint, detect priority level, and route it to the right department.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Title */}
        <div>
          <label className="form-label">{t('complaint.title')} *</label>
          <input
            type="text" name="title" value={form.title} onChange={handleChange}
            placeholder={t('complaint.titlePlaceholder')} className="form-input" required
          />
        </div>

        {/* Description */}
        <div>
          <label className="form-label">{t('complaint.description')} *</label>
          <textarea
            name="description" value={form.description} onChange={handleChange}
            placeholder={t('complaint.descriptionPlaceholder')}
            className="form-input min-h-[140px] resize-y" required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Category */}
          <div>
            <label className="form-label">{t('complaint.category')}</label>
            <select name="category" value={form.category} onChange={handleChange} className="form-select">
              <option value="">{t('complaint.categoryAuto')}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`categories.${c}`)}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="form-label">{t('complaint.language')}</label>
            <select name="language" value={form.language} onChange={handleChange} className="form-select">
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="form-label">{t('complaint.attachments')}</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">{t('complaint.dropzone')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('complaint.dropzoneHint')}</p>
          </div>

          {/* File Preview */}
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file) => (
                <div key={file.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {file.preview ? (
                    <img src={file.preview} alt={file.name} className="h-10 w-10 object-cover rounded-md flex-shrink-0" />
                  ) : file.type.startsWith('image/') ? (
                    <PhotoIcon className="h-10 w-10 text-gray-400 flex-shrink-0" />
                  ) : (
                    <DocumentIcon className="h-10 w-10 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button" onClick={() => removeFile(file.name)}
                    className="text-gray-400 hover:text-red-500 transition-colors">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Processing indicator */}
        {aiProcessing && (
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl">
            <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-sm font-medium text-indigo-700">{t('complaint.aiProcessing')}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link to="/student" className="btn-secondary flex-1 justify-center">
            {t('common.cancel')}
          </Link>
          <button type="submit" disabled={loading || aiProcessing} className="btn-primary flex-1 justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t('complaint.submitting')}
              </span>
            ) : t('complaint.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
