import { useState, useEffect, useCallback } from 'react'
import Modal from './components/Modal'
import PhotoModal from './components/PhotoModal'
import SearchBar from './components/SearchBar'
import { useModal } from './hooks/useModal'
import {
  getCategories,
  getPhotos,
  copyImageToClipboard,
  copyTextToClipboard
} from './services/api'

// Tabs de tipos principales
const TIPO_TABS = [
  { id: 'cocina', label: 'Cocina' },
  { id: 'asado', label: 'Asado' },
  { id: 'japones', label: 'Japonés' },
  { id: 'otros', label: 'Otros' }
]

// IDs que se consideran "Otros"
const OTROS_TIPOS = ['outdoor', 'camping', 'caza']

function App() {
  const [tagGroups, setTagGroups] = useState([])
  const [photos, setPhotos] = useState([])
  const [filteredPhotos, setFilteredPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [activeTab, setActiveTab] = useState(null) // null = todos, o un id de tab
  const [selectedEncabado, setSelectedEncabado] = useState([])
  const [selectedAcero, setSelectedAcero] = useState([])
  const [selectedExtras, setSelectedExtras] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const [viewingPhoto, setViewingPhoto] = useState(null)

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

  // Obtener tags por grupo
  const getTagsByGroup = (groupId) => {
    const group = tagGroups.find(g => g.id === groupId)
    return group?.tags || []
  }

  // Filtrar fotos cuando cambian los filtros
  useEffect(() => {
    let result = [...photos]

    // Filtrar por tab de tipo
    if (activeTab) {
      if (activeTab === 'otros') {
        // Filtrar fotos que tengan algún tag de "otros" tipos
        result = result.filter(photo => {
          const photoTags = photo.tags || []
          return OTROS_TIPOS.some(tipo => photoTags.includes(tipo))
        })
      } else {
        result = result.filter(photo => {
          const photoTags = photo.tags || []
          return photoTags.includes(activeTab)
        })
      }
    }

    // Filtrar por encabado (OR dentro del grupo)
    if (selectedEncabado.length > 0) {
      result = result.filter(photo => {
        const photoTags = photo.tags || []
        return selectedEncabado.some(tag => photoTags.includes(tag))
      })
    }

    // Filtrar por acero (OR dentro del grupo)
    if (selectedAcero.length > 0) {
      result = result.filter(photo => {
        const photoTags = photo.tags || []
        return selectedAcero.some(tag => photoTags.includes(tag))
      })
    }

    // Filtrar por extras (OR dentro del grupo)
    if (selectedExtras.length > 0) {
      result = result.filter(photo => {
        const photoTags = photo.tags || []
        return selectedExtras.some(tag => photoTags.includes(tag))
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
  }, [photos, activeTab, selectedEncabado, selectedAcero, selectedExtras, searchQuery])

  // Handlers
  const handleResetFilters = useCallback(() => {
    setActiveTab(null)
    setSelectedEncabado([])
    setSelectedAcero([])
    setSelectedExtras([])
    setSearchQuery('')
  }, [])

  const hasActiveFilters = activeTab !== null || selectedEncabado.length > 0 || selectedAcero.length > 0 || selectedExtras.length > 0 || searchQuery

  const handleCopyImage = useCallback(async (photo) => {
    const result = await copyImageToClipboard(photo.url)
    if (result.success) {
      showSuccess('Copiado', result.message)
    } else {
      showError('Error', result.message)
    }
  }, [showSuccess, showError])

  const handleCopyText = useCallback(async (text) => {
    const result = await copyTextToClipboard(text || '')
    if (result.success) {
      showSuccess('Copiado', 'Descripción copiada al portapapeles')
    } else {
      showError('Error', result.message)
    }
  }, [showSuccess, showError])

  const handleViewPhoto = useCallback((photo) => {
    setViewingPhoto(photo)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header con título y tabs */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          {/* Primera fila: título y buscador */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                PEU Cuchillos Artesanales
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Buscador interactivo de modelos
              </p>
            </div>

            <div className="w-48">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar..."
              />
            </div>
          </div>

          {/* Segunda fila: Tabs de tipo */}
          <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 pb-3">
            <button
              onClick={() => setActiveTab(null)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === null
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Todos
            </button>
            {TIPO_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tercera fila: Selectboxes de filtros */}
          <div className="flex items-center gap-3 pt-3 flex-wrap">
            {/* Encabado */}
            <MultiSelect
              label="Encabado"
              options={getTagsByGroup('encabado')}
              selected={selectedEncabado}
              onChange={setSelectedEncabado}
            />

            {/* Acero */}
            <MultiSelect
              label="Acero"
              options={getTagsByGroup('acero')}
              selected={selectedAcero}
              onChange={setSelectedAcero}
            />

            {/* Extras */}
            <MultiSelect
              label="Extras"
              options={getTagsByGroup('extras')}
              selected={selectedExtras}
              onChange={setSelectedExtras}
            />

            {/* Botón resetear */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Resetear filtros
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Info de resultados */}
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {filteredPhotos.length} foto{filteredPhotos.length !== 1 ? 's' : ''} encontrada{filteredPhotos.length !== 1 ? 's' : ''}
          </div>

          {/* Grid de fotos */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">No hay fotos</p>
              <p className="text-sm">Ajusta los filtros para ver resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPhotos.map(photo => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onCopyImage={handleCopyImage}
                  onCopyText={handleCopyText}
                  onView={handleViewPhoto}
                />
              ))}
            </div>
          )}
        </div>
      </main>

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

// Componente MultiSelect para filtros
function MultiSelect({ label, options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const selectedCount = selected.length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
          selectedCount > 0
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {label}
        {selectedCount > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
            {selectedCount}
          </span>
        )}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[180px] max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500 italic">Sin opciones</p>
            ) : (
              options.map(option => (
                <label
                  key={option.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={() => handleToggle(option.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.name}</span>
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Componente PhotoCard simplificado
function PhotoCard({ photo, onCopyImage, onCopyText, onView }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageClick = async (e) => {
    e.stopPropagation()
    await onCopyImage(photo)
  }

  const handleTextClick = async (e) => {
    e.stopPropagation()
    if (photo.text) {
      await onCopyText(photo.text)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Imagen - clickeable para copiar */}
      <div
        className="aspect-square bg-gray-100 dark:bg-gray-700 cursor-pointer relative overflow-hidden group"
        onClick={handleImageClick}
        title="Click para copiar imagen"
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ) : (
          <>
            <img
              src={photo.url}
              alt={photo.text || 'Foto de cuchillo'}
              className={`w-full h-full object-cover transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {/* Overlay al hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium bg-black/50 px-3 py-1 rounded">
                Copiar imagen
              </span>
            </div>
          </>
        )}
      </div>

      {/* Descripción - clickeable para copiar */}
      <div
        className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={handleTextClick}
        title={photo.text ? "Click para copiar descripción" : ""}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 min-h-[3.75rem]">
          {photo.text || 'Sin descripción'}
        </p>
      </div>
    </div>
  )
}

export default App
