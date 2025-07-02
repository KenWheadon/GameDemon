# Universal Popup System

A clean, reusable popup and dialog system for web-based games and applications. Features modal dialogs, confirmations, alerts, notifications, and a template system for user-defined content - with zero game-specific assumptions.

![Popup System Demo](popup-demo-screenshot.png)

## 🚀 **Quick Start**

```javascript
// 1. Include the files
<link rel="stylesheet" href="popup.css">
<script src="Popup.js"></script>
<script src="PopupManager.js"></script>

// 2. Create popup manager
const popupManager = new PopupManager(gameInstance);

// 3. Show basic popups
await popupManager.showAlert('Game saved successfully!');
const confirmed = await popupManager.showConfirmation('Delete save file?');
popupManager.showNotification('Achievement unlocked!');

// 4. Register YOUR game templates
popupManager.registerTemplate('gameOver', {
  title: 'Game Over',
  content: (data) => `<div>Score: ${data.score}</div>`,
  buttons: [{ text: 'Restart', action: 'restart', primary: true }]
});

// 5. Use your templates
await popupManager.showTemplate('gameOver', { score: 15680 });
```

## 📁 **File Structure**

```
popup-system/
├── Popup.js               // Core reusable popup class
├── PopupManager.js        // Game integration manager
├── popup.css             // Complete styling system
├── README-popup.md       // This documentation
└── popup-test.html       // Standalone test environment
```

## 🏗️ **Clean Architecture Design**

### **Core Philosophy:**
- **`Popup`** - Universal popup mechanics (100% reusable, no game logic)
- **`PopupManager`** - Integration layer (template system, notifications, game hooks)
- **User Code** - Game-specific templates and content (YOUR responsibility)

### **Benefits:**
✅ **True separation of concerns** - No game logic in core classes  
✅ **Genuinely reusable** across any project type  
✅ **Template system** for user-defined patterns  
✅ **Clean integration** with existing systems  
✅ **Follows OOP principles** - Single responsibility  

### **What's NOT in the Toolkit:**
❌ Pre-built game templates (Game Over, Level Complete, etc.)  
❌ Game-specific content or styling  
❌ Assumptions about your game type  

### **What IS in the Toolkit:**
✅ Core popup mechanics and UI management  
✅ Template registration and rendering system  
✅ Notification queue management  
✅ Accessibility and keyboard navigation  
✅ Integration hooks for your game  

---

## 📖 **API Documentation**

## **Popup Class** (Core System)

### **Constructor**
```javascript
new Popup(options = {})
```

**Options:**
```javascript
{
  enableEscapeKey: true,        // ESC key closes popups
  enableBackdropClick: true,    // Click outside to close
  defaultAnimation: 'fade',     // Default animation type
  animationDuration: 300,       // Animation speed (ms)
  stackPopups: true,           // Allow multiple popups
  maxStackSize: 10,            // Maximum stacked popups
  autoFocus: true,             // Auto-focus first element
  trapFocus: true,             // Trap focus within popup
  enableDebugLogs: false       // Console logging
}
```

### **Core Methods**

#### **`alert(message, options)`**
Show a simple alert dialog

**Parameters:**
- `message` - String: Alert message
- `options` - Object: Alert configuration

**Options:**
```javascript
{
  title: 'Alert',              // Popup title
  icon: '⚠️',                  // Icon emoji/text
  buttonText: 'OK'             // Button text
}
```

**Returns:** Promise - Resolves when closed

**Example:**
```javascript
await popup.alert('Game saved successfully!', {
  title: 'Success',
  icon: '✅',
  buttonText: 'Great!'
});
```

#### **`confirm(message, options)`**
Show a confirmation dialog

**Parameters:**
- `message` - String: Confirmation message
- `options` - Object: Confirmation configuration

**Options:**
```javascript
{
  title: 'Confirm',            // Popup title
  icon: '❓',                  // Icon emoji/text
  confirmText: 'OK',           // Confirm button text
  cancelText: 'Cancel'         // Cancel button text
}
```

**Returns:** Promise<boolean> - Resolves with user choice

