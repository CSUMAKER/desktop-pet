const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  // Move window by delta (dx, dy)
  moveWindow: (dx, dy) => {
    ipcRenderer.send('move-window', { dx, dy });
  },
});
