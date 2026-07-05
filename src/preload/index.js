const { contextBridge, ipcRenderer } = require('electron');

// Expose a clean API to the renderer
contextBridge.exposeInMainWorld('petAPI', {
  // Main -> Renderer events
  onCursorUpdate: (fn) => {
    ipcRenderer.on('cursor-update', (_, data) => fn(data));
  },
  onEdgeSnapped: (fn) => {
    ipcRenderer.on('edge-snapped', (_, data) => fn(data));
  },

  // Renderer -> Main: move the window by delta (dx, dy)
  moveWindow: (dx, dy) => {
    ipcRenderer.send('move-window', { dx, dy });
  },
});
