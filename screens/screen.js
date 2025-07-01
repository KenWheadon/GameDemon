/**
 * Screen.js - Core Reusable Screen Class
 * Part of Vanilla JavaScript Game Development Toolkit
 * 
 * A flexible, reusable screen system for game interfaces including
 * start screens, end screens, credits, help, and custom game screens.
 * 
 * Features:
 * - Template-based content rendering
 * - Configurable button system with callbacks
 * - Background customization (images, colors, gradients)
 * - Animation support with CSS transitions
 * - Responsive and accessible design
 * - Event-driven architecture
 * - Error-resistant with graceful degradation
 * 
 * @author Game Development Toolkit
 * @version 1.0.0
 */

class Screen {
    /**
     * Create a new Screen instance
     * @param {Object} config - Screen configuration object
     * @param {string} config.id - Unique identifier for the screen
     * @param {string} config.type - Screen type (start, end, credits, help, custom)
     * @param {string} [config.title] - Screen title text
     * @param {string} [config.subtitle] - Screen subtitle text
     * @param {string} [config.content] - Main content HTML or text
     * @param {Object} [config.background] - Background configuration
     * @param {string} [config.background.type] - Background type (color, gradient, image)
     * @param {string} [config.background.value] - Background value (CSS color, gradient, or image URL)
     * @param {Array} [config.buttons] - Array of button configurations
     * @param {Object} [config.styling] - Custom styling options
     * @param {Function} [config.onShow] - Callback when screen is shown
     * @param {Function} [config.onHide] - Callback when screen is hidden
     */
    constructor(config = {}) {
        try {
            // Core properties
            this.id = config.id || this._generateId();
            this.type = config.type || 'custom';
            this.title = config.title || '';
            this.subtitle = config.subtitle || '';
            this.content = config.content || '';
            
            // Visual configuration
            this.background = config.background || { type: 'color', value: '#1a1a2e' };
            this.buttons = config.buttons || [];
            this.styling = config.styling || {};
            
            // Callbacks
            this.onShow = config.onShow || null;
            this.onHide = config.onHide || null;
            
            // State management
            this.isVisible = false;
            this.isAnimating = false;
            this.element = null;
            this.buttonElements = new Map();
            
            // Event listeners storage for cleanup
            this.eventListeners = [];
            
            // Initialize screen
            this._init();
            
        } catch (error) {
            console.error('Screen initialization error:', error);
            this._initFallback();
        }
    }

    /**
     * Initialize the screen with DOM creation and event binding
     * @private
     */
    _init() {
        try {
            this._createScreenElement();
            this._attachEventListeners();
        } catch (error) {
            console.error('Screen initialization failed:', error);
            this._initFallback();
        }
    }

    /**
     * Fallback initialization for error cases
     * @private
     */
    _initFallback() {
        this.element = document.createElement('div');
        this.element.className = 'game-screen game-screen--error';
        this.element.innerHTML = `
            <div class="screen-content">
                <h1>Screen Error</h1>
                <p>Unable to initialize screen properly.</p>
            </div>
        `;
    }

