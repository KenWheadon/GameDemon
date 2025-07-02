# Universal Drawer System

A flexible, reusable drawer component system for web-based games and applications. Create slide-in panels from any side of the screen with customizable icons and content.

![Drawer System Demo](drawer-demo-screenshot.png)

## 🚀 **Quick Start**

```javascript
// 1. Include the files
<link rel="stylesheet" href="drawer.css">
<script src="DrawerManager.js"></script>

// 2. Create drawer manager
const drawerManager = new DrawerManager();

// 3. Create a drawer
const drawerId = drawerManager.createDrawer(
  'right',                    // side: 'left', 'right', 'top', 'bottom'
  { x: 20, y: 100 },         // icon position
  {
    size: 400,               // drawer size (width or height)
    icon: '🏆',              // icon to display
    title: 'My Drawer'       // drawer title
  }
);

// 4. Get container for your content
const container = drawerManager.getDrawerContainer(drawerId);

// 5. Render your content into the container
yourContentSystem.render(container);
```

## 📁 **File Structure**

```
drawer-system/
├── DrawerManager.js         // Core drawer management class
├── drawer.css              // Complete styling system
├── drawer-examples.js      // Integration examples
├── README-drawer.md        // This documentation
└── index.html             // Test/demo page (updated)
```

## 🏗️ **Perfect for Integration**

### **Works Seamlessly With:**
- 🏆 **Achievement Systems** - Display achievements in slide-out panels
- 📦 **Inventory Systems** - Show player inventory in organized drawers
- 📊 **Stats Displays** - Real-time character/game statistics
- 🎮 **Any Content** - Completely content-agnostic

### **Integration Example with Achievement System:**
```javascript
// Create achievement drawer
const achievementDrawer = drawerManager.createDrawer('right', {x: 20, y: 100});

// Initialize achievements in the drawer (NO CHANGES to achievement system needed!)
achievementManager.initializeAchievements(
  drawerManager.getDrawerContainer(achievementDrawer),
  GAME_ACHIEVEMENTS
);
```

---

## 📖 **API Documentation**

## **DrawerManager Class**

### **Constructor**
```javascript
new DrawerManager(options = {})
```

**Options:**
```javascript
{
  enableDebugLogs: false,           // Console logging
  defaultAnimationDuration: 300,   // Animation speed (ms)
  defaultDrawerSize: 400,          // Default drawer size (px)
  iconSize: 50,                    // Icon size (px)
  zIndexBase: 1000                 // Base z-index for layering
}
```

### **Core Methods**

#### **`createDrawer(side, iconPosition, options)`**
Create a new drawer instance

**Parameters:**
- `side` - String: 'left', 'right', 'top', 'bottom'
- `iconPosition` - Object: {x: number, y: number}
- `options` - Object: Configuration options

**Options:**
```javascript
{
  size: 400,                    // Drawer size (width for left/right, height for top/bottom)
  animationDuration: 300,       // Animation speed
  icon: '📋',                   // Icon emoji or text
  title: 'Drawer',             // Drawer title
  closeOnClickOutside: true,    // Close when clicking outside
  enableResize: false          // Allow drawer resizing (future feature)
}
```

**Returns:** String - Unique drawer ID

**Example:**
```javascript
const drawerId = drawerManager.createDrawer(
  'left',
  { x: 50, y: 200 },
  {
    size: 350,
    icon: '🎒',
    title: 'Inventory'
  }
);
```

#### **`getDrawerContainer(drawerId)`**
Get the CSS selector for drawer content area

**Parameters:**
- `drawerId` - String: Drawer ID returned from createDrawer()

**Returns:** String - CSS selector for content container

**Example:**
```javascript
const container = drawerManager.getDrawerContainer(drawerId);
myContentSystem.render(container);
```

#### **`openDrawer(drawerId)`**
Open a specific drawer

**Parameters:**
- `drawerId` - String: Drawer ID

**Returns:** Boolean - Success status

#### **`closeDrawer(drawerId)`** 
Close a specific drawer

**Parameters:**
- `drawerId` - String: Drawer ID

**Returns:** Boolean - Success status

#### **`toggleDrawer(drawerId)`**
Toggle drawer open/closed state

**Parameters:**
- `drawerId` - String: Drawer ID

**Returns:** Boolean - New open state (true = opened, false = closed)

#### **`removeDrawer(drawerId)`**
Completely remove a drawer

**Parameters:**
- `drawerId` - String: Drawer ID

**Returns:** Boolean - Success status

### **State Management**

#### **`getDrawerState(drawerId)`**
Get current state of a drawer

**Returns:** Object - Drawer state
```javascript
{
  id: "drawer-1",
  side: "right", 
  isOpen: false,
  iconPosition: { x: 20, y: 100 },
  options: { size: 400, icon: "🏆", ... }
}
```

