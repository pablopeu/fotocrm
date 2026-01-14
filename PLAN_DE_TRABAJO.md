# Plan de Trabajo - FotoCRM

## Resumen del Proyecto
Web app para un artesano de cuchillos que permite buscar rápidamente imágenes del catálogo y copiarlas al portapapeles junto con textos asociados para responder cotizaciones.

---

## Fase 1: Setup y Configuración Base

### 1.1 Inicialización del Proyecto
- [ ] Inicializar repositorio Git local
- [ ] Crear estructura de carpetas del proyecto:
  ```
  fotocrm/
  ├── frontend/          # React SPA
  ├── backend/           # Node.js/Express API
  ├── data/              # JSON files (categories, photos)
  └── uploads/           # Fotos subidas
  ```
- [ ] Inicializar package.json para frontend (React + Vite)
- [ ] Inicializar package.json para backend (Express)
- [ ] Configurar Tailwind CSS con purge para CSS optimizado
- [ ] Crear archivos de configuración:
  - `tailwind.config.js`
  - `postcss.config.js`
  - `.gitignore`

### 1.2 Estructura de Datos JSON
- [ ] Crear `data/categories.json` con estructura inicial:
  ```json
  {
    "categories": [
      {"id": 1, "name": "Cocina", "children": [...]},
      {"id": 2, "name": "Asado", "children": [...]},
      {"id": 3, "name": "Japonés", "children": [...]},
      {"id": 4, "name": "Otros", "children": [...]},
      {"id": 5, "name": "Encabados", "children": [...]}
    ]
  }
  ```
- [ ] Crear `data/photos.json` con estructura inicial:
  ```json
  {
    "photos": [
      {"id": 1, "cat_id": 1, "subcat_id": 1, "steel_type": "inoxidable", "url": "/uploads/foto1.jpg", "text": "Descripción"}
    ]
  }
  ```

---

## Fase 2: Backend - API REST

### 2.1 Configuración del Servidor
- [ ] Crear `server.js` con Express
- [ ] Configurar CORS para comunicación con frontend
- [ ] Configurar `helmet` para headers de seguridad
- [ ] Configurar `express-rate-limit` para rate limiting
- [ ] Crear middleware de manejo de errores

### 2.2 Endpoints de Categorías
- [ ] `GET /api/categories` - Retornar árbol de categorías
- [ ] `POST /api/categories` - Crear categoría (admin)
- [ ] `PUT /api/categories/:id` - Actualizar categoría (admin)
- [ ] `DELETE /api/categories/:id` - Eliminar categoría (admin)

### 2.3 Endpoints de Fotos
- [ ] `GET /api/photos` - Listar todas las fotos con metadatos
- [ ] `GET /api/photos/:id` - Obtener foto específica
- [ ] `POST /api/upload` - Subir foto(s) con metadatos
  - Configurar `multer` para uploads
  - Validación: max 5MB, solo jpg/png
  - Renombrado con UUID
- [ ] `PUT /api/photos/:id` - Actualizar texto/metadatos
- [ ] `DELETE /api/photos/:id` - Eliminar foto

### 2.4 Endpoint de Búsqueda
- [ ] `GET /api/search?query=texto&steel=tipo` - Búsqueda con filtros
- [ ] Implementar sanitización de query con `validator.escape`

### 2.5 Autenticación
- [ ] Implementar Basic Auth con `express-basic-auth`
- [ ] Proteger rutas `/admin/*` y endpoints de escritura
- [ ] Credenciales en variables de entorno (.env)

### 2.6 Seguridad
- [ ] Sanitización de inputs con `xss` y `validator`
- [ ] Validación de uploads (tipo, tamaño)
- [ ] Proteger archivos JSON fuera de public
- [ ] Configurar permisos de archivos (644/755)

---

## Fase 3: Frontend - React SPA

### 3.1 Setup React + Tailwind
- [ ] Crear proyecto con Vite + React
- [ ] Integrar Tailwind CSS
- [ ] Configurar estructura de componentes:
  ```
  src/
  ├── components/
  │   ├── TreeView/
  │   ├── PhotoGrid/
  │   ├── PhotoModal/
  │   ├── SearchBar/
  │   └── CopyButton/
  ├── pages/
  │   ├── Home.jsx
  │   └── Admin.jsx
  ├── hooks/
  ├── services/
  └── App.jsx
  ```

### 3.2 Componente TreeView (Árbol de Categorías)
- [ ] Crear componente expandible/colapsable
- [ ] Renderizar categorías jerárquicamente:
  - Categorías principales
  - Subcategorías
  - Tipos de acero
- [ ] Manejar estado de nodos expandidos
- [ ] Keyboard navigation para accesibilidad

### 3.3 Componente PhotoGrid
- [ ] Grid responsive de fotos filtradas
- [ ] Preview de imagen en miniatura
- [ ] Mostrar texto asociado
- [ ] Checkboxes para selección múltiple
- [ ] Botones de copia individual

