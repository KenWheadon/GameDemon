# Slot Machine System

A comprehensive, reusable slot machine system for web-based games built with vanilla JavaScript. Features customizable symbols, payouts, animations, and seamless game integration.

![Slot Machine Demo](slot-machine-demo.png)

## 🚀 **Quick Start**

```javascript
// 1. Include the files
<link rel="stylesheet" href="slot-machine.css">
<script src="SlotMachine.js"></script>
<script src="SlotMachineManager.js"></script>

// 2. Create and configure slot machine
const slotManager = new SlotMachineManager(gameInstance, {
  enableAchievements: true,
  enableAudio: true
});

// 3. Create UI in your container
slotManager.createUI('#slot-container');

// 4. Set up symbols and payouts (optional - has sensible defaults)
slotManager.slotMachine.setSymbols([
  { name: 'cherry', emoji: '🍒', weight: 30, color: '#ff6b6b' },
  { name: 'lemon', emoji: '🍋', weight: 25, color: '#ffd93d' },
  { name: 'jackpot', emoji: '💎', weight: 5, color: '#48dbfb' }
]);

// 5. Start spinning!
slotManager.spin();
```

## 📁 **File Structure**

```
slot-machine-system/
├── SlotMachine.js              // Core reusable class
├── SlotMachineManager.js       // Game integration class
├── slot-machine.css            // Complete styling system
├── slot-machine-test.html      // Standalone test page
└── README-slot-machine.md      // This documentation
```

## 🏗️ **Architecture**

### **Two-Class System:**

- **`SlotMachine`** - Pure slot machine logic with no UI dependencies
- **`SlotMachineManager`** - Game integration with UI management and advanced features

### **Benefits:**

✅ **Drop-in ready** for any game framework  
✅ **Consistent API** across all your games  
✅ **Configurable** - symbols, payouts, animations  
✅ **Mobile responsive** with touch support  
✅ **Achievement integration** built-in  
✅ **Audio system** integration  
✅ **Statistics tracking** and analytics  

---

## 📊 **Core Features**

### **Configurable Symbols**
- Custom symbols with weights and rarities
- Image or emoji support
- Color theming per symbol
- Rarity-based spawn rates

### **Flexible Payout System**
- Multiple reward types (stats, points, items)
- Jackpot and bonus configurations
- Multiplier-based payouts
- Achievement integration

### **Advanced Animations**
- Realistic reel spinning with momentum
- Win/loss feedback animations
- Celebration sequences for big wins
- Particle effects and screen shake

### **Game Integration**
- Seamless credit synchronization
- Stat reward processing
- Achievement unlock triggers
- Audio event integration

### **Statistics & Analytics**
- Win/loss tracking
- Payout analysis
- Streak monitoring
- Near-miss detection

---

## 🎮 **API Documentation**

## **SlotMachine Class** (Core Engine)

### **Constructor**

```javascript
new SlotMachine(options = {})
```

**Options:**
```javascript
{
  reelCount: 3,                    // Number of reels
  symbolsPerReel: 6,               // Symbols per reel
  baseCost: 10,                    // Base bet cost
  costProgression: 15,             // Cost increase per spin
  winRate: 0.8,                    // Win rate (0.0 - 1.0)
  payoutMultiplier: 1.0,           // Payout multiplier
  enableDebugLogs: false,          // Console logging
  enableNearMiss: true,            // Near-miss detection
  enableAnticipation: true         // Anticipation effects
}
```

### **Core Methods**

#### **`setSymbols(symbolConfig)`**
Configure slot symbols with properties

```javascript
slotMachine.setSymbols([
  {
    name: 'cherry',
    emoji: '🍒',
    image: 'images/cherry.png',
    weight: 30,                    // Spawn weight
    rarity: 'common',              // Rarity tier
    color: '#ff6b6b'               // Theme color
  },
  {
    name: 'diamond',
    emoji: '💎',
    image: 'images/diamond.png',
    weight: 5,
    rarity: 'legendary',
    color: '#48dbfb'
  }
]);
```

#### **`setPayouts(payoutConfig)`**
Configure payout rewards for symbol combinations

```javascript
slotMachine.setPayouts({
  cherry: {
    name: 'Cherry Bonus!',
    multiplier: 0.5,               // Payout multiplier
    rewards: { points: 50 },       // Reward object
    color: '#ff6b6b',              // Display color
    isJackpot: false
  },
  diamond: {
    name: 'DIAMOND JACKPOT!',
    multiplier: 2.0,
    rewards: { 
      points: 500, 
      attack: 10, 
      defense: 10 
    },
    color: '#48dbfb',
    isJackpot: true
  }
});
```

