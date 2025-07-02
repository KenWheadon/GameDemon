# Inventory System - GameDemon Toolkit

A comprehensive, feature-rich inventory management system for web-based games built with vanilla JavaScript. Supports drag-and-drop, item stacking, durability, rarity systems, and seamless integration with the GameDemon framework.

![Inventory System Demo](inventory-demo.png)

## 🚀 **Quick Start**

```javascript
// 1. Include the files
<link rel="stylesheet" href="inventory.css">
<script src="InventoryItem.js"></script>
<script src="InventoryManager.js"></script>

// 2. Initialize the inventory system
const game = { gameId: 'my-game' };
const inventory = new InventoryManager(game, {
  maxSlots: 40,
  enableDragDrop: true,
  autoStack: true
});

// 3. Add items
inventory.addItem('health_potion', 5);
inventory.addItem('iron_sword');

// 4. Show inventory UI
inventory.show();
```

## 📁 **File Structure**

```
inventory-system/
├── InventoryItem.js       // Core item class with properties and behaviors
├── InventoryManager.js    // Main inventory management system
├── inventory.css          // Complete responsive styling
├── inventory-test.html    // Interactive test/demo page
└── README-inventory.md    // This documentation
```

## 🏗️ **Architecture Overview**

### **Two-Class Design Pattern**

Following the GameDemon framework architecture:

- **`InventoryItem`** - Reusable item class with properties, behaviors, and interactions
- **`InventoryManager`** - Game integration with UI management and system coordination

### **Key Features**

✅ **Drag & Drop Interface** - Intuitive item management  
✅ **Item Stacking** - Automatic and manual stack management  
✅ **Rarity System** - Visual rarity indicators with animations  
✅ **Durability System** - Item condition tracking  
✅ **Search & Filtering** - Real-time inventory organization  
✅ **Context Menus** - Right-click item interactions  
✅ **Keyboard Navigation** - Full accessibility support  
✅ **Bulk Operations** - Multi-select item management  
✅ **Mobile Responsive** - Touch-friendly interface  
✅ **GameState Integration** - Automatic save/load  
✅ **Achievement Integration** - Collection milestone tracking  
✅ **Audio Integration** - Sound effects for actions

---

## 🎯 **Core Concepts**

### **Items and Properties**

Every item has comprehensive properties:

```javascript
const item = new InventoryItem({
  // Basic properties
  name: "Legendary Sword",
  description: "A sword of immense power",
  type: "weapon",
  rarity: "legendary",
  icon: "legendary-sword.png",

  // Value and trading
  value: 1000,
  tradeable: true,

  // Stacking
  stackable: false,
  maxStackSize: 1,
  quantity: 1,

  // Durability
  durability: 100,
  maxDurability: 100,
  repairable: true,

  // Stats and effects
  stats: { attack: 50, speed: 10 },
  effects: [{ type: "fire_damage", amount: 10 }],

  // State
  equipped: false,
  locked: false,
  favorite: false,
});
```

### **Rarity System**

Items support multiple rarity levels with visual effects:

- **Common** - White border, no effects
- **Uncommon** - Green border, subtle glow
- **Rare** - Blue border, glow effect
- **Epic** - Purple border, enhanced glow
- **Legendary** - Orange border, animated glow
- **Artifact** - Gold border, special animation

### **Slot-Based Grid System**

The inventory uses a configurable slot-based grid:

```javascript
const inventory = new InventoryManager(game, {
  maxSlots: 40, // Total available slots
  columns: 8, // Grid columns (auto-calculated)
  autoSort: false, // Automatic sorting
  autoStack: true, // Automatic item stacking
});
```

---

## 📋 **API Documentation**

## **InventoryItem Class**

### **Constructor**

```javascript
new InventoryItem(itemData, options);
```

**Parameters:**

- `itemData` (Object) - Item properties
- `options` (Object) - Configuration options

### **Core Methods**

#### **`canStackWith(otherItem)`**

Check if this item can stack with another item

```javascript
const canStack = item1.canStackWith(item2);
```

#### **`stackWith(otherItem)`**

Attempt to stack with another item

```javascript
const remaining = item1.stackWith(item2);
// Returns number of items that couldn't be stacked
```

#### **`split(amount)`**

Split item into multiple stacks

```javascript
const newStack = item.split(5);
// Creates new item with 5 quantity, reduces original by 5
```

#### **`use(amount)`**

Use/consume the item

```javascript
const success = item.use(1);
// Returns true if item was used successfully
```

#### **`repair(amount)`**

Repair item durability

```javascript
const success = item.repair(); // Full repair
const success = item.repair(25); // Repair 25 durability
```

#### **`getEffectiveStats()`**

Get stats modified by quality/durability

```javascript
const stats = item.getEffectiveStats();
// Returns stats object with modifiers applied
```

