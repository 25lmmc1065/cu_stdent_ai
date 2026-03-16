import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import LanguageToggle from '../common/LanguageToggle'

const PROGRAMS = ['btech', 'mtech', 'bca', 'mca', 'bba', 'mba', 'bsc', 'msc', 'ba', 'ma', 'phd']
const DEPARTMENTS = [
  'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical',
  'MBA', 'Law', 'Pharmacy', 'Architecture', 'Agriculture', 'Other'
]

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    enrollmentNumber: '', program: '', semester: '', department: '', phone: '',
    termsAccepted: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const validate = () => {
    if (!form.name || !form.email || !form.password || !form.enrollmentNumber) {
      toast.error(t('common.required'))
      return false
    }
    if (form.password !== form.confirmPassword) {
      toast.error(t('common.passwordMismatch'))
      return false
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return false
    }
    if (!form.termsAccepted) {
      toast.error('Please accept the Terms of Service')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        enrollmentNumber: form.enrollmentNumber,
        program: form.program,
        semester: parseInt(form.semester),
        department: form.department,
        phone: form.phone,
        role: 'student',
      })
      toast.success('Account created! Please login.')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.message || t('common.serverError')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="gradient-header rounded-2xl p-6 text-white text-center mb-6 shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold">CU Student AI</h1>
                <p className="text-blue-100 text-xs">Chandigarh University</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{t('auth.registerTitle')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('auth.registerSubtitle')}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="form-label">{t('auth.fullName')} *</label>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder={t('auth.namePlaceholder')} className="form-input" required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="form-label">{t('auth.email')} *</label>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder={t('auth.emailPlaceholder')} className="form-input" required
                  />
                </div>

                {/* Enrollment Number */}
                <div>
                  <label className="form-label">{t('auth.enrollmentNumber')} *</label>
                  <input
                    type="text" name="enrollmentNumber" value={form.enrollmentNumber}
                    onChange={handleChange} placeholder={t('auth.enrollmentPlaceholder')}
                    className="form-input" required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="form-label">{t('auth.password')} *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} name="password"
                      value={form.password} onChange={handleChange}
                      placeholder={t('auth.passwordPlaceholder')} className="form-input pr-10" required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="form-label">{t('auth.confirmPassword')} *</label>
                  <input
                    type="password" name="confirmPassword" value={form.confirmPassword}
                    onChange={handleChange} placeholder="Re-enter password"
                    className="form-input" required
                  />
                </div>

                {/* Program */}
                <div>
                  <label className="form-label">{t('auth.program')}</label>
                  <select name="program" value={form.program} onChange={handleChange} className="form-select">
                    <option value="">Select Program</option>
                    {PROGRAMS.map((p) => (
                      <option key={p} value={p}>{t(`programs.${p}`)}</option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="form-label">{t('auth.semester')}</label>
                  <select name="semester" value={form.semester} onChange={handleChange} className="form-select">
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="form-label">{t('auth.department')}</label>
                  <select name="department" value={form.department} onChange={handleChange} className="form-select">
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="form-label">{t('auth.phone')}</label>
                  <input
                    type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder={t('auth.phonePlaceholder')} className="form-input"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox" id="terms" name="termsAccepted"
                  checked={form.termsAccepted} onChange={handleChange}
                  className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                  {t('auth.termsAccept')}
                </label>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    {t('common.loading')}
                  </span>
                ) : t('auth.registerButton')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                {t('auth.loginHere')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
