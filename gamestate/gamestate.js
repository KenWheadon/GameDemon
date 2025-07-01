/**
 * GameState - Core State Management Class
 * Handles state storage, access, and persistence with change tracking
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class GameState {
  constructor(options = {}) {
    // Configuration options
    this.options = {
      autoSave: true,
      saveInterval: 30000, // 30 seconds
      storageKey: "gamestate",
      versionKey: "gamestate-version",
      stateVersion: "1.0.0",
      maxHistory: 50,
      enableDebugLogs: false,
      enableChangeTracking: true,
      enableEventSystem: true,
      validateOnLoad: true,
      allowNull: true,
      deepClone: true,
      ...options,
    };

    // Core state storage
    this.state = {};
    this.defaultState = {};
    this.isInitialized = false;

    // Change tracking
    this.history = [];
    this.watchers = new Map();
    this.watcherIdCounter = 0;

    // Auto save timer
    this.saveTimer = null;

    // Metadata
    this.metadata = {
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      changeCount: 0,
      saveCount: 0,
      loadCount: 0,
    };

    // Initialize the system
    this.init();
  }

  /**
   * Initialize the state system
   */
  async init() {
    try {
      this.log("Initializing GameState...");

      // Try to load state from storage
      const loaded = this.loadState();

      if (!loaded) {
        this.log("No saved state found, using empty state");
      }

      // Set up auto-save if enabled
      if (this.options.autoSave) {
        this.startAutoSave();
      }

      this.isInitialized = true;
      this.log("GameState initialized successfully");

      // Dispatch initialization event
      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:initialized", { success: true });
      }

      return true;
    } catch (error) {
      console.error("Failed to initialize GameState:", error);

      // Attempt recovery with empty state
      this.state = {};
      this.isInitialized = true;

      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:error", {
          error: "initialization_failed",
          message: error.message,
        });
      }

      return false;
    }
  }

  /**
   * Get a value from the state by path
   * @param {string} path - Dot notation path
   * @param {*} defaultValue - Default value if path doesn't exist
   * @returns {*} - The value at the path
   */
  get(path, defaultValue = undefined) {
    try {
      // Special case for root
      if (!path || path === "") {
        return this.getState();
      }

      // Navigate the path
      const value = this.getNestedValue(this.state, path);

      // If value is undefined and defaultValue is provided, return defaultValue
      if (value === undefined && defaultValue !== undefined) {
        return defaultValue;
      }

      // Deep clone if enabled to prevent unintended reference modifications
      return this.options.deepClone ? this.deepClone(value) : value;
    } catch (error) {
      this.log(`Error getting ${path}: ${error.message}`, "error");
      return defaultValue;
    }
  }

  /**
   * Set a value in the state by path
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   * @param {boolean} silent - If true, don't trigger watchers/history
   * @returns {boolean} - Success status
   */
  set(path, value, silent = false) {
    try {
      // Special case for root
      if (!path || path === "") {
        if (typeof value !== "object" || value === null) {
          throw new Error("Root state must be an object");
        }
        return this.setState(value, silent);
      }

      // Store old value for change tracking
      const oldValue = silent ? undefined : this.get(path);

      // Check if value is null and not allowed
      if (value === null && !this.options.allowNull) {
        throw new Error("Null values are not allowed");
      }

      // Deep clone value if enabled to prevent unintended reference modifications
      const valueToSet = this.options.deepClone ? this.deepClone(value) : value;

      // Set the value
      const success = this.setNestedValue(this.state, path, valueToSet);

      if (success) {
        // Update metadata
        this.metadata.lastUpdated = Date.now();
        this.metadata.changeCount++;

        // Add to history if change tracking is enabled and not silent
        if (this.options.enableChangeTracking && !silent) {
          this.addToHistory(path, oldValue, valueToSet);
        }

        // Notify watchers if not silent
        if (!silent) {
          this.notifyWatchers(path, valueToSet, oldValue);
        }

        // Dispatch change event
        if (this.options.enableEventSystem && !silent) {
          this.dispatchEvent("gamestate:changed", {
            path,
            newValue: valueToSet,
            oldValue,
            timestamp: this.metadata.lastUpdated,
          });
        }
      }

      return success;
    } catch (error) {
      this.log(`Error setting ${path}: ${error.message}`, "error");

      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:error", {
          operation: "set",
          path,
          error: error.message,
        });
      }

      return false;
    }
  }

  /**
   * Check if a path exists in the state
   * @param {string} path - Dot notation path
   * @returns {boolean} - True if path exists
   */
  has(path) {
    if (!path || path === "") {
      return Object.keys(this.state).length > 0;
    }

    return this.getNestedValue(this.state, path) !== undefined;
  }

  /**
   * Delete a path from the state
   * @param {string} path - Dot notation path
   * @param {boolean} silent - If true, don't trigger watchers/history
   * @returns {boolean} - Success status
   */
  delete(path, silent = false) {
    try {
      // Can't delete root
      if (!path || path === "") {
        return false;
      }

      // Store old value for change tracking
      const oldValue = silent ? undefined : this.get(path);

      // Delete the value
      const success = this.deleteNestedValue(this.state, path);

      if (success) {
        // Update metadata
        this.metadata.lastUpdated = Date.now();
        this.metadata.changeCount++;

        // Add to history if change tracking is enabled and not silent
        if (this.options.enableChangeTracking && !silent) {
          this.addToHistory(path, oldValue, undefined, "delete");
        }

        // Notify watchers if not silent
        if (!silent) {
          this.notifyWatchers(path, undefined, oldValue);
        }

        // Dispatch change event
        if (this.options.enableEventSystem && !silent) {
          this.dispatchEvent("gamestate:changed", {
            path,
            newValue: undefined,
            oldValue,
            action: "delete",
            timestamp: this.metadata.lastUpdated,
          });
        }
      }

      return success;
    } catch (error) {
      this.log(`Error deleting ${path}: ${error.message}`, "error");

      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:error", {
          operation: "delete",
          path,
          error: error.message,
        });
      }

      return false;
    }
  }

  /**
   * Increment a numeric value
   * @param {string} path - Dot notation path
   * @param {number} amount - Amount to increment
   * @returns {number} - New value
   */
  increment(path, amount = 1) {
    // Get current value
    const currentValue = this.get(path, 0);

    // Validate it's a number
    if (typeof currentValue !== "number") {
      this.log(`Cannot increment non-numeric value at ${path}`, "warn");
      return currentValue;
    }

    // Calculate new value
    const newValue = currentValue + amount;

    // Set the new value
    this.set(path, newValue);

    return newValue;
  }

  /**
   * Decrement a numeric value
   * @param {string} path - Dot notation path
   * @param {number} amount - Amount to decrement
   * @returns {number} - New value
   */
  decrement(path, amount = 1) {
    return this.increment(path, -amount);
  }

  /**
   * Toggle a boolean value
   * @param {string} path - Dot notation path
   * @returns {boolean} - New value
   */
  toggle(path) {
    // Get current value
    const currentValue = this.get(path, false);

    // Calculate new value (convert to boolean if not already)
    const newValue = !currentValue;

    // Set the new value
    this.set(path, newValue);

    return newValue;
  }

  /**
   * Add an item to an array
   * @param {string} path - Dot notation path to array
   * @param {*} item - Item to add
   * @param {boolean} unique - Only add if not already in array
   * @returns {number} - New array length or -1 if failed
   */
  addToArray(path, item, unique = false) {
    try {
      // Get current array
      let array = this.get(path);

      // If not an array, create a new one
      if (!Array.isArray(array)) {
        array = [];
      }

      // Deep clone the array to avoid reference issues
      const newArray = this.deepClone(array);

      // Check if item already exists for unique option
      if (unique && newArray.some((existing) => this.isEqual(existing, item))) {
        return newArray.length; // Already exists, return current length
      }

      // Add the item and update
      newArray.push(item);
      this.set(path, newArray);

      return newArray.length;
    } catch (error) {
      this.log(`Error adding to array at ${path}: ${error.message}`, "error");
      return -1;
    }
  }

  /**
   * Remove an item from an array
   * @param {string} path - Dot notation path to array
   * @param {*} item - Item to remove or predicate function
   * @returns {number} - New array length or -1 if failed
   */
  removeFromArray(path, item) {
    try {
      // Get current array
      const array = this.get(path);

      // Ensure it's an array
      if (!Array.isArray(array)) {
        return -1;
      }

      // Deep clone the array to avoid reference issues
      const newArray = this.deepClone(array);

      // Handle predicate function
      if (typeof item === "function") {
        // Remove items that match the predicate
        const filteredArray = newArray.filter((element) => !item(element));
        this.set(path, filteredArray);
        return filteredArray.length;
      } else {
        // Remove specific item (by equality)
        const filteredArray = newArray.filter(
          (element) => !this.isEqual(element, item)
        );
        this.set(path, filteredArray);
        return filteredArray.length;
      }
    } catch (error) {
      this.log(
        `Error removing from array at ${path}: ${error.message}`,
        "error"
      );
      return -1;
    }
  }

  /**
   * Merge an object into the state
   * @param {Object} obj - Object to merge
   * @param {boolean} deep - Perform deep merge
   * @returns {boolean} - Success status
   */
  merge(obj, deep = true) {
    try {
      if (typeof obj !== "object" || obj === null) {
        throw new Error("Merge source must be an object");
      }

      // Deep clone the object to avoid reference issues
      const objToMerge = this.options.deepClone ? this.deepClone(obj) : obj;

      // For shallow merge, just update top-level properties
      if (!deep) {
        Object.keys(objToMerge).forEach((key) => {
          this.set(key, objToMerge[key]);
        });
        return true;
      }

      // For deep merge, use recursive merging
      this.deepMerge(this.state, objToMerge);

      // Update metadata
      this.metadata.lastUpdated = Date.now();
      this.metadata.changeCount++;

      // Dispatch merge event
      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:merged", {
          timestamp: this.metadata.lastUpdated,
        });
      }

      return true;
    } catch (error) {
      this.log(`Error merging state: ${error.message}`, "error");

      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:error", {
          operation: "merge",
          error: error.message,
        });
      }

      return false;
    }
  }

  /**
   * Watch for changes to a path
   * @param {string} path - Dot notation path
   * @param {Function} callback - Callback function
   * @returns {Function} - Unwatch function
   */
  watch(path, callback) {
    if (typeof callback !== "function") {
      this.log("Watch callback must be a function", "warn");
      return () => {}; // Return dummy unwatch function
    }

    // Generate watcher ID
    const watcherId = this.watcherIdCounter++;

    // Add to watchers map
    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Map());
    }

    this.watchers.get(path).set(watcherId, callback);

    // Return unwatch function
    return () => {
      if (this.watchers.has(path)) {
        this.watchers.get(path).delete(watcherId);

        // Clean up empty maps
        if (this.watchers.get(path).size === 0) {
          this.watchers.delete(path);
        }
      }
    };
  }

  /**
   * Save the current state
   * @param {string} customKey - Optional custom storage key
   * @returns {boolean} - Success status
   */
  saveState(customKey = null) {
    try {
      const key = customKey || this.options.storageKey;
      const versionKey = customKey
        ? `${customKey}-version`
        : this.options.versionKey;

      // Prepare save data
      const saveData = {
        state: this.state,
        metadata: this.metadata,
        timestamp: Date.now(),
      };

      // Serialize and store
      localStorage.setItem(key, JSON.stringify(saveData));
      localStorage.setItem(versionKey, this.options.stateVersion);

      // Update metadata
      this.metadata.saveCount++;
      this.metadata.lastSaved = Date.now();

      this.log(`State saved to '${key}'`);

      // Dispatch save event
      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:saved", {
          key,
          timestamp: this.metadata.lastSaved,
        });
      }

      return true;
    } catch (error) {
      this.log(`Error saving state: ${error.message}`, "error");

      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:error", {
          operation: "save",
          error: error.message,
        });
      }

      return false;
    }
  }

  /**
   * Load saved state
   * @param {string} customKey - Optional custom storage key
   * @returns {boolean} - Success status
   */
  loadState(customKey = null) {
    try {
      const key = customKey || this.options.storageKey;
      const versionKey = customKey
        ? `${customKey}-version`
        : this.options.versionKey;

      // Get stored data
      const savedData = localStorage.getItem(key);
      const savedVersion = localStorage.getItem(versionKey);

      if (!savedData) {
        this.log(`No saved state found at '${key}'`, "info");
        return false;
      }

      // Version check if validation enabled
      if (
        this.options.validateOnLoad &&
        savedVersion !== this.options.stateVersion
      ) {
        this.log(
          `Version mismatch: saved=${savedVersion}, current=${this.options.stateVersion}`,
          "warn"
        );

        if (this.options.enableEventSystem) {
          this.dispatchEvent("gamestate:version-mismatch", {
            savedVersion,
            currentVersion: this.options.stateVersion,
          });
        }

        // Continue with loading but notify about version mismatch
      }

      // Parse saved data
      const parsedData = JSON.parse(savedData);

      if (!parsedData.state) {
        throw new Error("Invalid save data format");
      }

      // Update state and metadata
      this.state = this.options.deepClone
        ? this.deepClone(parsedData.state)
        : parsedData.state;

      // Merge metadata to preserve current session info
      if (parsedData.metadata) {
        this.metadata = {
          ...parsedData.metadata,
          loadCount: (this.metadata.loadCount || 0) + 1,
          lastLoaded: Date.now(),
        };
      }

      this.log(`State loaded from '${key}'`);

      // Dispatch load event
      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:loaded", {
          key,
          timestamp: Date.now(),
        });
      }

      return true;
    } catch (error) {
      this.log(`Error loading state: ${error.message}`, "error");

      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:error", {
          operation: "load",
          error: error.message,
        });
      }

      return false;
    }
  }

  /**
   * Reset state to defaults
   * @param {Object} customDefaults - Optional custom default state
   * @returns {boolean} - Success status
   */
  reset(customDefaults = null) {
    try {
      // Use provided defaults or empty object
      const defaults = customDefaults || this.defaultState || {};

      // Store old state for event
      const oldState = this.getState();

      // Reset state
      this.state = this.options.deepClone ? this.deepClone(defaults) : defaults;

      // Reset history
      this.history = [];

      // Update metadata
      this.metadata.lastUpdated = Date.now();
      this.metadata.resetCount = (this.metadata.resetCount || 0) + 1;
      this.metadata.changeCount++;

      this.log("State reset to defaults");

      // Dispatch reset event
      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:reset", {
          oldState,
          newState: this.getState(),
          timestamp: this.metadata.lastUpdated,
        });
      }

      return true;
    } catch (error) {
      this.log(`Error resetting state: ${error.message}`, "error");

      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:error", {
          operation: "reset",
          error: error.message,
        });
      }

      return false;
    }
  }

  /**
   * Get a copy of the entire state
   * @returns {Object} - State object copy
   */
  getState() {
    return this.options.deepClone
      ? this.deepClone(this.state)
      : { ...this.state };
  }

  /**
   * Set the entire state
   * @param {Object} newState - New state object
   * @param {boolean} silent - If true, don't trigger watchers/history
   * @returns {boolean} - Success status
   */
  setState(newState, silent = false) {
    try {
      if (typeof newState !== "object" || newState === null) {
        throw new Error("State must be an object");
      }

      // Store old state for change tracking
      const oldState = silent ? undefined : this.getState();

      // Set new state
      this.state = this.options.deepClone
        ? this.deepClone(newState)
        : { ...newState };

      // Update metadata
      this.metadata.lastUpdated = Date.now();
      this.metadata.changeCount++;

      // Add to history if change tracking is enabled and not silent
      if (this.options.enableChangeTracking && !silent) {
        this.addToHistory("", oldState, this.getState(), "replace");
      }

      // Notify watchers if not silent
      if (!silent) {
        this.notifyAllWatchers(oldState);
      }

      // Dispatch change event
      if (this.options.enableEventSystem && !silent) {
        this.dispatchEvent("gamestate:changed", {
          path: "",
          newValue: this.getState(),
          oldValue: oldState,
          action: "replace",
          timestamp: this.metadata.lastUpdated,
        });
      }

      return true;
    } catch (error) {
      this.log(`Error setting state: ${error.message}`, "error");

      if (this.options.enableEventSystem) {
        this.dispatchEvent("gamestate:error", {
          operation: "setState",
          error: error.message,
        });
      }

      return false;
    }
  }

  /**
   * Set default state (for reset)
   * @param {Object} defaultState - Default state object
   */
  setDefaultState(defaultState) {
    if (typeof defaultState !== "object" || defaultState === null) {
      this.log("Default state must be an object", "warn");
      return false;
    }

    this.defaultState = this.options.deepClone
      ? this.deepClone(defaultState)
      : { ...defaultState };
    return true;
  }

  /**
   * Get state metadata
   * @returns {Object} - Metadata object
   */
  getMetadata() {
    return { ...this.metadata };
  }

  /**
   * Get state change history
   * @returns {Array} - History array
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Clear state change history
   */
  clearHistory() {
    this.history = [];
    this.log("History cleared");
  }

  /**
   * Start auto-save timer
   */
  startAutoSave() {
    // Clear existing timer if any
    this.stopAutoSave();

    // Set up new timer
    this.saveTimer = setInterval(() => {
      this.saveState();
    }, this.options.saveInterval);

    this.log(`Auto-save started (${this.options.saveInterval}ms interval)`);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
      this.log("Auto-save stopped");
    }
  }

  /**
   * Clean up and destroy the instance
   */
  destroy() {
    this.log("Destroying GameState...");

    // Stop auto-save
    this.stopAutoSave();

    // Clear watchers
    this.watchers.clear();

    // Dispatch destroy event
    if (this.options.enableEventSystem) {
      this.dispatchEvent("gamestate:destroyed", {
        timestamp: Date.now(),
      });
    }

    // Clear data
    this.state = {};
    this.history = [];
    this.isInitialized = false;

    this.log("GameState destroyed");
  }

  // PRIVATE UTILITY METHODS

  /**
   * Get a nested value from an object by path
   * @private
   */
  getNestedValue(obj, path) {
    // Handle empty path
    if (!path) return obj;

    // Split path into parts
    const parts = path.split(".");
    let current = obj;

    // Navigate the path
    for (let i = 0; i < parts.length; i++) {
      // If current is null/undefined or not an object/array, we can't go deeper
      if (
        current === null ||
        current === undefined ||
        (typeof current !== "object" && !Array.isArray(current))
      ) {
        return undefined;
      }

      current = current[parts[i]];
    }

    return current;
  }

  /**
   * Set a nested value in an object by path
   * @private
   */
  setNestedValue(obj, path, value) {
    // Handle empty path
    if (!path) return false;

    // Split path into parts
    const parts = path.split(".");
    let current = obj;

    // Navigate and create path if needed
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      // Create path if it doesn't exist
      if (
        current[part] === undefined ||
        current[part] === null ||
        (typeof current[part] !== "object" && !Array.isArray(current[part]))
      ) {
        // Check if next part is a number (for array)
        const nextIsNumber = !isNaN(Number(parts[i + 1]));
        current[part] = nextIsNumber ? [] : {};
      }

      current = current[part];
    }

    // Set the value
    current[parts[parts.length - 1]] = value;
    return true;
  }

  /**
   * Delete a nested value from an object by path
   * @private
   */
  deleteNestedValue(obj, path) {
    // Handle empty path
    if (!path) return false;

    // Split path into parts
    const parts = path.split(".");
    let current = obj;

    // Navigate the path
    for (let i = 0; i < parts.length - 1; i++) {
      // If path doesn't exist, nothing to delete
      if (current[parts[i]] === undefined) {
        return false;
      }

      current = current[parts[i]];
    }

    // Delete the property
    const lastPart = parts[parts.length - 1];
    if (current[lastPart] === undefined) {
      return false;
    }

    if (Array.isArray(current)) {
      // For arrays, we need to splice
      const index = Number(lastPart);
      if (isNaN(index)) return false;
      current.splice(index, 1);
    } else {
      // For objects, use delete operator
      delete current[lastPart];
    }

    return true;
  }

  /**
   * Deeply clone an object or value
   * @private
   */
  deepClone(value) {
    // Handle primitive types
    if (value === null || value === undefined || typeof value !== "object") {
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item) => this.deepClone(item));
    }

    // Handle Date objects
    if (value instanceof Date) {
      return new Date(value.getTime());
    }

    // Handle regular objects
    const clone = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        clone[key] = this.deepClone(value[key]);
      }
    }

    return clone;
  }

  /**
   * Deep merge two objects
   * @private
   */
  deepMerge(target, source) {
    // Iterate through source properties
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        // If both values are objects, merge them
        if (
          sourceValue &&
          typeof sourceValue === "object" &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === "object" &&
          !Array.isArray(targetValue)
        ) {
          this.deepMerge(targetValue, sourceValue);
        } else {
          // Otherwise replace/set value
          target[key] = this.deepClone(sourceValue);
        }
      }
    }

    return target;
  }

  /**
   * Compare two values for equality (deep)
   * @private
   */
  isEqual(a, b) {
    // Handle primitive types
    if (a === b) return true;

    // If either is null/undefined but not both, they're not equal
    if (a === null || a === undefined || b === null || b === undefined) {
      return false;
    }

    // If types don't match, they're not equal
    if (typeof a !== typeof b) return false;

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;

      for (let i = 0; i < a.length; i++) {
        if (!this.isEqual(a[i], b[i])) return false;
      }

      return true;
    }

    // Handle objects
    if (typeof a === "object" && typeof b === "object") {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (
          !Object.prototype.hasOwnProperty.call(b, key) ||
          !this.isEqual(a[key], b[key])
        ) {
          return false;
        }
      }

      return true;
    }

    // Default: not equal
    return false;
  }

  /**
   * Add an entry to the change history
   * @private
   */
  addToHistory(path, oldValue, newValue, action = "update") {
    // Limit history size
    if (this.history.length >= this.options.maxHistory) {
      this.history.shift();
    }

    // Add history entry
    this.history.push({
      path,
      oldValue,
      newValue,
      action,
      timestamp: Date.now(),
    });
  }

  /**
   * Notify watchers of a path change
   * @private
   */
  notifyWatchers(path, newValue, oldValue) {
    // Find all watchers that match this path
    this.watchers.forEach((callbacks, watchPath) => {
      // Check if watchPath matches the changed path
      if (
        watchPath === path || // Exact match
        watchPath === "" || // Root watcher
        path.startsWith(watchPath + ".") || // Parent path
        (watchPath.includes("*") && this.pathMatchesPattern(path, watchPath))
      ) {
        // Wildcard match

        // Call all callbacks for this path
        callbacks.forEach((callback) => {
          try {
            callback(newValue, oldValue, path);
          } catch (error) {
            this.log(
              `Error in watcher callback for ${watchPath}: ${error.message}`,
              "error"
            );
          }
        });
      }
    });
  }

  /**
   * Notify all watchers (used for setState)
   * @private
   */
  notifyAllWatchers(oldState) {
    this.watchers.forEach((callbacks, watchPath) => {
      let newValue;
      let oldValue;

      if (watchPath === "") {
        // Root watchers
        newValue = this.getState();
        oldValue = oldState;
      } else {
        // Path-specific watchers
        newValue = this.get(watchPath);
        oldValue = this.getNestedValue(oldState, watchPath);
      }

      // Skip if values are equal
      if (this.isEqual(newValue, oldValue)) return;

      // Call all callbacks for this path
      callbacks.forEach((callback) => {
        try {
          callback(newValue, oldValue, watchPath);
        } catch (error) {
          this.log(
            `Error in watcher callback for ${watchPath}: ${error.message}`,
            "error"
          );
        }
      });
    });
  }

  /**
   * Check if a path matches a pattern with wildcards
   * @private
   */
  pathMatchesPattern(path, pattern) {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\./g, "\\.") // Escape dots
      .replace(/\*/g, ".*"); // Replace * with .*

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Dispatch a custom event
   * @private
   */
  dispatchEvent(eventName, detail = {}) {
    if (!this.options.enableEventSystem) return;

    // Create and dispatch the event
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(event);
  }

  /**
   * Debug logging helper
   * @private
   */
  log(message, level = "info") {
    if (this.options.enableDebugLogs) {
      const logMethod =
        level === "error"
          ? console.error
          : level === "warn"
          ? console.warn
          : console.log;
      logMethod(`[GameState] ${message}`);
    }
  }
}