**Example:**
```javascript
const shouldDelete = await popup.confirm('Delete this save file?', {
  title: 'Confirm Deletion',
  icon: '🗑️',
  confirmText: 'Delete',
  cancelText: 'Keep'
});

if (shouldDelete) {
  // Delete the file
}
```

#### **`createPopup(content, options)`**
Create a custom content popup

**Parameters:**
- `content` - String|HTMLElement: Popup content
- `options` - Object: Popup configuration

**Options:**
```javascript
{
  title: 'Popup',              // Popup title
  type: 'custom',              // Popup type
  size: 'medium',              // Size: 'small', 'medium', 'large'
  showCloseButton: true,       // Show X button
  closeOnBackdrop: true,       // Click outside to close
  animation: 'fade',           // Animation type
  buttons: [],                 // Custom buttons array
  onOpen: null,               // Open callback
  onClose: null,              // Close callback
  onBeforeClose: null         // Before close callback
}
```

**Button Configuration:**
```javascript
{
  text: 'Button Text',         // Button label
  action: 'action_name',       // Action identifier
  primary: false,             // Primary button styling
  secondary: false,           // Secondary button styling
  callback: (action, popup) => { // Custom callback
    // Return false to prevent auto-close
    return true;
  }
}
```

**Returns:** String - Popup ID

**Example:**
```javascript
const content = `
  <div style="text-align: center; padding: 20px;">
    <h2>Custom Content</h2>
    <p>This popup contains custom HTML!</p>
  </div>
`;

const popupId = popup.createPopup(content, {
  title: 'Custom Popup',
  size: 'large',
  buttons: [
    { text: 'Action', action: 'custom_action', primary: true },
    { text: 'Close', action: 'close', secondary: true }
  ],
  onClose: (result) => {
    console.log('Popup closed with:', result);
  }
});
```

### **Management Methods**

#### **`closePopup(popupId, result)`**
Close a specific popup

**Parameters:**
- `popupId` - String: Popup ID to close
- `result` - String: Close result/action (optional)

#### **`closeAll()`**
Close all open popups

#### **`getPopup(popupId)`**
Get popup instance by ID

**Returns:** Object|null - Popup instance

#### **`hasOpenPopups()`**
Check if any popups are open

**Returns:** Boolean - True if popups are open

---

## **PopupManager Class** (Game Integration)

### **Constructor**
```javascript
new PopupManager(gameInstance, options = {})
```

**Parameters:**
- `gameInstance` - Object: Reference to your game object
- `options` - Object: Configuration options

**Options:**
```javascript
{
  enableGameIntegration: true,  // Auto-integrate with game
  enableNotifications: true,    // Enable notification system
  enableConfirmations: true,    // Enable confirmation dialogs
  enableCustomPopups: true,     // Enable custom popups
  notificationDuration: 4000,   // Notification auto-close time
  enableDebugLogs: false       // Console logging
}
```

### **Quick Methods**

#### **`showAlert(message, options)`**
Show alert popup
```javascript
await popupManager.showAlert('Level completed!', { icon: '🎉' });
```

#### **`showConfirmation(message, options)`**
Show confirmation popup
```javascript
const confirmed = await popupManager.showConfirmation('Restart level?');
```

#### **`showNotification(message, options)`**
Show auto-closing notification
```javascript
popupManager.showNotification('Achievement unlocked!', { 
  icon: '🏆',
  duration: 3000 
});
```

#### **`showCustomPopup(content, options)`**
Show custom content popup
```javascript
const popupId = popupManager.showCustomPopup('<h2>Custom</h2>', {
  title: 'My Popup',
  size: 'large'
});
```

### **Template System**

#### **`registerTemplate(templateName, template)`**
Register a custom popup template

**Parameters:**
- `templateName` - String: Template identifier
- `template` - Object: Template configuration

**Template Structure:**
```javascript
{
  title: 'Template Title',         // Required: Popup title
  type: 'custom',                 // Optional: Popup type
  size: 'medium',                 // Optional: Size variant
  content: (data) => `<div>...</div>`, // Content function or string
  buttons: [                      // Optional: Custom buttons
    { text: 'OK', action: 'close', primary: true }
  ],
  onClose: (result, data) => {},  // Optional: Close callback
  // ... any other popup options
}
```

