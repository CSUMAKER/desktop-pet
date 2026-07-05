const { ipcMain, screen } = require('electron');

const SNAP_THRESHOLD = 25; // pixels from edge to trigger snap
const CHECK_INTERVAL = 500; // ms between edge checks

class EdgeDetector {
  constructor(petWindow) {
    this.window = petWindow;
    this.snappingEnabled = true;
    this.stuckSide = null;
    this.setupListeners();
  }

  setupListeners() {
    // Listen for window movement
    this.window.on('will-move', () => {
      if (this.snappingEnabled) {
        this.checkAndSnap();
      }
    });

    // Periodic check
    this.timer = setInterval(() => {
      if (this.snappingEnabled) {
        this.checkAndSnap();
      }
    }, CHECK_INTERVAL);
  }

  checkAndSnap() {
    if (!this.window || this.window.isDestroyed()) return;

    const bounds = this.window.getBounds();
    const displays = screen.getAllDisplays();

    for (const display of displays) {
      const b = display.workArea;

      // Check each edge
      const left = Math.abs(bounds.x - b.x) < SNAP_THRESHOLD;
      const right = Math.abs((bounds.x + bounds.width) - (b.x + b.width)) < SNAP_THRESHOLD;
      const top = Math.abs(bounds.y - b.y) < SNAP_THRESHOLD;
      const bottom = Math.abs((bounds.y + bounds.height) - (b.y + b.height)) < SNAP_THRESHOLD;

      if (left) {
        this.snapTo(bounds, b.x, bounds.y);
        return;
      }
      if (right) {
        this.snapTo(bounds, b.x + b.width - bounds.width, bounds.y);
        return;
      }
      if (top) {
        this.snapTo(bounds, b.x, b.y);
        return;
      }
      if (bottom) {
        this.snapTo(bounds, bounds.x, b.y + b.height - bounds.height);
        return;
      }
    }

    // No edge detected, release stickiness
    if (this.stuckSide) {
      this.stuckSide = null;
    }
  }

  snapTo(currentBounds, snapX, snapY) {
    if (!this.window || this.window.isDestroyed()) return;

    // Only snap if we're close to the target position
    const dx = Math.abs(currentBounds.x - snapX);
    const dy = Math.abs(currentBounds.y - snapY);

    if (dx < SNAP_THRESHOLD * 2 && dy < SNAP_THRESHOLD * 2) {
      this.window.setBounds({
        x: Math.round(snapX),
        y: Math.round(snapY),
        width: currentBounds.width,
        height: currentBounds.height,
      });

      // Notify renderer
      if (!this.window.isDestroyed()) {
        this.window.webContents.send('edge-snapped', {
          position: { x: Math.round(snapX), y: Math.round(snapY) },
        });
      }
    }
  }

  disable() {
    this.snappingEnabled = false;
    clearInterval(this.timer);
  }

  enable() {
    this.snappingEnabled = true;
    this.timer = setInterval(() => {
      if (this.snappingEnabled) {
        this.checkAndSnap();
      }
    }, CHECK_INTERVAL);
  }

  destroy() {
    clearInterval(this.timer);
  }
}

module.exports = EdgeDetector;
