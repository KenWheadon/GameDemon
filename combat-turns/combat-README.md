# Combat System

A powerful, configurable turn-based combat system for web-based games built with vanilla JavaScript. Features customizable movesets, visual feedback, AI opponents, and seamless game integration.

![Combat System Demo](combat-demo.png)

## 🚀 **Quick Start**

```javascript
// 1. Include the files
<link rel="stylesheet" href="combat.css">
<script src="Combat.js"></script>
<script src="CombatManager.js"></script>

// 2. Initialize with your game
const combatManager = new CombatManager(gameInstance, {
  enableSoundEffects: true,
  enableMusicIntegration: true
});

// 3. Start a battle
combatManager.startBattle('default', 'basic');

// 4. Handle events
gameInstance.onBattleEnd = (results) => {
  console.log(`Battle ended: ${results.winner} wins!`);
};
```

## 📁 **File Structure**

```
combat-system/
├── Combat.js              // Core reusable combat engine
├── CombatManager.js       // Game integration manager
├── combat.css             // Complete styling system
├── combat-test.html       // Standalone test/demo page
└── README-combat.md       // This documentation
```

## 🏗️ **Architecture**

### **Two-Class System:**

- **`Combat`** - Reusable combat engine (build once, use everywhere)
- **`CombatManager`** - Game-specific integration with templates and advanced features

### **Benefits:**

✅ **Configurable movesets** per fighter  
✅ **Visual-first** feedback system  
✅ **Complete UI** with tooltips and animations  
✅ **AI system** for enemy opponents  
✅ **Drop-in ready** for any game framework  
✅ **Production-ready** with error handling and accessibility

---

## 📊 **Core Concepts**

### **Combat Actions**

The system supports 6 configurable action types:

```javascript
{
  defend: {
    name: 'Defend',
    type: 'defense',
    energyCost: 1,
    effects: ['block_next_attack'],
    description: 'Block the next incoming attack'
  },
  heal: {
    name: 'Heal',
    type: 'recovery',
    energyCost: 3,
    power: 30, // 30% of max HP
    effects: ['restore_hp'],
    description: 'Restore 30% of maximum health'
  },
  powerup: {
    name: 'Power Up',
    type: 'buff',
    energyCost: 2,
    power: 50, // 50% damage boost
    effects: ['boost_damage'],
    duration: 3,
    description: 'Increase damage by 50% for 3 turns'
  },
  light_attack: {
    name: 'Quick Strike',
    type: 'attack',
    energyCost: 2,
    power: 25,
    effects: ['damage'],
    description: 'Fast attack with moderate damage'
  },
  heavy_attack: {
    name: 'Power Strike',
    type: 'attack',
    energyCost: 4,
    power: 50,
    effects: ['damage'],
    description: 'Slow attack with high damage'
  },
  restore_energy: {
    name: 'Focus',
    type: 'recovery',
    energyCost: 0,
    power: 40, // 40% of max energy
    effects: ['restore_energy'],
    description: 'Restore 40% of maximum energy'
  }
}
```

### **Fighter Configuration**

```javascript
const fighter = {
  name: "Warrior",
  maxHp: 100,
  maxEnergy: 20,
  attack: 10,
  defense: 5,
  actions: ["light_attack", "heavy_attack", "defend", "powerup"],
  customActions: {
    // Override default actions or add new ones
    heavy_attack: {
      name: "Rage Strike",
      power: 60,
      description: "A devastating berserker attack",
    },
  },
};
```

### **Turn-Based Flow**

1. **Action Selection** - Players choose actions (up to max limit)
2. **AI Decision** - Enemy AI selects actions based on strategy
3. **Action Resolution** - Actions execute in priority order
4. **Animation Phase** - Visual feedback and damage numbers
5. **Turn Cleanup** - Update effects, cooldowns, and prepare next turn

### **Visual Feedback**

- **Health/Energy Bars** - Animated progress bars
- **Damage Numbers** - Floating numbers for damage/healing
- **Status Effects** - Visual indicators for buffs/debuffs
- **Action Animations** - Fighter sprite animations
- **Tooltips** - Detailed action information on hover

---

## 🎮 **API Documentation**

## **Combat Class** (Core Engine)

### **Constructor**

```javascript
new Combat((options = {}));
```