#### **`getAllDrawers()`**
Get states of all drawers

**Returns:** Array - Array of drawer state objects

#### **`closeAllDrawers()`**
Close all currently open drawers

---

## 🎮 **Usage Examples**

### **1. Achievement Integration**
```javascript
class GameWithAchievements {
  constructor() {
    this.drawerManager = new DrawerManager();
    this.achievementManager = new AchievementManager(this);
    this.setupAchievementDrawer();
  }
  
  setupAchievementDrawer() {
    // Create achievement drawer on right side
    const achievementDrawer = this.drawerManager.createDrawer(
      'right',
      { x: 20, y: 100 },
      { size: 450, icon: '🏆', title: 'Achievements' }
    );
    
    // Initialize achievement system in drawer
    this.achievementManager.initializeAchievements(
      this.drawerManager.getDrawerContainer(achievementDrawer),
      GAME_ACHIEVEMENTS
    );
  }
}
```

### **2. Inventory System**
```javascript
class InventoryDrawer {
  constructor(drawerManager) {
    this.drawerManager = drawerManager;
    this.setupInventory();
  }
  
  setupInventory() {
    const inventoryDrawer = this.drawerManager.createDrawer(
      'left',
      { x: 20, y: 200 }, 
      { size: 350, icon: '🎒', title: 'Inventory' }
    );
    
    this.renderInventoryContent(
      this.drawerManager.getDrawerContainer(inventoryDrawer)
    );
  }
  
  renderInventoryContent(containerSelector) {
    const container = document.querySelector(containerSelector);
    container.innerHTML = `
      <div class="inventory-grid">
        <!-- Your inventory items here -->
      </div>
    `;
  }
}
```

### **3. Multi-Drawer Layout**
```javascript
class MultiDrawerGame {
  constructor() {
    this.drawerManager = new DrawerManager();
    this.setupAllDrawers();
  }
  
  setupAllDrawers() {
    // Achievements on right
    this.achievementDrawer = this.drawerManager.createDrawer(
      'right', { x: 20, y: 100 }, { icon: '🏆' }
    );
    
    // Inventory on left  
    this.inventoryDrawer = this.drawerManager.createDrawer(
      'left', { x: 20, y: 200 }, { icon: '🎒' }
    );
    
    // Stats on top
    this.statsDrawer = this.drawerManager.createDrawer(
      'top', { x: 300, y: 20 }, { icon: '📊', size: 250 }
    );
    
    // Settings on bottom
    this.settingsDrawer = this.drawerManager.createDrawer(
      'bottom', { x: 600, y: 20 }, { icon: '⚙️', size: 200 }
    );
  }
}
```

### **4. Dynamic Content Updates**
```javascript
class DynamicStatsDrawer {
  constructor(drawerManager) {
    this.drawerManager = drawerManager;
    this.stats = { level: 1, exp: 0, health: 100 };
    this.setupStatsDrawer();
    this.startStatsUpdates();
  }
  
  setupStatsDrawer() {
    this.statsDrawer = this.drawerManager.createDrawer(
      'top', { x: 300, y: 20 }, { icon: '📊', size: 200 }
    );
    this.updateStatsDisplay();
  }
  
  updateStatsDisplay() {
    const container = document.querySelector(
      this.drawerManager.getDrawerContainer(this.statsDrawer)
    );
    
    container.innerHTML = `
      <div>
        <h3>Player Stats</h3>
        <div>Level: ${this.stats.level}</div>
        <div>Experience: ${this.stats.exp}</div>
        <div>Health: ${this.stats.health}/100</div>
      </div>
    `;
  }
  
  startStatsUpdates() {
    setInterval(() => {
      this.stats.exp += Math.floor(Math.random() * 10);
      this.updateStatsDisplay();
    }, 2000);
  }
}
```

---

## 🎨 **Styling & Themes**

### **CSS Variables for Easy Theming**
```css
:root {
  --drawer-background: linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95));
  --drawer-border-color: rgba(255, 255, 255, 0.2);
  --drawer-icon-background: rgba(255, 255, 255, 0.2);
  --drawer-icon-hover: rgba(72, 219, 251, 0.3);
  --drawer-text-color: white;
  --drawer-transition-speed: 300ms;
}
```

### **Pre-built Theme Classes**
```css
/* Achievement theme */
.drawer-theme-achievement {
  --drawer-background: linear-gradient(135deg, rgba(72, 219, 251, 0.95), rgba(10, 189, 227, 0.95));
}

/* Inventory theme */
.drawer-theme-inventory {
  --drawer-background: linear-gradient(135deg, rgba(253, 203, 110, 0.95), rgba(230, 126, 34, 0.95));
}

/* Stats theme */
.drawer-theme-stats {
  --drawer-background: linear-gradient(135deg, rgba(0, 184, 148, 0.95), rgba(0, 160, 133, 0.95));
}
```

