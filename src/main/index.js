const { ipcMain } = require('electron');
const { app, BrowserWindow, screen, Menu } = require('electron');
const path = require('path');
const EdgeDetector = require('./EdgeDetector');
const MouseTracker = require('./MouseTracker');

// Disable GPU for compatibility
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-computing');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.disableHardwareAcceleration();

// Crash handlers
app.on('render-process-gone', (event, webContents, details) => {
  console.error('Render process crashed:', details.reason, details.exitCode);
});

app.on('child-process-gone', (event, details) => {
  console.error('Child process crashed:', details.reason, details.exitCode);
});

const WINDOW_SIZE = 60;

let petWindow = null;
let edgeDetector = null;
let mouseTracker = null;

// Quit context menu
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

  edgeDetector = new EdgeDetector(win);
  mouseTracker = new MouseTracker(win);
  mouseTracker.start();

  // Send window bounds periodically so renderer can convert cursor to local coords
  const boundsInterval = setInterval(() => {
    if (!petWindow || petWindow.isDestroyed()) {
      clearInterval(boundsInterval);
      return;
    }
    const bounds = petWindow.getBounds();
    petWindow.webContents.send('window-bounds', {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
  }, 100);

  win.on('closed', () => {
    edgeDetector.destroy();
    mouseTracker.destroy();
    petWindow = null;
  });

  return win;
}

// Handle renderer -> main: move window by delta
ipcMain.on('move-window', (event, { dx, dy }) => {
  if (petWindow && !petWindow.isDestroyed()) {
    const bounds = petWindow.getBounds();
    petWindow.setPosition(
      Math.round(bounds.x + dx),
      Math.round(bounds.y + dy),
      true
    );
  }
});

// Right-click context menu on the pet window
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
