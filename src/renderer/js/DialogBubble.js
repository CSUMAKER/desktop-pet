/**
 * Dialog Bubble - Shows/hides speech bubbles with animation
 */
class DialogBubble {
  constructor() {
    this.element = document.getElementById('dialog-bubble');
    this.textElement = this.element.querySelector('.bubble-text');
    this.visible = false;
    this.timeout = null;
  }

  /** Show a dialog bubble with text */
  show(text, duration = 2500) {
    this.textElement.textContent = text;
    this.element.classList.remove('hidden');
    this.element.classList.add('visible', 'pop');

    // Remove pop animation class after it completes
    setTimeout(() => {
      this.element.classList.remove('pop');
    }, 400);

    this.visible = true;

    // Auto-hide after duration
    this._hideAfter(duration);
  }

  /** Hide the dialog bubble */
  hide() {
    this.element.classList.remove('visible', 'pop');
    this.element.classList.add('hidden');
    this.visible = false;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  /** Auto-hide after a delay */
  _hideAfter(ms) {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.hide();
    }, ms);
  }

  /** Reset to initial state */
  reset() {
    this.hide();
  }
}
