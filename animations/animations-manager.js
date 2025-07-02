/**
 * AnimationManagerUI - Game Integration Class for Animation Management
 * Handles UI controls, integration with game systems, and developer tools
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class AnimationManagerUI {
  constructor(gameInstance, options = {}) {
    this.game = gameInstance;

    // Configuration options
    this.options = {
      enableDebugPanel: false,
      showPerformanceMetrics: false,
      autoIntegrateWithState: true,
      enableInspector: false,
      controlPanelPosition: "bottom-right",
      themeColor: "#3498db",
      activePreviewLimit: 5,
      showActiveAnimations: true,
      containerSelector: "body",
      animationManager: null, // Allow passing in existing manager
      ...options,
    };

    // Core references
    this.animationManager =
      this.options.animationManager ||
      new AnimationManager({
        enableDebugLogs: this.options.enableDebugPanel,
        useRequestAnimationFrame: true,
      });
    this.uiElements = {};
    this.isInitialized = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };

    // Timeline management
    this.timelineElements = new Map();
    this.selectedAnimation = null;

    // Active animations preview
    this.previewInterval = null;
    this.metricsInterval = null;
    this.inspectorInterval = null;

    // Initialize the system
    this.init();
  }

  /**
   * Initialize the AnimationManagerUI
   */
  init() {
    try {
      // Create UI elements if debug panel is enabled
      if (this.options.enableDebugPanel) {
        this.createDebugPanel();
      }

      // Create animation inspector if enabled
      if (this.options.enableInspector) {
        this.createAnimationInspector();
      }

      // Integrate with game state if available and auto-integration is enabled
      if (this.game && this.game.state && this.options.autoIntegrateWithState) {
        this.integrateWithGameState();
      }

      // Expose animation manager to game instance
      if (this.game) {
        this.game.animation = this.getPublicAPI();
      }

      this.isInitialized = true;

      return true;
    } catch (error) {
      console.error("Failed to initialize AnimationManagerUI:", error);
      return false;
    }
  }

  /**
   * Get public API for game integration
   * @returns {Object} - Public API object
   */
  getPublicAPI() {
    return {
      // Core animation methods
      createCssAnimation: this.animationManager.createCssAnimation.bind(
        this.animationManager
      ),
      createSpriteAnimation: this.animationManager.createSpriteAnimation.bind(
        this.animationManager
      ),
      createPropertyAnimation:
        this.animationManager.createPropertyAnimation.bind(
          this.animationManager
        ),
      createSequence: this.animationManager.createSequence.bind(
        this.animationManager
      ),

      // Sprite sheet methods
      registerSpriteSheet: this.animationManager.registerSpriteSheet.bind(
        this.animationManager
      ),
      createSpriteSheetAnimation:
        this.animationManager.createSpriteSheetAnimation.bind(
          this.animationManager
        ),

      // Control methods
      play: this.animationManager.play.bind(this.animationManager),
      pause: this.animationManager.pause.bind(this.animationManager),
      resume: this.animationManager.resume.bind(this.animationManager),
      stop: this.animationManager.stop.bind(this.animationManager),
      pauseAll: this.animationManager.pauseAll.bind(this.animationManager),
      resumeAll: this.animationManager.resumeAll.bind(this.animationManager),
      stopAll: this.animationManager.stopAll.bind(this.animationManager),

      // Utility methods
      setPlaybackRate: this.animationManager.setPlaybackRate.bind(
        this.animationManager
      ),
      setProgress: this.animationManager.setProgress.bind(
        this.animationManager
      ),
      getAnimation: this.animationManager.getAnimation.bind(
        this.animationManager
      ),
      getSequence: this.animationManager.getSequence.bind(
        this.animationManager
      ),
      isPlaying: this.animationManager.isPlaying.bind(this.animationManager),
      getProgress: this.animationManager.getProgress.bind(
        this.animationManager
      ),

      // Effect methods
      transition: this.animationManager.transition.bind(this.animationManager),
      fadeIn: this.animationManager.fadeIn.bind(this.animationManager),
      fadeOut: this.animationManager.fadeOut.bind(this.animationManager),
      slideIn: this.animationManager.slideIn.bind(this.animationManager),
      slideOut: this.animationManager.slideOut.bind(this.animationManager),
      bounce: this.animationManager.bounce.bind(this.animationManager),
      pulse: this.animationManager.pulse.bind(this.animationManager),
      shake: this.animationManager.shake.bind(this.animationManager),

      // Performance methods
      getPerformanceMetrics: this.animationManager.getPerformanceMetrics.bind(
        this.animationManager
      ),
      getActiveCount: this.animationManager.getActiveCount.bind(
        this.animationManager
      ),
      getTotalCount: this.animationManager.getTotalCount.bind(
        this.animationManager
      ),
    };
  }

  /**
   * Integrate with game state system
   * @private
   */
  integrateWithGameState() {
    // Watch for animation settings changes
    if (this.game.state.watch) {
      this.game.state.watch("settings.animations", (settings) => {
        if (settings && typeof settings === "object") {
          if (settings.enabled === false) {
            this.animationManager.pauseAll();
          } else if (settings.enabled === true) {
            this.animationManager.resumeAll();
          }

          // Apply global speed multiplier
          if (typeof settings.speed === "number") {
            for (const [animId] of this.animationManager.animations) {
              this.animationManager.setPlaybackRate(animId, settings.speed);
            }
          }
        }
      });
    }
  }

  /**
   * Create the debug panel
   * @private
   */
  createDebugPanel() {
    // Create container
    const container = document.createElement("div");
    container.className = "animation-debug-panel";
    container.dataset.position = this.options.controlPanelPosition;

    // Create header with drag handle
    const header = document.createElement("div");
    header.className = "animation-debug-header";
    header.innerHTML = `
      <h3 class="animation-debug-title">Animation Debug</h3>
      <div class="animation-debug-controls">
        <button class="animation-debug-minimize" title="Minimize">−</button>
        <button class="animation-debug-close" title="Close">×</button>
      </div>
    `;
    container.appendChild(header);

    // Make panel draggable
    this.makeDraggable(container, header);

    // Create content
    const content = document.createElement("div");
    content.className = "animation-debug-content";

    // Create performance section
    const performanceSection = document.createElement("div");
    performanceSection.className = "animation-debug-section";
    performanceSection.innerHTML = `
      <h4 class="animation-debug-section-title">Performance</h4>
      <div class="animation-debug-metrics">
        <div class="animation-metric">
          <span class="animation-metric-label">Active:</span>
          <span class="animation-metric-value" id="animation-active-count">0</span>
        </div>
        <div class="animation-metric">
          <span class="animation-metric-label">Total:</span>
          <span class="animation-metric-value" id="animation-total-count">0</span>
        </div>
        <div class="animation-metric">
          <span class="animation-metric-label">FPS:</span>
          <span class="animation-metric-value" id="animation-fps">0</span>
        </div>
        <div class="animation-metric">
          <span class="animation-metric-label">Frame Time:</span>
          <span class="animation-metric-value" id="animation-frame-time">0 ms</span>
        </div>
      </div>
    `;
    content.appendChild(performanceSection);

    // Create active animations section
    const activeSection = document.createElement("div");
    activeSection.className = "animation-debug-section";
    activeSection.innerHTML = `
      <h4 class="animation-debug-section-title">
        Active Animations
        <button class="animation-debug-refresh" title="Refresh">↻</button>
      </h4>
      <div class="animation-active-list" id="animation-active-list">
        <div class="animation-empty-state">No active animations</div>
      </div>
    `;
    content.appendChild(activeSection);

    // Create controls section
    const controlsSection = document.createElement("div");
    controlsSection.className = "animation-debug-section";
    controlsSection.innerHTML = `
      <h4 class="animation-debug-section-title">Controls</h4>
      <div class="animation-debug-buttons">
        <button class="animation-debug-btn" id="animation-pause-all">Pause All</button>
        <button class="animation-debug-btn" id="animation-resume-all">Resume All</button>
        <button class="animation-debug-btn animation-debug-btn-danger" id="animation-stop-all">Stop All</button>
      </div>
    `;
    content.appendChild(controlsSection);

    // Create global speed control
    const speedSection = document.createElement("div");
    speedSection.className = "animation-debug-section";
    speedSection.innerHTML = `
      <h4 class="animation-debug-section-title">Playback Speed</h4>
      <div class="animation-speed-control">
        <input type="range" min="0" max="200" value="100" class="animation-speed-slider" id="animation-speed-slider">
        <span class="animation-speed-value" id="animation-speed-value">1.0x</span>
      </div>
    `;
    content.appendChild(speedSection);

    container.appendChild(content);

    // Append to document
    const targetContainer =
      document.querySelector(this.options.containerSelector) || document.body;
    targetContainer.appendChild(container);

    // Save references
    this.uiElements.debugPanel = container;
    this.uiElements.activeList = document.getElementById(
      "animation-active-list"
    );
    this.uiElements.metrics = {
      activeCount: document.getElementById("animation-active-count"),
      totalCount: document.getElementById("animation-total-count"),
      fps: document.getElementById("animation-fps"),
      frameTime: document.getElementById("animation-frame-time"),
    };

    // Set up event listeners
    this.setupDebugPanelEvents();

    // Start update intervals
    this.startMetricsUpdate();
    this.startActiveAnimationsUpdate();
  }

  /**
   * Create animation inspector
   * @private
   */
  createAnimationInspector() {
    // Create container
    const container = document.createElement("div");
    container.className = "animation-inspector";
    container.innerHTML = `
      <div class="animation-inspector-header">
        <h3 class="animation-inspector-title">Animation Inspector</h3>
        <div class="animation-inspector-controls">
          <button class="animation-inspector-minimize" title="Minimize">−</button>
          <button class="animation-inspector-close" title="Close">×</button>
        </div>
      </div>
      <div class="animation-inspector-content">
        <div class="animation-inspector-sidebar">
          <div class="animation-inspector-section">
            <h4 class="animation-inspector-section-title">Animations</h4>
            <div class="animation-list" id="animation-inspector-list"></div>
          </div>
        </div>
        <div class="animation-inspector-main">
          <div class="animation-inspector-section">
            <h4 class="animation-inspector-section-title">Details</h4>
            <div class="animation-inspector-details" id="animation-inspector-details">
              <div class="animation-empty-state">Select an animation</div>
            </div>
          </div>
          <div class="animation-inspector-section">
            <h4 class="animation-inspector-section-title">Timeline</h4>
            <div class="animation-timeline" id="animation-inspector-timeline">
              <div class="animation-timeline-track"></div>
              <div class="animation-timeline-playhead"></div>
            </div>
          </div>
          <div class="animation-inspector-section">
            <h4 class="animation-inspector-section-title">Controls</h4>
            <div class="animation-inspector-controls">
              <button class="animation-inspector-btn" id="animation-play">Play</button>
              <button class="animation-inspector-btn" id="animation-pause">Pause</button>
              <button class="animation-inspector-btn" id="animation-stop">Stop</button>
              <button class="animation-inspector-btn" id="animation-restart">Restart</button>
              <div class="animation-inspector-playback">
                <input type="range" min="0" max="100" value="0" class="animation-progress-slider" id="animation-progress-slider">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Make inspector draggable
    this.makeDraggable(
      container,
      container.querySelector(".animation-inspector-header")
    );

    // Append to document
    const targetContainer =
      document.querySelector(this.options.containerSelector) || document.body;
    targetContainer.appendChild(container);

    // Save references
    this.uiElements.inspector = container;
    this.uiElements.inspectorList = document.getElementById(
      "animation-inspector-list"
    );
    this.uiElements.inspectorDetails = document.getElementById(
      "animation-inspector-details"
    );
    this.uiElements.inspectorTimeline = document.getElementById(
      "animation-inspector-timeline"
    );
    this.uiElements.inspectorPlayhead = document.querySelector(
      ".animation-timeline-playhead"
    );

    // Set up event listeners
    this.setupInspectorEvents();

    // Start update intervals
    this.startInspectorUpdate();
  }

  /**
   * Make an element draggable
   * @private
   * @param {HTMLElement} element - Element to make draggable
   * @param {HTMLElement} handle - Drag handle element
   */
  makeDraggable(element, handle) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    handle.addEventListener("mousedown", (e) => {
      isDragging = true;
      element.classList.add("dragging");

      startX = e.clientX;
      startY = e.clientY;

      const rect = element.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      element.style.left = `${startLeft + deltaX}px`;
      element.style.top = `${startTop + deltaY}px`;
      element.style.right = "auto";
      element.style.bottom = "auto";
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        element.classList.remove("dragging");
      }
    });
  }

  /**
   * Set up debug panel event listeners
   * @private
   */
  setupDebugPanelEvents() {
    const panel = this.uiElements.debugPanel;

    // Close button
    panel
      .querySelector(".animation-debug-close")
      .addEventListener("click", () => {
        this.hideDebugPanel();
      });

    // Minimize button
    panel
      .querySelector(".animation-debug-minimize")
      .addEventListener("click", () => {
        panel.classList.toggle("minimized");
      });

    // Refresh button
    panel
      .querySelector(".animation-debug-refresh")
      .addEventListener("click", () => {
        this.updateActiveAnimationsList();
      });

    // Control buttons
    document
      .getElementById("animation-pause-all")
      .addEventListener("click", () => {
        this.animationManager.pauseAll();
      });

    document
      .getElementById("animation-resume-all")
      .addEventListener("click", () => {
        this.animationManager.resumeAll();
      });

    document
      .getElementById("animation-stop-all")
      .addEventListener("click", () => {
        this.animationManager.stopAll();
      });

    // Speed slider
    const speedSlider = document.getElementById("animation-speed-slider");
    const speedValue = document.getElementById("animation-speed-value");

    speedSlider.addEventListener("input", (e) => {
      const speed = parseInt(e.target.value) / 100;
      speedValue.textContent = `${speed.toFixed(1)}x`;

      // Apply speed to all active animations
      for (const [animId] of this.animationManager.animations) {
        this.animationManager.setPlaybackRate(animId, speed);
      }
    });
  }

  /**
   * Set up inspector event listeners
   * @private
   */
  setupInspectorEvents() {
    const inspector = this.uiElements.inspector;

    // Close button
    inspector
      .querySelector(".animation-inspector-close")
      .addEventListener("click", () => {
        this.hideInspector();
      });

    // Minimize button
    inspector
      .querySelector(".animation-inspector-minimize")
      .addEventListener("click", () => {
        inspector.classList.toggle("minimized");
      });

    // Control buttons
    document.getElementById("animation-play").addEventListener("click", () => {
      if (this.selectedAnimation) {
        this.animationManager.play(this.selectedAnimation);
      }
    });

    document.getElementById("animation-pause").addEventListener("click", () => {
      if (this.selectedAnimation) {
        this.animationManager.pause(this.selectedAnimation);
      }
    });

    document.getElementById("animation-stop").addEventListener("click", () => {
      if (this.selectedAnimation) {
        this.animationManager.stop(this.selectedAnimation);
      }
    });

    document
      .getElementById("animation-restart")
      .addEventListener("click", () => {
        if (this.selectedAnimation) {
          this.animationManager.stop(this.selectedAnimation);
          this.animationManager.play(this.selectedAnimation);
        }
      });

    // Progress slider
    const progressSlider = document.getElementById("animation-progress-slider");
    progressSlider.addEventListener("input", (e) => {
      if (this.selectedAnimation) {
        const progress = parseInt(e.target.value) / 100;
        this.animationManager.setProgress(this.selectedAnimation, progress);
      }
    });

    // Timeline click
    this.uiElements.inspectorTimeline.addEventListener("click", (e) => {
      if (this.selectedAnimation) {
        const rect = e.currentTarget.getBoundingClientRect();
        const progress = (e.clientX - rect.left) / rect.width;
        this.animationManager.setProgress(
          this.selectedAnimation,
          Math.max(0, Math.min(1, progress))
        );
        progressSlider.value = progress * 100;
      }
    });
  }

  /**
   * Start metrics update interval
   * @private
   */
  startMetricsUpdate() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 500); // Update every 500ms
  }

  /**
   * Start active animations update interval
   * @private
   */
  startActiveAnimationsUpdate() {
    if (this.previewInterval) {
      clearInterval(this.previewInterval);
    }

    this.previewInterval = setInterval(() => {
      this.updateActiveAnimationsList();
    }, 1000); // Update every second
  }

  /**
   * Start inspector update interval
   * @private
   */
  startInspectorUpdate() {
    if (this.inspectorInterval) {
      clearInterval(this.inspectorInterval);
    }

    this.inspectorInterval = setInterval(() => {
      this.updateInspector();
    }, 100); // Update every 100ms for smooth timeline
  }

  /**
   * Update performance metrics display
   * @private
   */
  updateMetrics() {
    if (!this.uiElements.metrics) return;

    const metrics = this.animationManager.getPerformanceMetrics();
    const activeCount = this.animationManager.getActiveCount();
    const totalCount = this.animationManager.getTotalCount();

    this.uiElements.metrics.activeCount.textContent = activeCount;
    this.uiElements.metrics.totalCount.textContent = totalCount;

    if (metrics.framesProcessed > 0) {
      const fps = Math.round(1000 / metrics.averageFrameTime);
      this.uiElements.metrics.fps.textContent = isFinite(fps) ? fps : "0";
      this.uiElements.metrics.frameTime.textContent = `${metrics.averageFrameTime.toFixed(
        1
      )} ms`;
    }
  }

  /**
   * Update active animations list
   * @private
   */
  updateActiveAnimationsList() {
    if (!this.uiElements.activeList) return;

    const activeAnimations = Array.from(this.animationManager.activeAnimations);

    if (activeAnimations.length === 0) {
      this.uiElements.activeList.innerHTML =
        '<div class="animation-empty-state">No active animations</div>';
      return;
    }

    let html = "";

    activeAnimations
      .slice(0, this.options.activePreviewLimit)
      .forEach((animId) => {
        const animation = this.animationManager.getAnimation(animId);
        if (!animation) return;

        const progress = this.animationManager.getProgress(animId);
        const isPlaying = this.animationManager.isPlaying(animId);

        // Determine animation type icon
        let typeIcon = "🎬";
        if (animation.type === "sprite") typeIcon = "🖼️";
        else if (animation.type === "property") typeIcon = "⚙️";

        html += `
        <div class="animation-list-item" data-anim-id="${animId}">
          <div class="animation-item-header">
            <span class="animation-item-type">${typeIcon}</span>
            <span class="animation-item-id">${animId}</span>
            <div class="animation-item-status ${
              isPlaying ? "playing" : animation.isPaused ? "paused" : "stopped"
            }"></div>
            <div class="animation-item-controls">
              <button class="animation-item-btn" data-action="play" title="Play">▶</button>
              <button class="animation-item-btn" data-action="pause" title="Pause">⏸</button>
              <button class="animation-item-btn" data-action="stop" title="Stop">⏹</button>
            </div>
          </div>
          <div class="animation-item-progress">
            <div class="animation-progress-bar">
              <div class="animation-progress-fill" style="width: ${
                progress * 100
              }%"></div>
            </div>
            <span class="animation-progress-text">${Math.round(
              progress * 100
            )}%</span>
          </div>
        </div>
      `;
      });

    if (activeAnimations.length > this.options.activePreviewLimit) {
      html += `<div class="animation-list-count">... and ${
        activeAnimations.length - this.options.activePreviewLimit
      } more</div>`;
    }

    this.uiElements.activeList.innerHTML = html;

    // Add event listeners to animation items
    this.uiElements.activeList
      .querySelectorAll(".animation-item-btn")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const action = e.target.dataset.action;
          const animId = e.target.closest(".animation-list-item").dataset
            .animId;

          switch (action) {
            case "play":
              this.animationManager.play(animId);
              break;
            case "pause":
              this.animationManager.pause(animId);
              break;
            case "stop":
              this.animationManager.stop(animId);
              break;
          }

          e.stopPropagation();
        });
      });

    // Add click handlers to select animations
    this.uiElements.activeList
      .querySelectorAll(".animation-list-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          const animId = item.dataset.animId;
          this.selectAnimation(animId);
        });
      });
  }

  /**
   * Update inspector display
   * @private
   */
  updateInspector() {
    if (!this.uiElements.inspector || !this.selectedAnimation) return;

    const animation = this.animationManager.getAnimation(
      this.selectedAnimation
    );
    if (!animation) return;

    // Update timeline playhead
    const progress = this.animationManager.getProgress(this.selectedAnimation);
    if (this.uiElements.inspectorPlayhead) {
      this.uiElements.inspectorPlayhead.style.left = `${progress * 100}%`;
    }

    // Update progress slider
    const progressSlider = document.getElementById("animation-progress-slider");
    if (progressSlider) {
      progressSlider.value = progress * 100;
    }
  }

  /**
   * Select an animation for inspection
   * @param {string} animId - Animation ID
   */
  selectAnimation(animId) {
    this.selectedAnimation = animId;

    if (!this.uiElements.inspectorDetails) return;

    const animation = this.animationManager.getAnimation(animId);
    if (!animation) return;

    // Update selection in lists
    document.querySelectorAll(".animation-list-item").forEach((item) => {
      item.classList.remove("selected");
      if (item.dataset.animId === animId) {
        item.classList.add("selected");
      }
    });

    // Update details panel
    const isPlaying = this.animationManager.isPlaying(animId);
    const progress = this.animationManager.getProgress(animId);

    this.uiElements.inspectorDetails.innerHTML = `
      <div class="animation-detail">
        <span class="animation-detail-label">ID:</span>
        <span class="animation-detail-value">${animation.id}</span>
      </div>
      <div class="animation-detail">
        <span class="animation-detail-label">Type:</span>
        <span class="animation-detail-value">${animation.type}</span>
      </div>
      <div class="animation-detail">
        <span class="animation-detail-label">Status:</span>
        <span class="animation-detail-value">
          <span class="animation-status ${
            isPlaying ? "playing" : animation.isPaused ? "paused" : "stopped"
          }">
            ${isPlaying ? "Playing" : animation.isPaused ? "Paused" : "Stopped"}
          </span>
        </span>
      </div>
      <div class="animation-detail">
        <span class="animation-detail-label">Duration:</span>
        <span class="animation-detail-value">${animation.duration}ms</span>
      </div>
      <div class="animation-detail">
        <span class="animation-detail-label">Progress:</span>
        <span class="animation-detail-value">${Math.round(
          progress * 100
        )}%</span>
      </div>
      <div class="animation-detail">
        <span class="animation-detail-label">Easing:</span>
        <span class="animation-detail-value">${animation.easing}</span>
      </div>
      <div class="animation-detail">
        <span class="animation-detail-label">Iterations:</span>
        <span class="animation-detail-value">${animation.iterations}</span>
      </div>
      <div class="animation-detail">
        <span class="animation-detail-label">Playback Rate:</span>
        <span class="animation-detail-value">${animation.playbackRate}x</span>
      </div>
    `;
  }

  /**
   * Show debug panel
   */
  showDebugPanel() {
    if (this.uiElements.debugPanel) {
      this.uiElements.debugPanel.classList.remove("hidden");
    }
  }

  /**
   * Hide debug panel
   */
  hideDebugPanel() {
    if (this.uiElements.debugPanel) {
      this.uiElements.debugPanel.classList.add("hidden");
    }
  }

  /**
   * Show inspector
   */
  showInspector() {
    if (this.uiElements.inspector) {
      this.uiElements.inspector.classList.remove("hidden");
    }
  }

  /**
   * Hide inspector
   */
  hideInspector() {
    if (this.uiElements.inspector) {
      this.uiElements.inspector.classList.add("hidden");
    }
  }

  /**
   * Clean up and destroy the UI
   */
  destroy() {
    // Clear intervals
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.previewInterval) {
      clearInterval(this.previewInterval);
      this.previewInterval = null;
    }

    if (this.inspectorInterval) {
      clearInterval(this.inspectorInterval);
      this.inspectorInterval = null;
    }

    // Remove UI elements
    if (this.uiElements.debugPanel) {
      this.uiElements.debugPanel.remove();
    }

    if (this.uiElements.inspector) {
      this.uiElements.inspector.remove();
    }

    // Clear references
    this.uiElements = {};
    this.selectedAnimation = null;

    // Remove game integration
    if (this.game && this.game.animation) {
      delete this.game.animation;
    }
  }
}
