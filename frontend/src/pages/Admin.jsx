import { useState, useEffect, useRef } from 'react'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'

const API_BASE = import.meta.env.VITE_API_URL || './api/index.php'

// Helper para capitalizar primera letra
const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function apiUrl(route) {
  return `${API_BASE}?route=${route.replace(/^\//, '')}`
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [credentials, setCredentials] = useState({ user: '', pass: '' })
  const [activeTab, setActiveTab] = useState('manage')
  const [tagGroups, setTagGroups] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [pendingSave, setPendingSave] = useState(null) // Función para guardar antes de cambiar tab

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

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showError('Error', 'La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      const response = await fetch(apiUrl('admin/password'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword, ...getAuthParams() })
      })

      if (response.ok) {
        setCredentials({ ...credentials, pass: newPassword })
        setShowPasswordModal(false)
        setNewPassword('')
        showSuccess('Éxito', 'Contraseña actualizada')
      } else {
        showError('Error', 'No se pudo cambiar la contraseña')
      }
    } catch (error) {
      showError('Error', 'Error de conexión')
    }
  }

  const handleTabChange = async (newTab) => {
    // Si hay una función de guardado pendiente, ejecutarla antes de cambiar
    if (pendingSave) {
      await pendingSave()
    }
    setActiveTab(newTab)
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
    { id: 'manage', label: 'Administrar fotos' },
    { id: 'upload', label: 'Subir fotos' },
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
                onClick={() => handleTabChange(tab.id)}
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
            <button onClick={() => setShowPasswordModal(true)} className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
              Cambiar contraseña
            </button>
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
              setPendingSave={setPendingSave}
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
              setPendingSave={setPendingSave}
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

      {/* Modal cambiar contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cambiar contraseña</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              autoComplete="new-password"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleChangePassword} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={closeModal} {...modalProps} />
    </div>
  )
}

// ==================
// Upload Photos - Nueva sección de subida
// ==================
function UploadPhotos({ tagGroups, authParams, onRefresh, showSuccess, showError, setPendingSave }) {
  const [buckets, setBuckets] = useState([])
  const [activeBucketId, setActiveBucketId] = useState(null)
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

  // Cargar buckets al montar
  useEffect(() => {
    loadBuckets()
  }, [])

  const loadBuckets = async () => {
    try {
      const response = await fetch(apiUrl('buckets'))
      const data = await response.json()
      setBuckets(data.buckets || [])
    } catch (error) {
      console.error('Error cargando buckets:', error)
    }
  }

  // Registrar función de guardado para cuando se cambie de tab
  useEffect(() => {
    if (currentPhoto && setPendingSave) {
      setPendingSave(() => () => handleSaveCurrentPhoto(false))
    }
    return () => setPendingSave && setPendingSave(null)
  }, [currentPhoto, photoTags, photoTexts])

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
        const newBucketId = data.bucket_id

        // Recargar buckets
        await loadBuckets()

        // Activar el nuevo bucket
        if (newBucketId) {
          setActiveBucketId(newBucketId)
        }

        // Cargar fotos del nuevo bucket
        setUploadedPhotos(newPhotos)
        setCurrentIndex(0)

        // Inicializar tags y textos vacíos para las nuevas fotos
        const newTags = {}
        const newTexts = {}
        newPhotos.forEach(p => {
          newTags[p.id] = []
          newTexts[p.id] = ''
        })
        setPhotoTags(newTags)
        setPhotoTexts(newTexts)

        showSuccess('Éxito', `${newPhotos.length} foto(s) subida(s)`)
        onRefresh()
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
        // Auto-seleccionar el nuevo tag SIN perder los anteriores
        if (currentPhoto) {
          setPhotoTags(prev => ({
            ...prev,
            [currentPhoto.id]: [...(prev[currentPhoto.id] || []), newTag.id]
          }))
        }
        // Refrescar tags después de actualizar el estado local
        onRefresh()
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
    await handleSaveCurrentPhoto(false)
    setArrowFeedback('prev')
    setTimeout(() => setArrowFeedback(null), 500)
    // Continuo: si está en la primera, va a la última
    setCurrentIndex(currentIndex === 0 ? uploadedPhotos.length - 1 : currentIndex - 1)
  }

  const goToNext = async () => {
    await handleSaveCurrentPhoto(false)
    setArrowFeedback('next')
    setTimeout(() => setArrowFeedback(null), 500)
    // Continuo: si está en la última, va a la primera
    setCurrentIndex(currentIndex === uploadedPhotos.length - 1 ? 0 : currentIndex + 1)
  }

  const handleChangeBucket = async (bucketId) => {
    // Guardar bucket actual si hay fotos
    if (uploadedPhotos.length > 0 && currentPhoto) {
      await handleSaveCurrentPhoto(false)
    }

    // Cambiar al nuevo bucket
    const bucket = buckets.find(b => b.id === bucketId)
    if (bucket) {
      setActiveBucketId(bucketId)
      setUploadedPhotos(bucket.photos || [])
      setCurrentIndex(0)

      // Inicializar tags y textos desde las fotos del bucket
      const newTags = {}
      const newTexts = {}
      bucket.photos.forEach(p => {
        newTags[p.id] = p.tags || []
        newTexts[p.id] = p.text || ''
      })
      setPhotoTags(newTags)
      setPhotoTexts(newTexts)
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
      {/* Sub-header: Botones de Buckets */}
      <div className="flex gap-2 items-center flex-shrink-0 px-2">
        {[0, 1, 2, 3, 4].map(index => {
          const bucket = buckets[index]
          const isActive = bucket && bucket.id === activeBucketId
          const isEmpty = !bucket

          return (
            <button
              key={index}
              onClick={() => bucket && handleChangeBucket(bucket.id)}
              disabled={isEmpty}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : isEmpty
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Bucket {index + 1}
              {bucket && ` (${bucket.photos.length})`}
            </button>
          )
        })}
      </div>

      {/* Carrusel de fotos */}
      <PhotoCarousel
        photos={uploadedPhotos}
        currentIndex={currentIndex}
        onSelectPhoto={async (newIndex) => {
          await handleSaveCurrentPhoto(false)
          setCurrentIndex(newIndex)
        }}
      />

      {/* Área superior: foto con flechas + descripción */}
      <div className="flex gap-4 flex-shrink-0" style={{ height: '40%' }}>
        {/* Flecha izquierda */}
        <button
          onClick={goToPrev}
          className={`p-2 rounded-full transition-all duration-300 self-center ${
            arrowFeedback === 'prev'
              ? 'text-green-500 bg-green-100 dark:bg-green-900/30'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Foto con zoom */}
        <ZoomableImage src={currentPhoto?.url} alt={currentText} />

        {/* Flecha derecha */}
        <button
          onClick={goToNext}
          className={`p-2 rounded-full transition-all duration-300 self-center ${
            arrowFeedback === 'next'
              ? 'text-green-500 bg-green-100 dark:bg-green-900/30'
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
// Zoomable Image - Imagen con zoom y drag
// ==================
function ZoomableImage({ src, alt }) {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Resetear cuando cambia la imagen
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [src])

  // Event listener para wheel con { passive: false } para evitar error de consola
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setScale(prev => Math.min(Math.max(prev + delta, 1), 5))
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2)
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          className="h-full w-auto max-w-md object-contain select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          draggable={false}
        />
      )}
      {/* Indicador de zoom */}
      {scale > 1 && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
          {Math.round(scale * 100)}% (doble click para resetear)
        </div>
      )}
      {scale === 1 && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity">
          Rueda del mouse para zoom
        </div>
      )}
    </div>
  )
}

