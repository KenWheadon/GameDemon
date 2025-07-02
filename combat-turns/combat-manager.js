/**
 * Enhanced CombatManager - Game Integration Manager for Combat System
 * Handles game-specific combat patterns, fighter management, and system integration
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class CombatManager {
  constructor(gameInstance, options = {}) {
    this.game = gameInstance;

    // Configuration options
    this.options = {
      enableDebugLogs: false,
      enableAutoSave: true,
      enableSoundEffects: true,
      enableMusicIntegration: true,
      enableAchievements: true,
      autoGenerateEnemies: true,
      battleTransitions: true,
      persistBattleHistory: true,
      maxBattleHistory: 10,
      enableMalfunction: false, // Optional malfunction system
      malfunctionChance: 0.1, // 10% chance per turn
      ...options,
    };

    // Core combat system
    this.combat = null;

    // Fighter definitions and templates
    this.fighterTemplates = new Map();
    this.enemyTemplates = new Map();

    // Battle management
    this.currentBattle = null;
    this.battleHistory = [];
    this.battleQueue = [];

    // Integration state
    this.isInitialized = false;
    this.soundMappings = new Map();
    this.musicMappings = new Map();

    // Event handlers
    this.eventHandlers = new Map();

    // Statistics tracking
    this.stats = {
      battlesWon: 0,
      battlesLost: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      totalTurns: 0,
      averageBattleLength: 0,
      favoriteAction: null,
      actionUsageCounts: new Map(),
    };

    // Enhanced visual feedback state
    this.visualState = {
      lastPlayerAction: null,
      lastEnemyAction: null,
      combatPhase: "idle",
      animationQueue: [],
    };

    // Initialize the system
    this.init();
  }

  /**
   * Initialize the CombatManager
   */
  async init() {
    try {
      this.log("Initializing Enhanced CombatManager...");

      // Create core Combat instance with enhanced options
      this.combat = new Combat({
        enableDebugLogs: this.options.enableDebugLogs,
        enableAnimations: true,
        enableSounds: this.options.enableSoundEffects,
        enableTooltips: true,
        maxActionsPerTurn: 4,
        turnDelay: 1000,
        animationDuration: 800,
        damageNumberDuration: 2500,
      });

      // Set up enhanced combat callbacks
      this.setupCombatCallbacks();

      // Set up game integration
      if (this.game) {
        this.setupGameIntegration();
      }

      // Load default fighter templates
      this.loadDefaultTemplates();

      // Set up sound/music mappings
      this.setupAudioMappings();

      // Load battle history if enabled
      if (this.options.persistBattleHistory) {
        this.loadBattleHistory();
      }

      this.isInitialized = true;
      this.log("Enhanced CombatManager initialized successfully");

      return true;
    } catch (error) {
      console.error("Failed to initialize CombatManager:", error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Set up combat system callbacks with enhanced visual feedback
   */
  setupCombatCallbacks() {
    // Turn management
    this.combat.setCallback("onTurnStart", (data) => {
      this.handleTurnStart(data);
    });

    this.combat.setCallback("onTurnEnd", (data) => {
      this.handleTurnEnd(data);
    });

    // Action handling
    this.combat.setCallback("onActionSelect", (data) => {
      this.handleActionSelect(data);
    });

    this.combat.setCallback("onActionExecute", (data) => {
      this.handleActionExecute(data);
    });

    // Animation callbacks for enhanced feedback
    this.combat.setCallback("onAnimationStart", (data) => {
      this.handleAnimationStart(data);
    });

    this.combat.setCallback("onAnimationEnd", (data) => {
      this.handleAnimationEnd(data);
    });

    // Battle lifecycle
    this.combat.setCallback("onBattleEnd", (data) => {
      this.handleBattleEnd(data);
    });
  }

  /**
   * Set up game integration hooks
   */
  setupGameIntegration() {
    // Expose combat methods to game instance
    if (this.game) {
      this.game.combat = {
        startBattle: this.startBattle.bind(this),
        endBattle: this.endBattle.bind(this),
        pauseBattle: this.pauseBattle.bind(this),
        getState: this.getState.bind(this),
        getStats: this.getStats.bind(this),
        addFighterTemplate: this.addFighterTemplate.bind(this),
        addEnemyTemplate: this.addEnemyTemplate.bind(this),
        queueBattle: this.queueBattle.bind(this),
        updateUI: this.updateUI.bind(this),
      };

      // Set up event forwarding to game instance
      this.setupEventForwarding();
    }
  }

  /**
   * Set up event forwarding to game instance
   */
  setupEventForwarding() {
    const events = [
      "onBattleStart",
      "onBattleEnd",
      "onPlayerVictory",
      "onPlayerDefeat",
      "onActionExecute",
      "onDamageDealt",
      "onDamageTaken",
      "onCriticalHit",
      "onStatusEffect",
    ];

    events.forEach((eventName) => {
      if (typeof this.game[eventName] === "function") {
        this.eventHandlers.set(eventName, this.game[eventName].bind(this.game));
      }
    });
  }

  /**
   * Load default fighter and enemy templates with enhanced visual data
   */
  loadDefaultTemplates() {
    // Default player fighter template
    this.addFighterTemplate("default", {
      name: "Fighter",
      maxHp: 100,
      maxEnergy: 20,
      attack: 10,
      defense: 5,
      actions: ["light_attack", "heavy_attack", "defend", "powerup"],
      customActions: {
        // Uses combat system defaults
      },
      sprite: "🥊",
      description: "A balanced fighter with standard abilities",
      visualTheme: "default",
    });

    // Defensive fighter template
    this.addFighterTemplate("defender", {
      name: "Guardian",
      maxHp: 120,
      maxEnergy: 18,
      attack: 8,
      defense: 8,
      actions: ["light_attack", "heavy_attack", "defend", "heal"],
      customActions: {
        defend: {
          id: "defend",
          name: "Shield Wall",
          type: "defense",
          energyCost: 1,
          power: 0,
          effects: ["block_next_attack"],
          cooldown: 0,
          description:
            "Create an impenetrable barrier that blocks the next attack",
          icon: "🛡️",
        },
      },
      sprite: "🛡️",
      description: "A defensive specialist focused on protection and healing",
      visualTheme: "defensive",
    });

    // Aggressive fighter template
    this.addFighterTemplate("berserker", {
      name: "Berserker",
      maxHp: 90,
      maxEnergy: 22,
      attack: 15,
      defense: 3,
      actions: ["light_attack", "heavy_attack", "powerup", "restore_energy"],
      customActions: {
        heavy_attack: {
          id: "heavy_attack",
          name: "Rage Strike",
          type: "attack",
          energyCost: 5,
          power: 60,
          effects: ["damage"],
          cooldown: 0,
          description: "A devastating attack fueled by pure rage",
          icon: "💥",
        },
      },
      sprite: "⚔️",
      description: "An aggressive fighter that deals massive damage",
      visualTheme: "aggressive",
    });

    // Mage fighter template
    this.addFighterTemplate("mage", {
      name: "Battle Mage",
      maxHp: 80,
      maxEnergy: 25,
      attack: 12,
      defense: 4,
      actions: ["light_attack", "heavy_attack", "heal", "powerup"],
      customActions: {
        heavy_attack: {
          id: "heavy_attack",
          name: "Fireball",
          type: "attack",
          energyCost: 4,
          power: 45,
          effects: ["damage"],
          cooldown: 0,
          description: "A blazing magical attack",
          icon: "🔥",
        },
        heal: {
          id: "heal",
          name: "Healing Light",
          type: "recovery",
          energyCost: 3,
          power: 35,
          effects: ["restore_hp"],
          cooldown: 1,
          description: "Restore health with divine magic",
          icon: "✨",
        },
      },
      sprite: "🧙",
      description: "A spellcaster with powerful magic abilities",
      visualTheme: "magical",
    });

    // Default enemy templates
    this.addEnemyTemplate("basic", {
      name: "Training Dummy",
      maxHp: 80,
      maxEnergy: 15,
      attack: 8,
      defense: 4,
      actions: ["light_attack", "defend"],
      aiType: "basic",
      sprite: "🎯",
      description: "A simple opponent for practice",
    });

    this.addEnemyTemplate("warrior", {
      name: "Warrior",
      maxHp: 100,
      maxEnergy: 20,
      attack: 12,
      defense: 6,
      actions: ["light_attack", "heavy_attack", "defend", "powerup"],
      aiType: "balanced",
      sprite: "⚔️",
      description: "A balanced opponent with varied tactics",
    });

    this.addEnemyTemplate("boss", {
      name: "Champion",
      maxHp: 150,
      maxEnergy: 25,
      attack: 15,
      defense: 8,
      actions: ["light_attack", "heavy_attack", "powerup", "heal"],
      aiType: "aggressive",
      sprite: "👑",
      description: "A powerful boss enemy with advanced abilities",
    });

    this.addEnemyTemplate("rogue", {
      name: "Shadow Rogue",
      maxHp: 85,
      maxEnergy: 22,
      attack: 14,
      defense: 5,
      actions: ["light_attack", "heavy_attack", "restore_energy"],
      aiType: "aggressive",
      sprite: "🗡️",
      description: "A fast, agile opponent with quick strikes",
    });
  }

  /**
   * Set up audio mappings for combat actions
   */
  setupAudioMappings() {
    // Default sound mappings
    this.soundMappings.set("light_attack", "punch");
    this.soundMappings.set("heavy_attack", "heavy_hit");
    this.soundMappings.set("defend", "block");
    this.soundMappings.set("heal", "heal");
    this.soundMappings.set("powerup", "powerup");
    this.soundMappings.set("restore_energy", "energy");
    this.soundMappings.set("damage_taken", "hurt");
    this.soundMappings.set("victory", "victory");
    this.soundMappings.set("defeat", "defeat");
    this.soundMappings.set("critical_hit", "critical");
    this.soundMappings.set("action_select", "click");
    this.soundMappings.set("turn_start", "turn");
    this.soundMappings.set("malfunction", "error");

    // Music mappings
    this.musicMappings.set("battle_start", "battle_music");
    this.musicMappings.set("victory", "victory_music");
    this.musicMappings.set("defeat", "defeat_music");
    this.musicMappings.set("boss_battle", "boss_music");
    this.musicMappings.set("dramatic_moment", "dramatic_music");
  }

  /**
   * Add a fighter template
   * @param {string} templateId - Template identifier
   * @param {Object} template - Fighter template data
   */
  addFighterTemplate(templateId, template) {
    if (!template.name || !template.maxHp || !template.maxEnergy) {
      throw new Error("Fighter template missing required properties");
    }

    this.fighterTemplates.set(templateId, { ...template });
    this.log(`Fighter template added: ${templateId}`);
  }

  /**
   * Add an enemy template
   * @param {string} templateId - Template identifier
   * @param {Object} template - Enemy template data
   */
  addEnemyTemplate(templateId, template) {
    if (!template.name || !template.maxHp || !template.maxEnergy) {
      throw new Error("Enemy template missing required properties");
    }

    this.enemyTemplates.set(templateId, { ...template });
    this.log(`Enemy template added: ${templateId}`);
  }

  /**
   * Create a fighter from template
   * @param {string} templateId - Template to use
   * @param {Object} overrides - Property overrides
   */
  createFighter(templateId, overrides = {}) {
    const template = this.fighterTemplates.get(templateId);
    if (!template) {
      throw new Error(`Fighter template not found: ${templateId}`);
    }

    return {
      ...template,
      ...overrides,
      hp: overrides.hp || template.maxHp,
      energy: overrides.energy || template.maxEnergy,
      templateId: templateId,
    };
  }

  /**
   * Create an enemy from template
   * @param {string} templateId - Template to use
   * @param {Object} overrides - Property overrides
   */
  createEnemy(templateId, overrides = {}) {
    const template = this.enemyTemplates.get(templateId);
    if (!template) {
      throw new Error(`Enemy template not found: ${templateId}`);
    }

    return {
      ...template,
      ...overrides,
      hp: overrides.hp || template.maxHp,
      energy: overrides.energy || template.maxEnergy,
      templateId: templateId,
    };
  }

  /**
   * Start a new battle with enhanced visual setup
   * @param {Object} playerFighter - Player fighter data or template ID
   * @param {Object} enemyFighter - Enemy fighter data or template ID
   * @param {Object} battleOptions - Battle configuration
   */
  startBattle(playerFighter, enemyFighter, battleOptions = {}) {
    try {
      this.log("Starting new battle...");

      // Create fighters from templates if needed
      const player =
        typeof playerFighter === "string"
          ? this.createFighter(playerFighter)
          : playerFighter;

      const enemy =
        typeof enemyFighter === "string"
          ? this.createEnemy(enemyFighter)
          : enemyFighter;

      // Store current battle info
      this.currentBattle = {
        id: Date.now().toString(),
        player: player,
        enemy: enemy,
        options: battleOptions,
        startTime: Date.now(),
        status: "active",
      };

      // Reset visual state
      this.visualState = {
        lastPlayerAction: null,
        lastEnemyAction: null,
        combatPhase: "starting",
        animationQueue: [],
      };

      // Start the combat
      const success = this.combat.startBattle(player, enemy, battleOptions);

      if (success) {
        // Enhanced battle start sequence
        this.playBattleStartSequence();

        // Trigger game event
        this.triggerGameEvent("onBattleStart", {
          battle: this.currentBattle,
          player: player,
          enemy: enemy,
        });

        this.log("Battle started successfully");
      }

      return success;
    } catch (error) {
      console.error("Failed to start battle:", error);
      return false;
    }
  }

  /**
   * Play enhanced battle start sequence
   */
  playBattleStartSequence() {
    this.visualState.combatPhase = "starting";

    // Play battle start music
    this.playMusic("battle_start");

    // Show battle intro animation
    this.showBattleIntro();

    // Update combat container state
    this.updateCombatState();
  }

  /**
   * Show battle intro animation
   */
  showBattleIntro() {
    const container = document.querySelector(".combat-container");
    if (container) {
      container.classList.add("battle-starting");

      setTimeout(() => {
        container.classList.remove("battle-starting");
        container.classList.add("battle-active");
        this.visualState.combatPhase = "active";
      }, 1500);
    }
  }

  /**
   * Update combat container state classes
   */
  updateCombatState() {
    const container = document.querySelector(".combat-container");
    if (!container) return;

    // Remove all state classes
    container.classList.remove(
      "battle-starting",
      "battle-active",
      "battle-ending",
      "player-turn",
      "enemy-turn",
      "animating",
      "critical-moment"
    );

    // Add current state class
    if (this.visualState.combatPhase === "starting") {
      container.classList.add("battle-starting");
    } else if (this.visualState.combatPhase === "active") {
      container.classList.add("battle-active");
    } else if (this.visualState.combatPhase === "ending") {
      container.classList.add("battle-ending");
    }

    // Add turn state
    if (this.combat && this.combat.state.turnType) {
      container.classList.add(`${this.combat.state.turnType}-turn`);
    }

    // Add animation state
    if (this.combat && this.combat.state.animating) {
      container.classList.add("animating");
    }
  }

  /**
   * End the current battle
   * @param {string} reason - Reason for ending battle
   */
  endBattle(reason = "manual") {
    if (!this.currentBattle) {
      return false;
    }

    try {
      this.visualState.combatPhase = "ending";
      this.updateCombatState();

      this.currentBattle.status = "ended";
      this.currentBattle.endTime = Date.now();
      this.currentBattle.endReason = reason;

      // Get final results
      const results = this.combat.getResults();
      this.currentBattle.results = results;

      // Update statistics
      this.updateStats(results);

      // Add to battle history
      if (this.options.persistBattleHistory) {
        this.addToBattleHistory(this.currentBattle);
      }

      // Play ending sequence
      this.playBattleEndSequence(results);

      // Trigger game event
      this.triggerGameEvent("onBattleEnd", {
        battle: this.currentBattle,
        results: results,
      });

      this.log(`Battle ended: ${reason}`);
      this.currentBattle = null;

      return true;
    } catch (error) {
      console.error("Failed to end battle:", error);
      return false;
    }
  }

  /**
   * Play enhanced battle end sequence
   * @param {Object} results - Battle results
   */
  playBattleEndSequence(results) {
    if (!results) return;

    // Stop battle music
    if (this.game && this.game.stopMusic) {
      this.game.stopMusic();
    }

    // Play appropriate ending music and effects
    if (results.winner === "player") {
      this.playMusic("victory");
      this.playSound("victory");
      this.showVictoryEffects();
    } else if (results.winner === "enemy") {
      this.playMusic("defeat");
      this.playSound("defeat");
      this.showDefeatEffects();
    }

    // Reset combat state after delay
    setTimeout(() => {
      this.visualState.combatPhase = "idle";
      this.updateCombatState();
    }, 3000);
  }

  /**
   * Show victory visual effects
   */
  showVictoryEffects() {
    const container = document.querySelector(".combat-container");
    if (container) {
      container.classList.add("victory-state");

      // Create victory particles
      this.createVictoryParticles();

      setTimeout(() => {
        container.classList.remove("victory-state");
      }, 3000);
    }
  }

  /**
   * Show defeat visual effects
   */
  showDefeatEffects() {
    const container = document.querySelector(".combat-container");
    if (container) {
      container.classList.add("defeat-state");

      setTimeout(() => {
        container.classList.remove("defeat-state");
      }, 3000);
    }
  }

  /**
   * Create victory particle effects
   */
  createVictoryParticles() {
    const animationLayer = document.querySelector(".animation-layer");
    if (!animationLayer) return;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement("div");
      particle.className = "victory-particle";
      particle.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: gold;
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: victorySparkle ${2 + Math.random() * 2}s ease-out forwards;
        z-index: 1000;
      `;

      animationLayer.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) {
          particle.remove();
        }
      }, 4000);
    }
  }

  /**
   * Pause/resume the current battle
   * @param {boolean} paused - Whether to pause
   */
  pauseBattle(paused) {
    if (this.combat) {
      this.combat.setPaused(paused);

      if (this.currentBattle) {
        this.currentBattle.status = paused ? "paused" : "active";
      }

      // Update visual state
      this.visualState.combatPhase = paused ? "paused" : "active";
      this.updateCombatState();
    }
  }

  /**
   * Queue a battle for later execution
   * @param {Object} battleData - Battle configuration
   */
  queueBattle(battleData) {
    this.battleQueue.push({
      id: Date.now().toString(),
      ...battleData,
      queued: true,
    });
  }

  /**
   * Start the next queued battle
   */
  startNextBattle() {
    if (this.battleQueue.length === 0) {
      return false;
    }

    const nextBattle = this.battleQueue.shift();
    return this.startBattle(
      nextBattle.playerFighter,
      nextBattle.enemyFighter,
      nextBattle.options
    );
  }

  /**
   * Handle turn start event from combat system
   * @param {Object} data - Turn start data
   */
  handleTurnStart(data) {
    this.log(`Turn ${data.turn} started`);

    // Update battle tracking
    if (this.currentBattle) {
      this.currentBattle.currentTurn = data.turn;
    }

    // Play turn start sound
    this.playSound("turn_start", 0.3);

    // Apply malfunction if enabled
    if (
      this.options.enableMalfunction &&
      Math.random() < this.options.malfunctionChance
    ) {
      this.applyMalfunction();
    }

    // Update visual state
    this.visualState.combatPhase = "turn-starting";
    this.updateCombatState();

    // Auto-save if enabled
    if (this.options.enableAutoSave && this.game && this.game.save) {
      this.game.save();
    }
  }

  /**
   * Handle turn end event from combat system
   * @param {Object} data - Turn end data
   */
  handleTurnEnd(data) {
    this.log(`Turn ${data.turn} ended`);

    // Update statistics
    this.stats.totalTurns++;

    // Clear malfunction
    this.clearMalfunction();

    // Update visual state
    this.visualState.combatPhase = "turn-ending";
    this.updateCombatState();
  }

  /**
   * Handle action selection event from combat system
   * @param {Object} data - Action selection data
   */
  handleActionSelect(data) {
    // Update action usage statistics
    const actionId = data.action.id;
    const currentCount = this.stats.actionUsageCounts.get(actionId) || 0;
    this.stats.actionUsageCounts.set(actionId, currentCount + 1);

    // Update favorite action
    this.updateFavoriteAction();

    // Play selection sound with enhanced feedback
    this.playSound("action_select", 0.5);

    // Store last action for visual feedback
    if (data.fighter === "player") {
      this.visualState.lastPlayerAction = data.action;
    } else {
      this.visualState.lastEnemyAction = data.action;
    }

    // Update action button visual feedback
    this.updateActionButtonFeedback(data);
  }

  /**
   * Handle action execution event from combat system
   * @param {Object} data - Action execution data
   */
  handleActionExecute(data) {
    const { action, result, attacker, defender } = data;

    // Play action sound with enhanced audio feedback
    this.playActionSound(action.action.id, result);

    // Check for critical hits
    const isCritical =
      result.damage > 0 && result.damage >= attacker.attack * 1.5;
    if (isCritical) {
      this.handleCriticalHit(data);
    }

    // Update damage statistics
    if (result.damage > 0) {
      if (attacker.templateId) {
        // Player dealt damage
        this.stats.totalDamageDealt += result.damage;
        this.triggerGameEvent("onDamageDealt", {
          damage: result.damage,
          action: action,
          target: defender,
          isCritical: isCritical,
        });
      } else {
        // Player took damage
        this.stats.totalDamageTaken += result.damage;
        this.triggerGameEvent("onDamageTaken", {
          damage: result.damage,
          action: action,
          source: attacker,
          isCritical: isCritical,
        });
      }
    }

    // Handle status effects
    if (result.effects && result.effects.length > 0) {
      this.handleStatusEffects(result.effects, attacker, defender);
    }

    // Trigger action execute event
    this.triggerGameEvent("onActionExecute", data);

    // Update UI with enhanced feedback
    this.updateUI();
  }

  /**
   * Handle critical hit with enhanced effects
   * @param {Object} data - Action execution data
   */
  handleCriticalHit(data) {
    // Play critical hit sound
    this.playSound("critical_hit");

    // Add screen shake effect
    this.addScreenShake();

    // Show critical hit indicator
    this.showCriticalHitIndicator(data.defender);

    // Trigger game event
    this.triggerGameEvent("onCriticalHit", data);
  }

  /**
   * Handle status effects with visual feedback
   * @param {Array} effects - Applied effects
   * @param {Object} attacker - Acting fighter
   * @param {Object} defender - Target fighter
   */
  handleStatusEffects(effects, attacker, defender) {
    effects.forEach((effect) => {
      // Play status effect sound
      this.playSound("status_effect", 0.4);

      // Show status effect indicator
      this.showStatusEffectIndicator(effect, defender);

      // Trigger game event
      this.triggerGameEvent("onStatusEffect", {
        effect: effect,
        attacker: attacker,
        defender: defender,
      });
    });
  }

  /**
   * Handle animation start event from combat system
   * @param {Object} data - Animation start data
   */
  handleAnimationStart(data) {
    // Update visual state
    this.visualState.combatPhase = "animating";
    this.updateCombatState();

    // Update UI state for animations
    if (this.game && this.game.setUIState) {
      this.game.setUIState("animating");
    }
  }

  /**
   * Handle animation end event from combat system
   * @param {Object} data - Animation end data
   */
  handleAnimationEnd(data) {
    // Reset visual state
    this.visualState.combatPhase = "active";
    this.updateCombatState();

    // Reset UI state after animations
    if (this.game && this.game.setUIState) {
      this.game.setUIState("ready");
    }
  }

  /**
   * Handle battle end event from combat system
   * @param {Object} data - Battle end data
   */
  handleBattleEnd(data) {
    const { winner, reason } = data;

    // Update win/loss statistics
    if (winner === "player") {
      this.stats.battlesWon++;
      this.triggerGameEvent("onPlayerVictory", data);

      // Achievement integration
      if (
        this.options.enableAchievements &&
        this.game &&
        this.game.unlockAchievement
      ) {
        this.game.unlockAchievement("first_victory");
      }
    } else if (winner === "enemy") {
      this.stats.battlesLost++;
      this.triggerGameEvent("onPlayerDefeat", data);
    }

    // Update average battle length
    this.updateAverageBattleLength();

    // End the current battle
    this.endBattle(reason);

    // Start next queued battle if available
    if (this.options.battleTransitions && this.battleQueue.length > 0) {
      setTimeout(() => {
        this.startNextBattle();
      }, 2000);
    }
  }

  /**
   * Apply malfunction to random action
   */
  applyMalfunction() {
    if (!this.combat || !this.combat.state.fighters.player) return;

    const player = this.combat.state.fighters.player;
    const attackActions = player.actions.filter(
      (action) =>
        player.customActions[action] &&
        player.customActions[action].type === "attack"
    );

    if (attackActions.length > 0) {
      const malfunctionedAction =
        attackActions[Math.floor(Math.random() * attackActions.length)];

      // Add malfunction visual indicator
      this.showMalfunctionIndicator(malfunctionedAction);

      // Play malfunction sound
      this.playSound("malfunction");

      this.log(`Action ${malfunctionedAction} is malfunctioning this turn`);
    }
  }

  /**
   * Clear malfunction effects
   */
  clearMalfunction() {
    // Remove malfunction visual indicators
    const malfunctionedButtons = document.querySelectorAll(
      ".combat-action.malfunctioned"
    );
    malfunctionedButtons.forEach((button) => {
      button.classList.remove("malfunctioned");
    });
  }

  /**
   * Show malfunction indicator
   * @param {string} actionId - Action that's malfunctioning
   */
  showMalfunctionIndicator(actionId) {
    const button = document.querySelector(`[data-action="${actionId}"]`);
    if (button) {
      button.classList.add("malfunctioned");
    }
  }

  /**
   * Add screen shake effect
   */
  addScreenShake() {
    const container = document.querySelector(".combat-container");
    if (container) {
      container.classList.add("screen-shake");
      setTimeout(() => {
        container.classList.remove("screen-shake");
      }, 500);
    }
  }

  /**
   * Show critical hit indicator
   * @param {Object} target - Target fighter
   */
  showCriticalHitIndicator(target) {
    // Implementation would show "CRITICAL!" text over target
    // This is a placeholder for the visual effect
    console.log("Critical hit on", target.name);
  }

  /**
   * Show status effect indicator
   * @param {string} effect - Effect name
   * @param {Object} target - Target fighter
   */
  showStatusEffectIndicator(effect, target) {
    // Implementation would show status effect icon over target
    // This is a placeholder for the visual effect
    console.log(`Status effect ${effect} applied to`, target.name);
  }

  /**
   * Update action button visual feedback
   * @param {Object} data - Action selection data
   */
  updateActionButtonFeedback(data) {
    if (data.fighter !== "player") return;

    const button = document.querySelector(`[data-action="${data.action.id}"]`);
    if (button) {
      button.classList.add("action-selected");
      setTimeout(() => {
        button.classList.remove("action-selected");
      }, 300);
    }
  }

  /**
   * Play action sound with enhanced feedback
   * @param {string} actionId - Action identifier
   * @param {Object} result - Action result for context
   */
  playActionSound(actionId, result) {
    let soundId = this.soundMappings.get(actionId) || actionId;
    let volume = 0.7;

    // Modify sound based on result
    if (result.blocked) {
      soundId = "block_sound";
      volume = 0.5;
    } else if (result.damage > 0) {
      // Higher volume for more damage
      volume = Math.min(1.0, 0.5 + result.damage / 50);
    }

    this.playSound(soundId, volume);
  }

  /**
   * Update statistics tracking
   * @param {Object} results - Battle results
   */
  updateStats(results) {
    if (results && this.currentBattle) {
      const battleLength = results.turns || 0;
      const totalBattles = this.stats.battlesWon + this.stats.battlesLost;

      if (totalBattles > 0) {
        this.stats.averageBattleLength =
          (this.stats.averageBattleLength * (totalBattles - 1) + battleLength) /
          totalBattles;
      } else {
        this.stats.averageBattleLength = battleLength;
      }
    }
  }

  /**
   * Update favorite action based on usage counts
   */
  updateFavoriteAction() {
    let maxCount = 0;
    let favoriteAction = null;

    this.stats.actionUsageCounts.forEach((count, actionId) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteAction = actionId;
      }
    });

    this.stats.favoriteAction = favoriteAction;
  }

  /**
   * Update average battle length
   */
  updateAverageBattleLength() {
    if (this.currentBattle && this.currentBattle.currentTurn) {
      const totalBattles = this.stats.battlesWon + this.stats.battlesLost;
      const battleLength = this.currentBattle.currentTurn;

      if (totalBattles === 1) {
        this.stats.averageBattleLength = battleLength;
      } else {
        this.stats.averageBattleLength =
          (this.stats.averageBattleLength * (totalBattles - 1) + battleLength) /
          totalBattles;
      }
    }
  }

  /**
   * Add battle to history
   * @param {Object} battle - Battle data to add
   */
  addToBattleHistory(battle) {
    this.battleHistory.unshift(battle);

    // Limit history size
    if (this.battleHistory.length > this.options.maxBattleHistory) {
      this.battleHistory = this.battleHistory.slice(
        0,
        this.options.maxBattleHistory
      );
    }

    // Save to storage if available
    this.saveBattleHistory();
  }

  /**
   * Load battle history from storage
   */
  loadBattleHistory() {
    try {
      const gameId = this.getGameId();
      const saved = localStorage.getItem(`${gameId}-combat-history`);

      if (saved) {
        this.battleHistory = JSON.parse(saved);
        this.log(`Loaded ${this.battleHistory.length} battles from history`);
      }
    } catch (error) {
      console.warn("Failed to load battle history:", error);
      this.battleHistory = [];
    }
  }

  /**
   * Save battle history to storage
   */
  saveBattleHistory() {
    try {
      const gameId = this.getGameId();
      localStorage.setItem(
        `${gameId}-combat-history`,
        JSON.stringify(this.battleHistory)
      );
    } catch (error) {
      console.warn("Failed to save battle history:", error);
    }
  }

  /**
   * Update UI with enhanced visual feedback
   */
  updateUI() {
    if (this.combat) {
      this.combat.updateUI();
    }
    this.updateCombatState();
  }

  /**
   * Play sound effect
   * @param {string} actionId - Action ID to get sound for
   * @param {number} volume - Volume level (0-1)
   */
  playSound(actionId, volume = 0.7) {
    if (!this.options.enableSoundEffects || !this.game) {
      return;
    }

    const soundId = this.soundMappings.get(actionId) || actionId;

    if (this.game.playSound) {
      this.game.playSound(soundId, volume);
    } else if (this.game.audio && this.game.audio.playSound) {
      this.game.audio.playSound(soundId, volume);
    }
  }

  /**
   * Play background music
   * @param {string} musicType - Type of music to play
   */
  playMusic(musicType) {
    if (!this.options.enableMusicIntegration || !this.game) {
      return;
    }

    const musicId = this.musicMappings.get(musicType) || musicType;

    if (this.game.playMusic) {
      this.game.playMusic(musicId);
    } else if (this.game.audio && this.game.audio.playMusic) {
      this.game.audio.playMusic(musicId);
    }
  }

  /**
   * Trigger a game event
   * @param {string} eventName - Name of event to trigger
   * @param {Object} data - Event data
   */
  triggerGameEvent(eventName, data) {
    const handler = this.eventHandlers.get(eventName);
    if (handler) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in game event handler ${eventName}:`, error);
      }
    }
  }

  /**
   * Get current combat state
   */
  getState() {
    return {
      combat: this.combat ? this.combat.getState() : null,
      currentBattle: this.currentBattle,
      battleQueue: [...this.battleQueue],
      visualState: { ...this.visualState },
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalBattles: this.stats.battlesWon + this.stats.battlesLost,
      winRate:
        this.stats.battlesWon + this.stats.battlesLost > 0
          ? (
              (this.stats.battlesWon /
                (this.stats.battlesWon + this.stats.battlesLost)) *
              100
            ).toFixed(1)
          : 0,
      averageDamagePerBattle:
        this.stats.battlesWon + this.stats.battlesLost > 0
          ? (
              this.stats.totalDamageDealt /
              (this.stats.battlesWon + this.stats.battlesLost)
            ).toFixed(1)
          : 0,
      battleHistoryCount: this.battleHistory.length,
      queuedBattles: this.battleQueue.length,
    };
  }

  /**
   * Get available fighter templates
   */
  getFighterTemplates() {
    return Array.from(this.fighterTemplates.entries()).map(
      ([id, template]) => ({
        id,
        name: template.name,
        description: template.description,
        stats: {
          hp: template.maxHp,
          energy: template.maxEnergy,
          attack: template.attack,
          defense: template.defense,
        },
        actions: template.actions,
        sprite: template.sprite,
        visualTheme: template.visualTheme,
      })
    );
  }

  /**
   * Get available enemy templates
   */
  getEnemyTemplates() {
    return Array.from(this.enemyTemplates.entries()).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      stats: {
        hp: template.maxHp,
        energy: template.maxEnergy,
        attack: template.attack,
        defense: template.defense,
      },
      actions: template.actions,
      aiType: template.aiType,
      sprite: template.sprite,
    }));
  }

  /**
   * Generate a random enemy based on player level
   * @param {number} playerLevel - Player's current level
   * @param {string} difficulty - Difficulty setting
   */
  generateRandomEnemy(playerLevel = 1, difficulty = "normal") {
    if (!this.options.autoGenerateEnemies) {
      return null;
    }

    const templates = Array.from(this.enemyTemplates.keys());
    const baseTemplate =
      templates[Math.floor(Math.random() * templates.length)];

    const multipliers = {
      easy: 0.8,
      normal: 1.0,
      hard: 1.3,
      nightmare: 1.6,
    };

    const multiplier = multipliers[difficulty] || 1.0;
    const levelMultiplier = 1 + (playerLevel - 1) * 0.1;
    const finalMultiplier = multiplier * levelMultiplier;

    const baseEnemy = this.enemyTemplates.get(baseTemplate);

    return this.createEnemy(baseTemplate, {
      maxHp: Math.floor(baseEnemy.maxHp * finalMultiplier),
      maxEnergy: Math.floor(baseEnemy.maxEnergy * finalMultiplier),
      attack: Math.floor(baseEnemy.attack * finalMultiplier),
      defense: Math.floor(baseEnemy.defense * finalMultiplier),
      name: `${baseEnemy.name} (Lv.${playerLevel})`,
    });
  }

  /**
   * Set custom sound mapping
   * @param {string} actionId - Action identifier
   * @param {string} soundId - Sound identifier
   */
  setSoundMapping(actionId, soundId) {
    this.soundMappings.set(actionId, soundId);
  }

  /**
   * Set custom music mapping
   * @param {string} eventType - Event type
   * @param {string} musicId - Music identifier
   */
  setMusicMapping(eventType, musicId) {
    this.musicMappings.set(eventType, musicId);
  }

  /**
   * Add custom event handler
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler function
   */
  addEventHandler(eventName, handler) {
    this.eventHandlers.set(eventName, handler);
  }

  /**
   * Remove event handler
   * @param {string} eventName - Event name
   */
  removeEventHandler(eventName) {
    this.eventHandlers.delete(eventName);
  }

  /**
   * Get battle history
   * @param {number} limit - Maximum number of battles to return
   */
  getBattleHistory(limit = null) {
    if (limit) {
      return this.battleHistory.slice(0, limit);
    }
    return [...this.battleHistory];
  }

  /**
   * Clear battle history
   */
  clearBattleHistory() {
    this.battleHistory = [];
    this.saveBattleHistory();
    this.log("Battle history cleared");
  }

  /**
   * Export combat data for external use
   * @param {boolean} includeHistory - Include battle history
   */
  exportData(includeHistory = true) {
    const exportData = {
      stats: this.getStats(),
      fighterTemplates: Array.from(this.fighterTemplates.entries()),
      enemyTemplates: Array.from(this.enemyTemplates.entries()),
      visualState: this.visualState,
      timestamp: Date.now(),
      gameId: this.getGameId(),
    };

    if (includeHistory) {
      exportData.battleHistory = this.battleHistory;
    }

    return exportData;
  }

  /**
   * Import combat data from external source
   * @param {Object} importData - Data to import
   * @param {boolean} merge - Merge with current data instead of replacing
   */
  importData(importData, merge = false) {
    try {
      if (!importData.stats) {
        throw new Error("Invalid import data: missing stats");
      }

      if (merge) {
        // Merge statistics
        Object.keys(importData.stats).forEach((key) => {
          if (
            typeof this.stats[key] === "number" &&
            typeof importData.stats[key] === "number"
          ) {
            this.stats[key] += importData.stats[key];
          }
        });

        // Merge templates
        if (importData.fighterTemplates) {
          importData.fighterTemplates.forEach(([id, template]) => {
            if (!this.fighterTemplates.has(id)) {
              this.fighterTemplates.set(id, template);
            }
          });
        }

        if (importData.enemyTemplates) {
          importData.enemyTemplates.forEach(([id, template]) => {
            if (!this.enemyTemplates.has(id)) {
              this.enemyTemplates.set(id, template);
            }
          });
        }

        // Merge battle history
        if (importData.battleHistory) {
          this.battleHistory = [
            ...importData.battleHistory,
            ...this.battleHistory,
          ].slice(0, this.options.maxBattleHistory);
        }
      } else {
        // Replace data
        this.stats = { ...importData.stats };

        if (importData.fighterTemplates) {
          this.fighterTemplates = new Map(importData.fighterTemplates);
        }

        if (importData.enemyTemplates) {
          this.enemyTemplates = new Map(importData.enemyTemplates);
        }

        if (importData.battleHistory) {
          this.battleHistory = [...importData.battleHistory];
        }
      }

      this.log("Combat data imported successfully");
      return true;
    } catch (error) {
      console.error("Failed to import combat data:", error);
      return false;
    }
  }

  /**
   * Reset all combat data
   * @param {boolean} keepTemplates - Keep fighter/enemy templates
   */
  reset(keepTemplates = true) {
    // Reset statistics
    this.stats = {
      battlesWon: 0,
      battlesLost: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      totalTurns: 0,
      averageBattleLength: 0,
      favoriteAction: null,
      actionUsageCounts: new Map(),
    };

    // Reset visual state
    this.visualState = {
      lastPlayerAction: null,
      lastEnemyAction: null,
      combatPhase: "idle",
      animationQueue: [],
    };

    // Clear battle data
    this.currentBattle = null;
    this.battleQueue = [];
    this.clearBattleHistory();

    // Reset templates if requested
    if (!keepTemplates) {
      this.fighterTemplates.clear();
      this.enemyTemplates.clear();
      this.loadDefaultTemplates();
    }

    this.log("Combat data reset");
  }

  /**
   * Get game identifier for storage
   * @private
   */
  getGameId() {
    return this.game?.gameId || this.game?.constructor?.name || "combat-game";
  }

  /**
   * Debug logging helper
   * @private
   */
  log(message) {
    if (this.options.enableDebugLogs) {
      console.log(`[Enhanced CombatManager] ${message}`);
    }
  }

  /**
   * Clean up and destroy the manager
   */
  destroy() {
    this.log("Destroying Enhanced CombatManager...");

    // End current battle
    if (this.currentBattle) {
      this.endBattle("destroyed");
    }

    // Clear queued battles
    this.battleQueue = [];

    // Save final data
    if (this.options.persistBattleHistory) {
      this.saveBattleHistory();
    }

    // Destroy combat instance
    if (this.combat) {
      this.combat.destroy();
      this.combat = null;
    }

    // Clear collections
    this.fighterTemplates.clear();
    this.enemyTemplates.clear();
    this.eventHandlers.clear();
    this.soundMappings.clear();
    this.musicMappings.clear();

    // Remove game integration
    if (this.game && this.game.combat) {
      delete this.game.combat;
    }

    this.isInitialized = false;
    this.log("Enhanced CombatManager destroyed");
  }
}
