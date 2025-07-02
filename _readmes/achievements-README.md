# Universal Achievement System

A complete, reusable achievement system for web-based games built with vanilla JavaScript. Features progress tracking, hidden achievements, notifications, and seamless game integration.

![Achievement System Demo](demo-screenshot.png)

## 🚀 **Quick Start**

```javascript
// 1. Include the files
<link rel="stylesheet" href="achievements.css">
<script src="Achievements.js"></script>
<script src="AchievementManager.js"></script>

// 2. Define your achievements
const GAME_ACHIEVEMENTS = {
  "first_win": {
    id: "first_win",
    name: "First Victory",
    description: "Win your first battle",
    icon: "🏆",
    points: 10,
    hidden: false
  }
  // ... more achievements
};

// 3. Initialize in your game
const achievementManager = new AchievementManager(this);
achievementManager.initializeAchievements('#achievement-container', GAME_ACHIEVEMENTS);

// 4. Track stats and unlock achievements
achievementManager.updateGameStat('wins', 1);
achievementManager.unlockAchievement('first_win');
```

## 📁 **File Structure**

```
achievement-system/
├── Achievements.js          // Core reusable class
├── AchievementManager.js    // Game integration class
├── achievements.css         // Complete styling
├── index.html              // Test/demo page
└── README.md               // This file
```

## 🏗️ **Architecture**

### **Two-Class System:**

- **`Achievements`** - Reusable UI and data management (build once, use everywhere)
- **`AchievementManager`** - Game-specific integration (customize per game)

### **Benefits:**

✅ **Drop-in ready** for any game framework  
✅ **Consistent UI/UX** across all your games  
✅ **Clean separation** of concerns  
✅ **Easy to extend** and customize

---

## 📊 **Achievement Data Structure**

### **Basic Achievement**

```javascript
{
  id: "unique_id",
  name: "Achievement Name",
  description: "What the player did",
  icon: "🏆", // emoji or image path
  points: 10,
  hidden: false
}
```

### **Progress Achievement**

```javascript
{
  id: "enemy_slayer",
  name: "Enemy Slayer",
  description: "Defeat 100 enemies",
  icon: "⚔️",
  points: 50,
  hidden: false,
  progress: {
    target: 100,
    current: 0
  }
}
```

### **Hidden Achievement**

```javascript
{
  id: "secret_finder",
  name: "???",
  description: "???",
  icon: "❓",
  points: 100,
  hidden: true,
  hint: "Try clicking the logo 10 times...",
  revealedName: "Secret Finder",
  revealedDescription: "Found the hidden easter egg"
}
```

---

## 🎮 **API Documentation**

## **Achievements Class** (Reusable Core)

### **Constructor**

```javascript
new Achievements(containerSelector, (options = {}));
```

**Parameters:**

- `containerSelector` - CSS selector for achievement container
- `options` - Configuration object

**Options:**

```javascript
{
  storageKey: 'achievements',      // localStorage key
  enableNotifications: true,       // Show unlock popups
  autoSave: true                  // Auto-save on changes
}
```

### **Core Methods**

#### **`setAchievementData(achievementData)`**

Initialize with achievement definitions

```javascript
achievements.setAchievementData(GAME_ACHIEVEMENTS);
```

#### **`unlock(achievementId)`**

Unlock an achievement (if not already unlocked)

```javascript
const unlocked = achievements.unlock("first_win"); // returns boolean
```

#### **`updateProgress(achievementId, currentValue)`**

Update progress with auto-unlock and validation

```javascript
achievements.updateProgress("enemy_slayer", 50); // Auto-unlocks at target
```

#### **`updateUnlocks(unlockedArray)`**

Batch update from save data

```javascript
achievements.updateUnlocks(["first_win", "enemy_slayer"]);
```

#### **`reset()`**

Reset all achievements to locked state

```javascript
achievements.reset();
```

#### **`getUnlocked()`**

Get array of unlocked achievement IDs

```javascript
const unlocked = achievements.getUnlocked(); // ['first_win', 'boss_killer']
```

#### **`isUnlocked(achievementId)`**

Check if specific achievement is unlocked

```javascript
if (achievements.isUnlocked("first_win")) {
  // Achievement is unlocked
}
```

#### **`getTotalPoints()`**

Get total points from unlocked achievements

```javascript
const points = achievements.getTotalPoints(); // 150
```

#### **`getCompletionPercentage()`**

Get completion percentage (0-100)

```javascript
const completion = achievements.getCompletionPercentage(); // 75
```

#### **`save(customKey)` / `load(customKey)`**

Save/load to localStorage

```javascript
achievements.save(); // Uses default key
achievements.load("backup_key"); // Custom key
```

#### **`render()`**

