/**
 * InventoryItem - Core Item Class
 * Handles individual item properties, behaviors, and interactions
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class InventoryItem {
  constructor(itemData = {}, options = {}) {
    // Core item properties
    this.id = itemData.id || this.generateId();
    this.templateId = itemData.templateId || 'basic_item';
    this.name = itemData.name || 'Unknown Item';
    this.description = itemData.description || '';
    this.icon = itemData.icon || 'default-item.png';
    
    // Item classification
    this.type = itemData.type || 'misc'; // weapon, armor, consumable, misc, quest, etc.
    this.category = itemData.category || 'general';
    this.rarity = itemData.rarity || 'common'; // common, uncommon, rare, epic, legendary
    this.quality = itemData.quality || 100; // 0-100, affects durability/effectiveness
    
    // Stack and quantity management
    this.stackable = itemData.stackable !== undefined ? itemData.stackable : false;
    this.maxStackSize = itemData.maxStackSize || 1;
    this.quantity = itemData.quantity || 1;
    
    // Value and trading
    this.value = itemData.value || 0;
    this.sellValue = itemData.sellValue || Math.floor(this.value * 0.5);
    this.tradeable = itemData.tradeable !== undefined ? itemData.tradeable : true;
    
    // Durability system
    this.durability = itemData.durability || null; // null = no durability
    this.maxDurability = itemData.maxDurability || null;
    this.repairable = itemData.repairable !== undefined ? itemData.repairable : true;
    
    // Item stats and effects
    this.stats = itemData.stats || {}; // { attack: 10, defense: 5, etc. }
    this.effects = itemData.effects || []; // Status effects or special abilities
    this.requirements = itemData.requirements || {}; // Level, stats, etc. required to use
    
    // Item state
    this.equipped = itemData.equipped || false;
    this.locked = itemData.locked || false; // Cannot be sold/dropped
    this.favorite = itemData.favorite || false;
    
    // Metadata
    this.createdAt = itemData.createdAt || Date.now();
    this.lastUsed = itemData.lastUsed || null;
    this.timesUsed = itemData.timesUsed || 0;
    this.customData = itemData.customData || {};
    
    // Configuration options
    this.options = {
      enableDurabilityLoss: true,
      enableQualityDegradation: false,
      enableAutoRepair: false,
      enableStatBoosts: true,
      enableEffectStacking: false,
      ...options
    };
    
    // Validate item data
    this.validateItem();
  }

  /**
   * Generate a unique ID for the item
   * @returns {string} - Unique item ID
   */
  generateId() {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate item properties
   * @private
   */
  validateItem() {
    // Ensure quantity doesn't exceed stack size
    if (this.quantity > this.maxStackSize) {
      this.quantity = this.maxStackSize;
    }
    
    // Ensure durability is within bounds
    if (this.durability !== null && this.maxDurability !== null) {
      this.durability = Math.min(this.durability, this.maxDurability);
      this.durability = Math.max(this.durability, 0);
    }
    
    // Ensure quality is within bounds
    this.quality = Math.min(Math.max(this.quality, 0), 100);
    
    // Ensure quantity is positive
    this.quantity = Math.max(this.quantity, 0);
  }

  /**
   * Check if this item can stack with another item
   * @param {InventoryItem} otherItem - Item to check stacking with
   * @returns {boolean} - True if items can stack
   */
  canStackWith(otherItem) {
    if (!this.stackable || !otherItem.stackable) return false;
    if (this.templateId !== otherItem.templateId) return false;
    if (this.quality !== otherItem.quality) return false;
    if (this.durability !== otherItem.durability) return false;
    
    // Check custom stacking rules
    return this.customStackingCheck(otherItem);
  }

  /**
   * Custom stacking validation (override in subclasses)
   * @param {InventoryItem} otherItem - Item to check
   * @returns {boolean} - True if custom rules allow stacking
   */
  customStackingCheck(otherItem) {
    return true;
  }

  /**
   * Attempt to stack with another item
   * @param {InventoryItem} otherItem - Item to stack with
   * @returns {number} - Number of items that couldn't be stacked
   */
  stackWith(otherItem) {
    if (!this.canStackWith(otherItem)) {
      return otherItem.quantity;
    }
    
    const totalQuantity = this.quantity + otherItem.quantity;
    const maxPossible = this.maxStackSize;
    
    if (totalQuantity <= maxPossible) {
      // All items fit in this stack
      this.quantity = totalQuantity;
      return 0;
    } else {
      // Some items don't fit
      this.quantity = maxPossible;
      return totalQuantity - maxPossible;
    }
  }

  /**
   * Split this item into multiple stacks
   * @param {number} splitAmount - Number of items to split off
   * @returns {InventoryItem|null} - New item with split amount, or null if can't split
   */
  split(splitAmount) {
    if (splitAmount <= 0 || splitAmount >= this.quantity || !this.stackable) {
      return null;
    }
    
    // Create new item with split amount
    const newItem = this.clone();
    newItem.quantity = splitAmount;
    newItem.id = this.generateId(); // New unique ID
    
    // Reduce this item's quantity
    this.quantity -= splitAmount;
    
    return newItem;
  }

  /**
   * Use/consume this item
   * @param {number} amount - Amount to use (default 1)
   * @returns {boolean} - True if item was used successfully
   */
  use(amount = 1) {
    if (amount <= 0 || amount > this.quantity) return false;
    
    // Check if item can be used
    if (!this.canUse()) return false;
    
    // Apply item effects
    const effectApplied = this.applyEffects();
    if (!effectApplied) return false;
    
    // Consume the item
    this.quantity -= amount;
    this.timesUsed += amount;
    this.lastUsed = Date.now();
    
    // Handle durability loss
    if (this.options.enableDurabilityLoss && this.durability !== null) {
      this.loseDurability(1);
    }
    
    return true;
  }

  /**
   * Check if item can be used
   * @returns {boolean} - True if item can be used
   */
  canUse() {
    // Check durability
    if (this.durability !== null && this.durability <= 0) return false;
    
    // Check if item is locked
    if (this.locked) return false;
    
    // Check custom usage rules
    return this.customUsageCheck();
  }

  /**
   * Custom usage validation (override in subclasses)
   * @returns {boolean} - True if custom rules allow usage
   */
  customUsageCheck() {
    return true;
  }

  /**
   * Apply item effects (override in subclasses)
   * @returns {boolean} - True if effects were applied successfully
   */
  applyEffects() {
    // Default implementation - override in subclasses for specific effects
    return true;
  }

  /**
   * Lose durability
   * @param {number} amount - Amount of durability to lose
   */
  loseDurability(amount = 1) {
    if (this.durability === null) return;
    
    this.durability = Math.max(0, this.durability - amount);
    
    // Handle quality degradation
    if (this.options.enableQualityDegradation && this.durability === 0) {
      this.quality = Math.max(0, this.quality - 10);
    }
  }

  /**
   * Repair the item
   * @param {number} amount - Amount to repair (default: full repair)
   * @returns {boolean} - True if item was repaired
   */
  repair(amount = null) {
    if (this.durability === null || this.maxDurability === null) return false;
    if (!this.repairable) return false;
    
    const repairAmount = amount || (this.maxDurability - this.durability);
    this.durability = Math.min(this.maxDurability, this.durability + repairAmount);
    
    return true;
  }

  /**
   * Get item's current effective stats
   * @returns {Object} - Stats object with quality/durability modifiers applied
   */
  getEffectiveStats() {
    const baseStats = { ...this.stats };
    
    if (!this.options.enableStatBoosts) return baseStats;
    
    // Apply quality modifier
    const qualityModifier = this.quality / 100;
    
    // Apply durability modifier
    let durabilityModifier = 1;
    if (this.durability !== null && this.maxDurability !== null) {
      durabilityModifier = this.durability / this.maxDurability;
    }
    
    const totalModifier = qualityModifier * durabilityModifier;
    
    // Apply modifiers to stats
    Object.keys(baseStats).forEach(stat => {
      if (typeof baseStats[stat] === 'number') {
        baseStats[stat] = Math.round(baseStats[stat] * totalModifier);
      }
    });
    
    return baseStats;
  }

  /**
   * Get item rarity color
   * @returns {string} - CSS color value for rarity
   */
  getRarityColor() {
    const rarityColors = {
      common: '#ffffff',
      uncommon: '#1eff00',
      rare: '#0070dd',
      epic: '#a335ee',
      legendary: '#ff8000',
      artifact: '#e6cc80'
    };
    
    return rarityColors[this.rarity] || rarityColors.common;
  }

  /**
   * Get item condition description
   * @returns {string} - Human-readable condition
   */
  getConditionText() {
    if (this.durability === null) return 'Perfect';
    
    const percentage = (this.durability / this.maxDurability) * 100;
    
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Fair';
    if (percentage >= 25) return 'Poor';
    if (percentage > 0) return 'Broken';
    return 'Destroyed';
  }

  /**
   * Get formatted item tooltip data
   * @returns {Object} - Formatted tooltip information
   */
  getTooltipData() {
    return {
      name: this.name,
      description: this.description,
      type: this.type,
      rarity: this.rarity,
      rarityColor: this.getRarityColor(),
      quality: this.quality,
      condition: this.getConditionText(),
      durability: this.durability,
      maxDurability: this.maxDurability,
      value: this.value,
      sellValue: this.sellValue,
      stats: this.getEffectiveStats(),
      effects: this.effects,
      requirements: this.requirements,
      quantity: this.quantity,
      maxStackSize: this.maxStackSize,
      stackable: this.stackable,
      equipped: this.equipped,
      locked: this.locked,
      favorite: this.favorite,
      timesUsed: this.timesUsed,
      lastUsed: this.lastUsed ? new Date(this.lastUsed).toLocaleDateString() : 'Never'
    };
  }

  /**
   * Create a deep copy of this item
   * @returns {InventoryItem} - Cloned item
   */
  clone() {
    return new InventoryItem(this.toJSON(), this.options);
  }

  /**
   * Convert item to JSON for storage
   * @returns {Object} - JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      templateId: this.templateId,
      name: this.name,
      description: this.description,
      icon: this.icon,
      type: this.type,
      category: this.category,
      rarity: this.rarity,
      quality: this.quality,
      stackable: this.stackable,
      maxStackSize: this.maxStackSize,
      quantity: this.quantity,
      value: this.value,
      sellValue: this.sellValue,
      tradeable: this.tradeable,
      durability: this.durability,
      maxDurability: this.maxDurability,
      repairable: this.repairable,
      stats: this.stats,
      effects: this.effects,
      requirements: this.requirements,
      equipped: this.equipped,
      locked: this.locked,
      favorite: this.favorite,
      createdAt: this.createdAt,
      lastUsed: this.lastUsed,
      timesUsed: this.timesUsed,
      customData: this.customData
    };
  }

  /**
   * Create an item from JSON data
   * @param {Object} jsonData - JSON representation
   * @param {Object} options - Item options
   * @returns {InventoryItem} - New item instance
   */
  static fromJSON(jsonData, options = {}) {
    return new InventoryItem(jsonData, options);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InventoryItem;
}