# Enhanced Combat System

A powerful, visually stunning turn-based combat system for web-based games built with vanilla JavaScript. Features rich animations, dynamic visual feedback, customizable movesets, and seamless game integration.

![Enhanced Combat System Demo](combat-demo.png)

## 🚀 **Quick Start**

```javascript
// 1. Include the files
<link rel="stylesheet" href="combat.css">
<script src="Combat.js"></script>
<script src="CombatManager.js"></script>

// 2. Initialize with your game
const combatManager = new CombatManager(gameInstance, {
  enableSoundEffects: true,
  enableMusicIntegration: true,
  enableMalfunction: true
});

// 3. Start a battle
combatManager.startBattle('default', 'basic');

// 4. Handle events with rich feedback
gameInstance.onBattleEnd = (results) => {
  console.log(`🎉 ${results.winner} wins with epic visual effects!`);
};
```

## 📁 **File Structure**

```
enhanced-combat-system/
├── Combat.js                    // Core reusable combat engine
├── CombatManager.js            // Game integration manager
├── combat.css                  // Complete visual system with animations
├── combat-test.html            // Feature-complete demo page
└── README-enhanced-combat.md   // This comprehensive documentation
```

## 🏗️ **Architecture**

### **Two-Class System:**

- **`Combat`** - Reusable combat engine with enhanced visual feedback
- **`CombatManager`** - Game-specific integration with templates and advanced features

### **Key Enhancements Over Basic System:**

✅ **Animated Health/Energy Bars** with gradients and pulse effects  
✅ **Floating Damage Numbers** with color-coded animations  
✅ **Fighter Sprite Animations** for all action types  
✅ **Turn-Based UI States** (bright/inviting vs dimmed/locked)  
✅ **Enhanced Tooltips** with damage calculations  
✅ **Status Effect Indicators** with visual feedback  
✅ **Critical Hit System** with screen shake effects  
✅ **Victory/Defeat Sequences** with particle effects  
✅ **Optional Malfunction System** for strategic depth  
✅ **Advanced Audio Integration** with context-aware sounds  
✅ **Mobile-Responsive Design** with accessibility features

---

## 📊 **Visual Features**

### **Animated Health/Energy Bars**

The system includes beautifully animated progress bars with:

```css
/* Low health warning animation */
.hp-bar-fill.low-hp {
  animation: lowHealthPulse 1s ease-in-out infinite alternate;
}

/* Smooth gradient fills */
.hp-bar-fill {
  background: linear-gradient(90deg, #e74c3c, #c0392b, #e74c3c);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Features:**

- Smooth width transitions when health/energy changes
- Low health warning animations (pulsing red)
- Low energy warning animations (pulsing blue)
- Gradient backgrounds with shine effects
- Real-time stat change indicators

### **Fighter Sprite Animations**

Enhanced animations for all action types:

```javascript
// Trigger epic attack animation
.fighter-sprite.combat-attack-animation {
  animation: epicAttackAnimation 0.8s ease-out;
}

// Hit flash effect for damage taken
.fighter-sprite.combat-hit-flash {
  animation: hitFlash 0.6s ease-out;
}
```

**Animation Types:**

- **Attack**: Dramatic shake with color rotation
- **Defense**: Shield bubble effect with expanding ring
- **Recovery**: Spinning glow with brightness increase
- **Buff**: Multi-stage power-up with hue rotation
- **Hit Flash**: Dramatic brightness/contrast flash when damaged

### **Turn-Based UI States**

The system dynamically changes button appearance based on game state:

```css
/* Player's turn - buttons are bright and inviting */
.combat-container.player-turn .combat-action:not(:disabled) {
  animation: readyPulse 2s ease-in-out infinite;
  box-shadow: 0 0 15px rgba(52, 152, 219, 0.3);
}

/* Enemy's turn - buttons are dimmed and locked */
.combat-container.enemy-turn .combat-action {
  opacity: 0.3;
  filter: grayscale(0.8) blur(1px);
  pointer-events: none;
}
```

**UI States:**

- **Player Turn**: Bright, pulsing, interactive buttons
- **Enemy Turn**: Dimmed, blurred, disabled buttons
- **Animating**: Locked UI during action sequences
- **Critical Health**: Pulsing red border on fighter cards

### **Floating Damage Numbers**

Color-coded animated numbers that float upward:

```javascript
// Show damage with dramatic red animation
showDamageNumber("enemy", 45, false); // Red, floating damage number

// Show healing with green animation
showDamageNumber("player", 30, true); // Green, floating heal number

// Show energy restore with blue animation
showEnergyNumber("player", 15); // Blue, floating energy number
```

**Number Types:**

- **Damage**: Red with shake and hue rotation
- **Healing**: Green with brightness pulses
- **Energy**: Blue with saturation effects
- **Critical**: Enhanced size and glow effects

---

## 🎮 **API Documentation**

## **Enhanced Combat Class**

### **Constructor**

```javascript
new Combat((options = {}));
```

**Enhanced Options:**

```javascript
{
  enableAnimations: true,        // Fighter sprite animations
  enableSounds: true,            // Sound effect integration
  enableTooltips: true,          // Enhanced damage calculation tooltips
  maxActionsPerTurn:
```