    /**
     * Generate a unique ID for the screen
     * @private
     * @returns {string} Generated unique ID
     */
    _generateId() {
        return `screen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create the main screen DOM element
     * @private
     */
    _createScreenElement() {
        // Create main screen container
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = `game-screen game-screen--${this.type}`;
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-hidden', 'true');
        
        // Apply background styling
        this._applyBackground();
        
        // Build screen content
        this.element.innerHTML = this._generateTemplate();
        
        // Cache button elements
        this._cacheButtonElements();
    }

    /**
     * Apply background styling based on configuration
     * @private
     */
    _applyBackground() {
        const { type, value } = this.background;
        
        switch (type) {
            case 'color':
                this.element.style.backgroundColor = value;
                break;
            case 'gradient':
                this.element.style.background = value;
                break;
            case 'image':
                this.element.style.backgroundImage = `url(${value})`;
                this.element.style.backgroundSize = 'cover';
                this.element.style.backgroundPosition = 'center';
                break;
            default:
                this.element.style.backgroundColor = '#1a1a2e';
        }
    }

    /**
     * Generate the HTML template for the screen
     * @private
     * @returns {string} Generated HTML template
     */
    _generateTemplate() {
        return `
            <div class="screen-overlay"></div>
            <div class="screen-content">
                ${this.title ? `<h1 class="screen-title">${this._escapeHtml(this.title)}</h1>` : ''}
                ${this.subtitle ? `<h2 class="screen-subtitle">${this._escapeHtml(this.subtitle)}</h2>` : ''}
                ${this.content ? `<div class="screen-main-content">${this.content}</div>` : ''}
                ${this._generateButtonsHtml()}
            </div>
        `;
    }

    /**
     * Generate HTML for buttons
     * @private
     * @returns {string} Generated buttons HTML
     */
    _generateButtonsHtml() {
        if (!this.buttons.length) return '';
        
        const buttonsHtml = this.buttons.map((button, index) => {
            const buttonId = `${this.id}-btn-${index}`;
            const buttonClass = `screen-button ${button.class || ''} ${button.primary ? 'screen-button--primary' : ''}`;
            const disabled = button.disabled ? 'disabled' : '';
            const ariaLabel = button.ariaLabel || button.label;
            
            return `
                <button 
                    id="${buttonId}"
                    class="${buttonClass}"
                    data-button-index="${index}"
                    ${disabled}
                    aria-label="${this._escapeHtml(ariaLabel)}"
                >
                    ${button.icon ? `<span class="button-icon">${button.icon}</span>` : ''}
                    <span class="button-text">${this._escapeHtml(button.label)}</span>
                </button>
            `;
        }).join('');
        
        return `<div class="screen-buttons">${buttonsHtml}</div>`;
    }

    /**
     * Cache button elements for efficient access
     * @private
     */
    _cacheButtonElements() {
        this.buttonElements.clear();
        this.buttons.forEach((button, index) => {
            const buttonElement = this.element.querySelector(`#${this.id}-btn-${index}`);
            if (buttonElement) {
                this.buttonElements.set(index, buttonElement);
            }
        });
    }

    /**
     * Attach event listeners to the screen
     * @private
     */
    _attachEventListeners() {
        // Button click handlers
        this.buttonElements.forEach((buttonElement, index) => {
            const clickHandler = (event) => this._handleButtonClick(event, index);
            buttonElement.addEventListener('click', clickHandler);
            this.eventListeners.push({ element: buttonElement, event: 'click', handler: clickHandler });
        });

        // Keyboard navigation
        const keyHandler = (event) => this._handleKeyPress(event);
        this.element.addEventListener('keydown', keyHandler);
        this.eventListeners.push({ element: this.element, event: 'keydown', handler: keyHandler });

        // Focus management
        const focusHandler = () => this._manageFocus();
        this.element.addEventListener('focusin', focusHandler);
        this.eventListeners.push({ element: this.element, event: 'focusin', handler: focusHandler });
    }

    /**
     * Handle button click events
     * @private
     * @param {Event} event - Click event
     * @param {number} buttonIndex - Index of clicked button
     */
    _handleButtonClick(event, buttonIndex) {
        event.preventDefault();
        
        try {
            const button = this.buttons[buttonIndex];
            if (!button || button.disabled) return;
            
            // Add click animation
            this._animateButtonClick(event.target);
            
            // Execute callback if provided
            if (typeof button.callback === 'function') {
                button.callback(this, button, buttonIndex);
            }
            
            // Emit custom event
            this._emitEvent('screenButtonClick', {
                screen: this,
                button: button,
                buttonIndex: buttonIndex
            });
            
        } catch (error) {
            console.error('Button click handler error:', error);
        }
    }

    /**
     * Handle keyboard navigation
     * @private
     * @param {KeyboardEvent} event - Keyboard event
     */
    _handleKeyPress(event) {
        if (!this.isVisible) return;
        
        switch (event.key) {
            case 'Escape':
                this._emitEvent('screenEscape', { screen: this });
                break;
            case 'Enter':
            case ' ':
                const focused = document.activeElement;
                if (focused && focused.classList.contains('screen-button')) {
                    focused.click();
                }
                break;
            case 'Tab':
                // Let default tab behavior handle focus
                break;
        }
    }

    /**
     * Manage focus states for accessibility
     * @private
     */
    _manageFocus() {
        if (!this.isVisible) return;
        
        // Ensure focus stays within screen when visible
        const focusableElements = this.element.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) {
            this.element.focus();
        }
    }

    /**
     * Animate button click for visual feedback
     * @private
     * @param {HTMLElement} buttonElement - Button element to animate
     */
    _animateButtonClick(buttonElement) {
        buttonElement.classList.add('screen-button--clicked');
        setTimeout(() => {
            buttonElement.classList.remove('screen-button--clicked');
        }, 150);
    }

    /**
     * Show the screen with optional animation
     * @param {Object} [options] - Show options
     * @param {boolean} [options.animate=true] - Whether to animate the transition
     * @param {Function} [options.callback] - Callback after show completion
     * @returns {Promise} Promise that resolves when show is complete
     */
    async show(options = {}) {
        if (this.isVisible || this.isAnimating) return;
        
        try {
            this.isAnimating = true;
            const animate = options.animate !== false;
            
            // Add to DOM if not already present
            if (!this.element.parentNode) {
                document.body.appendChild(this.element);
            }
            
            // Prepare for show
            this.element.style.display = 'flex';
            this.element.setAttribute('aria-hidden', 'false');
            
            if (animate) {
                this.element.classList.add('screen-entering');
                
                // Wait for animation
                await new Promise(resolve => {
                    setTimeout(() => {
                        this.element.classList.remove('screen-entering');
                        this.element.classList.add('screen-visible');
                        resolve();
                    }, 300);
                });
            } else {
                this.element.classList.add('screen-visible');
            }
            
            this.isVisible = true;
            this.isAnimating = false;
            
            // Focus management
            this._setInitialFocus();
            
            // Execute show callback
            if (this.onShow) {
                this.onShow(this);
            }
            
            // Execute options callback
            if (options.callback) {
                options.callback(this);
            }
            
            // Emit event
            this._emitEvent('screenShow', { screen: this });
            
        } catch (error) {
            console.error('Screen show error:', error);
            this.isAnimating = false;
        }
    }

    /**
     * Hide the screen with optional animation
     * @param {Object} [options] - Hide options
     * @param {boolean} [options.animate=true] - Whether to animate the transition
     * @param {Function} [options.callback] - Callback after hide completion
     * @returns {Promise} Promise that resolves when hide is complete
     */
    async hide(options = {}) {
        if (!this.isVisible || this.isAnimating) return;
        
        try {
            this.isAnimating = true;
            const animate = options.animate !== false;
            
            if (animate) {
                this.element.classList.remove('screen-visible');
                this.element.classList.add('screen-exiting');
                
                // Wait for animation
                await new Promise(resolve => {
                    setTimeout(() => {
                        this.element.classList.remove('screen-exiting');
                        this.element.style.display = 'none';
                        resolve();
                    }, 300);
                });
            } else {
                this.element.classList.remove('screen-visible');
                this.element.style.display = 'none';
            }
            
            this.element.setAttribute('aria-hidden', 'true');
            this.isVisible = false;
            this.isAnimating = false;
            
            // Execute hide callback
            if (this.onHide) {
                this.onHide(this);
            }
            
            // Execute options callback
            if (options.callback) {
                options.callback(this);
            }
            
            // Emit event
            this._emitEvent('screenHide', { screen: this });
            
        } catch (error) {
            console.error('Screen hide error:', error);
            this.isAnimating = false;
        }
    }

    /**
     * Set initial focus when screen is shown
     * @private
     */
    _setInitialFocus() {
        // Try to focus first primary button, then first button, then screen itself
        const primaryButton = this.element.querySelector('.screen-button--primary');
        const firstButton = this.element.querySelector('.screen-button');
        
        if (primaryButton && !primaryButton.disabled) {
            primaryButton.focus();
        } else if (firstButton && !firstButton.disabled) {
            firstButton.focus();
        } else {
            this.element.focus();
        }
    }

    /**
     * Update screen content
     * @param {Object} updates - Object containing properties to update
     * @param {string} [updates.title] - New title
     * @param {string} [updates.subtitle] - New subtitle
     * @param {string} [updates.content] - New content
     * @param {Array} [updates.buttons] - New buttons array
     */
    update(updates = {}) {
        try {
            let needsRerender = false;
            
            // Update properties
            if (updates.title !== undefined) {
                this.title = updates.title;
                needsRerender = true;
            }
            
            if (updates.subtitle !== undefined) {
                this.subtitle = updates.subtitle;
                needsRerender = true;
            }
            
            if (updates.content !== undefined) {
                this.content = updates.content;
                needsRerender = true;
            }
            
            if (updates.buttons !== undefined) {
                this.buttons = updates.buttons;
                needsRerender = true;
            }
            
            // Re-render if needed
            if (needsRerender) {
                this._removeEventListeners();
                this.element.innerHTML = this._generateTemplate();
                this._cacheButtonElements();
                this._attachEventListeners();
                
                // Restore focus if screen is visible
                if (this.isVisible) {
                    this._setInitialFocus();
                }
            }
            
        } catch (error) {
            console.error('Screen update error:', error);
        }
    }

    /**
     * Get current screen state
     * @returns {Object} Current state object
     */
    getState() {
        return {
            id: this.id,
            type: this.type,
            isVisible: this.isVisible,
            isAnimating: this.isAnimating,
            title: this.title,
            subtitle: this.subtitle,
            content: this.content,
            buttonCount: this.buttons.length
        };
    }

    /**
     * Destroy the screen and clean up resources
     */
    destroy() {
        try {
            // Hide screen if visible
            if (this.isVisible) {
                this.hide({ animate: false });
            }
            
            // Remove event listeners
            this._removeEventListeners();
            
            // Remove from DOM
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            
            // Clear references
            this.element = null;
            this.buttonElements.clear();
            this.eventListeners = [];
            
            // Emit destroy event
            this._emitEvent('screenDestroy', { screen: this });
            
        } catch (error) {
            console.error('Screen destroy error:', error);
        }
    }

    /**
     * Remove all event listeners
     * @private
     */
    _removeEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
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
            console.error('Event emission error:', error);
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}