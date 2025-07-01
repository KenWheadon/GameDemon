/**
 * AudioManagerUI - Audio Settings UI Integration Class
 * Provides visual controls and settings panel for the AudioManager
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class AudioManagerUI {
  constructor(audioManager, options = {}) {
    this.audioManager = audioManager;

    // Configuration options with defaults
    this.options = {
      enableDebugLogs: false,
      keyboardShortcuts: true,
      autoSave: true,
      updateInterval: 1000,
      floatingButton: true,
      floatingButtonPosition: { bottom: "20px", left: "20px" },
      enableNotifications: true,
      ...options,
    };

    // UI state
    this.isOpen = false;
    this.isInitialized = false;
    this.updateTimer = null;
    this.elements = {};

    // Initialize the UI system
    this.init();
  }

  /**
   * Initialize the audio UI system
   */
  init() {
    try {
      this.log("Initializing AudioManagerUI...");

      // Create floating button if enabled
      if (this.options.floatingButton) {
        this.createFloatingButton();
      }

      // Create settings panel
      this.createSettingsPanel();

      // Set up event listeners
      this.setupEventListeners();

      // Start status updates
      this.startStatusUpdates();

      this.isInitialized = true;
      this.log("AudioManagerUI initialized successfully");
    } catch (error) {
      console.error("Failed to initialize AudioManagerUI:", error);
      this.isInitialized = false;
    }
  }

  /**
   * Create floating audio settings button
   */
  createFloatingButton() {
    this.elements.floatingButton = document.createElement("button");
    this.elements.floatingButton.id = "audio-manager-floating-button";
    this.elements.floatingButton.className = "audio-floating-button";
    this.elements.floatingButton.innerHTML = "🎵";
    this.elements.floatingButton.title = "Audio Settings";
    this.elements.floatingButton.setAttribute(
      "aria-label",
      "Open audio settings"
    );

    // Apply positioning
    const { bottom, left, right, top } = this.options.floatingButtonPosition;
    this.elements.floatingButton.style.cssText = `
      position: fixed;
      ${bottom ? `bottom: ${bottom};` : ""}
      ${left ? `left: ${left};` : ""}
      ${right ? `right: ${right};` : ""}
      ${top ? `top: ${top};` : ""}
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      font-size: 20px;
      cursor: pointer;
      z-index: 1000;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
    `;

    document.body.appendChild(this.elements.floatingButton);
    this.updateFloatingButtonState();
  }

  /**
   * Create audio settings panel
   */
  createSettingsPanel() {
    this.elements.settingsPanel = document.createElement("div");
    this.elements.settingsPanel.id = "audio-manager-settings-panel";
    this.elements.settingsPanel.className = "audio-settings-panel";
    this.elements.settingsPanel.setAttribute("role", "dialog");
    this.elements.settingsPanel.setAttribute(
      "aria-labelledby",
      "audio-settings-title"
    );
    this.elements.settingsPanel.setAttribute("aria-hidden", "true");

    // Create panel content
    this.elements.settingsPanel.innerHTML = `
      <div class="audio-settings-backdrop"></div>
      <div class="audio-settings-content">
        <div class="audio-settings-header">
          <h2 id="audio-settings-title">🎵 Audio Settings</h2>
          <button class="audio-settings-close" aria-label="Close audio settings">✕</button>
        </div>
        
        <div class="audio-settings-body">
          <!-- Master Volume Section -->
          <div class="audio-setting-group">
            <label for="audio-master-volume">Master Volume</label>
            <div class="audio-volume-control">
              <input type="range" id="audio-master-volume" min="0" max="100" value="100" 
                     class="audio-volume-slider" aria-label="Master volume">
              <span class="audio-volume-value">100%</span>
              <button class="audio-toggle-button" id="audio-toggle-mute" data-enabled="true" 
                      aria-label="Toggle mute">🔊</button>
            </div>
          </div>

          <!-- Background Music Section -->
          <div class="audio-setting-group">
            <label for="audio-background-volume">Background Music</label>
            <div class="audio-volume-control">
              <input type="range" id="audio-background-volume" min="0" max="100" value="30" 
                     class="audio-volume-slider" aria-label="Background music volume">
              <span class="audio-volume-value">30%</span>
              <button class="audio-toggle-button" id="audio-toggle-background" data-enabled="true" 
                      aria-label="Toggle background music">ON</button>
            </div>
          </div>

          <!-- Sound Effects Section -->
          <div class="audio-setting-group">
            <label for="audio-sfx-volume">Sound Effects</label>
            <div class="audio-volume-control">
              <input type="range" id="audio-sfx-volume" min="0" max="100" value="70" 
                     class="audio-volume-slider" aria-label="Sound effects volume">
              <span class="audio-volume-value">70%</span>
              <button class="audio-toggle-button" id="audio-toggle-sfx" data-enabled="true" 
                      aria-label="Toggle sound effects">ON</button>
            </div>
          </div>

          <!-- Quick Actions Section -->
          <div class="audio-setting-group">
            <label>Quick Actions</label>
            <div class="audio-quick-actions">
              <button class="audio-action-button" id="audio-test-sound" 
                      aria-label="Test sound effects">🔊 Test Sound</button>
              <button class="audio-action-button" id="audio-test-music" 
                      aria-label="Test background music">🎵 Test Music</button>
              <button class="audio-action-button danger" id="audio-reset-settings" 
                      aria-label="Reset all audio settings">🔄 Reset All</button>
            </div>
          </div>

          <!-- Audio Status Section -->
          <div class="audio-setting-group">
            <label>Audio Status</label>
            <div class="audio-status-display">
              <div class="audio-status-item">
                <span class="audio-status-label">Assets Loaded:</span>
                <span class="audio-status-value" id="audio-status-assets">0/0</span>
              </div>
              <div class="audio-status-item">
                <span class="audio-status-label">Background Music:</span>
                <span class="audio-status-value" id="audio-status-background">Ready</span>
              </div>
              <div class="audio-status-item">
                <span class="audio-status-label">Sound Effects:</span>
                <span class="audio-status-value" id="audio-status-sfx">Ready</span>
              </div>
              <div class="audio-status-item">
                <span class="audio-status-label">Audio Context:</span>
                <span class="audio-status-value" id="audio-status-context">Unknown</span>
              </div>
            </div>
          </div>

          <!-- Advanced Settings (Collapsible) -->
          <div class="audio-setting-group">
            <label>
              <button class="audio-advanced-toggle" id="audio-advanced-toggle" 
                      aria-expanded="false" aria-controls="audio-advanced-content">
                ⚙️ Advanced Settings <span class="audio-advanced-arrow">▼</span>
              </button>
            </label>
            <div class="audio-advanced-content" id="audio-advanced-content" style="display: none;">
              <div class="audio-advanced-item">
                <label for="audio-fade-duration">Fade Duration (ms)</label>
                <input type="range" id="audio-fade-duration" min="500" max="5000" value="2000" step="100">
                <span class="audio-fade-duration-value">2000ms</span>
              </div>
              <div class="audio-advanced-item">
                <button class="audio-action-button" id="audio-preload-all">🔄 Reload All Audio</button>
                <button class="audio-action-button" id="audio-clear-cache">🗑️ Clear Cache</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with shortcuts info -->
        <div class="audio-settings-footer">
          <small>💡 Tip: Press <kbd>Escape</kbd> to close this panel</small>
        </div>
      </div>
    `;

    document.body.appendChild(this.elements.settingsPanel);
    this.hideSettingsPanel();
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Floating button click
    if (this.elements.floatingButton) {
      this.elements.floatingButton.addEventListener("click", () => {
        this.toggleSettingsPanel();
      });
    }

    // Close button and backdrop
    const closeButton = this.elements.settingsPanel.querySelector(
      ".audio-settings-close"
    );
    const backdrop = this.elements.settingsPanel.querySelector(
      ".audio-settings-backdrop"
    );

    closeButton.addEventListener("click", () => {
      this.hideSettingsPanel();
    });

    backdrop.addEventListener("click", () => {
      this.hideSettingsPanel();
    });

    // Volume sliders
    this.setupVolumeControls();

    // Toggle buttons
    this.setupToggleButtons();

    // Action buttons
    this.setupActionButtons();

    // Advanced settings
    this.setupAdvancedSettings();

    // Keyboard shortcuts
    if (this.options.keyboardShortcuts) {
      this.setupKeyboardShortcuts();
    }

    // Auto-save on changes if enabled
    if (this.options.autoSave) {
      this.setupAutoSave();
    }
  }

  /**
   * Set up volume control sliders
   */
  setupVolumeControls() {
    const masterSlider = this.elements.settingsPanel.querySelector(
      "#audio-master-volume"
    );
    const backgroundSlider = this.elements.settingsPanel.querySelector(
      "#audio-background-volume"
    );
    const sfxSlider =
      this.elements.settingsPanel.querySelector("#audio-sfx-volume");

    // Master volume
    masterSlider.addEventListener("input", (e) => {
      const value = parseInt(e.target.value) / 100;
      this.audioManager.setMasterVolume(value);
      this.updateVolumeDisplay(e.target, value);
      this.showVolumeChangeNotification("Master", value);
    });

    // Background music volume
    backgroundSlider.addEventListener("input", (e) => {
      const value = parseInt(e.target.value) / 100;
      this.audioManager.setBackgroundVolume(value);
      this.updateVolumeDisplay(e.target, value);
      this.showVolumeChangeNotification("Background Music", value);
    });

    // Sound effects volume
    sfxSlider.addEventListener("input", (e) => {
      const value = parseInt(e.target.value) / 100;
      this.audioManager.setSfxVolume(value);
      this.updateVolumeDisplay(e.target, value);
      this.showVolumeChangeNotification("Sound Effects", value);
    });
  }

  /**
   * Set up toggle buttons
   */
  setupToggleButtons() {
    const muteToggle =
      this.elements.settingsPanel.querySelector("#audio-toggle-mute");
    const backgroundToggle = this.elements.settingsPanel.querySelector(
      "#audio-toggle-background"
    );
    const sfxToggle =
      this.elements.settingsPanel.querySelector("#audio-toggle-sfx");

    // Master mute toggle
    muteToggle.addEventListener("click", () => {
      const isMuted = this.audioManager.toggleMute();
      this.updateMuteButton(muteToggle, isMuted);
      this.updateFloatingButtonState();
      this.showNotification(isMuted ? "Audio Muted" : "Audio Unmuted");
    });

    // Background music toggle
    backgroundToggle.addEventListener("click", () => {
      const enabled = this.audioManager.toggleBackgroundMusic();
      this.updateToggleButton(backgroundToggle, enabled);
      this.showNotification(
        `Background Music ${enabled ? "Enabled" : "Disabled"}`
      );
    });

    // Sound effects toggle
    sfxToggle.addEventListener("click", () => {
      const enabled = this.audioManager.toggleSoundEffects();
      this.updateToggleButton(sfxToggle, enabled);
      this.showNotification(
        `Sound Effects ${enabled ? "Enabled" : "Disabled"}`
      );
    });
  }

  /**
   * Set up action buttons
   */
  setupActionButtons() {
    const testSoundButton =
      this.elements.settingsPanel.querySelector("#audio-test-sound");
    const testMusicButton =
      this.elements.settingsPanel.querySelector("#audio-test-music");
    const resetButton = this.elements.settingsPanel.querySelector(
      "#audio-reset-settings"
    );
    const preloadButton =
      this.elements.settingsPanel.querySelector("#audio-preload-all");
    const clearCacheButton =
      this.elements.settingsPanel.querySelector("#audio-clear-cache");

    // Test sound effect
    testSoundButton.addEventListener("click", () => {
      this.audioManager.playSoundEffect("achievement", 1.0);
      this.showNotification("Playing test sound effect");
    });

    // Test background music
    testMusicButton.addEventListener("click", () => {
      if (this.audioManager.currentTrackKey) {
        this.audioManager.stopBackgroundMusic(true);
        this.showNotification("Stopped background music");
      } else {
        this.audioManager.playBackgroundMusic("menu", true);
        this.showNotification("Playing test background music");
      }
    });

    // Reset all settings
    resetButton.addEventListener("click", () => {
      if (confirm("Reset all audio settings to defaults?")) {
        this.audioManager.resetSettings();
        this.updateAllControls();
        this.showNotification("Audio settings reset to defaults");
      }
    });

    // Reload all audio assets
    preloadButton.addEventListener("click", async () => {
      this.showNotification("Reloading audio assets...");
      try {
        const results = await this.audioManager.preloadAllAudio();
        this.showNotification(
          `Reloaded ${results.successful}/${results.total} audio assets`
        );
      } catch (error) {
        this.showNotification("Failed to reload audio assets", "error");
      }
    });

    // Clear audio cache
    clearCacheButton.addEventListener("click", () => {
      if (
        confirm(
          "Clear audio cache? This will require reloading all audio assets."
        )
      ) {
        // This would be implemented based on your caching strategy
        this.showNotification("Audio cache cleared");
      }
    });
  }

  /**
   * Set up advanced settings controls
   */
  setupAdvancedSettings() {
    const advancedToggle = this.elements.settingsPanel.querySelector(
      "#audio-advanced-toggle"
    );
    const advancedContent = this.elements.settingsPanel.querySelector(
      "#audio-advanced-content"
    );
    const fadeDurationSlider = this.elements.settingsPanel.querySelector(
      "#audio-fade-duration"
    );
    const fadeDurationValue = this.elements.settingsPanel.querySelector(
      ".audio-fade-duration-value"
    );

    // Advanced settings toggle
    advancedToggle.addEventListener("click", () => {
      const isExpanded =
        advancedToggle.getAttribute("aria-expanded") === "true";
      const newState = !isExpanded;

      advancedToggle.setAttribute("aria-expanded", newState.toString());
      advancedContent.style.display = newState ? "block" : "none";
      advancedToggle.querySelector(".audio-advanced-arrow").textContent =
        newState ? "▲" : "▼";
    });

    // Fade duration slider
    fadeDurationSlider.addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      fadeDurationValue.textContent = `${value}ms`;
      this.audioManager.options.fadeTransitionDuration = value;
    });
  }

  /**
   * Set up keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Only trigger when not in input fields or conversation mode
      const isInputFocused = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement.tagName
      );
      const isConversationActive =
        document.querySelector(".conversation-panel")?.style.display === "flex";

      if (isInputFocused || isConversationActive) {
        return;
      }

      switch (e.key) {
        case "Escape":
          if (this.isOpen) {
            e.preventDefault();
            this.hideSettingsPanel();
          }
          break;
        case "a":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.toggleSettingsPanel();
          }
          break;
        case "m":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.audioManager.toggleMute();
            this.updateFloatingButtonState();
          }
          break;
      }
    });
  }

  /**
   * Set up auto-save functionality
   */
  setupAutoSave() {
    // Save settings when values change
    const saveSettings = () => {
      if (this.options.autoSave) {
        this.audioManager.saveSettings();
      }
    };

    // Add event listeners to all controls that should trigger auto-save
    const autoSaveControls = this.elements.settingsPanel.querySelectorAll(
      ".audio-volume-slider, .audio-toggle-button"
    );

    autoSaveControls.forEach((control) => {
      control.addEventListener("change", saveSettings);
    });
  }

  /**
   * Toggle settings panel visibility
   */
  toggleSettingsPanel() {
    if (this.isOpen) {
      this.hideSettingsPanel();
    } else {
      this.showSettingsPanel();
    }
  }

  /**
   * Show settings panel with animation
   */
  showSettingsPanel() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.elements.settingsPanel.classList.add("visible");
    this.elements.settingsPanel.setAttribute("aria-hidden", "false");

    // Focus management for accessibility
    const firstFocusable = this.elements.settingsPanel.querySelector(
      "input, button, select, [tabindex]"
    );
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }

    // Update all controls to current values
    this.updateAllControls();

    // Resume audio context if needed
    this.audioManager.resumeAudioContext();

    this.log("Audio settings panel opened");
  }

  /**
   * Hide settings panel with animation
   */
  hideSettingsPanel() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.elements.settingsPanel.classList.remove("visible");
    this.elements.settingsPanel.setAttribute("aria-hidden", "true");

    // Auto-save on close if enabled
    if (this.options.autoSave) {
      this.audioManager.saveSettings();
    }

    this.log("Audio settings panel closed");
  }

  /**
   * Update all UI controls to reflect current audio state
   */
  updateAllControls() {
    const stats = this.audioManager.getStats();

    // Update volume sliders
    const masterSlider = this.elements.settingsPanel.querySelector(
      "#audio-master-volume"
    );
    const backgroundSlider = this.elements.settingsPanel.querySelector(
      "#audio-background-volume"
    );
    const sfxSlider =
      this.elements.settingsPanel.querySelector("#audio-sfx-volume");

    masterSlider.value = Math.round(stats.volumes.master * 100);
    backgroundSlider.value = Math.round(stats.volumes.background * 100);
    sfxSlider.value = Math.round(stats.volumes.sfx * 100);

    // Update volume displays
    this.updateVolumeDisplay(masterSlider, stats.volumes.master);
    this.updateVolumeDisplay(backgroundSlider, stats.volumes.background);
    this.updateVolumeDisplay(sfxSlider, stats.volumes.sfx);

    // Update toggle buttons
    const muteButton =
      this.elements.settingsPanel.querySelector("#audio-toggle-mute");
    const backgroundButton = this.elements.settingsPanel.querySelector(
      "#audio-toggle-background"
    );
    const sfxButton =
      this.elements.settingsPanel.querySelector("#audio-toggle-sfx");

    this.updateMuteButton(muteButton, stats.settings.isMuted);
    this.updateToggleButton(
      backgroundButton,
      stats.settings.backgroundMusicEnabled
    );
    this.updateToggleButton(sfxButton, stats.settings.sfxEnabled);

    // Update advanced settings
    const fadeDurationSlider = this.elements.settingsPanel.querySelector(
      "#audio-fade-duration"
    );
    const fadeDurationValue = this.elements.settingsPanel.querySelector(
      ".audio-fade-duration-value"
    );

    if (fadeDurationSlider && fadeDurationValue) {
      fadeDurationSlider.value =
        this.audioManager.options.fadeTransitionDuration;
      fadeDurationValue.textContent = `${this.audioManager.options.fadeTransitionDuration}ms`;
    }

    // Update floating button state
    this.updateFloatingButtonState();
  }

  /**
   * Update volume display next to slider
   * @param {HTMLElement} slider - Volume slider element
   * @param {number} value - Volume value (0-1)
   */
  updateVolumeDisplay(slider, value) {
    const volumeValue = slider.parentElement.querySelector(
      ".audio-volume-value"
    );
    if (volumeValue) {
      volumeValue.textContent = `${Math.round(value * 100)}%`;
    }
  }

  /**
   * Update mute button appearance
   * @param {HTMLElement} button - Mute button element
   * @param {boolean} isMuted - Mute state
   */
  updateMuteButton(button, isMuted) {
    button.textContent = isMuted ? "🔇" : "🔊";
    button.setAttribute("data-enabled", (!isMuted).toString());
    button.setAttribute("aria-label", isMuted ? "Unmute audio" : "Mute audio");
  }

  /**
   * Update toggle button appearance
   * @param {HTMLElement} button - Toggle button element
   * @param {boolean} enabled - Enabled state
   */
  updateToggleButton(button, enabled) {
    button.textContent = enabled ? "ON" : "OFF";
    button.setAttribute("data-enabled", enabled.toString());
  }

  /**
   * Update floating button state based on audio settings
   */
  updateFloatingButtonState() {
    if (!this.elements.floatingButton) return;

    const stats = this.audioManager.getStats();

    if (stats.settings.isMuted) {
      this.elements.floatingButton.classList.add("muted");
      this.elements.floatingButton.innerHTML = "🔇";
      this.elements.floatingButton.title =
        "Audio Muted - Click to open settings";
    } else {
      this.elements.floatingButton.classList.remove("muted");
      this.elements.floatingButton.innerHTML = "🎵";
      this.elements.floatingButton.title = "Audio Settings";
    }
  }

  /**
   * Start periodic status updates
   */
  startStatusUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(() => {
      if (this.isOpen) {
        this.updateAudioStatus();
      }
      this.updateFloatingButtonState();
    }, this.options.updateInterval);
  }

  /**
   * Update audio status display
   */
  updateAudioStatus() {
    const stats = this.audioManager.getStats();

    // Assets status
    const assetsStatus = this.elements.settingsPanel.querySelector(
      "#audio-status-assets"
    );
    if (assetsStatus) {
      const total = stats.loadedAssets + stats.failedAssets;
      assetsStatus.textContent = `${stats.loadedAssets}/${total}`;
      assetsStatus.style.color = stats.failedAssets > 0 ? "#f39c12" : "#27ae60";
    }

    // Background music status
    const backgroundStatus = this.elements.settingsPanel.querySelector(
      "#audio-status-background"
    );
    if (backgroundStatus) {
      if (stats.settings.isMuted) {
        backgroundStatus.textContent = "Muted";
        backgroundStatus.style.color = "#e74c3c";
      } else if (!stats.settings.backgroundMusicEnabled) {
        backgroundStatus.textContent = "Disabled";
        backgroundStatus.style.color = "#f39c12";
      } else if (stats.isPlaying) {
        backgroundStatus.textContent = `Playing: ${
          stats.currentlyPlaying || "Unknown"
        }`;
        backgroundStatus.style.color = "#27ae60";
      } else {
        backgroundStatus.textContent = "Ready";
        backgroundStatus.style.color = "#3498db";
      }
    }

    // Sound effects status
    const sfxStatus =
      this.elements.settingsPanel.querySelector("#audio-status-sfx");
    if (sfxStatus) {
      if (stats.settings.isMuted) {
        sfxStatus.textContent = "Muted";
        sfxStatus.style.color = "#e74c3c";
      } else if (!stats.settings.sfxEnabled) {
        sfxStatus.textContent = "Disabled";
        sfxStatus.style.color = "#f39c12";
      } else {
        sfxStatus.textContent = `Ready (${stats.soundEffects} loaded)`;
        sfxStatus.style.color = "#27ae60";
      }
    }

    // Audio context status
    const contextStatus = this.elements.settingsPanel.querySelector(
      "#audio-status-context"
    );
    if (contextStatus) {
      if (!stats.audioContextSupported) {
        contextStatus.textContent = "Not Supported";
        contextStatus.style.color = "#f39c12";
      } else {
        contextStatus.textContent = stats.audioContextState;
        contextStatus.style.color =
          stats.audioContextState === "running" ? "#27ae60" : "#3498db";
      }
    }
  }

  /**
   * Show volume change notification
   * @param {string} type - Volume type (Master, Background Music, etc.)
   * @param {number} value - Volume value (0-1)
   */
  showVolumeChangeNotification(type, value) {
    if (!this.options.enableNotifications) return;

    const percentage = Math.round(value * 100);
    this.showNotification(`${type}: ${percentage}%`, "info", 1000);
  }

  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('info', 'success', 'warning', 'error')
   * @param {number} duration - Display duration in milliseconds
   */
  showNotification(message, type = "info", duration = 2000) {
    if (!this.options.enableNotifications) return;

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `audio-notification audio-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      z-index: 10000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      border-left: 4px solid ${this.getNotificationColor(type)};
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 10);

    // Auto-remove
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  /**
   * Get notification color for type
   * @param {string} type - Notification type
   * @returns {string} - CSS color value
   */
  getNotificationColor(type) {
    switch (type) {
      case "success":
        return "#27ae60";
      case "warning":
        return "#f39c12";
      case "error":
        return "#e74c3c";
      default:
        return "#3498db";
    }
  }

  /**
   * Get current UI settings for external access
   * @returns {Object} - Current settings and state
   */
  getUISettings() {
    return {
      isOpen: this.isOpen,
      audioStats: this.audioManager.getStats(),
      options: { ...this.options },
    };
  }

  /**
   * Clean up and destroy the UI
   */
  destroy() {
    this.log("Destroying AudioManagerUI...");

    // Stop status updates
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    // Remove DOM elements
    if (
      this.elements.floatingButton &&
      this.elements.floatingButton.parentNode
    ) {
      this.elements.floatingButton.parentNode.removeChild(
        this.elements.floatingButton
      );
    }

    if (this.elements.settingsPanel && this.elements.settingsPanel.parentNode) {
      this.elements.settingsPanel.parentNode.removeChild(
        this.elements.settingsPanel
      );
    }

    // Auto-save settings if enabled
    if (this.options.autoSave) {
      this.audioManager.saveSettings();
    }

    // Clear references
    this.elements = {};
    this.isInitialized = false;
    this.isOpen = false;

    this.log("AudioManagerUI destroyed");
  }

  /**
   * Debug logging helper
   * @param {string} message - Log message
   * @param {string} level - Log level ('info', 'warn', 'error')
   */
  log(message, level = "info") {
    if (this.options.enableDebugLogs) {
      const logMethod =
        level === "error"
          ? console.error
          : level === "warn"
          ? console.warn
          : console.log;
      logMethod(`[AudioManagerUI] ${message}`);
    }
  }
}
