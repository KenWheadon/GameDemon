// Game State Management - Pure Data and State Logic
class GameState {
  constructor(eventDispatcher) {
    this.eventDispatcher = eventDispatcher;
    this.reset();
  }

  reset() {
    // Core game state
    this.credits = SLOT_CONFIG.INITIAL_CREDITS;
    this.jackpot = SLOT_CONFIG.INITIAL_JACKPOT;
    this.multiplier = 1;
    this.luckMeter = 0;

    // Game statistics
    this.totalSpins = 0;
    this.totalWins = 0;
    this.winStreak = 0;
    this.biggestWin = 0;
    this.jackpots = 0;

    // Combo system
    this.comboCount = 0;
    this.comboMultiplier = 1;

    // Upgrade system
    this.upgrades = {
      symbols: {
        "🍒": 0,
        "🍋": 0,
        "🍊": 0,
        "🍇": 0,
        "🍓": 0,
        "💎": 0,
        "🎰": 0,
        "🌟": 0,
      },
      luck: {
        LUCK_GAIN: 0,
        LUCK_RETENTION: 0,
        MAX_LUCK: 0,
      },
      multiplier: {
        COMBO_POWER: 0,
        MAX_MULTIPLIER: 0,
      },
    };

    this.emitStateChange();
  }

  // Credits management
  spendCredits(amount) {
    if (this.credits < amount) {
      throw new Error("Insufficient credits");
    }
    this.credits -= amount;
    this.emitStateChange();
  }

  addCredits(amount) {
    this.credits += amount;
    this.emitStateChange();
  }

  // Jackpot management
  addToJackpot(amount) {
    this.jackpot += amount;
    this.emitStateChange();
  }

  winJackpot() {
    const jackpotAmount = this.jackpot;
    this.addCredits(jackpotAmount);
    this.jackpot = SLOT_CONFIG.INITIAL_JACKPOT;
    this.jackpots++;
    this.emitStateChange();
    return jackpotAmount;
  }

  // Luck meter management
  getMaxLuck() {
    return SLOT_CONFIG.MAX_LUCK + this.upgrades.luck.MAX_LUCK * 25;
  }

  getLuckIncrement() {
    return SLOT_CONFIG.LUCK_INCREMENT + this.upgrades.luck.LUCK_GAIN * 1;
  }

  getLuckDecrement() {
    const baseDecrement = SLOT_CONFIG.LUCK_DECREMENT;
    const retention = this.upgrades.luck.LUCK_RETENTION * 0.2;
    return Math.max(1, Math.floor(baseDecrement * (1 - retention)));
  }

  increaseLuck() {
    const oldLuck = this.luckMeter;
    const increment = this.getLuckIncrement();
    const maxLuck = this.getMaxLuck();

    this.luckMeter = Math.min(this.luckMeter + increment, maxLuck);

    this.eventDispatcher.emit("luck_changed", {
      oldValue: oldLuck,
      newValue: this.luckMeter,
      maxValue: maxLuck,
    });

    this.emitStateChange();
  }

  decreaseLuck() {
    const oldLuck = this.luckMeter;
    const decrement = this.getLuckDecrement();

    this.luckMeter = Math.max(this.luckMeter - decrement, 0);

    this.eventDispatcher.emit("luck_changed", {
      oldValue: oldLuck,
      newValue: this.luckMeter,
      maxValue: this.getMaxLuck(),
    });

    this.emitStateChange();
  }

  resetLuck() {
    const oldLuck = this.luckMeter;
    this.luckMeter = 0;

    this.eventDispatcher.emit("luck_changed", {
      oldValue: oldLuck,
      newValue: 0,
      maxValue: this.getMaxLuck(),
    });

    this.emitStateChange();
  }

  // Multiplier management
  getMaxMultiplier() {
    return (
      SLOT_CONFIG.MAX_MULTIPLIER + this.upgrades.multiplier.MAX_MULTIPLIER * 2
    );
  }