**Example:**
```javascript
// Register template (in YOUR game code)
popupManager.registerTemplate('itemFound', {
  title: 'Item Found!',
  content: (data) => `
    <div style="text-align: center;">
      <div style="font-size: 48px;">${data.icon}</div>
      <h3>You found: ${data.name}</h3>
      <p>${data.description}</p>
    </div>
  `,
  buttons: [
    { text: 'Awesome!', action: 'close', primary: true }
  ]
});
```

#### **`showTemplate(templateName, data, options)`**
Show popup using registered template

**Parameters:**
- `templateName` - String: Registered template name
- `data` - Object: Data to pass to template content function
- `options` - Object: Additional popup options (optional)

**Returns:** Promise - Resolves with user action

**Example:**
```javascript
// Use template
const result = await popupManager.showTemplate('itemFound', {
  icon: '⚔️',
  name: 'Magic Sword',
  description: 'A powerful weapon forged by ancient magic!'
});
```

#### **Template Management Methods**

```javascript
// Check if template exists
const exists = popupManager.hasTemplate('gameOver');

// Get list of registered templates
const templates = popupManager.getRegisteredTemplates();

// Remove template
popupManager.unregisterTemplate('oldTemplate');

// Get system stats
const stats = popupManager.getStats();
// Returns: { totalTemplates, templateNames, openPopups, ... }
```

---

## 🎮 **Usage Examples**

### **1. Clean Game Integration**
```javascript
class MyGame {
  constructor() {
    this.popupManager = new PopupManager(this);
    this.registerGameTemplates();  // YOUR templates
    this.setupGameEvents();
  }
  
  registerGameTemplates() {
    // Define YOUR game's popup templates
    this.popupManager.registerTemplate('gameOver', {
      title: 'Game Over',
      content: (data) => `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 64px;">💀</div>
          <h2>Game Over!</h2>
          <p>Score: ${data.score}</p>
          ${data.highScore ? '<p>New High Score! 🎉</p>' : ''}
        </div>
      `,
      buttons: [
        { text: 'Try Again', action: 'restart', primary: true },
        { text: 'Main Menu', action: 'menu', secondary: true }
      ]
    });

    this.popupManager.registerTemplate('levelComplete', {
      title: 'Level Complete!',
      content: (data) => `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 64px;">⭐</div>
          <h2>Level ${data.level} Complete!</h2>
          <p>Time: ${data.time}</p>
          <p>Score: ${data.score}</p>
        </div>
      `,
      buttons: [
        { text: 'Continue', action: 'continue', primary: true }
      ]
    });
  }
  
  async handlePlayerDeath() {
    const action = await this.popupManager.showTemplate('gameOver', {
      score: this.score,
      highScore: this.isNewHighScore()
    });
    
    if (action === 'restart') {
      this.restart();
    } else if (action === 'menu') {
      this.showMainMenu();
    }
  }
  
  async handleLevelComplete() {
    await this.popupManager.showTemplate('levelComplete', {
      level: this.currentLevel,
      time: this.formatTime(this.levelTime),
      score: this.levelScore
    });
    
    this.loadNextLevel();
  }
}
```

### **2. Achievement System Integration**
```javascript
class GameWithAchievements {
  constructor() {
    this.popupManager = new PopupManager(this);
    this.achievementManager = new AchievementManager(this);
    this.setupAchievementPopups();
  }
  
  setupAchievementPopups() {
    // Register achievement unlock template
    this.popupManager.registerTemplate('achievementUnlocked', {
      title: 'Achievement Unlocked!',
      content: (data) => `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 64px;">🏆</div>
          <h2>${data.name}</h2>
          <p>${data.description}</p>
          <div style="color: #48dbfb; font-weight: bold;">
            +${data.points} Points
          </div>
        </div>
      `,
      buttons: [
        { text: 'Awesome!', action: 'close', primary: true }
      ]
    });
    
    // Hook into achievement system
    this.achievementManager.onAchievementUnlocked = (achievement) => {
      this.popupManager.showTemplate('achievementUnlocked', achievement);
    };
  }
}
```

