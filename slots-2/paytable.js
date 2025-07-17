// Paytable Management System
class PaytableManager {
  constructor(slotMachine) {
    this.slotMachine = slotMachine;
    this.elements = {
      paytableGrid: document.getElementById("paytable-grid"),
      betMultiplier: document.getElementById("bet-multiplier"),
      paytableRows: [],
      paytablePayouts: [],
      paytableOdds: [],
    };

    this.initializePaytable();
  }

  initializePaytable() {
    this.createPaytableRows();
    this.updateElements();
  }

  createPaytableRows() {
    // Clear existing rows (except header)
    const existingRows =
      this.elements.paytableGrid.querySelectorAll(".paytable-row");
    existingRows.forEach((row) => row.remove());

    SLOT_CONFIG.PAYTABLE_SYMBOLS.forEach(({ symbol, name }) => {
      const payout = SLOT_CONFIG.PAYOUTS[symbol];

      // Add safety check for upgrades
      if (!this.slotMachine.upgrades || !this.slotMachine.upgrades.symbols) {
        console.warn(
          "SlotMachine upgrades not initialized, using base payouts"
        );
        const row = this.createPaytableRow(symbol, name, payout, null);
        this.elements.paytableGrid.appendChild(row);
        return;
      }

      const currentLevel = this.slotMachine.upgrades.symbols[symbol] || 0;
      const upgradedPayout = this.calculateUpgradedPayout(symbol, currentLevel);

      const row = this.createPaytableRow(symbol, name, payout, upgradedPayout);
      this.elements.paytableGrid.appendChild(row);
    });

    this.updateElements();
  }

  createPaytableRow(symbol, name, payout, upgradedPayout) {
    const row = document.createElement("div");
    row.className = "paytable-row";
    row.dataset.symbol = symbol;

    const displayPayout = upgradedPayout || payout.basePayout;
    const probability = SLOT_CONFIG.SYMBOL_PROBABILITIES[symbol];
    const basePercentage = (probability / 100).toFixed(2);

    row.innerHTML = `
      <div class="paytable-symbol">${symbol}${symbol}${symbol}</div>
      <div class="paytable-name">${name}</div>
      <div class="paytable-payout" data-base-payout="${displayPayout}">${displayPayout}</div>
      <div class="paytable-odds" data-symbol="${symbol}">
        <span class="odds-value">${basePercentage}%</span>
        <span class="odds-bonus">+0.00%</span>
      </div>
    `;

    return row;
  }

  calculateUpgradedPayout(symbol, level) {
    const basePayout = SLOT_CONFIG.PAYOUTS[symbol].basePayout;
    const upgradeConfig = SLOT_CONFIG.UPGRADE_SYSTEM.SYMBOL_UPGRADES[symbol];

    if (!upgradeConfig || level === 0) {
      return basePayout;
    }

    return Math.floor(
      basePayout * Math.pow(upgradeConfig.payoutMultiplier, level)
    );
  }

  updateElements() {
    this.elements.paytableRows = document.querySelectorAll(".paytable-row");
    this.elements.paytablePayouts =
      document.querySelectorAll(".paytable-payout");
    this.elements.paytableOdds = document.querySelectorAll(".paytable-odds");
  }

  calculateSymbolOdds(symbol) {
    const baseProbability = SLOT_CONFIG.SYMBOL_PROBABILITIES[symbol];
    const luckBonus =
      this.slotMachine.luckMeter * SLOT_CONFIG.LUCK_BONUS_MULTIPLIER;

    // Calculate proportional luck bonus based on symbol rarity
    const totalBaseProbability = SLOT_CONFIG.TOTAL_BASE_WIN_PROBABILITY;
    const proportionalBonus =
      luckBonus * (baseProbability / totalBaseProbability);

    // Convert to percentages for display
    const basePercentage = baseProbability / 100;
    const bonusPercentage = proportionalBonus / 100;

    return {
      base: basePercentage,
      bonus: bonusPercentage,
      total: Math.min(basePercentage + bonusPercentage, 95),
    };
  }

  updateOdds() {
    this.elements.paytableOdds.forEach((oddsEl) => {
      const symbol = oddsEl.dataset.symbol;
      const odds = this.calculateSymbolOdds(symbol);

      const valueEl = oddsEl.querySelector(".odds-value");
      const bonusEl = oddsEl.querySelector(".odds-bonus");

      valueEl.textContent = `${odds.base.toFixed(2)}%`;

      if (odds.bonus > 0.01) {
        bonusEl.textContent = `+${odds.bonus.toFixed(2)}%`;
        bonusEl.classList.add("active");

        const row = oddsEl.closest(".paytable-row");
        if (row) {
          row.classList.add("luck-boosted");
        }
      } else {
        bonusEl.classList.remove("active");

        const row = oddsEl.closest(".paytable-row");
        if (row) {
          row.classList.remove("luck-boosted");
        }
      }
    });
  }

  updateMultipliers() {
    this.elements.betMultiplier.textContent = this.slotMachine.multiplier;

    this.elements.paytablePayouts.forEach((payoutEl) => {
      const basePayout = parseInt(payoutEl.dataset.basePayout);
      const adjustedPayout = basePayout * this.slotMachine.multiplier;
      payoutEl.textContent = adjustedPayout;
    });

    this.updateOdds();
  }

  highlightWinningRow(symbol, isJackpot) {
    const targetRow = Array.from(this.elements.paytableRows).find(
      (row) => row.dataset.symbol === symbol
    );

    if (targetRow) {
      targetRow.classList.add("winning");
      if (isJackpot) {
        targetRow.classList.add("jackpot");
      }

      targetRow.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }

  clearHighlighting() {
    this.elements.paytableRows.forEach((row) => {
      row.classList.remove("winning", "jackpot");
    });
  }

  // Calculate total win chance based on probability system + luck
  calculateTotalWinChance() {
    const baseProbability = SLOT_CONFIG.TOTAL_BASE_WIN_PROBABILITY;

    // Add safety check for slotMachine
    if (!this.slotMachine) {
      return baseProbability;
    }

    const luckBonus =
      this.slotMachine.luckMeter * SLOT_CONFIG.LUCK_BONUS_MULTIPLIER * 100; // Convert to out of 10,000
    return Math.min(baseProbability + luckBonus, 9500); // Cap at 95%
  }

  // Select a winning symbol using proper probability distribution
  selectWinningSymbol() {
    const random = Math.floor(Math.random() * 10000);
    let cumulativeProbability = 0;

    // Add safety check for slotMachine
    const luckBonus = this.slotMachine
      ? this.slotMachine.luckMeter * SLOT_CONFIG.LUCK_BONUS_MULTIPLIER * 100
      : 0;

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

    // Fallback to most common symbol
    return "🍒";
  }
}