  toggleMaxBet() {
    const maxMultiplier = this.getMaxMultiplier();
    this.multiplier = this.multiplier === 1 ? maxMultiplier : 1;
    this.emitStateChange();
  }

  // Combo system
  incrementCombo() {
    this.comboCount++;
    this.comboMultiplier = Math.min(
      1 + this.comboCount * SLOT_CONFIG.COMBO_BONUS_PER_WIN,
      SLOT_CONFIG.MAX_COMBO_MULTIPLIER
    );
    this.emitStateChange();
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.emitStateChange();
  }

  // Statistics
  recordSpin() {
    this.totalSpins++;
    this.emitStateChange();
  }

  recordWin(amount) {
    this.totalWins++;
    this.winStreak++;

    if (amount > this.biggestWin) {
      this.biggestWin = amount;
    }

    this.emitStateChange();
  }

  recordLoss() {
    this.winStreak = 0;
    this.emitStateChange();
  }

  // Upgrade system
  getUpgradedPayout(symbol) {
    const basePayout = SLOT_CONFIG.PAYOUTS[symbol].basePayout;
    const upgradeLevel = this.upgrades.symbols[symbol];
    const upgradeConfig = SLOT_CONFIG.UPGRADE_SYSTEM.SYMBOL_UPGRADES[symbol];

    if (!upgradeConfig || upgradeLevel === 0) {
      return basePayout;
    }

    return Math.floor(
      basePayout * Math.pow(upgradeConfig.payoutMultiplier, upgradeLevel)
    );
  }

  getUpgradeCost(category, type) {
    const currentLevel = this.upgrades[category][type];
    let upgradeConfig;

    if (category === "symbols") {
      upgradeConfig = SLOT_CONFIG.UPGRADE_SYSTEM.SYMBOL_UPGRADES[type];
    } else if (category === "luck") {
      upgradeConfig = SLOT_CONFIG.UPGRADE_SYSTEM.LUCK_UPGRADES[type];
    } else if (category === "multiplier") {
      upgradeConfig = SLOT_CONFIG.UPGRADE_SYSTEM.MULTIPLIER_UPGRADES[type];
    }

    if (!upgradeConfig || currentLevel >= upgradeConfig.maxLevel) {
      return null;
    }

    return Math.floor(
      upgradeConfig.baseCost *
        Math.pow(upgradeConfig.costMultiplier, currentLevel)
    );
  }

  canAffordUpgrade(category, type) {
    const cost = this.getUpgradeCost(category, type);
    return cost !== null && this.credits >= cost;
  }

  purchaseUpgrade(category, type) {
    const cost = this.getUpgradeCost(category, type);

    if (!this.canAffordUpgrade(category, type)) {
      throw new Error("Cannot afford upgrade");
    }

    this.spendCredits(cost);
    this.upgrades[category][type]++;

    this.eventDispatcher.emit("upgrade_purchased", {
      category,
      type,
      level: this.upgrades[category][type],
      cost,
    });

    this.emitStateChange();
  }

  // Utility methods
  getWinRate() {
    return this.totalSpins > 0 ? (this.totalWins / this.totalSpins) * 100 : 0;
  }

  canAffordSpin() {
    return this.credits >= SLOT_CONFIG.BASE_COST * this.multiplier;
  }

  // State serialization
  serialize() {
    return {
      credits: this.credits,
      jackpot: this.jackpot,
      multiplier: this.multiplier,
      luckMeter: this.luckMeter,
      totalSpins: this.totalSpins,
      totalWins: this.totalWins,
      winStreak: this.winStreak,
      biggestWin: this.biggestWin,
      jackpots: this.jackpots,
      comboCount: this.comboCount,
      comboMultiplier: this.comboMultiplier,
      upgrades: JSON.parse(JSON.stringify(this.upgrades)),
      // FIX: Add canAffordSpin to serialized state
      canAffordSpin: this.canAffordSpin(),
    };
  }

  deserialize(data) {
    Object.assign(this, data);
    this.emitStateChange();
  }

  // Event emission
  emitStateChange() {
    this.eventDispatcher.emit("state_changed", this.serialize());
  }
}
