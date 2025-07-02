/**
 * Enhanced Combat - Core Turn-Based Combat System
 * A reusable 4-action combat system with rich visual feedback and animations
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class Combat {
  constructor(options = {}) {
    // Configuration options
    this.options = {
      enableAnimations: true,
      enableSounds: true,
      enableTooltips: true,
      maxActionsPerTurn: 4,
      turnDelay: 1000,
      animationDuration: 800,
      damageNumberDuration: 2000,
      autoSave: true,
      ...options,
    };

    // Combat state - ENHANCED with visual states
    this.state = {
      isActive: false,
      turn: 1,
      phase: "select", // 'select', 'animate', 'resolve'
      currentFighter: "player",
      turnType: "player", // For UI styling
      animating: false, // Disable interactions during animations
      selectedActions: {
        player: [],
        enemy: [],
      },
      fighters: {
        player: null,
        enemy: null,
      },
      battleResults: null,
    };

    // Action definitions - configurable defaults
    this.defaultActions = {
      defend: {
        id: "defend",
        name: "Defend",
        type: "defense",
        energyCost: 1,
        power: 0,
        effects: ["block_next_attack"],
        cooldown: 0,
        description: "Block the next incoming attack and reduce damage by 50%",
        icon: "🛡️",
      },
      heal: {
        id: "heal",
        name: "Heal",
        type: "recovery",
        energyCost: 3,
        power: 30, // Percentage of max HP
        effects: ["restore_hp"],
        cooldown: 1,
        description: "Restore 30% of maximum health",
        icon: "💚",
      },
      powerup: {
        id: "powerup",
        name: "Power Up",
        type: "buff",
        energyCost: 2,
        power: 50, // Percentage boost
        effects: ["boost_damage"],
        duration: 3,
        cooldown: 0,
        description: "Increase damage by 50% for 3 turns",
        icon: "⚡",
      },
      light_attack: {
        id: "light_attack",
        name: "Quick Strike",
        type: "attack",
        energyCost: 2,
        power: 25,
        effects: ["damage"],
        cooldown: 0,
        description: "Fast attack with moderate damage",
        icon: "👊",
      },
      heavy_attack: {
        id: "heavy_attack",
        name: "Power Strike",
        type: "attack",
        energyCost: 4,
        power: 50,
        effects: ["damage"],
        cooldown: 0,
        description: "Slow attack with high damage",
        icon: "💥",
      },
      restore_energy: {
        id: "restore_energy",
        name: "Focus",
        type: "recovery",
        energyCost: 0,
        power: 40, // Percentage of max energy
        effects: ["restore_energy"],
        cooldown: 1,
        description: "Restore 40% of maximum energy",
        icon: "🔄",
      },
    };

    // Event callbacks
    this.callbacks = {
      onTurnStart: null,
      onActionSelect: null,
      onActionExecute: null,
      onTurnEnd: null,
      onBattleEnd: null,
      onAnimationStart: null,
      onAnimationEnd: null,
    };

    // UI element references
    this.elements = {};

    // Active effects tracking
    this.activeEffects = {
      player: new Map(),
      enemy: new Map(),
    };

    this.init();
  }

  /**
   * Initialize the combat system
   */
  init() {
    try {
      this.log("Initializing Enhanced Combat system...");
      this.bindUIElements();
      this.setupEventListeners();
      this.log("Enhanced Combat system initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Combat system:", error);
      return false;
    }
  }

  /**
   * Bind UI elements for combat
   */
  bindUIElements() {
    // Combat container
    this.elements.container = document.querySelector(".combat-container");

    // Fighter displays
    this.elements.playerFighter = document.querySelector(".player-fighter");
    this.elements.enemyFighter = document.querySelector(".enemy-fighter");

    // Fighter sprites for animations
    this.elements.playerSprite =
      document.querySelector(".player-fighter .fighter-sprite") ||
      document.querySelector("#player-sprite");
    this.elements.enemySprite =
      document.querySelector(".enemy-fighter .fighter-sprite") ||
      document.querySelector("#enemy-sprite");

    // Action buttons
    this.elements.actionButtons = document.querySelectorAll(".combat-action");

    // Stats displays
    this.elements.playerStats =
      document.querySelector(".player-fighter .fighter-stats") ||
      document.querySelector(".player-stats");
    this.elements.enemyStats =
      document.querySelector(".enemy-fighter .fighter-stats") ||
      document.querySelector(".enemy-stats");

    // Health and energy bars
    this.elements.playerHpBar =
      document.querySelector(".player-fighter .hp-bar-fill") ||
      document.querySelector("#player-hp-bar");
    this.elements.playerEnergyBar =
      document.querySelector(".player-fighter .energy-bar-fill") ||
      document.querySelector("#player-energy-bar");
    this.elements.enemyHpBar =
      document.querySelector(".enemy-fighter .hp-bar-fill") ||
      document.querySelector("#enemy-hp-bar");
    this.elements.enemyEnergyBar =
      document.querySelector(".enemy-fighter .energy-bar-fill") ||
      document.querySelector("#enemy-energy-bar");

    // Turn indicator
    this.elements.turnIndicator = document.querySelector(".turn-indicator");

    // Tooltip
    this.elements.tooltip = document.querySelector(".combat-tooltip");

    // Animation overlays
    this.elements.animationLayer = document.querySelector(".animation-layer");

    // Create animation layer if it doesn't exist
    if (!this.elements.animationLayer && this.elements.container) {
      this.elements.animationLayer = document.createElement("div");
      this.elements.animationLayer.className = "animation-layer";
      this.elements.container.appendChild(this.elements.animationLayer);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    if (this.elements.actionButtons) {
      this.elements.actionButtons.forEach((button) => {
        // Action selection
        button.addEventListener("click", (e) => {
          this.handleActionClick(e);
        });

        // Tooltip display
        if (this.options.enableTooltips) {
          button.addEventListener("mouseenter", (e) => {
            this.showTooltip(e.target);
          });

          button.addEventListener("mouseleave", (e) => {
            this.hideTooltip();
          });
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardInput(e);
    });
  }

  /**
   * Start a new battle
   * @param {Object} playerFighter - Player fighter configuration
   * @param {Object} enemyFighter - Enemy fighter configuration
   * @param {Object} battleOptions - Battle-specific options
   */
  startBattle(playerFighter, enemyFighter, battleOptions = {}) {
    try {
      this.log("Starting new battle...");

      // Validate fighters
      if (
        !this.validateFighter(playerFighter) ||
        !this.validateFighter(enemyFighter)
      ) {
        throw new Error("Invalid fighter configuration");
      }

      // Initialize battle state
      this.state.isActive = true;
      this.state.turn = 1;
      this.state.phase = "select";
      this.state.currentFighter = "player";
      this.state.turnType = "player";
      this.state.animating = false;
      this.state.fighters.player = this.initializeFighter(playerFighter);
      this.state.fighters.enemy = this.initializeFighter(enemyFighter);
      this.state.selectedActions = { player: [], enemy: [] };
      this.state.battleResults = null;

      // Clear active effects
      this.activeEffects.player.clear();
      this.activeEffects.enemy.clear();

      // Apply battle options
      this.applyBattleOptions(battleOptions);

      // Update UI with enhanced visual states
      this.updateUI();
      this.showActionSelection();

      // Trigger callback
      this.triggerCallback("onTurnStart", {
        turn: this.state.turn,
        player: this.state.fighters.player,
        enemy: this.state.fighters.enemy,
      });

      this.log("Battle started successfully");
      return true;
    } catch (error) {
      console.error("Failed to start battle:", error);
      return false;
    }
  }

  /**
   * Validate fighter configuration
   * @param {Object} fighter - Fighter to validate
   */
  validateFighter(fighter) {
    const required = ["name", "maxHp", "maxEnergy", "attack", "defense"];
    return required.every(
      (prop) =>
        (fighter.hasOwnProperty(prop) && typeof fighter[prop] === "number") ||
        typeof fighter[prop] === "string"
    );
  }

  /**
   * Initialize fighter with default values
   * @param {Object} fighter - Fighter configuration
   */
  initializeFighter(fighter) {
    const initialized = {
      ...fighter,
      hp: fighter.hp || fighter.maxHp,
      energy: fighter.energy || fighter.maxEnergy,
      actions: fighter.actions || Object.keys(this.defaultActions).slice(0, 4),
      statusEffects: new Map(),
      cooldowns: new Map(),
    };

    // Merge custom actions with defaults
    if (fighter.customActions) {
      initialized.customActions = {
        ...this.defaultActions,
        ...fighter.customActions,
      };
    } else {
      initialized.customActions = { ...this.defaultActions };
    }

    return initialized;
  }

  /**
   * Apply battle-specific options
   * @param {Object} battleOptions - Options to apply
   */
  applyBattleOptions(battleOptions) {
    // Override default options for this battle
    Object.assign(this.options, battleOptions);
  }

  /**
   * Handle action button click
   * @param {Event} event - Click event
   */
  handleActionClick(event) {
    if (
      this.state.phase !== "select" ||
      this.state.currentFighter !== "player" ||
      this.state.animating
    ) {
      return;
    }

    const actionId =
      event.target.dataset.action ||
      event.target.closest(".combat-action")?.dataset.action;
    if (!actionId) return;

    this.selectAction("player", actionId);
  }

  /**
   * Select an action for a fighter
   * @param {string} fighterId - 'player' or 'enemy'
   * @param {string} actionId - ID of action to select
   */
  selectAction(fighterId, actionId) {
    try {
      const fighter = this.state.fighters[fighterId];
      const action = fighter.customActions[actionId];

      if (!action) {
        throw new Error(`Action not found: ${actionId}`);
      }

      // Check energy cost
      if (fighter.energy < action.energyCost) {
        this.showError("Not enough energy!");
        return false;
      }

      // Check cooldown
      if (
        fighter.cooldowns.has(actionId) &&
        fighter.cooldowns.get(actionId) > 0
      ) {
        this.showError("Action is on cooldown!");
        return false;
      }

      // Check action limit
      if (
        this.state.selectedActions[fighterId].length >=
        this.options.maxActionsPerTurn
      ) {
        this.showError("Maximum actions selected!");
        return false;
      }

      // Add action to selection
      this.state.selectedActions[fighterId].push({
        actionId,
        action: { ...action },
        fighter: fighterId,
      });

      // Update UI
      this.updateActionDisplay(fighterId);

      // Trigger callback
      this.triggerCallback("onActionSelect", {
        fighter: fighterId,
        action: action,
        selectedCount: this.state.selectedActions[fighterId].length,
      });

      // Check if turn is complete
      if (
        this.state.selectedActions.player.length > 0 &&
        this.state.selectedActions.enemy.length > 0
      ) {
        this.processTurn();
      } else if (fighterId === "player") {
        // Generate enemy actions
        this.generateEnemyActions();
      }

      return true;
    } catch (error) {
      console.error("Failed to select action:", error);
      return false;
    }
  }

  /**
   * Generate AI actions for enemy
   */
  generateEnemyActions() {
    const enemy = this.state.fighters.enemy;
    const player = this.state.fighters.player;

    // Simple AI logic - can be overridden
    let selectedAction = null;

    // Priority system
    if (enemy.hp < enemy.maxHp * 0.3 && enemy.energy >= 3) {
      // Low health - try to heal
      selectedAction = "heal";
    } else if (enemy.energy < enemy.maxEnergy * 0.5 && enemy.energy >= 0) {
      // Low energy - restore energy
      selectedAction = "restore_energy";
    } else if (player.hp > player.maxHp * 0.7 && enemy.energy >= 4) {
      // Player healthy - use heavy attack
      selectedAction = "heavy_attack";
    } else if (enemy.energy >= 2) {
      // Default - light attack
      selectedAction = "light_attack";
    } else {
      // No energy - defend
      selectedAction = "defend";
    }

    // Fallback to available actions
    const availableActions = enemy.actions.filter((actionId) => {
      const action = enemy.customActions[actionId];
      return (
        enemy.energy >= action.energyCost &&
        (!enemy.cooldowns.has(actionId) || enemy.cooldowns.get(actionId) <= 0)
      );
    });

    if (
      availableActions.length > 0 &&
      !availableActions.includes(selectedAction)
    ) {
      selectedAction =
        availableActions[Math.floor(Math.random() * availableActions.length)];
    }

    if (selectedAction) {
      this.selectAction("enemy", selectedAction);
    }
  }

  /**
   * Process the turn with selected actions
   */
  processTurn() {
    try {
      this.state.phase = "animate";
      this.state.animating = true;
      this.state.turnType = "processing";
      this.log(`Processing turn ${this.state.turn}...`);

      // Update UI to show processing state
      this.updateUI();

      // Determine action order (speed-based or simultaneous)
      const actionOrder = this.determineActionOrder();

      // Execute actions in order
      this.executeActionsSequence(actionOrder);
    } catch (error) {
      console.error("Failed to process turn:", error);
    }
  }

  /**
   * Determine the order of action execution
   */
  determineActionOrder() {
    const allActions = [
      ...this.state.selectedActions.player.map((a) => ({
        ...a,
        fighter: "player",
      })),
      ...this.state.selectedActions.enemy.map((a) => ({
        ...a,
        fighter: "enemy",
      })),
    ];

    // Sort by action priority (defense first, then attacks)
    return allActions.sort((a, b) => {
      const priorityOrder = { defense: 0, buff: 1, recovery: 2, attack: 3 };
      return priorityOrder[a.action.type] - priorityOrder[b.action.type];
    });
  }

  /**
   * Execute actions in sequence with animations
   * @param {Array} actionOrder - Ordered list of actions to execute
   */
  async executeActionsSequence(actionOrder) {
    for (const actionData of actionOrder) {
      await this.executeAction(actionData);
      await this.wait(this.options.animationDuration);
    }

    // Resolve turn
    this.resolveTurn();
  }

  /**
   * Execute a single action
   * @param {Object} actionData - Action data to execute
   */
  async executeAction(actionData) {
    const { fighter: fighterId, action, actionId } = actionData;
    const attacker = this.state.fighters[fighterId];
    const defender =
      this.state.fighters[fighterId === "player" ? "enemy" : "player"];

    try {
      // Deduct energy cost
      attacker.energy = Math.max(0, attacker.energy - action.energyCost);

      // Apply cooldown
      if (action.cooldown > 0) {
        attacker.cooldowns.set(actionId, action.cooldown);
      }

      // Execute action effects
      const result = await this.applyActionEffects(action, attacker, defender);

      // Trigger animation
      if (this.options.enableAnimations) {
        await this.playActionAnimation(actionData, result);
      }

      // Update UI immediately after action
      this.updateUI();

      // Trigger callback
      this.triggerCallback("onActionExecute", {
        action: actionData,
        result: result,
        attacker: attacker,
        defender: defender,
      });

      return result;
    } catch (error) {
      console.error("Failed to execute action:", error);
      return null;
    }
  }

  /**
   * Apply action effects
   * @param {Object} action - Action definition
   * @param {Object} attacker - Acting fighter
   * @param {Object} defender - Target fighter
   */
  async applyActionEffects(action, attacker, defender) {
    const result = {
      damage: 0,
      healing: 0,
      energyRestore: 0,
      blocked: false,
      effects: [],
    };

    for (const effect of action.effects) {
      switch (effect) {
        case "damage":
          result.damage = this.calculateDamage(action, attacker, defender);
          if (this.hasActiveEffect(defender, "block_next_attack")) {
            result.damage = Math.floor(result.damage * 0.5);
            result.blocked = true;
            this.removeEffect(defender, "block_next_attack");
          }
          defender.hp = Math.max(0, defender.hp - result.damage);
          break;

        case "restore_hp":
          result.healing = Math.floor(attacker.maxHp * (action.power / 100));
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + result.healing);
          break;

        case "restore_energy":
          result.energyRestore = Math.floor(
            attacker.maxEnergy * (action.power / 100)
          );
          attacker.energy = Math.min(
            attacker.maxEnergy,
            attacker.energy + result.energyRestore
          );
          break;

        case "block_next_attack":
          this.addEffect(attacker, "block_next_attack", 1);
          result.effects.push("Defense stance active");
          break;

        case "boost_damage":
          this.addEffect(
            attacker,
            "boost_damage",
            action.duration || 3,
            action.power
          );
          result.effects.push(`Damage boosted by ${action.power}%`);
          break;
      }
    }

    return result;
  }

  /**
   * Calculate damage for an attack
   * @param {Object} action - Attack action
   * @param {Object} attacker - Attacking fighter
   * @param {Object} defender - Defending fighter
   */
  calculateDamage(action, attacker, defender) {
    let baseDamage = action.power + attacker.attack;

    // Apply damage boost if active
    if (this.hasActiveEffect(attacker, "boost_damage")) {
      const boostValue = this.getEffectValue(attacker, "boost_damage");
      baseDamage = Math.floor(baseDamage * (1 + boostValue / 100));
    }

    // Apply defense
    const finalDamage = Math.max(1, baseDamage - defender.defense);

    return finalDamage;
  }

  /**
   * Add a status effect to a fighter
   * @param {Object} fighter - Fighter to add effect to
   * @param {string} effectId - Effect identifier
   * @param {number} duration - Duration in turns
   * @param {number} value - Effect value (optional)
   */
  addEffect(fighter, effectId, duration, value = null) {
    fighter.statusEffects.set(effectId, {
      duration: duration,
      value: value,
      startTurn: this.state.turn,
    });
  }

  /**
   * Remove a status effect from a fighter
   * @param {Object} fighter - Fighter to remove effect from
   * @param {string} effectId - Effect identifier
   */
  removeEffect(fighter, effectId) {
    fighter.statusEffects.delete(effectId);
  }

  /**
   * Check if fighter has an active effect
   * @param {Object} fighter - Fighter to check
   * @param {string} effectId - Effect identifier
   */
  hasActiveEffect(fighter, effectId) {
    return (
      fighter.statusEffects.has(effectId) &&
      fighter.statusEffects.get(effectId).duration > 0
    );
  }

  /**
   * Get the value of an active effect
   * @param {Object} fighter - Fighter to check
   * @param {string} effectId - Effect identifier
   */
  getEffectValue(fighter, effectId) {
    const effect = fighter.statusEffects.get(effectId);
    return effect ? effect.value : null;
  }

  /**
   * Play action animation with enhanced visual feedback
   * @param {Object} actionData - Action data
   * @param {Object} result - Action result
   */
  async playActionAnimation(actionData, result) {
    const { fighter: fighterId, action } = actionData;
    const attackerSprite = this.elements[`${fighterId}Sprite`];
    const defenderSprite =
      this.elements[`${fighterId === "player" ? "enemy" : "player"}Sprite`];

    if (!attackerSprite) return;

    // Trigger animation start callback
    this.triggerCallback("onAnimationStart", { action: actionData, result });

    // Add animation class based on action type
    const animationClass = `combat-${action.type}-animation`;
    attackerSprite.classList.add(animationClass);

    // Add hit animation to defender if damage was dealt
    if (result.damage > 0 && defenderSprite) {
      setTimeout(() => {
        defenderSprite.classList.add("combat-hit-flash");
        setTimeout(() => {
          defenderSprite.classList.remove("combat-hit-flash");
        }, 600);
      }, 200);
    }

    // Show damage numbers if applicable
    if (result.damage > 0) {
      this.showDamageNumber(
        fighterId === "player" ? "enemy" : "player",
        result.damage,
        false
      );
    }
    if (result.healing > 0) {
      this.showDamageNumber(fighterId, result.healing, true);
    }
    if (result.energyRestore > 0) {
      this.showEnergyNumber(fighterId, result.energyRestore);
    }

    // Wait for animation
    await this.wait(this.options.animationDuration);

    // Remove animation class
    attackerSprite.classList.remove(animationClass);

    // Trigger animation end callback
    this.triggerCallback("onAnimationEnd", { action: actionData, result });
  }

  /**
   * Show damage/healing number animation
   * @param {string} fighterId - Fighter receiving the effect
   * @param {number} amount - Amount to display
   * @param {boolean} isHealing - Whether this is healing or damage
   */
  showDamageNumber(fighterId, amount, isHealing = false) {
    if (!this.elements.animationLayer) return;

    const fighterElement =
      this.elements[`${fighterId}Fighter`] ||
      this.elements[`${fighterId}Sprite`];
    if (!fighterElement) return;

    const rect = fighterElement.getBoundingClientRect();
    const containerRect = this.elements.container.getBoundingClientRect();

    const numberElement = document.createElement("div");
    numberElement.className = `damage-number ${
      isHealing ? "healing" : "damage"
    }`;
    numberElement.textContent = `${isHealing ? "+" : "-"}${amount}`;

    // Position relative to container
    numberElement.style.left = `${
      rect.left - containerRect.left + rect.width / 2
    }px`;
    numberElement.style.top = `${rect.top - containerRect.top}px`;

    this.elements.animationLayer.appendChild(numberElement);

    // Remove after animation
    setTimeout(() => {
      if (numberElement.parentNode) {
        numberElement.remove();
      }
    }, this.options.damageNumberDuration);
  }

  /**
   * Show energy restore number animation
   * @param {string} fighterId - Fighter receiving energy
   * @param {number} amount - Amount of energy restored
   */
  showEnergyNumber(fighterId, amount) {
    if (!this.elements.animationLayer) return;

    const fighterElement =
      this.elements[`${fighterId}Fighter`] ||
      this.elements[`${fighterId}Sprite`];
    if (!fighterElement) return;

    const rect = fighterElement.getBoundingClientRect();
    const containerRect = this.elements.container.getBoundingClientRect();

    const numberElement = document.createElement("div");
    numberElement.className = "energy-number";
    numberElement.textContent = `+${amount} Energy`;

    // Position relative to container
    numberElement.style.left = `${
      rect.left - containerRect.left + rect.width / 2
    }px`;
    numberElement.style.top = `${rect.top - containerRect.top + 30}px`;

    this.elements.animationLayer.appendChild(numberElement);

    // Remove after animation
    setTimeout(() => {
      if (numberElement.parentNode) {
        numberElement.remove();
      }
    }, this.options.damageNumberDuration);
  }

  /**
   * Resolve the turn and prepare for next
   */
  resolveTurn() {
    try {
      this.state.phase = "resolve";
      this.state.animating = false;

      // Update status effects and cooldowns
      this.updateStatusEffects();
      this.updateCooldowns();

      // Check for battle end conditions
      if (this.checkBattleEnd()) {
        return;
      }

      // Prepare for next turn
      this.state.turn++;
      this.state.phase = "select";
      this.state.turnType = "player";
      this.state.selectedActions = { player: [], enemy: [] };

      // Update UI
      this.updateUI();
      this.showActionSelection();

      // Trigger turn end callback
      this.triggerCallback("onTurnEnd", {
        turn: this.state.turn - 1,
        player: this.state.fighters.player,
        enemy: this.state.fighters.enemy,
      });

      // Trigger new turn start callback
      this.triggerCallback("onTurnStart", {
        turn: this.state.turn,
        player: this.state.fighters.player,
        enemy: this.state.fighters.enemy,
      });
    } catch (error) {
      console.error("Failed to resolve turn:", error);
    }
  }

  /**
   * Update status effects duration
   */
  updateStatusEffects() {
    [this.state.fighters.player, this.state.fighters.enemy].forEach(
      (fighter) => {
        const toRemove = [];

        fighter.statusEffects.forEach((effect, effectId) => {
          effect.duration--;
          if (effect.duration <= 0) {
            toRemove.push(effectId);
          }
        });

        toRemove.forEach((effectId) => {
          fighter.statusEffects.delete(effectId);
        });
      }
    );
  }

  /**
   * Update action cooldowns
   */
  updateCooldowns() {
    [this.state.fighters.player, this.state.fighters.enemy].forEach(
      (fighter) => {
        const toRemove = [];

        fighter.cooldowns.forEach((cooldown, actionId) => {
          const newCooldown = cooldown - 1;
          if (newCooldown <= 0) {
            toRemove.push(actionId);
          } else {
            fighter.cooldowns.set(actionId, newCooldown);
          }
        });

        toRemove.forEach((actionId) => {
          fighter.cooldowns.delete(actionId);
        });
      }
    );
  }

  /**
   * Check if the battle has ended
   */
  checkBattleEnd() {
    const player = this.state.fighters.player;
    const enemy = this.state.fighters.enemy;

    let winner = null;
    let reason = null;

    if (player.hp <= 0 && enemy.hp <= 0) {
      winner = "draw";
      reason = "Both fighters defeated";
    } else if (player.hp <= 0) {
      winner = "enemy";
      reason = "Player defeated";
    } else if (enemy.hp <= 0) {
      winner = "player";
      reason = "Enemy defeated";
    }

    if (winner) {
      this.endBattle(winner, reason);
      return true;
    }

    return false;
  }

  /**
   * End the battle
   * @param {string} winner - Winner of the battle
   * @param {string} reason - Reason for battle end
   */
  endBattle(winner, reason) {
    this.state.isActive = false;
    this.state.animating = false;
    this.state.battleResults = {
      winner: winner,
      reason: reason,
      turns: this.state.turn,
      playerFinalStats: { ...this.state.fighters.player },
      enemyFinalStats: { ...this.state.fighters.enemy },
    };

    // Trigger battle end callback
    this.triggerCallback("onBattleEnd", this.state.battleResults);

    this.log(`Battle ended: ${winner} wins - ${reason}`);
  }

  /**
   * Update the combat UI with enhanced visual feedback
   */
  updateUI() {
    try {
      this.updateFighterDisplay("player");
      this.updateFighterDisplay("enemy");
      this.updateTurnIndicator();
      this.updateActionButtons();
      this.updateContainerState();
    } catch (error) {
      console.error("Failed to update UI:", error);
    }
  }

  /**
   * Update container visual state based on turn
   */
  updateContainerState() {
    if (!this.elements.container) return;

    // Remove all state classes
    this.elements.container.classList.remove(
      "player-turn",
      "enemy-turn",
      "animating",
      "selecting-actions"
    );

    // Add appropriate state class
    if (this.state.animating) {
      this.elements.container.classList.add("animating");
    } else if (this.state.phase === "select") {
      this.elements.container.classList.add("selecting-actions");
      this.elements.container.classList.add(`${this.state.turnType}-turn`);
    }
  }

  /**
   * Update fighter display with enhanced health/energy bars
   * @param {string} fighterId - Fighter to update
   */
  updateFighterDisplay(fighterId) {
    const fighter = this.state.fighters[fighterId];
    const container = this.elements[`${fighterId}Stats`];

    if (!fighter || !container) return;

    // Update HP bar with animations
    const hpBar =
      this.elements[`${fighterId}HpBar`] ||
      container.querySelector(".hp-bar-fill");
    if (hpBar) {
      const hpPercent = (fighter.hp / fighter.maxHp) * 100;
      const oldPercent = parseFloat(hpBar.style.width) || 100;

      hpBar.style.width = `${Math.max(0, hpPercent)}%`;

      // Add animation class based on change
      if (hpPercent < oldPercent) {
        hpBar.classList.add("stat-decreased");
        setTimeout(() => hpBar.classList.remove("stat-decreased"), 600);
      } else if (hpPercent > oldPercent) {
        hpBar.classList.add("stat-increased");
        setTimeout(() => hpBar.classList.remove("stat-increased"), 600);
      }

      // Add low health warning
      if (hpPercent <= 25) {
        hpBar.classList.add("low-hp");
      } else {
        hpBar.classList.remove("low-hp");
      }
    }

    // Update energy bar with animations
    const energyBar =
      this.elements[`${fighterId}EnergyBar`] ||
      container.querySelector(".energy-bar-fill");
    if (energyBar) {
      const energyPercent = (fighter.energy / fighter.maxEnergy) * 100;
      const oldPercent = parseFloat(energyBar.style.width) || 100;

      energyBar.style.width = `${Math.max(0, energyPercent)}%`;

      // Add animation class based on change
      if (energyPercent < oldPercent) {
        energyBar.classList.add("stat-decreased");
        setTimeout(() => energyBar.classList.remove("stat-decreased"), 600);
      } else if (energyPercent > oldPercent) {
        energyBar.classList.add("stat-increased");
        setTimeout(() => energyBar.classList.remove("stat-increased"), 600);
      }

      // Add low energy warning
      if (energyPercent <= 25) {
        energyBar.classList.add("low-energy");
      } else {
        energyBar.classList.remove("low-energy");
      }
    }

    // Update text values
    const hpText =
      container.querySelector(".hp-text") ||
      container.querySelector(".stat-text");
    if (hpText) {
      hpText.textContent = `${fighter.hp}/${fighter.maxHp}`;
    }

    const energyText =
      container.querySelector(".energy-text") ||
      container.querySelector(".energy-stat-text");
    if (energyText) {
      energyText.textContent = `${fighter.energy}/${fighter.maxEnergy}`;
    }

    // Update critical health state
    const fighterCard = this.elements[`${fighterId}Fighter`];
    if (fighterCard) {
      if (fighter.hp <= fighter.maxHp * 0.25) {
        fighterCard.classList.add("critical-health");
      } else {
        fighterCard.classList.remove("critical-health");
      }
    }

    // Update status effects
    this.updateStatusEffectsDisplay(fighterId);
  }

  /**
   * Update status effects display
   * @param {string} fighterId - Fighter to update
   */
  updateStatusEffectsDisplay(fighterId) {
    const fighter = this.state.fighters[fighterId];
    const container = this.elements[`${fighterId}Stats`];

    if (!fighter || !container) return;

    const effectsContainer = container.querySelector(".status-effects");
    if (!effectsContainer) return;

    effectsContainer.innerHTML = "";

    fighter.statusEffects.forEach((effect, effectId) => {
      const effectElement = document.createElement("div");
      effectElement.className = `status-effect ${effectId}`;
      effectElement.textContent = `${effectId} (${effect.duration})`;
      effectsContainer.appendChild(effectElement);
    });
  }

  /**
   * Update turn indicator
   */
  updateTurnIndicator() {
    if (this.elements.turnIndicator) {
      const phaseText = this.state.animating
        ? "Processing..."
        : this.state.phase === "select"
        ? "Select Actions"
        : "Turn";
      this.elements.turnIndicator.textContent = `Turn ${this.state.turn} - ${phaseText}`;
    }
  }

  /**
   * Update action buttons with enhanced states
   */
  updateActionButtons() {
    if (!this.elements.actionButtons) return;

    const player = this.state.fighters.player;
    if (!player) return;

    this.elements.actionButtons.forEach((button) => {
      const actionId = button.dataset.action;
      if (!actionId || !player.actions.includes(actionId)) {
        button.style.display = "none";
        return;
      }

      button.style.display = "block";

      const action = player.customActions[actionId];
      if (!action) return;

      // Update button content
      const nameElement = button.querySelector(".action-name");
      if (nameElement) {
        nameElement.textContent = action.name;
      }

      const iconElement = button.querySelector(".action-icon");
      if (iconElement) {
        iconElement.textContent = action.icon;
      }

      const costElement = button.querySelector(".action-cost");
      if (costElement) {
        costElement.textContent = action.energyCost;
      }

      // Update button state
      const canUse =
        player.energy >= action.energyCost &&
        (!player.cooldowns.has(actionId) ||
          player.cooldowns.get(actionId) <= 0) &&
        this.state.selectedActions.player.length <
          this.options.maxActionsPerTurn &&
        this.state.phase === "select" &&
        !this.state.animating;

      button.disabled = !canUse;
      button.classList.toggle("disabled", !canUse);

      // Set action type for styling
      button.setAttribute("data-action-type", action.type);

      // Show cooldown if active
      const cooldownElement = button.querySelector(".action-cooldown");
      if (cooldownElement) {
        const cooldown = player.cooldowns.get(actionId) || 0;
        if (cooldown > 0) {
          cooldownElement.textContent = cooldown;
          cooldownElement.style.display = "block";
        } else {
          cooldownElement.style.display = "none";
        }
      }
    });
  }

  /**
   * Show action selection UI
   */
  showActionSelection() {
    this.state.turnType = "player";
    this.updateContainerState();
  }

  /**
   * Update action display for a fighter
   * @param {string} fighterId - Fighter whose actions to update
   */
  updateActionDisplay(fighterId) {
    const selectedContainer = document.querySelector(
      `.${fighterId}-selected-actions`
    );
    if (!selectedContainer) return;

    selectedContainer.innerHTML = "";

    this.state.selectedActions[fighterId].forEach((actionData, index) => {
      const actionElement = document.createElement("div");
      actionElement.className = "selected-action";
      actionElement.innerHTML = `
        <span class="action-icon">${actionData.action.icon}</span>
        <span class="action-name">${actionData.action.name}</span>
      `;
      selectedContainer.appendChild(actionElement);
    });
  }

  /**
   * Show tooltip for an action with enhanced damage calculation
   * @param {Element} button - Button element
   */
  showTooltip(button) {
    if (!this.elements.tooltip) return;

    const actionId = button.dataset.action;
    const player = this.state.fighters.player;
    const enemy = this.state.fighters.enemy;

    if (!actionId || !player) return;

    const action = player.customActions[actionId];
    if (!action) return;

    let tooltipContent = `
      <div class="tooltip-header">
        <span class="tooltip-icon">${action.icon}</span>
        <span class="tooltip-name">${action.name}</span>
      </div>
      <div class="tooltip-description">${action.description}</div>
    `;

    // Add damage calculation for attacks
    if (action.type === "attack" && enemy) {
      const baseDamage = action.power + player.attack;
      let finalDamage = Math.max(1, baseDamage - enemy.defense);

      // Account for boost
      if (this.hasActiveEffect(player, "boost_damage")) {
        const boostValue = this.getEffectValue(player, "boost_damage");
        finalDamage = Math.floor(finalDamage * (1 + boostValue / 100));
        tooltipContent += `<div class="tooltip-damage boosted">Damage: ${finalDamage} (boosted)</div>`;
      } else {
        tooltipContent += `<div class="tooltip-damage">Damage: ${finalDamage}</div>`;
      }
    }

    // Add healing calculation
    if (action.effects.includes("restore_hp")) {
      const healAmount = Math.floor(player.maxHp * (action.power / 100));
      tooltipContent += `<div class="tooltip-healing">Healing: ${healAmount} HP</div>`;
    }

    // Add energy restore calculation
    if (action.effects.includes("restore_energy")) {
      const energyAmount = Math.floor(player.maxEnergy * (action.power / 100));
      tooltipContent += `<div class="tooltip-energy">Energy: +${energyAmount}</div>`;
    }

    tooltipContent += `
      <div class="tooltip-stats">
        <div>Energy Cost: ${action.energyCost}</div>
    `;

    if (action.cooldown > 0) {
      tooltipContent += `<div>Cooldown: ${action.cooldown} turns</div>`;
    }

    tooltipContent += "</div>";

    this.elements.tooltip.innerHTML = tooltipContent;
    this.elements.tooltip.classList.add("visible");

    // Position tooltip
    this.positionTooltip(button);
  }

  /**
   * Position tooltip relative to button
   * @param {Element} button - Reference button
   */
  positionTooltip(button) {
    if (!this.elements.tooltip) return;

    const buttonRect = button.getBoundingClientRect();
    const containerRect = this.elements.container.getBoundingClientRect();

    this.elements.tooltip.style.left = `${
      buttonRect.left - containerRect.left
    }px`;
    this.elements.tooltip.style.top = `${
      buttonRect.top -
      containerRect.top -
      this.elements.tooltip.offsetHeight -
      10
    }px`;
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (this.elements.tooltip) {
      this.elements.tooltip.classList.remove("visible");
    }
  }

  /**
   * Handle keyboard input
   * @param {Event} event - Keyboard event
   */
  handleKeyboardInput(event) {
    if (
      this.state.phase !== "select" ||
      this.state.currentFighter !== "player" ||
      this.state.animating
    ) {
      return;
    }

    const keyActions = {
      1: 0,
      2: 1,
      3: 2,
      4: 3,
      5: 4,
      6: 5,
    };

    const actionIndex = keyActions[event.key];
    if (actionIndex !== undefined) {
      const player = this.state.fighters.player;
      if (player && player.actions[actionIndex]) {
        this.selectAction("player", player.actions[actionIndex]);
      }
    }
  }

  /**
   * Show error message with enhanced animation
   * @param {string} message - Error message to display
   */
  showError(message) {
    // Create temporary error display
    const errorElement = document.createElement("div");
    errorElement.className = "combat-error";
    errorElement.textContent = message;

    if (this.elements.container) {
      this.elements.container.appendChild(errorElement);

      setTimeout(() => {
        if (errorElement.parentNode) {
          errorElement.remove();
        }
      }, 2000);
    }
  }

  /**
   * Set callback function
   * @param {string} callbackName - Name of callback
   * @param {Function} callback - Callback function
   */
  setCallback(callbackName, callback) {
    if (this.callbacks.hasOwnProperty(callbackName)) {
      this.callbacks[callbackName] = callback;
    }
  }

  /**
   * Trigger a callback if it exists
   * @param {string} callbackName - Name of callback to trigger
   * @param {Object} data - Data to pass to callback
   */
  triggerCallback(callbackName, data) {
    if (
      this.callbacks[callbackName] &&
      typeof this.callbacks[callbackName] === "function"
    ) {
      try {
        this.callbacks[callbackName](data);
      } catch (error) {
        console.error(`Error in callback ${callbackName}:`, error);
      }
    }
  }

  /**
   * Get current battle state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get battle results
   */
  getResults() {
    return this.state.battleResults;
  }

  /**
   * Pause/resume battle
   * @param {boolean} paused - Whether to pause
   */
  setPaused(paused) {
    this.state.paused = paused;
    this.state.animating = paused;
    this.updateUI();
  }

  /**
   * Wait for specified time
   * @param {number} ms - Milliseconds to wait
   */
  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log debug message
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.options.enableDebugLogs) {
      console.log(`[Enhanced Combat] ${message}`);
    }
  }

  /**
   * Clean up and destroy the combat instance
   */
  destroy() {
    this.log("Destroying Enhanced Combat instance...");

    // Clear any active timers
    this.clearTimers();

    // Reset state
    this.state.isActive = false;
    this.state.animating = false;

    // Clear event listeners
    this.removeEventListeners();

    this.log("Enhanced Combat instance destroyed");
  }

  /**
   * Clear active timers
   */
  clearTimers() {
    // Override in implementation if needed
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    // Override in implementation if needed
  }
}
