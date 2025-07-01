/**
 * GameStateManager - Game Integration Class for State Management
 * Handles game-specific state patterns, schema validation, and system integration
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class GameStateManager {
  constructor(gameInstance, options = {}) {
    this.game = gameInstance;
    
    // Configuration options
    this.options = {
      enableDebugLogs: false,
      enableSchemaValidation: true,
      enableGameIntegration: true,
      enablePerformanceTracking: false,
      autoBackup: true,
      backupInterval: 300000, // 5 minutes
      maxBackups: 5,
      ...options
    };

    // Core state management
    this.gameState = null;
    this.schema = new Map();
    this.validators = new Map();
    this.transformers = new Map();
    
    // Game integration state
    this.isInitialized = false;
    this.backupTimer = null;
    this.backupHistory = [];
    
    // Performance tracking
    this.performanceMetrics = {
      operationCount: 0,
      totalTime: 0,
      averageTime: 0,
      lastOperation: null
    };

    // Initialize the system
    this.init();
  }

  /**
   * Initialize the GameStateManager
   */
  async init() {
    try {
      this.log('Initializing GameStateManager...');

      // Create core GameState instance
      this.gameState = new GameState({
        enableDebugLogs: this.options.enableDebugLogs,
        autoSave: true,
        saveInterval: 30000,
        storageKey: `${this.getGameId()}-state`,
        versionKey: `${this.getGameId()}-version`,
        enableChangeTracking: true,
        enableEventSystem: true
      });

      // Wait for GameState initialization
      await new Promise(resolve => {
        if (this.gameState.isInitialized) {
          resolve();
        } else {
          this.gameState.on('gamestate:initialized', resolve);
        }
      });

      // Set up game integration
      if (this.options.enableGameIntegration) {
        this.setupGameIntegration();
      }

      // Set up schema validation
      if (this.options.enableSchemaValidation) {
        this.setupDefaultSchema();
      }

      // Set up backup system
      if (this.options.autoBackup) {
        this.startBackupSystem();
      }

      // Set up performance tracking
      if (this.options.enablePerformanceTracking) {
        this.setupPerformanceTracking();
      }

      this.isInitialized = true;
      this.log('GameStateManager initialized successfully');

      return true;
    } catch (error) {
      console.error('Failed to initialize GameStateManager:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Set up game integration hooks
   */
  setupGameIntegration() {
    // Expose state methods to game instance for convenience
    if (this.game) {
      this.game.state = {
        get: this.get.bind(this),
        set: this.set.bind(this),
        increment: this.increment.bind(this),
        decrement: this.decrement.bind(this),
        toggle: this.toggle.bind(this),
        has: this.has.bind(this),
        watch: this.watch.bind(this),
        save: this.save.bind(this),
        load: this.load.bind(this),
        reset: this.reset.bind(this)
      };

      // Set up event forwarding to game instance
      this.gameState.on('gamestate:changed', (event) => {
        if (typeof this.game.onStateChanged === 'function') {
          this.game.onStateChanged(event.detail);
        }
      });

      this.gameState.on('gamestate:saved', (event) => {
        if (typeof this.game.onStateSaved === 'function') {
          this.game.onStateSaved(event.detail);
        }
      });

      this.gameState.on('gamestate:loaded', (event) => {
        if (typeof this.game.onStateLoaded === 'function') {
          this.game.onStateLoaded(event.detail);
        }
      });
    }
  }

  /**
   * Set up default game state schema
   */
  setupDefaultSchema() {
    this.defineSchema('player', {
      level: { type: 'number', min: 1, default: 1 },
      experience: { type: 'number', min: 0, default: 0 },
      health: { type: 'number', min: 0, max: 100, default: 100 },
      score: { type: 'number', min: 0, default: 0 },
      name: { type: 'string', maxLength: 50, default: 'Player' }
    });

    this.defineSchema('game', {
      currentLevel: { type: 'number', min: 1, default: 1 },
      difficulty: { type: 'string', enum: ['easy', 'normal', 'hard'], default: 'normal' },
      timeStarted: { type: 'number', default: () => Date.now() },
      timePlayed: { type: 'number', min: 0, default: 0 },
      isPaused: { type: 'boolean', default: false }
    });

    this.defineSchema('settings', {
      soundEnabled: { type: 'boolean', default: true },
      musicEnabled: { type: 'boolean', default: true },
      masterVolume: { type: 'number', min: 0, max: 1, default: 1 },
      language: { type: 'string', default: 'en' }
    });

    this.defineSchema('achievements', {
      unlocked: { type: 'array', default: [] },
      progress: { type: 'object', default: {} }
    });
  }

  /**
   * Define a schema for a state section
   * @param {string} section - Section name (e.g., 'player', 'game')
   * @param {Object} schemaDefinition - Schema definition object
   */
  defineSchema(section, schemaDefinition) {
    this.schema.set(section, schemaDefinition);
    this.log(`Schema defined for section: ${section}`);

    // Initialize section with defaults if it doesn't exist
    if (!this.gameState.has(section)) {
      const defaults = this.getDefaultValues(schemaDefinition);
      this.gameState.set(section, defaults, true); // Silent set
    }
  }

  /**
   * Add a custom validator for a path
   * @param {string} path - Dot notation path
   * @param {Function} validator - Validator function (value) => boolean | string
   */
  addValidator(path, validator) {
    if (!this.validators.has(path)) {
      this.validators.set(path, []);
    }
    this.validators.get(path).push(validator);
    this.log(`Validator added for path: ${path}`);
  }

  /**
   * Add a data transformer for a path
   * @param {string} path - Dot notation path
   * @param {Function} transformer - Transform function (value) => transformedValue
   */
  addTransformer(path, transformer) {
    this.transformers.set(path, transformer);
    this.log(`Transformer added for path: ${path}`);
  }

  /**
   * Set a value with validation and transformation
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   * @param {boolean} skipValidation - Skip validation step
   * @returns {boolean} - Success status
   */
  set(path, value, skipValidation = false) {
    try {
      const startTime = performance.now();

      // Apply transformers
      let transformedValue = value;
      if (this.transformers.has(path)) {
        transformedValue = this.transformers.get(path)(value);
      }

      // Validate value
      if (!skipValidation && this.options.enableSchemaValidation) {
        const validationResult = this.validateValue(path, transformedValue);
        if (validationResult !== true) {
          this.log(`Validation failed for ${path}: ${validationResult}`, 'warn');
          return false;
        }
      }

      // Set the value
      const success = this.gameState.set(path, transformedValue);

      // Track performance
      if (this.options.enablePerformanceTracking) {
        this.trackPerformance('set', performance.now() - startTime);
      }

      return success;
    } catch (error) {
      this.log(`Error setting ${path}:`, 'error');
      return false;
    }
  }

  /**
   * Get a value from the state
   * @param {string} path - Dot notation path
   * @param {*} defaultValue - Default value if path doesn't exist
   * @returns {*} - The value at the path
   */
  get(path, defaultValue = undefined) {
    const startTime = performance.now();
    const value = this.gameState.get(path, defaultValue);
    
    if (this.options.enablePerformanceTracking) {
      this.trackPerformance('get', performance.now() - startTime);
    }
    
    return value;
  }

  /**
   * Increment a numeric value
   * @param {string} path - Dot notation path
   * @param {number} amount - Amount to increment
   * @returns {number} - New value
   */
  increment(path, amount = 1) {
    const startTime = performance.now();
    const result = this.gameState.increment(path, amount);
    
    if (this.options.enablePerformanceTracking) {
      this.trackPerformance('increment', performance.now() - startTime);
    }
    
    return result;
  }

  /**
   * Decrement a numeric value
   * @param {string} path - Dot notation path
   * @param {number} amount - Amount to decrement
   * @returns {number} - New value
   */
  decrement(path, amount = 1) {
    const startTime = performance.now();
    const result = this.gameState.decrement(path, amount);
    
    if (this.options.enablePerformanceTracking) {
      this.trackPerformance('decrement', performance.now() - startTime);
    }
    
    return result;
  }

  /**
   * Toggle a boolean value
   * @param {string} path - Dot notation path
   * @returns {boolean} - New value
   */
  toggle(path) {
    const startTime = performance.now();
    const result = this.gameState.toggle(path);
    
    if (this.options.enablePerformanceTracking) {
      this.trackPerformance('toggle', performance.now() - startTime);
    }
    
    return result;
  }

  /**
   * Check if a path exists
   * @param {string} path - Dot notation path
   * @returns {boolean} - True if path exists
   */
  has(path) {
    return this.gameState.has(path);
  }

  /**
   * Watch for changes to a path
   * @param {string} path - Dot notation path
   * @param {Function} callback - Callback function
   * @returns {Function} - Unwatch function
   */
  watch(path, callback) {
    return this.gameState.watch(path, callback);
  }

  /**
   * Save the current state
   * @param {string} customKey - Optional custom storage key
   * @returns {boolean} - Success status
   */
  save(customKey = null) {
    const startTime = performance.now();
    const success = this.gameState.saveState(customKey);
    
    if (this.options.enablePerformanceTracking) {
      this.trackPerformance('save', performance.now() - startTime);
    }
    
    return success;
  }

  /**
   * Load saved state
   * @param {string} customKey - Optional custom storage key
   * @returns {boolean} - Success status
   */
  load(customKey = null) {
    const startTime = performance.now();
    const success = this.gameState.loadState(customKey);
    
    if (this.options.enablePerformanceTracking) {
      this.trackPerformance('load', performance.now() - startTime);
    }
    
    return success;
  }

  /**
   * Reset state to defaults
   * @param {Object} customDefaults - Optional custom default state
   * @returns {boolean} - Success status
   */
  reset(customDefaults = null) {
    const defaults = customDefaults || this.generateDefaultState();
    return this.gameState.reset(defaults);
  }

  /**
   * Create a backup of the current state
   * @returns {string} - Backup ID
   */
  createBackup() {
    const backupId = `backup-${Date.now()}`;
    const backup = {
      id: backupId,
      timestamp: Date.now(),
      state: this.gameState.getState(),
      metadata: this.gameState.getMetadata()
    };

    this.backupHistory.push(backup);

    // Limit backup history
    if (this.backupHistory.length > this.options.maxBackups) {
      this.backupHistory.shift();
    }

    // Save backup to localStorage
    try {
      localStorage.setItem(`${this.getGameId()}-${backupId}`, JSON.stringify(backup));
      this.log(`Backup created: ${backupId}`);
    } catch (error) {
      this.log('Failed to save backup to localStorage', 'warn');
    }

    return backupId;
  }

  /**
   * Restore from a backup
   * @param {string} backupId - Backup ID to restore
   * @returns {boolean} - Success status
   */
  restoreBackup(backupId) {
    try {
      // Find backup in memory first
      let backup = this.backupHistory.find(b => b.id === backupId);
      
      // If not in memory, try localStorage
      if (!backup) {
        const saved = localStorage.getItem(`${this.getGameId()}-${backupId}`);
        if (saved) {
          backup = JSON.parse(saved);
        }
      }

      if (!backup) {
        this.log(`Backup not found: ${backupId}`, 'warn');
        return false;
      }

      // Restore the state
      const success = this.gameState.setState(backup.state);
      if (success) {
        this.log(`Restored from backup: ${backupId}`);
      }

      return success;
    } catch (error) {
      this.log(`Error restoring backup ${backupId}:`, 'error');
      return false;
    }
  }

  /**
   * Get list of available backups
   * @returns {Array} - Array of backup info objects
   */
  getBackups() {
    return this.backupHistory.map(backup => ({
      id: backup.id,
      timestamp: backup.timestamp,
      date: new Date(backup.timestamp).toLocaleString(),
      size: JSON.stringify(backup.state).length
    }));
  }

  /**
   * Get comprehensive state manager statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    const gameStateStats = this.gameState.getMetadata();
    
    return {
      // GameState stats
      ...gameStateStats,
      
      // Manager-specific stats
      schemaCount: this.schema.size,
      validatorCount: Array.from(this.validators.values()).reduce((total, arr) => total + arr.length, 0),
      transformerCount: this.transformers.size,
      backupCount: this.backupHistory.length,
      
      // Performance metrics
      performance: { ...this.performanceMetrics },
      
      // System status
      isInitialized: this.isInitialized,
      gameId: this.getGameId(),
      integrationEnabled: this.options.enableGameIntegration
    };
  }

  /**
   * Export state data for external use
   * @param {boolean} includeMetadata - Include metadata in export
   * @returns {Object} - Exported state data
   */
  exportState(includeMetadata = true) {
    const exportData = {
      state: this.gameState.getState(),
      timestamp: Date.now(),
      gameId: this.getGameId()
    };

    if (includeMetadata) {
      exportData.metadata = this.gameState.getMetadata();
      exportData.schema = Array.from(this.schema.entries());
    }

    return exportData;
  }

  /**
   * Import state data from external source
   * @param {Object} importData - Data to import
   * @param {boolean} merge - Merge with current state instead of replacing
   * @returns {boolean} - Success status
   */
  importState(importData, merge = false) {
    try {
      if (!importData.state) {
        this.log('Invalid import data: missing state', 'warn');
        return false;
      }

      if (merge) {
        this.gameState.merge(importData.state);
      } else {
        this.gameState.setState(importData.state);
      }

      this.log('State imported successfully');
      return true;
    } catch (error) {
      this.log('Error importing state:', 'error');
      return false;
    }
  }

  // PRIVATE METHODS

  /**
   * Get game ID for storage keys
   * @private
   */
  getGameId() {
    return this.game?.gameId || 'game';
  }

  /**
   * Generate default state from schema
   * @private
   */
  generateDefaultState() {
    const defaultState = {};
    
    this.schema.forEach((schemaDefinition, section) => {
      defaultState[section] = this.getDefaultValues(schemaDefinition);
    });

    return defaultState;
  }

  /**
   * Get default values from schema definition
   * @private
   */
  getDefaultValues(schemaDefinition) {
    const defaults = {};
    
    Object.entries(schemaDefinition).forEach(([key, definition]) => {
      if (typeof definition.default === 'function') {
        defaults[key] = definition.default();
      } else if (definition.default !== undefined) {
        defaults[key] = definition.default;
      } else {
        // Generate default based on type
        switch (definition.type) {
          case 'string': defaults[key] = ''; break;
          case 'number': defaults[key] = 0; break;
          case 'boolean': defaults[key] = false; break;
          case 'array': defaults[key] = []; break;
          case 'object': defaults[key] = {}; break;
        }
      }
    });

    return defaults;
  }

  /**
   * Validate a value against schema and custom validators
   * @private
   */
  validateValue(path, value) {
    // Get schema for path
    const pathParts = path.split('.');
    const section = pathParts[0];
    const property = pathParts[1];

    if (this.schema.has(section) && property) {
      const sectionSchema = this.schema.get(section);
      const propertySchema = sectionSchema[property];

      if (propertySchema) {
        // Type validation
        if (propertySchema.type && typeof value !== propertySchema.type) {
          return `Expected ${propertySchema.type}, got ${typeof value}`;
        }

        // Range validation for numbers
        if (propertySchema.type === 'number') {
          if (propertySchema.min !== undefined && value < propertySchema.min) {
            return `Value ${value} is less than minimum ${propertySchema.min}`;
          }
          if (propertySchema.max !== undefined && value > propertySchema.max) {
            return `Value ${value} is greater than maximum ${propertySchema.max}`;
          }
        }

        // String length validation
        if (propertySchema.type === 'string') {
          if (propertySchema.maxLength && value.length > propertySchema.maxLength) {
            return `String length ${value.length} exceeds maximum ${propertySchema.maxLength}`;
          }
        }

        // Enum validation
        if (propertySchema.enum && !propertySchema.enum.includes(value)) {
          return `Value ${value} is not in allowed values: ${propertySchema.enum.join(', ')}`;
        }
      }
    }

    // Custom validators
    if (this.validators.has(path)) {
      for (const validator of this.validators.get(path)) {
        const result = validator(value);
        if (result !== true) {
          return result || 'Custom validation failed';
        }
      }
    }

    return true;
  }

  /**
   * Start automatic backup system
   * @private
   */
  startBackupSystem() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(() => {
      this.createBackup();
    }, this.options.backupInterval);

    this.log(`Auto-backup started (${this.options.backupInterval}ms interval)`);
  }

  /**
   * Stop automatic backup system
   * @private
   */
  stopBackupSystem() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      this.log('Auto-backup stopped');
    }
  }

  /**
   * Set up performance tracking
   * @private
   */
  setupPerformanceTracking() {
    // Reset metrics
    this.performanceMetrics = {
      operationCount: 0,
      totalTime: 0,
      averageTime: 0,
      lastOperation: null
    };
  }

  /**
   * Track performance metrics
   * @private
   */
  trackPerformance(operation, time) {
    this.performanceMetrics.operationCount++;
    this.performanceMetrics.totalTime += time;
    this.performanceMetrics.averageTime = this.performanceMetrics.totalTime / this.performanceMetrics.operationCount;
    this.performanceMetrics.lastOperation = {
      operation,
      time,
      timestamp: Date.now()
    };
  }

  /**
   * Debug logging helper
   * @private
   */
  log(message, level = 'info') {
    if (this.options.enableDebugLogs) {
      const logMethod = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn : console.log;
      logMethod(`[GameStateManager] ${message}`);
    }
  }

  /**
   * Clean up and destroy the manager
   */
  destroy() {
    this.log('Destroying GameStateManager...');

    // Stop backup system
    this.stopBackupSystem();

    // Clear collections
    this.schema.clear();
    this.validators.clear();
    this.transformers.clear();
    this.backupHistory = [];

    // Destroy GameState
    if (this.gameState) {
      this.gameState.destroy();
      this.gameState = null;
    }

    // Remove game integration
    if (this.game && this.game.state) {
      delete this.game.state;
    }

    this.isInitialized = false;
    this.log('GameStateManager destroyed');
  }
}