const { ipcMain, screen } = require('electron');

class MouseTracker {
  constructor(petWindow) {
    this.window = petWindow;
    this.interval = 50; // ms between cursor updates
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => {
      if (!this.window || this.window.isDestroyed()) {
        this.stop();
        return;
      }

      try {
        const cursorPoint = screen.getCursorScreenPoint();
        this.window.webContents.send('cursor-update', {
          x: cursorPoint.x,
          y: cursorPoint.y,
        });
      } catch (e) {
        // Window may have been destroyed between check and send
        this.stop();
      }
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  destroy() {
    this.stop();
  }
}

module.exports = MouseTracker;