#### **`getTooltipData()`**

Get formatted tooltip information

```javascript
const tooltipData = item.getTooltipData();
// Returns comprehensive item information for UI display
```

#### **`clone()`**

Create a deep copy of the item

```javascript
const itemCopy = item.clone();
```

#### **`toJSON()` / `fromJSON(jsonData)`**

Serialize/deserialize for storage

```javascript
const jsonData = item.toJSON();
const item = InventoryItem.fromJSON(jsonData);
```

## **InventoryManager Class**

### **Constructor**

```javascript
new InventoryManager(gameInstance, options);
```

**Options:**

```javascript
{
  maxSlots: 40,                 // Maximum inventory slots
  columns: 8,                   // Grid columns
  enableDragDrop: true,         // Drag and drop functionality
  enableContextMenu: true,      // Right-click context menus
  enableTooltips: true,         // Item tooltips
  enableSorting: true,          // Sorting capabilities
  enableFiltering: true,        // Filtering system
  enableSearch: true,           // Search functionality
  autoSort: false,              // Automatic sorting
  autoStack: true,              // Automatic stacking
  saveToGameState: true,        // GameState integration
  gameStateKey: 'inventory',    // GameState storage key
  enableSounds: true,           // Audio integration
  enableAnimations: true,       // UI animations
  enableKeyboardShortcuts: true,// Keyboard navigation
  enableBulkOperations: true,   // Multi-select operations
  storageKey: 'inventory-data', // localStorage key
  enableDebugLogs: false        // Debug logging
}
```

### **Item Management Methods**

#### **`addItem(item, quantity, preferredSlot)`**

Add item to inventory

```javascript
// Add item from template
const success = inventory.addItem('health_potion', 5);

// Add item instance
const item = new InventoryItem({...});
const success = inventory.addItem(item);

// Add to specific slot
const success = inventory.addItem('iron_sword', 1, 10);
```

#### **`removeItem(slotIndex, quantity)`**

Remove item from inventory

```javascript
// Remove entire stack
const removedItem = inventory.removeItem(5);

// Remove specific quantity
const removedItem = inventory.removeItem(5, 3);
```

#### **`moveItem(fromSlot, toSlot, quantity)`**

Move item between slots

```javascript
// Move entire stack
const success = inventory.moveItem(0, 5);

// Move partial stack
const success = inventory.moveItem(0, 5, 3);
```

#### **`useItem(slotIndex, quantity)`**

Use item from inventory

```javascript
const success = inventory.useItem(3); // Use 1
const success = inventory.useItem(3, 2); // Use 2
```

### **Item Templates**

#### **`addItemTemplate(templateId, template)`**

Add item template for creation

```javascript
inventory.addItemTemplate("magic_potion", {
  name: "Magic Potion",
  description: "Restores mana",
  type: "consumable",
  rarity: "uncommon",
  value: 25,
  stackable: true,
  maxStackSize: 10,
  effects: [{ type: "restore_mana", amount: 100 }],
});
```

#### **`createItem(templateId, overrides)`**

Create item from template

```javascript
const item = inventory.createItem("magic_potion", {
  quantity: 5,
  quality: 85,
});
```

### **Organization Methods**

#### **`sortInventory(sortBy, ascending)`**

Sort inventory contents

```javascript
inventory.sortInventory("name", true); // A-Z by name
inventory.sortInventory("rarity", false); // Rarest first
inventory.sortInventory("value", false); // Most valuable first
inventory.sortInventory("type", true); // By item type
```

#### **`filterInventory(filter)`**

Filter inventory display

```javascript
inventory.filterInventory("weapon"); // Show only weapons
inventory.filterInventory("consumable"); // Show only consumables
inventory.filterInventory("equipped"); // Show only equipped items
inventory.filterInventory("all"); // Show all items
```

#### **`searchInventory(query)`**

Search inventory items

```javascript
inventory.searchInventory("sword"); // Find items containing 'sword'
inventory.searchInventory(""); // Clear search
```

### **Query Methods**

#### **`findItems(criteria)`**

Find items matching criteria

```javascript
// Find all weapons
const weapons = inventory.findItems({ type: "weapon" });

// Find valuable items
const valuable = inventory.findItems({ minValue: 100 });

// Find items by name
const swords = inventory.findItems({ name: "sword" });

// Results format: [{ item, slot }, ...]
```

#### **`findEmptySlot()`**

Find first available slot

```javascript
const slotIndex = inventory.findEmptySlot();
// Returns slot index or -1 if full
```

#### **`getStats()`**

Get comprehensive inventory statistics

