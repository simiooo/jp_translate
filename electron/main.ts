import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import type { BrowserWindowConstructorOptions } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import serve from 'electron-serve';
import electronSquirrelStartup from 'electron-squirrel-startup';

const isDev = process.env.NODE_ENV === 'development';
// const isDev = false
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle Squirrel.Windows startup events
if (electronSquirrelStartup) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const icon = isDev ? '../build/client/logo.png' :  path.join(process.resourcesPath, "client",'logo.png');
const loadURL = isDev ? serve({ directory: '../build/client' }) : serve({directory: path.join(process.resourcesPath, "client") } );

const createWindow = (): void => {
  // Create the browser window.
  const options: BrowserWindowConstructorOptions = {
    width: 1200,
    height: 800,
    minWidth:800,
    minHeight: 600,
    frame: false, // No border
    roundedCorners: true,
    icon: nativeImage.createFromPath(path.join(__dirname, icon)),
    webPreferences: {
      preload: isDev ? path.join(__dirname, 'preload.ts') : path.join(process.resourcesPath,"dist-electron", 'preload.js'),
      nodeIntegration: true,
    },
  };

  mainWindow = new BrowserWindow(options);

  // and load the index.html of the app.
  if (isDev) {
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL('http://localhost:5173'); // Default Vite dev server port
  } else {
    // mainWindow.webContents.openDevTools();
    loadURL(mainWindow);
  }
};

// Create system tray
const createTray = (): void => {
  const iconPath = path.join(__dirname, icon);
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '隐藏窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  // Double click the tray icon to show/hide the window
  tray.on('double-click', () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    } else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  createTray();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit the app when window is closed, just hide it
    // User can quit from the tray menu
  }
});

// Handle window close event (hide instead of close)
app.on('before-quit', () => {
  // This ensures the app quits properly when user selects Quit from tray menu
  mainWindow = null;
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Window control handlers
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.hide(); // Hide instead of close to keep app running in tray
  }
});