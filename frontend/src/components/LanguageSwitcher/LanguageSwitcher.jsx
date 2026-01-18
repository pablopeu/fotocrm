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

  const currentLang = i18n.language || 'es'
  const otherLang = currentLang === 'es' ? 'en' : 'es'

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Bandera actual - activa */}
      <button
        onClick={() => changeLanguage(currentLang)}
        className="text-3xl leading-none opacity-100 cursor-default"
        aria-label={`Idioma actual: ${flags[currentLang].name}`}
        disabled
      >
        {flags[currentLang].emoji}
      </button>

      {/* Bandera alternativa - clickeable */}
      <button
        onClick={() => changeLanguage(otherLang)}
        className="text-3xl leading-none opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
        aria-label={flags[otherLang].ariaLabel}
      >
        {flags[otherLang].emoji}
      </button>
    </div>
  )
}