```javascript
const stats = inventory.getStats();
/*
{
  totalSlots: 40,
  usedSlots: 25,
  emptySlots: 15,
  totalItems: 47,
  totalValue: 2350,
  itemsByType: { weapon: 5, armor: 3, consumable: 12 },
  itemsByRarity: { common: 20, rare: 5, legendary: 1 },
  averageItemValue: 50,
  mostValuableItem: InventoryItem,
  oldestItem: InventoryItem,
  newestItem: InventoryItem
}
*/
```

### **Storage Methods**

#### **`saveInventory()` / `loadInventory()`**

Manual save/load operations

```javascript
inventory.saveInventory(); // Save to localStorage and GameState
inventory.loadInventory(); // Load from storage
```

#### **`exportInventory()` / `importInventory(data)`**

Export/import inventory data

```javascript
const exportData = inventory.exportInventory();
const success = inventory.importInventory(exportData);
```

---

## 🎮 **Integration Examples**

### **Basic Game Integration**

```javascript
class MyGame {
  constructor() {
    this.setupInventory();
  }

  setupInventory() {
    this.inventory = new InventoryManager(this, {
      maxSlots: 30,
      saveToGameState: true,
    });

    // Add custom item templates
    this.inventory.addItemTemplate("healing_herb", {
      name: "Healing Herb",
      description: "A natural remedy",
      type: "consumable",
      rarity: "common",
      icon: "herb.png",
      value: 5,
      stackable: true,
      maxStackSize: 50,
      effects: [{ type: "heal", amount: 25 }],
    });

    // Set up event listeners
    this.setupInventoryEvents();
  }

  setupInventoryEvents() {
    document.addEventListener("inventory:item-used", (e) => {
      const { item, slot } = e.detail;
      this.handleItemUse(item);
    });

    document.addEventListener("inventory:full", () => {
      this.showMessage("Inventory is full!");
    });
  }

  handleItemUse(item) {
    // Apply item effects to player
    if (item.effects) {
      item.effects.forEach((effect) => {
        switch (effect.type) {
          case "heal":
            this.player.heal(effect.amount);
            break;
          case "restore_mana":
            this.player.restoreMana(effect.amount);
            break;
        }
      });
    }
  }

  onLoot(itemTemplateId, quantity = 1) {
    const success = this.inventory.addItem(itemTemplateId, quantity);
    if (success) {
      this.showMessage(`Found ${quantity}x ${itemTemplateId}!`);
    } else {
      this.showMessage("Inventory full - item dropped!");
    }
  }
}
```

### **Advanced RPG Integration**