### **Apply Themes**
```javascript
const drawerId = drawerManager.createDrawer('right', {x: 20, y: 100});
const container = document.querySelector(`#${drawerId}-container`);
container.classList.add('drawer-theme-achievement');
```

---

## ⚙️ **Configuration Options**

### **Drawer Manager Options**
```javascript
const drawerManager = new DrawerManager({
  enableDebugLogs: true,        // Enable console logging
  defaultAnimationDuration: 500, // Slower animations
  defaultDrawerSize: 500,       // Larger default size
  iconSize: 60,                 // Bigger icons
  zIndexBase: 2000             // Higher z-index layer
});
```

### **Individual Drawer Options**
```javascript
const drawerId = drawerManager.createDrawer('left', {x: 50, y: 150}, {
  size: 400,                    // Drawer width/height
  animationDuration: 250,       // Custom animation speed
  icon: '🎮',                   // Custom icon
  title: 'Game Menu',          // Drawer title
  closeOnClickOutside: false,   // Disable click-outside-to-close
  enableResize: false          // Future: allow resizing
});
```

---

## 🔧 **Advanced Features**

### **Event Handling**
```javascript
// Listen for drawer state changes
const originalToggle = drawerManager.toggleDrawer;
drawerManager.toggleDrawer = function(drawerId) {
  const wasOpen = this.getDrawerState(drawerId)?.isOpen || false;
  const result = originalToggle.call(this, drawerId);
  
  if (result !== wasOpen) {
    console.log(`Drawer ${drawerId} ${result ? 'opened' : 'closed'}`);
    // Your custom logic here
  }
  
  return result;
};
```

### **Responsive Drawer Sizes**
```javascript
function createResponsiveDrawer(side, position) {
  const isMobile = window.innerWidth <= 768;
  const size = isMobile ? 
    (side === 'left' || side === 'right' ? 280 : 200) :
    (side === 'left' || side === 'right' ? 400 : 300);
    
  return drawerManager.createDrawer(side, position, { size });
}
```

### **Drawer Coordination**
```javascript
class CoordinatedDrawers {
  constructor() {
    this.drawerManager = new DrawerManager();
    this.activeDrawer = null;
  }
  
  openExclusiveDrawer(drawerId) {
    // Close any currently open drawer
    if (this.activeDrawer && this.activeDrawer !== drawerId) {
      this.drawerManager.closeDrawer(this.activeDrawer);
    }
    
    // Open the requested drawer
    this.drawerManager.openDrawer(drawerId);
    this.activeDrawer = drawerId;
  }
}
```

---

## 📱 **Responsive Design**

### **Mobile Adaptations**
The drawer system automatically adapts for mobile devices:

- **Left/Right drawers:** Max width 90vw on mobile, 95vw on small screens
- **Top/Bottom drawers:** Max height 80vh on mobile, 75vh on small screens  
- **Icons:** Smaller sizes on mobile (45px → 40px)
- **Touch-friendly:** Larger touch targets and appropriate spacing

### **Custom Mobile Behavior**
```javascript
function createMobileOptimizedDrawer(side, position) {
  const isMobile = window.innerWidth <= 768;
  
  return drawerManager.createDrawer(side, position, {
    size: isMobile ? 300 : 450,
    closeOnClickOutside: !isMobile, // Keep open on mobile
    animationDuration: isMobile ? 200 : 300
  });
}
```

---

## 🎯 **Integration Patterns**

### **With Vanilla JS Game Framework**
```javascript
class VanillaGameWithDrawers {
  constructor() {
    this.gameState = {};
    this.drawerManager = new DrawerManager();
    this.setupGameDrawers();
  }
  
  setupGameDrawers() {
    // Game menu drawer
    this.menuDrawer = this.drawerManager.createDrawer(
      'left', {x: 20, y: 50}, {icon: '🎮', size: 300}
    );
    
    // Achievement drawer
    this.achievementDrawer = this.drawerManager.createDrawer(
      'right', {x: 20, y: 100}, {icon: '🏆', size: 400}
    );
    
    this.renderGameMenuContent();
    this.setupAchievementSystem();
  }
}
```

### **With Your Ice Cream Fighter Pattern**
```javascript
class IceCreamFighterWithDrawers extends IceCreamFighter {
  constructor() {
    super();
    this.drawerManager = new DrawerManager({enableDebugLogs: true});
    this.setupGameDrawers();
  }
  
