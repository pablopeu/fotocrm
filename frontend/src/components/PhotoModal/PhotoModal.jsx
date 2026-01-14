import { useEffect, useState } from 'react'

export default function PhotoModal({ photo, isOpen, onClose, onCopyImage, onCopyText }) {
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setZoomed(false)
      return
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (zoomed) {
          setZoomed(false)
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, zoomed, onClose])

  if (!isOpen || !photo) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (zoomed) {
        setZoomed(false)
      } else {
        onClose()
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Vista de foto"
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors z-10"
        aria-label="Cerrar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className={`flex flex-col lg:flex-row max-w-6xl w-full mx-4 ${zoomed ? 'items-start' : 'items-center'} gap-4`}>
        {/* Imagen */}
        <div
          className={`
            relative bg-black rounded-lg overflow-hidden
            ${zoomed ? 'w-full max-h-[90vh] overflow-auto' : 'flex-1 max-h-[70vh]'}
          `}
        >
          <img
            src={photo.url}
            alt={photo.text || 'Foto de cuchillo'}
            className={`
              ${zoomed ? 'w-auto max-w-none cursor-zoom-out' : 'w-full h-full object-contain cursor-zoom-in'}
            `}
            onClick={() => setZoomed(!zoomed)}
          />

          {/* Indicador de zoom */}
          <div className="absolute bottom-4 left-4 px-2 py-1 bg-black/50 text-white text-xs rounded">
            {zoomed ? 'Click para alejar' : 'Click para zoom'}
          </div>
        </div>

        {/* Panel de información */}
        {!zoomed && (
          <div className="w-full lg:w-80 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl">
            {photo.steel_type && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded mb-3">
                {photo.steel_type}
              </span>
            )}

            <p className="text-gray-800 dark:text-gray-200 mb-4">
              {photo.text || 'Sin descripción'}
            </p>

            <div className="space-y-2">
              <button
                onClick={() => onCopyImage(photo)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Copiar imagen al portapapeles
              </button>

              <button
                onClick={() => onCopyText(photo)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Copiar texto al portapapeles
              </button>

              <button
                onClick={() => {
                  onCopyImage(photo)
                  setTimeout(() => onCopyText(photo), 100)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar ambos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
