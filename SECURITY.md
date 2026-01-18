# Seguridad del Sistema FotoCRM

Este documento describe las medidas de seguridad implementadas en el sistema.

## Protección de Datos Sensibles

### 1. Carpetas Protegidas con .htaccess

Las siguientes carpetas están protegidas contra acceso directo vía web:

- **`/data/`** - Contiene archivos de configuración (config.json, categories.json, photos.json)
  - ❌ Antes: Accesible vía `https://tudominio.com/data/config.json`
  - ✅ Ahora: HTTP 403 Forbidden

- **`/backups/`** - Contiene backups del sistema
  - ❌ Antes: Descargables vía URL directa
  - ✅ Ahora: HTTP 403 Forbidden

**Archivos de protección:**
- `data/.htaccess` - Bloquea acceso a todos los archivos JSON
- `backups/.htaccess` - Bloquea descarga directa de backups

### 2. Hashing de Contraseñas

Las contraseñas del administrador ya NO se almacenan en texto plano.

#### Sistema Actual (Seguro)

- **Almacenamiento**: Contraseñas hasheadas con bcrypt (PHP `password_hash()`)
- **Verificación**: PHP `password_verify()`
- **Costo**: Algoritmo bcrypt con costo 10 (por defecto)
- **Formato**: `$2y$10$...` (60 caracteres)

#### Migración Automática

El sistema detecta automáticamente contraseñas en texto plano y las migra:

1. Usuario inicia sesión con contraseña plaintext (legacy)
2. Sistema verifica credenciales
3. Si la contraseña actual es plaintext, se convierte automáticamente a hash
4. Próximo login ya usa el hash

**No se requiere acción manual** - La migración es transparente.

#### Cambio de Contraseña

Al cambiar la contraseña desde el panel admin:
- La nueva contraseña se hashea automáticamente con bcrypt
- Nunca se almacena en texto plano

## Mejores Prácticas

### Para Instalaciones Nuevas

1. **Cambiar credenciales por defecto** inmediatamente después de instalar
2. **Usar contraseñas fuertes** (mínimo 12 caracteres, mezcla de letras, números y símbolos)
3. **Verificar permisos**:
   ```bash
   chmod 755 data/
   chmod 644 data/.htaccess
   chmod 755 backups/
   chmod 644 backups/.htaccess
   ```

### Para Instalaciones Existentes

Si ya tienes el sistema instalado:

1. ✅ La migración de contraseñas es automática (al próximo login)
2. ✅ Los archivos `.htaccess` se desplegarán automáticamente
3. ⚠️ **IMPORTANTE**: Verifica que tu hosting soporte archivos `.htaccess`
   - La mayoría de hostings cPanel lo soportan
   - Si usas Nginx, necesitarás configuración equivalente

## Verificación de Seguridad

### 1. Verificar Protección de Carpetas

Intenta acceder a estas URLs (deberías recibir 403 Forbidden):
- `https://tudominio.com/data/config.json`
- `https://tudominio.com/data/categories.json`
- `https://tudominio.com/backups/`

### 2. Verificar Hashing de Contraseñas

Revisa tu archivo `data/config.json`:

```json
{
  "user": "admin",
  "pass": "$2y$10$abcdefghijklmnopqrstuvwxyz..." // ✅ Hash (seguro)
}
```

**NO debe verse así:**
```json
{
  "user": "admin",
  "pass": "admin123" // ❌ Plaintext (inseguro)
}
```

## Configuración para Nginx (Opcional)

Si tu hosting usa Nginx en lugar de Apache, agrega esto a tu configuración:

```nginx
# Bloquear acceso a /data/
location /data/ {
    deny all;
    return 403;
}

# Bloquear acceso a /backups/
location /backups/ {
    deny all;
    return 403;
}
```

## Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor:

1. **NO la publiques públicamente**
2. Crea un issue privado en GitHub o contacta al mantenedor
3. Proporciona detalles sobre la vulnerabilidad y pasos para reproducirla

## Historial de Cambios

- **v1.1.0** (2026-01-18): Implementación de hashing de contraseñas + protección de carpetas sensibles
- **v1.0.0**: Lanzamiento inicial (contraseñas en plaintext)
