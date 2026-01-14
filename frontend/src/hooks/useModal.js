import { useState, useCallback } from 'react'

export function useModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [modalProps, setModalProps] = useState({})

  const openModal = useCallback((props = {}) => {
    setModalProps(props)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setModalProps({})
  }, [])

  const showSuccess = useCallback((title, message) => {
    openModal({ type: 'success', title, children: message })
  }, [openModal])

  const showError = useCallback((title, message) => {
    openModal({ type: 'error', title, children: message })
  }, [openModal])

  const showInfo = useCallback((title, message) => {
    openModal({ type: 'info', title, children: message })
  }, [openModal])

  const showConfirm = useCallback((title, message, onConfirm) => {
    openModal({
      type: 'confirm',
      title,
      children: message,
      onConfirm: () => {
        onConfirm()
        closeModal()
      },
    })
  }, [openModal, closeModal])

  return {
    isOpen,
    modalProps,
    openModal,
    closeModal,
    showSuccess,
    showError,
    showInfo,
    showConfirm,
  }
}
