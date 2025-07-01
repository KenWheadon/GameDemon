# GameState System

A powerful, flexible state management system for web-based games built with vanilla JavaScript. Features nested state access, change tracking, watchers, schema validation, and seamless game integration.

![GameState System Demo](demo-screenshot.png)

## 🚀 **Quick Start**

```javascript
// 1. Include the files
<link rel="stylesheet" href="gamestate.css">
<script src="GameState.js"></script>
<script src="GameStateManager.js"></script>

// 2. Initialize basic state
const gameState = new GameState({
  storageKey: 'mygame-save',
  autoSave: true
});

// 3. Set initial values
gameState.set('player.health', 100);
gameState.set('player.score', 0);

// 4. Use in your game
function damagePlayer(amount) {
  const currentHealth = gameState.get('player.health');
  const newHealth = Math.max(0, currentHealth - amount);
  gameState.set('player.health', newHealth);

  if (newHealth <= 0) {
    gameOver();
  }
}

// 5. Watch for changes
gameState.watch('player.score', (newScore, oldScore) => {
  updateScoreDisplay(newScore);
});
```

## 📁 **File Structure**

```
gamestate-system/
├── GameState.js          // Core reusable class
├── GameStateManager.js   // Game integration class
├── gamestate.css         // UI components and inspector styling
├── gamestate-test.html   // Test/demo page
└── README-gamestate.md   // This file
```

## 🏗️ **Architecture**

### **Two-Class System:**

- **`GameState`** - Reusable state management core (build once, use everywhere)
- **`GameStateManager`** - Game-specific integration with schema validation and advanced features

### **Benefits:**

✅ **Drop-in ready** for any game framework  
✅ **Consistent API** across all your games  
✅ **Clean separation** of concerns  
✅ **Production-ready** with error handling and fail-safes

---

## 📊 **Core Concepts**

### **State Structure**

The state is a nested JavaScript object with dot notation access:

```javascript
const state = {
  player: {
    health: 100,
    inventory: ["sword", "shield"],
    position: { x: 0, y: 0 },
  },
  game: {
    level: 1,
    score: 0,
  },
  settings: {
    soundEnabled: true,
  },
};
```

### **Paths & Dot Notation**

Access nested values with simple dot notation:

```javascript
gameState.get("player.health"); // 100
gameState.get("player.inventory.0"); // "sword"
gameState.get("player.position.x"); // 0
```

### **Change Tracking**

Every state change is tracked with:

- Timestamp
- Old value
- New value
- Path that changed

### **Watchers**

Subscribe to state changes at specific paths:

```javascript
// Watch a specific path
const unwatch = gameState.watch("player.health", (newValue, oldValue) => {
  console.log(`Health changed from ${oldValue} to ${newValue}`);
  updateHealthBar(newValue);
});

// Later, unsubscribe
unwatch();
```

### **Persistence**

Automatically save and load state:

```javascript
// Auto-saves every 30 seconds
gameState.options.autoSave = true;

// Manual save/load
gameState.saveState();
gameState.loadState();

// Custom storage keys
gameState.saveState("checkpoint-boss1");
gameState.loadState("checkpoint-boss1");
```

---

## 🎮 **API Documentation**

## **GameState Class** (Reusable Core)

### **Constructor**

```javascript
new GameState((options = {}));
```

**Options:**

```javascript
{
  autoSave: true,                 // Auto-save state
  saveInterval: 30000,            // 30 seconds
  storageKey: 'gamestate',        // localStorage key
  versionKey: 'gamestate-version',// Version key
  stateVersion: '1.0.0',          // State version
  maxHistory: 50,                 // Max history entries
  enableDebugLogs: false,         // Console logging
  enableChangeTracking: true,     // Track state changes
  enableEventSystem: true,        // Dispatch events
  validateOnLoad: true,           // Validate loaded state
  allowNull: true,                // Allow null values
  deepClone: true                 // Deep clone values
}
```

### **Core Methods**

#### **`get(path, defaultValue)`**

Get a value by path

```javascript
const health = gameState.get("player.health", 100);
const inventory = gameState.get("player.inventory", []);
```

#### **`set(path, value, silent = false)`**

Set a value by path

```javascript
gameState.set("player.health", 80);
gameState.set("game.isPaused", true);
gameState.set("player.position", { x: 10, y: 20 });
```

#### **`has(path)`**

Check if a path exists

```javascript
if (gameState.has("player.inventory")) {
  // Player has an inventory
}
```

#### **`delete(path, silent = false)`**

Delete a path

```javascript
gameState.delete("player.temporary");
```

#### **`increment(path, amount = 1)`**

Increment a numeric value

```javascript
gameState.increment("game.score", 10);
gameState.increment("player.level"); // +1
```

#### **`decrement(path, amount = 1)`**

Decrement a numeric value

```javascript
gameState.decrement("player.health", 5);
gameState.decrement("player.lives"); // -1
```

#### **`toggle(path)`**

Toggle a boolean value

```javascript
gameState.toggle("game.isPaused");
gameState.toggle("settings.soundEnabled");
```

