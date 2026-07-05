/**
 * Main Application - Bootstraps the desktop pet
 * Initializes state machine, particle system, and event handlers
 */
(function () {
  'use strict';

  // --- Constants ---
  const WINDOW_SIZE = 50; // matches main process
  const PET_SIZE = 36;    // effective pet display size
  const HIT_PAD = 10;     // extra padding around pet for hit zone

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

  // Current pet position (relative to window)
  let petX = (WINDOW_SIZE - PET_SIZE) / 2;
  let petY = (WINDOW_SIZE - PET_SIZE) / 2;
  let targetX = petX;
  let targetY = petY;

  // Drag state
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  /**
   * Position the pet sprite in the window
   */
  function positionPet(x, y) {
    petContainer.style.left = x + 'px';
    petContainer.style.top = y + 'px';
  }

  /**
   * Position the dialog bubble above the pet
   */
  function positionDialogBubble() {
    const containerRect = petContainer.getBoundingClientRect();
    const bubble = document.getElementById('dialog-bubble');
    const bubbleRect = bubble.getBoundingClientRect();

    // Position bubble centered above the pet, clipped to window
    const bubbleX = Math.max(0, Math.min(
      containerRect.left + containerRect.width / 2 - bubbleRect.width / 2,
      WINDOW_SIZE - bubbleRect.width
    ));
    const bubbleY = Math.max(0, containerRect.top - bubbleRect.height - 6);

    bubble.style.left = bubbleX + 'px';
    bubble.style.top = bubbleY + 'px';
  }

  /**
   * Update hit zone position to cover the pet vicinity
   */
  function updateHitZone() {
    const pad = HIT_PAD;
    hitZone.style.left = (-pad) + 'px';
    hitZone.style.top = (-pad) + 'px';
    hitZone.style.width = (WINDOW_SIZE + pad * 2) + 'px';
    hitZone.style.height = (WINDOW_SIZE + pad * 2) + 'px';
  }

  /**
   * Initialize the pet position (centered in window)
   */
  function initPosition() {
    petX = (WINDOW_SIZE - PET_SIZE) / 2;
    petY = (WINDOW_SIZE - PET_SIZE) / 2;
    targetX = petX;
    targetY = petY;
    positionPet(petX, petY);
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
        particleSystem.startContinuous('sparkle', 0.08);
        dialogBubble.hide();
        break;

      case 'WALKING':
        body.classList.add('state-walking');
        particleSystem.startContinuous('sparkle', 0.12);
        dialogBubble.hide();
        break;

      case 'GREETING':
        body.classList.add('state-greeting');
        particleSystem.stopContinuous();
        // Heart burst from pet center
        const rect = petContainer.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        particleSystem.emit('heart', 8, cx, cy);
        break;

      case 'SLEEPING':
        body.classList.add('state-sleeping');
        particleSystem.startContinuous('zzz', 0.05);
        dialogBubble.hide();
        break;
    }
  }

  stateMachine.onStateChange(onStateChange);

  /**
   * Handle click on hit zone (covers pet vicinity)
   */
  hitZone.addEventListener('click', (e) => {
    const sm = stateMachine;
    const rect = petContainer.getBoundingClientRect();
    const petCX = rect.left + rect.width / 2;
    const petCY = rect.top + rect.height / 2;

    if (sm.state === 'SLEEPING') {
      // Wake up!
      sm.wakeUp();
      dialogBubble.show('唔...几点了？');
      particleSystem.emit('sparkle', 5, petCX, petCY);
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
      particleSystem.emit('heart', 6, petCX, petCY);
      positionDialogBubble();
    }
  });

  /**
   * Handle mouse move for subtle tilt toward cursor
   */
  hitZone.addEventListener('mousemove', (e) => {
    if (isDragging) return;

    const rect = petContainer.getBoundingClientRect();
    const petCX = rect.left + rect.width / 2;
    const petCY = rect.top + rect.height / 2;

    const dx = e.clientX - petCX;
    const dy = e.clientY - petCY;
    const dist = Math.hypot(dx, dy);

    // Tilt when cursor is near the small window
    if (dist < 60 && stateMachine.state !== 'GREETING') {
      const tiltX = (dx / 60) * 8;
      const tiltY = (dy / 60) * 5;
      petSprite.style.transform = `rotateY(${tiltX}deg) rotateX(${-tiltY}deg)`;
    }
  });

  /**
   * Handle shift+drag to reposition pet
   */
  hitZone.addEventListener('mousedown', (e) => {
    if (e.shiftKey) {
      isDragging = true;
      const rect = petContainer.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
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
      petX = Math.max(0, Math.min(e.clientX - dragOffsetX, WINDOW_SIZE - PET_SIZE));
      petY = Math.max(0, Math.min(e.clientY - dragOffsetY, WINDOW_SIZE - PET_SIZE));
      positionPet(petX, petY);
      updateHitZone();
      positionDialogBubble();
    }
  });

  /**
   * Handle cursor position updates from main process
   * In a small window, the pet walks toward the cursor directly
   */
  if (window.petAPI) {
    window.petAPI.onCursorUpdate((data) => {
      if (isDragging) return;

      // Smooth follow: move pet toward cursor position
      if (stateMachine.state === 'WALKING') {
        // Cursor is already in screen coords; pet moves within the small window
        targetX = Math.max(0, Math.min(data.x - dragOffsetX, WINDOW_SIZE - PET_SIZE));
        targetY = Math.max(0, Math.min(data.y - dragOffsetY, WINDOW_SIZE - PET_SIZE));

        // Smooth interpolation
        petX += (targetX - petX) * 0.08;
        petY += (targetY - petY) * 0.08;

        positionPet(petX, petY);
        updateHitZone();
      }
    });

    window.petAPI.onEdgeSnapped((data) => {
      // Edge snap is less relevant with a tiny window
    });
  }

  /**
   * Handle window resize (unlikely with fixed size, but safe)
   */
  window.addEventListener('resize', () => {
    particleSystem.resize();
    updateHitZone();
  });

  /**
   * Initialize!
   */
  function init() {
    initPosition();
    particleSystem.resize();
    updateHitZone();

    // Start in IDLE state (which will trigger the first timer)
    stateMachine.setState('IDLE');

    console.log('🐧 Desktop pet initialized!');
    console.log('  Click on the pet to interact');
    console.log('  Shift+Drag to reposition');
  }

  init();
})();
