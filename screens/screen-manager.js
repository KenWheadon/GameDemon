/**
 * ScreenManager.js - Game Integration Screen Manager
 * Part of Vanilla JavaScript Game Development Toolkit
 *
 * Manages multiple Screen instances for game flow control including
 * transitions, state management, and integration with other game systems.
 *
 * Features:
 * - Screen registration and management
 * - Smooth transitions between screens
 * - Navigation history and back functionality
 * - State persistence across screen changes
 * - Integration hooks for Achievement and Drawer systems
 * - Configuration-driven screen setup
 * - Error handling and fallback screens
 * - Performance optimizations
 *
 * @author Game Development Toolkit
 * @version 1.0.0
 */

class ScreenManager {
  /**
   * Create a new ScreenManager instance
   * @param {Object} config - Manager configuration object
   * @param {Object} [config.screens] - Screen configurations object
   * @param {Object} [config.transitions] - Transition configurations
   * @param {boolean} [config.enableHistory=true] - Enable navigation history
   * @param {string} [config.defaultScreen] - Default screen to show
   * @param {Function} [config.onScreenChange] - Callback for screen changes
   * @param {Object} [config.integrations] - Integration configurations
   */
  constructor(config = {}) {
    try {
      // Core configuration
      this.config = {
        enableHistory: config.enableHistory !== false,
        defaultScreen: config.defaultScreen || null,
        transitions: config.transitions || {},
        integrations: config.integrations || {},
        ...config,
      };

      // Screen management
      this.screens = new Map();
      this.currentScreen = null;
      this.previousScreen = null;
      this.screenHistory = [];

      // State management
      this.isTransitioning = false;
      this.globalState = {};
      this.screenStates = new Map();

      // Callbacks
      this.onScreenChange = config.onScreenChange || null;

      // Integration references
      this.achievementManager = null;
      this.drawerManager = null;

      // Event listeners for cleanup
      this.eventListeners = [];

      // Initialize with provided screen configurations
      if (config.screens) {
        this.registerScreens(config.screens);
      }

      this._initializeIntegrations();
      this._attachGlobalEventListeners();
    } catch (error) {
      console.error("ScreenManager initialization error:", error);
      this._initFallback();
    }
  }

  /**
   * Initialize integrations with other game systems
   * @private
   */
  _initializeIntegrations() {
    try {
      const { integrations } = this.config;

      // Achievement System Integration
      if (integrations.achievements && window.AchievementManager) {
        this.achievementManager = integrations.achievements;
      }

      // Drawer System Integration
      if (integrations.drawer && window.DrawerManager) {
        this.drawerManager = integrations.drawer;
      }
    } catch (error) {
      console.error("Integration initialization error:", error);
    }
  }

  /**
   * Fallback initialization for error cases
   * @private
   */
  _initFallback() {
    this.screens = new Map();
    this.currentScreen = null;
    this.isTransitioning = false;
    console.warn("ScreenManager initialized in fallback mode");
  }

  /**
   * Register multiple screens from configuration object
   * @param {Object} screensConfig - Object containing screen configurations
   * @example
   * screenManager.registerScreens({
   *   start: { type: 'start', title: 'Game Start', buttons: [...] },
   *   end: { type: 'end', title: 'Game Over', buttons: [...] }
   * });
   */
  registerScreens(screensConfig) {
    try {
      Object.entries(screensConfig).forEach(([screenId, screenConfig]) => {
        this.registerScreen(screenId, screenConfig);
      });
    } catch (error) {
      console.error("Error registering screens:", error);
    }
  }

