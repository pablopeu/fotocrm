import Modal from './components/Modal'
import { useModal } from './hooks/useModal'

function App() {
  const { isOpen, modalProps, closeModal, showSuccess, showConfirm } = useModal()

  const handleTestModal = () => {
    showSuccess('FotoCRM', 'El sistema está funcionando correctamente.')
  }

  const handleTestConfirm = () => {
    showConfirm(
      'Confirmar acción',
      '¿Estás seguro de que deseas continuar?',
      () => console.log('Confirmado!')
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            FotoCRM
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Catálogo de cuchillos artesanales
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Sistema en desarrollo
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Frontend React + Tailwind CSS configurado correctamente.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleTestModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Test Modal Info
            </button>
            <button
              onClick={handleTestConfirm}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Test Modal Confirm
            </button>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        {...modalProps}
      />
    </div>
  )
}

export default App
