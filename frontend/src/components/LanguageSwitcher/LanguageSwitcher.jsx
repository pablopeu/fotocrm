import { useTranslation } from 'react-i18next'

const flags = {
  es: {
    name: 'Español',
    flagUrl: 'https://flagcdn.com/28x21/ar.png',
    alt: 'Argentina',
    ariaLabel: 'Cambiar a English'
  },
  en: {
    name: 'English',
    flagUrl: 'https://flagcdn.com/28x21/us.png',
    alt: 'USA',
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
      className="p-1 hover:opacity-80 transition-opacity"
      aria-label={flags[currentLang].ariaLabel}
      title={flags[currentLang].ariaLabel}
    >
      <img
        src={flags[currentLang].flagUrl}
        alt={flags[currentLang].alt}
        width="28"
        height="21"
        className="block"
      />
    </button>
  )
}
