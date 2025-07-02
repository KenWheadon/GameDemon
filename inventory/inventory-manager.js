/**
 * InventoryManager - Main Inventory Management System
 * Handles inventory operations, UI management, and game integration
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class InventoryManager {
  constructor(gameInstance, options = {}) {
    this.game = gameInstance;

    // Configuration options
    this.options = {
      maxSlots: 40,
      columns: 8,
      enableDragDrop: true,
      enableContextMenu: true,
      enableTooltips: true,
      enableSorting: true,
      enableFiltering: true,
      enableSearch: true,
      autoSort: false,
      autoStack: true,
      saveToGameState: true,
      gameStateKey: "inventory",
      enableSounds: true,
      enableAnimations: true,
      enableKeyboardShortcuts: true,
      enableBulkOperations: true,
      storageKey: "inventory-data",
      enableDebugLogs: false,
      ...options,
    };

    // Core inventory state
    this.slots = new Array(this.options.maxSlots).fill(null);
    this.selectedSlots = new Set();
    this.clipboard = null;

    // UI state
    this.containerElement = null;
    this.isVisible = false;
    this.isInitialized = false;
    this.draggedItem = null;
    this.draggedSlot = null;
    this.hoveredSlot = null;

    // Filtering and sorting
    this.currentFilter = "all";
    this.currentSort = "none";
    this.searchQuery = "";
    this.visibleSlots = new Set();

    // Item templates for creating new items
    this.itemTemplates = new Map();

    // Event listeners storage for cleanup
    this.eventListeners = new Map();

    // Performance tracking
    this.operationCount = 0;
    this.lastOperation = null;

    // Initialize the system - ensure proper async handling
    this.init().catch((error) => {
      console.error("Failed to initialize InventoryManager:", error);
    });
  }

  /**
   * Initialize the inventory system
   */
  async init() {
    try {
      this.log("Initializing InventoryManager...");

      // Load item templates first
      this.loadDefaultItemTemplates();

      // Set up game integration
      if (this.game && this.options.saveToGameState) {
        this.setupGameStateIntegration();
      }

      // Load saved inventory
      await this.loadInventory();

      // Create UI container - this is critical for DOM rendering
      await this.createUI();

      // Set up event listeners only after UI is created
      this.setupEventListeners();

      // Set up keyboard shortcuts
      if (this.options.enableKeyboardShortcuts) {
        this.setupKeyboardShortcuts();
      }

      // Mark as initialized and refresh UI
      this.isInitialized = true;
      this.updateVisibleSlots();
      this.refreshUI();

      this.log("InventoryManager initialized successfully");
      this.dispatchEvent("inventory:initialized", {
        success: true,
        slotsCreated: this.slots.length,
      });

      return true;
    } catch (error) {
      console.error("Failed to initialize InventoryManager:", error);
      this.dispatchEvent("inventory:error", {
        error: "initialization_failed",
        message: error.message,
      });
      return false;
    }
  }

  /**
   * Set up game state integration
   */
  setupGameStateIntegration() {
    if (this.game && this.game.state) {
      // Load inventory from game state
      const savedInventory = this.game.state.get(this.options.gameStateKey);
      if (savedInventory) {
        this.loadFromData(savedInventory);
      }

      // Watch for external changes
      this.game.state.watch(this.options.gameStateKey, (newValue) => {
        if (newValue && this.isInitialized) {
          this.loadFromData(newValue);
          this.refreshUI();
        }
      });
    }
  }

  /**
   * Load default item templates
   */
  loadDefaultItemTemplates() {
    const defaultTemplates = {
      basic_item: {
        name: "Basic Item",
        description: "A basic item",
        type: "misc",
        rarity: "common",
        icon: "basic-item.png",
        value: 1,
        stackable: true,
        maxStackSize: 99,
      },
      health_potion: {
        name: "Health Potion",
        description: "Restores 50 health points",
        type: "consumable",
        rarity: "common",
        icon: "health-potion.png",
        value: 10,
        stackable: true,
        maxStackSize: 20,
        effects: [{ type: "heal", amount: 50 }],
      },
      iron_sword: {
        name: "Iron Sword",
        description: "A sturdy iron sword",
        type: "weapon",
        category: "melee",
        rarity: "common",
        icon: "iron-sword.png",
        value: 100,
        durability: 100,
        maxDurability: 100,
        stackable: false,
        stats: { attack: 15, speed: 5 },
      },
      leather_armor: {
        name: "Leather Armor",
        description: "Basic leather protection",
        type: "armor",
        category: "chest",
        rarity: "common",
        icon: "leather-armor.png",
        value: 50,
        durability: 80,
        maxDurability: 80,
        stackable: false,
        stats: { defense: 8, agility: 2 },
      },
    };

    Object.entries(defaultTemplates).forEach(([id, template]) => {
      this.addItemTemplate(id, template);
    });

    this.log(`Loaded ${Object.keys(defaultTemplates).length} item templates`);
  }

  /**
   * Add an item template
   * @param {string} templateId - Template identifier
   * @param {Object} template - Template data
   */
  addItemTemplate(templateId, template) {
    this.itemTemplates.set(templateId, { ...template, templateId });
    this.log(`Added item template: ${templateId}`);
  }

  /**
   * Create an item from template
   * @param {string} templateId - Template identifier
   * @param {Object} overrides - Property overrides
   * @returns {InventoryItem|null} - Created item or null
   */
  createItem(templateId, overrides = {}) {
    const template = this.itemTemplates.get(templateId);
    if (!template) {
      this.log(`Item template not found: ${templateId}`, "warn");
      return null;
    }

    const itemData = { ...template, ...overrides };
    return new InventoryItem(itemData);
  }

  /**
   * Add item to inventory
   * @param {InventoryItem|string} item - Item instance or template ID
   * @param {number} quantity - Quantity to add (for template ID)
   * @param {number} preferredSlot - Preferred slot index
   * @returns {boolean} - True if item was added successfully
   */
  addItem(item, quantity = 1, preferredSlot = -1) {
    try {
      this.log(
        `Adding item: ${
          typeof item === "string" ? item : item.name
        }, quantity: ${quantity}`
      );

      // Ensure system is initialized
      if (!this.isInitialized) {
        this.log("System not initialized, deferring item add", "warn");
        // Try to initialize and retry
        setTimeout(() => this.addItem(item, quantity, preferredSlot), 100);
        return false;
      }

      // Create item from template if string provided
      if (typeof item === "string") {
        const newItem = this.createItem(item, { quantity });
        if (!newItem) {
          this.log(`Failed to create item from template: ${item}`, "error");
          return false;
        }
        item = newItem;
        this.log(`Created item: ${item.name} with quantity: ${item.quantity}`);
      }

      // Validate item
      if (!item || typeof item !== "object") {
        this.log("Invalid item provided to addItem", "error");
        return false;
      }

      // Auto-stack if enabled
      if (this.options.autoStack && item.stackable) {
        const stackResult = this.tryStackItem(item);
        if (stackResult.fullyStacked) {
          this.log(`Item fully stacked: ${item.name}`);
          this.playSound("item_pickup");
          this.trackOperation("addItem", item);
          this.saveInventory();
          this.refreshUI();
          this.checkAchievements();
          this.dispatchEvent("inventory:item-added", {
            item,
            slot: -1,
            stacked: true,
          });
          return true;
        }
        item = stackResult.remainingItem;
      }

      // Find available slot
      let targetSlot = preferredSlot;
      if (
        targetSlot === -1 ||
        targetSlot >= this.options.maxSlots ||
        this.slots[targetSlot] !== null
      ) {
        targetSlot = this.findEmptySlot();
      }

      if (targetSlot === -1) {
        this.log("Inventory full - cannot add item", "warn");
        this.dispatchEvent("inventory:full", { item });
        return false;
      }

      // Add item to slot
      this.slots[targetSlot] = item;
      this.log(`Added item ${item.name} to slot ${targetSlot}`);

      // Update UI and save
      this.playSound("item_pickup");
      this.animateSlot(targetSlot, "item-added");
      this.trackOperation("addItem", item);
      this.saveInventory();
      this.refreshUI();
      this.checkAchievements();

      this.dispatchEvent("inventory:item-added", { item, slot: targetSlot });
      return true;
    } catch (error) {
      this.log(`Error adding item: ${error.message}`, "error");
      console.error("Full error:", error);
      return false;
    }
  }

  /**
   * Try to stack an item with existing items
   * @param {InventoryItem} item - Item to stack
   * @returns {Object} - Stack result
   */
  tryStackItem(item) {
    for (let i = 0; i < this.slots.length; i++) {
      const slotItem = this.slots[i];
      if (slotItem && slotItem.canStackWith(item)) {
        const remaining = slotItem.stackWith(item);
        if (remaining === 0) {
          return { fullyStacked: true, remainingItem: null };
        } else {
          item.quantity = remaining;
        }
      }
    }
    return { fullyStacked: false, remainingItem: item };
  }

  /**
   * Remove item from inventory
   * @param {number} slotIndex - Slot to remove from
   * @param {number} quantity - Quantity to remove
   * @returns {InventoryItem|null} - Removed item or null
   */
  removeItem(slotIndex, quantity = -1) {
    try {
      if (slotIndex < 0 || slotIndex >= this.options.maxSlots) return null;

      const item = this.slots[slotIndex];
      if (!item) return null;

      let removedItem;

      if (quantity === -1 || quantity >= item.quantity) {
        // Remove entire stack
        removedItem = item;
        this.slots[slotIndex] = null;
      } else {
        // Split stack
        removedItem = item.split(quantity);
        if (!removedItem) return null;
      }

      // Update UI and save
      this.playSound("item_drop");
      this.animateSlot(slotIndex, "item-removed");
      this.trackOperation("removeItem", removedItem);
      this.saveInventory();
      this.refreshUI();

      this.dispatchEvent("inventory:item-removed", {
        item: removedItem,
        slot: slotIndex,
      });
      return removedItem;
    } catch (error) {
      this.log(`Error removing item: ${error.message}`, "error");
      return null;
    }
  }

  /**
   * Move item between slots
   * @param {number} fromSlot - Source slot
   * @param {number} toSlot - Target slot
   * @param {number} quantity - Quantity to move (-1 for all)
   * @returns {boolean} - True if move was successful
   */
  moveItem(fromSlot, toSlot, quantity = -1) {
    try {
      if (fromSlot === toSlot) return true;
      if (fromSlot < 0 || fromSlot >= this.options.maxSlots) return false;
      if (toSlot < 0 || toSlot >= this.options.maxSlots) return false;

      const sourceItem = this.slots[fromSlot];
      if (!sourceItem) return false;

      const targetItem = this.slots[toSlot];

      // Handle stacking
      if (targetItem && targetItem.canStackWith(sourceItem)) {
        const remaining = targetItem.stackWith(sourceItem);
        if (remaining === 0) {
          this.slots[fromSlot] = null;
        } else {
          sourceItem.quantity = remaining;
        }
      } else if (!targetItem) {
        // Move to empty slot
        if (quantity === -1 || quantity >= sourceItem.quantity) {
          // Move entire stack
          this.slots[toSlot] = sourceItem;
          this.slots[fromSlot] = null;
        } else {
          // Split and move
          const splitItem = sourceItem.split(quantity);
          if (splitItem) {
            this.slots[toSlot] = splitItem;
          }
        }
      } else {
        // Swap items
        this.slots[fromSlot] = targetItem;
        this.slots[toSlot] = sourceItem;
      }

      // Update UI and save
      this.playSound("item_move");
      this.animateSlot(fromSlot, "item-moved");
      this.animateSlot(toSlot, "item-moved");
      this.trackOperation("moveItem", { from: fromSlot, to: toSlot });
      this.saveInventory();
      this.refreshUI();

      this.dispatchEvent("inventory:item-moved", {
        fromSlot,
        toSlot,
        quantity,
      });
      return true;
    } catch (error) {
      this.log(`Error moving item: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * Use an item from inventory
   * @param {number} slotIndex - Slot containing item to use
   * @param {number} quantity - Quantity to use
   * @returns {boolean} - True if item was used
   */
  useItem(slotIndex, quantity = 1) {
    try {
      const item = this.slots[slotIndex];
      if (!item) return false;

      const success = item.use(quantity);
      if (success) {
        // Remove item if quantity reaches 0
        if (item.quantity <= 0) {
          this.slots[slotIndex] = null;
        }

        this.playSound("item_use");
        this.animateSlot(slotIndex, "item-used");
        this.trackOperation("useItem", item);
        this.saveInventory();
        this.refreshUI();

        this.dispatchEvent("inventory:item-used", {
          item,
          slot: slotIndex,
          quantity,
        });
      }

      return success;
    } catch (error) {
      this.log(`Error using item: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * Find first empty slot
   * @returns {number} - Slot index or -1 if none available
   */
  findEmptySlot() {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] === null) return i;
    }
    return -1;
  }

  /**
   * Get items by filter criteria
   * @param {Object} criteria - Filter criteria
   * @returns {Array} - Array of {item, slot} objects
   */
  findItems(criteria = {}) {
    const results = [];

    for (let i = 0; i < this.slots.length; i++) {
      const item = this.slots[i];
      if (!item) continue;

      let matches = true;

      // Check each criteria
      Object.entries(criteria).forEach(([key, value]) => {
        if (
          key === "name" &&
          !item.name.toLowerCase().includes(value.toLowerCase())
        ) {
          matches = false;
        } else if (key === "type" && item.type !== value) {
          matches = false;
        } else if (key === "rarity" && item.rarity !== value) {
          matches = false;
        } else if (key === "templateId" && item.templateId !== value) {
          matches = false;
        } else if (key === "minValue" && item.value < value) {
          matches = false;
        } else if (key === "maxValue" && item.value > value) {
          matches = false;
        } else if (key === "equipped" && item.equipped !== value) {
          matches = false;
        } else if (key === "stackable" && item.stackable !== value) {
          matches = false;
        }
      });

      if (matches) {
        results.push({ item, slot: i });
      }
    }

    return results;
  }

  /**
   * Sort inventory by criteria
   * @param {string} sortBy - Sort criteria
   * @param {boolean} ascending - Sort direction
   */
  sortInventory(sortBy = "name", ascending = true) {
    try {
      // Extract non-null items with their original positions
      const itemsWithSlots = [];
      for (let i = 0; i < this.slots.length; i++) {
        if (this.slots[i]) {
          itemsWithSlots.push({ item: this.slots[i], originalSlot: i });
        }
      }

      // Sort items
      itemsWithSlots.sort((a, b) => {
        let valueA, valueB;

        switch (sortBy) {
          case "name":
            valueA = a.item.name.toLowerCase();
            valueB = b.item.name.toLowerCase();
            break;
          case "type":
            valueA = a.item.type;
            valueB = b.item.type;
            break;
          case "rarity":
            const rarityOrder = {
              common: 0,
              uncommon: 1,
              rare: 2,
              epic: 3,
              legendary: 4,
              artifact: 5,
            };
            valueA = rarityOrder[a.item.rarity] || 0;
            valueB = rarityOrder[b.item.rarity] || 0;
            break;
          case "value":
            valueA = a.item.value;
            valueB = b.item.value;
            break;
          case "quantity":
            valueA = a.item.quantity;
            valueB = b.item.quantity;
            break;
          default:
            valueA = a.item.name.toLowerCase();
            valueB = b.item.name.toLowerCase();
        }

        if (valueA < valueB) return ascending ? -1 : 1;
        if (valueA > valueB) return ascending ? 1 : -1;
        return 0;
      });

      // Clear slots and place sorted items
      this.slots.fill(null);
      itemsWithSlots.forEach((entry, index) => {
        if (index < this.slots.length) {
          this.slots[index] = entry.item;
        }
      });

      this.currentSort = sortBy;
      this.playSound("inventory_sort");
      this.trackOperation("sortInventory", { sortBy, ascending });
      this.saveInventory();
      this.refreshUI();

      this.dispatchEvent("inventory:sorted", { sortBy, ascending });
    } catch (error) {
      this.log(`Error sorting inventory: ${error.message}`, "error");
    }
  }

  /**
   * Filter inventory display
   * @param {string} filter - Filter type
   */
  filterInventory(filter = "all") {
    this.currentFilter = filter;
    this.updateVisibleSlots();
    this.refreshUI();
    this.dispatchEvent("inventory:filtered", { filter });
  }

  /**
   * Search inventory
   * @param {string} query - Search query
   */
  searchInventory(query = "") {
    this.searchQuery = query.toLowerCase();
    this.updateVisibleSlots();
    this.refreshUI();
    this.dispatchEvent("inventory:searched", { query });
  }

  /**
   * Update visible slots based on filter and search
   */
  updateVisibleSlots() {
    this.visibleSlots.clear();

    for (let i = 0; i < this.slots.length; i++) {
      const item = this.slots[i];
      let visible = true;

      // Empty slots are always visible unless we have a search query
      if (!item) {
        if (this.searchQuery === "") {
          visible = true;
        } else {
          visible = false;
        }
      } else {
        // Apply filter
        if (this.currentFilter !== "all") {
          if (this.currentFilter === "equipped" && !item.equipped)
            visible = false;
          else if (
            this.currentFilter === "consumable" &&
            item.type !== "consumable"
          )
            visible = false;
          else if (this.currentFilter === "weapon" && item.type !== "weapon")
            visible = false;
          else if (this.currentFilter === "armor" && item.type !== "armor")
            visible = false;
          else if (
            this.currentFilter === "misc" &&
            !["misc", "quest"].includes(item.type)
          )
            visible = false;
        }

        // Apply search
        if (this.searchQuery && visible) {
          const searchable =
            `${item.name} ${item.description} ${item.type}`.toLowerCase();
          if (!searchable.includes(this.searchQuery)) visible = false;
        }
      }

      if (visible) {
        this.visibleSlots.add(i);
      }
    }
  }

  /**
   * Get inventory statistics
   * @returns {Object} - Inventory stats
   */
  getStats() {
    const stats = {
      totalSlots: this.options.maxSlots,
      usedSlots: 0,
      emptySlots: 0,
      totalItems: 0,
      totalValue: 0,
      itemsByType: {},
      itemsByRarity: {},
      averageItemValue: 0,
      mostValuableItem: null,
      oldestItem: null,
      newestItem: null,
    };

    let oldestTime = Infinity;
    let newestTime = 0;

    for (const item of this.slots) {
      if (item) {
        stats.usedSlots++;
        stats.totalItems += item.quantity;
        stats.totalValue += item.value * item.quantity;

        // Count by type
        stats.itemsByType[item.type] =
          (stats.itemsByType[item.type] || 0) + item.quantity;

        // Count by rarity
        stats.itemsByRarity[item.rarity] =
          (stats.itemsByRarity[item.rarity] || 0) + item.quantity;

        // Track most valuable
        if (
          !stats.mostValuableItem ||
          item.value > stats.mostValuableItem.value
        ) {
          stats.mostValuableItem = item;
        }

        // Track oldest/newest
        if (item.createdAt < oldestTime) {
          oldestTime = item.createdAt;
          stats.oldestItem = item;
        }
        if (item.createdAt > newestTime) {
          newestTime = item.createdAt;
          stats.newestItem = item;
        }
      }
    }

    stats.emptySlots = stats.totalSlots - stats.usedSlots;
    stats.averageItemValue =
      stats.totalItems > 0 ? stats.totalValue / stats.totalItems : 0;

    return stats;
  }

  /**
   * Save inventory to storage
   */
  saveInventory() {
    try {
      const inventoryData = {
        slots: this.slots.map((item) => (item ? item.toJSON() : null)),
        metadata: {
          savedAt: Date.now(),
          version: "1.0.0",
          operationCount: this.operationCount,
        },
      };

      // Save to localStorage
      localStorage.setItem(
        this.options.storageKey,
        JSON.stringify(inventoryData)
      );

      // Save to game state if enabled
      if (this.game && this.game.state && this.options.saveToGameState) {
        this.game.state.set(this.options.gameStateKey, inventoryData, true);
      }

      this.dispatchEvent("inventory:saved", { timestamp: Date.now() });
    } catch (error) {
      this.log(`Error saving inventory: ${error.message}`, "error");
    }
  }

  /**
   * Load inventory from storage
   */
  async loadInventory() {
    try {
      // Try to load from game state first
      if (this.game && this.game.state && this.options.saveToGameState) {
        const gameStateData = this.game.state.get(this.options.gameStateKey);
        if (gameStateData) {
          this.loadFromData(gameStateData);
          return;
        }
      }

      // Load from localStorage
      const saved = localStorage.getItem(this.options.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.loadFromData(data);
      }
    } catch (error) {
      this.log(`Error loading inventory: ${error.message}`, "error");
    }
  }

  /**
   * Load inventory from data object
   * @param {Object} data - Inventory data
   */
  loadFromData(data) {
    if (!data.slots) return;

    this.slots = data.slots.map((itemData) => {
      return itemData ? InventoryItem.fromJSON(itemData) : null;
    });

    // Ensure slots array is correct length
    while (this.slots.length < this.options.maxSlots) {
      this.slots.push(null);
    }

    this.dispatchEvent("inventory:loaded", { timestamp: Date.now() });
  }

  // UI MANAGEMENT METHODS

  /**
   * Create the inventory UI - WITH ITEM DETAILS PANEL
   */
  async createUI() {
    try {
      this.log("Creating inventory UI...");

      // Remove existing container if present
      const existingContainer = document.getElementById("inventory-container");
      if (existingContainer) {
        existingContainer.remove();
      }

      // Create the main inventory container
      const container = document.createElement("div");
      container.className = "inventory-container";
      container.id = "inventory-container";

      // Generate the complete UI structure with item details panel
      container.innerHTML = `
        <div class="inventory-layout">
          <!-- Item Details Panel -->
          <div class="inventory-details-panel" id="inventory-details-panel">
            <div class="inventory-details-header">
              <h3 class="inventory-details-title">Item Details</h3>
            </div>
            <div class="inventory-details-content" id="inventory-details-content">
              <div class="inventory-details-empty">
                <div class="inventory-details-empty-icon">👆</div>
                <div class="inventory-details-empty-text">Click an item to view details</div>
              </div>
            </div>
          </div>

          <!-- Main Inventory Panel -->
          <div class="inventory-main-panel">
            <div class="inventory-header">
              <h2 class="inventory-title">Inventory</h2>
              <div class="inventory-stats">
                <div class="inventory-stat">
                  <div class="inventory-stat-value" id="inv-items">0</div>
                  <div class="inventory-stat-label">Items</div>
                </div>
                <div class="inventory-stat">
                  <div class="inventory-stat-value" id="inv-value">0</div>
                  <div class="inventory-stat-label">Value</div>
                </div>
              </div>
              <button class="inventory-close" id="close-inventory">×</button>
            </div>
            <div class="inventory-controls">
              <div class="inventory-search">
                <span class="inventory-search-icon">🔍</span>
                <input type="text" placeholder="Search items..." id="inventory-search">
              </div>
              <div class="inventory-filters">
                <button class="inventory-filter-btn active" data-filter="all">All</button>
                <button class="inventory-filter-btn" data-filter="weapon">Weapons</button>
                <button class="inventory-filter-btn" data-filter="armor">Armor</button>
                <button class="inventory-filter-btn" data-filter="consumable">Consumables</button>
                <button class="inventory-filter-btn" data-filter="misc">Misc</button>
              </div>
            </div>
            <div class="inventory-content">
              <div class="inventory-grid" id="inventory-grid">
                ${this.generateSlotHTML()}
              </div>
            </div>
          </div>
        </div>
      `;

      // Append to body and store reference
      document.body.appendChild(container);
      this.containerElement = container;

      // Wait a tick for DOM to be ready
      await new Promise((resolve) => setTimeout(resolve, 10));

      this.log("Inventory UI created successfully");
      this.log(`Created ${this.options.maxSlots} inventory slots`);

      return true;
    } catch (error) {
      this.log(`Error creating UI: ${error.message}`, "error");
      throw error;
    }
  }

  /**
   * Generate HTML for inventory slots
   */
  generateSlotHTML() {
    let html = "";
    for (let i = 0; i < this.options.maxSlots; i++) {
      html += `<div class="inventory-slot" data-slot="${i}" tabindex="0"></div>`;
    }
    return html;
  }

  /**
   * Set up event listeners - FIXED VERSION
   */
  setupEventListeners() {
    try {
      // Ensure UI exists before setting up events
      if (!this.containerElement) {
        this.log("Container element not found when setting up events", "error");
        return;
      }

      // Set up UI-specific event listeners
      this.setupUIEvents();

      this.log("Event listeners set up successfully");
    } catch (error) {
      this.log(`Error setting up event listeners: ${error.message}`, "error");
    }
  }

  /**
   * Set up UI-specific event listeners
   */
  setupUIEvents() {
    // Close button
    const closeBtn = document.getElementById("close-inventory");
    if (closeBtn) {
      const closeHandler = () => this.hide();
      closeBtn.addEventListener("click", closeHandler);
      this.eventListeners.set("close-inventory", {
        event: "click",
        handler: closeHandler,
      });
    }

    // Search functionality
    const searchInput = document.getElementById("inventory-search");
    if (searchInput) {
      const searchHandler = (e) => this.searchInventory(e.target.value);
      searchInput.addEventListener("input", searchHandler);
      this.eventListeners.set("inventory-search", {
        event: "input",
        handler: searchHandler,
      });
    }

    // Filter buttons
    document.querySelectorAll(".inventory-filter-btn").forEach((btn, index) => {
      const filterHandler = (e) => {
        // Update active state
        document
          .querySelectorAll(".inventory-filter-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");

        // Apply filter
        this.filterInventory(e.target.dataset.filter);
      };

      btn.addEventListener("click", filterHandler);
      this.eventListeners.set(`filter-${index}`, {
        event: "click",
        handler: filterHandler,
      });
    });

    // Set up slot events
    this.setupSlotEvents();
  }

  /**
   * Set up slot-specific event listeners
   */
  setupSlotEvents() {
    const slots = document.querySelectorAll(".inventory-slot");
    this.log(`Setting up events for ${slots.length} slots`);

    slots.forEach((slot, index) => {
      // Click handler - distinguish between click and drag
      let isDragging = false;
      let dragStartTime = 0;

      const mouseDownHandler = (e) => {
        isDragging = false;
        dragStartTime = Date.now();
      };

      const mouseMoveHandler = (e) => {
        if (Date.now() - dragStartTime > 100) {
          isDragging = true;
        }
      };

      const clickHandler = (e) => {
        // Small delay to allow drag detection
        setTimeout(() => {
          if (!isDragging) {
            if (e.ctrlKey || e.metaKey) {
              this.toggleSlotSelection(index);
            } else {
              this.selectSlot(index);
              // Show item details on click
              this.showItemDetails(index);
            }
          }
        }, 50);
      };

      slot.addEventListener("mousedown", mouseDownHandler);
      slot.addEventListener("mousemove", mouseMoveHandler);
      slot.addEventListener("click", clickHandler);

      // Context menu
      if (this.options.enableContextMenu) {
        const contextHandler = (e) => {
          e.preventDefault();
          this.showContextMenu(e, index);
        };
        slot.addEventListener("contextmenu", contextHandler);
      }

      // Drag and drop
      if (this.options.enableDragDrop) {
        this.setupDragDrop(slot, index);
      }

      // Keyboard navigation
      if (this.options.enableKeyboardShortcuts) {
        const keyHandler = (e) => this.handleKeyboard(e, index);
        slot.addEventListener("keydown", keyHandler);
      }
    });
  }

  /**
   * Set up drag and drop for a slot
   */
  setupDragDrop(slot, index) {
    // Make slot draggable if it has an item
    const updateDraggable = () => {
      slot.draggable = this.slots[index] !== null;
    };
    updateDraggable();

    // Drag start
    const dragStartHandler = (e) => {
      const item = this.slots[index];
      if (item) {
        e.dataTransfer.setData("text/plain", index.toString());
        slot.classList.add("drag-source");
        this.draggedSlot = index;
        this.draggedItem = item;
        this.log(`Started dragging: ${item.name}`);
      }
    };
    slot.addEventListener("dragstart", dragStartHandler);

    // Drag over
    const dragOverHandler = (e) => {
      e.preventDefault();
      slot.classList.add("drag-over");
    };
    slot.addEventListener("dragover", dragOverHandler);

    // Drag leave
    const dragLeaveHandler = () => {
      slot.classList.remove("drag-over");
    };
    slot.addEventListener("dragleave", dragLeaveHandler);

    // Drop
    const dropHandler = (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
      slot.classList.remove("drag-over");

      if (fromIndex !== index) {
        const success = this.moveItem(fromIndex, index);
        if (success) {
          this.log(`Moved item from slot ${fromIndex} to ${index}`);
        }
      }

      this.cleanupDragState();
    };
    slot.addEventListener("drop", dropHandler);

    // Drag end
    const dragEndHandler = () => {
      this.cleanupDragState();
    };
    slot.addEventListener("dragend", dragEndHandler);
  }

  /**
   * Clean up drag and drop state
   */
  cleanupDragState() {
    document.querySelectorAll(".inventory-slot").forEach((s) => {
      s.classList.remove("drag-source", "drag-over");
    });
    this.draggedSlot = null;
    this.draggedItem = null;
  }

  /**
   * Set up keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    const keyboardHandler = (e) => {
      // Only handle shortcuts when inventory is visible
      if (!this.isVisible) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          this.hide();
          break;
        case "i":
        case "I":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.toggle();
          }
          break;
        case "s":
        case "S":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.sortInventory("name", true);
          }
          break;
        case "f":
        case "F":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const searchInput = document.getElementById("inventory-search");
            if (searchInput) {
              searchInput.focus();
            }
          }
          break;
      }
    };

    document.addEventListener("keydown", keyboardHandler);
    this.eventListeners.set("document-keyboard", {
      event: "keydown",
      handler: keyboardHandler,
    });
  }

  /**
   * Refresh the inventory UI - FIXED VERSION
   */
  refreshUI() {
    try {
      if (!this.isInitialized || !this.containerElement) {
        this.log("Cannot refresh UI - system not ready", "warn");
        return;
      }

      this.updateSlots();
      this.updateStats();

      this.log("UI refreshed successfully");
    } catch (error) {
      this.log(`Error refreshing UI: ${error.message}`, "error");
      console.error("Full refresh UI error:", error);
    }
  }

  /**
   * Update individual slot displays - FIXED VERSION
   */
  updateSlots() {
    const slots = document.querySelectorAll(".inventory-slot");

    if (slots.length === 0) {
      this.log("No slot elements found during updateSlots", "error");
      return;
    }

    this.log(`Updating ${slots.length} slots`);

    slots.forEach((slot, index) => {
      const item = this.slots[index];

      if (item) {
        slot.innerHTML = this.generateItemHTML(item);
        slot.title = this.generateTooltip(item);
        slot.draggable = true;
        this.log(`Updated slot ${index} with item: ${item.name}`);
      } else {
        slot.innerHTML = "";
        slot.title = "";
        slot.draggable = false;
      }

      // Apply visibility based on current filter
      const shouldShow =
        this.visibleSlots.size === 0 || this.visibleSlots.has(index);

      if (shouldShow) {
        slot.style.display = "flex";
        slot.classList.remove("hidden");
      } else {
        // Don't completely hide, just make less visible
        slot.style.display = "flex";
        slot.classList.add("hidden");
      }
    });
  }

  /**
   * Generate HTML for an item in a slot
   */
  generateItemHTML(item) {
    const rarityColor = this.getRarityColor(item.rarity);
    const itemEmoji = this.getItemEmoji(item.type);

    return `
      <div class="inventory-item rarity-${
        item.rarity
      }" style="border-color: ${rarityColor};">
        <div class="inventory-item-icon" style="
          background: linear-gradient(45deg, ${rarityColor}33, transparent);
          width: 100%; 
          height: 100%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 28px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        ">
          ${itemEmoji}
        </div>
        ${
          item.quantity > 1
            ? `<div class="inventory-item-quantity">${item.quantity}</div>`
            : ""
        }
        ${
          item.durability !== null && item.maxDurability !== null
            ? `
          <div class="inventory-item-durability">
            <div class="inventory-item-durability-bar" style="width: ${Math.round(
              (item.durability / item.maxDurability) * 100
            )}%"></div>
          </div>
        `
            : ""
        }
        ${item.equipped ? '<div class="inventory-item-equipped"></div>' : ""}
        ${item.locked ? '<div class="inventory-item-locked">🔒</div>' : ""}
        ${item.favorite ? '<div class="inventory-item-favorite">⭐</div>' : ""}
      </div>
    `;
  }

  /**
   * Update inventory statistics display
   */
  updateStats() {
    const stats = this.getStats();

    const itemsElement = document.getElementById("inv-items");
    const valueElement = document.getElementById("inv-value");

    if (itemsElement) itemsElement.textContent = stats.totalItems;
    if (valueElement) valueElement.textContent = stats.totalValue;
  }

  /**
   * Show the inventory
   */
  show() {
    if (this.containerElement) {
      this.containerElement.classList.add("visible");
      this.isVisible = true;
      this.refreshUI();
      this.dispatchEvent("inventory:shown");
      this.log("Inventory shown");
    }
  }

  /**
   * Hide the inventory
   */
  hide() {
    if (this.containerElement) {
      this.containerElement.classList.remove("visible");
      this.isVisible = false;
      this.dispatchEvent("inventory:hidden");
      this.log("Inventory hidden");
    }
  }

  /**
   * Toggle inventory visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Select a slot
   */
  selectSlot(index) {
    document.querySelectorAll(".inventory-slot").forEach((slot) => {
      slot.classList.remove("selected");
    });

    const slot = document.querySelector(`[data-slot="${index}"]`);
    if (slot) {
      slot.classList.add("selected");
      slot.focus();
    }
  }

  /**
   * Toggle slot selection for bulk operations
   */
  toggleSlotSelection(index) {
    const slot = document.querySelector(`[data-slot="${index}"]`);
    if (slot) {
      slot.classList.toggle("bulk-selected");

      if (slot.classList.contains("bulk-selected")) {
        this.selectedSlots.add(index);
      } else {
        this.selectedSlots.delete(index);
      }
    }
  }

  /**
   * Show context menu for a slot
   */
  showContextMenu(e, slotIndex) {
    const item = this.slots[slotIndex];
    if (!item) return;

    // Remove existing context menu
    const existingMenu = document.querySelector(".inventory-context-menu");
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create context menu
    const menu = document.createElement("div");
    menu.className = "inventory-context-menu visible";
    menu.style.left = e.pageX + "px";
    menu.style.top = e.pageY + "px";

    menu.innerHTML = `
      <div class="inventory-context-menu-item" data-action="use">Use Item</div>
      <div class="inventory-context-menu-item" data-action="drop">Drop Item</div>
      <div class="inventory-context-menu-separator"></div>
      <div class="inventory-context-menu-item" data-action="favorite">${
        item.favorite ? "Unfavorite" : "Favorite"
      }</div>
      <div class="inventory-context-menu-item" data-action="lock">${
        item.locked ? "Unlock" : "Lock"
      }</div>
    `;

    document.body.appendChild(menu);

    // Handle menu clicks
    const menuClickHandler = (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleContextAction(action, slotIndex);
      }
      menu.remove();
    };
    menu.addEventListener("click", menuClickHandler);

    // Remove menu on outside click
    setTimeout(() => {
      const outsideClickHandler = () => {
        if (menu.parentNode) {
          menu.remove();
        }
      };
      document.addEventListener("click", outsideClickHandler, { once: true });
    }, 10);
  }

  /**
   * Handle context menu actions
   */
  handleContextAction(action, slotIndex) {
    const item = this.slots[slotIndex];
    if (!item) return;

    switch (action) {
      case "use":
        this.useItem(slotIndex);
        break;
      case "drop":
        this.removeItem(slotIndex);
        break;
      case "favorite":
        item.favorite = !item.favorite;
        this.log(
          `${item.favorite ? "Favorited" : "Unfavorited"}: ${item.name}`
        );
        this.saveInventory();
        this.refreshUI();
        break;
      case "lock":
        item.locked = !item.locked;
        this.log(`${item.locked ? "Locked" : "Unlocked"}: ${item.name}`);
        this.saveInventory();
        this.refreshUI();
        break;
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboard(e, slotIndex) {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        this.useItem(slotIndex);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        this.removeItem(slotIndex);
        break;
      case "ArrowRight":
        e.preventDefault();
        this.focusSlot(slotIndex + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.focusSlot(slotIndex - 1);
        break;
      case "ArrowDown":
        e.preventDefault();
        this.focusSlot(slotIndex + this.options.columns);
        break;
      case "ArrowUp":
        e.preventDefault();
        this.focusSlot(slotIndex - this.options.columns);
        break;
    }
  }

  /**
   * Focus a specific slot
   */
  focusSlot(index) {
    if (index >= 0 && index < this.options.maxSlots) {
      const slot = document.querySelector(`[data-slot="${index}"]`);
      if (slot) {
        slot.focus();
      }
    }
  }

  /**
   * Show detailed information about an item
   * @param {number} slotIndex - Slot containing the item
   */
  showItemDetails(slotIndex) {
    const item = this.slots[slotIndex];
    const detailsContent = document.getElementById("inventory-details-content");

    if (!detailsContent) {
      this.log("Details panel not found", "warn");
      return;
    }

    if (!item) {
      // Show empty state
      detailsContent.innerHTML = `
        <div class="inventory-details-empty">
          <div class="inventory-details-empty-icon">👆</div>
          <div class="inventory-details-empty-text">Click an item to view details</div>
        </div>
      `;
      return;
    }

    // Get comprehensive item data
    const tooltipData = item.getTooltipData();
    const effectiveStats = item.getEffectiveStats();

    // Generate detailed HTML
    detailsContent.innerHTML = `
      <div class="inventory-details-item">
        <!-- Item Header -->
        <div class="inventory-details-item-header">
          <div class="inventory-details-item-icon" style="background: linear-gradient(45deg, ${item.getRarityColor()}33, transparent);">
            ${this.getItemEmoji(item.type)}
          </div>
          <div class="inventory-details-item-info">
            <h4 class="inventory-details-item-name" style="color: ${item.getRarityColor()};">
              ${item.name}
            </h4>
            <div class="inventory-details-item-type">
              ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              ${item.category ? `• ${item.category}` : ""}
            </div>
            <div class="inventory-details-item-rarity rarity-${item.rarity}">
              ${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
            </div>
          </div>
        </div>

        <!-- Item Description -->
        ${
          item.description
            ? `
          <div class="inventory-details-section">
            <div class="inventory-details-section-title">Description</div>
            <div class="inventory-details-item-description">
              ${item.description}
            </div>
          </div>
        `
            : ""
        }

        <!-- Item Stats -->
        ${
          Object.keys(effectiveStats).length > 0
            ? `
          <div class="inventory-details-section">
            <div class="inventory-details-section-title">Stats</div>
            <div class="inventory-details-stats">
              ${Object.entries(effectiveStats)
                .map(
                  ([stat, value]) => `
                <div class="inventory-details-stat">
                  <span class="inventory-details-stat-name">${
                    stat.charAt(0).toUpperCase() + stat.slice(1)
                  }:</span>
                  <span class="inventory-details-stat-value ${
                    value > 0 ? "positive" : value < 0 ? "negative" : "neutral"
                  }">
                    ${value > 0 ? "+" : ""}${value}
                  </span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- Item Effects -->
        ${
          item.effects && item.effects.length > 0
            ? `
          <div class="inventory-details-section">
            <div class="inventory-details-section-title">Effects</div>
            <div class="inventory-details-effects">
              ${item.effects
                .map(
                  (effect) => `
                <div class="inventory-details-effect">
                  <div class="inventory-details-effect-type">${effect.type
                    .replace("_", " ")
                    .toUpperCase()}</div>
                  ${
                    effect.amount
                      ? `<div class="inventory-details-effect-amount">${effect.amount}</div>`
                      : ""
                  }
                  ${
                    effect.duration
                      ? `<div class="inventory-details-effect-duration">${Math.round(
                          effect.duration / 1000
                        )}s</div>`
                      : ""
                  }
                  ${
                    effect.description
                      ? `<div class="inventory-details-effect-description">${effect.description}</div>`
                      : ""
                  }
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- Requirements -->
        ${
          item.requirements && Object.keys(item.requirements).length > 0
            ? `
          <div class="inventory-details-section">
            <div class="inventory-details-section-title">Requirements</div>
            <div class="inventory-details-requirements">
              ${Object.entries(item.requirements)
                .map(
                  ([req, value]) => `
                <div class="inventory-details-requirement">
                  <span class="inventory-details-requirement-name">${
                    req.charAt(0).toUpperCase() + req.slice(1)
                  }:</span>
                  <span class="inventory-details-requirement-value">${value}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- Durability -->
        ${
          item.durability !== null && item.maxDurability !== null
            ? `
          <div class="inventory-details-section">
            <div class="inventory-details-section-title">Condition</div>
            <div class="inventory-details-durability">
              <div class="inventory-details-durability-text">
                ${item.getConditionText()} (${item.durability}/${
                item.maxDurability
              })
              </div>
              <div class="inventory-details-durability-bar-container">
                <div class="inventory-details-durability-bar" style="width: ${Math.round(
                  (item.durability / item.maxDurability) * 100
                )}%"></div>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <!-- Item Properties -->
        <div class="inventory-details-section">
          <div class="inventory-details-section-title">Properties</div>
          <div class="inventory-details-properties">
            <div class="inventory-details-property">
              <span class="inventory-details-property-name">Value:</span>
              <span class="inventory-details-property-value">${
                item.value
              } gold</span>
            </div>
            ${
              item.sellValue !== item.value
                ? `
              <div class="inventory-details-property">
                <span class="inventory-details-property-name">Sell Value:</span>
                <span class="inventory-details-property-value">${item.sellValue} gold</span>
              </div>
            `
                : ""
            }
            <div class="inventory-details-property">
              <span class="inventory-details-property-name">Quality:</span>
              <span class="inventory-details-property-value">${
                item.quality
              }%</span>
            </div>
            ${
              item.stackable
                ? `
              <div class="inventory-details-property">
                <span class="inventory-details-property-name">Quantity:</span>
                <span class="inventory-details-property-value">${item.quantity}/${item.maxStackSize}</span>
              </div>
            `
                : ""
            }
            <div class="inventory-details-property">
              <span class="inventory-details-property-name">Tradeable:</span>
              <span class="inventory-details-property-value">${
                item.tradeable ? "Yes" : "No"
              }</span>
            </div>
          </div>
        </div>

        <!-- Item Status -->
        <div class="inventory-details-section">
          <div class="inventory-details-section-title">Status</div>
          <div class="inventory-details-status">
            ${
              item.equipped
                ? '<div class="inventory-details-status-item equipped">✓ Equipped</div>'
                : ""
            }
            ${
              item.locked
                ? '<div class="inventory-details-status-item locked">🔒 Locked</div>'
                : ""
            }
            ${
              item.favorite
                ? '<div class="inventory-details-status-item favorite">⭐ Favorite</div>'
                : ""
            }
          </div>
        </div>

        <!-- Usage Statistics -->
        <div class="inventory-details-section">
          <div class="inventory-details-section-title">Statistics</div>
          <div class="inventory-details-usage">
            <div class="inventory-details-usage-item">
              <span class="inventory-details-usage-name">Times Used:</span>
              <span class="inventory-details-usage-value">${
                item.timesUsed
              }</span>
            </div>
            <div class="inventory-details-usage-item">
              <span class="inventory-details-usage-name">Last Used:</span>
              <span class="inventory-details-usage-value">${
                tooltipData.lastUsed
              }</span>
            </div>
            <div class="inventory-details-usage-item">
              <span class="inventory-details-usage-name">Created:</span>
              <span class="inventory-details-usage-value">${new Date(
                item.createdAt
              ).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <!-- Item Actions -->
        <div class="inventory-details-actions">
          ${
            item.type === "consumable"
              ? `
            <button class="inventory-details-action-btn primary" onclick="window.currentInventory?.useItem(${slotIndex})">
              Use Item
            </button>
          `
              : item.type === "weapon" || item.type === "armor"
              ? `
            <button class="inventory-details-action-btn primary" onclick="window.currentInventory?.useItem(${slotIndex})">
              ${item.equipped ? "Unequip" : "Equip"}
            </button>
          `
              : ""
          }
          <button class="inventory-details-action-btn secondary" onclick="window.currentInventory?.toggleItemFavorite(${slotIndex})">
            ${item.favorite ? "Unfavorite" : "Favorite"}
          </button>
          <button class="inventory-details-action-btn danger" onclick="window.currentInventory?.removeItem(${slotIndex})">
            Drop Item
          </button>
        </div>
      </div>
    `;

    // Store reference for action buttons
    window.currentInventory = this;

    this.log(`Showing details for item: ${item.name}`);
  }

  /**
   * Generate tooltip text for an item
   */
  generateTooltip(item) {
    const tooltipData = item.getTooltipData();
    return `${tooltipData.name}\n${tooltipData.description}\nRarity: ${
      tooltipData.rarity
    }\nValue: ${tooltipData.value}${
      tooltipData.durability !== null
        ? `\nDurability: ${tooltipData.durability}/${tooltipData.maxDurability}`
        : ""
    }\n\nClick for details`;
  }

  /**
   * Get rarity color for styling
   */
  getRarityColor(rarity) {
    const colors = {
      common: "#ffffff",
      uncommon: "#1eff00",
      rare: "#0070dd",
      epic: "#a335ee",
      legendary: "#ff8000",
      artifact: "#e6cc80",
    };
    return colors[rarity] || colors.common;
  }

  /**
   * Get emoji representation for item type
   */
  getItemEmoji(type) {
    const emojis = {
      weapon: "⚔️",
      armor: "🛡️",
      consumable: "🧪",
      misc: "📦",
      quest: "📜",
    };
    return emojis[type] || "📦";
  }

  // UTILITY METHODS

  /**
   * Play sound effect
   * @param {string} soundName - Sound identifier
   */
  playSound(soundName) {
    if (!this.options.enableSounds) return;

    // Integrate with AudioManager if available
    if (this.game && this.game.audioManager) {
      this.game.audioManager.playSound(soundName);
    }
  }

  /**
   * Animate a slot
   * @param {number} slotIndex - Slot to animate
   * @param {string} animationClass - CSS animation class
   */
  animateSlot(slotIndex, animationClass) {
    if (!this.options.enableAnimations) return;

    const slotElement = document.querySelector(`[data-slot="${slotIndex}"]`);
    if (slotElement) {
      slotElement.classList.add(animationClass);
      setTimeout(() => {
        slotElement.classList.remove(animationClass);
      }, 500);
    }
  }

  /**
   * Track operation for analytics
   * @param {string} operation - Operation name
   * @param {*} data - Operation data
   */
  trackOperation(operation, data) {
    this.operationCount++;
    this.lastOperation = { operation, data, timestamp: Date.now() };
  }

  /**
   * Check for achievement unlocks
   */
  checkAchievements() {
    if (!this.game || !this.game.achievementManager) return;

    const stats = this.getStats();
    const achievements = this.game.achievementManager;

    // Example achievement checks
    if (stats.totalItems >= 100) {
      achievements.unlockAchievement("pack_rat");
    }
    if (stats.totalValue >= 10000) {
      achievements.unlockAchievement("wealthy_collector");
    }
  }

  /**
   * Dispatch custom event
   * @param {string} eventName - Event name
   * @param {Object} detail - Event details
   */
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail, bubbles: true });
    document.dispatchEvent(event);
  }

  /**
   * Debug logging
   * @param {string} message - Log message
   * @param {string} level - Log level
   */
  log(message, level = "info") {
    if (this.options.enableDebugLogs) {
      const logMethod =
        level === "error"
          ? console.error
          : level === "warn"
          ? console.warn
          : console.log;
      logMethod(`[InventoryManager] ${message}`);
    }
  }

  /**
   * Export inventory data for external use
   * @param {boolean} includeMetadata - Include metadata in export
   * @returns {Object} - Exported inventory data
   */
  exportInventory(includeMetadata = true) {
    const exportData = {
      slots: this.slots.map((item) => (item ? item.toJSON() : null)),
      timestamp: Date.now(),
      version: "1.0.0",
    };

    if (includeMetadata) {
      exportData.metadata = {
        operationCount: this.operationCount,
        lastOperation: this.lastOperation,
        options: this.options,
      };
    }

    return exportData;
  }

  /**
   * Import inventory data from external source
   * @param {Object} importData - Data to import
   * @param {boolean} merge - Merge with current inventory instead of replacing
   * @returns {boolean} - Success status
   */
  importInventory(importData, merge = false) {
    try {
      if (!importData.slots) {
        this.log("Invalid import data: missing slots", "warn");
        return false;
      }

      if (merge) {
        // Merge items into empty slots
        importData.slots.forEach((itemData, index) => {
          if (itemData && !this.slots[index]) {
            this.slots[index] = InventoryItem.fromJSON(itemData);
          }
        });
      } else {
        // Replace entire inventory
        this.loadFromData(importData);
      }

      this.saveInventory();
      this.refreshUI();
      this.log("Inventory imported successfully");
      return true;
    } catch (error) {
      this.log("Error importing inventory:", "error");
      return false;
    }
  }

  /**
   * Get performance statistics
   * @returns {Object} - Performance stats
   */
  getPerformanceStats() {
    return {
      operationCount: this.operationCount,
      lastOperation: this.lastOperation,
      slotsCount: this.slots.length,
      itemsCount: this.slots.filter((item) => item !== null).length,
      templatesCount: this.itemTemplates.size,
      isVisible: this.isVisible,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Debug method to check inventory state
   */
  debugInventory() {
    console.log("=== INVENTORY DEBUG ===");
    console.log("Total slots:", this.options.maxSlots);
    console.log(
      "Items in inventory:",
      this.slots.filter((item) => item !== null).length
    );
    console.log("Slots array:", this.slots);
    console.log("Container element:", this.containerElement);
    console.log("Is visible:", this.isVisible);
    console.log("Is initialized:", this.isInitialized);
    console.log("Visible slots:", this.visibleSlots);
    console.log("Current filter:", this.currentFilter);
    console.log("Search query:", this.searchQuery);

    // Check if UI elements exist
    const grid = document.getElementById("inventory-grid");
    const slots = document.querySelectorAll(".inventory-slot");
    console.log("Grid element:", grid);
    console.log("Slot elements found:", slots.length);

    // Check first few slots
    for (let i = 0; i < Math.min(5, this.slots.length); i++) {
      const item = this.slots[i];
      const slotElement = document.querySelector(`[data-slot="${i}"]`);
      console.log(`Slot ${i}:`, {
        item: item ? item.name : "empty",
        element: slotElement,
        innerHTML: slotElement ? slotElement.innerHTML : "no element",
      });
    }

    return {
      totalSlots: this.options.maxSlots,
      itemCount: this.slots.filter((item) => item !== null).length,
      hasContainer: !!this.containerElement,
      isVisible: this.isVisible,
      isInitialized: this.isInitialized,
      slotElements: slots.length,
    };
  }

  /**
   * Clean up and destroy the manager
   */
  destroy() {
    this.log("Destroying InventoryManager...");

    // Remove event listeners
    this.eventListeners.forEach((listener, key) => {
      if (key === "document-keyboard") {
        document.removeEventListener(listener.event, listener.handler);
      } else {
        const element = document.getElementById(key);
        if (element && listener.handler) {
          element.removeEventListener(listener.event, listener.handler);
        }
      }
    });
    this.eventListeners.clear();

    // Clear UI
    if (this.containerElement) {
      this.containerElement.remove();
      this.containerElement = null;
    }

    // Clear data
    this.slots = [];
    this.selectedSlots.clear();
    this.itemTemplates.clear();
    this.isInitialized = false;

    this.log("InventoryManager destroyed");
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = InventoryManager;
}
