/**
 * Main Application - Bootstraps the desktop pet
 * Initializes state machine, particle system, and event handlers
 */
(function () {
  'use strict';

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
  let petX = 160;
  let petY = 180;
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

    // Position bubble centered above the pet
    const bubbleX = containerRect.left + containerRect.width / 2 - bubbleRect.width / 2;
    const bubbleY = containerRect.top - bubbleRect.height - 12;

    bubble.style.left = bubbleX + 'px';
    bubble.style.top = bubbleY + 'px';
  }

  /**
   * Update hit zone position to follow the pet
   */
  function updateHitZone() {
    const rect = petContainer.getBoundingClientRect();
    const pad = 120;
    hitZone.style.left = (rect.left - pad) + 'px';
    hitZone.style.top = (rect.top - pad) + 'px';
    hitZone.style.width = (rect.width + pad * 2) + 'px';
    hitZone.style.height = (rect.height + pad * 2) + 'px';
  }

  /**
   * Initialize the pet position
   */
  function initPosition() {
    const rect = document.documentElement.getBoundingClientRect();
    petX = (rect.width - 200) / 2;
    petY = (rect.height - 350) / 2;
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
        particleSystem.startContinuous('sparkle', 0.12);
        dialogBubble.hide();
        break;

      case 'WALKING':
        body.classList.add('state-walking');
        particleSystem.startContinuous('sparkle', 0.2);
        dialogBubble.hide();
        break;

      case 'GREETING':
        body.classList.add('state-greeting');
        particleSystem.stopContinuous();
        // Heart burst from pet center
        const rect = petContainer.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        particleSystem.emit('heart', 15, cx, cy);
        break;

      case 'SLEEPING':
        body.classList.add('state-sleeping');
        particleSystem.startContinuous('zzz', 0.08);
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
      particleSystem.emit('sparkle', 8, petCX, petCY);
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
      particleSystem.emit('heart', 12, petCX, petCY);
      positionDialogBubble();
    }
  });

  /**
   * Handle mouse move for walking direction
   */
  hitZone.addEventListener('mousemove', (e) => {
    if (isDragging) return;

    const rect = petContainer.getBoundingClientRect();
    const petCX = rect.left + rect.width / 2;
    const petCY = rect.top + rect.height / 2;

    // Subtle tilt toward cursor
    const dx = e.clientX - petCX;
    const dy = e.clientY - petCY;
    const dist = Math.hypot(dx, dy);

    if (dist < 200 && stateMachine.state !== 'GREETING') {
      const tiltX = (dx / 200) * 5;
      const tiltY = (dy / 200) * 3;
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
      const canvasRect = particleCanvas.getBoundingClientRect();
      petX = Math.max(0, Math.min(e.clientX - canvasRect.left - dragOffsetX,
        canvasRect.width - 100));
      petY = Math.max(0, Math.min(e.clientY - canvasRect.top - dragOffsetY,
        canvasRect.height - 120));
      positionPet(petX, petY);
      updateHitZone();
      positionDialogBubble();
    }
  });

  /**
   * Handle cursor position updates from main process
   */
  if (window.petAPI) {
    window.petAPI.onCursorUpdate((data) => {
      if (isDragging) return;

      // Smooth follow: move pet slightly toward cursor
      if (stateMachine.state === 'WALKING') {
        const canvasRect = particleCanvas.getBoundingClientRect();
        const targetPx = data.x - canvasRect.left - 50;
        const targetPy = data.y - canvasRect.top - 60;

        // Clamp to window bounds
        targetX = Math.max(0, Math.min(targetPx, canvasRect.width - 100));
        targetY = Math.max(0, Math.min(targetPy, canvasRect.height - 120));

        // Smooth interpolation
        petX += (targetX - petX) * 0.08;
        petY += (targetY - petY) * 0.08;

        positionPet(petX, petY);
      }
    });

    window.petAPI.onEdgeSnapped((data) => {
      console.log('Pet snapped to edge:', data.position);
    });
  }

  /**
   * Handle window resize
   */
  window.addEventListener('resize', () => {
    particleSystem.resize();
    initPosition();
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
