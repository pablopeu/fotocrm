# Changelog

## [2.0.0] - 2026-01-19

### ✨ Características Principales

#### Sistema Bilingüe Completo (ES/EN)
- **Frontend**: i18next con soporte completo español/inglés
- **Backend**: Sistema de traducciones PHP con archivos JSON
- **Admin**: Interfaz de edición bilingüe para todos los textos configurables
- **Cambio de idioma**: En tiempo real sin recargar página
- **Persistencia**: El idioma seleccionado se guarda en localStorage

#### Textos Configurables Bilingües
Todos los siguientes textos son editables desde el admin en ambos idiomas:
- Título del sitio y subtítulos (móvil y desktop)
- Mensaje del configurador
- Mensajes de WhatsApp y Telegram
- Textos del footer (enlace web y redes sociales)
- Nombres de grupos de tags
- Nombres de tags individuales

#### Sistema de Tags Dinámico
- Tags cargados desde backend (no hardcodeados)
- Nombres multilingües para todos los tags
- Los tabs principales se construyen dinámicamente desde el grupo "tipo"
- Soporte completo para edición de tags desde admin

#### Mejoras de Interfaz
- **Buscador colapsable** en desktop (se expande hacia la izquierda)
- **LanguageSwitcher** con banderas ES/EN
- **TreeView** con textos traducidos
- **Modal** reutilizable mejorado
- **Buckets** traducidos en página de subida

### 🔧 Mejoras Técnicas

#### Frontend
- Agregado i18next y react-i18next
- 4 namespaces de traducción: common, app, admin, components
- useMemo para optimización de re-renders
- Cache-busting en peticiones GET
- Separación de useEffect para detección de ?config= y carga de configuración

#### Backend
- Función `transformCategoriesForLanguage()` para transformar {es, en} → string
- Función `transformConfigField()` para campos de configuración
- Headers anti-caché en endpoint /tags
- Parámetro `lang` en GET /config
- Endpoints admin devuelven datos multilingües completos

#### API
- GET /config?lang=es|en (transformado según idioma)
- GET /tags?lang=es|en (transformado según idioma)
- GET /admin/config/* (datos multilingües sin transformar para edición)
- PUT /admin/tags y PUT /admin/tag-groups (soporte bilingüe)

### 📦 Release

#### Archivos incluidos
- **fotocrm-v2.0.0.zip** (137 KB) - Listo para descomprimir en hosting
- **fotocrm-v2.0.0.tar.gz** (135 KB) - Alternativa comprimida

#### Estructura del Release
```
/
├── index.html          # Frontend público
├── admin.html          # Panel de administración
├── assets/             # CSS y JS compilados
├── api/                # Backend PHP con locales
├── data/               # Datos iniciales + .htaccess
├── uploads/            # Carpeta para imágenes
├── backups/            # Carpeta para backups + .htaccess
└── README.md           # Documentación completa
```

#### Datos de Ejemplo Incluidos

**Login default:**
- Usuario: `admin`
- Contraseña: `admin123` (hash bcrypt)

**Tags precargados:**
- **Tipo**: Cocina, Asado, Japonés, Outdoor, Camping, Caza
- **Encabado**: Lapacho, Micarta, Resina, Ébano, Olivo, Guayacán, Quebracho
- **Acero**: Inoxidable, Carbono, Damasco Inoxidable, Damasco Carbono
- **Estilo**: Moderno, Clásico, Rústico

### 🐛 Correcciones

- Fix: Error "t is not defined" en TIPO_TABS (useMemo)
- Fix: Error "t is not defined" en tabs de Admin (useMemo)
- Fix: Error #310 de React (useMemo condicional)
- Fix: Falta useTranslation en componente UploadPhotos
- Fix: Buckets no traducidos
- Fix: Área de upload sin traducciones

### 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Archivos .htaccess en /data y /backups
- Validación de idiomas en backend (solo 'es' o 'en')
- Sin archivos de configuración expuestos

### 📝 Documentación

- README.md completo con instrucciones de instalación
- Documentación de estructura de carpetas
- Requisitos del servidor especificados
- Lista de características multilingües
- Guía de seguridad básica

### ⚠️ Breaking Changes

- Estructura de config.json cambió a formato bilingüe
- categories.json ahora usa {es, en} para nombres
- API /config ahora requiere parámetro ?lang=
- Frontend ahora requiere build (no sirve código fuente directamente)

### 🔄 Migración desde v1.x

Si tienes datos de una versión anterior:
1. Hacer backup de /data
2. Convertir textos simples a objetos {es: "texto", en: "text"}
3. Actualizar config.json con nueva estructura
4. Ejecutar desde admin: Configuración > Tags > Guardar (para actualizar formato)

---

## [1.x] - Versiones anteriores

Ver commits anteriores a `30a0812` para historial de versiones 1.x

---

**Instalación**: Descomprimir `fotocrm-v2.0.0.zip` en raíz del hosting
**Soporte**: https://github.com/pablopeu/fotocrm/issues
**Licencia**: MIT
