/**
 * Achievements - Reusable Achievement System Core Class
 * Handles UI rendering, data management, progress tracking, and notifications
 */
class Achievements {
  constructor(containerSelector, options = {}) {
    this.containerSelector = containerSelector;
    this.container = document.querySelector(containerSelector);
    
    if (!this.container) {
      throw new Error(`Achievement container not found: ${containerSelector}`);
    }

    // Options with defaults
    this.options = {
      storageKey: 'achievements',
      enableNotifications: true,
      autoSave: true,
      ...options
    };

    // Internal data
    this.achievements = {};
    this.unlockedAchievements = new Set();
    this.isInitialized = false;
  }

  /**
   * Set achievement data and initialize the system
   * @param {Object} achievementData - Achievement definitions
   */
  setAchievementData(achievementData) {
    this.achievements = { ...achievementData };
    this.isInitialized = true;
    this.render();
  }

  /**
   * Unlock an achievement (if not already unlocked)
   * @param {string} achievementId - ID of achievement to unlock
   * @returns {boolean} - True if unlocked, false if already unlocked
   */
  unlock(achievementId) {
    if (!this.achievements[achievementId]) {
      console.warn(`Achievement not found: ${achievementId}`);
      return false;
    }

    if (this.unlockedAchievements.has(achievementId)) {
      return false; // Already unlocked
    }

    // Unlock the achievement
    this.unlockedAchievements.add(achievementId);
    
    // Update visual
    this.updateAchievementVisual(achievementId);
    
    // Show notification
    if (this.options.enableNotifications) {
      this.showNotification(this.achievements[achievementId]);
    }

    // Auto-save if enabled
    if (this.options.autoSave) {
      this.save();
    }

    return true;
  }

  /**
   * Update progress for an achievement with validation and auto-unlock
   * @param {string} achievementId - ID of achievement
   * @param {number} currentValue - Current progress value
   */
  updateProgress(achievementId, currentValue) {
    const achievement = this.achievements[achievementId];
    if (!achievement || !achievement.progress) {
      console.warn(`Progress achievement not found: ${achievementId}`);
      return;
    }

    // Skip if already unlocked
    if (this.unlockedAchievements.has(achievementId)) {
      return;
    }

    // Progress validation - don't go backwards
    const current = achievement.progress.current || 0;
    const validatedValue = Math.max(currentValue, current);
    
    // Update progress
    achievement.progress.current = validatedValue;
    
    // Update progress bar visual
    this.updateProgressBar(achievementId);

    // Auto-unlock when target reached
    if (validatedValue >= achievement.progress.target) {
      this.unlock(achievementId);
    } else if (this.options.autoSave) {
      // Save progress even if not unlocked
      this.save();
    }
  }

  /**
   * Batch update unlocked achievements (for loading from save)
   * @param {Array} unlockedArray - Array of unlocked achievement IDs
   */
  updateUnlocks(unlockedArray) {
    this.unlockedAchievements = new Set(unlockedArray);
    
    // Update all visuals
    if (this.isInitialized) {
      Object.keys(this.achievements).forEach(id => {
        this.updateAchievementVisual(id);
      });
    }
  }

  /**
   * Reset all achievements to locked state
   */
  reset() {
    this.unlockedAchievements.clear();
    
    // Reset progress data
    Object.values(this.achievements).forEach(achievement => {
      if (achievement.progress) {
        achievement.progress.current = 0;
      }
    });

    // Update all visuals
    if (this.isInitialized) {
      Object.keys(this.achievements).forEach(id => {
        this.updateAchievementVisual(id);
      });
    }

    // Save the reset state
    if (this.options.autoSave) {
      this.save();
    }
  }

  /**
   * Get array of all unlocked achievement IDs
   * @returns {Array} - Array of unlocked achievement IDs
   */
  getUnlocked() {
    return Array.from(this.unlockedAchievements);
  }

  /**
   * Check if specific achievement is unlocked
   * @param {string} achievementId - Achievement ID to check
   * @returns {boolean} - True if unlocked
   */
  isUnlocked(achievementId) {
    return this.unlockedAchievements.has(achievementId);
  }

  /**
   * Get current progress for an achievement
   * @param {string} achievementId - Achievement ID
   * @returns {Object|null} - Progress object or null
   */
  getProgress(achievementId) {
    const achievement = this.achievements[achievementId];
    return achievement?.progress || null;
  }

  /**
   * Get total points from unlocked achievements
   * @returns {number} - Total points earned
   */
  getTotalPoints() {
    return Array.from(this.unlockedAchievements)
      .reduce((total, id) => {
        return total + (this.achievements[id]?.points || 0);
      }, 0);
  }