  setupGameDrawers() {
    // Achievement drawer
    this.achievementDrawerId = this.drawerManager.createDrawer(
      'right', {x: 20, y: 100}, {icon: '🏆', size: 450}
    );
    
    // Override achievement initialization to use drawer
    const originalSetup = this.setupAchievements.bind(this);
    this.setupAchievements = async function() {
      this.achievementManager = new AchievementManager(this);
      await this.achievementManager.loadAchievementConfig('achievements.json');
      
      // Initialize in drawer instead of fixed container
      this.achievementManager.initializeAchievements(
        this.drawerManager.getDrawerContainer(this.achievementDrawerId),
        this.achievements
      );
    };
  }
}
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Drawer not appearing**
```javascript
// ❌ Wrong - invalid side parameter
drawerManager.createDrawer('middle', {x: 100, y: 100}); // Throws error

// ✅ Correct - valid side
drawerManager.createDrawer('right', {x: 100, y: 100});
```

**Content not rendering**
```javascript
// ❌ Wrong - using wrong selector
mySystem.render('#wrong-selector');

// ✅ Correct - use getDrawerContainer
const container = drawerManager.getDrawerContainer(drawerId);
mySystem.render(container);
```

**Icon positioning issues**
```javascript
// ❌ Wrong - negative or invalid coordinates
drawerManager.createDrawer('left', {x: -10, y: 100}); // May cause issues

// ✅ Correct - positive coordinates within viewport
drawerManager.createDrawer('left', {x: 20, y: 100});
```

**Z-index conflicts**
```javascript
// If drawers appear behind other elements
const drawerManager = new DrawerManager({
  zIndexBase: 10000 // Increase base z-index
});
```

### **Debug Mode**
```javascript
const drawerManager = new DrawerManager({
  enableDebugLogs: true // Enable console logging
});

// Check drawer states
console.log(drawerManager.getAllDrawers());

// Verify container exists
const container = drawerManager.getDrawerContainer(drawerId);
console.log('Container:', document.querySelector(container));
```

---

## 🚀 **Performance Tips**

### **Efficient Content Updates**
```javascript
// ❌ Avoid - Rebuilding entire content frequently
setInterval(() => {
  container.innerHTML = generateAllContent();
}, 100);

// ✅ Better - Update only changed elements
function updateSpecificStats(newStats) {
  document.querySelector('#level-display').textContent = newStats.level;
  document.querySelector('#exp-display').textContent = newStats.exp;
}
```

### **Memory Management**
```javascript
class ManagedDrawerSystem {
  constructor() {
    this.drawerManager = new DrawerManager();
    this.activeDrawers = new Set();
  }
  
  createDrawer(side, position, options) {
    const id = this.drawerManager.createDrawer(side, position, options);
    this.activeDrawers.add(id);
    return id;
  }
  
  cleanup() {
    // Remove all drawers when cleaning up
    this.activeDrawers.forEach(id => {
      this.drawerManager.removeDrawer(id);
    });
    this.activeDrawers.clear();
  }
}
```

---

## 📄 **Browser Support**

- ✅ **Chrome 60+**
- ✅ **Firefox 55+**
- ✅ **Safari 12+**
- ✅ **Edge 79+**
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

**Features used:**
- ES6 Classes and Map
- CSS Grid and Flexbox
- CSS Custom Properties (Variables)
- CSS Transforms and Transitions
- Backdrop Filter (with fallbacks)

---

## 🔮 **Future Enhancements**

### **Planned Features:**
- [ ] Drawer resizing functionality
- [ ] Keyboard navigation support
- [ ] Drawer groups and tabs
- [ ] Minimize/maximize states
- [ ] Drawer docking and undocking
- [ ] Custom animation easing functions
- [ ] Touch gestures for mobile

### **Extending the System:**
```javascript
// Example: Add custom drawer type
class CustomDrawerManager extends DrawerManager {
  createModalDrawer(content, options = {}) {
    const drawerId = this.createDrawer('top', {x: 0, y: 0}, {
      size: window.innerHeight,
      closeOnClickOutside: true,
      ...options
    });
    
    // Add modal-specific styling
    const container = document.querySelector(`#${drawerId}-container`);
    container.style.width = '100vw';
    container.style.left = '0';
    
    return drawerId;
  }
}
```

---

## 📊 **API Reference Summary**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createDrawer()` | side, position, options | string | Create new drawer |
| `getDrawerContainer()` | drawerId | string | Get container selector |
| `openDrawer()` | drawerId | boolean | Open specific drawer |
| `closeDrawer()` | drawerId | boolean | Close specific drawer |
| `toggleDrawer()` | drawerId | boolean | Toggle drawer state |
| `removeDrawer()` | drawerId | boolean | Remove drawer completely |
| `getDrawerState()` | drawerId | object | Get drawer state |
| `getAllDrawers()` | none | array | Get all drawer states |
| `closeAllDrawers()` | none | void | Close all open drawers |

---

## 🎮 **Example Games Using This System**

- **Ice Cream Fighter** - Achievement drawer integration
- **[Your Next Game]** - Ready for any content type!

---

**Built with ❤️ for flexible, reusable game UI development**

Perfect companion to the Achievement System and any other game components!