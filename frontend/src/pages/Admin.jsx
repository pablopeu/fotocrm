import { useState, useEffect, useCallback } from 'react'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'

const API_BASE = import.meta.env.VITE_API_URL || './api'

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [credentials, setCredentials] = useState({ user: '', pass: '' })
  const [activeTab, setActiveTab] = useState('photos')
  const [categories, setCategories] = useState([])
  const [steelTypes, setSteelTypes] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)

  const { isOpen, modalProps, closeModal, showSuccess, showError, showConfirm } = useModal()

  // Auth header
  const getAuthHeader = () => ({
    'Authorization': 'Basic ' + btoa(`${credentials.user}:${credentials.pass}`)
  })

  // Verificar autenticación
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/health`, {
        headers: getAuthHeader()
      })
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

  // Cargar datos
  const loadData = async () => {
    setLoading(true)
    try {
      const [catRes, photoRes] = await Promise.all([
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/photos`)
      ])
      const catData = await catRes.json()
      const photoData = await photoRes.json()
      setCategories(catData.categories || [])
      setSteelTypes(catData.steel_types || [])
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={credentials.user}
                onChange={(e) => setCredentials({ ...credentials, user: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={credentials.pass}
                onChange={(e) => setCredentials({ ...credentials, pass: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Iniciar sesión
            </button>
          </form>
          <a
            href="/"
            className="block text-center mt-4 text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            Volver al catálogo
          </a>
        </div>
        <Modal isOpen={isOpen} onClose={closeModal} {...modalProps} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              FotoCRM Admin
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
              Ver catálogo
            </a>
            <button
              onClick={() => setAuthenticated(false)}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {['photos', 'categories'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'photos' ? 'Fotos' : 'Categorías'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {activeTab === 'photos' && (
          <PhotosManager
            photos={photos}
            categories={categories}
            steelTypes={steelTypes}
            authHeader={getAuthHeader()}
            onRefresh={loadData}
            showSuccess={showSuccess}
            showError={showError}
            showConfirm={showConfirm}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesManager
            categories={categories}
            authHeader={getAuthHeader()}
            onRefresh={loadData}
            showSuccess={showSuccess}
            showError={showError}
            showConfirm={showConfirm}
          />
        )}
      </main>

      <Modal isOpen={isOpen} onClose={closeModal} {...modalProps} />
    </div>
  )
}

// ==================
// Photos Manager
// ==================
function PhotosManager({ photos, categories, steelTypes, authHeader, onRefresh, showSuccess, showError, showConfirm }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadForm, setUploadForm] = useState({ cat_id: '', steel_type: '', text: '' })
  const [editingPhoto, setEditingPhoto] = useState(null)

  const flatCategories = flattenCategories(categories)

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    for (const file of files) {
      formData.append('photos[]', file)
    }
    formData.append('cat_id', uploadForm.cat_id)
    formData.append('steel_type', uploadForm.steel_type)
    formData.append('text', uploadForm.text)

    try {
      const response = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        headers: authHeader,
        body: formData
      })

      if (response.ok) {
        showSuccess('Éxito', `${files.length} foto(s) subida(s) correctamente`)
        setUploadForm({ cat_id: '', steel_type: '', text: '' })
        onRefresh()
      } else {
        const error = await response.json()
        showError('Error', error.error || 'Error al subir fotos')
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

  const handleDelete = (photo) => {
    showConfirm('Eliminar foto', '¿Estás seguro de eliminar esta foto? Esta acción no se puede deshacer.', async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/photos/${photo.id}`, {
          method: 'DELETE',
          headers: authHeader
        })
        if (response.ok) {
          showSuccess('Eliminado', 'Foto eliminada correctamente')
          onRefresh()
        } else {
          showError('Error', 'Error al eliminar')
        }
      } catch (error) {
        showError('Error', 'Error de conexión')
      }
    })
  }

  const handleUpdatePhoto = async () => {
    if (!editingPhoto) return

    try {
      const response = await fetch(`${API_BASE}/admin/photos/${editingPhoto.id}`, {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editingPhoto.text,
          cat_id: editingPhoto.cat_id,
          steel_type: editingPhoto.steel_type
        })
      })

      if (response.ok) {
        showSuccess('Actualizado', 'Foto actualizada correctamente')
        setEditingPhoto(null)
        onRefresh()
      } else {
        showError('Error', 'Error al actualizar')
      }
    } catch (error) {
      showError('Error', 'Error de conexión')
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subir fotos</h2>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <select
            value={uploadForm.cat_id}
            onChange={(e) => setUploadForm({ ...uploadForm, cat_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Seleccionar categoría</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={uploadForm.steel_type}
            onChange={(e) => setUploadForm({ ...uploadForm, steel_type: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Tipo de acero</option>
            {steelTypes.map((steel) => (
              <option key={steel.id} value={steel.id}>{steel.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Descripción"
            value={uploadForm.text}
            onChange={(e) => setUploadForm({ ...uploadForm, text: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600 dark:text-gray-300">Subiendo...</span>
            </div>
          ) : (
            <>
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Arrastra fotos aquí o
              </p>
              <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                Seleccionar archivos
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                JPG, PNG o WebP. Máximo 5MB por archivo.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Photos List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Fotos existentes ({photos.length})
        </h2>

        {photos.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay fotos. Sube algunas usando el área de arriba.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.text}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate mb-2">
                    {photo.text || 'Sin descripción'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPhoto({ ...photo })}
                      className="flex-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(photo)}
                      className="flex-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingPhoto(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Editar foto</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea
                  value={editingPhoto.text || ''}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                <select
                  value={editingPhoto.cat_id || ''}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, cat_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sin categoría</option>
                  {flatCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de acero</label>
                <select
                  value={editingPhoto.steel_type || ''}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, steel_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sin especificar</option>
                  {steelTypes.map((steel) => (
                    <option key={steel.id} value={steel.id}>{steel.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setEditingPhoto(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdatePhoto}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
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
// Categories Manager
// ==================
function CategoriesManager({ categories, authHeader, onRefresh, showSuccess, showError, showConfirm }) {
  const [newCategory, setNewCategory] = useState({ name: '', parent_id: '' })

  const flatCategories = flattenCategories(categories)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newCategory.name.trim()) return

    try {
      const response = await fetch(`${API_BASE}/admin/categories`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })

      if (response.ok) {
        showSuccess('Creado', 'Categoría creada correctamente')
        setNewCategory({ name: '', parent_id: '' })
        onRefresh()
      } else {
        const error = await response.json()
        showError('Error', error.error || 'Error al crear')
      }
    } catch (error) {
      showError('Error', 'Error de conexión')
    }
  }

  const handleDelete = (cat) => {
    showConfirm('Eliminar categoría', `¿Eliminar "${cat.name}"? Las subcategorías también se eliminarán.`, async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/categories/${cat.id}`, {
          method: 'DELETE',
          headers: authHeader
        })
        if (response.ok) {
          showSuccess('Eliminado', 'Categoría eliminada')
          onRefresh()
        } else {
          showError('Error', 'Error al eliminar')
        }
      } catch (error) {
        showError('Error', 'Error de conexión')
      }
    })
  }

  const renderCategory = (cat, level = 0) => (
    <div key={cat.id}>
      <div
        className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
        style={{ paddingLeft: `${level * 20 + 12}px` }}
      >
        <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
        <button
          onClick={() => handleDelete(cat)}
          className="text-xs text-red-600 dark:text-red-400 hover:underline"
        >
          Eliminar
        </button>
      </div>
      {cat.children?.map((child) => renderCategory(child, level + 1))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nueva categoría</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            placeholder="Nombre"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
          <select
            value={newCategory.parent_id}
            onChange={(e) => setNewCategory({ ...newCategory, parent_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Raíz (sin padre)</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Crear
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categorías existentes</h2>
        {categories.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay categorías</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {categories.map((cat) => renderCategory(cat))}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper: aplanar categorías para selects
function flattenCategories(categories, prefix = '') {
  let result = []
  for (const cat of categories) {
    result.push({ ...cat, name: prefix + cat.name })
    if (cat.children?.length) {
      result = [...result, ...flattenCategories(cat.children, prefix + '  ')]
    }
  }
  return result
}

const API_BASE_ADMIN = import.meta.env.VITE_API_URL || './api'
