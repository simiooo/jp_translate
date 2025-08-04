// Electron API type declarations

declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      unmaximizeWindow: () => void;
      closeWindow: () => void;
      hideWindow: () => void;
      showWindow: () => void;
      isElectron: () => boolean;
    };
  }
}

export {};