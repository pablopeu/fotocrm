import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const flags = {
  es: {
    name: 'Español',
    emoji: '🇦🇷',
    ariaLabel: 'Cambiar a Español'
  },
  en: {
    name: 'English',
    emoji: '🇺🇸',
    ariaLabel: 'Switch to English'
  }
}

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLang = i18n.language || 'es'
  const otherLang = currentLang === 'es' ? 'en' : 'es'

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Bandera actual - siempre visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        aria-label={`Idioma actual: ${flags[currentLang].name}. Click para cambiar`}
      >
        <span className="text-2xl leading-none">{flags[currentLang].emoji}</span>
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Bandera alternativa - aparece debajo al expandir */}
      {isOpen && (
        <button
          onClick={() => changeLanguage(otherLang)}
          className="absolute top-full mt-1 left-0 w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-lg z-50"
          aria-label={flags[otherLang].ariaLabel}
        >
          <span className="text-2xl leading-none">{flags[otherLang].emoji}</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">{flags[otherLang].name}</span>
        </button>
      )}
    </div>
  )
}
