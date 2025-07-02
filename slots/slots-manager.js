/**
 * SlotMachineManager - Game Integration Class for Slot Machine System
 * Handles game-specific integration, UI management, and advanced features
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class SlotMachineManager {
  constructor(gameInstance, options = {}) {
    this.game = gameInstance;
    
    // Configuration options
    this.options = {
      // UI settings
      containerId: 'slot-machine-container',
      enablePaytable: true,
      enableStats: true,
      enableHistory: false,
      
      // Integration settings
      enableAchievements: true,
      enableAudio: true,
      enableParticles: true,
      
      // Game-specific settings
      creditSource: 'trainingScore', // Where to get credits from game state
      rewardTarget: 'player', // Where to apply rewards
      
      // Advanced features
      enableAutoPlay: false,
      enableTurboMode: false,
      enableBonusGames: false,
      
      // Debug settings
      enableDebugLogs: false,
      
      ...options
    };

    // Core components
    this.slotMachine = null;
    this.uiElements = new Map();
    this.isInitialized = false;
    
    // UI state
    this.currentView = 'machine'; // 'machine', 'paytable', 'stats', 'history'
    this.celebrationActive = false;
    this.particleSystem = null;
    
    // Game integration
    this.achievementCallbacks = new Map();
    this.rewardProcessors = new Map();
    
    // Auto-play state
    this.autoPlayState = {
      active: false,
      spinsRemaining: 0,
      stopOnWin: false,
      stopOnLoss: false
    };

    this.log('SlotMachineManager initialized');
    this.init();
  }

  /**
   * Initialize the slot machine manager
   */
  async init() {
    try {
      this.log('Initializing SlotMachineManager...');

      // Create core slot machine
      this.slotMachine = new SlotMachine({
        enableDebugLogs: this.options.enableDebugLogs,
        enableAudio: this.options.enableAudio,
        enableParticles: this.options.enableParticles
      });

      // Set up event listeners
      this.setupSlotMachineEvents();
      this.setupUIEvents();

      // Set up game integration
      if (this.game) {
        this.setupGameIntegration();
      }

      // Initialize default configuration
      this.setupDefaultConfiguration();

      this.isInitialized = true;
      this.log('SlotMachineManager initialized successfully');

      return true;
    } catch (error) {
      console.error('Failed to initialize SlotMachineManager:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Set up default slot machine configuration based on your existing setup
   */
  setupDefaultConfiguration() {
    // Configure symbols (from your SLOT_CONFIG)
    this.slotMachine.setSymbols([
      { name: 'vanilla', emoji: '🍦', image: 'images/slot_vanilla.png', weight: 20, color: '#f5e6d3' },
      { name: 'chocolate', emoji: '🍫', image: 'images/slot_chocolate.png', weight: 20, color: '#8b4513' },
      { name: 'strawberry', emoji: '🍓', image: 'images/slot_strawberry.png', weight: 20, color: '#ff6b6b' },
      { name: 'soft', emoji: '🍨', image: 'images/slot_soft.png', weight: 15, color: '#ffeaa7' },
      { name: 'ice', emoji: '🧊', image: 'images/slot_ice.png', weight: 10, color: '#48dbfb' },
      { name: 'coin', emoji: '🪙', image: 'images/slot_coin.png', weight: 15, color: '#fdcb6e' }
    ]);

    // Configure payouts (from your SLOT_CONFIG.rewards.triple)
    this.slotMachine.setPayouts({
      vanilla: {
        name: 'VANILLA VICTORY!',
        multiplier: 0.5,
        rewards: { attack: 5 },
        color: '#f5e6d3'
      },
      chocolate: {
        name: 'CHOCOLATE CHAMPION!',
        multiplier: 0.5,
        rewards: { defense: 5 },
        color: '#8b4513'
      },
      strawberry: {
        name: 'STRAWBERRY SUPREME!',
        multiplier: 0.5,
        rewards: { hp: 40 },
        color: '#ff6b6b'
      },
      soft: {
        name: 'SOFT SERVE SUCCESS!',
        multiplier: 0.7,
        rewards: { sanity: 5 },
        color: '#ffeaa7'
      },
      ice: {
        name: 'ICE COLD JACKPOT!',
        multiplier: 1.0,
        rewards: { attack: 3, defense: 3, sanity: 3, hp: 30 },
        color: '#48dbfb',
        isJackpot: true
      },
      coin: {
        name: 'COIN JACKPOT!',
        multiplier: 0.8,
        rewards: { points: 100 },
        color: '#fdcb6e'
      }
    });

    // Configure simple results (from your existing implementation)
    this.slotMachine.setResults([
      // Wins (80% total, ~13.33% each)
      { type: 'win', symbol: 'vanilla' },
      { type: 'win', symbol: 'vanilla' },
      { type: 'win', symbol: 'vanilla' },
      { type: 'win', symbol: 'chocolate' },
      { type: 'win', symbol: 'chocolate' },
      { type: 'win', symbol: 'chocolate' },
      { type: 'win', symbol: 'strawberry' },
      { type: 'win', symbol: 'strawberry' },
      { type: 'win', symbol: 'strawberry' },
      { type: 'win', symbol: 'soft' },
      { type: 'win', symbol: 'soft' },
      { type: 'win', symbol: 'ice' },
      { type: 'win', symbol: 'ice' },
      { type: 'win', symbol: 'coin' },
      { type: 'win', symbol: 'coin' },
      { type: 'win', symbol: 'coin' },
      { type: 'win', symbol: 'coin' },
      { type: 'win', symbol: 'coin' },
      // Losses (20% total)
      { type: 'loss' },
      { type: 'loss' },
      { type: 'loss' },
      { type: 'loss' },
      { type: 'loss' }
    ]);

    // Set up achievement mappings
    this.setupAchievementCallbacks();
    this.setupRewardProcessors();
  }

  /**
   * Set up slot machine event listeners
   */
  setupSlotMachineEvents() {
    this.slotMachine.addEventListener('spin-started', (event) => {
      this.onSpinStarted(event.data);
    });

    this.slotMachine.addEventListener('reel-symbol-changed', (event) => {
      this.onReelSymbolChanged(event.data);
    });

    this.slotMachine.addEventListener('spin-completed', (event) => {
      this.onSpinCompleted(event.data);
    });

    this.slotMachine.addEventListener('insufficient-credits', (event) => {
      this.onInsufficientCredits(event.data);
    });

    this.slotMachine.addEventListener('near-miss', (event) => {
      this.onNearMiss(event.data);
    });

    this.slotMachine.addEventListener('credits-changed', (event) => {
      this.onCreditsChanged(event.data);
    });
  }

  /**
   * Set up UI event listeners
   */
  setupUIEvents() {
    // Will be set up when UI is created
    this.pendingUIEvents = [
      { selector: '.slot-spin-btn', event: 'click', handler: () => this.spin() },
      { selector: '.slot-paytable-toggle', event: 'click', handler: () => this.togglePaytable() },
      { selector: '.slot-stats-toggle', event: 'click', handler: () => this.toggleStats() },
      { selector: '.slot-auto-play-btn', event: 'click', handler: () => this.toggleAutoPlay() }
    ];
  }

  /**
   * Set up game integration
   */
  setupGameIntegration() {
    // Sync credits with game state
    this.syncCredits();

    // Set up achievement integration
    if (this.options.enableAchievements && this.game.unlockAchievement) {
      this.setupAchievementIntegration();
    }

    // Set up audio integration
    if (this.options.enableAudio && this.game.playSound) {
      this.setupAudioIntegration();
    }
  }

  /**
   * Set up achievement callbacks
   */
  setupAchievementCallbacks() {
    this.achievementCallbacks.set('vanilla', () => this.game?.unlockAchievement?.('slot_vanilla'));
    this.achievementCallbacks.set('chocolate', () => this.game?.unlockAchievement?.('slot_chocolate'));
    this.achievementCallbacks.set('strawberry', () => this.game?.unlockAchievement?.('slot_strawberry'));
    this.achievementCallbacks.set('soft', () => this.game?.unlockAchievement?.('slot_soft'));
    this.achievementCallbacks.set('ice', () => this.game?.unlockAchievement?.('slot_ice'));
    this.achievementCallbacks.set('coin', () => this.game?.unlockAchievement?.('slot_coin'));
  }

  /**
   * Set up reward processors
   */
  setupRewardProcessors() {
    this.rewardProcessors.set('attack', (amount) => {
      if (this.game?.gameState?.player) {
        this.game.gameState.player.attack += amount;
        this.highlightStatUpdate('attack');
      }
    });

    this.rewardProcessors.set('defense', (amount) => {
      if (this.game?.gameState?.player) {
        this.game.gameState.player.defense += amount;
        this.highlightStatUpdate('defense');
      }
    });

    this.rewardProcessors.set('hp', (amount) => {
      if (this.game?.gameState?.player) {
        this.game.gameState.player.maxHp += amount;
        this.game.gameState.player.hp = Math.min(
          this.game.gameState.player.hp + amount,
          this.game.gameState.player.maxHp
        );
        this.highlightStatUpdate('hp');
      }
    });

    this.rewardProcessors.set('sanity', (amount) => {
      if (this.game?.gameState?.player) {
        this.game.gameState.player.maxSanity += amount;
        this.game.gameState.player.sanity = Math.min(
          this.game.gameState.player.sanity + amount,
          this.game.gameState.player.maxSanity
        );
        this.highlightStatUpdate('sanity');
      }
    });

    this.rewardProcessors.set('points', (amount) => {
      if (this.game?.gameState) {
        this.game.gameState.trainingScore += amount;
        this.syncCredits(); // Update slot machine credits
      }
    });
  }

  /**
   * Set up achievement integration
   */
  setupAchievementIntegration() {
    // Track consecutive losses for unlucky streak achievement
    this.slotMachine.addEventListener('spin-completed', (event) => {
      if (!event.data.isWin) {
        const consecutiveLosses = this.slotMachine.state.consecutiveLosses;
        if (consecutiveLosses >= 3 && this.game.unlockAchievement) {
          this.game.unlockAchievement('slot_unlucky');
        }
      }
    });
  }

  /**
   * Set up audio integration
   */
  setupAudioIntegration() {
    this.slotMachine.addEventListener('spin-started', () => {
      this.game.playSound?.('spin', 0.5);
    });

    this.slotMachine.addEventListener('spin-completed', (event) => {
      if (event.data.isWin) {
        const sound = event.data.winType === 'jackpot' ? 'jackpot' : 'win';
        this.game.playSound?.(sound);
      }
    });
  }

  /**
   * Sync credits with game state
   */
  syncCredits() {
    if (this.game?.gameState && this.options.creditSource) {
      const credits = this.game.gameState[this.options.creditSource] || 0;
      this.slotMachine.setCredits(credits);
    }
  }

  /**
   * Create and render the slot machine UI
   * @param {string|HTMLElement} container - Container element or selector
   */
  createUI(container) {
    const containerElement = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;

    if (!containerElement) {
      throw new Error('Container element not found');
    }

    containerElement.innerHTML = this.generateUIHTML();
    this.cacheUIElements(containerElement);
    this.bindUIEvents();
    this.updateUI();

    this.log('UI created and bound');
  }

  /**
   * Generate the complete UI HTML
   * @returns {string} HTML string
   */
  generateUIHTML() {
    return `
      <div class="slot-machine-system">
        <!-- Main slot machine -->
        <div class="slot-machine-main">
          <div class="slot-machine-header">
            <h3 class="slot-title">🎰 Lucky Slots</h3>
            <div class="slot-credits">
              Credits: <span class="credits-value">0</span>
            </div>
          </div>

          <div class="slot-reels-container">
            <div class="slot-reels">
              <div class="slot-reel" id="slot-reel-0">
                <img class="slot-symbol" src="images/slot_vanilla.png" alt="vanilla" />
              </div>
              <div class="slot-reel" id="slot-reel-1">
                <img class="slot-symbol" src="images/slot_chocolate.png" alt="chocolate" />
              </div>
              <div class="slot-reel" id="slot-reel-2">
                <img class="slot-symbol" src="images/slot_strawberry.png" alt="strawberry" />
              </div>
            </div>
            <div class="slot-result-display">
              <div class="slot-result-message"></div>
            </div>
          </div>

          <div class="slot-controls">
            <button class="slot-spin-btn slot-btn-primary">
              <span class="btn-text">SPIN</span>
              <span class="btn-cost">(10 pts)</span>
            </button>
            <div class="slot-control-buttons">
              <button class="slot-paytable-toggle slot-btn-secondary">Paytable</button>
              <button class="slot-stats-toggle slot-btn-secondary">Stats</button>
            </div>
          </div>
        </div>

        <!-- Paytable -->
        <div class="slot-paytable" id="slot-paytable">
          <h4>💰 Prize Table</h4>
          <div class="paytable-note">Match 3 symbols to win!</div>
          <div class="paytable-grid">
            <!-- Generated dynamically -->
          </div>
        </div>

        <!-- Stats panel -->
        <div class="slot-stats-panel" id="slot-stats-panel">
          <h4>📊 Statistics</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Total Spins</span>
              <span class="stat-value" data-stat="totalSpins">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Wins</span>
              <span class="stat-value" data-stat="totalWins">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Win Rate</span>
              <span class="stat-value" data-stat="winPercentage">0%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Biggest Win</span>
              <span class="stat-value" data-stat="biggestWin">0</span>
            </div>
          </div>
        </div>

        <!-- Celebration overlay -->
        <div class="slot-celebration-overlay" id="slot-celebration">
          <div class="celebration-content">
            <div class="celebration-message"></div>
            <div class="celebration-payout"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Cache UI elements for efficient access
   * @param {HTMLElement} container - Container element
   */
  cacheUIElements(container) {
    const elements = {
      container,
      creditsValue: container.querySelector('.credits-value'),
      reels: container.querySelectorAll('.slot-reel'),
      symbols: container.querySelectorAll('.slot-symbol'),
      resultMessage: container.querySelector('.slot-result-message'),
      spinBtn: container.querySelector('.slot-spin-btn'),
      btnCost: container.querySelector('.btn-cost'),
      paytableToggle: container.querySelector('.slot-paytable-toggle'),
      statsToggle: container.querySelector('.slot-stats-toggle'),
      paytable: container.querySelector('.slot-paytable'),
      statsPanel: container.querySelector('.slot-stats-panel'),
      paytableGrid: container.querySelector('.paytable-grid'),
      statsGrid: container.querySelector('.stats-grid'),
      celebration: container.querySelector('.slot-celebration-overlay')
    };

    this.uiElements.clear();
    Object.entries(elements).forEach(([key, element]) => {
      this.uiElements.set(key, element);
    });

    // Generate paytable
    this.generatePaytable();
  }

  /**
   * Bind UI event listeners
   */
  bindUIEvents() {
    this.pendingUIEvents.forEach(({ selector, event, handler }) => {
      const element = this.uiElements.get('container').querySelector(selector);
      if (element) {
        element.addEventListener(event, handler);
      }
    });
  }

  /**
   * Generate paytable HTML
   */
  generatePaytable() {
    const paytableGrid = this.uiElements.get('paytableGrid');
    if (!paytableGrid) return;

    let html = '';
    
    this.slotMachine.payouts.forEach((payout, symbolName) => {
      const symbol = this.slotMachine.symbols.find(s => s.name === symbolName);
      if (!symbol) return;

      const rewardText = this.formatRewards(payout.rewards);
      
      html += `
        <div class="paytable-row ${payout.isJackpot ? 'jackpot' : ''}">
          <div class="paytable-symbols">
            <img class="paytable-symbol" src="${symbol.image}" alt="${symbol.name}" />
            <img class="paytable-symbol" src="${symbol.image}" alt="${symbol.name}" />
            <img class="paytable-symbol" src="${symbol.image}" alt="${symbol.name}" />
          </div>
          <div class="reward">${rewardText}</div>
        </div>
      `;
    });

    paytableGrid.innerHTML = html;
  }

  /**
   * Format rewards for display
   * @param {Object} rewards - Rewards object
   * @returns {string} Formatted reward text
   */
  formatRewards(rewards) {
    const parts = [];
    
    if (rewards.attack) parts.push(`+${rewards.attack} ATK`);
    if (rewards.defense) parts.push(`+${rewards.defense} DEF`);
    if (rewards.hp) parts.push(`+${rewards.hp} HP`);
    if (rewards.sanity) parts.push(`+${rewards.sanity} SAN`);
    if (rewards.points) parts.push(`+${rewards.points} PTS`);
    
    return parts.join(', ') || 'WIN';
  }

  /**
   * Update UI elements
   */
  updateUI() {
    this.updateCreditsDisplay();
    this.updateSpinButton();
    this.updateStatsDisplay();
  }

  /**
   * Update credits display
   */
  updateCreditsDisplay() {
    const creditsElement = this.uiElements.get('creditsValue');
    if (creditsElement) {
      creditsElement.textContent = this.slotMachine.getCredits().toString();
    }
  }

  /**
   * Update spin button
   */
  updateSpinButton() {
    const spinBtn = this.uiElements.get('spinBtn');
    const btnCost = this.uiElements.get('btnCost');
    
    if (spinBtn && btnCost) {
      const cost = this.slotMachine.getCurrentBetCost();
      const canAfford = this.slotMachine.canAffordBet();
      
      btnCost.textContent = `(${cost} pts)`;
      spinBtn.disabled = !canAfford || this.slotMachine.state.isSpinning;
      
      if (this.slotMachine.state.isSpinning) {
        spinBtn.querySelector('.btn-text').textContent = 'SPINNING...';
      } else {
        spinBtn.querySelector('.btn-text').textContent = 'SPIN';
      }
    }
  }

  /**
   * Update stats display
   */
  updateStatsDisplay() {
    const stats = this.slotMachine.getStats();
    const statsElements = this.uiElements.get('container').querySelectorAll('[data-stat]');
    
    statsElements.forEach(element => {
      const statName = element.dataset.stat;
      if (stats.hasOwnProperty(statName)) {
        let value = stats[statName];
        
        // Format percentages
        if (statName.includes('Percentage') || statName.includes('Rate')) {
          value = Math.round(value) + '%';
        }
        
        element.textContent = value.toString();
      }
    });
  }

  /**
   * Handle spin started event
   * @param {Object} data - Event data
   */
  onSpinStarted(data) {
    this.log('Spin started:', data);
    this.updateUI();
    
    // Add spinning animation to reels
    this.uiElements.get('reels').forEach(reel => {
      reel.classList.add('spinning');
    });
    
    // Clear previous result
    const resultMessage = this.uiElements.get('resultMessage');
    if (resultMessage) {
      resultMessage.textContent = '';
    }
  }

  /**
   * Handle reel symbol changed event
   * @param {Object} data - Event data
   */
  onReelSymbolChanged(data) {
    const reel = this.uiElements.get('reels')[data.reelIndex];
    const symbol = reel?.querySelector('.slot-symbol');
    
    if (symbol && data.symbol) {
      if (data.symbol.image) {
        symbol.src = data.symbol.image;
        symbol.alt = data.symbol.name;
      } else {
        symbol.textContent = data.symbol.emoji;
      }
      
      // Remove spinning class when final
      if (data.isFinal) {
        reel.classList.remove('spinning');
      }
    }
  }

  /**
   * Handle spin completed event
   * @param {Object} data - Event data
   */
  onSpinCompleted(data) {
    this.log('Spin completed:', data);
    
    // Remove spinning animation from all reels
    this.uiElements.get('reels').forEach(reel => {
      reel.classList.remove('spinning');
    });
    
    // Process result
    this.processSpinResult(data);
    
    // Update UI
    this.updateUI();
    
    // Sync credits back to game state
    this.syncCreditsToGame();
  }

  /**
   * Process spin result and show feedback
   * @param {Object} result - Spin result
   */
  processSpinResult(result) {
    const resultMessage = this.uiElements.get('resultMessage');
    
    if (result.isWin) {
      // Handle win
      this.processWin(result);
      
      if (resultMessage) {
        resultMessage.innerHTML = `<span style="color: ${result.payout?.color || '#48dbfb'};">🎉 ${result.payout?.name || 'YOU WIN!'}</span>`;
      }
      
      // Highlight winning reels
      this.highlightWinningReels(true);
      
      // Unlock achievement
      if (result.symbol && this.achievementCallbacks.has(result.symbol)) {
        this.achievementCallbacks.get(result.symbol)();
      }
      
    } else {
      // Handle loss
      if (resultMessage) {
        resultMessage.innerHTML = `<span style="color: #95a5a6;">No match - try again!</span>`;
      }
      
      this.highlightWinningReels(false);
    }
    
    // Clear result message after delay
    setTimeout(() => {
      if (resultMessage) {
        resultMessage.textContent = '';
      }
    }, 3000);
  }

  /**
   * Process win rewards
   * @param {Object} result - Win result
   */
  processWin(result) {
    if (!result.rewards) return;
    
    Object.entries(result.rewards).forEach(([rewardType, amount]) => {
      const processor = this.rewardProcessors.get(rewardType);
      if (processor) {
        processor(amount);
      }
    });
    
    // Show celebration if jackpot
    if (result.winType === 'jackpot') {
      this.showCelebration(result);
    }
  }

  /**
   * Show celebration animation
   * @param {Object} result - Win result
   */
  showCelebration(result) {
    const celebration = this.uiElements.get('celebration');
    if (!celebration) return;
    
    const message = celebration.querySelector('.celebration-message');
    const payout = celebration.querySelector('.celebration-payout');
    
    if (message) message.textContent = result.payout?.name || 'JACKPOT!';
    if (payout) payout.textContent = `+${result.payout} credits!`;
    
    celebration.classList.add('active');
    this.celebrationActive = true;
    
    // Auto-hide after duration
    setTimeout(() => {
      celebration.classList.remove('active');
      this.celebrationActive = false;
    }, result.celebration?.duration || 3000);
  }

  /**
   * Highlight winning/losing reels
   * @param {boolean} isWin - Whether it's a win
   */
  highlightWinningReels(isWin) {
    this.uiElements.get('reels').forEach(reel => {
      reel.classList.remove('winner', 'loser');
      reel.classList.add(isWin ? 'winner' : 'loser');
    });
    
    // Remove classes after animation
    setTimeout(() => {
      this.uiElements.get('reels').forEach(reel => {
        reel.classList.remove('winner', 'loser');
      });
    }, 2000);
  }

  /**
   * Highlight stat update in game UI
   * @param {string} statType - Type of stat updated
   */
  highlightStatUpdate(statType) {
    // This would integrate with your game's stat display system
    if (this.game?.training?.highlightUpdatedStat) {
      this.game.training.highlightUpdatedStat(statType);
    }
  }

  /**
   * Handle insufficient credits
   * @param {Object} data - Event data
   */
  onInsufficientCredits(data) {
    const resultMessage = this.uiElements.get('resultMessage');
    if (resultMessage) {
      resultMessage.innerHTML = `<span style="color: #ff6b6b;">Not enough credits! Need ${data.required}</span>`;
      
      setTimeout(() => {
        resultMessage.textContent = '';
      }, 3000);
    }
  }

  /**
   * Handle near miss event
   * @param {Object} data - Event data
   */
  onNearMiss(data) {
    this.log('Near miss detected:', data);
    
    // Could add special near-miss effects here
    // For now, just treat as regular loss
  }

  /**
   * Handle credits changed event
   * @param {Object} data - Event data
   */
  onCreditsChanged(data) {
    this.updateCreditsDisplay();
  }

  /**
   * Sync credits back to game state
   */
  syncCreditsToGame() {
    if (this.game?.gameState && this.options.creditSource) {
      this.game.gameState[this.options.creditSource] = this.slotMachine.getCredits();
    }
  }

  /**
   * Perform a spin
   * @returns {Promise} Promise that resolves with spin result
   */
  async spin() {
    if (!this.isInitialized || !this.slotMachine) {
      throw new Error('SlotMachine not initialized');
    }
    
    this.syncCredits(); // Ensure credits are up to date
    return await this.slotMachine.spin();
  }

  /**
   * Toggle paytable display
   */
  togglePaytable() {
    const paytable = this.uiElements.get('paytable');
    const statsPanel = this.uiElements.get('statsPanel');
    
    if (paytable) {
      const isVisible = paytable.classList.contains('active');
      
      // Hide stats panel
      if (statsPanel) statsPanel.classList.remove('active');
      
      // Toggle paytable
      paytable.classList.toggle('active', !isVisible);
      this.currentView = !isVisible ? 'paytable' : 'machine';
    }
  }

  /**
   * Toggle stats display
   */
  toggleStats() {
    const paytable = this.uiElements.get('paytable');
    const statsPanel = this.uiElements.get('statsPanel');
    
    if (statsPanel) {
      const isVisible = statsPanel.classList.contains('active');
      
      // Hide paytable
      if (paytable) paytable.classList.remove('active');
      
      // Toggle stats
      statsPanel.classList.toggle('active', !isVisible);
      this.currentView = !isVisible ? 'stats' : 'machine';
      
      if (!isVisible) {
        this.updateStatsDisplay();
      }
    }
  }

  /**
   * Toggle auto-play mode
   */
  toggleAutoPlay() {
    // Auto-play implementation would go here
    this.log('Auto-play not yet implemented');
  }

  /**
   * Get current statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return this.slotMachine ? this.slotMachine.getStats() : {};
  }

  /**
   * Reset statistics
   */
  resetStats() {
    if (this.slotMachine) {
      this.slotMachine.resetStats();
      this.updateStatsDisplay();
    }
  }

  /**
   * Debug logging
   * @param {...*} args - Arguments to log
   */
  log(...args) {
    if (this.options.enableDebugLogs) {
      console.log('[SlotMachineManager]', ...args);
    }
  }

  /**
   * Clean up and destroy the manager
   */
  destroy() {
    this.log('Destroying SlotMachineManager...');
    
    // Destroy slot machine
    if (this.slotMachine) {
      this.slotMachine.destroy();
      this.slotMachine = null;
    }
    
    // Clear UI elements
    this.uiElements.clear();
    
    // Clear maps
    this.achievementCallbacks.clear();
    this.rewardProcessors.clear();
    
    // Reset state
    this.isInitialized = false;
    this.celebrationActive = false;
    
    this.log('SlotMachineManager destroyed');
  }
}