Render the achievement UI (called automatically)

```javascript
achievements.render();
```

#### **`showHint(achievementId)`**

Toggle hint display for hidden achievements

```javascript
achievements.showHint("secret_finder");
```

---

## **AchievementManager Class** (Game Integration)

### **Constructor**

```javascript
new AchievementManager(gameInstance, (options = {}));
```

**Parameters:**

- `gameInstance` - Reference to your main game object
- `options` - Configuration object

**Options:**

```javascript
{
  enableAutoCheck: true,          // Auto-check achievements
  checkInterval: 1000,            // ms between checks
  enableDebugLogs: false          // Console logging
}
```

### **Integration Methods**

#### **`initializeAchievements(containerSelector, achievementData, options)`**

Set up the complete achievement system

```javascript
achievementManager.initializeAchievements("#achievements", GAME_ACHIEVEMENTS, {
  enableNotifications: true,
});
```

#### **`updateGameStat(statName, value)`**

Update a tracked game statistic

```javascript
achievementManager.updateGameStat("enemiesKilled", enemyCount);
achievementManager.updateGameStat("level", 5);
```

#### **`incrementGameStat(statName, amount)`**

Increment a statistic by amount

```javascript
achievementManager.incrementGameStat("wins"); // +1
achievementManager.incrementGameStat("score", 100); // +100
```

#### **`onGameEvent(eventName, eventData)`**

Handle game events for achievement triggers

```javascript
achievementManager.onGameEvent("levelCompleted", {
  time: 120,
  perfectRun: true,
});
```

#### **`registerCustomChecker(achievementId, checkerFunction)`**

Register complex achievement logic

```javascript
achievementManager.registerCustomChecker(
  "perfectionist",
  (stats, achievement) => {
    return stats.deaths === 0 && stats.level >= 10 && stats.score >= 50000;
  }
);
```

#### **`checkAllAchievements()`**

Manually trigger achievement checking

```javascript
achievementManager.checkAllAchievements();
```

### **Convenience Methods**

#### **`unlockAchievement(achievementId)`**

Direct achievement unlock

```javascript
achievementManager.unlockAchievement("special_event");
```

#### **`updateAchievementProgress(achievementId, value)`**

Direct progress update

```javascript
achievementManager.updateAchievementProgress("collector", itemCount);
```

#### **`getAchievementStats()`**

Get achievement system statistics

```javascript
const stats = achievementManager.getAchievementStats();
// { totalPoints: 150, completionPercentage: 75, unlockedCount: 3, totalCount: 4 }
```

### **System Control**

#### **`startAutoCheck()` / `stopAutoCheck()`**

Control automatic achievement checking

```javascript
achievementManager.startAutoCheck();
achievementManager.stopAutoCheck();
```

#### **`saveAchievements()` / `loadAchievements()` / `resetAchievements()`**

Achievement data management

```javascript
achievementManager.saveAchievements();
achievementManager.loadAchievements();
achievementManager.resetAchievements();
```

---

## 🎯 **Integration Examples**

### **With Vanilla JS Game**

```javascript
class MyGame {
  constructor() {
    this.gameState = { wins: 0, enemiesKilled: 0 };
    this.setupAchievements();
  }

  async setupAchievements() {
    this.achievementManager = new AchievementManager(this);
    this.achievementManager.initializeAchievements(
      "#achievements",
      GAME_ACHIEVEMENTS
    );
    this.achievementManager.setGameStats(this.gameState);
  }

  onEnemyKilled() {
    this.gameState.enemiesKilled++;
    this.achievementManager.updateGameStat(
      "enemiesKilled",
      this.gameState.enemiesKilled
    );
  }

  onLevelComplete() {
    this.achievementManager.onGameEvent("levelComplete", {
      time: this.levelTime,
      score: this.score,
    });
  }
}
```

### **With Your Ice Cream Fighter Pattern**

```javascript
class IceCreamFighterAchievements extends AchievementManager {
  constructor(game) {
    super(game, { enableDebugLogs: true });
    this.setupIceCreamAchievements();
  }

  setupIceCreamAchievements() {
    // Register custom achievements
    this.registerCustomChecker("ice_master", (stats) => {
      return stats.battlesWon >= 5 && stats.totalDamage >= 1000;
    });

    this.registerCustomChecker("speed_runner", (stats) => {
      return stats.lastEvent === "battleWon" && stats.lastEventData.time < 30;
    });
  }
}

// In your main game
this.achievementManager = new IceCreamFighterAchievements(this);
this.achievementManager.initializeAchievements(
  "#achievements",
  ICE_CREAM_ACHIEVEMENTS
);
```

---

## ⚙️ **Configuration Options**

### **Achievement System Options**

