# Animation Manager

A powerful, flexible animation system for web-based games built with vanilla JavaScript. Features CSS animations, sprite animations, property animations, sequences, and a comprehensive developer toolkit.

![Animation Manager Demo](animation-manager-demo.png)

## 🚀 Quick Start

```javascript
// 1. Include the files
<link rel="stylesheet" href="animation-manager.css">
<script src="AnimationManager.js"></script>
<script src="AnimationManagerUI.js"></script>

// 2. Initialize
const animationManager = new AnimationManager();

// 3. Create animations
const fadeInId = animationManager.fadeIn(document.getElementById('game-dialog'));

// 4. Create sprite animations
const playerRunAnimation = animationManager.createSpriteAnimation(
  playerElement,
  [0, 1, 2, 3, 4, 5], // Frame indices
  {
    frameWidth: 64,
    frameHeight: 64,
    duration: 800,
    iterations: 'infinite'
  }
);

// 5. Control animations
animationManager.play(playerRunAnimation);
animationManager.pause(playerRunAnimation);
animationManager.stop(playerRunAnimation);
```

## 📁 File Structure

```
animation-manager/
├── AnimationManager.js         // Core reusable class
├── AnimationManagerUI.js       // Game integration class with debug tools
├── animation-manager.css       // UI components and inspector styling
├── animation-manager-test.html // Test/demo page
└── README-animation-manager.md // This file
```

## 🏗️ Architecture

### Two-Class System:

- **`AnimationManager`** - Reusable animation management core
- **`AnimationManagerUI`** - Game-specific integration with debugging tools

### Benefits:

✅ **Drop-in ready** for any game framework  
✅ **Performance optimized** with requestAnimationFrame  
✅ **Clean separation** of animation logic and debugging  
✅ **Production-ready** with error handling and fallbacks

---

## 📊 Core Concepts

### Animation Types

The system supports three core animation types:

1. **CSS Animations** - Animate DOM element properties
2. **Sprite Animations** - Frame-based sprite sheet animations
3. **Property Animations** - Animate JavaScript object properties

### Animation Control

All animations can be:

- Created with specific options
- Played, paused, stopped
- Sequenced together
- Monitored for progress
- Customized with callbacks

### Effects Library

Ready-to-use effects for common needs:

- Fade In/Out
- Slide In/Out
- Bounce
- Pulse
- Shake
- And more

### Developer Tools

Built-in debugging tools for development:

- Animation Debug Panel
- Performance Metrics
- Animation Inspector
- Timeline Controls
- Live Editing

---

## 🎮 API Documentation

## **AnimationManager Class** (Core Animation Engine)

### **Constructor**

```javascript
new AnimationManager((options = {}));
```

**Options:**

```javascript
{
  enableDebugLogs: false,         // Enable console logging
  useRequestAnimationFrame: true, // Use requestAnimationFrame loop
  defaultDuration: 1000,          // Default animation duration in ms
  defaultEasing: 'ease-in-out',   // Default easing function
  maxAnimations: 100,             // Maximum number of animations
  useHardwareAcceleration: true,  // Enable hardware acceleration
  spriteSheetSupport: true,       // Enable sprite sheet support
  autoCleanup: true               // Auto remove completed animations
}
```

### **CSS Animation Methods**

#### **`createCssAnimation(element, properties, options)`**

Create a CSS property animation

```javascript
const animId = animationManager.createCssAnimation(
  document.getElementById("player"),
  {
    opacity: { from: 0, to: 1 },
    transform: { from: "translateY(50px)", to: "translateY(0)" },
  },
  {
    duration: 500,
    easing: "ease-out",
    iterations: 1,
    direction: "normal",
  }
);
```

#### **`transition(element, properties, options)`**

Alias for createCssAnimation with simpler syntax

```javascript
const animId = animationManager.transition(
  element,
  { opacity: 1, left: "200px" },
  { duration: 500 }
);
```

### **Sprite Animation Methods**

#### **`createSpriteAnimation(element, frames, options)`**

Create a frame-based sprite animation