### **3. Advanced Custom Popups**
```javascript
class InventorySystem {
  constructor(popupManager) {
    this.popupManager = popupManager;
    this.items = [];
    this.registerInventoryTemplates();
  }
  
  registerInventoryTemplates() {
    this.popupManager.registerTemplate('inventory', {
      title: 'Inventory',
      size: 'large',
      content: (data) => this.generateInventoryHTML(data.items),
      buttons: [
        { 
          text: 'Sort', 
          action: 'sort',
          callback: (action, popup) => {
            this.sortItems();
            this.refreshInventoryDisplay(popup);
            return false; // Don't close popup
          }
        },
        { text: 'Close', action: 'close', primary: true }
      ]
    });
    
    this.popupManager.registerTemplate('itemDetails', {
      title: 'Item Details',
      content: (data) => `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 15px;">${data.icon}</div>
          <h3>${data.name}</h3>
          <p>${data.description}</p>
          <div style="margin: 15px 0;">
            <strong>Rarity:</strong> ${data.rarity}<br>
            <strong>Value:</strong> ${data.value} gold
          </div>
        </div>
      `,
      buttons: [
        { text: 'Use', action: 'use', primary: true },
        { text: 'Drop', action: 'drop', secondary: true },
        { text: 'Cancel', action: 'cancel' }
      ]
    });
  }
  
  async showInventory() {
    await this.popupManager.showTemplate('inventory', { items: this.items });
  }
  
  async showItemDetails(item) {
    const action = await this.popupManager.showTemplate('itemDetails', item);
    
    switch (action) {
      case 'use':
        this.useItem(item);
        break;
      case 'drop':
        this.dropItem(item);
        break;
    }
  }
}
```

### **4. Confirmation Workflows**
```javascript
class SaveSystem {
  constructor(popupManager) {
    this.popupManager = popupManager;
  }
  
  async saveGame() {
    try {
      await this.performSave();
      await this.popupManager.showAlert('Game saved successfully!', {
        icon: '💾',
        title: 'Save Complete'
      });
    } catch (error) {
      await this.popupManager.showAlert('Save failed. Please try again.', {
        icon: '❌',
        title: 'Save Error'
      });
    }
  }
  
  async deleteAllSaves() {
    const confirmed = await this.popupManager.showConfirmation(
      'This will delete ALL save files permanently. Are you sure?',
      {
        title: 'Delete All Saves',
        icon: '🗑️',
        confirmText: 'Delete All',
        cancelText: 'Cancel'
      }
    );
    
    if (confirmed) {
      const doubleConfirmed = await this.popupManager.showConfirmation(
        'Really delete everything? This cannot be undone!',
        {
          title: 'Final Confirmation',
          icon: '⚠️',
          confirmText: 'Yes, Delete All',
          cancelText: 'Cancel'
        }
      );
      
      if (doubleConfirmed) {
        await this.performDeleteAll();
        this.popupManager.showNotification('All saves deleted', { icon: '🗑️' });
      }
    }
  }
}
```

### **5. Template Categories (User Organization)**
```javascript
class GamePopupTemplates {
  constructor(popupManager) {
    this.popupManager = popupManager;
    this.registerAllTemplates();
  }
  
  registerAllTemplates() {
    // Combat templates
    this.registerCombatTemplates();
    
    // UI templates  
    this.registerUITemplates();
    
    // Story templates
    this.registerStoryTemplates();
  }
  
  registerCombatTemplates() {
    this.popupManager.registerTemplate('battleResult', {
      title: 'Battle Complete',
      content: (data) => `
        <div style="text-align: center;">
          <div style="font-size: 48px;">${data.victory ? '🎉' : '💀'}</div>
          <h2>${data.victory ? 'Victory!' : 'Defeat!'}</h2>
          <p>Experience gained: ${data.exp}</p>
          ${data.loot ? `<p>Loot: ${data.loot.join(', ')}</p>` : ''}
        </div>
      `,
      buttons: [
        { text: 'Continue', action: 'continue', primary: true }
      ]
    });
  }
  
  registerUITemplates() {
    this.popupManager.registerTemplate('settings', {
      title: 'Settings',
      size: 'large',
      content: (data) => this.generateSettingsHTML(data),
      buttons: [
        { text: 'Apply', action: 'apply', primary: true },
        { text: 'Cancel', action: 'cancel', secondary: true }
      ]
    });
  }
  
  registerStoryTemplates() {
    this.popupManager.registerTemplate('dialogue', {
      title: 'Conversation',
      content: (data) => `
        <div style="padding: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="font-size: 36px; margin-right: 15px;">${data.character.avatar}</div>
            <strong>${data.character.name}</strong>
          </div>
          <p style="font-style: italic;">"${data.message}"</p>
        </div>
      `,
      buttons: data => data.choices.map((choice, index) => ({
        text: choice.text,
        action: `choice_${index}`,
        primary: index === 0
      }))
    });
  }
}
```

