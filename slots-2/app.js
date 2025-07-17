// Application Entry Point
class SlotMachineApp {
  constructor() {
    this.slotMachine = null;
    this.init();
  }

  async init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.start());
    } else {
      this.start();
    }
  }

  start() {
    try {
      // First inject the HTML structure
      this.injectHTML();

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        // Initialize the slot machine
        this.slotMachine = new EnhancedSlotMachine();

        // Set up global error handling
        this.setupErrorHandling();

        // Set up performance monitoring
        this.setupPerformanceMonitoring();
      }, 100);
    } catch (error) {
      this.handleError("Failed to initialize slot machine", error);
    }
  }

  injectHTML() {
    const container = document.getElementById("game-container");
    if (!container) {
      throw new Error("Game container not found");
    }

    container.innerHTML = `
                <h1 class="slot-title">🎰 MEGA SLOTS 🎰</h1>
      <div class="game-layout">

        <div class="upgrades-panel slots-panel" id="upgrades-panel">
          <h3>🔧 UPGRADES 🔧</h3>
          <div class="upgrade-tabs">
            <button class="upgrade-tab" data-tab="symbols">Symbols</button>
            <button class="upgrade-tab" data-tab="luck">Luck</button>
            <button class="upgrade-tab" data-tab="multiplier">Multiplier</button>
          </div>
          <div class="upgrade-content" id="upgrade-content">
            <!-- Upgrade content will be populated by JavaScript -->
          </div>
        </div>

        <div class="slot-machine-container slots-panel">
          <div class="slot-header">
            <div class="credits-display">
              Credits: <span id="credits-value">500</span>
            </div>
          </div>

          <div class="jackpot-display">
            <div class="jackpot-label">🏆 PROGRESSIVE JACKPOT 🏆</div>
            <div class="jackpot-amount" id="jackpot-amount">1,000</div>
          </div>

          <div class="luck-meter-container">
            <div class="luck-meter-header">
              <div class="luck-label">🍀 LUCK METER 🍀</div>
              <div class="luck-percentage" id="luck-percentage">0%</div>
            </div>
            <div class="luck-meter-track">
              <div class="luck-meter-fill" id="luck-meter-fill"></div>
              <div class="luck-meter-glow" id="luck-meter-glow"></div>
            </div>
            <div class="luck-status" id="luck-status">Keep spinning for better luck!</div>
          </div>

          <div class="reels-container">
            <div class="reel" id="reel-0">
              <div class="symbol">🍒</div>
            </div>
            <div class="reel" id="reel-1">
              <div class="symbol">🍋</div>
            </div>
            <div class="reel" id="reel-2">
              <div class="symbol">🍊</div>
            </div>
          </div>

          <div class="result-message" id="result-message"></div>

          <div class="controls">
            <button class="spin-button" id="spin-btn">
              <span id="spin-text">SPIN</span>
              <br />
              <small id="spin-cost">(Cost: 10)</small>
            </button>

            <div class="secondary-controls">
              <button class="secondary-button" id="auto-spin-btn">Auto Spin</button>
              <button class="secondary-button" id="max-bet-btn">Max Bet</button>
              <button class="secondary-button" id="stats-btn">Stats</button>
            </div>
          </div>

          <div class="stats-panel" id="stats-panel" style="display: none">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Total Spins</div>
                <div class="stat-value" id="total-spins">0</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Wins</div>
                <div class="stat-value" id="total-wins">0</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Win Rate</div>
                <div class="stat-value" id="win-rate">0%</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Biggest Win</div>
                <div class="stat-value" id="biggest-win">0</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Win Streak</div>
                <div class="stat-value" id="win-streak">0</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Jackpots</div>
                <div class="stat-value" id="jackpots">0</div>
              </div>
            </div>
          </div>
        </div>

        <div class="paytable-container slots-panel">
          <div class="paytable-header">
            <h3 class="paytable-title">💰 PAYTABLE 💰</h3>
            <div class="paytable-multiplier">Bet x<span id="bet-multiplier">1</span></div>
          </div>
          
          <div class="paytable-grid" id="paytable-grid">
            <div class="paytable-header-row">
              <div class="paytable-col-header">Symbol</div>
              <div class="paytable-col-header">Name</div>
              <div class="paytable-col-header">Payout</div>
              <div class="paytable-col-header">Odds</div>
            </div>
            <!-- Paytable rows will be populated by JavaScript -->
          </div>
          
          <div class="paytable-footer">
            <div class="paytable-note">💡 Payouts shown are base values × your bet multiplier</div>
          </div>
        </div>
      </div>

      <div class="celebration-overlay" id="celebration-overlay">
        <div class="celebration-content">
          <div class="celebration-message" id="celebration-message">JACKPOT!</div>
          <div class="celebration-details" id="celebration-details"></div>
        </div>
      </div>

      <canvas class="particle-canvas" id="particle-canvas"></canvas>
    `;
  }

  setupErrorHandling() {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.handleError("Global error", event.error);
    });

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.handleError("Unhandled promise rejection", event.reason);
    });
  }

  setupPerformanceMonitoring() {
    // Monitor performance and memory usage
    if (typeof performance !== "undefined" && performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          this.handleWarning("High memory usage detected");
        }
      }, 30000); // Check every 30 seconds
    }
  }

  handleError(message, error) {
    console.error(`[SlotMachine] ${message}:`, error);

    // In a production environment, you might want to send this to a logging service
    // this.sendErrorToLoggingService(message, error);
  }

  handleWarning(message) {
    console.warn(`[SlotMachine] ${message}`);
  }

  // Public API methods for external control
  getSlotMachine() {
    return this.slotMachine;
  }

  getGameState() {
    if (!this.slotMachine) return null;

    return {
      credits: this.slotMachine.credits,
      jackpot: this.slotMachine.jackpot,
      totalSpins: this.slotMachine.totalSpins,
      totalWins: this.slotMachine.totalWins,
      winStreak: this.slotMachine.winStreak,
      biggestWin: this.slotMachine.biggestWin,
      jackpots: this.slotMachine.jackpots,
      luckMeter: this.slotMachine.luckMeter,
      multiplier: this.slotMachine.multiplier,
      isSpinning: this.slotMachine.isSpinning,
      autoSpinActive: this.slotMachine.autoSpinActive,
    };
  }

  // Reset game to initial state
  resetGame() {
    if (this.slotMachine) {
      this.slotMachine.credits = SLOT_CONFIG.INITIAL_CREDITS;
      this.slotMachine.jackpot = SLOT_CONFIG.INITIAL_JACKPOT;
      this.slotMachine.totalSpins = 0;
      this.slotMachine.totalWins = 0;
      this.slotMachine.winStreak = 0;
      this.slotMachine.biggestWin = 0;
      this.slotMachine.jackpots = 0;
      this.slotMachine.luckMeter = 0;
      this.slotMachine.multiplier = 1;
      this.slotMachine.autoSpinActive = false;
      this.slotMachine.isSpinning = false;
      this.slotMachine.comboCount = 0;
      this.slotMachine.comboMultiplier = 1;

      this.slotMachine.updateDisplay();
      this.slotMachine.updateLuckMeterVisuals();
      this.slotMachine.paytable.updateMultipliers();
    }
  }

  // Utility methods for testing/debugging
  addCredits(amount) {
    if (this.slotMachine) {
      this.slotMachine.credits += amount;
      this.slotMachine.updateDisplay();
    }
  }

  setLuckMeter(value) {
    if (this.slotMachine) {
      this.slotMachine.luckMeter = Math.max(0, Math.min(100, value));
      this.slotMachine.updateLuckMeterVisuals();
    }
  }

  triggerJackpot() {
    if (this.slotMachine) {
      this.slotMachine.luckMeter = 100;
      this.slotMachine.updateLuckMeterVisuals();
    }
  }

  // Development/debugging helpers
  getDebugInfo() {
    if (!this.slotMachine) return null;

    return {
      gameState: this.getGameState(),
      particleCount: this.slotMachine.particles.length,
      audioContext: this.slotMachine.audioContext
        ? this.slotMachine.audioContext.state
        : "none",
      canvasSize: {
        width: this.slotMachine.canvas.width,
        height: this.slotMachine.canvas.height,
      },
      config: SLOT_CONFIG,
    };
  }
}

// Initialize the application
let app;

// Create global app instance
if (typeof window !== "undefined") {
  app = new SlotMachineApp();

  // Make app available globally for debugging
  window.SlotMachineApp = app;
}

// Export for use in other environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = SlotMachineApp;
}