// ==================
// Photo Carousel - Carrusel de fotos
// ==================
function PhotoCarousel({ photos, currentIndex, onSelectPhoto }) {
  const carouselRef = useRef(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartScroll, setDragStartScroll] = useState(0)

  const THUMBNAIL_SIZE = 120

  // Aplicar scroll position sin límites (continuo)
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollPosition
    }
  }, [scrollPosition])

  const handlePrevious = () => {
    const containerWidth = carouselRef.current.offsetWidth
    setScrollPosition(prev => prev - containerWidth * 0.8)
  }

  const handleNext = () => {
    if (!carouselRef.current) return
    const containerWidth = carouselRef.current.offsetWidth
    setScrollPosition(prev => prev + containerWidth * 0.8)
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartScroll(scrollPosition)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const deltaX = dragStartX - e.clientX
    // Sin límites, se queda donde lo sueltes
    setScrollPosition(dragStartScroll + deltaX)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  if (!photos || photos.length === 0) {
    return null
  }

  // Triplicar las fotos para efecto continuo
  const triplePhotos = [...photos, ...photos, ...photos]

  return (
    <div className="relative w-full bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Flecha izquierda - siempre visible */}
      <button
        onClick={handlePrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-700/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-600 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Container del carrusel */}
      <div
        ref={carouselRef}
        className="flex overflow-x-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {triplePhotos.map((photo, idx) => {
          const originalIdx = idx % photos.length
          return (
            <button
              key={`${photo.id}-${idx}`}
              onClick={(e) => {
                if (!isDragging) {
                  onSelectPhoto(originalIdx)
                }
                e.preventDefault()
              }}
              className={`flex-shrink-0 overflow-hidden border-2 transition-all ${
                originalIdx === currentIndex
                  ? 'border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              style={{ width: `${THUMBNAIL_SIZE}px`, height: `${THUMBNAIL_SIZE}px` }}
            >
              <img
                src={photo.url}
                alt={`Foto ${originalIdx + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            </button>
          )
        })}
      </div>

      {/* Flecha derecha - siempre visible */}
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-700/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-600 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
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
                {capitalize(tag.name)}
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
// Manage Photos - Administrar fotos existentes (misma interfaz que Upload)
// ==================
function ManagePhotos({ photos, tagGroups, authParams, onRefresh, showSuccess, showError, showConfirm, setPendingSave }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [photoTags, setPhotoTags] = useState({})
  const [photoTexts, setPhotoTexts] = useState({})
  const [saving, setSaving] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [arrowFeedback, setArrowFeedback] = useState(null)

  const currentPhoto = photos[currentIndex]

  // Inicializar datos cuando cambian las fotos (sin sobrescribir los locales)
  useEffect(() => {
    setPhotoTags(prev => {
      const tags = { ...prev }
      photos.forEach(p => {
        // Solo inicializar si no existe en el estado local
        if (!(p.id in tags)) {
          tags[p.id] = p.tags || []
        }
      })
      return tags
    })
    setPhotoTexts(prev => {
      const texts = { ...prev }
      photos.forEach(p => {
        // Solo inicializar si no existe en el estado local
        if (!(p.id in texts)) {
          texts[p.id] = p.text || ''
        }
      })
      return texts
    })
  }, [photos])

  // Registrar función de guardado para cuando se cambie de tab
  useEffect(() => {
    if (currentPhoto && setPendingSave) {
      setPendingSave(() => () => handleSaveCurrentPhoto(false))
    }
    return () => setPendingSave && setPendingSave(null)
  }, [currentPhoto, photoTags, photoTexts])

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
        // Auto-seleccionar el nuevo tag SIN perder los anteriores
        if (currentPhoto) {
          setPhotoTags(prev => ({
            ...prev,
            [currentPhoto.id]: [...(prev[currentPhoto.id] || []), newTag.id]
          }))
        }
        // Refrescar tags después de actualizar el estado local
        onRefresh()
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

  const handleDeletePhoto = () => {
    if (!currentPhoto) return
    showConfirm('Eliminar foto', '¿Eliminar esta foto permanentemente?', async () => {
      try {
        const params = new URLSearchParams(authParams)
        const response = await fetch(apiUrl(`admin/photos/${currentPhoto.id}`) + '&' + params.toString(), {
          method: 'DELETE'
        })
        if (response.ok) {
          // Ajustar índice si estamos en la última foto
          if (currentIndex >= photos.length - 1 && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
          }
          onRefresh()
        } else if (response.status === 401) {
          showError('Sesión expirada', 'Por favor, vuelve a iniciar sesión')
        }
      } catch (error) {
        showError('Error', 'Error de conexión')
      }
    })
  }

  const goToPrev = async () => {
    await handleSaveCurrentPhoto(false)
    setArrowFeedback('prev')
    setTimeout(() => setArrowFeedback(null), 500)
    // Continuo: si está en la primera, va a la última
    setCurrentIndex(currentIndex === 0 ? photos.length - 1 : currentIndex - 1)
  }

  const goToNext = async () => {
    await handleSaveCurrentPhoto(false)
    setArrowFeedback('next')
    setTimeout(() => setArrowFeedback(null), 500)
    // Continuo: si está en la última, va a la primera
    setCurrentIndex(currentIndex === photos.length - 1 ? 0 : currentIndex + 1)
  }

  const currentTags = currentPhoto ? (photoTags[currentPhoto.id] || []) : []
  const currentText = currentPhoto ? (photoTexts[currentPhoto.id] || '') : ''

  if (photos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No hay fotos en el catálogo</p>
          <p className="text-sm mt-2">Usa "Subir fotos" para agregar fotos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col py-2 gap-3">
      {/* Carrusel de fotos */}
      <PhotoCarousel
        photos={photos}
        currentIndex={currentIndex}
        onSelectPhoto={async (newIndex) => {
          await handleSaveCurrentPhoto(false)
          setCurrentIndex(newIndex)
        }}
      />

      {/* Área superior: foto con flechas + descripción */}
      <div className="flex gap-4 flex-shrink-0" style={{ height: '40%' }}>
        {/* Flecha izquierda */}
        <button
          onClick={goToPrev}
          className={`p-2 rounded-full transition-all duration-300 self-center ${
            arrowFeedback === 'prev'
              ? 'text-green-500 bg-green-100 dark:bg-green-900/30'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Foto con zoom */}
        <ZoomableImage src={currentPhoto?.url} alt={currentText} />

        {/* Flecha derecha */}
        <button
          onClick={goToNext}
          className={`p-2 rounded-full transition-all duration-300 self-center ${
            arrowFeedback === 'next'
              ? 'text-green-500 bg-green-100 dark:bg-green-900/30'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Descripción y controles */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Foto {currentIndex + 1} de {photos.length}
            </span>
            <button
              onClick={handleDeletePhoto}
              className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900"
            >
              Eliminar foto
            </button>
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
// Tags Manager - Gestión de tags
// ==================
function TagsManager({ tagGroups, authParams, onRefresh, showSuccess, showError, showConfirm }) {
  const [newTagName, setNewTagName] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [editingGroup, setEditingGroup] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(null) // { groupId, tagId, tagName }

  // Manejar tecla Escape para cancelar confirmación
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && confirmingDelete) {
        setConfirmingDelete(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [confirmingDelete])

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

  const handleDeleteTag = async (groupId, tagId) => {
    try {
      const params = new URLSearchParams(authParams)
      const response = await fetch(apiUrl(`admin/tags/${groupId}/${tagId}`) + '&' + params.toString(), {
        method: 'DELETE'
      })
      if (response.ok) {
        showSuccess('Eliminado', 'Tag eliminado')
        setConfirmingDelete(null)
        onRefresh()
      } else if (response.status === 401) {
        showError('Sesión expirada', 'Por favor, vuelve a iniciar sesión')
      }
    } catch (error) {
      showError('Error', 'Error de conexión')
    }
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
                {[...group.tags].sort((a, b) => a.name.localeCompare(b.name)).map(tag => {
                  const isConfirming = confirmingDelete?.tagId === tag.id && confirmingDelete?.groupId === group.id

                  return (
                    <div key={tag.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{capitalize(tag.name)}</span>
                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteTag(group.id, tag.id)}
                            className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Borrar
                          </button>
                          <button
                            onClick={() => setConfirmingDelete(null)}
                            className="px-2 py-0.5 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingDelete({ groupId: group.id, tagId: tag.id, tagName: tag.name })}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  )
                })}
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
