import { useState, useEffect, useRef, useCallback } from 'react'
import SearchBar from './components/SearchBar'
import {
  getCategories,
  getPhotos,
  copyImageToClipboard
} from './services/api'

// Helper para capitalizar primera letra
const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

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

  // Cargar datos iniciales
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [catData, photoData] = await Promise.all([
          getCategories(),
          getPhotos()
        ])
        console.log('catData:', catData)
        console.log('photoData:', photoData)
        setTagGroups(catData?.tag_groups || [])
        setPhotos(photoData?.photos || [])
        setFilteredPhotos(photoData?.photos || [])
      } catch (error) {
        console.error('Error cargando datos:', error)
        console.error('Error completo:', error)
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header con título y tabs */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          {/* Primera fila: título, tabs y buscador */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  PEU Cuchillos Artesanales
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Buscador interactivo de modelos y materiales
                </p>
              </div>

              {/* Tabs de tipo */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab(null)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
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
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-48">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar..."
              />
            </div>
          </div>

          {/* Segunda fila: Selectboxes de filtros */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex-wrap">
            {/* Encabado */}
            <MultiSelect
              label="Encabado"
              options={getTagsByGroup('encabado')}
              selected={selectedEncabado}
              onChange={setSelectedEncabado}
              groupId="encabado"
            />

            {/* Acero */}
            <MultiSelect
              label="Acero"
              options={getTagsByGroup('acero')}
              selected={selectedAcero}
              onChange={setSelectedAcero}
              groupId="acero"
            />

            {/* Extras */}
            <MultiSelect
              label="Extras"
              options={getTagsByGroup('extras')}
              selected={selectedExtras}
              onChange={setSelectedExtras}
              groupId="extras"
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
                  tagGroups={tagGroups}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Componente MultiSelect para filtros
function MultiSelect({ label, options, selected, onChange, groupId }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const selectedCount = selected.length

  // Obtener colores según el grupo (sin selección - más tenue)
  const getGroupColorEmpty = () => {
    const colors = {
      encabado: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
      acero: 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300',
      extras: 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
    }
    return colors[groupId] || 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'
  }

  // Obtener colores según el grupo (con selección - más intenso)
  const getGroupColorSelected = () => {
    const colors = {
      encabado: 'border-amber-400 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      acero: 'border-gray-400 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200',
      extras: 'border-green-400 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    }
    return colors[groupId] || 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
          selectedCount > 0 ? getGroupColorSelected() : getGroupColorEmpty()
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">{capitalize(option.name)}</span>
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Componente PhotoCard con zoom y tags
function PhotoCard({ photo, tagGroups }) {
  const containerRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageCopied, setImageCopied] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Resetear zoom cuando cambia la foto
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [photo.url])

  // Event listener para wheel con { passive: false }
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.15 : 0.15
      setScale(prev => Math.min(Math.max(prev + delta, 1), 5))
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  // Resetear zoom cuando se hace scroll en la página
  useEffect(() => {
    const handlePageScroll = () => {
      if (scale > 1) {
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
    }

    window.addEventListener('scroll', handlePageScroll, { passive: true })
    return () => window.removeEventListener('scroll', handlePageScroll)
  }, [scale])

  const handleMouseDown = (e) => {
    if (scale > 1) {
      e.preventDefault()
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

  const handleClick = async (e) => {
    // Solo copiar si no está zoomizado
    if (scale === 1) {
      const result = await copyImageToClipboard(photo.url)
      if (result.success) {
        setImageCopied(true)
        setTimeout(() => setImageCopied(false), 1500)
      }
    }
  }

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2.5)
    }
  }

  // Obtener nombres de tags de la foto
  const getPhotoTags = () => {
    const photoTags = photo.tags || []
    const tagNames = []
    const foundTagIds = new Set()

    // Primero buscar tags que existen en tagGroups
    for (const group of tagGroups) {
      for (const tag of group.tags) {
        if (photoTags.includes(tag.id)) {
          tagNames.push({ name: capitalize(tag.name), groupId: group.id })
          foundTagIds.add(tag.id)
        }
      }
    }

    // Agregar tags que no están en tagGroups (huérfanos)
    for (const tagId of photoTags) {
      if (!foundTagIds.has(tagId)) {
        tagNames.push({ name: capitalize(tagId), groupId: 'unknown' })
      }
    }

    return tagNames
  }

  const photoTagsList = getPhotoTags()

  // Colores por grupo
  const getTagColor = (groupId) => {
    const colors = {
      tipo: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
      encabado: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
      acero: 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200',
      extras: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
      unknown: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
    }
    return colors[groupId] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Imagen con zoom */}
      <div
        ref={containerRef}
        className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer' }}
        title={scale === 1 ? "Click para copiar, rueda para zoom" : "Drag para mover, doble click para resetear"}
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
              className={`w-full h-full object-cover select-none ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              draggable={false}
            />
            {/* Overlay de feedback */}
            {scale === 1 && (
              <div className={`absolute inset-0 transition-colors flex items-center justify-center pointer-events-none ${
                imageCopied ? 'bg-green-500/40' : ''
              }`}>
                {imageCopied && (
                  <span className="text-white text-sm font-medium px-3 py-1 rounded bg-green-600">
                    Imagen copiada
                  </span>
                )}
              </div>
            )}
            {/* Indicador de zoom */}
            {scale > 1 && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                {Math.round(scale * 100)}%
              </div>
            )}
          </>
        )}
      </div>

      {/* Tags de la foto */}
      <div className="p-2">
        {photoTagsList.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {photoTagsList.map((tag, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 text-xs rounded-full ${getTagColor(tag.groupId)}`}
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Sin tags</p>
        )}
      </div>
    </div>
  )
}

export default App
