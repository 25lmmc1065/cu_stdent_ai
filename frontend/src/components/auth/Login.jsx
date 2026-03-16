import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import LanguageToggle from '../common/LanguageToggle'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error(t('common.required'))
      return
    }
    setLoading(true)
    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.name}!`)
      const redirectMap = {
        student: '/student',
        department: '/department',
        admin: '/admin',
        pvc: '/admin',
      }
      navigate(redirectMap[user.role] || '/student', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || t('common.serverError')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Top bar */}
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="gradient-header rounded-2xl p-8 text-white text-center mb-6 shadow-lg">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AcademicCapIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">CU Student AI</h1>
            <p className="text-blue-100 text-sm mt-1">Chandigarh University</p>
            <p className="text-blue-100 text-xs mt-2">Complaint Management System</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{t('auth.welcomeBack')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('auth.loginSubtitle')}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">{t('auth.email')}</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('auth.emailPlaceholder')}
                  className="form-input"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="form-label">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="form-input pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span />
                <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    {t('common.loading')}
                  </span>
                ) : t('auth.loginButton')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                {t('auth.registerNow')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