---

## ⚙️ **Configuration Options**

### **CSS Variables for Easy Theming**
```css
:root {
  --popup-background: rgba(255, 255, 255, 0.98);
  --popup-backdrop: rgba(0, 0, 0, 0.6);
  --popup-border: rgba(0, 0, 0, 0.1);
  --popup-shadow: rgba(0, 0, 0, 0.3);
  --popup-text-color: #333;
  --popup-header-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --popup-header-text: white;
  --popup-button-primary: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
  --popup-button-secondary: linear-gradient(135deg, #a8a8a8 0%, #7d7d7d 100%);
  --popup-border-radius: 15px;
  --popup-animation-duration: 300ms;
}
```

### **Pre-built Theme Classes**
```css
/* Success theme */
.popup-theme-success {
  --popup-header-background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
}

/* Warning theme */
.popup-theme-warning {
  --popup-header-background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
}

/* Danger theme */
.popup-theme-danger {
  --popup-header-background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
}

/* Info theme */
.popup-theme-info {
  --popup-header-background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
}
```

### **Apply Themes**
```javascript
// Apply theme to specific popup
const popupId = popupManager.showCustomPopup(content, { title: 'Success!' });
document.getElementById(popupId).classList.add('popup-theme-success');

// Or apply globally
document.body.classList.add('popup-theme-dark');
```

---

## 🧠 **Architectural Principles**

### **Why This Architecture?**
```javascript
// ❌ BAD - Game logic mixed into toolkit
class PopupManager {
  showGameOver(data) {
    // Toolkit shouldn't know about "game over" concept
    return this.popup.create(gameOverTemplate, data);
  }
}

// ✅ GOOD - Clean separation
class PopupManager {
  registerTemplate(name, template) {
    // Toolkit provides mechanism, user provides content
    this.templates.set(name, template);
  }
  
  showTemplate(name, data) {
    // User defines what "gameOver" means for their game
    return this.popup.create(this.templates.get(name), data);
  }
}

// In YOUR game code:
popupManager.registerTemplate('gameOver', {
  title: 'My Game Over',
  content: (data) => myGameOverHTML(data)
});
```

### **Single Responsibility Principle**
- **Popup.js:** Manages modal mechanics (focus, animation, DOM)
- **PopupManager.js:** Manages templates and integration hooks
- **Your Code:** Defines what popups look like and do

### **Open/Closed Principle**
- **Open for extension:** Register unlimited templates
- **Closed for modification:** Core classes never need changes

### **Dependency Inversion**
- Toolkit depends on abstractions (template interface)
- Your game provides concrete implementations

### **Popup Core Options**
```javascript
const popup = new Popup({
  enableEscapeKey: true,        // ESC key functionality
  enableBackdropClick: true,    // Click outside to close
  defaultAnimation: 'fade',     // Default animation
  animationDuration: 400,       // Slower animations
  stackPopups: true,           // Allow stacking
  maxStackSize: 5,             // Limit stack size
  autoFocus: true,             // Auto-focus management
  trapFocus: true,             // Focus trapping
  enableDebugLogs: true        // Debug logging
});
```

### **PopupManager Options**
```javascript
const popupManager = new PopupManager(game, {
  enableGameIntegration: true,  // Game method injection
  enableNotifications: true,    // Notification queue
  enableConfirmations: true,    // Confirmation dialogs
  enableCustomPopups: true,     // Custom popup support
  notificationDuration: 5000,   // Longer notifications
  enableDebugLogs: true        // Debug logging
});
```