**Options:**

```javascript
{
  enableAnimations: true,        // Enable fighter animations
  enableSounds: true,            // Enable sound effect hooks
  enableTooltips: true,          // Enable action tooltips
  maxActionsPerTurn: 4,          // Max actions per turn
  turnDelay: 1000,               // Delay between turns (ms)
  animationDuration: 800,        // Animation length (ms)
  damageNumberDuration: 2000,    // Damage number display time
  autoSave: true                 // Auto-save battle state
}
```

### **Core Methods**

#### **`startBattle(playerFighter, enemyFighter, battleOptions)`**

Start a new battle

```javascript
const success = combat.startBattle(
  {
    name: "Hero",
    maxHp: 100,
    maxEnergy: 20,
    attack: 10,
    defense: 5,
    actions: ["light_attack", "heavy_attack", "defend", "powerup"],
  },
  {
    name: "Goblin",
    maxHp: 80,
    maxEnergy: 15,
    attack: 8,
    defense: 4,
    actions: ["light_attack", "defend"],
  },
  { maxActionsPerTurn: 1 } // Battle-specific options
);
```

#### **`selectAction(fighterId, actionId)`**

Select an action for a fighter

```javascript
// Player selects light attack
combat.selectAction("player", "light_attack");

// AI selects defend
combat.selectAction("enemy", "defend");
```

#### **`getState()` / `getResults()`**

Get current battle state and final results

```javascript
const state = combat.getState();
const results = combat.getResults(); // null until battle ends
```

#### **`setCallback(callbackName, callback)`**

Set event callbacks

```javascript
combat.setCallback("onTurnStart", (data) => {
  console.log(`Turn ${data.turn} started`);
});

combat.setCallback("onBattleEnd", (data) => {
  console.log(`${data.winner} wins!`);
});
```

**Available Callbacks:**

- `onTurnStart` - New turn begins
- `onTurnEnd` - Turn completed
- `onActionSelect` - Action selected
- `onActionExecute` - Action executed with results
- `onBattleEnd` - Battle completed
- `onAnimationStart` - Animation begins
- `onAnimationEnd` - Animation completed

#### **`setPaused(paused)` / `destroy()`**

Control battle state

```javascript
combat.setPaused(true); // Pause battle
combat.setPaused(false); // Resume battle
combat.destroy(); // Clean up resources
```

## **CombatManager Class** (Game Integration)

### **Constructor**

```javascript
new CombatManager(gameInstance, (options = {}));
```

**Parameters:**

- `gameInstance` - Reference to your main game object
- `options` - Configuration object

**Options:**

```javascript
{
  enableDebugLogs: false,          // Console logging
  enableAutoSave: true,            // Auto-save game state
  enableSoundEffects: true,        // Play sound effects
  enableMusicIntegration: true,    // Play background music
  enableAchievements: true,        // Achievement integration
  autoGenerateEnemies: true,       // Auto-generate scaled enemies
  battleTransitions: true,         // Auto-start queued battles
  persistBattleHistory: true,      // Save battle history
  maxBattleHistory: 10             // Max battles to remember
}
```

### **Fighter Management**

#### **`addFighterTemplate(templateId, template)`**

Add a reusable fighter template

```javascript
combatManager.addFighterTemplate("mage", {
  name: "Battle Mage",
  maxHp: 90,
  maxEnergy: 25,
  attack: 12,
  defense: 4,
  actions: ["light_attack", "heavy_attack", "heal", "powerup"],
  customActions: {
    heavy_attack: {
      name: "Fireball",
      icon: "🔥",
      power: 45,
      description: "A blazing magical attack",
    },
    heal: {
      name: "Healing Light",
      icon: "✨",
      power: 35,
      description: "Restore health with divine magic",
    },
  },
  description: "A spellcaster with powerful magic abilities",
});
```

#### **`addEnemyTemplate(templateId, template)`**

Add a reusable enemy template

```javascript
combatManager.addEnemyTemplate("dragon", {
  name: "Ancient Dragon",
  maxHp: 200,
  maxEnergy: 30,
  attack: 20,
  defense: 12,
  actions: ["light_attack", "heavy_attack", "powerup", "heal"],
  aiType: "aggressive",
  description: "A legendary beast with devastating attacks",
});
```

