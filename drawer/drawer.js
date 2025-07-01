/**
 * DrawerManager - Universal Drawer System for Game UI Components
 * Creates and manages slide-in drawers from any side with positioned icons
 */
class DrawerManager {
  constructor(options = {}) {
    // Configuration options
    this.options = {
      enableDebugLogs: false,
      defaultAnimationDuration: 300,
      defaultDrawerSize: 400,
      iconSize: 50,
      zIndexBase: 1000,
      ...options
    };

    // Internal state
    this.drawers = new Map();
    this.drawerCounter = 0;
    this.isInitialized = false;

    // Initialize the system
    this.init();
  }

  /**
   * Initialize the drawer system
   */
  init() {
    try {
      // Create main container for drawer system if it doesn't exist
      this.ensureMainContainer();
      this.isInitialized = true;
      this.log('DrawerManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DrawerManager:', error);
    }
  }

  /**
   * Ensure main container exists for drawer system
   */
  ensureMainContainer() {
    let container = document.getElementById('drawer-system-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'drawer-system-container';
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: ${this.options.zIndexBase};
      `;
      document.body.appendChild(container);
    }
    this.mainContainer = container;
  }

  /**
   * Create a new drawer
   * @param {string} side - 'left', 'right', 'top', 'bottom'
   * @param {Object} iconPosition - {x: number, y: number}
   * @param {Object} options - Configuration options
   * @returns {string} - Drawer ID
   */
  createDrawer(side, iconPosition, options = {}) {
    if (!this.isInitialized) {
      throw new Error('DrawerManager not initialized');
    }

    // Validate parameters
    if (!this.isValidSide(side)) {
      throw new Error(`Invalid side: ${side}. Must be 'left', 'right', 'top', or 'bottom'`);
    }

    if (!this.isValidPosition(iconPosition)) {
      throw new Error('Invalid iconPosition. Must be {x: number, y: number}');
    }

    // Generate unique drawer ID
    const drawerId = `drawer-${++this.drawerCounter}`;

    // Merge options with defaults
    const drawerOptions = {
      size: this.options.defaultDrawerSize,
      animationDuration: this.options.defaultAnimationDuration,
      icon: '📋', // Default icon
      title: 'Drawer',
      closeOnClickOutside: true,
      enableResize: false,
      ...options
    };

    // Create drawer instance
    const drawer = {
      id: drawerId,
      side,
      iconPosition: { ...iconPosition },
      options: drawerOptions,
      isOpen: false,
      elements: {}
    };

    // Create DOM elements
    this.createDrawerElements(drawer);

    // Store drawer instance
    this.drawers.set(drawerId, drawer);

    this.log(`Created drawer: ${drawerId} on ${side} side at (${iconPosition.x}, ${iconPosition.y})`);
    
    return drawerId;
  }

  /**
   * Create DOM elements for a drawer
   * @param {Object} drawer - Drawer instance object
   */
  createDrawerElements(drawer) {
    const { id, side, iconPosition, options } = drawer;

    // Create icon element
    const icon = document.createElement('div');
    icon.id = `${id}-icon`;
    icon.className = `drawer-icon drawer-icon-${side}`;
    icon.innerHTML = options.icon;
    icon.style.cssText = `
      position: fixed;
      ${side === 'left' || side === 'right' ? 'top' : 'left'}: ${side === 'left' || side === 'right' ? iconPosition.y : iconPosition.x}px;
      ${side === 'left' || side === 'right' ? 'left' : 'top'}: ${side === 'left' || side === 'right' ? iconPosition.x : iconPosition.y}px;
      width: ${this.options.iconSize}px;
      height: ${this.options.iconSize}px;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 24px;
      color: white;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      pointer-events: auto;
      z-index: ${this.options.zIndexBase + 10};
      user-select: none;
    `;

    // Create drawer container
    const container = document.createElement('div');
    container.id = `${id}-container`;
    container.className = `drawer-container drawer-${side} drawer-closed`;
    
    // Set initial position based on side
    const containerStyles = this.getContainerStyles(side, options.size);
    container.style.cssText = containerStyles;

    // Create drawer content area
    const content = document.createElement('div');
    content.id = `${id}-content`;
    content.className = 'drawer-content';
    content.style.cssText = `
      width: 100%;
      height: 100%;
      overflow: auto;
      padding: 20px;
      box-sizing: border-box;
    `;

    // Create close button
    const closeButton = document.createElement('div');
    closeButton.className = 'drawer-close-button';
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      color: white;
      transition: all 0.3s ease;
      z-index: 10;
    `;

    // Assemble elements
    container.appendChild(closeButton);
    container.appendChild(content);

    // Add to main container
    this.mainContainer.appendChild(icon);
    this.mainContainer.appendChild(container);

    // Store element references
    drawer.elements = {
      icon,
      container,
      content,
      closeButton
    };

    // Set up event listeners
    this.setupDrawerEvents(drawer);
  }

  /**
   * Get CSS styles for drawer container based on side
   * @param {string} side - Drawer side
   * @param {number} size - Drawer size
   * @returns {string} - CSS styles string
   */
  getContainerStyles(side, size) {
    const baseStyles = `
      position: fixed;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95));
      backdrop-filter: blur(15px);
      border: 2px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      transition: transform ${this.options.defaultAnimationDuration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      pointer-events: auto;
      z-index: ${this.options.zIndexBase + 5};
      overflow: hidden;
    `;

    switch (side) {
      case 'left':
        return `${baseStyles}
          top: 0;
          left: 0;
          width: ${size}px;
          height: 100vh;
          border-radius: 0 15px 15px 0;
          border-left: none;
          transform: translateX(-100%);
        `;
      case 'right':
        return `${baseStyles}
          top: 0;
          right: 0;
          width: ${size}px;
          height: 100vh;
          border-radius: 15px 0 0 15px;
          border-right: none;
          transform: translateX(100%);
        `;
      case 'top':
        return `${baseStyles}
          top: 0;
          left: 0;
          width: 100vw;
          height: ${size}px;
          border-radius: 0 0 15px 15px;
          border-top: none;
          transform: translateY(-100%);
        `;
      case 'bottom':
        return `${baseStyles}
          bottom: 0;
          left: 0;
          width: 100vw;
          height: ${size}px;
          border-radius: 15px 15px 0 0;
          border-bottom: none;
          transform: translateY(100%);
        `;
      default:
        return baseStyles;
    }
  }

  /**
   * Set up event listeners for a drawer
   * @param {Object} drawer - Drawer instance
   */
  setupDrawerEvents(drawer) {
    const { elements, id, options } = drawer;

    // Icon click to toggle drawer
    elements.icon.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDrawer(id);
    });