### **Individual Popup Options**
```javascript
popupManager.showCustomPopup(content, {
  title: 'Custom Popup',
  type: 'custom',
  size: 'large',               // Size variant
  showCloseButton: true,       // X button
  closeOnBackdrop: false,      // Disable backdrop close
  animation: 'bounce',         // Custom animation
  buttons: [...],              // Custom buttons
  onOpen: (popup) => {         // Open callback
    console.log('Popup opened');
  },
  onClose: (result) => {       // Close callback
    console.log('Closed with:', result);
  },
  onBeforeClose: (result) => { // Before close callback
    return confirm('Really close?'); // Return false to cancel
  }
});
```

---

## 🔧 **Advanced Features**

### **Animation System**
```javascript
// Built-in animations
const animations = ['fade', 'slide', 'bounce'];

// Custom animation via CSS
.popup-custom-animation {
  animation: myCustomAnimation 0.5s ease-out;
}

@keyframes myCustomAnimation {
  from { transform: translate(-50%, -50%) rotateY(-90deg); }
  to { transform: translate(-50%, -50%) rotateY(0deg); }
}
```

### **Notification Queue**
```javascript
// Multiple notifications are queued automatically
for (let i = 0; i < 5; i++) {
  popupManager.showNotification(`Notification ${i + 1}`);
}
// They'll appear one after another
```

### **Focus Management**
```javascript
// Focus trap keeps Tab navigation within popup
// ESC key closes topmost popup
// Auto-focus first interactive element
// Restore focus when popup closes

// Custom focus management
const popupId = popupManager.showCustomPopup(content, {
  onOpen: (popup) => {
    // Custom focus logic
    popup.element.querySelector('#my-input').focus();
  }
});
```

### **Event Integration**
```javascript
// If your game has an event system
game.on('popup:show', (data) => {
  popupManager.handleGamePopupEvent(data);
});

// Trigger from game
game.emit('popup:show', {
  type: 'template',
  template: 'gameOver',
  data: { score: 15000 }
});
```

---

## 📱 **Responsive Design**

### **Mobile Adaptations**
The popup system automatically adapts for mobile devices:

- **Sizing:** Responsive popup sizes (90vw on mobile, 95vw on small screens)
- **Buttons:** Full-width buttons on mobile with proper spacing
- **Touch:** Touch-friendly button sizes and interactions
- **Gestures:** Swipe gestures for notification dismissal
- **Viewport:** Proper viewport handling for mobile browsers

### **Responsive Breakpoints**
```css
/* Tablet and below */
@media (max-width: 768px) {
  .popup-container {
    max-width: 90vw;
    max-height: 85vh;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .popup-container {
    max-width: 95vw;
    max-height: 90vh;
  }
}
```

---

## ♿ **Accessibility**

### **Built-in Accessibility Features**
- **ARIA Labels:** Proper role and aria-* attributes
- **Focus Management:** Tab trapping and restoration
- **Keyboard Navigation:** Full keyboard support
- **Screen Readers:** Semantic markup and live regions
- **High Contrast:** Support for high contrast mode
- **Reduced Motion:** Respects prefers-reduced-motion

### **Accessibility Best Practices**
```javascript
// Use semantic content
const accessibleContent = `
  <div role="alert">
    <h2 id="error-title">Error Occurred</h2>
    <p aria-describedby="error-title">Please try again.</p>
  </div>
`;

// Provide meaningful titles
popupManager.showAlert('Network error', {
  title: 'Connection Problem', // Screen reader announces this
  icon: '🌐'
});

// Use proper button labels
buttons: [
  { 
    text: 'Delete Item', 
    action: 'delete',
    'aria-label': 'Delete selected item permanently'
  }
]
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Popups not appearing**
```javascript
// ❌ Wrong - not waiting for initialization
const popup = new Popup();
popup.alert('Hello'); // May fail

// ✅ Correct - ensure initialization
const popup = new Popup();
await new Promise(resolve => setTimeout(resolve, 100)); // Let it initialize
popup.alert('Hello');
```

**Z-index conflicts**
```css
/* Increase z-index if popups appear behind other elements */
#popup-system-container {
  z-index: 99999 !important;
}
```

**Mobile viewport issues**
```html
<!-- Ensure proper viewport meta tag -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

