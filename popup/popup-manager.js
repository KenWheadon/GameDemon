/**
 * PopupManager - Game Integration Class for Popup System
 * Handles game integration, template system, and notification management
 * NO GAME-SPECIFIC TEMPLATES - Pure integration layer
 */
class PopupManager {
  constructor(gameInstance, options = {}) {
    this.game = gameInstance;
    this.popup = null;
    
    // Configuration options
    this.options = {
      enableGameIntegration: true,
      enableNotifications: true,
      enableConfirmations: true,
      enableCustomPopups: true,
      notificationDuration: 4000,
      enableDebugLogs: false,
      ...options
    };

    // Notification queue for managing multiple notifications
    this.notificationQueue = [];
    this.isProcessingNotifications = false;
    
    // Template registry (user-defined templates)
    this.templates = new Map();
    
    // Active notification timeouts for cleanup
    this.activeNotificationTimeouts = new Map();
    
    // Initialize the system
    this.init();
  }

  /**
   * Initialize the popup manager
   */
  init() {
    try {
      // Create core popup instance
      this.popup = new Popup({
        enableEscapeKey: true,
        enableBackdropClick: true,
        defaultAnimation: 'fade',
        animationDuration: 300,
        enableDebugLogs: this.options.enableDebugLogs
      });

      // Set up game integration
      if (this.options.enableGameIntegration) {
        this.setupGameIntegration();
      }

      this.log('PopupManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PopupManager:', error);
    }
  }

  /**
   * Set up game integration hooks
   */
  setupGameIntegration() {
    // Listen for game events if game has event system
    if (this.game && typeof this.game.on === 'function') {
      this.game.on('popup:show', (data) => this.handleGamePopupEvent(data));
      this.game.on('notification:show', (data) => this.showNotification(data.message, data.options));
      this.game.on('confirm:show', (data) => this.showConfirmation(data.message, data.options));
    }

    // Expose popup methods to game instance for convenience
    if (this.game) {
      this.game.showPopup = this.showCustomPopup.bind(this);
      this.game.showAlert = this.showAlert.bind(this);
      this.game.showConfirm = this.showConfirmation.bind(this);
      this.game.showNotification = this.showNotification.bind(this);
      this.game.registerPopupTemplate = this.registerTemplate.bind(this);
      this.game.showPopupTemplate = this.showTemplate.bind(this);
    }
  }

  /**
   * Register a custom popup template
   * @param {string} templateName - Template identifier
   * @param {Object} template - Template configuration
   */
  registerTemplate(templateName, template) {
    if (typeof templateName !== 'string' || !templateName.trim()) {
      throw new Error('Template name must be a non-empty string');
    }

    if (!template || typeof template !== 'object') {
      throw new Error('Template must be an object');
    }

    // Validate required template properties
    const requiredProps = ['title'];
    const missingProps = requiredProps.filter(prop => !template.hasOwnProperty(prop));
    if (missingProps.length > 0) {
      throw new Error(`Template missing required properties: ${missingProps.join(', ')}`);
    }

    this.templates.set(templateName, { ...template });
    this.log(`Registered template: ${templateName}`);
  }