```javascript
class RPGGame {
  constructor() {
    this.player = new Player();
    this.setupAdvancedInventory();
  }

  setupAdvancedInventory() {
    this.inventory = new InventoryManager(this, {
      maxSlots: 50,
      autoStack: true,
      enableBulkOperations: true,
    });

    // Define equipment categories
    this.equipmentSlots = {
      weapon: null,
      helmet: null,
      chest: null,
      legs: null,
      boots: null,
      ring1: null,
      ring2: null,
    };

    this.addRPGItemTemplates();
    this.setupEquipmentSystem();
  }

  addRPGItemTemplates() {
    // Weapons
    this.inventory.addItemTemplate("wooden_sword", {
      name: "Wooden Sword",
      type: "weapon",
      category: "sword",
      rarity: "common",
      value: 10,
      durability: 50,
      maxDurability: 50,
      stats: { attack: 8, speed: 5 },
      requirements: { level: 1 },
    });

    this.inventory.addItemTemplate("steel_sword", {
      name: "Steel Sword",
      type: "weapon",
      category: "sword",
      rarity: "uncommon",
      value: 100,
      durability: 120,
      maxDurability: 120,
      stats: { attack: 18, speed: 7 },
      requirements: { level: 5, strength: 15 },
    });

    // Armor
    this.inventory.addItemTemplate("leather_helmet", {
      name: "Leather Helmet",
      type: "armor",
      category: "helmet",
      rarity: "common",
      value: 25,
      durability: 80,
      maxDurability: 80,
      stats: { defense: 5, agility: -1 },
      requirements: { level: 2 },
    });

    // Consumables
    this.inventory.addItemTemplate("stamina_potion", {
      name: "Stamina Potion",
      type: "consumable",
      rarity: "common",
      value: 15,
      stackable: true,
      maxStackSize: 20,
      effects: [
        { type: "restore_stamina", amount: 50 },
        { type: "buff_speed", amount: 10, duration: 60000 },
      ],
    });
  }

  setupEquipmentSystem() {
    // Handle item equipping
    document.addEventListener("inventory:item-used", (e) => {
      const { item } = e.detail;

      if (item.type === "weapon" || item.type === "armor") {
        this.equipItem(item);
      } else if (item.type === "consumable") {
        this.consumeItem(item);
      }
    });
  }

  equipItem(item) {
    // Check requirements
    if (!this.meetsRequirements(item)) {
      this.showMessage(`You don't meet the requirements for ${item.name}`);
      return false;
    }

    const slot = item.category;

    // Unequip current item
    if (this.equipmentSlots[slot]) {
      this.unequipItem(this.equipmentSlots[slot]);
    }

    // Equip new item
    this.equipmentSlots[slot] = item;
    item.equipped = true;

    // Apply stat bonuses
    this.applyItemStats(item, 1);

    this.showMessage(`Equipped ${item.name}`);
    this.updatePlayerStats();
    return true;
  }

  unequipItem(item) {
    // Remove stat bonuses
    this.applyItemStats(item, -1);

    item.equipped = false;
    const slot = item.category;
    this.equipmentSlots[slot] = null;

    this.showMessage(`Unequipped ${item.name}`);
    this.updatePlayerStats();
  }

  applyItemStats(item, multiplier) {
    const stats = item.getEffectiveStats();
    Object.entries(stats).forEach(([stat, value]) => {
      this.player.modifyStat(stat, value * multiplier);
    });
  }

  meetsRequirements(item) {
    if (!item.requirements) return true;

    const reqs = item.requirements;
    const player = this.player;

    return (
      (!reqs.level || player.level >= reqs.level) &&
      (!reqs.strength || player.strength >= reqs.strength) &&
      (!reqs.agility || player.agility >= reqs.agility) &&
      (!reqs.intelligence || player.intelligence >= reqs.intelligence)
    );
  }

  consumeItem(item) {
    if (!item.effects) return;

    item.effects.forEach((effect) => {
      switch (effect.type) {
        case "heal":
          this.player.heal(effect.amount);
          break;
        case "restore_mana":
          this.player.restoreMana(effect.amount);
          break;
        case "restore_stamina":
          this.player.restoreStamina(effect.amount);
          break;
        case "buff_speed":
          this.player.addBuff("speed", effect.amount, effect.duration);
          break;
      }
    });
  }
}
```

---

## 🎨 **UI Customization**

### **CSS Variable Customization**

```css
:root {
  /* Primary colors */
  --inventory-primary-color: #your-brand-color;
  --inventory-secondary-color: #your-accent-color;

  /* Background colors */
  --inventory-background-primary: rgba(your-bg-color, 0.95);
  --inventory-background-slot: rgba(your-slot-color, 0.8);

  /* Slot sizing */
  --inventory-slot-size: 72px; /* Larger slots */
  --inventory-gap: 6px; /* More spacing */

  /* Rarity colors */
  --inventory-rarity-legendary: #your-legendary-color;
}
```

### **Custom Item Icons**

```javascript
// Override the icon display method
class CustomInventoryManager extends InventoryManager {
  getItemEmoji(type) {
    // Use actual image files or custom emojis
    const iconMap = {
      weapon: "⚔️",
      armor: "🛡️",
      consumable: "🧪",
      misc: "📦",
      quest: "📜",
    };

    return iconMap[type] || "📦";
  }
}
```

---

## ⚙️ **Advanced Configuration**

### **Custom Item Behaviors**

```javascript
// Create specialized item classes
class WeaponItem extends InventoryItem {
  constructor(itemData, options) {
    super(itemData, options);
    this.weaponType = itemData.weaponType || "melee";
    this.attackSpeed = itemData.attackSpeed || 1.0;
  }

  // Override use behavior for weapons
  use(amount = 1) {
    // Weapons are equipped, not consumed
    return this.equip();
  }

  equip() {
    if (this.equipped) {
      return this.unequip();
    }

    // Custom equip logic
    this.equipped = true;
    this.applyWeaponEffects();
    return true;
  }

  applyWeaponEffects() {
    // Apply weapon-specific effects
    if (this.effects) {
      this.effects.forEach((effect) => {
        // Handle weapon effects
      });
    }
  }
}
```

### **Performance Optimization**

```javascript
// Optimize for large inventories
const inventory = new InventoryManager(game, {
  // Disable expensive features for performance
  enableAnimations: false,
  enableTooltips: false,

  // Batch UI updates
  batchUpdates: true,
  updateInterval: 16, // 60fps update rate
});

// Custom performance monitoring
setInterval(() => {
  const stats = inventory.getPerformanceStats();
  if (stats.operationCount > 1000) {
    console.warn("High inventory operation count:", stats);
  }
}, 5000);
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Items not visible after adding**

```javascript
// Check if system is initialized
console.log("Initialized:", inventory.isInitialized);

// Check if items are actually added
console.log("Slots:", inventory.slots);

// Check if UI is being refreshed
inventory.refreshUI();

// Enable debug logging
inventory.options.enableDebugLogs = true;
```

**Items not stacking properly**

