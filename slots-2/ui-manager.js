// UI Manager - Pure DOM Management and User Interaction
class UIManager {
  constructor(eventDispatcher) {
    this.eventDispatcher = eventDispatcher;
    this.elements = {};
    this.activePanel = null;
    this.autoSpinActive = false;

    this.initializeElements();
    this.setupEventListeners();
    this.setupGameEventListeners();
  }

  initializeElements() {
    // Helper function to safely get element with better error handling
    const getElement = (id, required = false) => {
      const element = document.getElementById(id);
      if (!element && required) {
        throw new Error(`Required element with id "${id}" not found`);
      } else if (!element) {
        console.debug(`Optional element with id "${id}" not found`);
      }
      return element;
    };

    // Helper function to safely query elements with better error handling
    const queryElements = (selector, required = false) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0 && required) {
        throw new Error(
          `Required elements for selector "${selector}" not found`
        );
      } else if (elements.length === 0) {
        console.debug(`Optional elements for selector "${selector}" not found`);
      }
      return elements;
    };

    this.elements = {
      // Core game elements (required)
      creditsValue: getElement("credits-value", true),
      jackpotAmount: getElement("jackpot-amount", true),
      spinBtn: getElement("spin-btn", true),
      spinText: getElement("spin-text", true),
      spinCost: getElement("spin-cost", true),
      resultMessage: getElement("result-message", true),

      // Reels (required)
      reels: [
        getElement("reel-0", true),
        getElement("reel-1", true),
        getElement("reel-2", true),
      ].filter((el) => el !== null),
      symbols: queryElements(".symbol", true),

      // Luck meter (optional but expected)
      luckMeterContainer: queryElements(".luck-meter-container")[0],
      luckMeterFill: getElement("luck-meter-fill"),
      luckMeterGlow: getElement("luck-meter-glow"),
      luckPercentage: getElement("luck-percentage"),
      luckStatus: getElement("luck-status"),

      // Controls (optional)
      autoSpinBtn: getElement("auto-spin-btn"),
      maxBetBtn: getElement("max-bet-btn"),
      upgradesBtn: getElement("upgrades-btn"),
      statsBtn: getElement("stats-btn"),

      // Panels (optional)
      upgradesPanel: getElement("upgrades-panel"),
      upgradeContent: getElement("upgrade-content"),
      upgradeTabs: queryElements(".upgrade-tab"),
      statsPanel: getElement("stats-panel"),

      // Stats (optional)
      totalSpins: getElement("total-spins"),
      totalWins: getElement("total-wins"),
      winRate: getElement("win-rate"),
      biggestWin: getElement("biggest-win"),
      winStreakEl: getElement("win-streak"),
      jackpotsEl: getElement("jackpots"),

      // Celebration (optional)
      celebration: getElement("celebration-overlay"),
      celebrationMessage: getElement("celebration-message"),
      celebrationDetails: getElement("celebration-details"),

      // Paytable (optional)
      paytableRows: queryElements(".paytable-row"),
      paytablePayouts: queryElements(".paytable-payout"),
      paytableOdds: queryElements(".paytable-odds"),
      betMultiplier: getElement("bet-multiplier"),

      // Containers (required)
      container: queryElements(".slot-machine-container")[0],
      body: document.body,
    };

    // Validate that we have the minimum required elements
    const requiredElements = [
      "creditsValue",
      "jackpotAmount",
      "spinBtn",
      "resultMessage",
      "body",
    ];

    const missingElements = requiredElements.filter(
      (elementKey) => !this.elements[elementKey]
    );

    if (missingElements.length > 0) {
      throw new Error(
        `Critical elements missing: ${missingElements.join(", ")}`
      );
    }

    // Validate reels
    if (this.elements.reels.length < 3) {
      throw new Error(`Expected 3 reels, found ${this.elements.reels.length}`);
    }

    // Validate symbols
    if (this.elements.symbols.length < 3) {
      throw new Error(
        `Expected at least 3 symbols, found ${this.elements.symbols.length}`
      );
    }

    console.log("UI Manager initialized successfully");
  }

  setupEventListeners() {
    // Helper function to safely add event listeners
    const addListener = (element, event, handler) => {
      if (element) {
        element.addEventListener(event, handler);
        console.log(
          `Added ${event} listener to element:`,
          element.id || element.tagName
        );
      } else {
        console.warn(`Cannot add ${event} listener - element is null`);
      }
    };

    // Spin button - most critical event
    addListener(this.elements.spinBtn, "click", (e) => {
      e.preventDefault();
      console.log("Spin button clicked - emitting SPIN_STARTED event");
      this.eventDispatcher.emit(GAME_EVENTS.SPIN_STARTED);
    });

    // Control buttons
    addListener(this.elements.autoSpinBtn, "click", (e) => {
      e.preventDefault();
      this.toggleAutoSpin();
    });

    addListener(this.elements.maxBetBtn, "click", (e) => {
      e.preventDefault();
      this.eventDispatcher.emit("toggle_max_bet");
    });

    addListener(this.elements.upgradesBtn, "click", (e) => {
      e.preventDefault();
      this.togglePanel("upgrades");
    });

    addListener(this.elements.statsBtn, "click", (e) => {
      e.preventDefault();
      this.togglePanel("stats");
    });

    // Upgrade tabs
    this.elements.upgradeTabs?.forEach((tab) => {
      addListener(tab, "click", (e) => {
        e.preventDefault();
        this.switchUpgradeTab(e.target.dataset.tab);
      });
    });

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        console.log("Space key pressed - emitting SPIN_STARTED event");
        this.eventDispatcher.emit(GAME_EVENTS.SPIN_STARTED);
      }
    });

    // Reel interactions
    this.elements.reels?.forEach((reel, index) => {
      if (reel) {
        addListener(reel, "mouseenter", () => {
          this.playReelHoverEffect(reel);
        });

        addListener(reel, "click", (e) => {
          e.preventDefault();
          this.playReelClickEffect(reel);
        });
      }
    });

    console.log("Event listeners set up successfully");
  }

  setupGameEventListeners() {
    console.log("Setting up game event listeners...");

    // Listen to game state changes
    this.eventDispatcher.on(GAME_EVENTS.STATE_CHANGED, (state) => {
      console.log("State changed:", state);
      this.updateDisplay(state);
    });

    // Listen to spin events
    this.eventDispatcher.on(GAME_EVENTS.SPIN_STARTED, () => {
      console.log("Received SPIN_STARTED event in UI Manager");
      this.handleSpinStart();
    });

    this.eventDispatcher.on(GAME_EVENTS.SPIN_RESULT, (data) => {
      console.log("Received SPIN_RESULT event:", data);
      this.handleSpinResult(data);
    });

    // Listen to luck changes
    this.eventDispatcher.on(GAME_EVENTS.LUCK_CHANGED, (data) => {
      this.updateLuckMeter(data);
    });

    // Listen to win/loss events
    this.eventDispatcher.on(GAME_EVENTS.WIN, (data) => {
      this.handleWin(data);
    });

    this.eventDispatcher.on(GAME_EVENTS.LOSS, () => {
      this.handleLoss();
    });

    this.eventDispatcher.on(GAME_EVENTS.JACKPOT_WIN, (data) => {
      this.handleJackpotWin(data);
    });

    // Listen to upgrade events
    this.eventDispatcher.on(GAME_EVENTS.UPGRADE_PURCHASED, () => {
      this.refreshUpgradeDisplay();
    });

    // Listen to celebration events
    this.eventDispatcher.on(GAME_EVENTS.CELEBRATION_START, (data) => {
      this.showCelebration(data.title, data.details);
    });

    console.log("Game event listeners set up successfully");
  }

  // Display updates
  updateDisplay(state) {
    console.log("Updating display with state:", state);

    // Update credits
    if (this.elements.creditsValue) {
      this.elements.creditsValue.textContent = state.credits;
      this.elements.creditsValue.style.color = state.canAffordSpin
        ? "var(--text-jackpot)"
        : "var(--text-danger)";
    }

    // Update jackpot
    if (this.elements.jackpotAmount) {
      this.elements.jackpotAmount.textContent = state.jackpot;
    }

    // Update spin cost
    if (this.elements.spinCost) {
      this.elements.spinCost.textContent = `(Cost: ${
        SLOT_CONFIG.BASE_COST * state.multiplier
      })`;
    }

    // Update spin button state
    if (this.elements.spinBtn) {
      this.elements.spinBtn.disabled = !state.canAffordSpin;
      console.log("Spin button disabled:", !state.canAffordSpin);
    }

    // Update max bet button
    if (this.elements.maxBetBtn) {
      const maxMultiplier =
        SLOT_CONFIG.MAX_MULTIPLIER +
        state.upgrades.multiplier.MAX_MULTIPLIER * 2;
      this.elements.maxBetBtn.textContent =
        state.multiplier === 1 ? "Max Bet" : "Min Bet";
      this.elements.maxBetBtn.classList.toggle(
        "active",
        state.multiplier === maxMultiplier
      );
    }

    // Update bet multiplier display
    if (this.elements.betMultiplier) {
      this.elements.betMultiplier.textContent = state.multiplier;
    }

    // Update stats
    this.updateStatsDisplay(state);
  }

  updateStatsDisplay(state) {
    if (this.elements.totalSpins)
      this.elements.totalSpins.textContent = state.totalSpins;
    if (this.elements.totalWins)
      this.elements.totalWins.textContent = state.totalWins;
    if (this.elements.winRate) {
      this.elements.winRate.textContent =
        state.totalSpins > 0
          ? Math.round((state.totalWins / state.totalSpins) * 100) + "%"
          : "0%";
    }
    if (this.elements.biggestWin)
      this.elements.biggestWin.textContent = state.biggestWin;
    if (this.elements.winStreakEl)
      this.elements.winStreakEl.textContent = state.winStreak;
    if (this.elements.jackpotsEl)
      this.elements.jackpotsEl.textContent = state.jackpots;
  }

  updateLuckMeter(data) {
    // Animate luck meter fill
    this.animateLuckMeter(data.oldValue, data.newValue);

    // Update luck percentage
    if (this.elements.luckPercentage) {
      this.elements.luckPercentage.textContent = `${Math.floor(
        data.newValue
      )}%`;
    }

    // Update luck status
    this.updateLuckStatus(data.newValue, data.maxValue);
  }

  animateLuckMeter(from, to) {
    if (!this.elements.luckMeterFill) return;

    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentLuck = from + (to - from) * easedProgress;

      this.elements.luckMeterFill.style.width = `${currentLuck}%`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  updateLuckStatus(luckLevel, maxLuck) {
    if (!this.elements.luckStatus || !this.elements.luckMeterContainer) return;

    let statusMessage = "";
    let statusClass = "";

    if (luckLevel >= maxLuck) {
      statusMessage = "🌟 INSTANT JACKPOT READY! 🌟";
      statusClass = "max-luck";
    } else if (luckLevel >= SLOT_CONFIG.THRESHOLDS.HIGH_LUCK_THRESHOLD) {
      statusMessage = "🔥 Luck is burning hot! Almost there! 🔥";
      statusClass = "lucky";
    } else if (luckLevel >= SLOT_CONFIG.THRESHOLDS.MEDIUM_LUCK_THRESHOLD) {
      statusMessage = "✨ Feeling very lucky! ✨";
      statusClass = "lucky";
    } else if (luckLevel >= SLOT_CONFIG.THRESHOLDS.LOW_LUCK_THRESHOLD) {
      statusMessage = "🍀 Luck is building up! 🍀";
      statusClass = "lucky";
    } else if (luckLevel >= SLOT_CONFIG.THRESHOLDS.BUILDING_LUCK_THRESHOLD) {
      statusMessage = "📈 Getting luckier with each spin!";
      statusClass = "";
    } else {
      statusMessage = "Keep spinning for better luck!";
      statusClass = "";
    }

    this.elements.luckStatus.textContent = statusMessage;
    this.elements.luckStatus.className = `luck-status ${statusClass}`;

    // Update container classes
    this.elements.luckMeterContainer.className = `luck-meter-container ${statusClass}`;

    // Update percentage styling
    if (this.elements.luckPercentage) {
      this.elements.luckPercentage.classList.toggle(
        "high-luck",
        luckLevel >= SLOT_CONFIG.THRESHOLDS.HIGH_LUCK_THRESHOLD
      );
    }

    // Update glow effect
    if (this.elements.luckMeterGlow) {
      this.elements.luckMeterGlow.classList.toggle(
        "active",
        luckLevel >= SLOT_CONFIG.THRESHOLDS.LOW_LUCK_THRESHOLD
      );
    }
  }

  // Spin handling
  handleSpinStart() {
    console.log("Handling spin start in UI Manager");

    if (this.elements.spinBtn) {
      this.elements.spinBtn.disabled = true;
    }

    if (this.elements.spinText) {
      this.elements.spinText.textContent = "SPINNING...";
    }

    // Start reel spinning animation
    this.elements.reels?.forEach((reel, index) => {
      setTimeout(() => {
        reel.classList.add("spinning");
      }, index * SLOT_CONFIG.REEL_SPIN_DELAY);
    });

    // Container pulse effect
    if (this.elements.container) {
      this.elements.container.style.transform = "scale(1.01)";
      setTimeout(() => {
        this.elements.container.style.transform = "";
      }, 200);
    }
  }

  handleSpinResult(data) {
    const { result } = data;
    console.log("Handling spin result:", result);

    // Stop reels and show symbols
    this.elements.reels?.forEach((reel, index) => {
      setTimeout(() => {
        reel.classList.remove("spinning");
        if (this.elements.symbols[index]) {
          this.elements.symbols[index].textContent = result.symbols[index];
        }

        // Bounce effect when reel stops
        reel.style.transform = "scale(1.1)";
        setTimeout(() => {
          reel.style.transform = "";
        }, 200);
      }, SLOT_CONFIG.REEL_STOP_BASE_TIME + index * SLOT_CONFIG.REEL_STOP_DELAY);
    });

    // Re-enable spin button
    setTimeout(() => {
      if (this.elements.spinBtn) {
        this.elements.spinBtn.disabled = false;
      }

      if (this.elements.spinText) {
        this.elements.spinText.textContent = "SPIN";
      }
    }, SLOT_CONFIG.RESULT_PROCESS_DELAY);
  }

  handleWin(data) {
    this.showMessage(data.message, "win");

    // Add winner effects to reels
    this.elements.reels?.forEach((reel, index) => {
      setTimeout(() => {
        reel.classList.add(data.isJackpot ? "jackpot" : "winner");
      }, index * 100);
    });

    // Clear effects after duration
    setTimeout(() => {
      this.elements.reels?.forEach((reel) => {
        reel.classList.remove("winner", "jackpot");
      });
    }, SLOT_CONFIG.WINNER_EFFECT_DURATION);
  }

  handleLoss() {
    this.showMessage("Try again!", "loss");
  }

  handleJackpotWin(data) {
    this.eventDispatcher.emit(GAME_EVENTS.CELEBRATION_START, {
      title: data.title,
      details: data.details,
    });
  }

  // Message display
  showMessage(message, type) {
    if (!this.elements.resultMessage) return;

    this.elements.resultMessage.textContent = message;
    this.elements.resultMessage.className = `result-message ${type}`;

    setTimeout(() => {
      this.elements.resultMessage.textContent = "";
      this.elements.resultMessage.className = "result-message";
    }, SLOT_CONFIG.RESULT_MESSAGE_DURATION);
  }

  // Celebration
  showCelebration(title, details) {
    if (!this.elements.celebration) return;

    if (this.elements.celebrationMessage) {
      this.elements.celebrationMessage.textContent = title;
    }

    if (this.elements.celebrationDetails) {
      this.elements.celebrationDetails.textContent = details;
    }

    this.elements.celebration.classList.add("active");

    setTimeout(() => {
      this.elements.celebration.classList.remove("active");
      this.eventDispatcher.emit(GAME_EVENTS.CELEBRATION_END);
    }, SLOT_CONFIG.CELEBRATION_DURATION);
  }

  // Panel management
  togglePanel(panelType) {
    console.log(`Toggling panel: ${panelType}`);
    const panelElement = this.elements[`${panelType}Panel`];
    const buttonElement = this.elements[`${panelType}Btn`];

    if (!panelElement || !buttonElement) {
      console.warn(`Panel or button not found for ${panelType}`);
      return;
    }

    const isVisible = panelElement.style.display !== "none";

    // Close current panel
    if (this.activePanel && this.activePanel !== panelType) {
      const currentPanel = this.elements[`${this.activePanel}Panel`];
      const currentButton = this.elements[`${this.activePanel}Btn`];

      if (currentPanel) currentPanel.style.display = "none";
      if (currentButton) {
        currentButton.classList.remove("active");
        currentButton.textContent =
          this.activePanel.charAt(0).toUpperCase() + this.activePanel.slice(1);
      }
    }

    // Toggle requested panel
    panelElement.style.display = isVisible ? "none" : "block";
    buttonElement.textContent = isVisible
      ? panelType.charAt(0).toUpperCase() + panelType.slice(1)
      : `Hide ${panelType.charAt(0).toUpperCase() + panelType.slice(1)}`;

    buttonElement.classList.toggle("active", !isVisible);

    this.activePanel = isVisible ? null : panelType;

    // Initialize panel content
    if (!isVisible) {
      if (panelType === "upgrades") {
        this.renderUpgrades("symbols");
      } else if (panelType === "stats") {
        // Stats are updated automatically via state changes
      }
    }
  }

  // Auto spin
  toggleAutoSpin() {
    this.autoSpinActive = !this.autoSpinActive;

    if (this.elements.autoSpinBtn) {
      this.elements.autoSpinBtn.textContent = this.autoSpinActive
        ? "Stop Auto"
        : "Auto Spin";
      this.elements.autoSpinBtn.classList.toggle("active", this.autoSpinActive);
    }

    this.eventDispatcher.emit("auto_spin_toggled", {
      active: this.autoSpinActive,
    });
  }

  // Upgrade tab switching
  switchUpgradeTab(tabName) {
    this.elements.upgradeTabs?.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });
    this.renderUpgrades(tabName);
  }

  // Render upgrades (placeholder - will be implemented)
  renderUpgrades(category) {
    this.eventDispatcher.emit("render_upgrades", { category });
  }

  refreshUpgradeDisplay() {
    const activeTab = document.querySelector(".upgrade-tab.active");
    if (activeTab) {
      this.renderUpgrades(activeTab.dataset.tab);
    }
  }

  // Reel effects
  playReelHoverEffect(reel) {
    const symbol = reel.querySelector(".symbol");
    if (symbol) {
      symbol.style.transform = "translateY(-3px) scale(1.1)";
      symbol.style.filter = "brightness(1.2)";
      this.eventDispatcher.emit(GAME_EVENTS.PLAY_SOUND, { soundName: "tick" });
    }
  }

  playReelClickEffect(reel) {
    const symbol = reel.querySelector(".symbol");
    if (symbol) {
      symbol.style.transform = "translateY(0) scale(1.05)";
      setTimeout(() => {
        symbol.style.transform = "";
        symbol.style.filter = "";
      }, 200);
    }
  }

  // Visual effects
  shakeScreen() {
    this.elements.body?.classList.add("screen-shake");
    setTimeout(() => {
      this.elements.body?.classList.remove("screen-shake");
    }, 500);
  }

  pulseScreen() {
    if (this.elements.container) {
      this.elements.container.style.transform = "scale(1.02)";
      this.elements.container.style.filter = "brightness(1.1)";
      setTimeout(() => {
        this.elements.container.style.transform = "";
        this.elements.container.style.filter = "";
      }, 300);
    }
  }
}