  /**
   * Show popup using registered template
   * @param {string} templateName - Template name
   * @param {Object} data - Data to pass to template
   * @param {Object} options - Additional options
   * @returns {Promise} - Resolves with popup result
   */
  showTemplate(templateName, data = {}, options = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}. Available templates: ${Array.from(this.templates.keys()).join(', ')}`);
    }

    return new Promise((resolve) => {
      // Generate content from template
      let content;
      if (typeof template.content === 'function') {
        try {
          content = template.content(data);
        } catch (error) {
          console.error(`Error generating template content for ${templateName}:`, error);
          content = `<div style="color: red;">Error rendering template content</div>`;
        }
      } else if (typeof template.content === 'string') {
        content = template.content;
      } else {
        content = '<div>No content defined for template</div>';
      }

      // Merge template options with provided options
      const popupOptions = {
        ...template,
        content: undefined, // Remove content from options
        ...options,
        onClose: (result) => {
          // Call template's onClose if it exists
          if (template.onClose) {
            try {
              template.onClose(result, data);
            } catch (error) {
              console.error(`Error in template onClose callback:`, error);
            }
          }
          
          // Call provided onClose if it exists
          if (options.onClose) {
            options.onClose(result);
          }
          
          resolve(result);
        }
      };

      // Create the popup
      const popupId = this.popup.createPopup(content, popupOptions);
      this.log(`Showed template popup: ${templateName} (${popupId})`);
    });
  }

  /**
   * Get list of registered templates
   * @returns {Array<string>} - Array of template names
   */
  getRegisteredTemplates() {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if template exists
   * @param {string} templateName - Template name to check
   * @returns {boolean} - True if template exists
   */
  hasTemplate(templateName) {
    return this.templates.has(templateName);
  }

  /**
   * Remove a registered template
   * @param {string} templateName - Template name to remove
   * @returns {boolean} - True if template was removed
   */
  unregisterTemplate(templateName) {
    const removed = this.templates.delete(templateName);
    if (removed) {
      this.log(`Unregistered template: ${templateName}`);
    }
    return removed;
  }

  /**
   * Show a simple alert
   * @param {string} message - Alert message
   * @param {Object} options - Alert options
   * @returns {Promise} - Resolves when alert is closed
   */
  showAlert(message, options = {}) {
    return this.popup.alert(message, options);
  }

  /**
   * Show a confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Object} options - Confirmation options
   * @returns {Promise<boolean>} - Resolves with user choice
   */
  showConfirmation(message, options = {}) {
    return this.popup.confirm(message, options);
  }

  /**
   * Show a custom popup with content
   * @param {string|HTMLElement} content - Popup content
   * @param {Object} options - Popup options
   * @returns {string} - Popup ID
   */
  showCustomPopup(content, options = {}) {
    return this.popup.createPopup(content, options);
  }

  /**
   * Show a notification (auto-closing popup)
   * @param {string} message - Notification message
   * @param {Object} options - Notification options
   */
  showNotification(message, options = {}) {
    const notification = {
      message,
      options: {
        type: 'notification',
        icon: '📢',
        duration: this.options.notificationDuration,
        position: 'top-right',
        ...options
      }
    };

    this.notificationQueue.push(notification);
    this.processNotificationQueue();
  }

  /**
   * Process notification queue with proper timing management
   */
  async processNotificationQueue() {
    if (this.isProcessingNotifications || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessingNotifications = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        await this.displayNotification(notification);
        
        // Small delay between notifications to prevent conflicts
        if (this.notificationQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      this.log(`Error processing notification queue: ${error.message}`, 'error');
    } finally {
      this.isProcessingNotifications = false;
    }
  }

  /**
   * Display a single notification with robust timeout management
   * @param {Object} notification - Notification object
   * @returns {Promise} - Resolves when notification is shown
   */
  displayNotification(notification) {
    return new Promise((resolve) => {
      const { message, options } = notification;

      const content = `
        <div class="notification-popup">
          <div class="notification-icon">${options.icon}</div>
          <div class="notification-message">${this.escapeHtml(message)}</div>
        </div>
      `;

      const popupOptions = {
        title: options.title || 'Notification',
        type: 'notification',
        size: 'small',
        showCloseButton: true,
        closeOnBackdrop: true,
        buttons: [],
        onOpen: (popup) => {
          // Set up auto-close with proper cleanup
          if (options.duration > 0) {
            const timeoutId = setTimeout(() => {
              // Verify popup still exists before closing
              if (this.popup && this.popup.getPopup(popup.id)) {
                this.popup.closePopup(popup.id);
              }
              // Clean up timeout reference
              this.activeNotificationTimeouts.delete(popup.id);
            }, options.duration);
            
            // Store timeout for cleanup
            this.activeNotificationTimeouts.set(popup.id, timeoutId);
          }
        },
        onClose: () => {
          // Clean up any active timeout
          if (this.activeNotificationTimeouts.has(options.popupId)) {
            clearTimeout(this.activeNotificationTimeouts.get(options.popupId));
            this.activeNotificationTimeouts.delete(options.popupId);
          }
          resolve();
        },
        onBeforeClose: (result, popup) => {
          // Clean up timeout when popup is manually closed
          if (this.activeNotificationTimeouts.has(popup.id)) {
            clearTimeout(this.activeNotificationTimeouts.get(popup.id));
            this.activeNotificationTimeouts.delete(popup.id);
          }
          return true; // Allow close
        },
        ...options
      };

      try {
        const popupId = this.popup.createPopup(content, popupOptions);
        // Store popup ID for timeout cleanup
        options.popupId = popupId;
      } catch (error) {
        this.log(`Error creating notification popup: ${error.message}`, 'error');
        resolve(); // Resolve anyway to continue queue processing
      }
    });
  }

  /**
   * Handle game popup events
   * @param {Object} data - Event data
   */
  handleGamePopupEvent(data) {
    const { type, template, content, options } = data;

    try {
      switch (type) {
        case 'template':
          if (template) {
            this.showTemplate(template, data.data, options);
          }
          break;
        case 'custom':
          if (content) {
            this.showCustomPopup(content, options);
          }
          break;
        case 'alert':
          this.showAlert(data.message, options);
          break;
        case 'confirm':
          this.showConfirmation(data.message, options);
          break;
        case 'notification':
          this.showNotification(data.message, options);
          break;
        default:
          this.log(`Unknown popup event type: ${type}`, 'warn');
      }
    } catch (error) {
      console.error(`Error handling popup event:`, error);
      // Fallback to simple alert
      this.showAlert('An error occurred while showing popup', {
        title: 'Error',
        icon: '❌'
      });
    }
  }

  /**
   * Close specific popup
   * @param {string} popupId - Popup ID to close
   */
  closePopup(popupId) {
    this.popup.closePopup(popupId);
  }

  /**
   * Close all popups and clean up resources
   */
  closeAll() {
    // Clear all notification timeouts
    this.activeNotificationTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.activeNotificationTimeouts.clear();
    
    // Clear notification queue
    this.notificationQueue = [];
    this.isProcessingNotifications = false;
    
    // Close all popups
    this.popup.closeAll();
  }

  /**
   * Check if any popup is open
   * @returns {boolean} - True if any popup is open
   */
  hasOpenPopups() {
    return this.popup.hasOpenPopups();
  }

  /**
   * Get popup system statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    return {
      totalTemplates: this.templates.size,
      templateNames: Array.from(this.templates.keys()),
      openPopups: this.popup.popupStack.length,
      queuedNotifications: this.notificationQueue.length,
      isProcessingNotifications: this.isProcessingNotifications
    };
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Debug logging
   * @param {string} message - Log message
   * @param {string} type - Log type
   */
  log(message, type = 'info') {
    if (this.options.enableDebugLogs) {
      const logMethod = type === 'error' ? console.error : 
                       type === 'warn' ? console.warn : console.log;
      logMethod(`[PopupManager] ${message}`);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Clear notification queue
    this.notificationQueue = [];
    this.isProcessingNotifications = false;

    // Clear all active timeouts
    this.activeNotificationTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.activeNotificationTimeouts.clear();

    // Clear templates
    this.templates.clear();

    // Destroy popup system
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }

    // Remove game integration
    if (this.game) {
      delete this.game.showPopup;
      delete this.game.showAlert;
      delete this.game.showConfirm;
      delete this.game.showNotification;
      delete this.game.registerPopupTemplate;
      delete this.game.showPopupTemplate;
    }

    this.log('PopupManager destroyed');
  }
}