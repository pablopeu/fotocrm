import { useState, useEffect, useCallback } from 'react'
import Modal from './components/Modal'
import TagFilter from './components/TagFilter'
import PhotoGrid from './components/PhotoGrid'
import PhotoModal from './components/PhotoModal'
import SearchBar from './components/SearchBar'
import { useModal } from './hooks/useModal'
import {
  getCategories,
  getPhotos,
  copyImageToClipboard,
  copyTextToClipboard,
  copyMultipleTexts
} from './services/api'

function App() {
  const [tagGroups, setTagGroups] = useState([])
  const [photos, setPhotos] = useState([])
  const [filteredPhotos, setFilteredPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTags, setSelectedTags] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([])
  const [viewingPhoto, setViewingPhoto] = useState(null)
  // Sidebar cerrado por defecto en móvil, abierto en desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 // lg breakpoint
    }
    return false
  })

  const { isOpen, modalProps, closeModal, showSuccess, showError } = useModal()

  // Cargar datos iniciales
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [catData, photoData] = await Promise.all([
          getCategories(),
          getPhotos()
        ])
        setTagGroups(catData.tag_groups || [])
        setPhotos(photoData.photos || [])
        setFilteredPhotos(photoData.photos || [])
      } catch (error) {
        console.error('Error cargando datos:', error)
        showError('Error', 'No se pudieron cargar los datos. Verifica la conexión con el servidor.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filtrar fotos cuando cambian los filtros
  useEffect(() => {
    let result = [...photos]

    // Filtrar por tags (AND: la foto debe tener TODOS los tags seleccionados)
    if (selectedTags.length > 0) {
      result = result.filter(photo => {
        const photoTags = photo.tags || []
        return selectedTags.every(tag => photoTags.includes(tag))
      })
    }

    // Filtrar por búsqueda de texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.text?.toLowerCase().includes(query)
      )
    }

    setFilteredPhotos(result)
    setSelectedPhotoIds([])
  }, [photos, selectedTags, searchQuery])

  // Handlers
  const handleTagToggle = useCallback((tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    )
  }, [])

  const handleClearAllTags = useCallback(() => {
    setSelectedTags([])
  }, [])

  const handleToggleSelect = useCallback((photoId) => {
    setSelectedPhotoIds(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedPhotoIds(filteredPhotos.map(p => p.id))
  }, [filteredPhotos])

  const handleClearSelection = useCallback(() => {
    setSelectedPhotoIds([])
  }, [])

  const handleCopyImage = useCallback(async (photo) => {
    const result = await copyImageToClipboard(photo.url)
    if (result.success) {
      showSuccess('Copiado', result.message)
    } else {
      showError('Error', result.message)
    }
  }, [showSuccess, showError])

  const handleCopyText = useCallback(async (photo) => {
    const result = await copyTextToClipboard(photo.text || '')
    if (result.success) {
      showSuccess('Copiado', result.message)
    } else {
      showError('Error', result.message)
    }
  }, [showSuccess, showError])

  const handleCopySelected = useCallback(async (type) => {
    const selectedPhotos = filteredPhotos.filter(p => selectedPhotoIds.includes(p.id))

    if (type === 'text') {
      const texts = selectedPhotos.map(p => p.text).filter(Boolean)
      const result = await copyMultipleTexts(texts)
      if (result.success) {
        showSuccess('Copiado', `${texts.length} texto(s) copiado(s) al portapapeles`)
      } else {
        showError('Error', result.message)
      }
    } else {
      if (selectedPhotos.length > 0) {
        const result = await copyImageToClipboard(selectedPhotos[0].url)
        if (result.success) {
          showSuccess('Copiado', selectedPhotos.length > 1
            ? 'Primera imagen copiada (los navegadores solo permiten copiar una imagen a la vez)'
            : 'Imagen copiada al portapapeles'
          )
        } else {
          showError('Error', result.message)
        }
      }
    }
  }, [filteredPhotos, selectedPhotoIds, showSuccess, showError])

  const handleViewPhoto = useCallback((photo) => {
    setViewingPhoto(photo)
  }, [])

  // Helper para obtener nombre de tag
  const getTagName = (tagId) => {
    for (const group of tagGroups) {
      const tag = group.tags.find(t => t.id === tagId)
      if (tag) return tag.name
    }
    return tagId
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                FotoCRM
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Catálogo de cuchillos artesanales
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar en el catálogo..."
            />
          </div>

          <a
            href="#/admin"
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Admin
          </a>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            w-64 bg-white dark:bg-gray-800 shadow-lg lg:shadow-none
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            mt-[57px] lg:mt-0
          `}
        >
          <div className="h-full overflow-y-auto p-4">
            <TagFilter
              tagGroups={tagGroups}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              onClearAll={handleClearAllTags}
            />
          </div>
        </aside>

        {/* Overlay para cerrar sidebar en móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Filtros activos */}
            {(selectedTags.length > 0 || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">Filtros:</span>

                {selectedTags.map(tagId => (
                  <span
                    key={tagId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded"
                  >
                    {getTagName(tagId)}
                    <button
                      onClick={() => handleTagToggle(tagId)}
                      className="hover:text-blue-600 dark:hover:text-blue-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}

                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded">
                    "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:text-purple-600 dark:hover:text-purple-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}

                <button
                  onClick={() => {
                    setSelectedTags([])
                    setSearchQuery('')
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                >
                  Limpiar todo
                </button>
              </div>
            )}

            {/* Info de resultados */}
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {filteredPhotos.length} foto{filteredPhotos.length !== 1 ? 's' : ''} encontrada{filteredPhotos.length !== 1 ? 's' : ''}
            </div>

            {/* Grid de fotos */}
            <PhotoGrid
              photos={filteredPhotos}
              selectedIds={selectedPhotoIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onCopyImage={handleCopyImage}
              onCopyText={handleCopyText}
              onCopySelected={handleCopySelected}
              onViewPhoto={handleViewPhoto}
              loading={loading}
            />
          </div>
        </main>
      </div>

      {/* Modal de vista de foto */}
      <PhotoModal
        photo={viewingPhoto}
        isOpen={!!viewingPhoto}
        onClose={() => setViewingPhoto(null)}
        onCopyImage={handleCopyImage}
        onCopyText={handleCopyText}
      />

      {/* Modal de mensajes */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        {...modalProps}
      />
    </div>
  )
}

export default App