#### **`addToArray(path, item, unique = false)`**

Add an item to an array

```javascript
gameState.addToArray("player.inventory", "potion");
gameState.addToArray("player.achievements", "boss-killer", true); // Only if not already present
```

#### **`removeFromArray(path, item)`**

Remove an item from an array

```javascript
gameState.removeFromArray("player.inventory", "potion");
gameState.removeFromArray("enemies", (enemy) => enemy.health <= 0); // With predicate function
```

#### **`merge(obj, deep = true)`**

Merge an object into the state

```javascript
gameState.merge({
  player: {
    buffs: { strength: 5 },
  },
});
```

#### **`watch(path, callback)`**

Watch for changes to a path

```javascript
const unwatch = gameState.watch("player.health", (newVal, oldVal, path) => {
  console.log(`Health changed from ${oldVal} to ${newVal}`);
});

// Stop watching
unwatch();
```

#### **`saveState(customKey = null)` / `loadState(customKey = null)`**

Save/load state to localStorage

```javascript
gameState.saveState();
gameState.loadState();

// With custom key
gameState.saveState("checkpoint1");
gameState.loadState("checkpoint1");
```

#### **`reset(customDefaults = null)`**

Reset state to defaults

```javascript
gameState.reset();

// With custom defaults
gameState.reset({ player: { health: 100 } });
```

#### **`getState()` / `setState(newState, silent = false)`**

Get/set the entire state

```javascript
const fullState = gameState.getState();
gameState.setState(newState);
```

#### **`setDefaultState(defaultState)`**

Set default state for resets

```javascript
gameState.setDefaultState({
  player: { health: 100, score: 0 },
  settings: { soundEnabled: true },
});
```

#### **`getMetadata()` / `getHistory()`**

Get state metadata and change history

```javascript
const metadata = gameState.getMetadata();
const history = gameState.getHistory();
```

#### **`clearHistory()`**

Clear change history

```javascript
gameState.clearHistory();
```

#### **`startAutoSave()` / `stopAutoSave()`**

Control automatic saving

```javascript
gameState.startAutoSave();
gameState.stopAutoSave();
```

#### **`destroy()`**

Clean up resources

```javascript
gameState.destroy();
```

## **GameStateManager Class** (Game Integration)

### **Constructor**

```javascript
new GameStateManager(gameInstance, (options = {}));
```

**Parameters:**

- `gameInstance` - Reference to your main game object
- `options` - Configuration object

**Options:**

```javascript
{
  enableDebugLogs: false,          // Console logging
  enableSchemaValidation: true,    // Validate against schema
  enableGameIntegration: true,     // Integrate with game
  enablePerformanceTracking: false,// Track performance
  autoBackup: true,                // Auto-backup state
  backupInterval: 300000,          // 5 minutes
  maxBackups: 5                    // Max backups to keep
}
```

### **Schema Definition**

```javascript
manager.defineSchema("player", {
  health: { type: "number", min: 0, max: 100, default: 100 },
  name: { type: "string", maxLength: 50, default: "Player" },
  inventory: { type: "array", default: [] },
  isPremium: { type: "boolean", default: false },
  difficulty: {
    type: "string",
    enum: ["easy", "normal", "hard"],
    default: "normal",
  },
});
```

### **Advanced Features**

#### **`addValidator(path, validator)`**

Add custom validation

```javascript
manager.addValidator("player.name", (value) => {
  if (value.includes("admin")) {
    return "Name cannot include admin";
  }
  return true; // valid
});
```

#### **`addTransformer(path, transformer)`**

Transform values before storage

```javascript
manager.addTransformer("player.name", (value) => {
  return value.trim();
});
```

#### **`createBackup()` / `restoreBackup(backupId)`**

Manage state backups

```javascript
const backupId = manager.createBackup();
manager.restoreBackup(backupId);
```

#### **`getBackups()` / `getStats()`**

Get backup information and statistics

```javascript
const backups = manager.getBackups();
const stats = manager.getStats();
```

#### **`exportState(includeMetadata = true)` / `importState(importData, merge = false)`**

Import/export state data

```javascript
const exportData = manager.exportState();
manager.importState(importData);
```

---

## 🎯 **Integration Examples**

### **Basic Integration**

```javascript
// Initialize the state system
const gameState = new GameState({
  storageKey: "mygame-save",
});

// Use in game code
function updatePlayer() {
  const health = gameState.get("player.health", 100);
  const position = gameState.get("player.position", { x: 0, y: 0 });

  // Update player object
  player.health = health;
  player.x = position.x;
  player.y = position.y;
}

function savePlayerState() {
  gameState.set("player.health", player.health);
  gameState.set("player.position", { x: player.x, y: player.y });
  gameState.saveState();
}
```

### **With GameStateManager**