  /**
   * Get completion percentage
   * @returns {number} - Percentage (0-100)
   */
  getCompletionPercentage() {
    const total = Object.keys(this.achievements).length;
    const unlocked = this.unlockedAchievements.size;
    return total > 0 ? Math.round((unlocked / total) * 100) : 0;
  }

  /**
   * Save achievements to localStorage
   * @param {string} customKey - Optional custom storage key
   */
  save(customKey = null) {
    const key = customKey || this.options.storageKey;
    
    try {
      const saveData = {
        unlockedAchievements: Array.from(this.unlockedAchievements),
        progressData: {},
        timestamp: Date.now()
      };

      // Save current progress for all achievements
      Object.keys(this.achievements).forEach(id => {
        const achievement = this.achievements[id];
        if (achievement.progress) {
          saveData.progressData[id] = achievement.progress.current;
        }
      });

      localStorage.setItem(key, JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  }

  /**
   * Load achievements from localStorage
   * @param {string} customKey - Optional custom storage key
   * @returns {boolean} - True if data was loaded
   */
  load(customKey = null) {
    const key = customKey || this.options.storageKey;
    
    try {
      const saved = localStorage.getItem(key);
      if (!saved) {
        return false;
      }

      const saveData = JSON.parse(saved);
      
      // Restore unlocked achievements
      if (saveData.unlockedAchievements) {
        this.updateUnlocks(saveData.unlockedAchievements);
      }

      // Restore progress data
      if (saveData.progressData && this.isInitialized) {
        Object.keys(saveData.progressData).forEach(id => {
          const achievement = this.achievements[id];
          if (achievement && achievement.progress) {
            achievement.progress.current = saveData.progressData[id];
          }
        });
        
        // Update progress bars
        Object.keys(this.achievements).forEach(id => {
          this.updateProgressBar(id);
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to load achievements:', error);
      return false;
    }
  }

  /**
   * Update visual state of a single achievement
   * @param {string} achievementId - Achievement ID to update
   */
  updateAchievementVisual(achievementId) {
    const element = document.getElementById(`achievement-${achievementId}`);
    if (!element) return;

    const isUnlocked = this.unlockedAchievements.has(achievementId);
    
    // Update CSS classes
    element.classList.toggle('unlocked', isUnlocked);
    element.classList.toggle('locked', !isUnlocked);

    // Update progress bar if it exists
    this.updateProgressBar(achievementId);
  }

  /**
   * Update progress bar for an achievement
   * @param {string} achievementId - Achievement ID
   */
  updateProgressBar(achievementId) {
    const achievement = this.achievements[achievementId];
    if (!achievement || !achievement.progress) return;

    const progressBar = document.querySelector(`#achievement-${achievementId} .achievement-progress-fill`);
    const progressText = document.querySelector(`#achievement-${achievementId} .achievement-progress-text`);
    
    if (progressBar) {
      const percentage = Math.min((achievement.progress.current / achievement.progress.target) * 100, 100);
      progressBar.style.width = `${percentage}%`;
    }

    if (progressText) {
      progressText.textContent = `${achievement.progress.current}/${achievement.progress.target}`;
    }
  }

  /**
   * Render the achievement system UI
   */
  render() {
    if (!this.isInitialized) {
      console.warn('Achievements not initialized - call setAchievementData() first');
      return;
    }

    // Create main container structure
    this.container.innerHTML = `
      <div class="achievements-header">
        <h3>Achievements</h3>
        <div class="achievements-stats">
          <span class="achievements-completion">${this.getCompletionPercentage()}% Complete</span>
          <span class="achievements-points">${this.getTotalPoints()} Points</span>
        </div>
      </div>
      <div class="achievements-grid" id="achievements-grid">
        ${this.renderAchievementGrid()}
      </div>
    `;

    // Update all achievement visuals
    Object.keys(this.achievements).forEach(id => {
      this.updateAchievementVisual(id);
    });

    // Set up event listeners for hints
    this.setupHintListeners();
  }

  /**
   * Generate HTML for achievement grid
   * @returns {string} - HTML string for achievements
   */
  renderAchievementGrid() {
    return Object.values(this.achievements).map(achievement => {
      const isHidden = achievement.hidden && !this.unlockedAchievements.has(achievement.id);
      const displayName = isHidden ? (achievement.name || "???") : achievement.name;
      const displayDescription = isHidden ? (achievement.description || "???") : achievement.description;
      const displayIcon = isHidden ? "❓" : achievement.icon;

      let progressHTML = '';
      if (achievement.progress && !isHidden) {
        const current = achievement.progress.current || 0;
        const target = achievement.progress.target;
        const percentage = Math.min((current / target) * 100, 100);
        
        progressHTML = `
          <div class="achievement-progress">
            <div class="achievement-progress-bar">
              <div class="achievement-progress-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="achievement-progress-text">${current}/${target}</div>
          </div>
        `;
      }

      let hintHTML = '';
      if (achievement.hidden && achievement.hint && !this.unlockedAchievements.has(achievement.id)) {
        hintHTML = `
          <div class="achievement-hint-button" data-achievement-id="${achievement.id}">
            💡 Hint
          </div>
          <div class="achievement-hint" id="hint-${achievement.id}" style="display: none;">
            ${achievement.hint}
          </div>
        `;
      }

      return `
        <div class="achievement-item ${isHidden ? 'hidden' : ''}" id="achievement-${achievement.id}">
          <div class="achievement-icon">${displayIcon}</div>
          <div class="achievement-content">
            <div class="achievement-name">${displayName}</div>
            <div class="achievement-description">${displayDescription}</div>
            ${progressHTML}
            <div class="achievement-points">+${achievement.points} points</div>
            ${hintHTML}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Set up event listeners for hint buttons
   */
  setupHintListeners() {
    const hintButtons = this.container.querySelectorAll('.achievement-hint-button');
    hintButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const achievementId = e.target.dataset.achievementId;
        this.showHint(achievementId);
      });
    });
  }

  /**
   * Show hint for a hidden achievement
   * @param {string} achievementId - Achievement ID
   */
  showHint(achievementId) {
    const hintElement = document.getElementById(`hint-${achievementId}`);
    if (hintElement) {
      const isVisible = hintElement.style.display !== 'none';
      hintElement.style.display = isVisible ? 'none' : 'block';
      
      // Update button text
      const button = document.querySelector(`[data-achievement-id="${achievementId}"]`);
      if (button) {
        button.textContent = isVisible ? '💡 Hint' : '🔒 Hide';
      }
    }
  }

  /**
   * Show notification popup when achievement is unlocked
   * @param {Object} achievement - Achievement object
   */
  showNotification(achievement) {
    // Check if notifications are enabled
    if (!this.options.enableNotifications) return;

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-notification-content">
        <div class="achievement-notification-header">
          <span class="achievement-notification-title">🏆 Achievement Unlocked!</span>
        </div>
        <div class="achievement-notification-body">
          <div class="achievement-notification-icon">${achievement.icon}</div>
          <div class="achievement-notification-text">
            <div class="achievement-notification-name">${achievement.revealedName || achievement.name}</div>
            <div class="achievement-notification-points">+${achievement.points} points</div>
          </div>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.classList.add('hide');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 500);
    }, 4000);

    // Update stats in header
    this.updateStatsDisplay();
  }

  /**
   * Update the stats display in header
   */
  updateStatsDisplay() {
    const completionSpan = this.container.querySelector('.achievements-completion');
    const pointsSpan = this.container.querySelector('.achievements-points');
    
    if (completionSpan) {
      completionSpan.textContent = `${this.getCompletionPercentage()}% Complete`;
    }
    
    if (pointsSpan) {
      pointsSpan.textContent = `${this.getTotalPoints()} Points`;
    }
  }

  /**
   * Update visual state of a single achievement (enhanced)
   * @param {string} achievementId - Achievement ID to update
   */
  updateAchievementVisual(achievementId) {
    const element = document.getElementById(`achievement-${achievementId}`);
    if (!element) return;

    const isUnlocked = this.unlockedAchievements.has(achievementId);
    const achievement = this.achievements[achievementId];
    
    // Update CSS classes
    element.classList.toggle('unlocked', isUnlocked);
    element.classList.toggle('locked', !isUnlocked);

    // If this was a hidden achievement that got unlocked, reveal it
    if (isUnlocked && achievement.hidden) {
      // Update content with revealed information
      const nameEl = element.querySelector('.achievement-name');
      const descEl = element.querySelector('.achievement-description');
      const iconEl = element.querySelector('.achievement-icon');
      
      if (nameEl) nameEl.textContent = achievement.revealedName || achievement.name;
      if (descEl) descEl.textContent = achievement.revealedDescription || achievement.description;
      if (iconEl) iconEl.textContent = achievement.icon;
      
      // Remove hidden class and hint elements
      element.classList.remove('hidden');
      const hintButton = element.querySelector('.achievement-hint-button');
      const hintEl = element.querySelector('.achievement-hint');
      if (hintButton) hintButton.remove();
      if (hintEl) hintEl.remove();
    }

    // Update progress bar if it exists
    this.updateProgressBar(achievementId);
  }
}