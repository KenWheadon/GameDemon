// Core Game Engine - Pure Business Logic
class GameEngine {
  constructor(eventDispatcher) {
    this.eventDispatcher = eventDispatcher;
    this.isSpinning = false;
  }

  // Generate symbols for reel display (cosmetic)
  generateReelSymbols() {
    const symbols = [];
    for (let i = 0; i < 3; i++) {
      symbols.push(this.getWeightedDisplaySymbol());
    }
    return symbols;
  }

  getWeightedDisplaySymbol() {
    const totalWeight = Object.values(SLOT_CONFIG.REEL_DISPLAY_WEIGHTS).reduce(
      (a, b) => a + b,
      0
    );
    let random = Math.random() * totalWeight;

    for (const [symbol, weight] of Object.entries(
      SLOT_CONFIG.REEL_DISPLAY_WEIGHTS
    )) {
      random -= weight;
      if (random <= 0) return symbol;
    }

    return SLOT_CONFIG.SYMBOLS[0];
  }

  // Determine spin result based on probability system
  calculateSpinResult(gameState) {
    // Check for luck jackpot
    if (gameState.luckMeter >= gameState.getMaxLuck()) {
      return {
        type: "luck_jackpot",
        symbols: ["🌟", "🌟", "🌟"],
        winSymbol: "🌟",
        payout: SLOT_CONFIG.PAYOUTS["🌟"],
      };
    }

    // Calculate win probability
    const totalWinChance = this.calculateTotalWinChance(gameState);
    const random = Math.floor(Math.random() * 10000);
    const shouldWin = random < totalWinChance;

    if (shouldWin) {
      const winSymbol = this.selectWinningSymbol(gameState);
      return {
        type: "win",
        symbols: [winSymbol, winSymbol, winSymbol],
        winSymbol: winSymbol,
        payout: SLOT_CONFIG.PAYOUTS[winSymbol],
      };
    } else {
      const symbols = this.generateLosingCombination();
      return {
        type: "loss",
        symbols: symbols,
        winSymbol: null,
        payout: null,
      };
    }
  }

  calculateTotalWinChance(gameState) {
    const baseProbability = SLOT_CONFIG.TOTAL_BASE_WIN_PROBABILITY;
    const luckBonus =
      gameState.luckMeter * SLOT_CONFIG.LUCK_BONUS_MULTIPLIER * 100;
    return Math.min(baseProbability + luckBonus, 9500); // Cap at 95%
  }

  selectWinningSymbol(gameState) {
    const random = Math.floor(Math.random() * 10000);
    let cumulativeProbability = 0;

    const luckBonus =
      gameState.luckMeter * SLOT_CONFIG.LUCK_BONUS_MULTIPLIER * 100;

    for (const [symbol, baseProbability] of Object.entries(
      SLOT_CONFIG.SYMBOL_PROBABILITIES
    )) {
      const totalBaseProbability = SLOT_CONFIG.TOTAL_BASE_WIN_PROBABILITY;
      const proportionalLuckBonus =
        luckBonus * (baseProbability / totalBaseProbability);
      const adjustedProbability = baseProbability + proportionalLuckBonus;

      cumulativeProbability += adjustedProbability;

      if (random < cumulativeProbability) {
        return symbol;
      }
    }

    return "🍒"; // Fallback
  }

  generateLosingCombination() {
    const symbols = [];
    for (let i = 0; i < 3; i++) {
      symbols.push(this.getWeightedDisplaySymbol());
    }

    // Ensure it's actually a losing combination
    while (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      symbols[2] = this.getWeightedDisplaySymbol();
    }

    return symbols;
  }

  // Calculate payout based on result and game state
  calculatePayout(result, gameState) {
    if (result.type === "loss") {
      return 0;
    }

    if (result.payout.isJackpot || result.type === "luck_jackpot") {
      return gameState.jackpot;
    }

    // Calculate upgraded payout
    const upgradedBasePayout = gameState.getUpgradedPayout(result.winSymbol);
    const basePayout =
      upgradedBasePayout * SLOT_CONFIG.BASE_COST * gameState.multiplier;
    const comboBonus = Math.floor(basePayout * (gameState.comboMultiplier - 1));

    return basePayout + comboBonus;
  }

  // Validate spin attempt
  canSpin(gameState) {
    const cost = SLOT_CONFIG.BASE_COST * gameState.multiplier;
    return !this.isSpinning && gameState.credits >= cost;
  }

  // Calculate spin cost
  getSpinCost(gameState) {
    return SLOT_CONFIG.BASE_COST * gameState.multiplier;
  }

  // Process spin request
  async processSpin(gameState) {
    if (!this.canSpin(gameState)) {
      throw new Error("Cannot spin - insufficient credits or already spinning");
    }

    this.isSpinning = true;

    try {
      // Generate result
      const result = this.calculateSpinResult(gameState);

      // Calculate payout
      const payout = this.calculatePayout(result, gameState);

      // Return complete spin result
      return {
        result,
        payout,
        cost: this.getSpinCost(gameState),
      };
    } finally {
      this.isSpinning = false;
    }
  }

  // Calculate symbol odds for display
  calculateSymbolOdds(symbol, gameState) {
    const baseProbability = SLOT_CONFIG.SYMBOL_PROBABILITIES[symbol];
    const luckBonus = gameState.luckMeter * SLOT_CONFIG.LUCK_BONUS_MULTIPLIER;

    const totalBaseProbability = SLOT_CONFIG.TOTAL_BASE_WIN_PROBABILITY;
    const proportionalBonus =
      luckBonus * (baseProbability / totalBaseProbability);

    const basePercentage = baseProbability / 100;
    const bonusPercentage = proportionalBonus / 100;

    return {
      base: basePercentage,
      bonus: bonusPercentage,
      total: Math.min(basePercentage + bonusPercentage, 95),
    };
  }
}
