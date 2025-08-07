// Utility to detect if the app is running in Electron environment
interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  unmaximizeWindow: () => void;
  closeWindow: () => void;
  hideWindow: () => void;
  showWindow: () => void;
  isElectron: () => boolean;
}
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const isElectron = (): boolean => {
  
  // Check if the electronAPI is available in the window object
  return !!window?.electronAPI?.isElectron();
};

// Type-safe wrapper for Electron API calls
export const electronAPI = (): ElectronAPI | null => {
  if (!isElectron()) {
    return null;
  }

  return window?.electronAPI || null;
};
