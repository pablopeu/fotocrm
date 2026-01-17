# FotoCRM - Sistema de Catálogo y Configurador de Cuchillos Artesanales

Sistema web completo para gestionar un catálogo de cuchillos artesanales con sistema de configuración interactivo y compartición de diseños personalizados.

## Características Principales

### Catálogo Frontend
- 📸 Visualización de fotos con zoom interactivo (Ctrl + Scroll)
- 🏷️ Sistema de tags por categorías (Tipo, Encabado, Acero, Extras)
- 🔍 Búsqueda en tiempo real con normalización de texto (sin acentos)
- 🎨 Filtros interactivos por múltiples categorías
- 📱 Diseño responsive (Mobile + Desktop)
- 📋 Copiar imagen al portapapeles con un click
- 🌙 Soporte para modo oscuro

### Sistema de Configurador
- 🗂️ **5 Buckets** independientes (Cuchillo 1-5) con selección de hasta 6 fotos cada uno
- ⚙️ Configuración detallada por foto:
  - Checkboxes: Forma, Acero, Encabado, Detalle 1, 2, 3
  - Campo de comentarios libre
- 💾 Persistencia en cookies (365 días)
- 🔗 Generación de links compartibles con código único (8 caracteres alfanuméricos)
- 📤 Compartir por WhatsApp y Telegram con mensaje personalizable
- 🔄 Carga completa de configuraciones desde URL

### Panel de Administración
- 👤 Sistema de autenticación con credenciales personalizables
- 📂 Gestión completa de fotos (subir, editar, eliminar)
- 🏷️ Sistema de tags jerárquico por grupos
- 🎨 Configuración de logo del sitio
- 💬 Configuración de botones flotantes (WhatsApp/Telegram)
- 🔖 Inyección de metadatos HTML para SEO
- 💾 Sistema de backups (hasta 5, con restauración)
- ✉️ Mensaje personalizable para compartir configuraciones

## Stack Tecnológico

### Frontend
- **React 18** + Vite
- **Tailwind CSS** para estilos
- **JavaScript ES6+**
- Componentes funcionales con Hooks

### Backend
- **PHP 8.1+** (sin frameworks)
- Almacenamiento en **JSON** (sin base de datos)
- API RESTful

### Deployment
- **GitHub Actions** para CI/CD automático
- Deploy vía FTP a hosting cPanel
- Build automático del frontend en cada push

## Estructura del Proyecto

```
fotocrm/
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Admin.jsx
│   │   ├── services/      # api.js
│   │   └── App.jsx        # Componente principal + Configurador
│   ├── dist/              # Build de producción
│   └── package.json
│
├── api/
│   ├── index.php          # API backend completa
│   └── .htaccess          # Configuración PHP
│
├── data/                  # Datos JSON (excluido del deploy)
│   ├── categories.json    # Grupos de tags
│   ├── photos.json        # Metadata de fotos
│   ├── config.json        # Configuración del sistema
│   └── configurador/      # Configuraciones guardadas
│
├── uploads/               # Imágenes (excluido del deploy)
├── backups/               # Backups del sistema
├── .github/
│   └── workflows/
│       └── deploy.yml     # CI/CD automático
│
└── README.md
```

## Instalación

### Requisitos Previos
- Node.js 20+
- PHP 8.1+
- Hosting con soporte PHP y FTP (cPanel compatible)
- Git

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/fotocrm.git
cd fotocrm
```

### 2. Instalar Dependencias del Frontend

```bash
cd frontend
npm install
```

### 3. Configuración del Backend

Editar `api/.htaccess` según tu versión de PHP:

```apache
# Ajustar límites según necesidades
php_value upload_max_filesize 10M
php_value post_max_size 100M
php_value max_file_uploads 100
php_value memory_limit 128M
```

### 4. Crear Directorios Necesarios

```bash
mkdir -p data/configurador uploads backups
```

### 5. Configuración de Despliegue (Opcional)

Si usas GitHub Actions, configurar secretos en el repositorio:
- `FTP_HOST`: Servidor FTP
- `FTP_USER`: Usuario FTP
- `FTP_PASS`: Contraseña FTP
- `FTP_PATH`: Ruta en el servidor (ej: `/public_html/`)

## Desarrollo Local

### Frontend

```bash
cd frontend
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### Backend

Configurar un servidor PHP local o usar el servidor integrado:

```bash
php -S localhost:8000 -t .
```

Configurar variable de entorno en `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api/index.php
```

## Build de Producción

```bash
cd frontend
npm run build
```

Los archivos compilados estarán en `frontend/dist/`

## Uso del Sistema

### Acceso al Admin

1. Navegar a `/admin.html`
2. Credenciales por defecto:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. ⚠️ **Cambiar credenciales inmediatamente después del primer acceso**

### Gestión de Fotos

1. **Subir fotos**: Desde "Gestionar Fotos y Tags" → Subir múltiples archivos
2. **Asignar tags**: Seleccionar tags de cada grupo para categorizar
3. **Editar**: Click en foto para modificar tags
4. **Eliminar**: Botón de papelera en cada foto

### Gestión de Tags

1. **Crear grupo**: Definir grupos personalizados (ej: "Material", "Tamaño")
2. **Agregar tags**: Añadir opciones dentro de cada grupo
3. **Editar/Eliminar**: Modificar tags existentes (conserva referencias en fotos)

### Configuración del Sistema

#### Logo del Sitio
- Subir imagen (PNG, JPG, GIF)
- Se muestra en header del catálogo y configurador

