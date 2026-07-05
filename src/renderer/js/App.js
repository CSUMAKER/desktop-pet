/**
 * Main Application - Bootstraps the desktop pet
 * Initializes state machine, particle system, and event handlers
 */
(function () {
  'use strict';

  // --- Constants ---
  const WINDOW_SIZE = 50; // matches main process

  // DOM elements
  const petContainer = document.getElementById('pet-container');
  const petSprite = document.getElementById('pet-sprite');
  const hitZone = document.getElementById('hit-zone');
  const particleCanvas = document.getElementById('particle-canvas');

  // Initialize systems
  const stateMachine = new StateMachine();
  const particleSystem = new ParticleSystem(particleCanvas);
  const dialogBubble = new DialogBubble();

  // Global references for event handlers
  window.petStateMachine = stateMachine;
  window.particleSystem = particleSystem;
  window.dialogBubble = dialogBubble;

  // Drag state for moving the window
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  /**
   * Initialize hit zone to cover the entire window + padding
   */
  function initHitZone() {
    hitZone.style.left = '-10px';
    hitZone.style.top = '-10px';
    hitZone.style.width = (WINDOW_SIZE + 20) + 'px';
    hitZone.style.height = (WINDOW_SIZE + 20) + 'px';
  }

  /**
   * Handle state change visual updates
   */
  function onStateChange(oldState, newState) {
    const body = document.body;

    // Remove all state classes
    body.classList.remove('state-idle', 'state-walking', 'state-greeting', 'state-sleeping');

    // Add new state class
    switch (newState) {
      case 'IDLE':
        body.classList.add('state-idle');
        particleSystem.startContinuous('sparkle', 0.06);
        dialogBubble.hide();
        break;

      case 'WALKING':
        body.classList.add('state-walking');
        particleSystem.startContinuous('sparkle', 0.1);
        dialogBubble.hide();
        break;

      case 'GREETING':
        body.classList.add('state-greeting');
        particleSystem.stopContinuous();
        // Heart burst from pet center (center of window)
        const cx = WINDOW_SIZE / 2;
        const cy = WINDOW_SIZE / 2;
        particleSystem.emit('heart', 6, cx, cy);
        break;

      case 'SLEEPING':
        body.classList.add('state-sleeping');
        particleSystem.startContinuous('zzz', 0.04);
        dialogBubble.hide();
        break;
    }
  }

  stateMachine.onStateChange(onStateChange);

  /**
   * Handle click on hit zone (covers entire window + padding)
   */
  hitZone.addEventListener('click', (e) => {
    const sm = stateMachine;
    const cx = WINDOW_SIZE / 2;
    const cy = WINDOW_SIZE / 2;

    if (sm.state === 'SLEEPING') {
      // Wake up!
      sm.wakeUp();
      dialogBubble.show('唔...几点了？');
      particleSystem.emit('sparkle', 4, cx, cy);
      positionDialogBubble();
    } else if (sm.state === 'IDLE' || sm.state === 'WALKING') {
      // Greet!
      sm.greet();
      const phrases = [
        '咕咕嘎嘎！',
        '喵~',
        '今天也要开心哦！',
        '摸摸头~',
        '咕咕！',
        '人家是企鹅啦！',
        '要一起去冒险吗？',
        '嘿嘿，好开心！',
      ];
      dialogBubble.show(phrases[Math.floor(Math.random() * phrases.length)]);
      particleSystem.emit('heart', 5, cx, cy);
      positionDialogBubble();
    }
  });

  /**
   * Position the dialog bubble above the pet (center of window)
   */
  function positionDialogBubble() {
    const bubble = document.getElementById('dialog-bubble');
    const bubbleRect = bubble.getBoundingClientRect();

    // Center horizontally in window, position above
    const bubbleX = Math.max(0, Math.min(
      WINDOW_SIZE / 2 - bubbleRect.width / 2,
      WINDOW_SIZE - bubbleRect.width
    ));
    const bubbleY = -bubbleRect.height - 4;

    bubble.style.left = bubbleX + 'px';
    bubble.style.top = bubbleY + 'px';
  }

  /**
   * Handle shift+drag to move the window position
   * Uses screenX/screenY deltas to calculate new window position
   */
  hitZone.addEventListener('mousedown', (e) => {
    if (e.shiftKey) {
      isDragging = true;
      dragStartX = e.screenX;
      dragStartY = e.screenY;
      hitZone.style.cursor = 'grabbing';

      // Disable edge detection during drag
      if (window.edgeDetector) {
        window.edgeDetector.disable();
      }
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (isDragging) {
      isDragging = false;
      hitZone.style.cursor = 'default';

      // Re-enable edge detection
      if (window.edgeDetector) {
        window.edgeDetector.enable();
      }
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.screenX - dragStartX;
      const dy = e.screenY - dragStartY;

      // Request main process to move the window
      if (window.petAPI) {
        window.petAPI.moveWindow(dx, dy);
      }

      // Update drag start for next delta
      dragStartX = e.screenX;
      dragStartY = e.screenY;
    }
  });

  /**
   * Handle cursor position updates from main process (kept for compatibility)
   */
  if (window.petAPI) {
    window.petAPI.onEdgeSnapped((data) => {
      // Edge snap handled by main process
    });
  }

  /**
   * Handle window resize (unlikely with fixed size, but safe)
   */
  window.addEventListener('resize', () => {
    particleSystem.resize();
    initHitZone();
  });

  /**
   * Initialize!
   */
  function init() {
    particleSystem.resize();
    initHitZone();

    // Start in IDLE state (which will trigger the first timer)
    stateMachine.setState('IDLE');

    console.log('🐧 Desktop pet initialized!');
    console.log('  Click on the pet to interact');
    console.log('  Shift+Drag to move window');
  }

  init();
})();
