import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation('components')

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => changeLanguage('es')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          i18n.language === 'es'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        aria-label={t('languageSwitcher.spanish')}
      >
        ES
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          i18n.language === 'en'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        aria-label={t('languageSwitcher.english')}
      >
        EN
      </button>
    </div>
  )
}
