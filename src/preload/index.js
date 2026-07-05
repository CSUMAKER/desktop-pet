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
});
