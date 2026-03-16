import { useTranslation } from 'react-i18next'
import { GlobeAltIcon } from '@heroicons/react/24/outline'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const isHindi = i18n.language === 'hi'

  const toggle = () => {
    const newLang = isHindi ? 'en' : 'hi'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      title="Toggle Language"
    >
      <GlobeAltIcon className="h-4 w-4 text-blue-600" />
      <span>{isHindi ? 'EN' : 'हिं'}</span>
    </button>
  )
}
