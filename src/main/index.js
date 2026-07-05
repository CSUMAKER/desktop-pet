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
  // Get the bounds of all displays combined
  const displays = screen.getAllDisplays();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const display of displays) {
    minX = Math.min(minX, display.workArea.x);
    minY = Math.min(minY, display.workArea.y);
    maxX = Math.max(maxX, display.workArea.x + display.workArea.width);
    maxY = Math.max(maxY, display.workArea.y + display.workArea.height);
  }

  const win = new BrowserWindow({
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    frame: false,
    transparent: false,
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

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

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
