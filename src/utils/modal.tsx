import { createRoot } from 'react-dom/client'
import { ConfigFormData, ConfigModal } from '../components/ConfigModal'

type ConfigOptions = ConfigFormData

export function showConfigModal(
  initialConfig: ConfigOptions,
  onSave: (config: ConfigOptions) => void
): void {
  // Check if we're in a browser environment (not SSR)
  if (typeof document === 'undefined') {
    return;
  }
  
  const modalContainer = document.createElement('div')
  document.body.appendChild(modalContainer)
  
  const root = createRoot(modalContainer)
  
  const handleClose = () => {
    root.unmount()
    modalContainer.remove()
  }
  
  root.render(
    <ConfigModal
      isOpen={true}
      onClose={handleClose}
      onSave={(config) => {
        onSave(config)
        handleClose()
      }}
      initialConfig={initialConfig}
    />
  )
} 