#### **`createFighter(templateId, overrides)` / `createEnemy(templateId, overrides)`**

Create fighters from templates with custom properties

```javascript
const customHero = combatManager.createFighter("mage", {
  name: "Archmage Eldrin",
  maxHp: 120,
  attack: 15,
  customActions: {
    powerup: {
      name: "Arcane Surge",
      power: 75,
      description: "Channel immense magical power",
    },
  },
});

const weakenedDragon = combatManager.createEnemy("dragon", {
  name: "Injured Dragon",
  maxHp: 150,
  attack: 15,
});
```

### **Battle Management**

#### **`startBattle(playerFighter, enemyFighter, battleOptions)`**

Start a battle using templates or direct objects

```javascript
// Using template IDs
combatManager.startBattle("mage", "dragon");

// Using template ID + custom enemy
combatManager.startBattle("mage", customEnemy);

// Using direct fighter objects
combatManager.startBattle(customHero, weakenedDragon, {
  maxActionsPerTurn: 2,
  turnDelay: 1200,
});
```

#### **`queueBattle(battleData)` / `startNextBattle()`**

Queue multiple battles for campaigns

```javascript
// Queue a series of battles
combatManager.queueBattle({
  playerFighter: "default",
  enemyFighter: "basic",
  options: { maxActionsPerTurn: 1 },
});

combatManager.queueBattle({
  playerFighter: "default",
  enemyFighter: "warrior",
});

// Start the queue
combatManager.startNextBattle();
```

#### **`generateRandomEnemy(playerLevel, difficulty)`**

Auto-generate scaled enemies

```javascript
const enemy = combatManager.generateRandomEnemy(5, "hard");
// Creates a level 5 enemy with hard difficulty scaling
```

### **Statistics & Data**

#### **`getStats()`**

Get comprehensive battle statistics

```javascript
const stats = combatManager.getStats();
console.log(stats);
// {
//   battlesWon: 12,
//   battlesLost: 3,
//   totalBattles: 15,
//   winRate: "80.0%",
//   totalDamageDealt: 1250,
//   totalDamageTaken: 800,
//   averageBattleLength: 6.2,
//   favoriteAction: "light_attack",
//   battleHistoryCount: 10
// }
```

#### **`getBattleHistory(limit)` / `clearBattleHistory()`**

Access battle history

```javascript
const recentBattles = combatManager.getBattleHistory(5);
recentBattles.forEach((battle) => {
  console.log(
    `${battle.id}: ${battle.results.winner} won in ${battle.results.turns} turns`
  );
});
```

#### **`exportData(includeHistory)` / `importData(data, merge)`**

Save and load combat data

```javascript
// Export all data
const saveData = combatManager.exportData(true);
localStorage.setItem("combat-save", JSON.stringify(saveData));

// Import and merge
const loadData = JSON.parse(localStorage.getItem("combat-save"));
combatManager.importData(loadData, true);
```

### **Templates & Information**

#### **`getFighterTemplates()` / `getEnemyTemplates()`**

Get available templates for UI display

```javascript
const fighters = combatManager.getFighterTemplates();
// [
//   {
//     id: 'mage',
//     name: 'Battle Mage',
//     description: 'A spellcaster...',
//     stats: { hp: 90, energy: 25, attack: 12, defense: 4 },
//     actions: ['light_attack', 'heavy_attack', 'heal', 'powerup']
//   }
// ]

// Use for character selection UI
fighters.forEach((fighter) => {
  const button = document.createElement("button");
  button.textContent = `${fighter.name} (${fighter.stats.hp} HP)`;
  button.onclick = () => selectFighter(fighter.id);
  selectionContainer.appendChild(button);
});
```

---

## 🎯 **Integration Examples**

### **Basic Game Integration**

