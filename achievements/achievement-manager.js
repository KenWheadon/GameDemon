/**
 * AchievementManager - Game-Specific Achievement Integration Class
 * Handles game integration, stat tracking, and custom achievement logic
 */
class AchievementManager {
  constructor(gameInstance, options = {}) {
    this.game = gameInstance;
    this.achievements = null;
    this.gameStats = {};
    this.customCheckers = new Map();
    
    // Configuration options
    this.options = {
      enableAutoCheck: true,
      checkInterval: 1000, // ms between auto-checks
      enableDebugLogs: false,
      ...options
    };

    // Auto-check timer
    this.autoCheckTimer = null;
  }

  /**
   * Initialize achievements with game-specific data
   * @param {string} containerSelector - CSS selector for achievement container
   * @param {Object} achievementData - Achievement definitions
   * @param {Object} achievementOptions - Options for Achievements class
   */
  initializeAchievements(containerSelector, achievementData, achievementOptions = {}) {
    try {
      // Create the core Achievements instance
      this.achievements = new Achievements(containerSelector, achievementOptions);
      
      // Set the achievement data
      this.achievements.setAchievementData(achievementData);
      
      // Load any saved progress
      this.achievements.load();
      
      // Start auto-checking if enabled
      if (this.options.enableAutoCheck) {
        this.startAutoCheck();
      }
      
      this.log('Achievement system initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize achievement system:', error);
      return false;
    }
  }

  /**
   * Update a game statistic and check for unlocks
   * @param {string} statName - Name of the statistic
   * @param {number|*} value - New value for the statistic
   */
  updateGameStat(statName, value) {
    const oldValue = this.gameStats[statName];
    this.gameStats[statName] = value;
    
    this.log(`Stat updated: ${statName} = ${value} (was ${oldValue})`);
    
    // Check for achievements that might be affected by this stat
    this.checkAchievementsForStat(statName, value, oldValue);
  }

  /**
   * Increment a game statistic by a certain amount
   * @param {string} statName - Name of the statistic
   * @param {number} amount - Amount to increment (default: 1)
   */
  incrementGameStat(statName, amount = 1) {
    const currentValue = this.gameStats[statName] || 0;
    this.updateGameStat(statName, currentValue + amount);
  }

  /**
   * Handle game events that might trigger achievements
   * @param {string} eventName - Name of the game event
   * @param {Object} eventData - Additional data about the event
   */
  onGameEvent(eventName, eventData = {}) {
    this.log(`Game event: ${eventName}`, eventData);
    
    // Check for achievements that respond to this event
    this.checkAchievementsForEvent(eventName, eventData);
  }

  /**
   * Register a custom achievement checker function
   * @param {string} achievementId - ID of the achievement
   * @param {Function} checkerFunction - Function that returns true if achievement should unlock
   */
  registerCustomChecker(achievementId, checkerFunction) {
    this.customCheckers.set(achievementId, checkerFunction);
    this.log(`Custom checker registered for: ${achievementId}`);
  }

  /**
   * Manually check all achievements for unlocks
   */
  checkAllAchievements() {
    if (!this.achievements) {
      this.log('Achievement system not initialized');
      return;
    }

    // Check custom achievements
    this.customCheckers.forEach((checker, achievementId) => {
      if (!this.achievements.isUnlocked(achievementId)) {
        try {
          if (checker(this.gameStats, this.achievements.achievements[achievementId])) {
            this.achievements.unlock(achievementId);
            this.log(`Custom achievement unlocked: ${achievementId}`);
          }
        } catch (error) {
          console.error(`Error in custom checker for ${achievementId}:`, error);
        }
      }
    });

    // Check progress-based achievements
    this.checkProgressAchievements();
  }

  /**
   * Check achievements that might be unlocked by a specific stat change
   * @param {string} statName - Name of the changed statistic
   * @param {*} newValue - New value
   * @param {*} oldValue - Previous value
   */
  checkAchievementsForStat(statName, newValue, oldValue) {
    if (!this.achievements) return;

    // Update progress for achievements tied to this stat
    Object.values(this.achievements.achievements).forEach(achievement => {
      if (achievement.progress && achievement.progress.statName === statName) {
        this.achievements.updateProgress(achievement.id, newValue);
      }
    });

    // Check custom achievements that might care about this stat
    this.checkAllAchievements();
  }

