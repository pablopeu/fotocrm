import { useTranslation } from 'react-i18next'

const flags = {
  es: {
    name: 'Español',
    emoji: '🇦🇷',
    text: 'ES',
    ariaLabel: 'Cambiar a English'
  },
  en: {
    name: 'English',
    emoji: '🇺🇸',
    text: 'EN',
    ariaLabel: 'Cambiar a Español'
  }
}

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const currentLang = i18n.language || 'es'
  const otherLang = currentLang === 'es' ? 'en' : 'es'

  const toggleLanguage = () => {
    i18n.changeLanguage(otherLang)
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center min-w-[40px] h-10 px-3 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors shadow-sm font-semibold text-gray-700 dark:text-gray-300"
      aria-label={flags[currentLang].ariaLabel}
      title={flags[currentLang].ariaLabel}
    >
      <span className="text-sm">{flags[currentLang].text}</span>
    </button>
  )
}