```javascript
class MyGame {
  constructor() {
    this.setupCombat();
  }

  setupCombat() {
    this.combatManager = new CombatManager(this, {
      enableSoundEffects: true,
      enableMusicIntegration: true,
    });

    // Add custom fighter
    this.combatManager.addFighterTemplate("knight", {
      name: "Paladin Knight",
      maxHp: 120,
      maxEnergy: 18,
      attack: 12,
      defense: 8,
      actions: ["light_attack", "heavy_attack", "defend", "heal"],
      customActions: {
        defend: {
          name: "Holy Shield",
          icon: "⚜️",
          description: "Divine protection blocks attacks",
        },
      },
    });
  }

  // Event handlers called by CombatManager
  onBattleStart(data) {
    this.showCombatUI();
    this.playMusic("battle_theme");
  }

  onBattleEnd(data) {
    if (data.winner === "player") {
      this.giveRewards();
      this.unlockAchievement("first_victory");
    }
    this.showResultsScreen(data);
  }

  onDamageDealt(data) {
    this.playSound("hit_sound");
    this.updateCombatLog(`Dealt ${data.damage} damage!`);
  }

  // Start a story battle
  startStoryBattle(chapterData) {
    this.combatManager.startBattle(
      this.player.selectedFighter,
      chapterData.enemyTemplate,
      {
        maxActionsPerTurn: chapterData.difficulty,
        turnDelay: 1000,
      }
    );
  }
}
```

### **Character Selection System**

```javascript
class CharacterSelector {
  constructor(combatManager) {
    this.combatManager = combatManager;
    this.buildSelectionUI();
  }

  buildSelectionUI() {
    const container = document.getElementById("character-selection");
    const templates = this.combatManager.getFighterTemplates();

    templates.forEach((template) => {
      const card = this.createCharacterCard(template);
      container.appendChild(card);
    });
  }

  createCharacterCard(template) {
    const card = document.createElement("div");
    card.className = "character-card";
    card.innerHTML = `
      <h3>${template.name}</h3>
      <div class="stats">
        <div>❤️ ${template.stats.hp}</div>
        <div>⚡ ${template.stats.energy}</div>
        <div>⚔️ ${template.stats.attack}</div>
        <div>🛡️ ${template.stats.defense}</div>
      </div>
      <div class="actions">
        ${template.actions
          .map((action) => `<span class="action-tag">${action}</span>`)
          .join("")}
      </div>
      <p>${template.description}</p>
      <button onclick="selectCharacter('${template.id}')">Select</button>
    `;
    return card;
  }
}

function selectCharacter(templateId) {
  const fighter = combatManager.createFighter(templateId);
  game.setPlayerFighter(fighter);
  showBattleScreen();
}
```

### **Campaign System**

```javascript
class CampaignManager {
  constructor(combatManager) {
    this.combatManager = combatManager;
    this.currentChapter = 1;
    this.campaignData = this.loadCampaignData();
  }

  startCampaign() {
    this.setupCampaignBattles();
    this.combatManager.startNextBattle();
  }

  setupCampaignBattles() {
    this.campaignData.chapters.forEach((chapter, index) => {
      this.combatManager.queueBattle({
        playerFighter: "player_current",
        enemyFighter: chapter.boss,
        options: {
          maxActionsPerTurn: chapter.difficulty,
          turnDelay: 800,
        },
      });
    });
  }

  onChapterComplete(battleResults) {
    if (battleResults.winner === "player") {
      this.currentChapter++;
      this.giveChapterRewards();

      if (this.currentChapter <= this.campaignData.chapters.length) {
        this.combatManager.startNextBattle();
      } else {
        this.completeCampaign();
      }
    } else {
      this.showGameOver();
    }
  }
}
```

### **Real-time Combat UI Updates**

```javascript
class CombatUI {
  constructor(combatManager) {
    this.combatManager = combatManager;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for combat events
    this.combatManager.combat.setCallback("onActionExecute", (data) => {
      this.showActionFeedback(data);
      this.updateFighterDisplay(data.attacker);
      this.updateFighterDisplay(data.defender);
    });

    this.combatManager.combat.setCallback("onTurnStart", (data) => {
      this.updateTurnCounter(data.turn);
      this.enableActionButtons();
    });

    this.combatManager.combat.setCallback("onAnimationStart", () => {
      this.disableActionButtons();
      this.showLoadingSpinner();
    });
  }

  showActionFeedback(data) {
    const { action, result, attacker } = data;

    // Show floating combat text
    if (result.damage > 0) {
      this.showFloatingText(`-${result.damage}`, "damage");
    }

    if (result.healing > 0) {
      this.showFloatingText(`+${result.healing}`, "healing");
    }

    // Update combat log
    this.addCombatLogEntry(`${attacker.name} used ${action.action.name}!`);

    // Trigger screen shake for big hits
    if (result.damage > 30) {
      this.triggerScreenShake();
    }
  }
}
```