```javascript
class MyGame {
  constructor() {
    this.player = { health: 100, score: 0 };
    this.setupState();
  }

  setupState() {
    this.stateManager = new GameStateManager(this);

    // Define schema
    this.stateManager.defineSchema("player", {
      health: { type: "number", min: 0, max: 100, default: 100 },
      score: { type: "number", min: 0, default: 0 },
    });

    // Add validators
    this.stateManager.addValidator("player.name", (value) => {
      return value.length >= 3 || "Name must be at least 3 characters";
    });

    // Load state (auto-validated against schema)
    this.stateManager.load();
  }

  damagePlayer(amount) {
    // Use state directly through game reference
    this.state.decrement("player.health", amount);

    if (this.state.get("player.health") <= 0) {
      this.gameOver();
    }
  }

  onLevelComplete() {
    // Create backup at key points
    this.stateManager.createBackup();
    this.state.increment("game.level");
  }
}
```

### **With Watch Patterns**

```javascript
// Observer pattern for UI updates
gameState.watch("player.health", (newHealth, oldHealth) => {
  // Update health bar
  updateHealthBar(newHealth, oldHealth);

  // Play effects if damaged
  if (newHealth < oldHealth) {
    playDamageEffect();
  }
});

// Wildcard pattern for inventory changes
gameState.watch("player.inventory.*", (newValue, oldValue, path) => {
  const itemName = path.split(".").pop();
  console.log(`Inventory item ${itemName} changed`);
  refreshInventoryUI();
});
```

---

## ⚙️ **Advanced Features**

### **Event System**

The state system dispatches events you can listen for:

```javascript
// Listen for state changes
document.addEventListener("gamestate:changed", (event) => {
  const { path, newValue, oldValue } = event.detail;
  console.log(`State changed: ${path}`);
});

// Other events
document.addEventListener("gamestate:saved", handleSaved);
document.addEventListener("gamestate:loaded", handleLoaded);
document.addEventListener("gamestate:reset", handleReset);
document.addEventListener("gamestate:error", handleError);
```

### **Deep Cloning**

By default, the system deep clones all values to prevent unintended references:

```javascript
// This won't affect the state
const position = gameState.get("player.position");
position.x = 100; // State is unchanged

// This will update the state
gameState.set("player.position.x", 100);
```

### **State Inspector UI**

The included developer UI provides real-time state inspection:

```javascript
// Enable the inspector in development builds
const inspector = new GameStateInspector(gameState);
inspector.show();
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

**State not persisting between sessions**

```javascript
// Check storage key and version
gameState.options.storageKey = "your-unique-game-key";
gameState.options.stateVersion = "1.0.0";

// Manually save before unload
window.addEventListener("beforeunload", () => {
  gameState.saveState();
});
```

**Unable to update arrays/objects**

```javascript
// ❌ Wrong - get returns a clone
const inventory = gameState.get("player.inventory");
inventory.push("potion"); // Doesn't affect state

// ✅ Correct - use dedicated methods
gameState.addToArray("player.inventory", "potion");

// ✅ Correct - get, modify, set
const inventory = gameState.get("player.inventory");
const updatedInventory = [...inventory, "potion"];
gameState.set("player.inventory", updatedInventory);
```

**Performance issues with deep state**

```javascript
// Disable deep cloning for performance (be careful!)
gameState.options.deepClone = false;

// Watch only what you need
const unwatch = gameState.watch("player.position", updatePlayerPosition);
// Later when not needed
unwatch();

// Use silent operations for batch updates
gameState.set("player.position.x", x, true); // silent = true
gameState.set("player.position.y", y, true); // silent = true
gameState.set("player.position.z", z); // Only this triggers watchers
```

### **Debug Mode**

```javascript
// Enable debug logging
gameState.options.enableDebugLogs = true;

// Check state history
console.table(gameState.getHistory());

// Check metadata
console.log(gameState.getMetadata());
```

---

## 📱 **Browser Support**

- ✅ **Chrome 60+**
- ✅ **Firefox 55+**
- ✅ **Safari 12+**
- ✅ **Edge 79+**
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

**Features used:**

- ES6 Classes and features
- localStorage for persistence
- Custom Events API
- Deep object operations

---

## 🔮 **Best Practices**

### **State Organization**

```javascript
// Organize by domain
gameState.set("player.stats.strength", 10);
gameState.set("player.equipment.weapon", "sword");
gameState.set("game.settings.difficulty", "hard");
gameState.set("ui.dialog.isOpen", true);
```

### **Derived State**

```javascript
// Compute derived state instead of storing it
function getPlayerMaxHealth() {
  const baseHealth = gameState.get("player.stats.vitality", 10) * 10;
  const bonus = gameState.get("player.bonuses.health", 0);
  return baseHealth + bonus;
}
```

### **State Snapshots**

```javascript
// Create snapshots at important moments
function enterNewLevel() {
  // Save current state with descriptive key
  gameState.saveState(`level-${currentLevel}`);
}
```

### **Performance Tips**

```javascript
// Batch updates to minimize change notifications
function updatePlayerPosition(x, y, z) {
  // Silent updates
  gameState.set("player.position.x", x, true);
  gameState.set("player.position.y", y, true);
  gameState.set("player.position.z", z); // Only this triggers watchers
}
```

---

## 📄 **License**

This state management system is part of the GameDemon toolkit. Use freely in your own projects.

---

**Built with ❤️ for fast, reusable game development**