  /**
   * Register a single screen
   * @param {string} screenId - Unique identifier for the screen
   * @param {Object} screenConfig - Screen configuration object
   * @returns {Screen|null} Created screen instance or null if failed
   */
  registerScreen(screenId, screenConfig) {
    try {
      // Ensure Screen class is available
      if (typeof Screen === "undefined") {
        throw new Error("Screen class not found. Please include Screen.js");
      }

      // Create screen configuration with ID
      const config = {
        id: screenId,
        ...screenConfig,
      };

      // Add default callbacks for common screen types
      this._addDefaultCallbacks(config);

      // Create screen instance
      const screen = new Screen(config);

      // Register screen
      this.screens.set(screenId, screen);

      // Initialize screen state
      this.screenStates.set(screenId, {});

      console.log(`Screen '${screenId}' registered successfully`);
      return screen;
    } catch (error) {
      console.error(`Error registering screen '${screenId}':`, error);
      return null;
    }
  }

  /**
   * Add default callbacks for common screen types
   * @private
   * @param {Object} config - Screen configuration
   */
  _addDefaultCallbacks(config) {
    // Add enhanced callbacks to buttons
    if (config.buttons) {
      config.buttons = config.buttons.map((button) => {
        const originalCallback = button.callback;

        return {
          ...button,
          callback: (screen, buttonConfig, buttonIndex) => {
            try {
              // Execute original callback
              if (originalCallback) {
                originalCallback(screen, buttonConfig, buttonIndex);
              }

              // Handle common navigation patterns
              this._handleCommonNavigation(button, screen);
            } catch (error) {
              console.error("Button callback error:", error);
            }
          },
        };
      });
    }
  }

  /**
   * Handle common navigation patterns
   * @private
   * @param {Object} button - Button configuration
   * @param {Screen} screen - Current screen
   */
  _handleCommonNavigation(button, screen) {
    // Navigation shortcuts
    if (button.navigate) {
      this.showScreen(button.navigate);
    } else if (button.action === "back") {
      this.goBack();
    } else if (button.action === "restart") {
      this.restart();
    } else if (button.action === "quit") {
      this.quit();
    }
  }

  /**
   * Show a specific screen
   * @param {string} screenId - ID of screen to show
   * @param {Object} [options] - Show options
   * @param {boolean} [options.animate=true] - Whether to animate transition
   * @param {Object} [options.data] - Data to pass to the screen
   * @param {boolean} [options.addToHistory=true] - Add to navigation history
   * @returns {Promise<boolean>} Success status
   */
  async showScreen(screenId, options = {}) {
    if (this.isTransitioning) {
      console.warn("Screen transition already in progress");
      return false;
    }

    try {
      const screen = this.screens.get(screenId);
      if (!screen) {
        console.error(`Screen '${screenId}' not found`);
        return false;
      }

      this.isTransitioning = true;
      const animate = options.animate !== false;
      const addToHistory = options.addToHistory !== false;

      // Store current screen in history
      if (this.currentScreen && addToHistory && this.config.enableHistory) {
        this.screenHistory.push({
          screenId: this.currentScreen.id,
          timestamp: Date.now(),
          state: this._captureScreenState(this.currentScreen),
        });

        // Limit history size
        if (this.screenHistory.length > 10) {
          this.screenHistory.shift();
        }
      }

      // Hide current screen
      if (this.currentScreen) {
        await this.currentScreen.hide({ animate });
        this.previousScreen = this.currentScreen;
      }

      // Pass data to screen if provided
      if (options.data) {
        this._setScreenData(screenId, options.data);
      }

      // Show new screen
      await screen.show({ animate });

      // Update current screen reference
      this.currentScreen = screen;
      this.isTransitioning = false;

      // Execute screen change callback
      if (this.onScreenChange) {
        this.onScreenChange(screen, this.previousScreen);
      }

      // Emit screen change event
      this._emitEvent("screenManagerChange", {
        current: screen,
        previous: this.previousScreen,
        manager: this,
      });

      // Integration hooks
      this._notifyIntegrations("screenChange", { screen, screenId });

      return true;
    } catch (error) {
      console.error("Error showing screen:", error);
      this.isTransitioning = false;
      return false;
    }
  }