```javascript
// Check stacking criteria
const item1 = inventory.slots[0];
const item2 = inventory.slots[1];

console.log("Can stack:", item1.canStackWith(item2));
console.log("Item1 template:", item1.templateId);
console.log("Item2 template:", item2.templateId);
console.log("Item1 quality:", item1.quality);
console.log("Item2 quality:", item2.quality);
```

**Drag and drop not working**

```javascript
// Check if drag and drop is enabled
console.log("Drag/drop enabled:", inventory.options.enableDragDrop);

// Verify event listeners are attached
const slot = document.querySelector(".inventory-slot");
console.log("Has dragstart listener:", !!slot.ondragstart);
```

**Performance issues**

```javascript
// Monitor performance
const stats = inventory.getPerformanceStats();
console.log("Operations per second:", stats.operationCount);

// Optimize for large inventories
inventory.options.enableAnimations = false;
inventory.options.batchUpdates = true;
```

### **Debug Mode**

```javascript
// Enable comprehensive debugging
const inventory = new InventoryManager(game, {
  enableDebugLogs: true,
});

// Use debug method
const debug = inventory.debugInventory();
console.log("Debug info:", debug);

// Monitor all events
document.addEventListener("inventory:*", (e) => {
  console.log("Inventory event:", e.type, e.detail);
});
```

---

## 🔮 **Best Practices**

### **Performance Guidelines**

1. **Limit slot count** - More than 100 slots can impact performance
2. **Use object pooling** - Reuse item instances when possible
3. **Batch operations** - Group multiple changes together
4. **Optimize images** - Use compressed icons and textures
5. **Virtual scrolling** - For very large inventories

```javascript
// Good: Batch multiple operations
inventory.startBatch();
inventory.addItem("sword", 1);
inventory.addItem("potion", 5);
inventory.addItem("gold", 100);
inventory.endBatch(); // Single UI update

// Bad: Individual operations trigger UI updates
inventory.addItem("sword", 1); // UI update
inventory.addItem("potion", 5); // UI update
inventory.addItem("gold", 100); // UI update
```

### **Memory Management**

```javascript
// Properly dispose of items
class InventoryManager {
  removeItem(slotIndex, quantity) {
    const item = super.removeItem(slotIndex, quantity);

    if (item && item.quantity <= 0) {
      // Clean up item references
      item.dispose();
    }

    return item;
  }
}

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  inventory.destroy();
});
```

### **Accessibility Guidelines**

```javascript
// Ensure keyboard navigation works
inventory.options.enableKeyboardShortcuts = true;

// Add ARIA labels
const slot = document.querySelector(".inventory-slot");
slot.setAttribute("aria-label", `Inventory slot ${index + 1}`);
slot.setAttribute("role", "button");
slot.setAttribute("tabindex", "0");

// Support screen readers
if (item) {
  slot.setAttribute("aria-describedby", `item-${item.id}-description`);
}
```

### **Mobile Optimization**

```javascript
// Touch-friendly configuration
const mobileInventory = new InventoryManager(game, {
  // Larger touch targets
  slotSize: 60,
  gap: 8,

  // Disable hover-dependent features
  enableTooltips: false,
  enableContextMenu: false,

  // Touch gestures
  enableTouchGestures: true,
  longPressDuration: 500,
});

// Handle touch events
inventory.setupTouchHandlers();
```

---

## 🎯 **Event System**

### **Available Events**

The inventory system dispatches comprehensive events for integration:

```javascript
// Item Events
document.addEventListener("inventory:item-added", (e) => {
  const { item, slot, stacked } = e.detail;
  console.log(`Added ${item.name} to slot ${slot}`);
});

document.addEventListener("inventory:item-removed", (e) => {
  const { item, slot } = e.detail;
  console.log(`Removed ${item.name} from slot ${slot}`);
});

document.addEventListener("inventory:item-used", (e) => {
  const { item, slot, quantity } = e.detail;
  console.log(`Used ${quantity}x ${item.name}`);
});

document.addEventListener("inventory:item-moved", (e) => {
  const { fromSlot, toSlot, quantity } = e.detail;
  console.log(`Moved item from ${fromSlot} to ${toSlot}`);
});

// System Events
document.addEventListener("inventory:initialized", (e) => {
  console.log("Inventory system ready:", e.detail);
});

document.addEventListener("inventory:shown", () => {
  console.log("Inventory UI opened");
});

document.addEventListener("inventory:hidden", () => {
  console.log("Inventory UI closed");
});

// Organization Events
document.addEventListener("inventory:sorted", (e) => {
  const { sortBy, ascending } = e.detail;
  console.log(`Sorted by ${sortBy}, ascending: ${ascending}`);
});

document.addEventListener("inventory:filtered", (e) => {
  const { filter } = e.detail;
  console.log(`Filtered by: ${filter}`);
});

document.addEventListener("inventory:searched", (e) => {
  const { query } = e.detail;
  console.log(`Searched for: ${query}`);
});

// Storage Events
document.addEventListener("inventory:saved", (e) => {
  console.log("Inventory saved at:", e.detail.timestamp);
});

document.addEventListener("inventory:loaded", (e) => {
  console.log("Inventory loaded at:", e.detail.timestamp);
});

// Error Events
document.addEventListener("inventory:error", (e) => {
  const { error, operation, message } = e.detail;
  console.error(`Inventory error in ${operation}:`, message);
});

document.addEventListener("inventory:full", (e) => {
  const { item } = e.detail;
  console.warn(`Inventory full, cannot add ${item.name}`);
});
```

