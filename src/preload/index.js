const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  // Move window by delta (dx, dy)
  moveWindow: (dx, dy) => {
    ipcRenderer.send('move-window', { dx, dy });
  },
  // Subscribe to cursor position updates from main process
  onCursorUpdate: (fn) => {
    ipcRenderer.on('cursor-update', (_, data) => fn(data));
  },
  // Subscribe to window bounds updates
  onWindowBounds: (fn) => {
    ipcRenderer.on('window-bounds', (_, data) => {
      window.petWindowBounds = data;
      fn(data);
    });
  },
});