---

## ⚙️ **Advanced Features**

### **Custom AI Systems**

```javascript
// Override enemy AI decision making
combatManager.combat.generateEnemyActions = function () {
  const enemy = this.state.fighters.enemy;
  const player = this.state.fighters.player;

  // Custom AI logic
  if (enemy.hp < enemy.maxHp * 0.2) {
    // Desperate - always heal or restore energy
    return enemy.energy >= 3 ? "heal" : "restore_energy";
  }

  if (player.statusEffects.has("boost_damage")) {
    // Player is boosted - defend or attack aggressively
    return enemy.energy >= 4 ? "heavy_attack" : "defend";
  }

  // Normal strategy
  const strategies = [
    "light_attack",
    "light_attack",
    "heavy_attack",
    "powerup",
  ];
  return strategies[Math.floor(Math.random() * strategies.length)];
};
```

### **Dynamic Difficulty Scaling**

```javascript
class DifficultyManager {
  constructor(combatManager) {
    this.combatManager = combatManager;
    this.playerPerformance = [];
  }

  adjustDifficulty() {
    const recentWinRate = this.calculateRecentWinRate();

    if (recentWinRate > 0.8) {
      // Player winning too much - increase difficulty
      this.scaleEnemyStats(1.2);
    } else if (recentWinRate < 0.3) {
      // Player struggling - decrease difficulty
      this.scaleEnemyStats(0.8);
    }
  }

  scaleEnemyStats(multiplier) {
    const templates = this.combatManager.getEnemyTemplates();
    templates.forEach((template) => {
      const enemy = this.combatManager.createEnemy(template.id, {
        maxHp: Math.floor(template.stats.hp * multiplier),
        attack: Math.floor(template.stats.attack * multiplier),
        defense: Math.floor(template.stats.defense * multiplier),
      });
    });
  }
}
```

### **Achievement Integration**

```javascript
class CombatAchievements {
  constructor(combatManager, achievementSystem) {
    this.combatManager = combatManager;
    this.achievements = achievementSystem;
    this.setupTracking();
  }

  setupTracking() {
    this.combatManager.combat.setCallback("onActionExecute", (data) => {
      this.trackActionAchievements(data);
    });

    this.combatManager.combat.setCallback("onBattleEnd", (data) => {
      this.trackBattleAchievements(data);
    });
  }

  trackActionAchievements(data) {
    // Perfect defense achievement
    if (data.action.actionId === "defend" && data.result.blocked) {
      this.achievements.progress("perfect_defense");
    }

    // Heavy hitter achievement
    if (data.result.damage > 50) {
      this.achievements.unlock("heavy_hitter");
    }

    // Healing master achievement
    if (data.result.healing > 30) {
      this.achievements.progress("healing_master");
    }
  }

  trackBattleAchievements(data) {
    // Flawless victory
    if (
      data.winner === "player" &&
      data.playerFinalStats.hp === data.playerFinalStats.maxHp
    ) {
      this.achievements.unlock("flawless_victory");
    }

    // Speed demon
    if (data.winner === "player" && data.turns <= 3) {
      this.achievements.unlock("speed_demon");
    }

    // Underdog victory
    if (data.winner === "player" && data.playerFinalStats.hp <= 10) {
      this.achievements.unlock("underdog");
    }
  }
}
```

### **Save/Load System Integration**

```javascript
class GameSaveManager {
  saveGame() {
    const saveData = {
      player: this.getPlayerData(),
      progress: this.getProgressData(),
      combat: this.combatManager.exportData(true), // Include battle history
      timestamp: Date.now(),
    };

    localStorage.setItem("game-save", JSON.stringify(saveData));
  }

  loadGame() {
    const saveData = JSON.parse(localStorage.getItem("game-save"));

    if (saveData) {
      this.setPlayerData(saveData.player);
      this.setProgressData(saveData.progress);

      // Restore combat data
      this.combatManager.importData(saveData.combat, false);

      return true;
    }

    return false;
  }
}
```

---

## 🔧 **Customization Guide**

### **Creating Custom Actions**