```javascript
const animId = animationManager.createSpriteAnimation(
  spriteElement,
  [0, 1, 2, 3, 4, 5], // Frame indices
  {
    frameWidth: 64,
    frameHeight: 64,
    framesPerRow: 6,
    duration: 800,
    iterations: "infinite",
  }
);
```

#### **`registerSpriteSheet(id, config)` / `createSpriteSheetAnimation(element, spriteSheetId, animationName, options)`**

Register and use a sprite sheet

```javascript
// Register sprite sheet
animationManager.registerSpriteSheet("player", {
  url: "player-sprite.png",
  frameWidth: 64,
  frameHeight: 64,
  framesPerRow: 8,
  animations: {
    idle: { frames: [0, 1, 2, 3], duration: 800 },
    run: { frames: [8, 9, 10, 11, 12, 13], duration: 600 },
  },
});

// Use registered sprite sheet
const animId = animationManager.createSpriteSheetAnimation(
  playerElement,
  "player",
  "run",
  { iterations: "infinite" }
);
```

### **Property Animation Methods**

#### **`createPropertyAnimation(target, properties, options)`**

Animate JavaScript object properties

```javascript
const gameObject = {
  x: 100,
  y: 200,
  scale: 1.0,
  alpha: 1.0,
};

const animId = animationManager.createPropertyAnimation(
  gameObject,
  {
    x: 300,
    scale: 1.5,
  },
  {
    duration: 1000,
    easing: "ease-in-out",
    onUpdate: () => updateGameObject(),
  }
);
```

### **Sequence Methods**

#### **`createSequence(animationIds, options)`**

Create a sequence of animations

```javascript
const fadeInId = animationManager.createCssAnimation(element, { opacity: 1 });
const moveId = animationManager.createCssAnimation(element, { left: "200px" });
const fadeOutId = animationManager.createCssAnimation(element, { opacity: 0 });

const sequenceId = animationManager.createSequence(
  [fadeInId, moveId, fadeOutId],
  {
    iterations: 1,
    onComplete: () => console.log("Sequence complete"),
  }
);

// Play the entire sequence
animationManager.play(sequenceId);
```

### **Effect Methods**

#### **`fadeIn(element, options)` / `fadeOut(element, options)`**

Fade an element in or out

```javascript
animationManager.fadeIn(dialogElement, {
  duration: 500,
  easing: "ease-in",
});

animationManager.fadeOut(dialogElement, {
  duration: 500,
  easing: "ease-out",
  hideAfter: true, // Hide element after animation
});
```

#### **`slideIn(element, direction, options)` / `slideOut(element, direction, options)`**

Slide an element in or out

```javascript
animationManager.slideIn(panelElement, "left", {
  duration: 800,
  easing: "ease-out",
});

animationManager.slideOut(panelElement, "right", {
  duration: 800,
  easing: "ease-in",
  hideAfter: true,
});
```

#### **`bounce(element, options)`**

Create a bounce effect

```javascript
animationManager.bounce(buttonElement, {
  height: 20, // Bounce height in pixels
  duration: 600,
  iterations: 1,
});
```

#### **`pulse(element, options)`**

Create a pulse effect

```javascript
animationManager.pulse(iconElement, {
  scale: 1.2, // Max scale factor
  duration: 500,
  iterations: 2,
});
```

#### **`shake(element, options)`**

Create a shake effect

```javascript
animationManager.shake(errorElement, {
  intensity: 10, // Shake intensity in pixels
  duration: 500,
});
```

### **Control Methods**

#### **`play(id)` / `pause(id)` / `resume(id)` / `stop(id)`**

Control animations

```javascript
animationManager.play(animId); // Start animation
animationManager.pause(animId); // Pause animation
animationManager.resume(animId); // Resume paused animation
animationManager.stop(animId); // Stop and reset animation
```

#### **`pauseAll()` / `resumeAll()` / `stopAll()`**

Control all animations

```javascript
animationManager.pauseAll(); // Pause all animations
animationManager.resumeAll(); // Resume all paused animations
animationManager.stopAll(); // Stop all animations
```

#### **`setPlaybackRate(id, rate)` / `setProgress(id, progress)`**

Adjust animation playback