#### Botones de Contacto
- **WhatsApp**: Número (sin +) y mensaje predeterminado
- **Telegram**: Usuario (sin @) y mensaje predeterminado
- Aparecen como botones flotantes en el catálogo

#### Metadatos HTML
Inyectar meta tags personalizados para SEO:
```html
<meta name="description" content="...">
<meta property="og:title" content="...">
<meta property="og:image" content="...">
```

#### Mensaje del Configurador
Personalizar el mensaje que se envía al compartir configuraciones.
Usar `{link}` donde se debe insertar el enlace:
```
Hola Pablo, te envío mi página del configurador de cuchillos: {link}
```

### Sistema de Backups

1. **Crear backup**: Genera snapshot de `categories.json` y `photos.json`
2. **Máximo 5 backups**: Eliminar uno existente antes de crear nuevos
3. **Restaurar**: Click en "Restaurar" para volver a un backup anterior
4. **Descargar**: Obtener archivo JSON local

## Sistema de Configurador

### Para Usuarios Finales

1. **Seleccionar fotos**: Click en fotos del catálogo (máximo 6 por bucket)
2. **Organizar en buckets**: Usar botones "Cuchillo 1-5" para diferentes diseños
3. **Abrir configurador**: Click en botón "Configurador" (verde)
4. **Configurar cada foto**:
   - Marcar checkboxes según características deseadas
   - Agregar comentarios específicos
5. **Guardar y compartir**:
   - Click en "Enviar configuración" (primera vez)
   - Se genera código único (ej: `AB12CD34`)
   - Aparecen botones de WhatsApp/Telegram por 5 segundos
   - El botón cambia a "Guardar configuración" para actualizaciones

### Para Administradores

Las configuraciones se guardan en `data/configurador/CODIGO.json`:

```json
{
  "code": "AB12CD34",
  "created_at": "2026-01-17 15:30:00",
  "updated_at": "2026-01-17 16:45:00",
  "buckets": [
    {
      "selectedPhotos": ["photo-123", "photo-456"],
      "photoConfigs": {
        "photo-123": {
          "forma": true,
          "acero": false,
          "encabado": true,
          "detalle1": false,
          "detalle2": true,
          "detalle3": false,
          "comentarios": "Con filo curvo"
        }
      }
    }
  ]
}
```

## API Endpoints

### Públicos
- `GET /photos` - Lista todas las fotos
- `GET /tags` - Obtiene grupos y tags
- `GET /config` - Configuración pública (logo, contacto)
- `GET /configurator/:code` - Carga configuración por código

### Admin (requieren autenticación)
- `POST /admin/verify` - Verificar credenciales
- `PUT /admin/password` - Cambiar contraseña
- `GET /admin/photos` - Lista fotos con metadata completa
- `POST /admin/photos` - Subir fotos
- `PUT /admin/photos/:id` - Actualizar tags de foto
- `DELETE /admin/photos/:id` - Eliminar foto
- `GET /admin/tags` - Gestión de tags
- `POST /admin/tags/group` - Crear grupo de tags
- `POST /admin/tags` - Crear tag
- `PUT /admin/tags/:id` - Editar tag
- `DELETE /admin/tags/:id` - Eliminar tag
- `GET /admin/backups` - Listar backups
- `POST /admin/backups` - Crear backup
- `DELETE /admin/backups/:filename` - Eliminar backup
- `POST /admin/restore` - Restaurar backup
- `POST /admin/config/logo` - Subir logo
- `DELETE /admin/config/logo` - Eliminar logo
- `POST /admin/config/contact` - Configurar WhatsApp/Telegram
- `POST /admin/config/metatags` - Configurar metadatos HTML
- `POST /admin/config/configurator` - Mensaje del configurador
- `POST /configurator/save` - Guardar configuración

## Seguridad

- ✅ Autenticación básica para admin
- ✅ Sanitización de inputs en backend
- ✅ Validación de tipos de archivo en uploads
- ✅ Headers CORS configurados
- ✅ Paths relativos (sin hardcoded)
- ⚠️ **Importante**: Cambiar credenciales por defecto
- ⚠️ **Importante**: Configurar permisos de directorios (755)
- ⚠️ **Importante**: Excluir `/data` y `/uploads` del control de versiones en producción

## Deployment Automático

El sistema usa GitHub Actions para deployment automático:

1. **Push a cualquier branch** → Ejecuta workflow
2. **Build del frontend** (React + Vite)
3. **Deploy vía FTP**:
   - Frontend compilado (`dist/`)
   - API PHP (`api/`)
   - **Excluye**: `data/`, `uploads/`, `node_modules/`
4. **Preserva datos del servidor** (no sobrescribe `data/` ni `uploads/`)

Ver configuración en `.github/workflows/deploy.yml`

## Troubleshooting

### Las fotos no se muestran
- Verificar permisos del directorio `uploads/` (755)
- Verificar que las rutas en `photos.json` sean relativas

### Error al subir fotos
- Revisar límites en `api/.htaccess`:
  - `upload_max_filesize`
  - `post_max_size`
  - `max_file_uploads`

### Los backups no se crean
- Verificar permisos del directorio `backups/` (755)
- Verificar límite de 5 backups

### El configurador no carga
- Verificar que existe `data/configurador/` (755)
- Verificar código en URL (8 caracteres alfanuméricos)

## Contribuir

1. Fork del proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'feat: descripción'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## Licencia

Este proyecto es de uso privado.

## Soporte

Para reportar bugs o solicitar features, abrir un issue en GitHub.

---

**Desarrollado con ❤️ usando React, PHP y Tailwind CSS**