---

## 🔧 **Framework Integration**

### **GameState Integration**

```javascript
class GameStateIntegratedInventory extends InventoryManager {
  constructor(game, options = {}) {
    super(game, {
      saveToGameState: true,
      gameStateKey: "player.inventory",
      ...options,
    });
  }

  // Automatic state synchronization
  setupGameStateIntegration() {
    super.setupGameStateIntegration();

    // Watch for player level changes
    this.game.state.watch("player.level", (newLevel) => {
      this.updateAvailableItems(newLevel);
    });

    // Watch for currency changes
    this.game.state.watch("player.gold", (newGold) => {
      this.updateShopAccess(newGold);
    });
  }
}
```

### **Achievement System Integration**

```javascript
// Define inventory-related achievements
const inventoryAchievements = {
  pack_rat: {
    name: "Pack Rat",
    description: "Collect 100 items",
    condition: (stats) => stats.totalItems >= 100,
  },
  wealthy_collector: {
    name: "Wealthy Collector",
    description: "Accumulate 10,000 gold worth of items",
    condition: (stats) => stats.totalValue >= 10000,
  },
  legendary_hunter: {
    name: "Legendary Hunter",
    description: "Find a legendary item",
    condition: (stats) => stats.itemsByRarity.legendary > 0,
  },
};

// Check achievements on inventory changes
class AchievementIntegratedInventory extends InventoryManager {
  checkAchievements() {
    if (!this.game.achievementManager) return;

    const stats = this.getStats();
    const achievements = this.game.achievementManager;

    Object.entries(inventoryAchievements).forEach(([id, achievement]) => {
      if (achievement.condition(stats)) {
        achievements.unlockAchievement(id);
      }
    });
  }
}
```

### **Audio Manager Integration**

```javascript
// Audio feedback for inventory actions
class AudioIntegratedInventory extends InventoryManager {
  playSound(soundName) {
    if (!this.options.enableSounds || !this.game.audioManager) return;

    const soundMap = {
      item_pickup: "inventory/pickup.mp3",
      item_drop: "inventory/drop.mp3",
      item_use: "inventory/use.mp3",
      item_move: "inventory/move.mp3",
      inventory_sort: "inventory/sort.mp3",
      inventory_open: "ui/open.mp3",
      inventory_close: "ui/close.mp3",
    };

    const soundFile = soundMap[soundName];
    if (soundFile) {
      this.game.audioManager.playSound(soundFile, {
        volume: 0.5,
        category: "ui",
      });
    }
  }
}
```

### **Drawer System Integration**

```javascript
// Embed inventory in drawer system
class DrawerInventory {
  constructor(game) {
    this.game = game;
    this.inventory = new InventoryManager(game);
    this.setupDrawerIntegration();
  }

  setupDrawerIntegration() {
    // Create inventory drawer
    this.game.drawerManager.addDrawer("inventory", {
      title: "Inventory",
      icon: "🎒",
      content: this.inventory.containerElement,
      position: "right",
      width: "400px",
    });

    // Override show/hide to use drawer
    this.inventory.show = () => {
      this.game.drawerManager.showDrawer("inventory");
    };

    this.inventory.hide = () => {
      this.game.drawerManager.hideDrawer("inventory");
    };
  }
}
```

---

## 🌐 **Browser Compatibility**

### **Supported Browsers**

- ✅ **Chrome 60+**
- ✅ **Firefox 55+**
- ✅ **Safari 12+**
- ✅ **Edge 79+**
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

### **Required Features**

- ES6 Classes and features
- CustomEvent API
- localStorage for persistence
- Drag and Drop API
- CSS Grid (for layout)
- CSS Custom Properties (variables)

### **Polyfills for Older Browsers**

```html
<!-- For IE11 support -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
<script src="https://polyfill.io/v3/polyfill.min.js?features=CustomEvent"></script>
<script src="https://polyfill.io/v3/polyfill.min.js?features=CSS.supports"></script>
```

### **Feature Detection**