#### **`setResults(resultsConfig)`**
Configure predetermined results for controlled outcomes

```javascript
slotMachine.setResults([
  { type: 'win', symbol: 'cherry' },
  { type: 'win', symbol: 'cherry' },
  { type: 'win', symbol: 'diamond' },
  { type: 'loss' },
  { type: 'loss' }
]);
```

#### **`setCredits(credits)` / `getCredits()`**
Manage available credits

```javascript
slotMachine.setCredits(1000);
const credits = slotMachine.getCredits();
```

#### **`spin()`**
Perform a spin (returns Promise)

```javascript
const result = await slotMachine.spin();
console.log(result);
// {
//   isWin: true,
//   symbol: 'cherry',
//   payout: 25,
//   rewards: { points: 50 },
//   winType: 'win',
//   celebration: { type: 'win', duration: 3000 }
// }
```

#### **`getCurrentBetCost()` / `canAffordBet()`**
Check betting status

```javascript
const cost = slotMachine.getCurrentBetCost();
const canAfford = slotMachine.canAffordBet();
```

#### **`getStats()` / `resetStats()`**
Access statistics

```javascript
const stats = slotMachine.getStats();
console.log(stats);
// {
//   totalSpins: 100,
//   totalWins: 75,
//   winPercentage: 75,
//   biggestWin: 500,
//   currentWinStreak: 3,
//   nearMisses: 12
// }
```

### **Event System**

#### **`addEventListener(eventName, callback)`**
Listen for slot machine events

```javascript
const unsubscribe = slotMachine.addEventListener('spin-completed', (event) => {
  console.log('Spin result:', event.data);
});

// Later: unsubscribe()
```

**Available Events:**
- `spin-started` - Spin begins
- `spin-completed` - Spin finishes with result
- `reel-symbol-changed` - Reel symbol updates during spin
- `credits-changed` - Credits amount changes
- `insufficient-credits` - Not enough credits to spin
- `near-miss` - Near-miss detected
- `symbols-configured` - Symbols updated
- `payouts-configured` - Payouts updated

---

## **SlotMachineManager Class** (Game Integration)

### **Constructor**

```javascript
new SlotMachineManager(gameInstance, options = {})
```

**Options:**
```javascript
{
  // UI settings
  containerId: 'slot-machine-container',
  enablePaytable: true,
  enableStats: true,
  
  // Integration settings
  enableAchievements: true,
  enableAudio: true,
  enableParticles: true,
  creditSource: 'trainingScore',   // Game state property
  rewardTarget: 'player',          // Where to apply rewards
  
  // Debug settings
  enableDebugLogs: false
}
```

### **Setup Methods**

#### **`createUI(container)`**
Create and render the complete slot machine UI

```javascript
slotManager.createUI('#slot-container');
// or
slotManager.createUI(document.getElementById('slot-container'));
```

#### **`setupDefaultConfiguration()`**
Set up default symbols and payouts (based on your game)

```javascript
slotManager.setupDefaultConfiguration();
// Sets up vanilla, chocolate, strawberry, etc. symbols
```

### **Integration Methods**

#### **`spin()`**
Perform a spin with full game integration

```javascript
const result = await slotManager.spin();
// Automatically handles:
// - Credit synchronization
// - Reward processing
// - Achievement unlocks
// - Audio feedback
// - UI updates
```

#### **`syncCredits()`**
Sync credits with game state

```javascript
slotManager.syncCredits();
// Reads from game.gameState.trainingScore by default
```

#### **`togglePaytable()` / `toggleStats()`**
Toggle UI panels

```javascript
slotManager.togglePaytable();
slotManager.toggleStats();
```

### **Customization Methods**

#### **`setupAchievementCallbacks()`**
Configure achievement unlock triggers

```javascript
slotManager.achievementCallbacks.set('cherry', () => {
  game.unlockAchievement('cherry_master');
});
```

#### **`setupRewardProcessors()`**
Configure how rewards are applied to game state

```javascript
slotManager.rewardProcessors.set('strength', (amount) => {
  game.player.strength += amount;
  game.showStatIncrease('strength', amount);
});
```

---

## 🎨 **Styling System**

### **CSS Custom Properties**

The system uses CSS custom properties for easy theming:

```css
:root {
  --slot-primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --slot-secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --slot-win-gradient: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
  --slot-jackpot-gradient: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
  
  --slot-text-primary: #ffffff;
  --slot-text-win: #48dbfb;
  --slot-text-jackpot: #fdcb6e;
  
  --slot-border-radius: 12px;
  --slot-transition-normal: 0.3s ease;
}
```

