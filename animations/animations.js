/**
 * AnimationManager - Core Animation Management Class
 * Handles animation sequences, sprites, and transitions with performance optimization
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class AnimationManager {
  constructor(options = {}) {
    // Configuration options
    this.options = {
      enableDebugLogs: false,
      useRequestAnimationFrame: true,
      defaultDuration: 1000,
      defaultEasing: "ease-in-out",
      maxAnimations: 100,
      useHardwareAcceleration: true,
      spriteSheetSupport: true,
      autoCleanup: true,
      ...options,
    };

    // Core animation storage
    this.animations = new Map();
    this.sequences = new Map();
    this.activeAnimations = new Set();
    this.spriteSheets = new Map();
    this.animationCounter = 0;

    // Animation frame tracking
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.isRunning = false;

    // Performance metrics
    this.metrics = {
      framesProcessed: 0,
      animationsCompleted: 0,
      averageFrameTime: 0,
      totalFrameTime: 0,
      peakFrameTime: 0,
    };

    // Initialize the system
    this.init();
  }

  /**
   * Initialize the animation system
   */
  init() {
    try {
      this.log("Initializing AnimationManager...");

      // Set up global CSS variables if hardware acceleration is enabled
      if (this.options.useHardwareAcceleration) {
        this.setupHardwareAcceleration();
      }

      // Start the animation loop if using requestAnimationFrame
      if (this.options.useRequestAnimationFrame) {
        this.startAnimationLoop();
      }

      // Create event listeners
      this.setupEventListeners();

      this.log("AnimationManager initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize AnimationManager:", error);
      return false;
    }
  }

  /**
   * Set up hardware acceleration CSS
   * @private
   */
  setupHardwareAcceleration() {
    // Create a style element for dynamic CSS
    const style = document.createElement("style");
    style.textContent = `
      .animation-accelerated {
        will-change: transform, opacity;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
    `;
    document.head.appendChild(style);
    this.log("Hardware acceleration styles applied");
  }

  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Listen for visibility change to pause animations when tab is inactive
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseAll();
      } else {
        this.resumeAll();
      }
    });

    // Listen for window resize to adjust animations if needed
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  /**
   * Handle window resize events
   * @private
   */
  handleResize() {
    // Pause briefly during resize for performance
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    const wasRunning = this.isRunning;
    this.pauseAll();

    this.resizeTimeout = setTimeout(() => {
      if (wasRunning) {
        this.resumeAll();
      }
      this.resizeTimeout = null;
    }, 150);
  }

  /**
   * Start the main animation loop
   * @private
   */
  startAnimationLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(
      this.animationLoop.bind(this)
    );
    this.log("Animation loop started");
  }

  /**
   * Stop the animation loop
   * @private
   */
  stopAnimationLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.isRunning = false;
      this.log("Animation loop stopped");
    }
  }

  /**
   * Main animation loop
   * @private
   * @param {number} timestamp - Current frame timestamp
   */
  animationLoop(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Update performance metrics
    this.metrics.framesProcessed++;
    this.metrics.totalFrameTime += deltaTime;
    this.metrics.averageFrameTime =
      this.metrics.totalFrameTime / this.metrics.framesProcessed;
    this.metrics.peakFrameTime = Math.max(
      this.metrics.peakFrameTime,
      deltaTime
    );

    // Process active animations
    if (this.activeAnimations.size > 0) {
      for (const animationId of this.activeAnimations) {
        const animation = this.animations.get(animationId);
        if (animation) {
          this.updateAnimation(animation, deltaTime);
        }
      }
    }

    // Continue the loop if we have active animations or should keep running
    if (this.activeAnimations.size > 0 || this.isRunning) {
      this.animationFrameId = requestAnimationFrame(
        this.animationLoop.bind(this)
      );
    }
  }

  /**
   * Update a single animation
   * @private
   * @param {Object} animation - Animation object
   * @param {number} deltaTime - Time since last frame in ms
   */
  updateAnimation(animation, deltaTime) {
    if (!animation.isPlaying) return;

    // Update elapsed time
    animation.elapsedTime += deltaTime * animation.playbackRate;

    // Calculate progress (0 to 1)
    let progress = Math.min(animation.elapsedTime / animation.duration, 1);

    // Apply easing
    progress = this.applyEasing(progress, animation.easing);

    // Handle direction
    if (animation.direction === "reverse") {
      progress = 1 - progress;
    } else if (animation.direction === "alternate") {
      if (animation.isReversed) {
        progress = 1 - progress;
      }
    }

    // Update animation
    if (animation.type === "sprite") {
      this.updateSpriteAnimation(animation, progress);
    } else if (animation.type === "css") {
      this.updateCssAnimation(animation, progress);
    } else if (animation.type === "property") {
      this.updatePropertyAnimation(animation, progress);
    }

    // Execute onUpdate callback
    if (typeof animation.onUpdate === "function") {
      try {
        animation.onUpdate(animation, progress);
      } catch (error) {
        this.log(`Error in onUpdate callback: ${error.message}`, "error");
      }
    }

    // Check if animation is complete
    if (animation.elapsedTime >= animation.duration) {
      this.handleAnimationComplete(animation);
    }
  }

  /**
   * Update a sprite animation
   * @private
   * @param {Object} animation - Animation object
   * @param {number} progress - Animation progress (0-1)
   */
  updateSpriteAnimation(animation, progress) {
    const { element, frames, frameWidth, frameHeight, framesPerRow } =
      animation;

    // Calculate current frame
    const totalFrames = frames.length;
    const frameIndex = Math.min(
      Math.floor(progress * totalFrames),
      totalFrames - 1
    );
    const frameNumber = frames[frameIndex];

    // Calculate position in the sprite sheet
    const row = Math.floor(frameNumber / framesPerRow);
    const col = frameNumber % framesPerRow;

    // Update element background position
    element.style.backgroundPosition = `-${col * frameWidth}px -${
      row * frameHeight
    }px`;
  }

  /**
   * Update a CSS animation
   * @private
   * @param {Object} animation - Animation object
   * @param {number} progress - Animation progress (0-1)
   */
  updateCssAnimation(animation, progress) {
    const { element, properties } = animation;

    // Apply each property
    for (const [prop, propData] of Object.entries(properties)) {
      if (prop === "transform") {
        // Handle transform properties specially
        this.applyTransformProperty(element, propData, progress);
      } else {
        // Handle regular CSS properties
        const value = this.interpolate(propData.from, propData.to, progress);
        element.style[prop] = `${value}${propData.unit || ""}`;
      }
    }
  }

  /**
   * Apply transform property with proper handling
   * @private
   * @param {HTMLElement} element - Target element
   * @param {Object} propData - Property data with from, to, transformType
   * @param {number} progress - Animation progress (0-1)
   */
  applyTransformProperty(element, propData, progress) {
    const value = this.interpolate(propData.from, propData.to, progress);

    // Apply the transform based on its type
    if (propData.transformType) {
      switch (propData.transformType) {
        case "translateX":
          element.style.transform = `translateX(${value}px)`;
          break;
        case "translateY":
          element.style.transform = `translateY(${value}px)`;
          break;
        case "scale":
          element.style.transform = `scale(${value})`;
          break;
        case "rotate":
          element.style.transform = `rotate(${value}deg)`;
          break;
        case "scaleX":
          element.style.transform = `scaleX(${value})`;
          break;
        case "scaleY":
          element.style.transform = `scaleY(${value})`;
          break;
        default:
          element.style.transform = `${propData.transformType}(${value}${
            propData.unit || ""
          })`;
      }
    } else {
      // Fallback for complex transforms
      element.style.transform = `${value}${propData.unit || ""}`;
    }
  }

  /**
   * Update a property animation (for non-DOM objects)
   * @private
   * @param {Object} animation - Animation object
   * @param {number} progress - Animation progress (0-1)
   */
  updatePropertyAnimation(animation, progress) {
    const { target, properties } = animation;

    // Apply each property
    for (const [prop, { from, to }] of Object.entries(properties)) {
      const value = this.interpolate(from, to, progress);
      target[prop] = value;
    }
  }

  /**
   * Handle animation completion
   * @private
   * @param {Object} animation - Animation object
   */
  handleAnimationComplete(animation) {
    this.metrics.animationsCompleted++;

    // Handle iteration behavior
    animation.currentIteration++;

    if (
      animation.iterations === "infinite" ||
      animation.currentIteration < animation.iterations
    ) {
      // Reset for next iteration
      animation.elapsedTime = 0;

      // Handle alternate direction
      if (animation.direction === "alternate") {
        animation.isReversed = !animation.isReversed;
      }
    } else {
      // Animation complete
      animation.isPlaying = false;
      this.activeAnimations.delete(animation.id);

      // Execute onComplete callback
      if (typeof animation.onComplete === "function") {
        try {
          animation.onComplete(animation);
        } catch (error) {
          this.log(`Error in onComplete callback: ${error.message}`, "error");
        }
      }

      // Check if this animation is part of a sequence
      if (animation.sequenceId) {
        this.advanceSequence(animation.sequenceId);
      }

      // Don't auto cleanup if animation is part of a sequence
      if (this.options.autoCleanup && !animation.sequenceId) {
        this.animations.delete(animation.id);
      }
    }
  }

  /**
   * Advance to the next animation in a sequence
   * @private
   * @param {string} sequenceId - Sequence identifier
   */
  advanceSequence(sequenceId) {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return;

    sequence.currentIndex++;

    if (sequence.currentIndex < sequence.animations.length) {
      // Start the next animation in the sequence
      const nextAnimId = sequence.animations[sequence.currentIndex];
      const nextAnim = this.animations.get(nextAnimId);

      if (nextAnim) {
        this.play(nextAnimId);
      }
    } else if (
      sequence.iterations === "infinite" ||
      sequence.currentIteration < sequence.iterations
    ) {
      // Restart the sequence
      sequence.currentIteration++;
      sequence.currentIndex = 0;

      const firstAnimId = sequence.animations[0];
      if (firstAnimId) {
        this.play(firstAnimId);
      }
    } else {
      // Sequence complete
      if (typeof sequence.onComplete === "function") {
        try {
          sequence.onComplete(sequence);
        } catch (error) {
          this.log(
            `Error in sequence onComplete callback: ${error.message}`,
            "error"
          );
        }
      }
    }
  }

  /**
   * Parse and process a transform value
   * @private
   * @param {string} transformValue - Transform value like "translateX(-200px)"
   * @returns {Object} - Parsed transform data
   */
  parseTransformValue(transformValue) {
    if (typeof transformValue !== "string") {
      return { transformType: null, value: 0, unit: "" };
    }

    // Match transform functions like translateX(-200px), scale(1.5), rotate(45deg)
    const transformMatch = transformValue.match(/([a-zA-Z]+)\(([^)]+)\)/);

    if (transformMatch) {
      const transformType = transformMatch[1];
      const valueStr = transformMatch[2];
      const value = parseFloat(valueStr) || 0;
      const unit = this.getUnitFromValue(valueStr);

      return { transformType, value, unit };
    }

    // Fallback for simple values
    return {
      transformType: null,
      value: parseFloat(transformValue) || 0,
      unit: this.getUnitFromValue(transformValue),
    };
  }

  /**
   * Create a CSS animation
   * @param {HTMLElement} element - Element to animate
   * @param {Object} properties - Properties to animate
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  createCssAnimation(element, properties, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
      this.log("Invalid element for CSS animation", "error");
      return null;
    }

    // Process properties
    const processedProperties = {};
    for (const [prop, value] of Object.entries(properties)) {
      // Handle different formats
      if (typeof value === "object" && "from" in value && "to" in value) {
        // Already in correct format
        processedProperties[prop] = {
          from:
            typeof value.from === "string"
              ? this.parseNumericValue(value.from)
              : parseFloat(value.from) || 0,
          to:
            typeof value.to === "string"
              ? this.parseNumericValue(value.to)
              : parseFloat(value.to) || 0,
          unit: value.unit || this.getDefaultUnit(prop),
        };

        // Special handling for transform properties
        if (prop === "transform") {
          if (typeof value.from === "string") {
            const fromTransform = this.parseTransformValue(value.from);
            processedProperties[prop].transformType =
              fromTransform.transformType;
            processedProperties[prop].from = fromTransform.value;
            processedProperties[prop].unit = fromTransform.unit;
          }
          if (typeof value.to === "string") {
            const toTransform = this.parseTransformValue(value.to);
            processedProperties[prop].transformType = toTransform.transformType;
            processedProperties[prop].to = toTransform.value;
            processedProperties[prop].unit = toTransform.unit;
          }
        }
      } else {
        // Single value format - determine from and to
        if (prop === "transform" && typeof value === "string") {
          // Handle transform values specially
          const parsedTransform = this.parseTransformValue(value);

          // Get current transform value
          const computedStyle = window.getComputedStyle(element);
          const currentTransform = computedStyle.transform;
          let fromValue = 0;

          // Try to extract current value for the same transform type
          if (currentTransform && currentTransform !== "none") {
            const currentMatch = currentTransform.match(
              new RegExp(`${parsedTransform.transformType}\\(([^)]+)\\)`)
            );
            if (currentMatch) {
              fromValue = parseFloat(currentMatch[1]) || 0;
            }
          }

          processedProperties[prop] = {
            from: fromValue,
            to: parsedTransform.value,
            unit: parsedTransform.unit,
            transformType: parsedTransform.transformType,
          };
        } else {
          // Regular CSS property
          const computedStyle = window.getComputedStyle(element);
          const currentValue = computedStyle[prop] || "0";
          const parsedCurrent = this.parseNumericValue(currentValue);
          const unit =
            this.getUnitFromValue(currentValue) || this.getDefaultUnit(prop);

          processedProperties[prop] = {
            from: parsedCurrent,
            to:
              typeof value === "string"
                ? this.parseNumericValue(value)
                : parseFloat(value) || 0,
            unit,
          };
        }
      }
    }

    // Create animation object
    const animationId = `anim_${++this.animationCounter}`;
    const animation = {
      id: animationId,
      type: "css",
      element,
      properties: processedProperties,
      duration: options.duration || this.options.defaultDuration,
      easing: options.easing || this.options.defaultEasing,
      iterations: options.iterations || 1,
      direction: options.direction || "normal",
      playbackRate: options.playbackRate || 1,
      delay: options.delay || 0,
      elapsedTime: 0,
      currentIteration: 0,
      isPlaying: false,
      isPaused: false,
      isReversed: false,
      onStart: options.onStart,
      onUpdate: options.onUpdate,
      onComplete: options.onComplete,
      sequenceId: options.sequenceId,
    };

    // Store animation
    this.animations.set(animationId, animation);

    // Apply hardware acceleration if enabled
    if (this.options.useHardwareAcceleration) {
      element.classList.add("animation-accelerated");
    }

    this.log(`Created CSS animation: ${animationId}`);
    return animationId;
  }

  /**
   * Create a sprite animation
   * @param {HTMLElement} element - Element to animate
   * @param {Array} frames - Array of frame indices
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  createSpriteAnimation(element, frames, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
      this.log("Invalid element for sprite animation", "error");
      return null;
    }

    if (!Array.isArray(frames) || frames.length === 0) {
      this.log("Invalid frames for sprite animation", "error");
      return null;
    }

    // Create animation object
    const animationId = `sprite_${++this.animationCounter}`;
    const animation = {
      id: animationId,
      type: "sprite",
      element,
      frames,
      frameWidth: options.frameWidth || 64,
      frameHeight: options.frameHeight || 64,
      framesPerRow: options.framesPerRow || frames.length,
      duration: options.duration || this.options.defaultDuration,
      easing: options.easing || "linear", // Usually linear for sprites
      iterations: options.iterations || 1,
      direction: options.direction || "normal",
      playbackRate: options.playbackRate || 1,
      delay: options.delay || 0,
      elapsedTime: 0,
      currentIteration: 0,
      isPlaying: false,
      isPaused: false,
      isReversed: false,
      onStart: options.onStart,
      onUpdate: options.onUpdate,
      onComplete: options.onComplete,
      sequenceId: options.sequenceId,
    };

    // Store animation
    this.animations.set(animationId, animation);

    // Set up element for sprite animation
    element.style.backgroundSize = `${
      animation.framesPerRow * animation.frameWidth
    }px auto`;
    element.style.width = `${animation.frameWidth}px`;
    element.style.height = `${animation.frameHeight}px`;

    this.log(`Created sprite animation: ${animationId}`);
    return animationId;
  }

  /**
   * Create a property animation (for non-DOM objects)
   * @param {Object} target - Object to animate
   * @param {Object} properties - Properties to animate
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  createPropertyAnimation(target, properties, options = {}) {
    if (!target || typeof target !== "object") {
      this.log("Invalid target for property animation", "error");
      return null;
    }

    // Process properties
    const processedProperties = {};
    for (const [prop, value] of Object.entries(properties)) {
      // Handle different formats
      if (typeof value === "object" && "from" in value && "to" in value) {
        // Already in correct format
        processedProperties[prop] = {
          from: value.from,
          to: value.to,
        };
      } else {
        // Get current value as 'from'
        processedProperties[prop] = {
          from: target[prop] || 0,
          to: value,
        };
      }
    }

    // Create animation object
    const animationId = `prop_${++this.animationCounter}`;
    const animation = {
      id: animationId,
      type: "property",
      target,
      properties: processedProperties,
      duration: options.duration || this.options.defaultDuration,
      easing: options.easing || this.options.defaultEasing,
      iterations: options.iterations || 1,
      direction: options.direction || "normal",
      playbackRate: options.playbackRate || 1,
      delay: options.delay || 0,
      elapsedTime: 0,
      currentIteration: 0,
      isPlaying: false,
      isPaused: false,
      isReversed: false,
      onStart: options.onStart,
      onUpdate: options.onUpdate,
      onComplete: options.onComplete,
      sequenceId: options.sequenceId,
    };

    // Store animation
    this.animations.set(animationId, animation);

    this.log(`Created property animation: ${animationId}`);
    return animationId;
  }

  /**
   * Create an animation sequence
   * @param {Array} animationIds - Array of animation IDs
   * @param {Object} options - Sequence options
   * @returns {string} - Sequence ID
   */
  createSequence(animationIds, options = {}) {
    if (!Array.isArray(animationIds) || animationIds.length === 0) {
      this.log("Invalid animation IDs for sequence", "error");
      return null;
    }

    // Create sequence object
    const sequenceId = `seq_${++this.animationCounter}`;
    const sequence = {
      id: sequenceId,
      animations: [...animationIds],
      currentIndex: -1,
      iterations: options.iterations || 1,
      currentIteration: 0,
      onComplete: options.onComplete,
    };

    // Store sequence
    this.sequences.set(sequenceId, sequence);

    // Update animations with their sequence ID
    for (const animId of animationIds) {
      const anim = this.animations.get(animId);
      if (anim) {
        anim.sequenceId = sequenceId;
      }
    }

    this.log(`Created animation sequence: ${sequenceId}`);
    return sequenceId;
  }

  /**
   * Register a sprite sheet
   * @param {string} id - Sprite sheet identifier
   * @param {Object} config - Sprite sheet configuration
   * @returns {boolean} - Success status
   */
  registerSpriteSheet(id, config) {
    if (!id || !config) {
      this.log("Invalid sprite sheet configuration", "error");
      return false;
    }

    this.spriteSheets.set(id, {
      id,
      url: config.url,
      frameWidth: config.frameWidth,
      frameHeight: config.frameHeight,
      framesPerRow: config.framesPerRow || 0,
      totalFrames: config.totalFrames || 0,
      animations: config.animations || {},
    });

    this.log(`Registered sprite sheet: ${id}`);
    return true;
  }

  /**
   * Create an animation from a registered sprite sheet
   * @param {HTMLElement} element - Element to animate
   * @param {string} spriteSheetId - Sprite sheet identifier
   * @param {string} animationName - Animation name in the sprite sheet
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  createSpriteSheetAnimation(
    element,
    spriteSheetId,
    animationName,
    options = {}
  ) {
    const spriteSheet = this.spriteSheets.get(spriteSheetId);
    if (!spriteSheet) {
      this.log(`Sprite sheet not found: ${spriteSheetId}`, "error");
      return null;
    }

    const animation = spriteSheet.animations[animationName];
    if (!animation) {
      this.log(
        `Animation not found in sprite sheet: ${animationName}`,
        "error"
      );
      return null;
    }

    // Set background image
    element.style.backgroundImage = `url(${spriteSheet.url})`;

    // Create sprite animation
    return this.createSpriteAnimation(element, animation.frames, {
      frameWidth: spriteSheet.frameWidth,
      frameHeight: spriteSheet.frameHeight,
      framesPerRow: spriteSheet.framesPerRow,
      duration:
        options.duration || animation.duration || this.options.defaultDuration,
      iterations: options.iterations || animation.iterations || 1,
      ...options,
    });
  }

  /**
   * Play an animation or sequence
   * @param {string} id - Animation or sequence ID
   * @returns {boolean} - Success status
   */
  play(id) {
    // Check if it's an animation
    const animation = this.animations.get(id);
    if (animation) {
      // Ensure we're using requestAnimationFrame
      if (this.options.useRequestAnimationFrame && !this.isRunning) {
        this.startAnimationLoop();
      }

      // Handle delay
      if (animation.delay > 0 && !animation.delayTimeout) {
        animation.delayTimeout = setTimeout(() => {
          animation.delayTimeout = null;
          this.startAnimation(animation);
        }, animation.delay);
        return true;
      }

      return this.startAnimation(animation);
    }

    // Check if it's a sequence
    const sequence = this.sequences.get(id);
    if (sequence) {
      sequence.currentIndex = -1;
      sequence.currentIteration = 0;
      this.advanceSequence(id);
      return true;
    }

    this.log(`Animation or sequence not found: ${id}`, "warn");
    return false;
  }

  /**
   * Start an animation
   * @private
   * @param {Object} animation - Animation object
   * @returns {boolean} - Success status
   */
  startAnimation(animation) {
    if (!animation) return false;

    // Reset if completed
    if (animation.elapsedTime >= animation.duration) {
      animation.elapsedTime = 0;
      animation.currentIteration = 0;
    }

    // Start animation
    animation.isPlaying = true;
    animation.isPaused = false;
    this.activeAnimations.add(animation.id);

    // Ensure animation loop is running
    if (this.options.useRequestAnimationFrame && !this.isRunning) {
      this.startAnimationLoop();
    }

    // Execute onStart callback
    if (
      typeof animation.onStart === "function" &&
      animation.elapsedTime === 0
    ) {
      try {
        animation.onStart(animation);
      } catch (error) {
        this.log(`Error in onStart callback: ${error.message}`, "error");
      }
    }

    this.log(`Started animation: ${animation.id}`);
    return true;
  }

  /**
   * Pause an animation or all animations
   * @param {string} [id] - Animation ID (if omitted, pauses all)
   * @returns {boolean} - Success status
   */
  pause(id) {
    if (id) {
      // Pause specific animation
      const animation = this.animations.get(id);
      if (!animation) {
        this.log(`Animation not found: ${id}`, "warn");
        return false;
      }

      animation.isPlaying = false;
      animation.isPaused = true;
      this.log(`Paused animation: ${id}`);
      return true;
    } else {
      // Pause all animations
      this.pauseAll();
      return true;
    }
  }

  /**
   * Pause all active animations
   */
  pauseAll() {
    for (const animId of this.activeAnimations) {
      const animation = this.animations.get(animId);
      if (animation) {
        animation.isPlaying = false;
        animation.isPaused = true;
      }
    }
    this.log("Paused all animations");
  }

  /**
   * Resume an animation or all animations
   * @param {string} [id] - Animation ID (if omitted, resumes all)
   * @returns {boolean} - Success status
   */
  resume(id) {
    if (id) {
      // Resume specific animation
      const animation = this.animations.get(id);
      if (!animation) {
        this.log(`Animation not found: ${id}`, "warn");
        return false;
      }

      if (animation.isPaused) {
        animation.isPlaying = true;
        animation.isPaused = false;
        this.activeAnimations.add(animation.id);

        // Ensure animation loop is running
        if (this.options.useRequestAnimationFrame && !this.isRunning) {
          this.startAnimationLoop();
        }

        this.log(`Resumed animation: ${id}`);
        return true;
      }
    } else {
      // Resume all paused animations
      this.resumeAll();
      return true;
    }

    return false;
  }

  /**
   * Resume all paused animations
   */
  resumeAll() {
    let hasResumed = false;

    for (const [animId, animation] of this.animations.entries()) {
      if (animation.isPaused) {
        animation.isPlaying = true;
        animation.isPaused = false;
        this.activeAnimations.add(animId);
        hasResumed = true;
      }
    }

    // Ensure animation loop is running
    if (
      hasResumed &&
      this.options.useRequestAnimationFrame &&
      !this.isRunning
    ) {
      this.startAnimationLoop();
    }

    this.log("Resumed all paused animations");
  }

  /**
   * Stop an animation or all animations
   * @param {string} [id] - Animation ID (if omitted, stops all)
   * @returns {boolean} - Success status
   */
  stop(id) {
    if (id) {
      // Stop specific animation
      const animation = this.animations.get(id);
      if (!animation) {
        this.log(`Animation not found: ${id}`, "warn");
        return false;
      }

      animation.isPlaying = false;
      animation.isPaused = false;
      animation.elapsedTime = 0;
      animation.currentIteration = 0;
      this.activeAnimations.delete(id);

      // Clear delay timeout if exists
      if (animation.delayTimeout) {
        clearTimeout(animation.delayTimeout);
        animation.delayTimeout = null;
      }

      this.log(`Stopped animation: ${id}`);
      return true;
    } else {
      // Stop all animations
      this.stopAll();
      return true;
    }
  }

  /**
   * Stop all animations
   */
  stopAll() {
    for (const [animId, animation] of this.animations.entries()) {
      animation.isPlaying = false;
      animation.isPaused = false;
      animation.elapsedTime = 0;
      animation.currentIteration = 0;

      // Clear delay timeout if exists
      if (animation.delayTimeout) {
        clearTimeout(animation.delayTimeout);
        animation.delayTimeout = null;
      }
    }

    this.activeAnimations.clear();
    this.log("Stopped all animations");
  }

  /**
   * Set animation playback rate
   * @param {string} id - Animation ID
   * @param {number} rate - Playback rate (1 = normal, 0.5 = half speed, 2 = double speed)
   * @returns {boolean} - Success status
   */
  setPlaybackRate(id, rate) {
    const animation = this.animations.get(id);
    if (!animation) {
      this.log(`Animation not found: ${id}`, "warn");
      return false;
    }

    animation.playbackRate = Math.max(0, rate);
    this.log(`Set playback rate for ${id}: ${rate}`);
    return true;
  }

  /**
   * Set animation progress
   * @param {string} id - Animation ID
   * @param {number} progress - Progress value (0 to 1)
   * @returns {boolean} - Success status
   */
  setProgress(id, progress) {
    const animation = this.animations.get(id);
    if (!animation) {
      this.log(`Animation not found: ${id}`, "warn");
      return false;
    }

    // Clamp progress between 0 and 1
    const clampedProgress = Math.max(0, Math.min(1, progress));

    // Set elapsed time based on progress
    animation.elapsedTime = clampedProgress * animation.duration;

    // Update animation immediately
    const easedProgress = this.applyEasing(clampedProgress, animation.easing);
    if (animation.type === "sprite") {
      this.updateSpriteAnimation(animation, easedProgress);
    } else if (animation.type === "css") {
      this.updateCssAnimation(animation, easedProgress);
    } else if (animation.type === "property") {
      this.updatePropertyAnimation(animation, easedProgress);
    }

    this.log(`Set progress for ${id}: ${clampedProgress}`);
    return true;
  }

  /**
   * Get animation object
   * @param {string} id - Animation ID
   * @returns {Object|null} - Animation object or null if not found
   */
  getAnimation(id) {
    return this.animations.get(id) || null;
  }

  /**
   * Get sequence object
   * @param {string} id - Sequence ID
   * @returns {Object|null} - Sequence object or null if not found
   */
  getSequence(id) {
    return this.sequences.get(id) || null;
  }

  /**
   * Check if an animation is playing
   * @param {string} id - Animation ID
   * @returns {boolean} - True if animation is playing
   */
  isPlaying(id) {
    const animation = this.animations.get(id);
    return animation ? animation.isPlaying : false;
  }

  /**
   * Get animation progress
   * @param {string} id - Animation ID
   * @returns {number} - Progress value (0 to 1) or -1 if not found
   */
  getProgress(id) {
    const animation = this.animations.get(id);
    if (!animation) return -1;

    return Math.min(animation.elapsedTime / animation.duration, 1);
  }

  /**
   * Remove an animation
   * @param {string} id - Animation ID
   * @returns {boolean} - Success status
   */
  removeAnimation(id) {
    // Stop the animation if active
    if (this.activeAnimations.has(id)) {
      this.stop(id);
    }

    // Remove from animations map
    const success = this.animations.delete(id);

    // Remove from sequences if present
    for (const [seqId, sequence] of this.sequences.entries()) {
      const index = sequence.animations.indexOf(id);
      if (index !== -1) {
        sequence.animations.splice(index, 1);

        // Remove empty sequences
        if (sequence.animations.length === 0) {
          this.sequences.delete(seqId);
        }
      }
    }

    this.log(`Removed animation: ${id}`);
    return success;
  }

  /**
   * Remove a sequence
   * @param {string} id - Sequence ID
   * @returns {boolean} - Success status
   */
  removeSequence(id) {
    const sequence = this.sequences.get(id);
    if (!sequence) return false;

    // Remove sequence ID from animations
    for (const animId of sequence.animations) {
      const animation = this.animations.get(animId);
      if (animation && animation.sequenceId === id) {
        animation.sequenceId = null;
      }
    }

    // Remove sequence
    const success = this.sequences.delete(id);
    this.log(`Removed sequence: ${id}`);
    return success;
  }

  /**
   * Create a transition effect
   * @param {HTMLElement} element - Element to animate
   * @param {Object} properties - CSS properties to animate
   * @param {Object} options - Transition options
   * @returns {string} - Animation ID
   */
  transition(element, properties, options = {}) {
    return this.createCssAnimation(element, properties, options);
  }

  /**
   * Create a fade in effect
   * @param {HTMLElement} element - Element to fade in
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  fadeIn(element, options = {}) {
    // Ensure element is visible but transparent
    element.style.opacity = "0";
    element.style.display = options.display || "block";

    // Create fade in animation
    const animId = this.createCssAnimation(
      element,
      {
        opacity: 1,
      },
      {
        duration: options.duration || 500,
        easing: options.easing || "ease-in",
        ...options,
      }
    );

    // Start animation
    this.play(animId);
    return animId;
  }

  /**
   * Create a fade out effect
   * @param {HTMLElement} element - Element to fade out
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  fadeOut(element, options = {}) {
    // Create fade out animation
    const animId = this.createCssAnimation(
      element,
      {
        opacity: 0,
      },
      {
        duration: options.duration || 500,
        easing: options.easing || "ease-out",
        onComplete: () => {
          if (options.hideAfter !== false) {
            element.style.display = "none";
          }

          if (options.onComplete) {
            options.onComplete();
          }
        },
        ...options,
      }
    );

    // Start animation
    this.play(animId);
    return animId;
  }

  /**
   * Create a slide in effect
   * @param {HTMLElement} element - Element to slide in
   * @param {string} direction - Direction ('left', 'right', 'top', 'bottom')
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  slideIn(element, direction = "left", options = {}) {
    // Set initial position
    element.style.display = options.display || "block";

    let fromValue, toValue;

    switch (direction) {
      case "left":
        fromValue = "translateX(-100%)";
        toValue = "translateX(0)";
        break;
      case "right":
        fromValue = "translateX(100%)";
        toValue = "translateX(0)";
        break;
      case "top":
        fromValue = "translateY(-100%)";
        toValue = "translateY(0)";
        break;
      case "bottom":
        fromValue = "translateY(100%)";
        toValue = "translateY(0)";
        break;
      default:
        fromValue = "translateX(-100%)";
        toValue = "translateX(0)";
    }

    // Set initial transform
    element.style.transform = fromValue;

    // Create animation
    const animId = this.createCssAnimation(
      element,
      {
        transform: {
          from: fromValue,
          to: toValue,
        },
      },
      {
        duration: options.duration || 500,
        easing: options.easing || "ease-out",
        ...options,
      }
    );

    // Start animation
    this.play(animId);
    return animId;
  }

  /**
   * Create a slide out effect
   * @param {HTMLElement} element - Element to slide out
   * @param {string} direction - Direction ('left', 'right', 'top', 'bottom')
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  slideOut(element, direction = "left", options = {}) {
    let fromValue, toValue;

    switch (direction) {
      case "left":
        fromValue = "translateX(0)";
        toValue = "translateX(-100%)";
        break;
      case "right":
        fromValue = "translateX(0)";
        toValue = "translateX(100%)";
        break;
      case "top":
        fromValue = "translateY(0)";
        toValue = "translateY(-100%)";
        break;
      case "bottom":
        fromValue = "translateY(0)";
        toValue = "translateY(100%)";
        break;
      default:
        fromValue = "translateX(0)";
        toValue = "translateX(-100%)";
    }

    // Create animation
    const animId = this.createCssAnimation(
      element,
      {
        transform: {
          from: fromValue,
          to: toValue,
        },
      },
      {
        duration: options.duration || 500,
        easing: options.easing || "ease-in",
        onComplete: () => {
          if (options.hideAfter !== false) {
            element.style.display = "none";
            element.style.transform = ""; // Reset transform
          }

          if (options.onComplete) {
            options.onComplete();
          }
        },
        ...options,
      }
    );

    // Start animation
    this.play(animId);
    return animId;
  }

  /**
   * Create a bounce effect
   * @param {HTMLElement} element - Element to bounce
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  bounce(element, options = {}) {
    const height = options.height || 20;
    const duration = options.duration || 600;

    // Define bounce sequence
    const upId = this.createCssAnimation(
      element,
      {
        transform: {
          from: "translateY(0px)",
          to: `translateY(-${height}px)`,
        },
      },
      {
        duration: duration / 3,
        easing: "ease-out",
      }
    );

    const downId = this.createCssAnimation(
      element,
      {
        transform: {
          from: `translateY(-${height}px)`,
          to: "translateY(0px)",
        },
      },
      {
        duration: duration / 3,
        easing: "ease-in",
      }
    );

    const smallUpId = this.createCssAnimation(
      element,
      {
        transform: {
          from: "translateY(0px)",
          to: `translateY(-${height / 2}px)`,
        },
      },
      {
        duration: duration / 6,
        easing: "ease-out",
      }
    );

    const smallDownId = this.createCssAnimation(
      element,
      {
        transform: {
          from: `translateY(-${height / 2}px)`,
          to: "translateY(0px)",
        },
      },
      {
        duration: duration / 6,
        easing: "ease-in",
        onComplete: options.onComplete,
      }
    );

    // Create sequence
    const sequenceId = this.createSequence(
      [upId, downId, smallUpId, smallDownId],
      { iterations: options.iterations || 1 }
    );

    // Start animation
    this.play(sequenceId);
    return sequenceId;
  }

  /**
   * Create a pulse effect
   * @param {HTMLElement} element - Element to pulse
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  pulse(element, options = {}) {
    // Create animation
    const animId = this.createCssAnimation(
      element,
      {
        transform: {
          from: "scale(1)",
          to: `scale(${options.scale || 1.2})`,
        },
      },
      {
        duration: options.duration || 500,
        easing: options.easing || "ease-in-out",
        iterations: options.iterations || 2,
        direction: "alternate",
        ...options,
      }
    );

    // Start animation
    this.play(animId);
    return animId;
  }

  /**
   * Create a shake effect
   * @param {HTMLElement} element - Element to shake
   * @param {Object} options - Animation options
   * @returns {string} - Animation ID
   */
  shake(element, options = {}) {
    const intensity = options.intensity || 10;
    const duration = options.duration || 600;
    const animIds = [];

    // Create left movement
    animIds.push(
      this.createCssAnimation(
        element,
        {
          transform: {
            from: "translateX(0px)",
            to: `translateX(-${intensity}px)`,
          },
        },
        {
          duration: duration / 6,
          easing: "ease-in-out",
        }
      )
    );

    // Create right movement
    animIds.push(
      this.createCssAnimation(
        element,
        {
          transform: {
            from: `translateX(-${intensity}px)`,
            to: `translateX(${intensity}px)`,
          },
        },
        {
          duration: (duration / 6) * 2,
          easing: "ease-in-out",
        }
      )
    );

    // Create left movement (smaller)
    animIds.push(
      this.createCssAnimation(
        element,
        {
          transform: {
            from: `translateX(${intensity}px)`,
            to: `translateX(-${intensity / 2}px)`,
          },
        },
        {
          duration: (duration / 6) * 1.5,
          easing: "ease-in-out",
        }
      )
    );

    // Create right movement (smaller)
    animIds.push(
      this.createCssAnimation(
        element,
        {
          transform: {
            from: `translateX(-${intensity / 2}px)`,
            to: `translateX(${intensity / 2}px)`,
          },
        },
        {
          duration: duration / 6,
          easing: "ease-in-out",
        }
      )
    );

    // Return to center
    animIds.push(
      this.createCssAnimation(
        element,
        {
          transform: {
            from: `translateX(${intensity / 2}px)`,
            to: "translateX(0px)",
          },
        },
        {
          duration: duration / 6,
          easing: "ease-out",
          onComplete: options.onComplete,
        }
      )
    );

    // Create sequence
    const sequenceId = this.createSequence(animIds, {
      iterations: options.iterations || 1,
    });

    // Start animation
    this.play(sequenceId);
    return sequenceId;
  }

  /**
   * Get performance metrics
   * @returns {Object} - Performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get the count of active animations
   * @returns {number} - Count of active animations
   */
  getActiveCount() {
    return this.activeAnimations.size;
  }

  /**
   * Get the count of total animations
   * @returns {number} - Count of total animations
   */
  getTotalCount() {
    return this.animations.size;
  }

  /**
   * Clear all animations and sequences
   */
  clearAll() {
    // Stop all animations
    this.stopAll();

    // Clear collections
    this.animations.clear();
    this.sequences.clear();
    this.activeAnimations.clear();

    this.log("Cleared all animations and sequences");
  }

  // UTILITY METHODS

  /**
   * Apply easing function to progress
   * @private
   * @param {number} progress - Linear progress (0-1)
   * @param {string} easing - Easing type
   * @returns {number} - Eased progress
   */
  applyEasing(progress, easing) {
    switch (easing) {
      case "linear":
        return progress;
      case "ease-in":
        return progress * progress;
      case "ease-out":
        return progress * (2 - progress);
      case "ease-in-out":
        return progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
      case "elastic":
        return progress === 0 || progress === 1
          ? progress
          : Math.pow(2, -10 * progress) *
              Math.sin(((progress - 0.075) * (2 * Math.PI)) / 0.3) +
              1;
      case "bounce":
        if (progress < 1 / 2.75) {
          return 7.5625 * progress * progress;
        } else if (progress < 2 / 2.75) {
          return 7.5625 * (progress -= 1.5 / 2.75) * progress + 0.75;
        } else if (progress < 2.5 / 2.75) {
          return 7.5625 * (progress -= 2.25 / 2.75) * progress + 0.9375;
        } else {
          return 7.5625 * (progress -= 2.625 / 2.75) * progress + 0.984375;
        }
      default:
        return progress;
    }
  }

  /**
   * Interpolate between two values
   * @private
   * @param {number} from - Start value
   * @param {number} to - End value
   * @param {number} progress - Progress (0-1)
   * @returns {number} - Interpolated value
   */
  interpolate(from, to, progress) {
    return from + (to - from) * progress;
  }

  /**
   * Get default unit for CSS property
   * @private
   * @param {string} property - CSS property
   * @returns {string} - Default unit
   */
  getDefaultUnit(property) {
    // Properties that use pixels by default
    const pixelProperties = [
      "width",
      "height",
      "top",
      "left",
      "right",
      "bottom",
      "padding",
      "margin",
      "borderWidth",
      "borderRadius",
      "fontSize",
      "lineHeight",
      "letterSpacing",
      "backgroundSize",
      "minWidth",
      "maxWidth",
      "minHeight",
      "maxHeight",
    ];

    // Check if property uses pixels
    for (const prop of pixelProperties) {
      if (property === prop || property.startsWith(prop)) {
        return "px";
      }
    }

    // Special cases
    if (
      property === "opacity" ||
      property === "fontWeight" ||
      property === "zIndex" ||
      property === "flex" ||
      property === "flexGrow" ||
      property === "flexShrink" ||
      property === "order" ||
      property === "zoom"
    ) {
      return "";
    }

    if (property === "rotate" || property.includes("angle")) {
      return "deg";
    }

    // Default to pixels for most properties
    return "px";
  }

  /**
   * Parse numeric value from CSS string
   * @private
   * @param {string} value - CSS value string
   * @returns {number} - Parsed numeric value
   */
  parseNumericValue(value) {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return 0;

    // Handle transform functions like translateX(100px), scale(1.5), etc.
    if (value.includes("(")) {
      const match = value.match(/([a-zA-Z]+)\(([^)]+)\)/);
      if (match) {
        return parseFloat(match[2]) || 0;
      }
    }

    // Handle regular CSS values like "100px", "1.5", etc.
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Extract unit from a CSS value
   * @private
   * @param {string} value - CSS value
   * @returns {string} - Unit or empty string
   */
  getUnitFromValue(value) {
    if (typeof value !== "string") return "";

    const match = value.match(/[0-9.]+([a-z%]+)$/i);
    return match ? match[1] : "";
  }

  /**
   * Debug logging helper
   * @private
   * @param {string} message - Log message
   * @param {string} level - Log level
   */
  log(message, level = "info") {
    if (this.options.enableDebugLogs) {
      const logMethod =
        level === "error"
          ? console.error
          : level === "warn"
          ? console.warn
          : console.log;
      logMethod(`[AnimationManager] ${message}`);
    }
  }

  /**
   * Clean up and destroy the instance
   */
  destroy() {
    this.log("Destroying AnimationManager...");

    // Stop animation loop
    this.stopAnimationLoop();

    // Stop and clear all animations
    this.clearAll();

    // Remove event listeners
    window.removeEventListener("resize", this.handleResize.bind(this));

    this.log("AnimationManager destroyed");
  }
}