```javascript
// Check for required features
function checkBrowserSupport() {
  const features = {
    dragDrop: "draggable" in document.createElement("div"),
    localStorage: typeof Storage !== "undefined",
    customEvents: typeof CustomEvent !== "undefined",
    cssGrid: CSS.supports("display", "grid"),
    es6Classes: typeof class {} === "function",
  };

  const unsupported = Object.entries(features)
    .filter(([name, supported]) => !supported)
    .map(([name]) => name);

  if (unsupported.length > 0) {
    console.warn("Unsupported features:", unsupported);
    return false;
  }

  return true;
}

// Initialize only if supported
if (checkBrowserSupport()) {
  const inventory = new InventoryManager(game);
} else {
  console.error("Browser does not support required features");
}
```

---

## 📊 **Testing and Quality Assurance**

### **Unit Testing**

```javascript
// Example test suite structure
describe("InventoryManager", () => {
  let inventory;
  let mockGame;

  beforeEach(() => {
    mockGame = { gameId: "test" };
    inventory = new InventoryManager(mockGame, {
      enableDebugLogs: false,
    });
  });

  afterEach(() => {
    inventory.destroy();
  });

  describe("Item Management", () => {
    test("should add item to inventory", () => {
      const success = inventory.addItem("health_potion", 1);
      expect(success).toBe(true);
      expect(inventory.slots[0]).not.toBeNull();
      expect(inventory.slots[0].name).toBe("Health Potion");
    });

    test("should stack identical items", () => {
      inventory.addItem("health_potion", 5);
      inventory.addItem("health_potion", 3);

      const firstItem = inventory.slots[0];
      expect(firstItem.quantity).toBe(8);
    });

    test("should handle inventory full condition", () => {
      // Fill inventory
      for (let i = 0; i < inventory.options.maxSlots; i++) {
        inventory.addItem("iron_sword");
      }

      // Try to add one more
      const success = inventory.addItem("health_potion");
      expect(success).toBe(false);
    });
  });

  describe("UI Operations", () => {
    test("should filter items correctly", () => {
      inventory.addItem("iron_sword");
      inventory.addItem("health_potion");

      inventory.filterInventory("weapon");
      expect(inventory.visibleSlots.size).toBe(1);
    });

    test("should search items correctly", () => {
      inventory.addItem("iron_sword");
      inventory.addItem("steel_sword");
      inventory.addItem("health_potion");

      inventory.searchInventory("sword");
      expect(inventory.visibleSlots.size).toBe(2);
    });
  });
});
```

### **Integration Testing**

```javascript
// Test with actual game integration
describe("Game Integration", () => {
  test("should integrate with GameState", async () => {
    const game = new GameWithState();
    const inventory = new InventoryManager(game, {
      saveToGameState: true,
    });

    await inventory.init();
    inventory.addItem("health_potion", 5);

    // Check if saved to game state
    const savedData = game.state.get("inventory");
    expect(savedData).toBeDefined();
    expect(savedData.slots[0]).not.toBeNull();
  });

  test("should trigger achievements", () => {
    const game = new GameWithAchievements();
    const inventory = new InventoryManager(game);

    // Add enough items to trigger achievement
    for (let i = 0; i < 100; i++) {
      inventory.addItem("basic_item");
    }

    expect(game.achievementManager.isUnlocked("pack_rat")).toBe(true);
  });
});
```

### **Performance Testing**

```javascript
// Benchmark inventory operations
function benchmarkInventory() {
  const inventory = new InventoryManager({ gameId: "benchmark" });
  const iterations = 1000;

  console.time("Add Items");
  for (let i = 0; i < iterations; i++) {
    inventory.addItem("basic_item");
  }
  console.timeEnd("Add Items");

  console.time("Search Items");
  for (let i = 0; i < 100; i++) {
    inventory.searchInventory("basic");
  }
  console.timeEnd("Search Items");

  console.time("Sort Items");
  inventory.sortInventory("name");
  console.timeEnd("Sort Items");

  console.time("Filter Items");
  inventory.filterInventory("misc");
  console.timeEnd("Filter Items");

  inventory.destroy();
}
```

---

## 🚀 **Deployment and Production**

### **Build Optimization**

```javascript
// Production configuration
const productionInventory = new InventoryManager(game, {
  enableDebugLogs: false, // Disable debug output
  enableAnimations: true, // Keep animations for UX
  batchUpdates: true, // Batch UI updates
  maxSlots: 50, // Reasonable slot limit
  enablePerformanceTracking: false, // Disable tracking overhead
});
```

### **CDN Deployment**

```html
<!-- Production CDN links -->
<link
  rel="stylesheet"
  href="https://cdn.gamedemontoolkit.com/inventory/v1.0.0/inventory.min.css"
/>
<script src="https://cdn.gamedemontoolkit.com/inventory/v1.0.0/InventoryItem.min.js"></script>
<script src="https://cdn.gamedemontoolkit.com/inventory/v1.0.0/InventoryManager.min.js"></script>
```