```javascript
// Define a new action type
const poisonAttack = {
  id: "poison_attack",
  name: "Venomous Strike",
  type: "attack",
  energyCost: 3,
  power: 20,
  effects: ["damage", "poison_dot"],
  cooldown: 2,
  description: "Attack that deals damage and applies poison",
  icon: "🐍",
};

// Add custom effect handler
const originalApplyEffects = combatManager.combat.applyActionEffects;
combatManager.combat.applyActionEffects = function (
  action,
  attacker,
  defender
) {
  const result = originalApplyEffects.call(this, action, attacker, defender);

  // Handle custom poison effect
  if (action.effects.includes("poison_dot")) {
    this.addEffect(defender, "poison", 3, 5); // 5 damage per turn for 3 turns
    result.effects.push("Poisoned for 3 turns");
  }

  return result;
};
```

### **Custom Fighter Archetypes**

```javascript
// Tank archetype - high HP/defense, low damage
combatManager.addFighterTemplate("tank", {
  name: "Guardian Tank",
  maxHp: 150,
  maxEnergy: 16,
  attack: 6,
  defense: 12,
  actions: ["light_attack", "defend", "heal", "powerup"],
  customActions: {
    defend: {
      name: "Fortress Stance",
      description: "Become an immovable object",
      effects: ["block_next_attack", "damage_reduction"],
    },
  },
});

// Glass cannon - high damage, low survivability
combatManager.addFighterTemplate("assassin", {
  name: "Shadow Assassin",
  maxHp: 70,
  maxEnergy: 24,
  attack: 18,
  defense: 2,
  actions: ["light_attack", "heavy_attack", "restore_energy", "powerup"],
  customActions: {
    light_attack: {
      name: "Shadow Strike",
      power: 35,
      energyCost: 3,
      description: "Swift strike from the shadows",
    },
  },
});
```

### **Environmental Effects**

```javascript
class BattleEnvironment {
  constructor(combatManager) {
    this.combatManager = combatManager;
    this.currentEnvironment = null;
  }

  applyEnvironment(environmentType) {
    switch (environmentType) {
      case "volcanic":
        // All fire attacks deal +25% damage
        this.modifyActionType("fire", { powerMultiplier: 1.25 });
        // All fighters lose 2 HP per turn
        this.addPerTurnEffect("burn_damage", 2);
        break;

      case "arctic":
        // Energy costs increased by 1
        this.modifyAllActions({ energyCostModifier: 1 });
        // Healing effects reduced by 25%
        this.modifyActionType("recovery", { powerMultiplier: 0.75 });
        break;

      case "sacred_ground":
        // All healing doubled
        this.modifyActionType("recovery", { powerMultiplier: 2.0 });
        // Defensive actions more effective
        this.modifyActionType("defense", { effectivenessMultiplier: 1.5 });
        break;
    }
  }
}
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Combat doesn't start**

```javascript
// Check fighter validation
const fighter = {
  name: "Test",
  maxHp: 100,
  maxEnergy: 20,
  attack: 10,
  defense: 5,
};
console.log("Fighter valid:", combatManager.combat.validateFighter(fighter));

// Check required HTML elements
console.log("Combat container:", document.querySelector(".combat-container"));
console.log("Action buttons:", document.querySelectorAll(".combat-action"));
```

**Actions not working**

```javascript
// Verify action configuration
const player = combatManager.combat.state.fighters.player;
console.log("Player actions:", player.actions);
console.log("Custom actions:", Object.keys(player.customActions));

// Check energy and cooldowns
console.log("Energy:", player.energy, "/", player.maxEnergy);
console.log("Cooldowns:", Array.from(player.cooldowns.entries()));
```

**UI not updating**

```javascript
// Check element binding
const combat = combatManager.combat;
console.log("UI elements bound:", Object.keys(combat.elements));

// Force UI update
combat.updateUI();

// Check for JavaScript errors in console
// Ensure CSS is properly loaded
```

**Animations not playing**

```javascript
// Check animation settings
console.log(
  "Animations enabled:",
  combatManager.combat.options.enableAnimations
);

// Test manual animation
const sprite = document.querySelector(".fighter-sprite");
sprite.classList.add("combat-attack-animation");
setTimeout(() => sprite.classList.remove("combat-attack-animation"), 800);

