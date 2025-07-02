/**
 * SlotMachine - Core Reusable Slot Machine Class
 * A comprehensive slot machine system with customizable symbols, payouts, and animations
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class SlotMachine {
  constructor(options = {}) {
    // Configuration options
    this.options = {
      // Core settings
      reelCount: 3,
      symbolsPerReel: 6,
      baseCost: 10,
      costProgression: 15,
      
      // Payout settings
      winRate: 0.8, // 80% win rate
      payoutMultiplier: 1.0,
      enableProgressive: false,
      
      // Animation settings
      spinDuration: 100,
      spinCountBase: 10,
      reelDelayIncrement: 5,
      celebrationDuration: 3000,
      
      // Audio settings
      enableAudio: true,
      audioVolume: 0.7,
      
      // Visual settings
      enableParticles: true,
      enableScreenShake: false,
      
      // Advanced features
      enableNearMiss: true,
      enableAnticipation: true,
      enableBonusRounds: false,
      
      // Debug settings
      enableDebugLogs: false,
      
      ...options
    };

    // Core state
    this.state = {
      isSpinning: false,
      credits: 0,
      totalSpins: 0,
      totalWins: 0,
      currentBet: this.options.baseCost,
      lastResult: null,
      consecutiveLosses: 0,
      nearMissCount: 0
    };

    // Symbol and payout configuration
    this.symbols = [];
    this.payouts = new Map();
    this.results = [];
    
    // Animation and timing
    this.spinTimers = [];
    this.celebrationTimer = null;
    
    // Event listeners
    this.eventListeners = new Map();
    
    // Statistics
    this.stats = {
      totalSpins: 0,
      totalWins: 0,
      totalPayout: 0,
      biggestWin: 0,
      winStreak: 0,
      longestWinStreak: 0,
      lossStreak: 0,
      longestLossStreak: 0,
      nearMisses: 0,
      jackpots: 0
    };

    this.log('SlotMachine initialized with options:', this.options);
  }

  /**
   * Configure symbols with weights and properties
   * @param {Array} symbolConfig - Array of symbol objects
   */
  setSymbols(symbolConfig) {
    this.symbols = symbolConfig.map(symbol => ({
      name: symbol.name || 'unknown',
      emoji: symbol.emoji || '?',
      image: symbol.image || null,
      weight: symbol.weight || 1,
      rarity: symbol.rarity || 'common',
      color: symbol.color || '#ffffff',
      ...symbol
    }));
    
    this.log('Symbols configured:', this.symbols);
    this.dispatchEvent('symbols-configured', { symbols: this.symbols });
  }

  /**
   * Configure payouts for different combinations
   * @param {Object} payoutConfig - Payout configuration object
   */
  setPayouts(payoutConfig) {
    this.payouts.clear();
    
    Object.entries(payoutConfig).forEach(([key, payout]) => {
      this.payouts.set(key, {
        name: payout.name || key,
        multiplier: payout.multiplier || 1,
        rewards: payout.rewards || {},
        isJackpot: payout.isJackpot || false,
        color: payout.color || '#ffffff',
        rarity: payout.rarity || 'common',
        ...payout
      });
    });
    
    this.log('Payouts configured:', Array.from(this.payouts.entries()));
    this.dispatchEvent('payouts-configured', { payouts: this.payouts });
  }

  /**
   * Configure simple results array for predetermined outcomes
   * @param {Array} resultsConfig - Array of result objects
   */
  setResults(resultsConfig) {
    this.results = resultsConfig.map(result => ({
      type: result.type || 'loss',
      symbol: result.symbol || null,
      payout: result.payout || null,
      ...result
    }));
    
    this.log('Results configured:', this.results.length, 'possible outcomes');
    this.dispatchEvent('results-configured', { results: this.results });
  }

  /**
   * Set current credits/points available for betting
   * @param {number} credits - Available credits
   */
  setCredits(credits) {
    const oldCredits = this.state.credits;
    this.state.credits = Math.max(0, credits);
    
    this.log('Credits updated:', oldCredits, '->', this.state.credits);
    this.dispatchEvent('credits-changed', { 
      oldCredits, 
      newCredits: this.state.credits,
      change: this.state.credits - oldCredits
    });
  }

  /**
   * Get current credits
   * @returns {number} Current credits
   */
  getCredits() {
    return this.state.credits;
  }

  /**
   * Calculate current bet cost
   * @returns {number} Current bet cost
   */
  getCurrentBetCost() {
    return this.options.baseCost + (this.state.totalSpins * this.options.costProgression);
  }

  /**
   * Check if player can afford current bet
   * @returns {boolean} True if player can afford bet
   */
  canAffordBet() {
    return this.state.credits >= this.getCurrentBetCost();
  }

  /**
   * Spin the slot machine
   * @returns {Promise} Promise that resolves with spin result
   */
  async spin() {
    if (this.state.isSpinning) {
      this.log('Spin attempted while already spinning');
      return Promise.reject(new Error('Already spinning'));
    }

    const betCost = this.getCurrentBetCost();
    if (!this.canAffordBet()) {
      this.log('Insufficient credits for bet:', betCost, 'Available:', this.state.credits);
      this.dispatchEvent('insufficient-credits', { required: betCost, available: this.state.credits });
      return Promise.reject(new Error('Insufficient credits'));
    }

    try {
      // Deduct bet cost
      this.setCredits(this.state.credits - betCost);
      this.state.totalSpins++;
      this.stats.totalSpins++;
      
      this.state.isSpinning = true;
      this.log('Spin started. Cost:', betCost, 'Remaining credits:', this.state.credits);
      
      this.dispatchEvent('spin-started', { 
        betCost,
        totalSpins: this.state.totalSpins,
        remainingCredits: this.state.credits
      });

      // Determine outcome
      const result = this.determineOutcome();
      this.state.lastResult = result;

      // Animate reels
      await this.animateReels(result);

      // Process result
      const processedResult = await this.processResult(result);
      
      this.state.isSpinning = false;
      
      this.log('Spin completed:', processedResult);
      this.dispatchEvent('spin-completed', processedResult);
      
      return processedResult;
      
    } catch (error) {
      this.state.isSpinning = false;
      this.log('Spin error:', error.message);
      this.dispatchEvent('spin-error', { error: error.message });
      throw error;
    }
  }

  /**
   * Determine spin outcome using configured results or weighted random
   * @returns {Object} Spin result object
   * @private
   */
  determineOutcome() {
    let result;
    
    if (this.results.length > 0) {
      // Use predetermined results array
      result = this.getRandomElement(this.results);
      this.log('Using predetermined result:', result);
    } else {
      // Use weighted random selection
      result = this.generateWeightedResult();
      this.log('Generated weighted result:', result);
    }

    // Add metadata
    result.timestamp = Date.now();
    result.spinNumber = this.state.totalSpins;
    
    return result;
  }

  /**
   * Generate weighted random result
   * @returns {Object} Generated result
   * @private
   */
  generateWeightedResult() {
    const isWin = Math.random() < this.options.winRate;
    
    if (isWin) {
      const winSymbol = this.getWeightedSymbol();
      return {
        type: 'win',
        symbol: winSymbol.name,
        reels: [winSymbol, winSymbol, winSymbol], // Triple match
        payout: this.payouts.get(winSymbol.name) || null
      };
    } else {
      // Generate losing combination
      const reels = [];
      for (let i = 0; i < this.options.reelCount; i++) {
        reels.push(this.getWeightedSymbol());
      }
      
      // Ensure it's actually a loss (no matches)
      if (this.checkForMatches(reels).length > 0) {
        // Force different symbols
        reels[1] = this.symbols.find(s => s.name !== reels[0].name) || this.symbols[0];
        reels[2] = this.symbols.find(s => s.name !== reels[0].name && s.name !== reels[1].name) || this.symbols[0];
      }
      
      return {
        type: 'loss',
        symbol: null,
        reels: reels,
        payout: null
      };
    }
  }

  /**
   * Get weighted random symbol
   * @returns {Object} Selected symbol
   * @private
   */
  getWeightedSymbol() {
    const totalWeight = this.symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const symbol of this.symbols) {
      random -= symbol.weight;
      if (random <= 0) return symbol;
    }
    
    return this.symbols[0]; // Fallback
  }

  /**
   * Check for winning combinations in reels
   * @param {Array} reels - Array of symbols on reels
   * @returns {Array} Array of winning combinations
   * @private
   */
  checkForMatches(reels) {
    const matches = [];
    
    // Check for triple matches
    if (reels.length >= 3 && reels[0].name === reels[1].name && reels[1].name === reels[2].name) {
      matches.push({
        type: 'triple',
        symbol: reels[0].name,
        positions: [0, 1, 2]
      });
    }
    
    // Could add double matches, scatter pays, etc. here
    
    return matches;
  }

  /**
   * Animate the spinning reels
   * @param {Object} result - Spin result
   * @returns {Promise} Promise that resolves when animation completes
   * @private
   */
  async animateReels(result) {
    this.dispatchEvent('reel-animation-started', { result });
    
    const animationPromises = [];
    
    for (let i = 0; i < this.options.reelCount; i++) {
      const promise = this.animateReel(i, result);
      animationPromises.push(promise);
    }
    
    await Promise.allSettled(animationPromises);
    this.dispatchEvent('reel-animation-completed', { result });
  }

  /**
   * Animate a single reel
   * @param {number} reelIndex - Index of reel to animate
   * @param {Object} result - Spin result
   * @returns {Promise} Promise that resolves when reel animation completes
   * @private
   */
  animateReel(reelIndex, result) {
    return new Promise((resolve) => {
      const spinCount = this.options.spinCountBase + (reelIndex * this.options.reelDelayIncrement);
      const finalSymbol = result.reels ? result.reels[reelIndex] : 
                         (result.type === 'win' ? this.symbols.find(s => s.name === result.symbol) : this.getRandomElement(this.symbols));
      
      let currentSpin = 0;
      
      const spinInterval = setInterval(() => {
        // Show random symbol during spin
        const randomSymbol = this.getRandomElement(this.symbols);
        
        this.dispatchEvent('reel-symbol-changed', {
          reelIndex,
          symbol: randomSymbol,
          isSpinning: true
        });
        
        currentSpin++;
        
        if (currentSpin >= spinCount) {
          clearInterval(spinInterval);
          
          // Show final symbol
          this.dispatchEvent('reel-symbol-changed', {
            reelIndex,
            symbol: finalSymbol,
            isSpinning: false,
            isFinal: true
          });
          
          resolve(finalSymbol);
        }
      }, this.options.spinDuration);
    });
  }

  /**
   * Process the spin result and calculate payouts
   * @param {Object} result - Raw spin result
   * @returns {Object} Processed result with payouts
   * @private
   */
  async processResult(result) {
    const processedResult = {
      ...result,
      isWin: result.type === 'win',
      payout: 0,
      rewards: {},
      winType: null,
      celebration: null
    };

    if (result.type === 'win' && result.symbol) {
      const payoutConfig = this.payouts.get(result.symbol);
      
      if (payoutConfig) {
        // Calculate payout
        const basePayout = payoutConfig.multiplier * this.getCurrentBetCost();
        processedResult.payout = Math.floor(basePayout * this.options.payoutMultiplier);
        processedResult.rewards = { ...payoutConfig.rewards };
        processedResult.winType = payoutConfig.isJackpot ? 'jackpot' : 'win';
        processedResult.celebration = this.getCelebration(payoutConfig);
        
        // Award payout
        if (processedResult.payout > 0) {
          this.setCredits(this.state.credits + processedResult.payout);
        }
        
        // Update statistics
        this.updateWinStats(processedResult);
        
        this.log('Win processed:', processedResult);
      }
    } else {
      // Handle loss
      this.updateLossStats();
      
      // Check for near miss
      if (this.options.enableNearMiss && this.isNearMiss(result)) {
        processedResult.isNearMiss = true;
        this.stats.nearMisses++;
        this.state.nearMissCount++;
        
        this.log('Near miss detected');
        this.dispatchEvent('near-miss', processedResult);
      }
    }

    return processedResult;
  }

  /**
   * Check if result is a near miss
   * @param {Object} result - Spin result
   * @returns {boolean} True if near miss
   * @private
   */
  isNearMiss(result) {
    if (!result.reels || result.reels.length < 3) return false;
    
    // Check if first two reels match (classic near miss)
    return result.reels[0].name === result.reels[1].name && 
           result.reels[1].name !== result.reels[2].name;
  }

  /**
   * Get celebration configuration for win
   * @param {Object} payoutConfig - Payout configuration
   * @returns {Object} Celebration configuration
   * @private
   */
  getCelebration(payoutConfig) {
    if (payoutConfig.isJackpot) {
      return {
        type: 'jackpot',
        duration: this.options.celebrationDuration * 2,
        effects: ['confetti', 'screen-shake', 'audio-fanfare']
      };
    }
    
    return {
      type: 'win',
      duration: this.options.celebrationDuration,
      effects: ['highlight', 'audio-cheer']
    };
  }

  /**
   * Update statistics for wins
   * @param {Object} result - Processed result
   * @private
   */
  updateWinStats(result) {
    this.state.totalWins++;
    this.stats.totalWins++;
    this.stats.totalPayout += result.payout;
    
    if (result.payout > this.stats.biggestWin) {
      this.stats.biggestWin = result.payout;
    }
    
    if (result.winType === 'jackpot') {
      this.stats.jackpots++;
    }
    
    // Update streaks
    this.stats.winStreak++;
    this.stats.lossStreak = 0;
    this.state.consecutiveLosses = 0;
    
    if (this.stats.winStreak > this.stats.longestWinStreak) {
      this.stats.longestWinStreak = this.stats.winStreak;
    }
  }

  /**
   * Update statistics for losses
   * @private
   */
  updateLossStats() {
    this.stats.lossStreak++;
    this.stats.winStreak = 0;
    this.state.consecutiveLosses++;
    
    if (this.stats.lossStreak > this.stats.longestLossStreak) {
      this.stats.longestLossStreak = this.stats.lossStreak;
    }
  }

  /**
   * Get current statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      currentCredits: this.state.credits,
      totalSpins: this.state.totalSpins,
      winPercentage: this.stats.totalSpins > 0 ? (this.stats.totalWins / this.stats.totalSpins) * 100 : 0,
      averagePayout: this.stats.totalWins > 0 ? this.stats.totalPayout / this.stats.totalWins : 0,
      currentWinStreak: this.stats.winStreak,
      currentLossStreak: this.stats.lossStreak,
      nearMissRate: this.stats.totalSpins > 0 ? (this.stats.nearMisses / this.stats.totalSpins) * 100 : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalSpins: 0,
      totalWins: 0,
      totalPayout: 0,
      biggestWin: 0,
      winStreak: 0,
      longestWinStreak: 0,
      lossStreak: 0,
      longestLossStreak: 0,
      nearMisses: 0,
      jackpots: 0
    };
    
    this.state.totalSpins = 0;
    this.state.totalWins = 0;
    this.state.consecutiveLosses = 0;
    this.state.nearMissCount = 0;
    
    this.log('Statistics reset');
    this.dispatchEvent('stats-reset', this.getStats());
  }

  /**
   * Add event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  addEventListener(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    
    this.eventListeners.get(eventName).add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventName);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(eventName);
        }
      }
    };
  }

  /**
   * Dispatch event to listeners
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   * @private
   */
  dispatchEvent(eventName, data = {}) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback({ type: eventName, data, timestamp: Date.now() });
        } catch (error) {
          this.log('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Get random element from array
   * @param {Array} array - Array to select from
   * @returns {*} Random element
   * @private
   */
  getRandomElement(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return null;
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Debug logging
   * @param {...*} args - Arguments to log
   * @private
   */
  log(...args) {
    if (this.options.enableDebugLogs) {
      console.log('[SlotMachine]', ...args);
    }
  }

  /**
   * Clean up resources and stop all timers
   */
  destroy() {
    this.log('Destroying SlotMachine...');
    
    // Clear timers
    this.spinTimers.forEach(timer => clearTimeout(timer));
    this.spinTimers = [];
    
    if (this.celebrationTimer) {
      clearTimeout(this.celebrationTimer);
      this.celebrationTimer = null;
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Reset state
    this.state.isSpinning = false;
    
    this.dispatchEvent('destroyed');
    this.log('SlotMachine destroyed');
  }
}