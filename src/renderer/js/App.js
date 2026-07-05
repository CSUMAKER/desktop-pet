/**
 * Main Application - Bootstraps the desktop pet
 * Initializes state machine, particle system, and event handlers
 */
(function () {
  'use strict';

  // --- Constants ---
  const WINDOW_SIZE = 60; // matches main process

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

  // Drag state
  let isDragging = false;
  let dragStartScreenX = 0;
  let dragStartScreenY = 0;

  /**
   * Handle state change visual updates
   */
  function onStateChange(oldState, newState) {
    const body = document.body;

    body.classList.remove('state-idle', 'state-walking', 'state-greeting', 'state-sleeping');

    switch (newState) {
      case 'IDLE':
        body.classList.add('state-idle');
        particleSystem.startContinuous('sparkle', 0.05);
        dialogBubble.hide();
        break;

      case 'WALKING':
        body.classList.add('state-walking');
        particleSystem.startContinuous('sparkle', 0.08);
        dialogBubble.hide();
        break;

      case 'GREETING':
        body.classList.add('state-greeting');
        particleSystem.stopContinuous();
        particleSystem.emit('heart', 5, WINDOW_SIZE / 2, WINDOW_SIZE / 2);
        break;

      case 'SLEEPING':
        body.classList.add('state-sleeping');
        particleSystem.startContinuous('zzz', 0.03);
        dialogBubble.hide();
        break;
    }
  }

  stateMachine.onStateChange(onStateChange);

  /**
   * Handle click on hit zone
   */
  hitZone.addEventListener('click', (e) => {
    const sm = stateMachine;
    const cx = WINDOW_SIZE / 2;
    const cy = WINDOW_SIZE / 2;

    if (sm.state === 'SLEEPING') {
      sm.wakeUp();
      dialogBubble.show('唔...几点了？');
      particleSystem.emit('sparkle', 4, cx, cy);
      positionDialogBubble();
    } else if (sm.state === 'IDLE' || sm.state === 'WALKING') {
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
      particleSystem.emit('heart', 4, cx, cy);
      positionDialogBubble();
    }
  });

  /**
   * Position dialog bubble inside the window, above the pet
   */
  function positionDialogBubble() {
    const bubble = document.getElementById('dialog-bubble');
    const bubbleRect = bubble.getBoundingClientRect();

    const bubbleX = Math.max(2, Math.min(
      WINDOW_SIZE / 2 - bubbleRect.width / 2,
      WINDOW_SIZE - bubbleRect.width - 2
    ));
    const bubbleY = 2;

    bubble.style.left = bubbleX + 'px';
    bubble.style.top = bubbleY + 'px';
  }

  /**
   * Handle plain drag to move the window (no shift key needed)
   */
  hitZone.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartScreenX = e.screenX;
    dragStartScreenY = e.screenY;
    hitZone.classList.add('grabbing');

    if (window.edgeDetector) {
      window.edgeDetector.disable();
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      hitZone.classList.remove('grabbing');

      if (window.edgeDetector) {
        window.edgeDetector.enable();
      }
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.screenX - dragStartScreenX;
      const dy = e.screenY - dragStartScreenY;

      if (window.petAPI) {
        window.petAPI.moveWindow(dx, dy);
      }

      dragStartScreenX = e.screenX;
      dragStartScreenY = e.screenY;
    }
  });

  /**
   * Handle window resize
   */
  window.addEventListener('resize', () => {
    particleSystem.resize();
  });

  /**
   * Initialize!
   */
  function init() {
    particleSystem.resize();

    // Start in IDLE state
    stateMachine.setState('IDLE');

    console.log('🐧 Desktop pet initialized!');
    console.log('  Click on the pet to interact');
    console.log('  Drag to move the window');
  }

  init();
})();
