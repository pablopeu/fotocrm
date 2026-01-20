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

export default function LanguageSwitcher({ enabledLanguages = { es: true, en: true } }) {
  const { i18n } = useTranslation()

  const currentLang = i18n.language || 'es'
  const otherLang = currentLang === 'es' ? 'en' : 'es'

  // Contar idiomas habilitados
  const enabledCount = (enabledLanguages.es ? 1 : 0) + (enabledLanguages.en ? 1 : 0)

  // Si solo hay un idioma habilitado, no mostrar el switcher
  if (enabledCount <= 1) {
    return null
  }

  // Si el idioma actual no está habilitado, cambiar al que esté habilitado
  if (!enabledLanguages[currentLang]) {
    const availableLang = enabledLanguages.es ? 'es' : 'en'
    if (currentLang !== availableLang) {
      i18n.changeLanguage(availableLang)
    }
  }

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