### 3.4 Funcionalidad de Copia al Portapapeles
- [ ] Implementar copia de imagen usando Clipboard API
- [ ] Fallback para navegadores antiguos
- [ ] Copia de texto asociado
- [ ] Copia múltiple (varias imágenes/textos)
- [ ] Feedback visual post-copia

### 3.5 Modal de Vista de Foto
- [ ] Imagen zoomable
- [ ] Texto y descripción
- [ ] Botón de copia combinada
- [ ] Cerrar con ESC o click fuera

### 3.6 Barra de Búsqueda
- [ ] Input de búsqueda textual
- [ ] Filtros por tipo de acero (dropdown)
- [ ] Debounce para evitar llamadas excesivas
- [ ] Sanitización client-side con DOMPurify

### 3.7 Servicios y API
- [ ] Crear `api.js` con funciones para endpoints
- [ ] Manejar estados de carga y errores
- [ ] Implementar polling simple para detectar cambios

### 3.8 Estilos y UX
- [ ] Layout: Sidebar izquierda + Grid central
- [ ] Responsive mobile-first
- [ ] Tooltips en botones
- [ ] Dark mode opcional
- [ ] Feedback visual (loading, éxito, error)

---

## Fase 4: Panel de Administración

### 4.1 Ruta /admin
- [ ] Crear página Admin protegida
- [ ] Implementar login con Basic Auth
- [ ] Tabs: Categorías | Fotos | Configuración

### 4.2 Gestión de Categorías
- [ ] Formulario para crear categoría/subcategoría
- [ ] Lista editable de categorías existentes
- [ ] Botón eliminar con confirmación (modal)
- [ ] Validación de formularios

### 4.3 Gestión de Fotos
- [ ] Área de Drag & Drop para upload
- [ ] Selector de archivos múltiples
- [ ] Asignar categoría/subcategoría/acero via dropdowns
- [ ] Campo de texto asociado (textarea)
- [ ] Preview antes de subir
- [ ] Barra de progreso de upload
- [ ] Lista de fotos existentes con edición inline

### 4.4 Edición de Fotos Existentes
- [ ] Cambiar texto/descripción
- [ ] Cambiar categoría
- [ ] Eliminar con confirmación
- [ ] Cambios reflejados inmediatamente

---

## Fase 5: Testing

### 5.1 Tests Unitarios (Jest)
- [ ] Tests para funciones de sanitización
- [ ] Tests para helpers de copia al portapapeles
- [ ] Tests para parsing de JSON

### 5.2 Tests Funcionales
- [ ] Navegación del árbol de categorías
- [ ] Filtrado por acero/búsqueda
- [ ] Copia individual y múltiple
- [ ] Upload de fotos
- [ ] Edición de metadatos

### 5.3 Tests de Seguridad
- [ ] Input malicioso (XSS) sanitizado
- [ ] Acceso sin auth denegado
- [ ] Upload de archivos inválidos rechazado

### 5.4 Tests de Rendimiento
- [ ] Carga con 200 fotos simuladas < 2s
- [ ] Verificar CSS purged de Tailwind

---

## Fase 6: Deployment

### 6.1 Preparación
- [ ] Build de producción del frontend
- [ ] Verificar variables de entorno para producción
- [ ] Crear `.htaccess` para proteger directorios

### 6.2 GitHub Actions
- [ ] Crear workflow `.github/workflows/deploy.yml`
- [ ] Configurar secrets: FTP_HOST, FTP_USER, FTP_PASS
- [ ] Steps:
  1. Checkout
  2. Install dependencies
  3. Build frontend
  4. Upload via FTP a cPanel

### 6.3 Configuración cPanel
- [ ] Configurar HTTPS con Let's Encrypt
- [ ] Verificar permisos de archivos
- [ ] Configurar Node.js app (si disponible) o PHP alternativo
- [ ] IP Whitelisting opcional

### 6.4 Post-Deploy
- [ ] Verificar funcionamiento en producción
- [ ] Probar todas las funcionalidades
- [ ] Documentar proceso de backup de JSON

---

## Checklist de Requisitos No Funcionales

- [ ] Carga de página < 2 segundos
- [ ] Responsive en móvil y desktop
- [ ] Alt text en todas las imágenes
- [ ] Keyboard navigation funcional
- [ ] Mensajes de error amigables
- [ ] HTTPS habilitado
- [ ] Rate limiting activo
- [ ] Headers de seguridad configurados

---

## Extensiones Futuras (Post-MVP)

- Migración a MySQL si >500 fotos
- PWA para uso offline en móvil
- Exportar catálogo a PDF
- Búsqueda fuzzy
- Backups automáticos via cron

---

## Stack Tecnológico Final

| Componente | Tecnología |
|------------|------------|
| Frontend | React + Vite |
| Estilos | Tailwind CSS |
| Backend | Node.js + Express |
| Datos | JSON files |
| Auth | Basic Auth |
| Deploy | GitHub Actions + FTP |
| Hosting | cPanel |

---

*Documento generado: 2026-01-14*