    // Close button click
    elements.closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeDrawer(id);
    });

    // Click outside to close (if enabled)
    if (options.closeOnClickOutside) {
      elements.container.addEventListener('click', (e) => {
        if (e.target === elements.container) {
          this.closeDrawer(id);
        }
      });
    }

    // Hover effects for icon
    elements.icon.addEventListener('mouseenter', () => {
      elements.icon.style.transform = 'scale(1.1)';
      elements.icon.style.background = 'rgba(72, 219, 251, 0.3)';
      elements.icon.style.borderColor = 'rgba(72, 219, 251, 0.5)';
    });

    elements.icon.addEventListener('mouseleave', () => {
      elements.icon.style.transform = 'scale(1)';
      elements.icon.style.background = 'rgba(255, 255, 255, 0.2)';
      elements.icon.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });

    // Close button hover effects
    elements.closeButton.addEventListener('mouseenter', () => {
      elements.closeButton.style.background = 'rgba(255, 107, 107, 0.3)';
    });

    elements.closeButton.addEventListener('mouseleave', () => {
      elements.closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
    });
  }

  /**
   * Get the container selector for a drawer (for content systems to use)
   * @param {string} drawerId - Drawer ID
   * @returns {string} - CSS selector for the drawer content area
   */
  getDrawerContainer(drawerId) {
    if (!this.drawers.has(drawerId)) {
      throw new Error(`Drawer not found: ${drawerId}`);
    }
    return `#${drawerId}-content`;
  }

  /**
   * Open a drawer
   * @param {string} drawerId - Drawer ID
   * @returns {boolean} - Success status
   */
  openDrawer(drawerId) {
    const drawer = this.drawers.get(drawerId);
    if (!drawer) {
      this.log(`Drawer not found: ${drawerId}`, 'error');
      return false;
    }

    if (drawer.isOpen) {
      return true; // Already open
    }

    // Close other drawers on the same side
    this.closeDrawersOnSide(drawer.side, drawerId);

    // Open this drawer
    drawer.isOpen = true;
    drawer.elements.container.classList.remove('drawer-closed');
    drawer.elements.container.classList.add('drawer-open');
    drawer.elements.container.style.transform = 'translate(0, 0)';

    this.log(`Opened drawer: ${drawerId}`);
    return true;
  }

  /**
   * Close a drawer
   * @param {string} drawerId - Drawer ID
   * @returns {boolean} - Success status
   */
  closeDrawer(drawerId) {
    const drawer = this.drawers.get(drawerId);
    if (!drawer) {
      this.log(`Drawer not found: ${drawerId}`, 'error');
      return false;
    }

    if (!drawer.isOpen) {
      return true; // Already closed
    }

    // Close the drawer
    drawer.isOpen = false;
    drawer.elements.container.classList.remove('drawer-open');
    drawer.elements.container.classList.add('drawer-closed');

    // Reset transform based on side
    const { side } = drawer;
    switch (side) {
      case 'left':
        drawer.elements.container.style.transform = 'translateX(-100%)';
        break;
      case 'right':
        drawer.elements.container.style.transform = 'translateX(100%)';
        break;
      case 'top':
        drawer.elements.container.style.transform = 'translateY(-100%)';
        break;
      case 'bottom':
        drawer.elements.container.style.transform = 'translateY(100%)';
        break;
    }

    this.log(`Closed drawer: ${drawerId}`);
    return true;
  }

  /**
   * Toggle a drawer open/closed
   * @param {string} drawerId - Drawer ID
   * @returns {boolean} - New open state
   */
  toggleDrawer(drawerId) {
    const drawer = this.drawers.get(drawerId);
    if (!drawer) {
      this.log(`Drawer not found: ${drawerId}`, 'error');
      return false;
    }

    if (drawer.isOpen) {
      this.closeDrawer(drawerId);
      return false;
    } else {
      this.openDrawer(drawerId);
      return true;
    }
  }

  /**
   * Remove a drawer completely
   * @param {string} drawerId - Drawer ID
   * @returns {boolean} - Success status
   */
  removeDrawer(drawerId) {
    const drawer = this.drawers.get(drawerId);
    if (!drawer) {
      this.log(`Drawer not found: ${drawerId}`, 'error');
      return false;
    }

    // Remove DOM elements
    if (drawer.elements.icon && drawer.elements.icon.parentNode) {
      drawer.elements.icon.parentNode.removeChild(drawer.elements.icon);
    }
    if (drawer.elements.container && drawer.elements.container.parentNode) {
      drawer.elements.container.parentNode.removeChild(drawer.elements.container);
    }

    // Remove from storage
    this.drawers.delete(drawerId);

    this.log(`Removed drawer: ${drawerId}`);
    return true;
  }

  /**
   * Get the current state of a drawer
   * @param {string} drawerId - Drawer ID
   * @returns {Object|null} - Drawer state object
   */
  getDrawerState(drawerId) {
    const drawer = this.drawers.get(drawerId);
    if (!drawer) {
      return null;
    }

    return {
      id: drawer.id,
      side: drawer.side,
      isOpen: drawer.isOpen,
      iconPosition: { ...drawer.iconPosition },
      options: { ...drawer.options }
    };
  }

  /**
   * Get all drawer states
   * @returns {Array} - Array of drawer state objects
   */
  getAllDrawers() {
    return Array.from(this.drawers.keys()).map(id => this.getDrawerState(id));
  }

  /**
   * Close all drawers on a specific side (except excluded one)
   * @param {string} side - Side to close drawers on
   * @param {string} excludeId - Drawer ID to exclude from closing
   */
  closeDrawersOnSide(side, excludeId = null) {
    this.drawers.forEach((drawer, id) => {
      if (drawer.side === side && id !== excludeId && drawer.isOpen) {
        this.closeDrawer(id);
      }
    });
  }

  /**
   * Close all open drawers
   */
  closeAllDrawers() {
    this.drawers.forEach((drawer, id) => {
      if (drawer.isOpen) {
        this.closeDrawer(id);
      }
    });
  }

  /**
   * Validate side parameter
   * @param {string} side - Side to validate
   * @returns {boolean} - Valid status
   */
  isValidSide(side) {
    return ['left', 'right', 'top', 'bottom'].includes(side);
  }

  /**
   * Validate position parameter
   * @param {Object} position - Position to validate
   * @returns {boolean} - Valid status
   */
  isValidPosition(position) {
    return position && 
           typeof position.x === 'number' && 
           typeof position.y === 'number' &&
           position.x >= 0 && position.y >= 0;
  }

  /**
   * Debug logging (if enabled)
   * @param {string} message - Log message
   * @param {string} type - Log type ('info', 'error', 'warn')
   */
  log(message, type = 'info') {
    if (this.options.enableDebugLogs) {
      const logMethod = type === 'error' ? console.error : 
                       type === 'warn' ? console.warn : console.log;
      logMethod(`[DrawerManager] ${message}`);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Remove all drawers
    const drawerIds = Array.from(this.drawers.keys());
    drawerIds.forEach(id => this.removeDrawer(id));

    // Remove main container
    if (this.mainContainer && this.mainContainer.parentNode) {
      this.mainContainer.parentNode.removeChild(this.mainContainer);
    }

    this.drawers.clear();
    this.isInitialized = false;
    this.log('DrawerManager destroyed');
  }
}