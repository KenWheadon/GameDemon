// Refactored Slot Machine - Clean Architecture Orchestrator
class EnhancedSlotMachine {
  constructor() {
    // Initialize event system
    this.eventDispatcher = new EventDispatcher();

    // Initialize core systems
    this.gameState = new GameState(this.eventDispatcher);
    this.gameEngine = new GameEngine(this.eventDispatcher);
    this.uiManager = new UIManager(this.eventDispatcher);
    this.audioManager = new AudioManager(this.eventDispatcher);
    this.effectsManager = new EffectsManager(this.eventDispatcher);
    this.upgradeManager = new UpgradeManager(
      this.eventDispatcher,
      this.gameState
    );
    this.paytableManager = new PaytableManager(
      this.eventDispatcher,
      this.gameState,
      this.gameEngine
    );

    // Game control state
    this.autoSpinActive = false;
    this.autoSpinTimeout = null;

    this.setupGameEventHandlers();
    this.initializeGame();
  }

  setupGameEventHandlers() {
    // Core game flow
    this.eventDispatcher.on(GAME_EVENTS.SPIN_STARTED, () => {
      this.handleSpinRequest();
    });

    // Auto spin control
    this.eventDispatcher.on("auto_spin_toggled", (data) => {
      this.autoSpinActive = data.active;
      if (this.autoSpinActive) {
        this.scheduleAutoSpin();
      } else {
        this.cancelAutoSpin();
      }
    });

    // Max bet toggle
    this.eventDispatcher.on("toggle_max_bet", () => {
      this.gameState.toggleMaxBet();
    });

    // Upgrade rendering
    this.eventDispatcher.on("render_upgrades", (data) => {
      this.upgradeManager.renderUpgrades(data.category);
    });

    // Error handling
    this.eventDispatcher.on(GAME_EVENTS.ERROR, (error) => {
      console.error("Game Error:", error);
      this.handleGameError(error);
    });

    // Audio status monitoring
    this.setupAudioStatusMonitoring();
  }

  setupAudioStatusMonitoring() {
    // Monitor audio status changes
    const updateAudioStatus = () => {
      const status = this.audioManager.getAudioStatus();
      this.eventDispatcher.emit("audio_status_changed", status);
    };

    // Initial status
    updateAudioStatus();

    // Monitor for changes
    setInterval(updateAudioStatus, 1000);
  }

  async handleSpinRequest() {
    try {
      // Validate spin
      if (!this.gameEngine.canSpin(this.gameState)) {
        if (
          this.gameState.credits < this.gameEngine.getSpinCost(this.gameState)
        ) {
          this.uiManager.showMessage("Not enough credits!", "error");
          this.effectsManager.shakeScreen();
        }
        return;
      }

      // Record spin start
      this.gameState.recordSpin();

      // Deduct credits and add to jackpot
      const spinCost = this.gameEngine.getSpinCost(this.gameState);
      this.gameState.spendCredits(spinCost);
      this.gameState.addToJackpot(
        Math.floor(spinCost * SLOT_CONFIG.JACKPOT_CONTRIBUTION)
      );

      // Play spin sound
      this.audioManager.playSound("spin");

      // Process spin through engine
      const spinData = await this.gameEngine.processSpin(this.gameState);

      // Emit spin result
      this.eventDispatcher.emit(GAME_EVENTS.SPIN_RESULT, spinData);

      // Process result
      await this.processSpinResult(spinData);

      // Schedule next auto spin if active
      if (this.autoSpinActive && this.gameState.canAffordSpin()) {
        this.scheduleAutoSpin();
      }
    } catch (error) {
      this.eventDispatcher.emit(GAME_EVENTS.ERROR, error);
    }
  }

  async processSpinResult(spinData) {
    const { result, payout } = spinData;

    // Wait for reel animation to complete
    await this.waitForReelAnimation();

    if (result.type === "loss") {
      this.handleLoss();
    } else {
      this.handleWin(result, payout);
    }
  }

  handleWin(result, payout) {
    // Update game state
    this.gameState.recordWin(payout);
    this.gameState.incrementCombo();

    // Add credits
    if (result.payout.isJackpot || result.type === "luck_jackpot") {
      const jackpotWon = this.gameState.winJackpot();
      this.handleJackpotWin(result, jackpotWon);
    } else {
      this.gameState.addCredits(payout);
      this.handleRegularWin(result, payout);
    }

    // Update luck meter
    if (result.payout.isJackpot || result.type === "luck_jackpot") {
      this.gameState.resetLuck();
    } else {
      this.gameState.decreaseLuck();
    }

    // Highlight paytable
    this.paytableManager.highlightWinningRow(
      result.winSymbol,
      result.payout.isJackpot || result.type === "luck_jackpot"
    );
  }

