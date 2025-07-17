// Enhanced Slot Machine Core Class
class EnhancedSlotMachine {
  constructor() {
    // Game State
    this.credits = SLOT_CONFIG.INITIAL_CREDITS;
    this.jackpot = SLOT_CONFIG.INITIAL_JACKPOT;
    this.totalSpins = 0;
    this.totalWins = 0;
    this.winStreak = 0;
    this.biggestWin = 0;
    this.jackpots = 0;
    this.multiplier = 1;
    this.autoSpinActive = false;
    this.isSpinning = false;

    // Combo System
    this.comboMultiplier = 1;
    this.comboCount = 0;

    // Luck Meter System
    this.luckMeter = 0;

    // CRITICAL: Initialize upgrade system FIRST before any other systems
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

    // Systems
    this.particles = [];
    this.audioContext = null;
    this.sounds = {};

    // Initialize in correct order
    this.initializeElements();
    this.initializePaytable(); // Now safe to call since upgrades exist
    this.setupEventListeners();
    this.initializeParticles();
    this.initializeAudio();
    this.updateDisplay();
    this.updateLuckMeterVisuals();
  }

  initializeElements() {
    // Helper function to safely get element
    const getElement = (id) => {
      const element = document.getElementById(id);
      if (!element) {
        console.warn(`Element with id "${id}" not found`);
      }
      return element;
    };

    // Helper function to safely query elements
    const queryElements = (selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`No elements found for selector "${selector}"`);
      }
      return elements;
    };

    this.elements = {
      creditsValue: getElement("credits-value"),
      jackpotAmount: getElement("jackpot-amount"),
      reels: [
        getElement("reel-0"),
        getElement("reel-1"),
        getElement("reel-2"),
      ].filter((el) => el !== null), // Remove null elements
      symbols: queryElements(".symbol"),
      resultMessage: getElement("result-message"),
      spinBtn: getElement("spin-btn"),
      spinText: getElement("spin-text"),
      spinCost: getElement("spin-cost"),
      autoSpinBtn: getElement("auto-spin-btn"),
      maxBetBtn: getElement("max-bet-btn"),
      upgradesBtn: getElement("upgrades-btn"),
      statsBtn: getElement("stats-btn"),
      upgradesPanel: getElement("upgrades-panel"),
      upgradeContent: getElement("upgrade-content"),
      upgradeTabs: queryElements(".upgrade-tab"),
      statsPanel: getElement("stats-panel"),
      celebration: getElement("celebration-overlay"),
      celebrationMessage: getElement("celebration-message"),
      celebrationDetails: getElement("celebration-details"),
      totalSpins: getElement("total-spins"),
      totalWins: getElement("total-wins"),
      winRate: getElement("win-rate"),
      biggestWin: getElement("biggest-win"),
      winStreakEl: getElement("win-streak"),
      jackpotsEl: getElement("jackpots"),
      container: document.querySelector(".slot-machine-container"),
      body: document.body,
      luckMeterContainer: document.querySelector(".luck-meter-container"),
      luckMeterFill: getElement("luck-meter-fill"),
      luckMeterGlow: getElement("luck-meter-glow"),
      luckPercentage: getElement("luck-percentage"),
      luckStatus: getElement("luck-status"),
    };

    // Verify critical elements exist
    const criticalElements = [
      "creditsValue",
      "jackpotAmount",
      "spinBtn",
      "resultMessage",
    ];

    criticalElements.forEach((elementKey) => {
      if (!this.elements[elementKey]) {
        throw new Error(`Critical element "${elementKey}" not found in DOM`);
      }
    });
  }

  initializePaytable() {
    this.paytable = new PaytableManager(this);
  }

  setupEventListeners() {
    this.elements.spinBtn.addEventListener("click", () => this.spin());
    this.elements.autoSpinBtn.addEventListener("click", () =>
      this.toggleAutoSpin()
    );
    this.elements.maxBetBtn.addEventListener("click", () =>
      this.toggleMaxBet()
    );
    this.elements.upgradesBtn.addEventListener("click", () =>
      this.toggleUpgrades()
    );
    this.elements.statsBtn.addEventListener("click", () => this.toggleStats());

    // Upgrade tab listeners
    this.elements.upgradeTabs.forEach((tab) => {
      tab.addEventListener("click", (e) =>
        this.switchUpgradeTab(e.target.dataset.tab)
      );
    });

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !this.isSpinning) {
        e.preventDefault();
        this.spin();
      }
    });

    this.elements.reels.forEach((reel) => {
      reel.addEventListener("mouseenter", () => {
        if (!this.isSpinning) {
          this.playReelHoverEffect(reel);
        }
      });

      reel.addEventListener("click", () => {
        if (!this.isSpinning) {
          this.playReelClickEffect(reel);
        }
      });
    });
  }

  playReelHoverEffect(reel) {
    const symbol = reel.querySelector(".symbol");
    symbol.style.transform = "translateY(-3px) scale(1.1)";
    symbol.style.filter = "brightness(1.2)";
    this.playSound("tick");
  }

  playReelClickEffect(reel) {
    const symbol = reel.querySelector(".symbol");
    symbol.style.transform = "translateY(0) scale(1.05)";
    setTimeout(() => {
      symbol.style.transform = "";
      symbol.style.filter = "";
    }, 200);
  }

  // Luck Meter System (updated for upgrades)
  increaseLuckMeter() {
    const oldLuck = this.luckMeter;
    const increment = this.getLuckIncrement();
    const maxLuck = this.getMaxLuck();

    this.luckMeter = Math.min(this.luckMeter + increment, maxLuck);

    this.animateLuckMeter(oldLuck, this.luckMeter);
    this.updateLuckMeterVisuals();

    if (this.luckMeter >= maxLuck) {
      this.playSound("jackpot");
    } else if (this.luckMeter >= SLOT_CONFIG.THRESHOLDS.HIGH_LUCK_THRESHOLD) {
      this.playSound("bigWin");
    } else if (this.luckMeter >= SLOT_CONFIG.THRESHOLDS.LUCK_SOUND_TRIGGER) {
      this.playSound("win");
    }
  }

  reduceLuckMeter() {
    const oldLuck = this.luckMeter;
    const decrement = this.getLuckDecrement();

    this.luckMeter = Math.max(this.luckMeter - decrement, 0);

    this.animateLuckMeter(oldLuck, this.luckMeter);
    this.updateLuckMeterVisuals();
    this.paytable.updateOdds();
  }

  resetLuckMeter() {
    const oldLuck = this.luckMeter;
    this.luckMeter = 0;

    this.animateLuckMeter(oldLuck, 0);
    this.updateLuckMeterVisuals();
    this.paytable.updateOdds();
  }

  animateLuckMeter(from, to) {
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentLuck = from + (to - from) * easedProgress;

      this.elements.luckMeterFill.style.width = `${currentLuck}%`;
      this.elements.luckPercentage.textContent = `${Math.floor(currentLuck)}%`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.updateLuckMeterVisuals();
      }
    };

    requestAnimationFrame(animate);
  }

  updateLuckMeterVisuals() {
    const luckLevel = this.luckMeter;
    const maxLuck = this.getMaxLuck();

    this.elements.luckPercentage.textContent = `${Math.floor(luckLevel)}%`;

    let statusMessage = "";
    let statusClass = "";

    if (luckLevel >= maxLuck) {
      statusMessage = "🌟 INSTANT JACKPOT READY! 🌟";
      statusClass = "max-luck";
      this.elements.luckMeterContainer.classList.add("max-luck");
    } else if (luckLevel >= SLOT_CONFIG.THRESHOLDS.HIGH_LUCK_THRESHOLD) {
      statusMessage = "🔥 Luck is burning hot! Almost there! 🔥";
      statusClass = "lucky";
      this.elements.luckMeterContainer.classList.remove("max-luck");
      this.elements.luckMeterContainer.classList.add("lucky");
    } else if (luckLevel >= SLOT_CONFIG.THRESHOLDS.MEDIUM_LUCK_THRESHOLD) {
      statusMessage = "✨ Feeling very lucky! ✨";
      statusClass = "lucky";
      this.elements.luckMeterContainer.classList.remove("max-luck");
      this.elements.luckMeterContainer.classList.add("lucky");
    } else if (luckLevel >= SLOT_CONFIG.THRESHOLDS.LOW_LUCK_THRESHOLD) {
      statusMessage = "🍀 Luck is building up! 🍀";
      statusClass = "lucky";
      this.elements.luckMeterContainer.classList.remove("max-luck");
      this.elements.luckMeterContainer.classList.add("lucky");
    } else if (luckLevel >= SLOT_CONFIG.THRESHOLDS.BUILDING_LUCK_THRESHOLD) {
      statusMessage = "📈 Getting luckier with each spin!";
      statusClass = "";
      this.elements.luckMeterContainer.classList.remove("max-luck", "lucky");
    } else {
      statusMessage = "Keep spinning for better luck!";
      statusClass = "";
      this.elements.luckMeterContainer.classList.remove("max-luck", "lucky");
    }

    this.elements.luckStatus.textContent = statusMessage;
    this.elements.luckStatus.className = `luck-status ${statusClass}`;

    if (luckLevel >= SLOT_CONFIG.THRESHOLDS.HIGH_LUCK_THRESHOLD) {
      this.elements.luckPercentage.classList.add("high-luck");
    } else {
      this.elements.luckPercentage.classList.remove("high-luck");
    }

    if (luckLevel >= SLOT_CONFIG.THRESHOLDS.LOW_LUCK_THRESHOLD) {
      this.elements.luckMeterGlow.classList.add("active");
    } else {
      this.elements.luckMeterGlow.classList.remove("active");
    }

    this.paytable.updateOdds();
  }

  // Helper methods for upgrade system
  getMaxLuck() {
    return SLOT_CONFIG.MAX_LUCK + this.upgrades.luck.MAX_LUCK * 25;
  }

  getLuckIncrement() {
    return SLOT_CONFIG.LUCK_INCREMENT + this.upgrades.luck.LUCK_GAIN * 1;
  }

  getLuckDecrement() {
    const baseDecrement = SLOT_CONFIG.LUCK_DECREMENT;
    const retention = this.upgrades.luck.LUCK_RETENTION * 0.2; // 20% reduction per level
    return Math.max(1, Math.floor(baseDecrement * (1 - retention)));
  }

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

  getUpgradeCost(category, type, currentLevel) {
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

  // Audio System
  initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
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
      this.sounds = {
        spin: () => {},
        win: () => {},
        jackpot: () => {},
        tick: () => {},
        bigWin: () => {},
        combo: () => {},
      };
    }
  }

  playSound(soundName) {
    try {
      if (this.sounds[soundName]) {
        this.sounds[soundName]();
      }
    } catch (error) {
      // Silently fail for audio errors
    }
  }

  playTone(frequency, duration, type = "sine") {
    if (!this.audioContext) return;

    try {
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }

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
      // Silently fail for audio errors
    }
  }

  playJackpotSound() {
    SLOT_CONFIG.AUDIO_SETTINGS.JACKPOT_FREQUENCIES.forEach((freq, index) => {
      setTimeout(
        () => this.playTone(freq, 0.3, "triangle"),
        index * SLOT_CONFIG.AUDIO_SETTINGS.JACKPOT_DELAY
      );
    });
  }

  playBigWinSound() {
    SLOT_CONFIG.AUDIO_SETTINGS.BIG_WIN_FREQUENCIES.forEach((freq, index) => {
      setTimeout(
        () => this.playTone(freq, 0.2, "sawtooth"),
        index * SLOT_CONFIG.AUDIO_SETTINGS.BIG_WIN_DELAY
      );
    });
  }

  playComboSound() {
    for (let i = 0; i < 3; i++) {
      setTimeout(
        () =>
          this.playTone(
            SLOT_CONFIG.AUDIO_SETTINGS.COMBO_BASE_FREQUENCY +
              i * SLOT_CONFIG.AUDIO_SETTINGS.COMBO_FREQUENCY_INCREMENT,
            0.1,
            "square"
          ),
        i * SLOT_CONFIG.AUDIO_SETTINGS.COMBO_DELAY
      );
    }
  }

  // Symbol Generation (for reel display only)
  getWeightedSymbol() {
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

  // Main Game Logic
  async spin() {
    if (this.isSpinning) return;

    const cost = SLOT_CONFIG.BASE_COST * this.multiplier;
    if (this.credits < cost) {
      this.showMessage("Not enough credits!", "error");
      this.shakeScreen();
      return;
    }

    this.isSpinning = true;
    this.credits -= cost;
    this.jackpot += Math.floor(cost * SLOT_CONFIG.JACKPOT_CONTRIBUTION);
    this.totalSpins++;

    this.updateDisplay();
    this.playSound("spin");

    this.elements.reels.forEach((reel, index) => {
      setTimeout(() => {
        reel.classList.add("spinning");
      }, index * SLOT_CONFIG.REEL_SPIN_DELAY);
    });

    this.elements.spinBtn.disabled = true;
    this.elements.spinText.textContent = "SPINNING...";

    this.elements.container.style.transform = "scale(1.01)";
    setTimeout(() => {
      this.elements.container.style.transform = "";
    }, 200);

    const result = await this.generateResult();

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.elements.reels[i].classList.remove("spinning");
        this.elements.symbols[i].textContent = result.symbols[i];
        this.playSound("tick");

        this.elements.reels[i].style.transform = "scale(1.1)";
        setTimeout(() => {
          this.elements.reels[i].style.transform = "";
        }, 200);
      }, SLOT_CONFIG.REEL_STOP_BASE_TIME + i * SLOT_CONFIG.REEL_STOP_DELAY);
    }

    setTimeout(() => {
      this.processResult(result);
      this.isSpinning = false;
      this.elements.spinBtn.disabled = false;
      this.elements.spinText.textContent = "SPIN";

      if (
        this.autoSpinActive &&
        this.credits >= SLOT_CONFIG.BASE_COST * this.multiplier
      ) {
        setTimeout(() => this.spin(), SLOT_CONFIG.AUTO_SPIN_DELAY);
      }
    }, SLOT_CONFIG.RESULT_PROCESS_DELAY);
  }

  async generateResult() {
    if (this.luckMeter >= this.getMaxLuck()) {
      return {
        symbols: ["🌟", "🌟", "🌟"],
        isWin: true,
        winSymbol: "🌟",
        payout: SLOT_CONFIG.PAYOUTS["🌟"],
        isLuckJackpot: true,
      };
    }

    const totalWinChance = this.paytable.calculateTotalWinChance();
    const random = Math.floor(Math.random() * 10000);
    const shouldWin = random < totalWinChance;

    if (shouldWin) {
      const winSymbol = this.paytable.selectWinningSymbol();
      return {
        symbols: [winSymbol, winSymbol, winSymbol],
        isWin: true,
        winSymbol: winSymbol,
        payout: SLOT_CONFIG.PAYOUTS[winSymbol],
        isLuckJackpot: false,
      };
    } else {
      const symbols = [];
      for (let i = 0; i < 3; i++) {
        symbols.push(this.getWeightedSymbol());
      }

      while (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
        symbols[2] = this.getWeightedSymbol();
      }

      return {
        symbols,
        isWin: false,
        winSymbol: null,
        payout: null,
        isLuckJackpot: false,
      };
    }
  }

  processResult(result) {
    this.elements.resultMessage.className = "result-message";

    if (result.isWin) {
      this.totalWins++;
      this.winStreak++;
      this.comboCount++;

      if (result.payout.isJackpot || result.isLuckJackpot) {
        this.credits += this.jackpot;
        this.jackpots++;

        if (result.isLuckJackpot) {
          this.showCelebration(
            "LUCK JACKPOT!",
            `Your luck paid off! You won ${this.jackpot} credits!`
          );
        } else {
          this.showCelebration(
            result.payout.name,
            `You won ${this.jackpot} credits!`
          );
        }

        this.createParticleExplosion(600, 500);
        this.playSound("jackpot");
        this.shakeScreen();
        this.jackpot = SLOT_CONFIG.INITIAL_JACKPOT;
        this.elements.resultMessage.className = "result-message jackpot";
      } else {
        const upgradedPayout = this.getUpgradedPayout(result.winSymbol);
        const basePayout =
          upgradedPayout * SLOT_CONFIG.BASE_COST * this.multiplier;
        const comboBonus = Math.floor(basePayout * (this.comboMultiplier - 1));
        const totalPayout = basePayout + comboBonus;

        this.credits += totalPayout;

        if (totalPayout > SLOT_CONFIG.THRESHOLDS.BIG_WIN_AMOUNT) {
          this.playSound("bigWin");
          this.createParticleExplosion(200, 250);
        } else {
          this.playSound("win");
          this.createParticleExplosion(100, 150);
        }

        this.elements.resultMessage.className = "result-message win";

        if (totalPayout > this.biggestWin) {
          this.biggestWin = totalPayout;
        }
      }

      this.comboMultiplier = Math.min(
        1 + this.comboCount * SLOT_CONFIG.COMBO_BONUS_PER_WIN,
        SLOT_CONFIG.MAX_COMBO_MULTIPLIER
      );

      let message = result.payout.name;
      if (result.payout.isJackpot || result.isLuckJackpot) {
        // Jackpot message already handled above
      } else {
        const upgradedPayout = this.getUpgradedPayout(result.winSymbol);
        const basePayout =
          upgradedPayout * SLOT_CONFIG.BASE_COST * this.multiplier;
        const comboBonus = Math.floor(basePayout * (this.comboMultiplier - 1));
        const totalPayout = basePayout + comboBonus;

        if (comboBonus > 0) {
          message += ` (${this.comboCount}x COMBO!)`;
          this.showComboDisplay();
          this.playSound("combo");
        }

        if (this.luckMeter > 50 && !result.isLuckJackpot) {
          message += ` 🍀 Lucky!`;
        }

        this.showMessage(message, "win");
      }

      this.elements.reels.forEach((reel, index) => {
        setTimeout(() => {
          reel.classList.add(
            result.payout.isJackpot || result.isLuckJackpot
              ? "jackpot"
              : "winner"
          );
        }, index * 100);
      });

      if (!result.payout.isJackpot && !result.isLuckJackpot) {
        const upgradedPayout = this.getUpgradedPayout(result.winSymbol);
        const basePayout =
          upgradedPayout * SLOT_CONFIG.BASE_COST * this.multiplier;
        const totalPayout =
          basePayout + Math.floor(basePayout * (this.comboMultiplier - 1));

        if (totalPayout > SLOT_CONFIG.THRESHOLDS.PULSE_SCREEN_AMOUNT) {
          this.pulseScreen();
        }
      }

      if (result.payout.isJackpot || result.isLuckJackpot) {
        this.resetLuckMeter();
      } else {
        this.reduceLuckMeter();
      }

      this.paytable.highlightWinningRow(
        result.winSymbol,
        result.payout.isJackpot || result.isLuckJackpot
      );
    } else {
      this.winStreak = 0;
      this.comboCount = 0;
      this.comboMultiplier = 1;
      this.showMessage("Try again!", "loss");

      this.increaseLuckMeter();
    }

    setTimeout(() => {
      this.elements.reels.forEach((reel) => {
        reel.classList.remove("winner", "jackpot");
      });
      this.paytable.clearHighlighting();
    }, SLOT_CONFIG.WINNER_EFFECT_DURATION);

    this.updateDisplay();
  }

  // Visual Effects
  shakeScreen() {
    this.elements.body.classList.add("screen-shake");
    setTimeout(() => {
      this.elements.body.classList.remove("screen-shake");
    }, 500);
  }

  pulseScreen() {
    this.elements.container.style.transform = "scale(1.02)";
    this.elements.container.style.filter = "brightness(1.1)";
    setTimeout(() => {
      this.elements.container.style.transform = "";
      this.elements.container.style.filter = "";
    }, 300);
  }

  showMessage(message, type) {
    this.elements.resultMessage.textContent = message;
    this.elements.resultMessage.className = `result-message ${type}`;

    setTimeout(() => {
      this.elements.resultMessage.textContent = "";
      this.elements.resultMessage.className = "result-message";
    }, SLOT_CONFIG.RESULT_MESSAGE_DURATION);
  }

  showComboDisplay() {
    const comboDiv = document.createElement("div");
    comboDiv.className = "combo-display";
    comboDiv.textContent = `${this.comboCount}x COMBO MULTIPLIER!`;

    this.elements.resultMessage.parentNode.insertBefore(
      comboDiv,
      this.elements.resultMessage
    );

    setTimeout(() => {
      comboDiv.remove();
    }, SLOT_CONFIG.COMBO_DISPLAY_DURATION);
  }

  showCelebration(title, details) {
    this.elements.celebrationMessage.textContent = title;
    this.elements.celebrationDetails.textContent = details;
    this.elements.celebration.classList.add("active");

    setTimeout(() => {
      this.elements.celebration.classList.remove("active");
    }, SLOT_CONFIG.CELEBRATION_DURATION);
  }

  // Particle System
  initializeParticles() {
    this.canvas = document.getElementById("particle-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    this.animateParticles();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticleExplosion(particleCount, spread) {
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

  // Upgrade System UI
  toggleUpgrades() {
    const isVisible = this.elements.upgradesPanel.style.display !== "none";
    this.elements.upgradesPanel.style.display = isVisible ? "none" : "block";
    this.elements.upgradesBtn.textContent = isVisible
      ? "Upgrades"
      : "Hide Upgrades";

    if (isVisible) {
      this.elements.upgradesBtn.classList.remove("active");
    } else {
      this.elements.upgradesBtn.classList.add("active");
      this.renderUpgrades("symbols");
    }
  }

  switchUpgradeTab(tabName) {
    this.elements.upgradeTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });
    this.renderUpgrades(tabName);
  }

  renderUpgrades(category) {
    const content = this.elements.upgradeContent;
    content.innerHTML = "";

    if (category === "symbols") {
      Object.entries(SLOT_CONFIG.UPGRADE_SYSTEM.SYMBOL_UPGRADES).forEach(
        ([symbol, config]) => {
          const currentLevel = this.upgrades.symbols[symbol];
          const upgradeCost = this.getUpgradeCost(
            "symbols",
            symbol,
            currentLevel
          );
          const currentPayout = this.getUpgradedPayout(symbol);
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
                    !upgradeCost || this.credits < upgradeCost ? "disabled" : ""
                  }>
            ${upgradeCost ? `${upgradeCost} credits` : "MAX"}
          </button>
        `;
          content.appendChild(upgradeItem);
        }
      );
    } else if (category === "luck") {
      Object.entries(SLOT_CONFIG.UPGRADE_SYSTEM.LUCK_UPGRADES).forEach(
        ([type, config]) => {
          const currentLevel = this.upgrades.luck[type];
          const upgradeCost = this.getUpgradeCost("luck", type, currentLevel);

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
                    !upgradeCost || this.credits < upgradeCost ? "disabled" : ""
                  }>
            ${upgradeCost ? `${upgradeCost} credits` : "MAX"}
          </button>
        `;
          content.appendChild(upgradeItem);
        }
      );
    } else if (category === "multiplier") {
      Object.entries(SLOT_CONFIG.UPGRADE_SYSTEM.MULTIPLIER_UPGRADES).forEach(
        ([type, config]) => {
          const currentLevel = this.upgrades.multiplier[type];
          const upgradeCost = this.getUpgradeCost(
            "multiplier",
            type,
            currentLevel
          );

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
                    !upgradeCost || this.credits < upgradeCost ? "disabled" : ""
                  }>
            ${upgradeCost ? `${upgradeCost} credits` : "MAX"}
          </button>
        `;
          content.appendChild(upgradeItem);
        }
      );
    }

    // Add event listeners to upgrade buttons
    content.querySelectorAll(".upgrade-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const category = e.target.dataset.category;
        const type = e.target.dataset.type;
        this.purchaseUpgrade(category, type);
      });
    });
  }

  purchaseUpgrade(category, type) {
    const currentLevel = this.upgrades[category][type];
    const upgradeCost = this.getUpgradeCost(category, type, currentLevel);

    if (!upgradeCost || this.credits < upgradeCost) {
      return;
    }

    this.credits -= upgradeCost;
    this.upgrades[category][type]++;

    this.updateDisplay();
    this.renderUpgrades(
      document.querySelector(".upgrade-tab.active").dataset.tab
    );
    this.paytable.updateMultipliers();

    this.playSound("win");
  }

  // Controls
  toggleAutoSpin() {
    this.autoSpinActive = !this.autoSpinActive;
    this.elements.autoSpinBtn.textContent = this.autoSpinActive
      ? "Stop Auto"
      : "Auto Spin";

    if (this.autoSpinActive) {
      this.elements.autoSpinBtn.classList.add("active");
    } else {
      this.elements.autoSpinBtn.classList.remove("active");
    }

    if (this.autoSpinActive && !this.isSpinning) {
      this.spin();
    }
  }

  toggleMaxBet() {
    const maxMultiplier =
      SLOT_CONFIG.MAX_MULTIPLIER + this.upgrades.multiplier.MAX_MULTIPLIER * 2;
    this.multiplier = this.multiplier === 1 ? maxMultiplier : 1;
    this.elements.maxBetBtn.textContent =
      this.multiplier === 1 ? "Max Bet" : "Min Bet";

    if (this.multiplier === maxMultiplier) {
      this.elements.maxBetBtn.classList.add("active");
    } else {
      this.elements.maxBetBtn.classList.remove("active");
    }

    this.updateDisplay();
    this.paytable.updateMultipliers();
  }

  toggleStats() {
    const isVisible = this.elements.statsPanel.style.display !== "none";
    this.elements.statsPanel.style.display = isVisible ? "none" : "block";
    this.elements.statsBtn.textContent = isVisible ? "Stats" : "Hide Stats";

    if (isVisible) {
      this.elements.statsBtn.classList.remove("active");
    } else {
      this.elements.statsBtn.classList.add("active");
      this.updateStatsDisplay();
    }
  }

  updateDisplay() {
    this.elements.creditsValue.textContent = this.credits;
    this.elements.jackpotAmount.textContent = this.jackpot;
    this.elements.spinCost.textContent = `(Cost: ${
      SLOT_CONFIG.BASE_COST * this.multiplier
    })`;

    this.elements.spinBtn.disabled =
      this.credits < SLOT_CONFIG.BASE_COST * this.multiplier || this.isSpinning;

    if (this.credits < SLOT_CONFIG.BASE_COST * this.multiplier) {
      this.elements.creditsValue.style.color = "var(--text-danger)";
    } else {
      this.elements.creditsValue.style.color = "var(--text-jackpot)";
    }
  }

  updateStatsDisplay() {
    this.elements.totalSpins.textContent = this.totalSpins;
    this.elements.totalWins.textContent = this.totalWins;
    this.elements.winRate.textContent =
      this.totalSpins > 0
        ? Math.round((this.totalWins / this.totalSpins) * 100) + "%"
        : "0%";
    this.elements.biggestWin.textContent = this.biggestWin;
    this.elements.winStreakEl.textContent = this.winStreak;
    this.elements.jackpotsEl.textContent = this.jackpots;
  }
}