```javascript
animationManager.setPlaybackRate(animId, 0.5); // Half speed
animationManager.setPlaybackRate(animId, 2.0); // Double speed

animationManager.setProgress(animId, 0.5); // Set to 50% complete
```

### **Utility Methods**

#### **`getAnimation(id)` / `getSequence(id)`**

Get animation or sequence objects

```javascript
const animation = animationManager.getAnimation(animId);
const sequence = animationManager.getSequence(sequenceId);
```

#### **`isPlaying(id)` / `getProgress(id)`**

Check animation status

```javascript
if (animationManager.isPlaying(animId)) {
  // Animation is playing
}

const progress = animationManager.getProgress(animId); // 0.0 to 1.0
```

#### **`removeAnimation(id)` / `removeSequence(id)` / `clearAll()`**

Clean up animations

```javascript
animationManager.removeAnimation(animId);
animationManager.removeSequence(sequenceId);
animationManager.clearAll(); // Remove all animations
```

## **AnimationManagerUI Class** (Game Integration)

### **Constructor**

```javascript
new AnimationManagerUI(gameInstance, (options = {}));
```

**Options:**

```javascript
{
  enableDebugPanel: false,         // Show debug panel
  showPerformanceMetrics: false,   // Show performance stats
  autoIntegrateWithState: true,    // Auto-integrate with game state
  enableInspector: false,          // Enable animation inspector
  controlPanelPosition: 'bottom-right',
  themeColor: '#3498db',           // UI theme color
  activePreviewLimit: 5,           // Max animations to preview
  showActiveAnimations: true,      // Show active animations list
  containerSelector: 'body',       // Debug panel container
  animationManager: null           // Existing AnimationManager instance
}
```

### **UI Methods**

#### **`showDebugPanel()` / `hideDebugPanel()`**

Show or hide debug panel

```javascript
animationManagerUI.showDebugPanel();
animationManagerUI.hideDebugPanel();
```

#### **`showInspector()` / `hideInspector()`**

Show or hide animation inspector

```javascript
animationManagerUI.showInspector();
animationManagerUI.hideInspector();
```

---

## 🎯 Integration Examples

### **Basic Integration**

```javascript
// Initialize animation manager
const animationManager = new AnimationManager();

// Create UI element animations
const showDialogAnim = animationManager.createCssAnimation(
  dialogElement,
  {
    transform: { from: "scale(0.8)", to: "scale(1)" },
    opacity: { from: 0, to: 1 },
  },
  { duration: 300, easing: "ease-out" }
);

// Animation callbacks
const cardAnimation = animationManager.createCssAnimation(
  cardElement,
  { transform: { from: "rotateY(0deg)", to: "rotateY(180deg)" } },
  {
    duration: 600,
    easing: "ease-in-out",
    onStart: () => playCardFlipSound(),
    onComplete: () => revealCardValue(),
  }
);
```

### **With Game Integration**

```javascript
class MyGame {
  constructor() {
    // Initialize animation system
    this.animationUI = new AnimationManagerUI(this, {
      enableDebugPanel: DEBUG_MODE,
      autoIntegrateWithState: true,
    });

    // Now this.animation contains the public API
    this.setupAnimations();
  }

  setupAnimations() {
    // Register player sprite sheet
    this.animation.registerSpriteSheet("player", {
      url: "assets/player-sprite.png",
      frameWidth: 64,
      frameHeight: 64,
      framesPerRow: 8,
      animations: {
        idle: { frames: [0, 1, 2, 3], duration: 800 },
        run: { frames: [8, 9, 10, 11, 12, 13], duration: 600 },
      },
    });
  }

  startRunning() {
    this.playerState = "running";

    // Create and play animation
    this.playerRunAnim = this.animation.createSpriteSheetAnimation(
      this.playerElement,
      "player",
      "run",
      { iterations: "infinite" }
    );
    this.animation.play(this.playerRunAnim);
  }

  stopRunning() {
    this.playerState = "idle";

    // Stop running and switch to idle
    this.animation.stop(this.playerRunAnim);
    this.playerIdleAnim = this.animation.createSpriteSheetAnimation(
      this.playerElement,
      "player",
      "idle",
      { iterations: "infinite" }
    );
    this.animation.play(this.playerIdleAnim);
  }
}
```

