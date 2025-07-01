/**
 * Popup - Universal Popup System Core Class
 * Handles modal dialogs, confirmations, alerts, and custom content popups
 */
class Popup {
  constructor(options = {}) {
    // Configuration options with defaults
    this.options = {
      enableEscapeKey: true,
      enableBackdropClick: true,
      defaultAnimation: 'fade',
      animationDuration: 300,
      stackPopups: true,
      maxStackSize: 10,
      autoFocus: true,
      trapFocus: true,
      ...options
    };

    // Internal state
    this.popupStack = [];
    this.popupCounter = 0;
    this.isInitialized = false;
    this.activePopup = null;
    this.previousFocus = null;

    // Initialize the system
    this.init();
  }

  /**
   * Initialize the popup system
   */
  init() {
    try {
      this.ensurePopupContainer();
      this.setupGlobalEventListeners();
      this.isInitialized = true;
      this.log('Popup system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Popup system:', error);
    }
  }

  /**
   * Ensure popup container exists
   */
  ensurePopupContainer() {
    let container = document.getElementById('popup-system-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'popup-system-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-label', 'Popup notifications');
      document.body.appendChild(container);
    }
    this.container = container;
  }

  /**
   * Set up global event listeners
   */
  setupGlobalEventListeners() {
    // ESC key to close topmost popup
    if (this.options.enableEscapeKey) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activePopup) {
          this.closePopup(this.activePopup.id);
        }
      });
    }

    // Handle focus trap
    if (this.options.trapFocus) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && this.activePopup) {
          this.handleFocusTrap(e);
        }
      });
    }
  }

  /**
   * Create a basic alert popup
   * @param {string} message - Alert message
   * @param {Object} options - Popup options
   * @returns {Promise} - Resolves when popup is closed
   */
  alert(message, options = {}) {
    return new Promise((resolve) => {
      const popupOptions = {
        title: options.title || 'Alert',
        type: 'alert',
        showCloseButton: true,
        buttons: [
          {
            text: options.buttonText || 'OK',
            action: 'close',
            primary: true
          }
        ],
        onClose: () => resolve(true),
        ...options
      };

      const content = `
        <div class="popup-message">
          <div class="popup-icon">${options.icon || '⚠️'}</div>
          <div class="popup-text">${this.escapeHtml(message)}</div>
        </div>
      `;

      this.createPopup(content, popupOptions);
    });
  }

  /**
   * Create a confirmation popup
   * @param {string} message - Confirmation message
   * @param {Object} options - Popup options
   * @returns {Promise<boolean>} - Resolves with user choice
   */
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const popupOptions = {
        title: options.title || 'Confirm',
        type: 'confirm',
        showCloseButton: false,
        buttons: [
          {
            text: options.cancelText || 'Cancel',
            action: 'cancel',
            secondary: true
          },
          {
            text: options.confirmText || 'OK',
            action: 'confirm',
            primary: true
          }
        ],
        onClose: (result) => resolve(result === 'confirm'),
        ...options
      };

      const content = `
        <div class="popup-message">
          <div class="popup-icon">${options.icon || '❓'}</div>
          <div class="popup-text">${this.escapeHtml(message)}</div>
        </div>
      `;

      this.createPopup(content, popupOptions);
    });
  }

  /**
   * Create a custom content popup
   * @param {string|HTMLElement} content - Popup content
   * @param {Object} options - Popup options
   * @returns {string} - Popup ID
   */
  createPopup(content, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Popup system not initialized');
    }

    // Generate unique popup ID
    const popupId = `popup-${++this.popupCounter}`;

    // Merge options with defaults
    const popupOptions = {
      title: 'Popup',
      type: 'custom',
      size: 'medium',
      showCloseButton: true,
      closeOnBackdrop: this.options.enableBackdropClick,
      animation: this.options.defaultAnimation,
      buttons: [],
      onOpen: null,
      onClose: null,
      onBeforeClose: null,
      ...options
    };

    // Check stack limit
    if (this.popupStack.length >= this.options.maxStackSize) {
      this.log('Maximum popup stack size reached', 'warn');
      return null;
    }

    // Create popup instance
    const popup = {
      id: popupId,
      options: popupOptions,
      element: null,
      backdrop: null,
      isVisible: false
    };

    // Store previous focus
    if (!this.activePopup) {
      this.previousFocus = document.activeElement;
    }

    // Create DOM elements
    this.createPopupElements(popup, content);

    // Add to stack
    this.popupStack.push(popup);
    this.activePopup = popup;

    // Show popup with animation
    this.showPopup(popup);

    this.log(`Created popup: ${popupId}`);
    return popupId;
  }

  /**
   * Create DOM elements for popup
   * @param {Object} popup - Popup instance
   * @param {string|HTMLElement} content - Popup content
   */
  createPopupElements(popup, content) {
    const { id, options } = popup;

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = `${id}-backdrop`;
    backdrop.className = `popup-backdrop popup-backdrop-${options.animation}`;
    backdrop.setAttribute('role', 'presentation');

    // Create popup container
    const popupElement = document.createElement('div');
    popupElement.id = id;
    popupElement.className = `popup-container popup-${options.size} popup-${options.type} popup-${options.animation}`;
    popupElement.setAttribute('role', 'dialog');
    popupElement.setAttribute('aria-modal', 'true');
    popupElement.setAttribute('aria-labelledby', `${id}-title`);
    
    // Set initial hidden state
    popupElement.style.display = 'none';
    backdrop.style.display = 'none';

    // Create popup structure
    const popupHTML = `
      <div class="popup-header">
        <h3 class="popup-title" id="${id}-title">${this.escapeHtml(options.title)}</h3>
        ${options.showCloseButton ? `
          <button class="popup-close" aria-label="Close popup" type="button">
            <span aria-hidden="true">✕</span>
          </button>
        ` : ''}
      </div>
      <div class="popup-content" id="${id}-content">
        ${typeof content === 'string' ? content : ''}
      </div>
      ${options.buttons.length > 0 ? `
        <div class="popup-footer">
          ${options.buttons.map((button, index) => `
            <button 
              class="popup-button ${button.primary ? 'popup-button-primary' : ''} ${button.secondary ? 'popup-button-secondary' : ''}"
              data-action="${button.action || 'close'}"
              data-button-index="${index}"
              type="button"
            >
              ${this.escapeHtml(button.text)}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;

    popupElement.innerHTML = popupHTML;

    // If content is an HTMLElement, append it
    if (content instanceof HTMLElement) {
      const contentContainer = popupElement.querySelector('.popup-content');
      contentContainer.innerHTML = '';
      contentContainer.appendChild(content);
    }

    // Add to container
    this.container.appendChild(backdrop);
    this.container.appendChild(popupElement);

    // Store references
    popup.element = popupElement;
    popup.backdrop = backdrop;

    // Set up event listeners
    this.setupPopupEvents(popup);
  }

  /**
   * Set up event listeners for a popup
   * @param {Object} popup - Popup instance
   */
  setupPopupEvents(popup) {
    const { element, backdrop, options, id } = popup;

    // Close button
    const closeButton = element.querySelector('.popup-close');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closePopup(id);
      });
    }

    // Action buttons
    const actionButtons = element.querySelectorAll('.popup-button');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        const buttonIndex = parseInt(button.dataset.buttonIndex);
        
        // Call button callback if exists
        if (options.buttons[buttonIndex]?.callback) {
          const shouldClose = options.buttons[buttonIndex].callback(action, popup);
          if (shouldClose !== false) {
            this.closePopup(id, action);
          }
        } else {
          this.closePopup(id, action);
        }
      });
    });

    // Backdrop click
    if (options.closeOnBackdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closePopup(id);
        }
      });
    }

    // Prevent popup container clicks from closing
    element.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * Show popup with animation
   * @param {Object} popup - Popup instance
   */
  showPopup(popup) {
    const { element, backdrop, options, id } = popup;

    // Show elements
    backdrop.style.display = 'block';
    element.style.display = 'block';

    // Trigger reflow for animations
    backdrop.offsetHeight;
    element.offsetHeight;

    // Add visible classes
    requestAnimationFrame(() => {
      backdrop.classList.add('popup-backdrop-visible');
      element.classList.add('popup-visible');
      
      popup.isVisible = true;

      // Focus management
      if (this.options.autoFocus) {
        const firstFocusable = this.getFirstFocusableElement(element);
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }

      // Call onOpen callback
      if (options.onOpen) {
        options.onOpen(popup);
      }

      this.log(`Showed popup: ${id}`);
    });
  }

  /**
   * Close popup
   * @param {string} popupId - Popup ID to close
   * @param {string} result - Close result/action
   */
  closePopup(popupId, result = 'close') {
    const popupIndex = this.popupStack.findIndex(p => p.id === popupId);
    if (popupIndex === -1) {
      this.log(`Popup not found: ${popupId}`, 'warn');
      return;
    }

    const popup = this.popupStack[popupIndex];
    const { element, backdrop, options } = popup;

    // Call onBeforeClose callback
    if (options.onBeforeClose) {
      const shouldClose = options.onBeforeClose(result, popup);
      if (shouldClose === false) {
        return; // Cancel close
      }
    }

    // Hide with animation
    element.classList.remove('popup-visible');
    backdrop.classList.remove('popup-backdrop-visible');

    // Wait for animation, then remove
    setTimeout(() => {
      // Remove from DOM
      if (element.parentNode) element.parentNode.removeChild(element);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);

      // Remove from stack
      this.popupStack.splice(popupIndex, 1);

      // Update active popup
      this.activePopup = this.popupStack.length > 0 ? 
        this.popupStack[this.popupStack.length - 1] : null;

      // Restore focus if no more popups
      if (this.popupStack.length === 0 && this.previousFocus) {
        this.previousFocus.focus();
        this.previousFocus = null;
      }

      // Call onClose callback
      if (options.onClose) {
        options.onClose(result, popup);
      }

      this.log(`Closed popup: ${popupId}`);
    }, this.options.animationDuration);
  }

  /**
   * Close all popups
   */
  closeAll() {
    const popupIds = this.popupStack.map(p => p.id);
    popupIds.forEach(id => this.closePopup(id));
  }

  /**
   * Get popup by ID
   * @param {string} popupId - Popup ID
   * @returns {Object|null} - Popup instance
   */
  getPopup(popupId) {
    return this.popupStack.find(p => p.id === popupId) || null;
  }

  /**
   * Check if any popup is open
   * @returns {boolean} - True if any popup is open
   */
  hasOpenPopups() {
    return this.popupStack.length > 0;
  }

  /**
   * Get first focusable element in container
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement|null} - First focusable element
   */
  getFirstFocusableElement(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return focusableElements[0] || null;
  }

  /**
   * Handle focus trap for accessibility
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleFocusTrap(e) {
    if (!this.activePopup) return;

    const popup = this.activePopup.element;
    const focusableElements = popup.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
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
      logMethod(`[Popup] ${message}`);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.closeAll();
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.popupStack = [];
    this.isInitialized = false;
    this.log('Popup system destroyed');
  }
}