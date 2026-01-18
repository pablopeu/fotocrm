import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Importar traducciones
import esCommon from './locales/es/common.json'
import esApp from './locales/es/app.json'
import esAdmin from './locales/es/admin.json'
import esComponents from './locales/es/components.json'

import enCommon from './locales/en/common.json'
import enApp from './locales/en/app.json'
import enAdmin from './locales/en/admin.json'
import enComponents from './locales/en/components.json'

// Obtener idioma guardado o usar español por defecto
const savedLanguage = localStorage.getItem('language') || 'es'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: esCommon,
        app: esApp,
        admin: esAdmin,
        components: esComponents
      },
      en: {
        common: enCommon,
        app: enApp,
        admin: enAdmin,
        components: enComponents
      }
    },
    lng: savedLanguage,
    fallbackLng: 'es',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false // React ya escapa por defecto
    }
  })

// Guardar idioma cuando cambie
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng)
  // Actualizar el atributo lang del HTML
  document.documentElement.lang = lng
})

export default i18n
