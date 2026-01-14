# Instrucciones del Proyecto FotoCRM

## Git y Deploy Automático 

- **Después de cada prompt**: Hacer commit y push a GitHub automáticamente
- **No requiere permiso**: Subir directamente sin preguntar al usuario
- **Cualquier branch**: Push desde cualquier branch, no solo main
- **Deploy automático**: GitHub Actions sube via FTP al hosting después de cada push

## Entorno de Desarrollo y Testing

- **Desarrollo**: Local en Debian CLI (sin entorno gráfico)
- **Testing**: SIEMPRE en el hosting remoto, NUNCA localmente
- **Flujo de trabajo**: Programar local → Deploy via FTP/GitHub Actions → Probar en hosting
- No configurar ni usar servidores de desarrollo locales para testing
- Los cambios se verifican directamente en producción/staging del hosting

## Acceso al Hosting

- **Métodos disponibles**: Solo FTP y cPanel básico
- **NO disponible**: SSH, command line, terminal remota
- El backend debe ser compatible con cPanel sin acceso SSH:
  - Preferir PHP si Node.js no es viable en el hosting
  - Usar archivos JSON para datos (no requiere configurar BD)
- GitHub Actions se encarga del deploy automático via FTP

## UI/UX - Modales en lugar de Alertas

- **PROHIBIDO**: `alert()`, `confirm()`, `prompt()`, alertbox, messagebox o cualquier diálogo nativo del navegador
- **OBLIGATORIO**: Usar un componente Modal reutilizable para:
  - Confirmaciones (ej: "¿Eliminar este ítem?")
  - Mensajes de éxito/error
  - Formularios modales
  - Cualquier interacción que requiera feedback al usuario

### Estructura del Modal Reutilizable

```jsx
// Crear componente Modal.jsx con:
// - Prop: isOpen (boolean)
// - Prop: onClose (function)
// - Prop: title (string)
// - Prop: children (content)
// - Prop: type ('info' | 'confirm' | 'error' | 'success')
// - Prop: onConfirm (function, opcional para confirmaciones)
// - Cerrar con ESC o click en overlay
// - Accesible (focus trap, aria-labels)
```

### Ejemplos de Uso

```jsx
// En lugar de: if(confirm("¿Eliminar?")) { ... }
// Usar:
<Modal
  isOpen={showDeleteConfirm}
  type="confirm"
  title="Confirmar eliminación"
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={handleDelete}
>
  ¿Estás seguro de eliminar este ítem?
</Modal>

// En lugar de: alert("Guardado exitosamente")
// Usar:
<Modal
  isOpen={showSuccess}
  type="success"
  title="Éxito"
  onClose={() => setShowSuccess(false)}
>
  Los cambios se guardaron correctamente.
</Modal>
```

## Stack Técnico

- **Frontend**: React + Vite + Tailwind CSS (build estático)
- **Backend**: Node.js/Express (o PHP como alternativa)
- **Datos**: Archivos JSON (categories.json, photos.json)
- **Deploy**: GitHub Actions → FTP → cPanel

## Consideraciones Adicionales

- Todo el CSS debe ser generado estáticamente por Tailwind (purged)
- Las imágenes se sirven desde /uploads en el hosting
- Los archivos JSON de datos deben estar fuera del directorio público
- Implementar Basic Auth para el panel admin