**Template not found**
```javascript
// ❌ Wrong - template not registered
popupManager.showTemplate('myTemplate'); // Throws error

// ✅ Correct - register first
popupManager.registerTemplate('myTemplate', { ... });
popupManager.showTemplate('myTemplate');
```

**Memory leaks**
```javascript
// ❌ Wrong - not cleaning up
// Popups accumulate in memory

// ✅ Correct - clean up when done
popupManager.destroy(); // Call when game ends
```

### **Debug Mode**
```javascript
const popupManager = new PopupManager(game, {
  enableDebugLogs: true // Enable console logging
});

// Check popup state
console.log(popupManager.getStats());
console.log(popupManager.popup.popupStack);
```

---

## 🚀 **Performance Tips**

### **Efficient Usage Patterns**
```javascript
// ❌ Avoid - Creating many popup instances
for (let i = 0; i < 100; i++) {
  new Popup(); // Creates 100 instances
}

// ✅ Better - Reuse single instance
const popupManager = new PopupManager(game);
for (let i = 0; i < 100; i++) {
  popupManager.showNotification(`Message ${i}`);
}
```

### **Memory Management**
```javascript
// Clean up when not needed
class GameScene {
  constructor() {
    this.popupManager = new PopupManager(this);
  }
  
  destroy() {
    this.popupManager.destroy(); // Clean up resources
    this.popupManager = null;
  }
}
```

### **Animation Performance**
```css
/* Use CSS transforms for better performance */
.popup-container {
  will-change: transform, opacity;
  contain: layout style paint;
}
```

---

## 📊 **API Reference Summary**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| **Popup Core** |
| `alert()` | message, options | Promise | Show alert dialog |
| `confirm()` | message, options | Promise<boolean> | Show confirmation |
| `createPopup()` | content, options | string | Create custom popup |
| `closePopup()` | popupId, result | void | Close specific popup |
| `closeAll()` | none | void | Close all popups |
| `hasOpenPopups()` | none | boolean | Check if popups open |
| **PopupManager** |
| `showAlert()` | message, options | Promise | Quick alert |
| `showConfirmation()` | message, options | Promise<boolean> | Quick confirmation |
| `showNotification()` | message, options | void | Auto-closing notification |
| `showCustomPopup()` | content, options | string | Custom content popup |
| `showGameOver()` | gameData | Promise | Game over template |
| `showLevelComplete()` | levelData | Promise | Level complete template |
| `showPauseMenu()` | none | Promise | Pause menu template |
| `showSettings()` | settings | Promise | Settings template |
| `registerTemplate()` | name, template | void | Register custom template |
| `showTemplate()` | name, data, options | Promise | Use registered template |
| `getStats()` | none | object | System statistics |

---

## 🔮 **Future Enhancements**

### **Planned Features:**
- [ ] Drag and drop popup repositioning
- [ ] Multi-language support system
- [ ] Sound integration for popup events
- [ ] Popup transition effects library
- [ ] Advanced template inheritance
- [ ] Popup state persistence
- [ ] Performance analytics dashboard

### **Contributing:**
This is part of a personal game development toolkit. Feel free to extend for your projects!

---

## 📄 **Browser Support**

- ✅ **Chrome 60+**
- ✅ **Firefox 55+**
- ✅ **Safari 12+**
- ✅ **Edge 79+**
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

**Features used:**
- ES6 Classes and Promises
- CSS Grid and Flexbox
- CSS Custom Properties (Variables)
- CSS Transforms and Transitions
- Backdrop Filter (with fallbacks)
- Web APIs (focus management, keyboard events)

---

## 🎮 **Example Games Using This System**

- **Ice Cream Fighter** - Game over/level complete integration
- **Drawer System Test** - Popup confirmation workflows
- **Achievement System** - Notification integration
- **[Your Next Game]** - Ready for any popup needs!

---

**Built with ❤️ for universal, accessible game UI development**

Perfect foundation for any game requiring user dialogs and notifications!