  /**
   * Check achievements that might be triggered by a specific event
   * @param {string} eventName - Name of the event
   * @param {Object} eventData - Event data
   */
  checkAchievementsForEvent(eventName, eventData) {
    if (!this.achievements) return;

    // Check for achievements that respond to specific events
    this.customCheckers.forEach((checker, achievementId) => {
      if (!this.achievements.isUnlocked(achievementId)) {
        try {
          // Pass event info to checker
          const extendedStats = {
            ...this.gameStats,
            lastEvent: eventName,
            lastEventData: eventData
          };
          
          if (checker(extendedStats, this.achievements.achievements[achievementId])) {
            this.achievements.unlock(achievementId);
            this.log(`Event-triggered achievement unlocked: ${achievementId}`);
          }
        } catch (error) {
          console.error(`Error checking achievement ${achievementId} for event ${eventName}:`, error);
        }
      }
    });
  }

  /**
   * Check all progress-based achievements
   */
  checkProgressAchievements() {
    if (!this.achievements) return;

    Object.values(this.achievements.achievements).forEach(achievement => {
      if (achievement.progress && achievement.progress.statName) {
        const statValue = this.gameStats[achievement.progress.statName] || 0;
        this.achievements.updateProgress(achievement.id, statValue);
      }
    });
  }

  /**
   * Start automatic achievement checking
   */
  startAutoCheck() {
    if (this.autoCheckTimer) {
      this.stopAutoCheck();
    }

    this.autoCheckTimer = setInterval(() => {
      this.checkAllAchievements();
    }, this.options.checkInterval);

    this.log('Auto-check started');
  }

  /**
   * Stop automatic achievement checking
   */
  stopAutoCheck() {
    if (this.autoCheckTimer) {
      clearInterval(this.autoCheckTimer);
      this.autoCheckTimer = null;
      this.log('Auto-check stopped');
    }
  }

  /**
   * Set game statistics object reference
   * @param {Object} statsObject - Reference to game's stats object
   */
  setGameStats(statsObject) {
    this.gameStats = statsObject;
    this.log('Game stats reference set');
  }

  /**
   * Get current game statistics
   * @returns {Object} - Current game stats
   */
  getGameStats() {
    return { ...this.gameStats };
  }

  /**
   * Convenience method to unlock an achievement directly
   * @param {string} achievementId - Achievement ID to unlock
   * @returns {boolean} - True if unlocked successfully
   */
  unlockAchievement(achievementId) {
    if (!this.achievements) {
      this.log('Achievement system not initialized');
      return false;
    }

    const result = this.achievements.unlock(achievementId);
    if (result) {
      this.log(`Achievement unlocked: ${achievementId}`);
    }
    return result;
  }

  /**
   * Convenience method to update achievement progress
   * @param {string} achievementId - Achievement ID
   * @param {number} value - Progress value
   */
  updateAchievementProgress(achievementId, value) {
    if (!this.achievements) {
      this.log('Achievement system not initialized');
      return;
    }

    this.achievements.updateProgress(achievementId, value);
  }

  /**
   * Get achievement system statistics
   * @returns {Object} - Stats object with completion info
   */
  getAchievementStats() {
    if (!this.achievements) {
      return { totalPoints: 0, completionPercentage: 0, unlockedCount: 0 };
    }

    return {
      totalPoints: this.achievements.getTotalPoints(),
      completionPercentage: this.achievements.getCompletionPercentage(),
      unlockedCount: this.achievements.getUnlocked().length,
      totalCount: Object.keys(this.achievements.achievements).length
    };
  }

  /**
   * Save achievement progress
   */
  saveAchievements() {
    if (this.achievements) {
      this.achievements.save();
      this.log('Achievements saved');
    }
  }

  /**
   * Load achievement progress
   */
  loadAchievements() {
    if (this.achievements) {
      const loaded = this.achievements.load();
      this.log(`Achievements loaded: ${loaded}`);
      return loaded;
    }
    return false;
  }

  /**
   * Reset all achievements
   */
  resetAchievements() {
    if (this.achievements) {
      this.achievements.reset();
      this.log('Achievements reset');
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopAutoCheck();
    this.customCheckers.clear();
    this.gameStats = {};
    this.achievements = null;
    this.log('Achievement manager destroyed');
  }

  /**
   * Debug logging (if enabled)
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  log(message, data = null) {
    if (this.options.enableDebugLogs) {
      console.log(`[AchievementManager] ${message}`, data || '');
    }
  }
}