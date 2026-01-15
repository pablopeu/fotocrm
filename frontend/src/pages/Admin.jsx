import { useState, useEffect, useRef } from 'react'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'

const API_BASE = import.meta.env.VITE_API_URL || './api/index.php'

function apiUrl(route) {
  return `${API_BASE}?route=${route.replace(/^\//, '')}`
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [credentials, setCredentials] = useState({ user: '', pass: '' })
  const [activeTab, setActiveTab] = useState('upload')
  const [tagGroups, setTagGroups] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)

  const { isOpen, modalProps, closeModal, showSuccess, showError, showConfirm } = useModal()

  const getAuthParams = () => ({
    auth_user: credentials.user,
    auth_pass: credentials.pass
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const params = new URLSearchParams({
        auth_user: credentials.user,
        auth_pass: credentials.pass
      })
      const response = await fetch(apiUrl('admin/verify') + '&' + params.toString())
      if (response.ok) {
        setAuthenticated(true)
        loadData()
      } else {
        showError('Error', 'Credenciales inválidas')
      }
    } catch (error) {
      showError('Error', 'No se pudo conectar con el servidor')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [catRes, photoRes] = await Promise.all([
        fetch(apiUrl('tags')),
        fetch(apiUrl('photos'))
      ])
      const catData = await catRes.json()
      const photoData = await photoRes.json()
      setTagGroups(catData.tag_groups || [])
      setPhotos(photoData.photos || [])
    } catch (error) {
      showError('Error', 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            FotoCRM Admin
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuario</label>
              <input
                type="text"
                autoComplete="username"
                value={credentials.user}
                onChange={(e) => setCredentials({ ...credentials, user: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
              <input
                type="password"
                autoComplete="current-password"
                value={credentials.pass}
                onChange={(e) => setCredentials({ ...credentials, pass: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
              Iniciar sesión
            </button>
          </form>
          <a href="#/" className="block text-center mt-4 text-sm text-gray-500 dark:text-gray-400 hover:underline">
            Volver al catálogo
          </a>
        </div>
        <Modal isOpen={isOpen} onClose={closeModal} {...modalProps} />
      </div>
    )
  }

  const tabs = [
    { id: 'upload', label: 'Subir fotos' },
    { id: 'manage', label: 'Administrar fotos' },
    { id: 'tags', label: 'Tags' },
  ]

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col overflow-hidden">
      <header className="bg-white dark:bg-gray-800 shadow flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">FotoCRM Admin</h1>

          {/* Tabs en el header */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 font-medium text-sm rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a href="#/" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">Ver catálogo</a>
            <button onClick={() => setAuthenticated(false)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 h-full">
          {activeTab === 'upload' && (
            <UploadPhotos
              tagGroups={tagGroups}
              authParams={getAuthParams()}
              onRefresh={loadData}
              showSuccess={showSuccess}
              showError={showError}
            />
          )}
          {activeTab === 'manage' && (
            <ManagePhotos
              photos={photos}
              tagGroups={tagGroups}
              authParams={getAuthParams()}
              onRefresh={loadData}
              showSuccess={showSuccess}
              showError={showError}
              showConfirm={showConfirm}
            />
          )}
          {activeTab === 'tags' && (
            <TagsManager
              tagGroups={tagGroups}
              authParams={getAuthParams()}
              onRefresh={loadData}
              showSuccess={showSuccess}
              showError={showError}
              showConfirm={showConfirm}
            />
          )}
        </div>
      </main>

      <Modal isOpen={isOpen} onClose={closeModal} {...modalProps} />
    </div>
  )
}

// ==================
// Upload Photos - Nueva sección de subida
// ==================
function UploadPhotos({ tagGroups, authParams, onRefresh, showSuccess, showError }) {
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoTags, setPhotoTags] = useState({}) // { photoId: [tagIds] }
  const [photoTexts, setPhotoTexts] = useState({}) // { photoId: text }
  const [saving, setSaving] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false) // Para feedback visual verde
  const [arrowFeedback, setArrowFeedback] = useState(null) // 'prev' | 'next' | null

  const currentPhoto = uploadedPhotos[currentIndex]

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    for (const file of files) {
      formData.append('photos[]', file)
    }
    formData.append('tags', '')
    formData.append('text', '')
    formData.append('auth_user', authParams.auth_user)
    formData.append('auth_pass', authParams.auth_pass)

    try {
      const response = await fetch(apiUrl('admin/upload'), {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const newPhotos = data.photos || []
        setUploadedPhotos(prev => [...prev, ...newPhotos])
        // Inicializar tags y textos vacíos para las nuevas fotos
        const newTags = {}
        const newTexts = {}
        newPhotos.forEach(p => {
          newTags[p.id] = []
          newTexts[p.id] = ''
        })
        setPhotoTags(prev => ({ ...prev, ...newTags }))
        setPhotoTexts(prev => ({ ...prev, ...newTexts }))
        showSuccess('Éxito', `${newPhotos.length} foto(s) subida(s)`)
      } else if (response.status === 401) {
        showError('Sesión expirada', 'Por favor, vuelve a iniciar sesión')
      } else {
        const error = await response.json()
        showError('Error', error.error || 'Error al subir')
      }
    } catch (error) {
      showError('Error', 'Error de conexión')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  const handleTagToggle = (tagId) => {
    if (!currentPhoto) return
    setPhotoTags(prev => {
      const current = prev[currentPhoto.id] || []
      const newTags = current.includes(tagId)
        ? current.filter(t => t !== tagId)
        : [...current, tagId]
      return { ...prev, [currentPhoto.id]: newTags }
    })
  }

  const handleTextChange = (text) => {
    if (!currentPhoto) return
    setPhotoTexts(prev => ({ ...prev, [currentPhoto.id]: text }))
  }

  const handleCreateTag = async (groupId, tagName) => {
    try {
      const response = await fetch(apiUrl('admin/tags'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, name: tagName, ...authParams })
      })

      if (response.ok) {
        const newTag = await response.json()
        onRefresh()
        // Auto-seleccionar el nuevo tag
        if (currentPhoto) {
          setPhotoTags(prev => ({
            ...prev,
            [currentPhoto.id]: [...(prev[currentPhoto.id] || []), newTag.id]
          }))
        }
        return newTag
      } else if (response.status === 401) {
        showError('Sesión expirada', 'Por favor, vuelve a iniciar sesión')
      }
    } catch (error) {
      showError('Error', 'Error al crear tag')
    }
    return null
  }

  const handleSaveCurrentPhoto = async (showFeedback = true) => {
    if (!currentPhoto) return

    setSaving(true)
    try {
      const response = await fetch(apiUrl(`admin/photos/${currentPhoto.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: photoTexts[currentPhoto.id] || '',
          tags: photoTags[currentPhoto.id] || [],
          ...authParams
        })
      })

      if (response.ok && showFeedback) {
        // Feedback visual verde en el botón
        setSavedFeedback(true)
        setTimeout(() => setSavedFeedback(false), 1000)
      } else if (response.status === 401) {
        showError('Sesión expirada', 'Por favor, vuelve a iniciar sesión')
      }
    } catch (error) {
      showError('Error', 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const goToPrev = async () => {
    if (currentIndex > 0) {
      await handleSaveCurrentPhoto(false)
      // Feedback visual verde en flecha
      setArrowFeedback('prev')
      setTimeout(() => setArrowFeedback(null), 500)
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNext = async () => {
    if (currentIndex < uploadedPhotos.length - 1) {
      await handleSaveCurrentPhoto(false)
      // Feedback visual verde en flecha
      setArrowFeedback('next')
      setTimeout(() => setArrowFeedback(null), 500)
      setCurrentIndex(currentIndex + 1)
    }
  }

  const currentTags = currentPhoto ? (photoTags[currentPhoto.id] || []) : []
  const currentText = currentPhoto ? (photoTexts[currentPhoto.id] || '') : ''

  // Si no hay fotos subidas, mostrar área de drop
  if (uploadedPhotos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600 dark:text-gray-300">Subiendo fotos...</span>
            </div>
          ) : (
            <>
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-3">Arrastra las fotos aquí</p>
              <p className="text-sm text-gray-400 mb-4">o</p>
              <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                Seleccionar archivos
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </label>
            </>
          )}
        </div>
      </div>
    )
  }

  // Vista de edición de fotos
  return (
    <div className="h-full flex flex-col py-2 gap-3">
      {/* Área superior: foto con flechas + descripción */}
      <div className="flex gap-4 flex-shrink-0" style={{ height: '45%' }}>
        {/* Flecha izquierda */}
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className={`p-2 rounded-full transition-all duration-300 self-center ${
            arrowFeedback === 'prev'
              ? 'text-green-500 bg-green-100 dark:bg-green-900/30'
              : currentIndex === 0
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Foto - ancho automático según imagen */}
        <div className="h-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
          {currentPhoto && (
            <img
              src={currentPhoto.url}
              alt={currentText}
              className="h-full w-auto object-contain"
            />
          )}
        </div>

        {/* Flecha derecha */}
        <button
          onClick={goToNext}
          disabled={currentIndex === uploadedPhotos.length - 1}
          className={`p-2 rounded-full transition-all duration-300 self-center ${
            arrowFeedback === 'next'
              ? 'text-green-500 bg-green-100 dark:bg-green-900/30'
              : currentIndex === uploadedPhotos.length - 1
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Descripción y controles - ocupa el resto del espacio */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Foto {currentIndex + 1} de {uploadedPhotos.length}
            </span>
            <label className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              + Agregar fotos
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
          </div>
          <textarea
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Descripción de la foto..."
            rows={3}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
          <button
            onClick={() => handleSaveCurrentPhoto(true)}
            disabled={saving}
            className={`w-full px-4 py-2 rounded-lg transition-all duration-300 ${
              savedFeedback
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            {saving ? 'Guardando...' : savedFeedback ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Área inferior: 4 secciones de tags */}
      <div className="flex-1 grid grid-cols-4 gap-3 min-h-0">
        {tagGroups.map((group) => (
          <TagSection
            key={group.id}
            group={group}
            selectedTags={currentTags}
            onTagToggle={handleTagToggle}
            onCreateTag={(name) => handleCreateTag(group.id, name)}
          />
        ))}
      </div>
    </div>
  )
}

// ==================
// Tag Section - Sección individual de tags
// ==================
function TagSection({ group, selectedTags, onTagToggle, onCreateTag }) {
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  // Ordenar tags alfabéticamente
  const sortedTags = [...group.tags].sort((a, b) => a.name.localeCompare(b.name))

  // Filtrar por búsqueda
  const filteredTags = search
    ? sortedTags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : sortedTags

  // Verificar si el search es un tag nuevo
  const searchMatchesExisting = sortedTags.some(
    t => t.name.toLowerCase() === search.toLowerCase()
  )
  const canCreate = search.trim() && !searchMatchesExisting

  const handleCreate = async () => {
    if (!canCreate) return
    setCreating(true)
    await onCreateTag(search.trim())
    setSearch('')
    setCreating(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canCreate) {
      e.preventDefault()
      handleCreate()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header con nombre del grupo */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{group.name}</h3>
      </div>

      {/* Input de búsqueda/creación */}
      <div className="px-2 py-2 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div className="flex gap-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar o crear..."
            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {canCreate && (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {creating ? '...' : '+'}
            </button>
          )}
        </div>
      </div>

      {/* Lista de tags con scroll */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-wrap gap-1">
          {filteredTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => onTagToggle(tag.id)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500'
                }`}
              >
                {tag.name}
              </button>
            )
          })}
          {filteredTags.length === 0 && !canCreate && (
            <p className="text-xs text-gray-400 italic">Sin tags</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================
// Manage Photos - Administrar fotos existentes
// ==================
function ManagePhotos({ photos, tagGroups, authParams, onRefresh, showSuccess, showError, showConfirm }) {
  const [editingPhoto, setEditingPhoto] = useState(null)

  const handleDelete = (photo) => {
    showConfirm('Eliminar foto', '¿Eliminar esta foto permanentemente?', async () => {
      try {
        const params = new URLSearchParams(authParams)
        const response = await fetch(apiUrl(`admin/photos/${photo.id}`) + '&' + params.toString(), {
          method: 'DELETE'
        })
        if (response.ok) {
          showSuccess('Eliminado', 'Foto eliminada')
          onRefresh()
        } else if (response.status === 401) {
          showError('Sesión expirada', 'Por favor, vuelve a iniciar sesión')
        }
      } catch (error) {
        showError('Error', 'Error de conexión')
      }
    })
  }

  const handleUpdatePhoto = async () => {
    if (!editingPhoto) return

    try {
      const response = await fetch(apiUrl(`admin/photos/${editingPhoto.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editingPhoto.text,
          tags: editingPhoto.tags,
          ...authParams
        })
      })

      if (response.ok) {
        showSuccess('Actualizado', 'Foto actualizada')
        setEditingPhoto(null)
        onRefresh()
      } else if (response.status === 401) {
        showError('Sesión expirada', 'Por favor, vuelve a iniciar sesión')
      }
    } catch (error) {
      showError('Error', 'Error de conexión')
    }
  }

  const getTagName = (tagId) => {
    for (const group of tagGroups) {
      const tag = group.tags.find(t => t.id === tagId)
      if (tag) return tag.name
    }
    return tagId
  }

  return (
    <div className="h-full overflow-y-auto py-4">
      {photos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No hay fotos en el catálogo</p>
          <p className="text-sm mt-2">Usa la pestaña "Subir fotos" para agregar fotos</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <img src={photo.url} alt={photo.text} className="w-full h-40 object-cover" />
              <div className="p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate mb-2">
                  {photo.text || 'Sin descripción'}
                </p>
                <div className="flex flex-wrap gap-1 mb-3 min-h-[24px]">
                  {(photo.tags || []).slice(0, 4).map(tagId => (
                    <span key={tagId} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                      {getTagName(tagId)}
                    </span>
                  ))}
                  {(photo.tags || []).length > 4 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs rounded">
                      +{photo.tags.length - 4}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPhoto({ ...photo, tags: photo.tags || [] })}
                    className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(photo)}
                    className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingPhoto(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Editar foto</h3>

            <div className="flex gap-4 mb-4">
              <img src={editingPhoto.url} alt="" className="w-48 h-48 object-cover rounded" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea
                  value={editingPhoto.text || ''}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={5}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
              <div className="grid grid-cols-4 gap-3">
                {tagGroups.map(group => (
                  <div key={group.id} className="border border-gray-200 dark:border-gray-600 rounded p-2">
                    <p className="text-xs font-semibold text-gray-500 mb-2">{group.name}</p>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {group.tags.map(tag => {
                        const isSelected = editingPhoto.tags.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            onClick={() => {
                              const newTags = isSelected
                                ? editingPhoto.tags.filter(t => t !== tag.id)
                                : [...editingPhoto.tags, tag.id]
                              setEditingPhoto({ ...editingPhoto, tags: newTags })
                            }}
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {tag.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditingPhoto(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleUpdatePhoto} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================
// Tags Manager - Gestión de tags
// ==================
function TagsManager({ tagGroups, authParams, onRefresh, showSuccess, showError, showConfirm }) {
  const [newTagName, setNewTagName] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [editingGroup, setEditingGroup] = useState(null)

  const handleCreateTag = async (e) => {
    e.preventDefault()
    if (!newTagName.trim() || !selectedGroup) return

    try {
      const response = await fetch(apiUrl('admin/tags'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: selectedGroup, name: newTagName, ...authParams })
      })

      if (response.ok) {
        showSuccess('Creado', 'Tag creado correctamente')
        setNewTagName('')
        onRefresh()
      } else if (response.status === 401) {
        showError('Sesión expirada', 'Por favor, vuelve a iniciar sesión')
      } else {
        const error = await response.json()
        showError('Error', error.error || 'Error al crear')
      }
    } catch (error) {
      showError('Error', 'Error de conexión')
    }
  }

  const handleDeleteTag = (groupId, tagId, tagName) => {
    showConfirm('Eliminar tag', `¿Eliminar el tag "${tagName}"?`, async () => {
      try {
        const params = new URLSearchParams(authParams)
        const response = await fetch(apiUrl(`admin/tags/${groupId}/${tagId}`) + '&' + params.toString(), {
          method: 'DELETE'
        })
        if (response.ok) {
          showSuccess('Eliminado', 'Tag eliminado')
          onRefresh()
        } else if (response.status === 401) {
          showError('Sesión expirada', 'Por favor, vuelve a iniciar sesión')
        }
      } catch (error) {
        showError('Error', 'Error de conexión')
      }
    })
  }

  const handleRenameGroup = async () => {
    if (!editingGroup) return

    try {
      const response = await fetch(apiUrl(`admin/tag-groups/${editingGroup.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingGroup.name, ...authParams })
      })

      if (response.ok) {
        showSuccess('Actualizado', 'Grupo renombrado')
        setEditingGroup(null)
        onRefresh()
      } else if (response.status === 401) {
        showError('Sesión expirada', 'Por favor, vuelve a iniciar sesión')
      }
    } catch (error) {
      showError('Error', 'Error de conexión')
    }
  }

  return (
    <div className="h-full overflow-y-auto py-4 space-y-6">
      {/* Create Tag */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Crear nuevo tag</h2>
        <form onSubmit={handleCreateTag} className="flex gap-4">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            <option value="">Seleccionar grupo</option>
            {tagGroups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Nombre del tag"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Crear
          </button>
        </form>
      </div>

      {/* Tag Groups */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tagGroups.map(group => (
          <div key={group.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
              <button
                onClick={() => setEditingGroup({ ...group })}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Renombrar
              </button>
            </div>

            {group.tags.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Sin tags</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {[...group.tags].sort((a, b) => a.name.localeCompare(b.name)).map(tag => (
                  <div key={tag.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{tag.name}</span>
                    <button
                      onClick={() => handleDeleteTag(group.id, tag.id, tag.name)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rename Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingGroup(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Renombrar grupo</h3>
            <input
              type="text"
              value={editingGroup.name}
              onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditingGroup(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleRenameGroup} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
