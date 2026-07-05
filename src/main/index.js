const { ipcMain } = require('electron');

const { app, BrowserWindow, screen, Menu, nativeTheme } = require('electron');
const path = require('path');
const EdgeDetector = require('./EdgeDetector');
const MouseTracker = require('./MouseTracker');

// CRITICAL: Must disable GPU before app ready on this system
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.disableHardwareAcceleration();

// Global crash handler
app.on('render-process-gone', (event, webContents, details) => {
  console.error('Render process crashed:', details.reason, details.exitCode);
});

app.on('child-process-gone', (event, details) => {
  console.error('Child process crashed:', details.reason, details.exitCode);
});

const WINDOW_SIZE = 50; // pet window size in pixels (square)

let petWindow = null;
let edgeDetector = null;
let mouseTracker = null;

// Right-click context menu
const contextMenuTemplate = [
  {
    label: '退出桌面宠物',
    click: () => {
      if (mouseTracker) mouseTracker.destroy();
      if (edgeDetector) edgeDetector.destroy();
      if (petWindow) petWindow.close();
      app.quit();
    },
  },
];
const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);

function createPetWindow() {
  // Center on the primary display
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workArea;

  const win = new BrowserWindow({
    x: Math.round((width - WINDOW_SIZE) / 2),
    y: Math.round((height - WINDOW_SIZE) / 2),
    width: WINDOW_SIZE,
    height: WINDOW_SIZE,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    acceptFirstMouse: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      spellCheck: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  win.loadFile(path.join(__dirname, '../renderer/index.html')).catch((err) => {
    console.error('Failed to load HTML:', err);
  });

  // Initialize edge detector and mouse tracker
  edgeDetector = new EdgeDetector(win);
  mouseTracker = new MouseTracker(win);
  mouseTracker.start();

  win.on('closed', () => {
    edgeDetector.destroy();
    mouseTracker.destroy();
    petWindow = null;
  });

  return win;
}

// Handle renderer -> main: move the pet window by delta
ipcMain.on('move-window', (event, { dx, dy }) => {
  if (petWindow && !petWindow.isDestroyed()) {
    const bounds = petWindow.getBounds();
    petWindow.setPosition(Math.round(bounds.x + dx), Math.round(bounds.y + dy), true);
  }
});

// Handle right-click context menu on the window
app.whenReady().then(() => {
  petWindow = createPetWindow();
  petWindow.on('context-menu', (_event, props) => {
    const { x, y } = props.displayMousePosition;
    contextMenu.popup({ window: petWindow, x, y });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    petWindow = createPetWindow();
  }
});

module.exports = { createPetWindow };