  /**
   * Go back to the previous screen in history
   * @param {Object} [options] - Navigation options
   * @returns {Promise<boolean>} Success status
   */
  async goBack(options = {}) {
    if (!this.config.enableHistory || this.screenHistory.length === 0) {
      console.warn("No screen history available");
      return false;
    }

    try {
      const previousEntry = this.screenHistory.pop();
      const animate = options.animate !== false;

      await this.showScreen(previousEntry.screenId, {
        animate,
        addToHistory: false, // Don't add back navigation to history
      });

      // Restore previous screen state
      if (previousEntry.state) {
        this._restoreScreenState(previousEntry.screenId, previousEntry.state);
      }

      return true;
    } catch (error) {
      console.error("Error going back:", error);
      return false;
    }
  }

  /**
   * Show the default screen
   * @param {Object} [options] - Show options
   * @returns {Promise<boolean>} Success status
   */
  async showDefaultScreen(options = {}) {
    if (!this.config.defaultScreen) {
      console.warn("No default screen configured");
      return false;
    }

    return await this.showScreen(this.config.defaultScreen, options);
  }

  /**
   * Restart the screen flow (go to default screen and clear history)
   * @param {Object} [options] - Restart options
   * @returns {Promise<boolean>} Success status
   */
  async restart(options = {}) {
    try {
      // Clear navigation history
      this.screenHistory = [];

      // Reset global state if requested
      if (options.resetState !== false) {
        this.globalState = {};
        this.screenStates.clear();
      }

      // Show default screen
      return await this.showDefaultScreen(options);
    } catch (error) {
      console.error("Error restarting:", error);
      return false;
    }
  }

  /**
   * Quit/close all screens
   * @param {Object} [options] - Quit options
   * @returns {Promise<boolean>} Success status
   */
  async quit(options = {}) {
    try {
      if (this.currentScreen) {
        await this.currentScreen.hide({ animate: options.animate !== false });
        this.currentScreen = null;
      }

      // Emit quit event
      this._emitEvent("screenManagerQuit", { manager: this });

      return true;
    } catch (error) {
      console.error("Error quitting:", error);
      return false;
    }
  }

  /**
   * Get a registered screen by ID
   * @param {string} screenId - Screen ID
   * @returns {Screen|null} Screen instance or null
   */
  getScreen(screenId) {
    return this.screens.get(screenId) || null;
  }

  /**
   * Get current screen
   * @returns {Screen|null} Current screen or null
   */
  getCurrentScreen() {
    return this.currentScreen;
  }

  /**
   * Get screen history
   * @returns {Array} Copy of screen history
   */
  getHistory() {
    return [...this.screenHistory];
  }

  /**
   * Set global state data
   * @param {string} key - State key
   * @param {*} value - State value
   */
  setGlobalState(key, value) {
    this.globalState[key] = value;
  }

  /**
   * Get global state data
   * @param {string} key - State key
   * @param {*} [defaultValue] - Default value if key not found
   * @returns {*} State value
   */
  getGlobalState(key, defaultValue = null) {
    return this.globalState[key] !== undefined
      ? this.globalState[key]
      : defaultValue;
  }

  /**
   * Set screen-specific data
   * @private
   * @param {string} screenId - Screen ID
   * @param {Object} data - Data to set
   */
  _setScreenData(screenId, data) {
    const existingState = this.screenStates.get(screenId) || {};
    this.screenStates.set(screenId, { ...existingState, ...data });
  }

  /**
   * Get screen-specific data
   * @param {string} screenId - Screen ID
   * @param {string} [key] - Specific data key
   * @returns {*} Screen data
   */
  getScreenData(screenId, key = null) {
    const screenState = this.screenStates.get(screenId) || {};
    return key ? screenState[key] : screenState;
  }

  /**
   * Capture current screen state
   * @private
   * @param {Screen} screen - Screen to capture state from
   * @returns {Object} Captured state
   */
  _captureScreenState(screen) {
    return {
      ...screen.getState(),
      customData: this.screenStates.get(screen.id) || {},
    };
  }