### **Bundle Size Optimization**

```javascript
// Tree-shake unused features
import { InventoryManager } from "./InventoryManager.js";

// Custom build with only needed features
const minimalInventory = new InventoryManager(game, {
  enableDragDrop: false, // Remove drag/drop code
  enableContextMenu: false, // Remove context menu code
  enableBulkOperations: false, // Remove bulk operation code
  enableSearch: false, // Remove search functionality
  enableSorting: false, // Remove sorting functionality
});
```

---

## 📄 **License**

This inventory system is part of the GameDemon toolkit. Use freely in your own projects.

**Built with ❤️ for efficient, reusable game development**

---

## 🤝 **Contributing**

Found a bug or want to add a feature? Contributions are welcome!

### **Development Setup**

```bash
# Clone the repository
git clone https://github.com/gamedemontoolkit/inventory-system.git

# Install dependencies (if any)
npm install

# Run tests
npm test

# Start development server
npm run dev
```

### **Contribution Guidelines**

1. **Test your changes** with the included test page
2. **Follow the existing code style** and patterns
3. **Add documentation** for new features
4. **Ensure mobile compatibility**
5. **Write unit tests** for new functionality

### **Code Style**

- Use ES6+ features consistently
- Follow JSDoc commenting standards
- Maintain GameDemon framework patterns
- Prioritize performance and accessibility
- Write self-documenting code

---

## 📚 **Related Systems**

The Inventory System integrates seamlessly with other GameDemon components:

- **🏆 Achievement System** - Track collection milestones and unlock rewards
- **🔊 Audio Manager** - Sound effects for inventory actions and feedback
- **💾 Game State** - Automatic save/load functionality with version control
- **📥 Drawer System** - Slide-out inventory panels and organization
- **💬 Dialog System** - Item interaction prompts and confirmations
- **🎯 Combat System** - Equipment bonuses and consumable effects
- **🏪 Trading System** - Buy/sell mechanics and merchant interactions

All systems share consistent APIs, event patterns, and integration methods.

---

## 🔍 **Advanced Examples**

### **Custom Inventory Variants**

```javascript
// Equipment-focused inventory
class EquipmentInventory extends InventoryManager {
  constructor(game) {
    super(game, {
      maxSlots: 20,
      autoStack: false, // Equipment doesn't stack
      enableRarityEffects: true,
    });

    this.equipmentSlots = new Map();
    this.setupEquipmentCategories();
  }

  setupEquipmentCategories() {
    this.equipmentCategories = {
      "main-hand": { maxItems: 1, types: ["weapon"] },
      "off-hand": { maxItems: 1, types: ["shield", "weapon"] },
      helmet: { maxItems: 1, types: ["armor"] },
      chest: { maxItems: 1, types: ["armor"] },
      legs: { maxItems: 1, types: ["armor"] },
      boots: { maxItems: 1, types: ["armor"] },
      ring: { maxItems: 2, types: ["accessory"] },
      necklace: { maxItems: 1, types: ["accessory"] },
    };
  }
}

// Crafting inventory with recipe integration
class CraftingInventory extends InventoryManager {
  constructor(game) {
    super(game, {
      maxSlots: 60,
      autoStack: true,
      enableCraftingMode: true,
    });

    this.craftingSlots = new Array(9).fill(null); // 3x3 crafting grid
    this.resultSlot = null;
    this.setupCraftingRecipes();
  }

  checkCraftingRecipe() {
    const pattern = this.craftingSlots.map((item) =>
      item ? item.templateId : null
    );

    const recipe = this.findMatchingRecipe(pattern);
    if (recipe) {
      this.resultSlot = this.createItem(recipe.result);
      this.refreshCraftingUI();
    }
  }
}

// Shared/Guild inventory
class SharedInventory extends InventoryManager {
  constructor(game, guildId) {
    super(game, {
      maxSlots: 100,
      storageKey: `guild-${guildId}-inventory`,
      enablePermissions: true,
      enableAuditLog: true,
    });

    this.guildId = guildId;
    this.permissions = new Map();
    this.auditLog = [];
    this.setupPermissionSystem();
  }

  addItem(item, quantity, preferredSlot) {
    if (!this.hasPermission("add_items")) {
      this.log("Permission denied: add_items", "warn");
      return false;
    }

    const success = super.addItem(item, quantity, preferredSlot);
    if (success) {
      this.logAction("add_item", { item: item.name, quantity });
    }

    return success;
  }
}
```

This completes the comprehensive Inventory System documentation! The system is now fully documented with examples, troubleshooting, best practices, and integration patterns that follow the GameDemon framework standards.
