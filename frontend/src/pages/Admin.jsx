import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'

const API_BASE = import.meta.env.VITE_API_URL || './api/index.php'

function apiUrl(route) {
  return `${API_BASE}?route=${route.replace(/^\//, '')}`
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [credentials, setCredentials] = useState({ user: '', pass: '' })
  const [activeTab, setActiveTab] = useState('photos')
  const [tagGroups, setTagGroups] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)

  const { isOpen, modalProps, closeModal, showSuccess, showError, showConfirm } = useModal()

  // Credenciales para enviar en body (más compatible con hostings restrictivos)
  const getAuthParams = () => ({
    auth_user: credentials.user,
    auth_pass: credentials.pass
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      // Verificar credenciales con un endpoint admin
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">FotoCRM Admin</h1>
          <div className="flex items-center gap-4">
            <a href="#/" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">Ver catálogo</a>
            <button onClick={() => setAuthenticated(false)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {['photos', 'tags'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab === 'photos' ? 'Fotos' : 'Tags'}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-8">
        {activeTab === 'photos' && (
          <PhotosManager
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
      </main>

      <Modal isOpen={isOpen} onClose={closeModal} {...modalProps} />
    </div>
  )
}

// ==================
// Photos Manager
// ==================
function PhotosManager({ photos, tagGroups, authParams, onRefresh, showSuccess, showError, showConfirm }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])
  const [uploadText, setUploadText] = useState('')
  const [editingPhoto, setEditingPhoto] = useState(null)

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    )
  }

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    for (const file of files) {
      formData.append('photos[]', file)
    }
    formData.append('tags', selectedTags.join(','))
    formData.append('text', uploadText)
    // Auth en FormData (compatible con hostings restrictivos)
    formData.append('auth_user', authParams.auth_user)
    formData.append('auth_pass', authParams.auth_pass)

    try {
      const response = await fetch(apiUrl('admin/upload'), {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        showSuccess('Éxito', `${files.length} foto(s) subida(s)`)
        setSelectedTags([])
        setUploadText('')
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

  const handleDelete = (photo) => {
    showConfirm('Eliminar foto', '¿Eliminar esta foto?', async () => {
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
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subir fotos</h2>

        {/* Tags selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar tags para las fotos:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {tagGroups.map(group => (
              <div key={group.id}>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{group.name}</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {group.tags.map(tag => (
                    <label key={tag.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{tag.name}</span>
                    </label>
                  ))}
                  {group.tags.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Sin tags</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción:
          </label>
          <input
            type="text"
            value={uploadText}
            onChange={(e) => setUploadText(e.target.value)}
            placeholder="Descripción para la(s) foto(s)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Subiendo...</span>
            </div>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-300 mb-2">Arrastra fotos aquí o</p>
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
            </>
          )}
        </div>
      </div>

      {/* Photos List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Fotos ({photos.length})
        </h2>

        {photos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay fotos</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img src={photo.url} alt={photo.text} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate mb-1">
                    {photo.text || 'Sin descripción'}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(photo.tags || []).map(tagId => (
                      <span key={tagId} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                        {getTagName(tagId)}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPhoto({ ...photo, tags: photo.tags || [] })}
                      className="flex-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(photo)}
                      className="flex-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Editar foto</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <textarea
                value={editingPhoto.text || ''}
                onChange={(e) => setEditingPhoto({ ...editingPhoto, text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
              <div className="grid grid-cols-2 gap-4">
                {tagGroups.map(group => (
                  <div key={group.id}>
                    <p className="text-xs font-semibold text-gray-500 mb-1">{group.name}</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {group.tags.map(tag => (
                        <label key={tag.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingPhoto.tags.includes(tag.id)}
                            onChange={() => {
                              const newTags = editingPhoto.tags.includes(tag.id)
                                ? editingPhoto.tags.filter(t => t !== tag.id)
                                : [...editingPhoto.tags, tag.id]
                              setEditingPhoto({ ...editingPhoto, tags: newTags })
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{tag.name}</span>
                        </label>
                      ))}
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
// Tags Manager
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
    <div className="space-y-6">
      {/* Create Tag */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Crear
          </button>
        </form>
      </div>

      {/* Tag Groups */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="space-y-1">
                {group.tags.map(tag => (
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
