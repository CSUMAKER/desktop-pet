/**
 * State Machine for the desktop pet
 * Manages idle, walking, greeting, and sleeping states
 */
class StateMachine {
  constructor(options = {}) {
    this.state = 'IDLE';
    this.listeners = [];
    this.timers = [];

    // Configurable timing (milliseconds)
    this.config = {
      idleMinDuration: options.idleMinDuration || 3000,
      idleMaxDuration: options.idleMaxDuration || 15000,
      walkDuration: options.walkDuration || 3000,
      greetDuration: options.greetDuration || 3000,
      sleepMinDuration: options.sleepMinDuration || 10000,
      sleepMaxDuration: options.sleepMaxDuration || 30000,
      walkProbability: options.walkProbability || 0.35,
    };
  }

  /** Register a listener for state changes */
  onStateChange(listener) {
    this.listeners.push(listener);
  }

  /** Transition to a new state */
  setState(newState) {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState.toUpperCase();

    // Clear any pending timers
    this._clearTimers();

    // Notify listeners
    this.listeners.forEach(fn => fn(oldState, this.state));

    // Schedule next state
    this._scheduleNext();
  }

  /** Get current state */
  getState() {
    return this.state;
  }

  /** Trigger greeting interaction */
  greet() {
    this.setState('GREETING');
  }

  /** Wake up from sleep */
  wakeUp() {
    this.setState('IDLE');
  }

  /** Force walking state */
  startWalking() {
    this.setState('WALKING');
  }

  /** Force sleeping state */
  startSleeping() {
    this.setState('SLEEPING');
  }

  /** Internal: schedule the next state transition */
  _scheduleNext() {
    switch (this.state) {
      case 'IDLE':
        // Random chance to walk or sleep
        if (Math.random() < this.config.walkProbability) {
          const delay = this.config.idleMinDuration +
            Math.random() * (this.config.idleMaxDuration - this.config.idleMinDuration);
          this.timers.push(setTimeout(() => this.setState('WALKING'), delay));
        } else {
          const delay = this.config.idleMinDuration +
            Math.random() * (this.config.sleepMinDuration - this.config.idleMinDuration);
          this.timers.push(setTimeout(() => this.setState('SLEEPING'), delay));
        }
        break;

      case 'WALKING':
        this.timers.push(setTimeout(() => this.setState('IDLE'), this.config.walkDuration));
        break;

      case 'GREETING':
        this.timers.push(setTimeout(() => this.setState('IDLE'), this.config.greetDuration));
        break;

      case 'SLEEPING':
        // Stays sleeping until woken up by user interaction
        break;
    }
  }

  /** Clear all pending timers */
  _clearTimers() {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }

  /** Cleanup */
  destroy() {
    this._clearTimers();
    this.listeners = [];
  }
}