  handleRegularWin(result, payout) {
    // Create win message
    let message = result.payout.name;

    if (this.gameState.comboCount > 1) {
      message += ` (${this.gameState.comboCount}x COMBO!)`;
      this.showComboDisplay();
      this.audioManager.playSound("combo");
    }

    if (this.gameState.luckMeter > 50) {
      message += ` 🍀 Lucky!`;
    }

    // Emit win event
    this.eventDispatcher.emit(GAME_EVENTS.WIN, {
      symbol: result.winSymbol,
      payout: payout,
      isJackpot: false,
      message: message,
      comboMultiplier: this.gameState.comboMultiplier,
    });

    // Play appropriate sound
    if (payout > SLOT_CONFIG.THRESHOLDS.BIG_WIN_AMOUNT) {
      this.audioManager.playSound("bigWin");
      this.effectsManager.createParticleExplosion(200, 250);
    } else {
      this.audioManager.playSound("win");
      this.effectsManager.createParticleExplosion(100, 150);
    }

    // Screen effects
    if (payout > SLOT_CONFIG.THRESHOLDS.PULSE_SCREEN_AMOUNT) {
      this.effectsManager.pulseScreen();
    }
  }

  handleJackpotWin(result, jackpotAmount) {
    const title =
      result.type === "luck_jackpot" ? "LUCK JACKPOT!" : result.payout.name;
    const details =
      result.type === "luck_jackpot"
        ? `Your luck paid off! You won ${jackpotAmount} credits!`
        : `You won ${jackpotAmount} credits!`;

    // Emit jackpot win event
    this.eventDispatcher.emit(GAME_EVENTS.JACKPOT_WIN, {
      title: title,
      details: details,
      amount: jackpotAmount,
      isLuckJackpot: result.type === "luck_jackpot",
    });

    // Major effects
    this.audioManager.playSound("jackpot");
    this.effectsManager.createParticleExplosion(600, 500);
    this.effectsManager.shakeScreen();
  }

  handleLoss() {
    // Update game state
    this.gameState.recordLoss();
    this.gameState.resetCombo();
    this.gameState.increaseLuck();

    // Emit loss event
    this.eventDispatcher.emit(GAME_EVENTS.LOSS);
  }

  showComboDisplay() {
    const comboDiv = document.createElement("div");
    comboDiv.className = "combo-display";
    comboDiv.textContent = `${this.gameState.comboCount}x COMBO MULTIPLIER!`;

    const resultMessage = document.getElementById("result-message");
    if (resultMessage && resultMessage.parentNode) {
      resultMessage.parentNode.insertBefore(comboDiv, resultMessage);

      setTimeout(() => {
        comboDiv.remove();
      }, SLOT_CONFIG.COMBO_DISPLAY_DURATION);
    }
  }

  // Auto spin management
  scheduleAutoSpin() {
    this.cancelAutoSpin();
    this.autoSpinTimeout = setTimeout(() => {
      if (this.autoSpinActive && this.gameState.canAffordSpin()) {
        this.eventDispatcher.emit(GAME_EVENTS.SPIN_STARTED);
      }
    }, SLOT_CONFIG.AUTO_SPIN_DELAY);
  }

  cancelAutoSpin() {
    if (this.autoSpinTimeout) {
      clearTimeout(this.autoSpinTimeout);
      this.autoSpinTimeout = null;
    }
  }

  // Utility methods
  async waitForReelAnimation() {
    return new Promise((resolve) => {
      setTimeout(resolve, SLOT_CONFIG.RESULT_PROCESS_DELAY);
    });
  }

  handleGameError(error) {
    console.error("Game Error:", error);
    this.uiManager.showMessage("Game Error Occurred", "error");
    this.cancelAutoSpin();
    this.autoSpinActive = false;
  }

  initializeGame() {
    // Initial state update
    this.gameState.emitStateChange();

    // Initialize paytable
    this.paytableManager.initializePaytable();
  }

  // Public API for external control
  getGameState() {
    return this.gameState.serialize();
  }

  resetGame() {
    this.cancelAutoSpin();
    this.autoSpinActive = false;
    this.gameState.reset();
    this.paytableManager.initializePaytable();
  }