### **Animation Sequences**

```javascript
// Create character entrance sequence
function createEntranceSequence(character) {
  // Slide in
  const slideInId = animationManager.createCssAnimation(
    character.element,
    { transform: { from: "translateX(-100%)", to: "translateX(0)" } },
    { duration: 500, easing: "ease-out" }
  );

  // Jump effect
  const jumpId = animationManager.bounce(character.element, {
    height: 30,
    duration: 600,
  });

  // Emote
  const emoteId = animationManager.createCssAnimation(
    character.emoteElement,
    {
      opacity: { from: 0, to: 1 },
      transform: { from: "scale(0)", to: "scale(1)" },
    },
    { duration: 300, easing: "ease-out" }
  );

  // Combine into sequence
  return animationManager.createSequence([slideInId, jumpId, emoteId], {
    onComplete: () => character.startIdleAnimation(),
  });
}

// Use the sequence
const heroEntranceSequence = createEntranceSequence(hero);
animationManager.play(heroEntranceSequence);
```

---

## ⚙️ Advanced Features

### **Easing Functions**

The animation system supports various easing functions:

- `linear` - Constant speed
- `ease-in` - Start slow, end fast
- `ease-out` - Start fast, end slow
- `ease-in-out` - Start and end slow, fast in the middle
- `elastic` - Overshoot with elastic effect
- `bounce` - Bounce at the end

```javascript
animationManager.createCssAnimation(element, properties, {
  easing: "bounce",
});
```

### **Hardware Acceleration**

For better performance, hardware acceleration is enabled by default:

```javascript
// Enabled by default
const animationManager = new AnimationManager({
  useHardwareAcceleration: true,
});
```

This adds CSS optimizations like `will-change`, `transform: translateZ(0)`, and `backface-visibility: hidden`.

### **Performance Tracking**

Monitor animation performance:

```javascript
const metrics = animationManager.getPerformanceMetrics();
console.log(`Average frame time: ${metrics.averageFrameTime}ms`);
console.log(`Active animations: ${animationManager.getActiveCount()}`);
```

### **Integration with GameState**

```javascript
// Automatically sync with game state
class MyGame {
  constructor() {
    this.animationUI = new AnimationManagerUI(this, {
      autoIntegrateWithState: true,
    });

    // Set up state watching
    this.state.set("settings.animations", {
      enabled: true,
      speed: 1.0,
    });
  }

  // Animation settings are automatically applied when state changes
  toggleAnimations() {
    this.state.toggle("settings.animations.enabled");
  }

  setAnimationSpeed(speed) {
    this.state.set("settings.animations.speed", speed);
  }
}
```

---

## 🔧 Troubleshooting

### **Common Issues**

**Animations not playing**

```javascript
// Check if animation exists
if (animationManager.getAnimation(animId)) {
  // Animation exists but may be paused
  if (!animationManager.isPlaying(animId)) {
    animationManager.play(animId);
  }
} else {
  // Animation doesn't exist, recreate it
  const newAnimId = animationManager.createCssAnimation(/* ... */);
  animationManager.play(newAnimId);
}
```

**Performance issues with many animations**

```javascript
// Reduce active animations
const lowPriorityAnimations = [anim1, anim2, anim3];
lowPriorityAnimations.forEach((id) => animationManager.stop(id));

// Reduce playback rate for better performance
const highPriorityAnimations = [anim4, anim5];
highPriorityAnimations.forEach((id) =>
  animationManager.setPlaybackRate(id, 0.7)
);
```

**Animation flicker or jumps**

```javascript
// Enable hardware acceleration
const animationManager = new AnimationManager({
  useHardwareAcceleration: true,
});

// Add hardware acceleration class manually
element.classList.add("animation-accelerated");
```

**Animation stuck or not completing**

```javascript
// Reset animation to beginning
animationManager.stop(animId);

// Force completion
animationManager.setProgress(animId, 1.0);

// Check for conflicting animations
animationManager.stopAll();
```

### **Debug Mode**

Enable debug logging for troubleshooting:

```javascript
const animationManager = new AnimationManager({
  enableDebugLogs: true,
});
```

Show the debug UI for visual inspection:

```javascript
const animationUI = new AnimationManagerUI(gameInstance, {
  enableDebugPanel: true,
  enableInspector: true,
});

// Or show it on demand
animationUI.showDebugPanel();
animationUI.showInspector();
```

---

## 📱 Browser Support

- ✅ **Chrome 60+**
- ✅ **Firefox 55+**
- ✅ **Safari 12+**
- ✅ **Edge 79+**
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

**Features used:**

- requestAnimationFrame
- ES6 Classes and features
- CSS transitions and transforms
- Custom Events API

---

## 🔮 Best Practices

### **Performance Optimization**

```javascript
// Group related animations
const fadeInId = animationManager.createCssAnimation(element, { opacity: 1 });
const moveId = animationManager.createCssAnimation(element, { left: "200px" });
const sequenceId = animationManager.createSequence([fadeInId, moveId]);

// Use property animations for non-visual logic
animationManager.createPropertyAnimation(
  gameObject,
  {
    health: 100,
    shield: 50,
  },
  {
    duration: 2000,
    onUpdate: () => updateHealthBar(),
  }
);

// Limit simultaneous animations
if (animationManager.getActiveCount() > 20) {
  // Defer or simplify animations
}

// Optimize sprite sheets
animationManager.registerSpriteSheet("effects", {
  url: "effects-sprite.png",
  frameWidth: 64,
  frameHeight: 64,
  framesPerRow: 8,
  totalFrames: 32,
});
```

### **Accessibility**

The Animation Manager automatically respects user preferences:

- Reduces animations for users with `prefers-reduced-motion`
- Enhances contrast for users with `prefers-contrast: high`
- Hides debug UI when printing

### **State Management Integration**

```javascript
// Integrate with game state system
game.state.watch("settings.animations", (settings) => {
  if (!settings.enabled) {
    animationManager.stopAll();
  } else {
    // Apply global speed setting
    for (const animId of activeAnimations) {
      animationManager.setPlaybackRate(animId, settings.speed);
    }
  }
});
```

### **Cleanup Patterns**

```javascript
class GameScreen {
  constructor() {
    this.animations = [];
  }

  createAnimation(element, properties, options) {
    const animId = animationManager.createCssAnimation(
      element,
      properties,
      options
    );
    this.animations.push(animId);
    return animId;
  }

  destroy() {
    // Clean up all animations when screen is destroyed
    this.animations.forEach((animId) => {
      animationManager.stop(animId);
      animationManager.removeAnimation(animId);
    });
    this.animations = [];
  }
}
```

---

## 🎮 Integration with Other GameDemon Systems

### **With Achievement System**

```javascript
// Animate achievement unlocks
function unlockAchievement(achievementId) {
  achievements.unlock(achievementId);

  // Show achievement notification with animation
  const notification = achievements.showNotification(achievementId);
  animationManager.slideIn(notification, "right", {
    duration: 500,
    onComplete: () => {
      setTimeout(() => {
        animationManager.slideOut(notification, "right", {
          duration: 500,
          hideAfter: true,
        });
      }, 3000);
    },
  });
}
```

### **With Audio Manager**

```javascript
// Sync animations with audio
function playCardFlipAnimation(cardElement) {
  // Play sound
  audioManager.playSound("card-flip");

  // Create matching animation
  const flipAnim = animationManager.createCssAnimation(
    cardElement,
    { transform: { from: "rotateY(0deg)", to: "rotateY(180deg)" } },
    {
      duration: 600,
      easing: "ease-in-out",
      onComplete: () => revealCard(cardElement),
    }
  );

  animationManager.play(flipAnim);
}
```

### **With Drawer System**

```javascript
// Animate drawer content
drawerManager.onOpen = (drawer) => {
  const content = drawer.querySelector(".drawer-content");
  animationManager.fadeIn(content, { duration: 300 });
};

drawerManager.onClose = (drawer) => {
  const content = drawer.querySelector(".drawer-content");
  animationManager.fadeOut(content, { duration: 200 });
};
```

---

## 📄 License

This animation management system is part of the GameDemon toolkit. Use freely in your own projects.

---

**Built with ❤️ for fast, reusable game development**