### **Key CSS Classes**

#### **Layout Classes**
- `.slot-machine-system` - Main container
- `.slot-machine-main` - Primary slot machine
- `.slot-paytable` - Paytable panel
- `.slot-stats-panel` - Statistics panel

#### **Component Classes**
- `.slot-reel` - Individual reel
- `.slot-symbol` - Symbol image/emoji
- `.slot-btn-primary` - Primary action button
- `.slot-btn-secondary` - Secondary buttons

#### **State Classes**
- `.spinning` - Applied during reel spin
- `.winner` - Applied to winning reels
- `.loser` - Applied to losing reels
- `.active` - Applied to visible panels

#### **Animation Classes**
- `.slot-celebration-overlay` - Jackpot celebration
- `.paytable-winner` - Winning paytable row highlight

### **Responsive Breakpoints**

```css
/* Tablet */
@media (max-width: 768px) {
  .slot-machine-system {
    flex-direction: column;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .slot-reel {
    width: 50px;
    height: 50px;
  }
}
```

---

## 🔧 **Integration Examples**

### **Basic Integration**

```javascript
// Initialize with your game instance
const slotManager = new SlotMachineManager(myGame, {
  creditSource: 'coins',
  enableAchievements: true
});

// Create UI
slotManager.createUI('#game-slots');

// Custom symbols
slotManager.slotMachine.setSymbols([
  { name: 'sword', emoji: '⚔️', weight: 20, color: '#ff6b6b' },
  { name: 'shield', emoji: '🛡️', weight: 20, color: '#48dbfb' },
  { name: 'potion', emoji: '🧪', weight: 15, color: '#2ecc71' }
]);

// Custom rewards
slotManager.slotMachine.setPayouts({
  sword: {
    name: 'Sword Bonus!',
    rewards: { attack: 5 },
    color: '#ff6b6b'
  },
  shield: {
    name: 'Shield Bonus!',
    rewards: { defense: 5 },
    color: '#48dbfb'
  }
});
```

### **Advanced Integration with Custom Rewards**

```javascript
class MyGame {
  constructor() {
    this.slotManager = new SlotMachineManager(this);
    this.setupSlotMachine();
  }

  setupSlotMachine() {
    // Custom reward processor
    this.slotManager.rewardProcessors.set('xp', (amount) => {
      this.player.experience += amount;
      this.showXpGain(amount);
      this.checkLevelUp();
    });

    // Custom achievement callbacks
    this.slotManager.achievementCallbacks.set('rare_symbol', () => {
      this.unlockAchievement('lucky_spinner');
      this.showNotification('Lucky spinner achievement unlocked!');
    });

    // Event listeners
    this.slotManager.slotMachine.addEventListener('spin-completed', (event) => {
      if (event.data.isWin) {
        this.playWinAnimation();
      }
    });
  }

  // Called by SlotMachineManager
  onSlotWin(result) {
    this.addToGameLog(`Slot win: ${result.payout.name}`);
    this.saveGameState();
  }
}
```

### **Training System Integration** (Like Your Current Game)

```javascript
class Training {
  constructor(game) {
    this.game = game;
    this.slotManager = new SlotMachineManager(game, {
      creditSource: 'trainingScore',
      enableAchievements: true
    });
  }

  setupSlotMachine() {
    // Use your existing configuration
    this.slotManager.setupDefaultConfiguration();
    
    // Custom reward processors for training
    this.slotManager.rewardProcessors.set('attack', (amount) => {
      this.game.gameState.player.attack += amount;
      this.highlightStatUpdate('attack');
    });

    this.slotManager.rewardProcessors.set('points', (amount) => {
      this.game.gameState.trainingScore += amount;
      this.updateScoreDisplay();
    });
  }

  showSlotMachine() {
    this.slotManager.createUI('#slot-machine-container');
    this.slotManager.syncCredits();
  }
}
```

---

## 🎯 **Configuration Patterns**

### **Symbol Configuration**

```javascript
// Basic symbols
const basicSymbols = [
  { name: 'cherry', emoji: '🍒', weight: 30 },
  { name: 'lemon', emoji: '🍋', weight: 25 },
  { name: 'orange', emoji: '🍊', weight: 20 }
];

// Advanced symbols with all properties
const advancedSymbols = [
  {
    name: 'diamond',
    emoji: '💎',
    image: 'images/diamond.png',
    weight: 5,
    rarity: 'legendary',
    color: '#48dbfb',
    description: 'The ultimate prize!'
  }
];
```