  addCredits(amount) {
    this.gameState.addCredits(amount);
  }

  setLuckMeter(value) {
    this.gameState.luckMeter = Math.max(
      0,
      Math.min(this.gameState.getMaxLuck(), value)
    );
    this.gameState.emitStateChange();
  }

  triggerJackpot() {
    this.gameState.luckMeter = this.gameState.getMaxLuck();
    this.gameState.emitStateChange();
  }

  // Cleanup
  destroy() {
    this.cancelAutoSpin();
    this.eventDispatcher.removeAllListeners();

    // Cleanup systems
    if (this.effectsManager) this.effectsManager.destroy();
    if (this.audioManager) this.audioManager.destroy();
  }
}

// Enhanced Audio Manager with User Gesture Compliance
class AudioManager {
  constructor(eventDispatcher) {
    this.eventDispatcher = eventDispatcher;
    this.audioContext = null;
    this.sounds = {};
    this.audioEnabled = false;
    this.userHasInteracted = false;
    this.pendingSounds = [];

    this.setupEventListeners();
    this.setupUserInteractionDetection();
  }

  setupEventListeners() {
    this.eventDispatcher.on(GAME_EVENTS.PLAY_SOUND, (data) => {
      this.playSound(data.soundName);
    });
  }

  setupUserInteractionDetection() {
    // List of user interaction events
    const userEvents = ["click", "touchstart", "keydown", "mousedown"];

    const handleUserInteraction = () => {
      if (!this.userHasInteracted) {
        this.userHasInteracted = true;
        this.initializeAudio();

        // Remove listeners after first interaction
        userEvents.forEach((event) => {
          document.removeEventListener(event, handleUserInteraction);
        });

        // Play any pending sounds
        this.processPendingSounds();
      }
    };

    // Add listeners for user interaction
    userEvents.forEach((event) => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });
  }

  initializeAudio() {
    try {
      // Only initialize after user interaction
      if (!this.userHasInteracted) {
        return;
      }

      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Resume context if suspended
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }

      this.audioEnabled = true;

      this.sounds = {
        spin: () =>
          this.playTone(
            SLOT_CONFIG.AUDIO_SETTINGS.SPIN_FREQUENCY,
            SLOT_CONFIG.AUDIO_SETTINGS.SPIN_DURATION,
            "sine"
          ),
        win: () =>
          this.playTone(
            SLOT_CONFIG.AUDIO_SETTINGS.WIN_FREQUENCY,
            SLOT_CONFIG.AUDIO_SETTINGS.WIN_DURATION,
            "triangle"
          ),
        jackpot: () => this.playJackpotSound(),
        tick: () =>
          this.playTone(
            SLOT_CONFIG.AUDIO_SETTINGS.TICK_FREQUENCY,
            SLOT_CONFIG.AUDIO_SETTINGS.TICK_DURATION,
            "square"
          ),
        bigWin: () => this.playBigWinSound(),
        combo: () => this.playComboSound(),
      };
    } catch (error) {
      console.warn("Audio initialization failed:", error);
      this.audioEnabled = false;
      this.createSilentSounds();
    }
  }

  createSilentSounds() {
    // Fallback silent sounds
    this.sounds = {
      spin: () => {},
      win: () => {},
      jackpot: () => {},
      tick: () => {},
      bigWin: () => {},
      combo: () => {},
    };
  }

  processPendingSounds() {
    // Play any sounds that were queued before audio was initialized
    this.pendingSounds.forEach((soundName) => {
      this.playSound(soundName);
    });
    this.pendingSounds = [];
  }

  playSound(soundName) {
    try {
      // If audio not initialized yet, queue the sound
      if (!this.userHasInteracted) {
        this.pendingSounds.push(soundName);
        return;
      }

      // If audio is disabled, do nothing
      if (!this.audioEnabled || !this.audioContext) {
        return;
      }

      // Resume context if suspended
      if (this.audioContext.state === "suspended") {
        this.audioContext
          .resume()
          .then(() => {
            if (this.sounds[soundName]) {
              this.sounds[soundName]();
            }
          })
          .catch((error) => {
            console.warn("Could not resume audio context:", error);
          });
      } else if (this.sounds[soundName]) {
        this.sounds[soundName]();
      }
    } catch (error) {
      console.warn("Audio playback error:", error);
    }
  }

  playTone(frequency, duration, type = "sine") {
    if (!this.audioContext || !this.audioEnabled) return;

    try {
      // Double-check context state
      if (this.audioContext.state === "suspended") {
        this.audioContext
          .resume()
          .then(() => {
            this.createTone(frequency, duration, type);
          })
          .catch((error) => {
            console.warn("Could not resume audio context for tone:", error);
          });
      } else {
        this.createTone(frequency, duration, type);
      }
    } catch (error) {
      console.warn("Tone creation error:", error);
    }
  }

  createTone(frequency, duration, type) {
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(
        SLOT_CONFIG.AUDIO_SETTINGS.VOLUME,
        this.audioContext.currentTime
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn("Oscillator creation error:", error);
    }
  }

  playJackpotSound() {
    if (!this.audioEnabled) return;

    SLOT_CONFIG.AUDIO_SETTINGS.JACKPOT_FREQUENCIES.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, "triangle");
      }, index * SLOT_CONFIG.AUDIO_SETTINGS.JACKPOT_DELAY);
    });
  }

  playBigWinSound() {
    if (!this.audioEnabled) return;

    SLOT_CONFIG.AUDIO_SETTINGS.BIG_WIN_FREQUENCIES.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, "sawtooth");
      }, index * SLOT_CONFIG.AUDIO_SETTINGS.BIG_WIN_DELAY);
    });
  }

  playComboSound() {
    if (!this.audioEnabled) return;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(
          SLOT_CONFIG.AUDIO_SETTINGS.COMBO_BASE_FREQUENCY +
            i * SLOT_CONFIG.AUDIO_SETTINGS.COMBO_FREQUENCY_INCREMENT,
          0.1,
          "square"
        );
      }, i * SLOT_CONFIG.AUDIO_SETTINGS.COMBO_DELAY);
    }
  }

  // Public methods for audio control
  enableAudio() {
    if (this.userHasInteracted && this.audioContext) {
      this.audioEnabled = true;
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
    }
  }

  disableAudio() {
    this.audioEnabled = false;
    if (this.audioContext && this.audioContext.state === "running") {
      this.audioContext.suspend();
    }
  }

  isAudioEnabled() {
    return this.audioEnabled && this.userHasInteracted;
  }

  getAudioStatus() {
    return {
      enabled: this.audioEnabled,
      userHasInteracted: this.userHasInteracted,
      contextState: this.audioContext
        ? this.audioContext.state
        : "not_initialized",
      pendingSounds: this.pendingSounds.length,
    };
  }

  destroy() {
    this.disableAudio();
    this.pendingSounds = [];

    if (this.audioContext) {
      this.audioContext.close().catch((error) => {
        console.warn("Error closing audio context:", error);
      });
    }
  }
}