```javascript
const options = {
  // Core settings
  storageKey: "myGame_achievements",
  enableNotifications: true,
  autoSave: true,

  // Manager settings
  enableAutoCheck: true,
  checkInterval: 2000,
  enableDebugLogs: true,
};
```

### **CSS Customization**

The CSS uses CSS variables for easy theming:

```css
:root {
  --achievement-primary-color: #48dbfb;
  --achievement-secondary-color: #0abde3;
  --achievement-background: rgba(255, 255, 255, 0.1);
  --achievement-text-color: white;
}
```

---

## 🎨 **Styling**

### **CSS Classes Available**

- `.achievement-item` - Individual achievement
- `.achievement-item.unlocked` - Unlocked state
- `.achievement-item.locked` - Locked state
- `.achievement-item.hidden` - Hidden achievement
- `.achievement-progress-bar` - Progress bar container
- `.achievement-notification` - Notification popup

### **Custom Styling Example**

```css
/* Custom achievement theme */
.achievement-item.unlocked {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
  border-color: #your-accent-color;
}

.achievement-notification {
  background: linear-gradient(135deg, #your-brand-color-1, #your-brand-color-2);
}
```

---

## 🔧 **Advanced Usage**

### **Custom Achievement Types**

```javascript
// Stat-based achievement
const statAchievement = {
  id: "high_scorer",
  name: "High Scorer",
  description: "Reach 10,000 points",
  icon: "📈",
  points: 30,
  progress: { target: 10000, current: 0 },
};

// Event-based achievement
achievementManager.registerCustomChecker("combo_master", (stats) => {
  return (
    stats.lastEvent === "comboCompleted" && stats.lastEventData.comboSize >= 10
  );
});

// Time-based achievement
achievementManager.registerCustomChecker("speed_demon", (stats) => {
  return stats.lastEvent === "raceFinished" && stats.lastEventData.time < 60;
});
```

### **Achievement Categories** (Future Enhancement)

```javascript
// While not implemented yet, you can organize achievements:
const COMBAT_ACHIEVEMENTS = {
  /* combat achievements */
};
const EXPLORATION_ACHIEVEMENTS = {
  /* exploration achievements */
};
const SECRET_ACHIEVEMENTS = {
  /* hidden achievements */
};

const ALL_ACHIEVEMENTS = {
  ...COMBAT_ACHIEVEMENTS,
  ...EXPLORATION_ACHIEVEMENTS,
  ...SECRET_ACHIEVEMENTS,
};
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Achievement container not found**

```javascript
// ❌ Wrong - element doesn't exist
new Achievements("#nonexistent-container", {});

// ✅ Correct - ensure element exists
const container = document.querySelector("#achievements");
if (container) {
  const achievements = new Achievements("#achievements", {});
}
```

**Achievements not unlocking**

```javascript
// ❌ Wrong - checking before initialization
achievementManager.unlockAchievement("test"); // Will fail

// ✅ Correct - wait for initialization
achievementManager.initializeAchievements("#container", data);
achievementManager.unlockAchievement("test"); // Works
```

**Progress not updating**

```javascript
// ❌ Wrong - progress achievement without progress property
{
  id: "collector",
  name: "Collector",
  // Missing progress property
}

// ✅ Correct - include progress object
{
  id: "collector",
  name: "Collector",
  progress: { target: 100, current: 0 }
}
```

**Notifications not showing**

```javascript
// Check if notifications are enabled
const achievements = new Achievements("#container", {
  enableNotifications: true, // Make sure this is true
});
```

### **Debug Mode**

```javascript
const achievementManager = new AchievementManager(game, {
  enableDebugLogs: true, // Enable console logging
});
```

---

## 📱 **Browser Support**

- ✅ **Chrome 60+**
- ✅ **Firefox 55+**
- ✅ **Safari 12+**
- ✅ **Edge 79+**
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

**Features used:**

- ES6 Classes
- CSS Grid and Flexbox
- localStorage
- CSS Transitions and Animations

---

## 🔮 **Future Enhancements**

### **Planned Features:**

- [ ] Achievement categories and filtering
- [ ] Sound integration for different rarities
- [ ] Social sharing functionality
- [ ] Achievement import/export
- [ ] Server-side achievement sync
- [ ] Achievement analytics and metrics

### **Contributing:**

This is a personal toolkit component. If you extend it for your projects, feel free to share improvements!

---

## 📄 **License**

This achievement system is part of a personal game development toolkit. Use freely in your own projects.

---

## 🎮 **Example Games Using This System**

- **Ice Cream Fighter** - Turn-based combat game
- **[Your Next Game]** - Ready for integration!

---

**Built with ❤️ for fast, reusable game development**