  /**
   * Restore screen state
   * @private
   * @param {string} screenId - Screen ID
   * @param {Object} state - State to restore
   */
  _restoreScreenState(screenId, state) {
    if (state.customData) {
      this.screenStates.set(screenId, state.customData);
    }
  }

  /**
   * Notify integrated systems of events
   * @private
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   */
  _notifyIntegrations(eventType, data) {
    try {
      // Notify Achievement Manager
      if (this.achievementManager && this.achievementManager.onScreenEvent) {
        this.achievementManager.onScreenEvent(eventType, data);
      }

      // Notify Drawer Manager
      if (this.drawerManager && this.drawerManager.onScreenEvent) {
        this.drawerManager.onScreenEvent(eventType, data);
      }
    } catch (error) {
      console.error("Integration notification error:", error);
    }
  }

  /**
   * Attach global event listeners
   * @private
   */
  _attachGlobalEventListeners() {
    // Listen for Screen events
    const screenEventHandler = (event) => {
      this._handleScreenEvent(event);
    };

    document.addEventListener("screenButtonClick", screenEventHandler);
    document.addEventListener("screenEscape", screenEventHandler);

    this.eventListeners.push(
      {
        element: document,
        event: "screenButtonClick",
        handler: screenEventHandler,
      },
      { element: document, event: "screenEscape", handler: screenEventHandler }
    );
  }

  /**
   * Handle Screen events
   * @private
   * @param {CustomEvent} event - Screen event
   */
  _handleScreenEvent(event) {
    try {
      const { detail } = event;

      switch (event.type) {
        case "screenButtonClick":
          this._emitEvent("screenManagerButtonClick", detail);
          break;
        case "screenEscape":
          // Default escape behavior - go back or quit
          if (this.screenHistory.length > 0) {
            this.goBack();
          } else {
            this.quit();
          }
          break;
      }
    } catch (error) {
      console.error("Screen event handling error:", error);
    }
  }

  /**
   * Update screen configuration
   * @param {string} screenId - Screen ID to update
   * @param {Object} updates - Updates to apply
   * @returns {boolean} Success status
   */
  updateScreen(screenId, updates) {
    try {
      const screen = this.screens.get(screenId);
      if (!screen) {
        console.error(`Screen '${screenId}' not found`);
        return false;
      }

      screen.update(updates);
      return true;
    } catch (error) {
      console.error("Error updating screen:", error);
      return false;
    }
  }

  /**
   * Get manager status and statistics
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      registeredScreens: Array.from(this.screens.keys()),
      currentScreen: this.currentScreen ? this.currentScreen.id : null,
      previousScreen: this.previousScreen ? this.previousScreen.id : null,
      historyLength: this.screenHistory.length,
      isTransitioning: this.isTransitioning,
      hasIntegrations: {
        achievements: !!this.achievementManager,
        drawer: !!this.drawerManager,
      },
    };
  }

  /**
   * Destroy the screen manager and clean up resources
   */
  destroy() {
    try {
      // Hide current screen
      if (this.currentScreen) {
        this.currentScreen.hide({ animate: false });
      }

      // Destroy all screens
      this.screens.forEach((screen) => {
        screen.destroy();
      });

      // Remove event listeners
      this.eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });

      // Clear references
      this.screens.clear();
      this.screenStates.clear();
      this.screenHistory = [];
      this.currentScreen = null;
      this.previousScreen = null;
      this.eventListeners = [];

      // Emit destroy event
      this._emitEvent("screenManagerDestroy", { manager: this });
    } catch (error) {
      console.error("ScreenManager destroy error:", error);
    }
  }

  /**
   * Emit custom events
   * @private
   * @param {string} eventName - Name of the event
   * @param {Object} detail - Event detail data
   */
  _emitEvent(eventName, detail) {
    try {
      const event = new CustomEvent(eventName, { detail });
      document.dispatchEvent(event);
    } catch (error) {
      console.error("Event emission error:", error);
    }
  }

  destroy() {
    this._detachEventListeners();
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