// Simple Effects Manager for now
class EffectsManager {
  constructor(eventDispatcher) {
    this.eventDispatcher = eventDispatcher;
    this.particles = [];
    this.initializeParticles();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventDispatcher.on(GAME_EVENTS.PARTICLE_EXPLOSION, (data) => {
      this.createParticleExplosion(data.particleCount, data.spread);
    });

    this.eventDispatcher.on(GAME_EVENTS.SCREEN_SHAKE, () => {
      this.shakeScreen();
    });

    this.eventDispatcher.on(GAME_EVENTS.SCREEN_PULSE, () => {
      this.pulseScreen();
    });
  }

  initializeParticles() {
    this.canvas = document.getElementById("particle-canvas");
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.animateParticles();
  }

  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  createParticleExplosion(particleCount, spread) {
    if (!this.canvas) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = Math.random() * 6 + 3;
      const size = Math.random() * 6 + 3;

      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 100,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        decay: Math.random() * 0.015 + 0.01,
        color: this.getRandomColor(),
        size: size,
        gravity: Math.random() * 0.2 + 0.1,
        bounce: Math.random() * 0.5 + 0.5,
      });
    }

    if (this.particles.length > SLOT_CONFIG.MAX_PARTICLES) {
      this.particles = this.particles.slice(-SLOT_CONFIG.MAX_PARTICLES);
    }
  }

  getRandomColor() {
    return SLOT_CONFIG.PARTICLE_COLORS[
      Math.floor(Math.random() * SLOT_CONFIG.PARTICLE_COLORS.length)
    ];
  }

  animateParticles() {
    if (!this.canvas || !this.ctx) return;

    try {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.life -= particle.decay;

        if (particle.x <= 0 || particle.x >= this.canvas.width) {
          particle.vx *= -particle.bounce;
        }
        if (particle.y >= this.canvas.height) {
          particle.vy *= -particle.bounce;
          particle.y = this.canvas.height;
        }

        if (particle.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = particle.life;
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    } catch (error) {
      // Silently handle canvas errors
    }

    requestAnimationFrame(() => this.animateParticles());
  }

  shakeScreen() {
    document.body?.classList.add("screen-shake");
    setTimeout(() => {
      document.body?.classList.remove("screen-shake");
    }, 500);
  }

  pulseScreen() {
    const container = document.querySelector(".slot-machine-container");
    if (container) {
      container.style.transform = "scale(1.02)";
      container.style.filter = "brightness(1.1)";
      setTimeout(() => {
        container.style.transform = "";
        container.style.filter = "";
      }, 300);
    }
  }

  destroy() {
    this.particles = [];
    if (this.canvas) {
      this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Upgrade Manager
class UpgradeManager {
  constructor(eventDispatcher, gameState) {
    this.eventDispatcher = eventDispatcher;
    this.gameState = gameState;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventDispatcher.on("render_upgrades", (data) => {
      this.renderUpgrades(data.category);
    });
  }

  renderUpgrades(category) {
    const content = document.getElementById("upgrade-content");
    if (!content) return;

    content.innerHTML = "";

    if (category === "symbols") {
      this.renderSymbolUpgrades(content);
    } else if (category === "luck") {
      this.renderLuckUpgrades(content);
    } else if (category === "multiplier") {
      this.renderMultiplierUpgrades(content);
    }
  }

  renderSymbolUpgrades(content) {
    Object.entries(SLOT_CONFIG.UPGRADE_SYSTEM.SYMBOL_UPGRADES).forEach(
      ([symbol, config]) => {
        const currentLevel = this.gameState.upgrades.symbols[symbol];
        const upgradeCost = this.gameState.getUpgradeCost("symbols", symbol);
        const currentPayout = this.gameState.getUpgradedPayout(symbol);
        const nextPayout =
          currentLevel < config.maxLevel
            ? Math.floor(
                SLOT_CONFIG.PAYOUTS[symbol].basePayout *
                  Math.pow(config.payoutMultiplier, currentLevel + 1)
              )
            : currentPayout;

        const upgradeItem = document.createElement("div");
        upgradeItem.className = "upgrade-item";
        upgradeItem.innerHTML = `
        <div class="upgrade-info">
          <span class="upgrade-symbol">${symbol}</span>
          <div class="upgrade-details">
            <div class="upgrade-title">${config.description}</div>
            <div class="upgrade-stats">Level ${currentLevel}/${
          config.maxLevel
        } | Payout: ${currentPayout} → ${nextPayout}</div>
          </div>
        </div>
        <button class="upgrade-button" data-category="symbols" data-type="${symbol}" 
                ${
                  !upgradeCost || this.gameState.credits < upgradeCost
                    ? "disabled"
                    : ""
                }>
          ${upgradeCost ? `${upgradeCost} credits` : "MAX"}
        </button>
      `;

        const button = upgradeItem.querySelector(".upgrade-button");
        button.addEventListener("click", () => {
          this.purchaseUpgrade("symbols", symbol);
        });

        content.appendChild(upgradeItem);
      }
    );
  }

  renderLuckUpgrades(content) {
    Object.entries(SLOT_CONFIG.UPGRADE_SYSTEM.LUCK_UPGRADES).forEach(
      ([type, config]) => {
        const currentLevel = this.gameState.upgrades.luck[type];
        const upgradeCost = this.gameState.getUpgradeCost("luck", type);

        const upgradeItem = document.createElement("div");
        upgradeItem.className = "upgrade-item";
        upgradeItem.innerHTML = `
        <div class="upgrade-info">
          <span class="upgrade-symbol">🍀</span>
          <div class="upgrade-details">
            <div class="upgrade-title">${config.description}</div>
            <div class="upgrade-stats">Level ${currentLevel}/${
          config.maxLevel
        }</div>
          </div>
        </div>
        <button class="upgrade-button" data-category="luck" data-type="${type}" 
                ${
                  !upgradeCost || this.gameState.credits < upgradeCost
                    ? "disabled"
                    : ""
                }>
          ${upgradeCost ? `${upgradeCost} credits` : "MAX"}
        </button>
      `;

        const button = upgradeItem.querySelector(".upgrade-button");
        button.addEventListener("click", () => {
          this.purchaseUpgrade("luck", type);
        });

        content.appendChild(upgradeItem);
      }
    );
  }

  renderMultiplierUpgrades(content) {
    Object.entries(SLOT_CONFIG.UPGRADE_SYSTEM.MULTIPLIER_UPGRADES).forEach(
      ([type, config]) => {
        const currentLevel = this.gameState.upgrades.multiplier[type];
        const upgradeCost = this.gameState.getUpgradeCost("multiplier", type);

        const upgradeItem = document.createElement("div");
        upgradeItem.className = "upgrade-item";
        upgradeItem.innerHTML = `
        <div class="upgrade-info">
          <span class="upgrade-symbol">⚡</span>
          <div class="upgrade-details">
            <div class="upgrade-title">${config.description}</div>
            <div class="upgrade-stats">Level ${currentLevel}/${
          config.maxLevel
        }</div>
          </div>
        </div>
        <button class="upgrade-button" data-category="multiplier" data-type="${type}" 
                ${
                  !upgradeCost || this.gameState.credits < upgradeCost
                    ? "disabled"
                    : ""
                }>
          ${upgradeCost ? `${upgradeCost} credits` : "MAX"}
        </button>
      `;

        const button = upgradeItem.querySelector(".upgrade-button");
        button.addEventListener("click", () => {
          this.purchaseUpgrade("multiplier", type);
        });

        content.appendChild(upgradeItem);
      }
    );
  }

  purchaseUpgrade(category, type) {
    try {
      this.gameState.purchaseUpgrade(category, type);
      this.eventDispatcher.emit(GAME_EVENTS.PLAY_SOUND, { soundName: "win" });
    } catch (error) {
      console.warn("Could not purchase upgrade:", error.message);
    }
  }
}

// Enhanced Paytable Manager
class PaytableManager {
  constructor(eventDispatcher, gameState, gameEngine) {
    this.eventDispatcher = eventDispatcher;
    this.gameState = gameState;
    this.gameEngine = gameEngine;
    this.elements = {
      paytableGrid: document.getElementById("paytable-grid"),
      betMultiplier: document.getElementById("bet-multiplier"),
      paytableRows: [],
      paytablePayouts: [],
      paytableOdds: [],
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventDispatcher.on(GAME_EVENTS.STATE_CHANGED, () => {
      this.updateMultipliers();
    });

    this.eventDispatcher.on(GAME_EVENTS.UPGRADE_PURCHASED, () => {
      this.updateMultipliers();
    });
  }

  initializePaytable() {
    this.createPaytableRows();
    this.updateElements();
  }

  createPaytableRows() {
    if (!this.elements.paytableGrid) return;

    // Clear existing rows (except header)
    const existingRows =
      this.elements.paytableGrid.querySelectorAll(".paytable-row");
    existingRows.forEach((row) => row.remove());

    SLOT_CONFIG.PAYTABLE_SYMBOLS.forEach(({ symbol, name }) => {
      const payout = SLOT_CONFIG.PAYOUTS[symbol];
      const currentLevel = this.gameState.upgrades.symbols[symbol] || 0;
      const upgradedPayout = this.gameState.getUpgradedPayout(symbol);

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

  updateElements() {
    this.elements.paytableRows = document.querySelectorAll(".paytable-row");
    this.elements.paytablePayouts =
      document.querySelectorAll(".paytable-payout");
    this.elements.paytableOdds = document.querySelectorAll(".paytable-odds");
  }

  updateMultipliers() {
    if (this.elements.betMultiplier) {
      this.elements.betMultiplier.textContent = this.gameState.multiplier;
    }

    this.elements.paytablePayouts.forEach((payoutEl) => {
      const basePayout = parseInt(payoutEl.dataset.basePayout);
      const adjustedPayout = basePayout * this.gameState.multiplier;
      payoutEl.textContent = adjustedPayout;
    });

    this.updateOdds();
  }

  updateOdds() {
    this.elements.paytableOdds.forEach((oddsEl) => {
      const symbol = oddsEl.dataset.symbol;
      const odds = this.gameEngine.calculateSymbolOdds(symbol, this.gameState);

      const valueEl = oddsEl.querySelector(".odds-value");
      const bonusEl = oddsEl.querySelector(".odds-bonus");

      if (valueEl) {
        valueEl.textContent = `${odds.base.toFixed(2)}%`;
      }

      if (bonusEl) {
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
      }
    });
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
}