// Verify CSS animation classes exist
```

### **Debug Mode**

```javascript
// Enable comprehensive debugging
const combatManager = new CombatManager(game, {
  enableDebugLogs: true,
});

// Use browser console for debugging
window.debugCombat = {
  manager: combatManager,
  state: () => combatManager.getState(),
  stats: () => combatManager.getStats(),
  forceEnd: () => combatManager.combat.endBattle("debug"),
  simulateAction: (fighterId, actionId) => {
    combatManager.combat.selectAction(fighterId, actionId);
  },
};

// Monitor combat events
combatManager.combat.setCallback("onActionExecute", (data) => {
  console.log("🎬 Action:", data.action.action.name, "Result:", data.result);
});
```

### **Performance Optimization**

```javascript
// Reduce animation overhead for low-end devices
const isMobile =
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

const combatOptions = {
  enableAnimations: !isMobile,
  animationDuration: isMobile ? 400 : 800,
  damageNumberDuration: isMobile ? 1000 : 2000,
};

// Disable tooltips on touch devices
if ("ontouchstart" in window) {
  combatOptions.enableTooltips = false;
}

const combatManager = new CombatManager(game, combatOptions);
```

---

## 📱 **Browser Support**

- ✅ **Chrome 60+**
- ✅ **Firefox 55+**
- ✅ **Safari 12+**
- ✅ **Edge 79+**
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

**Features used:**

- ES6 Classes and modern JavaScript
- CSS Grid and Flexbox
- CSS Custom Properties (variables)
- CSS Animations and Transitions
- LocalStorage for persistence

---

## 🔮 **Best Practices**

### **Fighter Design**

```javascript
// ✅ Good: Balanced and thematic
const knight = {
  name: "Paladin Knight",
  maxHp: 120, // High survivability
  maxEnergy: 18, // Lower energy pool
  attack: 10, // Moderate damage
  defense: 8, // High defense
  actions: ["light_attack", "heavy_attack", "defend", "heal"], // Defensive theme
};

// ❌ Avoid: Overpowered or nonsensical
const brokenFighter = {
  maxHp: 999, // Too high
  maxEnergy: 100, // Too high
  attack: 50, // Too high
  defense: 50, // Too high
  actions: ["light_attack", "powerup", "heal", "restore_energy"], // No weaknesses
};
```

### **Action Balance**

```javascript
// ✅ Good: Clear trade-offs
const balancedAction = {
  name: "Crushing Blow",
  energyCost: 5, // High cost
  power: 60, // High damage
  cooldown: 2, // Cooldown prevents spam
  description: "Devastating attack with long recovery",
};

// ❌ Avoid: No-brainer choices
const overpoweredAction = {
  energyCost: 1, // Too cheap
  power: 50, // Too strong
  cooldown: 0, // No cooldown
  effects: ["damage", "heal", "boost"], // Too many benefits
};
```

### **State Management**

```javascript
// ✅ Good: Use the manager for game integration
class MyGame {
  startBattle(playerTemplate, enemyTemplate) {
    // Let the manager handle everything
    return this.combatManager.startBattle(playerTemplate, enemyTemplate);
  }

  onBattleEnd(results) {
    // Update game state based on results
    if (results.winner === "player") {
      this.player.experience += 100;
      this.unlockNextLevel();
    }
  }
}

// ❌ Avoid: Direct manipulation of combat state
class BadExample {
  cheatingMethod() {
    // Don't directly modify combat state
    this.combatManager.combat.state.fighters.player.hp = 999;
    this.combatManager.combat.state.fighters.enemy.hp = 1;
  }
}
```

### **UI Integration**

```javascript
// ✅ Good: Responsive to combat events
class CombatUI {
  constructor(combatManager) {
    combatManager.combat.setCallback("onActionExecute", (data) => {
      this.updateCombatLog(data);
      this.triggerFeedbackEffects(data);
    });
  }
}

// ✅ Good: Graceful degradation
const features = {
  animations: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  tooltips: !("ontouchstart" in window),
  sounds: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};
```

---

## 📄 **License**

This combat system is part of the Vanilla JavaScript Game Development Toolkit. Use freely in your own projects.

---

**Built with ❤️ for fast, reusable game development**

_Ready to create epic turn-based battles? Drop this system into your game and start fighting!_