### **Payout Configuration**

```javascript
// Simple payouts
const simplePayouts = {
  cherry: { multiplier: 0.5, rewards: { points: 50 } },
  diamond: { multiplier: 2.0, rewards: { points: 500 }, isJackpot: true }
};

// Complex payouts with multiple rewards
const complexPayouts = {
  warrior: {
    name: 'WARRIOR JACKPOT!',
    multiplier: 1.5,
    rewards: {
      attack: 10,
      defense: 5,
      hp: 50,
      xp: 100
    },
    color: '#ff6b6b',
    isJackpot: true
  }
};
```

### **Predetermined Results**

```javascript
// Balanced results (80% win rate)
const balancedResults = [
  ...Array(16).fill(null).map((_, i) => ({ 
    type: 'win', 
    symbol: ['cherry', 'lemon', 'orange'][i % 3] 
  })),
  ...Array(4).fill({ type: 'loss' })
];

// Progressive difficulty
const progressiveResults = [
  // Early spins - high win rate
  ...Array(8).fill({ type: 'win', symbol: 'cherry' }),
  ...Array(2).fill({ type: 'loss' }),
  
  // Later spins - lower win rate
  ...Array(4).fill({ type: 'win', symbol: 'diamond' }),
  ...Array(6).fill({ type: 'loss' })
];
```

---

## 📱 **Mobile & Accessibility**

### **Touch Support**
- Large touch targets (44px minimum)
- Swipe gestures for panel navigation
- Haptic feedback integration ready

### **Accessibility Features**
- ARIA labels for screen readers
- High contrast mode support
- Reduced motion support
- Keyboard navigation
- Focus indicators

### **Responsive Design**
- Flexible layout system
- Breakpoint-based optimizations
- Scalable symbols and text
- Collapsible panels on mobile

---

## 🔍 **Performance Optimization**

### **Efficient Animations**
- GPU-accelerated transforms
- Minimal DOM manipulation
- Optimized CSS animations
- Reduced motion preferences

### **Memory Management**
- Event listener cleanup
- Timer management
- Garbage collection friendly
- Efficient object pooling

### **Rendering Optimization**
- CSS containment properties
- will-change declarations
- Minimal reflows/repaints
- Efficient symbol updates

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Symbols not displaying**
```javascript
// Check image paths
slotMachine.setSymbols([
  { name: 'cherry', image: 'correct/path/to/cherry.png' }
]);

// Fallback to emoji
slotMachine.setSymbols([
  { name: 'cherry', emoji: '🍒' }
]);
```

**Credits not syncing**
```javascript
// Ensure correct credit source
const manager = new SlotMachineManager(game, {
  creditSource: 'coins' // Must match game state property
});

// Manual sync
manager.syncCredits();
```

**Animations not working**
```javascript
// Check for reduced motion
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Animations enabled
  slotMachine.options.enableAnimations = true;
}
```

**UI not responsive**
```css
/* Ensure proper CSS is loaded */
@import url('slot-machine.css');

/* Check container setup */
.slot-machine-container {
  width: 100%;
  max-width: 800px;
}
```

### **Debug Mode**

```javascript
// Enable debug logging
const slotMachine = new SlotMachine({
  enableDebugLogs: true
});

// Check statistics
console.log(slotMachine.getStats());

// Monitor events
slotMachine.addEventListener('spin-completed', (event) => {
  console.log('Spin result:', event.data);
});
```

### **Performance Issues**

```javascript
// Reduce animation complexity
const slotMachine = new SlotMachine({
  enableParticles: false,
  enableScreenShake: false
});

// Optimize symbol updates
slotMachine.addEventListener('reel-symbol-changed', (event) => {
  // Batch DOM updates
  requestAnimationFrame(() => {
    updateSymbolDisplay(event.data);
  });
});
```

---

## 🎮 **Best Practices**

### **Configuration**
- Start with default configuration
- Customize symbols for your game theme
- Balance win rates for player engagement
- Use predetermined results for controlled difficulty

### **Integration**
- Sync credits regularly with game state
- Process rewards immediately after wins
- Unlock achievements for engagement
- Provide audio feedback for immersion

### **UI/UX**
- Show paytable for transparency
- Display current bet cost clearly
- Provide win/loss feedback
- Ensure mobile-friendly design

### **Performance**
- Limit simultaneous animations
- Clean up event listeners
- Optimize symbol image sizes
- Use efficient CSS selectors

---

## 📄 **License**

This slot machine system is part of the GameDemon toolkit. Use freely in your own projects.

---

**Built with ❤️ for engaging, fair, and fun slot machine experiences**