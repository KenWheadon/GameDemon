# Universal Audio Manager System

A comprehensive, **game-ready** audio management system for web-based games and applications. Features background music, sound effects, volume controls, fade transitions, and a clean settings UI focused on player experience.

![Audio Manager Demo](audio-manager-demo-screenshot.png)

## 🚀 **Quick Start**

```javascript
// 1. Include the files
<link rel="stylesheet" href="audio-manager.css">
<script src="AudioManager.js"></script>
<script src="AudioManagerUI.js"></script>

// 2. Initialize the audio system
const audioManager = new AudioManager({
  enableDebugLogs: false, // Set to true for development
  autoPreload: true
});

// 3. Create clean UI controls for players
const audioUI = new AudioManagerUI(audioManager, {
  floatingButton: true,
  keyboardShortcuts: true,
  enableNotifications: true
});

// 4. Load and play audio
audioManager.playBackgroundMusic('level1');
audioManager.playSoundEffect('achievement');
```

## 📁 **File Structure**

```
audio-manager/
├── AudioManager.js          // Core audio management class
├── AudioManagerUI.js        // UI integration and settings panel
├── audio-manager.css        // Complete styling system
├── README-audio-manager.md  // This documentation
└── audio-manager-test.html  // Standalone test environment
```

## 🏗️ **Perfect for Game Integration**

### **🎮 Game-Ready Features:**

- 🎵 **Background Music Management** - Seamless level-specific music with fade transitions
- 🔊 **Sound Effects System** - Overlapping audio with volume/speed control
- 🎛️ **Player-Friendly UI** - Clean settings panel focused on essential controls
- 💾 **Settings Persistence** - Remembers player preferences across sessions
- 📱 **Mobile Optimized** - Touch-friendly controls for all devices
- ♿ **Accessibility Ready** - Screen reader friendly with keyboard navigation
- 🎯 **Zero Dependencies** - Pure vanilla JavaScript, works everywhere

### **Integration Example:**

```javascript
// Create game with audio
class MyGame {
  constructor() {
    this.audioManager = new AudioManager();
    this.audioUI = new AudioManagerUI(this.audioManager);
    this.setupGameAudio();
  }

  setupGameAudio() {
    // Custom audio files for your game
    this.audioManager.setAudioFiles({
      backgroundMusic: {
        menu: "audio/menu.mp3",
        level1: "audio/level1.mp3",
        boss: "audio/boss.mp3",
      },
      soundEffects: {
        jump: "audio/jump.mp3",
        collect: "audio/collect.mp3",
        damage: "audio/damage.mp3",
      },
    });

    // Preload all audio assets
    this.audioManager.preloadAllAudio();
  }

  onLevelStart(level) {
    this.audioManager.playBackgroundMusic(`level${level}`, true);
  }

  onItemCollected() {
    this.audioManager.playSoundEffect("collect", 0.8);
  }
}
```

---

## 📖 **API Documentation**

## **AudioManager Class** (Core Audio System)

### **Constructor**

```javascript
new AudioManager((options = {}));
```

**Options:**

```javascript
{
  enableDebugLogs: false,        // Console logging
  autoPreload: true,             // Preload audio on init
  fadeTransitionDuration: 2000,  // Default fade duration (ms)
  backgroundVolume: 0.3,         // Default background volume (0-1)
  sfxVolume: 0.7,               // Default SFX volume (0-1)
  masterVolume: 1.0,            // Default master volume (0-1)
  maxRetryAttempts: 3,          // Audio loading retry attempts
  loadTimeout: 10000,           // Audio loading timeout (ms)
  storageKey: 'audio-manager-settings' // localStorage key
}
```

### **Core Methods**

#### **`init()`**

Initialize the audio system

```javascript
const success = await audioManager.init();
```

#### **`setAudioFiles(audioFiles)`**

Define custom audio file paths

```javascript
audioManager.setAudioFiles({
  backgroundMusic: {
    level1: "audio/music/level1.mp3",
    boss: "audio/music/boss.mp3",
  },
  soundEffects: {
    jump: "audio/sfx/jump.mp3",
    shoot: "audio/sfx/shoot.mp3",
  },
});
```

#### **`preloadAllAudio()`**

Preload all audio assets with retry logic

```javascript
const results = await audioManager.preloadAllAudio();
// Returns: { successful: 8, failed: 2, total: 10, loadTime: 1250 }
```

#### **`playBackgroundMusic(trackKey, fadeIn, stopCurrent)`**

Play background music with fade transitions

```javascript
audioManager.playBackgroundMusic("level1", true, true);
audioManager.playBackgroundMusic("boss", false); // No fade
```

#### **`stopBackgroundMusic(fadeOut)`**

Stop background music with optional fade

```javascript
audioManager.stopBackgroundMusic(true); // Fade out
audioManager.stopBackgroundMusic(false); // Stop immediately
```

#### **`playSoundEffect(effectKey, volume, playbackRate)`**

Play sound effect with volume and speed control

```javascript
audioManager.playSoundEffect("jump", 1.0); // Full volume
audioManager.playSoundEffect("footstep", 0.5); // Half volume
audioManager.playSoundEffect("powerup", 1.0, 1.5); // 1.5x speed
```

### **Volume Controls**

#### **`setMasterVolume(volume)`**

Set master volume (affects all audio)

```javascript
audioManager.setMasterVolume(0.8); // 80% volume
```

#### **`setBackgroundVolume(volume)`**

Set background music volume

```javascript
audioManager.setBackgroundVolume(0.4); // 40% volume
```

#### **`setSfxVolume(volume)`**

Set sound effects volume

```javascript
audioManager.setSfxVolume(0.9); // 90% volume
```

### **Control Methods**

#### **`toggleMute()`**

Toggle master mute state

```javascript
const isMuted = audioManager.toggleMute();
```

#### **`toggleBackgroundMusic()`**

Enable/disable background music

```javascript
const enabled = audioManager.toggleBackgroundMusic();
```

#### **`toggleSoundEffects()`**

Enable/disable sound effects

```javascript
const enabled = audioManager.toggleSoundEffects();
```

#### **`resumeAudioContext()`**

Resume audio context (required after user interaction)

```javascript
await audioManager.resumeAudioContext();
```

### **State Management**

#### **`getStats()`**

Get comprehensive audio system statistics

```javascript
const stats = audioManager.getStats();
/*
{
  loadedAssets: 12,
  failedAssets: 1,
  backgroundMusicTracks: 4,
  soundEffects: 8,
  currentlyPlaying: 'level1',
  isPlaying: true,
  volumes: { master: 1.0, background: 0.3, sfx: 0.7 },
  settings: { isMuted: false, backgroundMusicEnabled: true, sfxEnabled: true },
  audioContextSupported: true,
  audioContextState: 'running',
  isInitialized: true
}
*/
```

#### **`saveSettings(customKey)`**

Save settings to localStorage

```javascript
audioManager.saveSettings();
audioManager.saveSettings("custom-key");
```

#### **`loadSettings(customKey)`**

Load settings from localStorage

```javascript
const loaded = audioManager.loadSettings();
```

#### **`resetSettings()`**

Reset all settings to defaults

```javascript
audioManager.resetSettings();
```

#### **`destroy()`**

Clean up and dispose of resources

```javascript
audioManager.destroy();
```

---

## **AudioManagerUI Class** (Settings Interface)

### **Constructor**

```javascript
new AudioManagerUI(audioManager, (options = {}));
```

**Options:**

```javascript
{
  enableDebugLogs: false,        // Console logging
  keyboardShortcuts: true,       // Enable keyboard shortcuts
  autoSave: true,               // Auto-save on changes
  updateInterval: 1000,         // Status update interval (ms)
  floatingButton: true,         // Show floating button
  floatingButtonPosition: {     // Button position
    bottom: '20px',
    left: '20px'
  },
  enableNotifications: true     // Show notifications
}
```

### **Core Methods**

#### **`toggleSettingsPanel()`**

Toggle audio settings panel visibility

```javascript
audioUI.toggleSettingsPanel();
```

#### **`showSettingsPanel()`** / **`hideSettingsPanel()`**

Manually control panel visibility

```javascript
audioUI.showSettingsPanel();
audioUI.hideSettingsPanel();
```

#### **`updateAllControls()`**

Sync UI controls with audio state

```javascript
audioUI.updateAllControls();
```

#### **`getUISettings()`**

Get current UI settings and state

```javascript
const settings = audioUI.getUISettings();
```

#### **`destroy()`**

Clean up UI resources

```javascript
audioUI.destroy();
```

---

## 🎮 **Usage Examples**

### **1. Basic Game Integration**

```javascript
class SimpleGame {
  constructor() {
    this.setupAudio();
  }

  async setupAudio() {
    // Initialize audio system
    this.audioManager = new AudioManager({
      enableDebugLogs: true,
      backgroundVolume: 0.4,
      sfxVolume: 0.8,
    });

    // Create UI controls
    this.audioUI = new AudioManagerUI(this.audioManager, {
      floatingButton: true,
      keyboardShortcuts: true,
    });

    // Wait for initialization
    await this.audioManager.init();

    // Start menu music
    this.audioManager.playBackgroundMusic("menu");
  }

  startGame() {
    this.audioManager.playBackgroundMusic("level1");
    this.audioManager.playSoundEffect("start");
  }

  onPlayerJump() {
    this.audioManager.playSoundEffect("jump", 0.6);
  }

  onGameOver() {
    this.audioManager.stopBackgroundMusic(true);
    this.audioManager.playSoundEffect("gameover");
  }
}
```

### **2. Advanced Audio Management**

```javascript
class AdvancedAudioGame {
  constructor() {
    this.setupAdvancedAudio();
  }

  setupAdvancedAudio() {
    this.audioManager = new AudioManager({
      fadeTransitionDuration: 3000,
      maxRetryAttempts: 5,
    });

    // Define comprehensive audio library
    this.audioManager.setAudioFiles({
      backgroundMusic: {
        menu: "audio/music/menu.mp3",
        level1: "audio/music/forest.mp3",
        level2: "audio/music/dungeon.mp3",
        boss: "audio/music/boss.mp3",
        victory: "audio/music/victory.mp3",
        defeat: "audio/music/defeat.mp3",
      },
      soundEffects: {
        // UI Sounds
        click: "audio/ui/click.mp3",
        hover: "audio/ui/hover.mp3",
        select: "audio/ui/select.mp3",

        // Game Sounds
        jump: "audio/game/jump.mp3",
        attack: "audio/game/attack.mp3",
        damage: "audio/game/damage.mp3",
        heal: "audio/game/heal.mp3",

        // Achievement Sounds
        achievement: "audio/achievements/unlock.mp3",
        levelup: "audio/achievements/levelup.mp3",

        // Environmental
        steps: "audio/env/footsteps.mp3",
        door: "audio/env/door.mp3",
      },
    });

    this.audioUI = new AudioManagerUI(this.audioManager, {
      floatingButtonPosition: { bottom: "20px", right: "20px" },
      enableNotifications: true,
    });
  }

  // Dynamic music based on game state
  updateMusicForGameState(gameState) {
    switch (gameState.currentArea) {
      case "menu":
        this.audioManager.playBackgroundMusic("menu", true);
        break;
      case "forest":
        this.audioManager.playBackgroundMusic("level1", true);
        break;
      case "dungeon":
        this.audioManager.playBackgroundMusic("level2", true);
        break;
      case "boss":
        this.audioManager.playBackgroundMusic("boss", true);
        break;
    }
  }

  // Contextual sound effects
  playContextualSound(action, context = {}) {
    switch (action) {
      case "attack":
        const attackVolume = context.critical ? 1.0 : 0.7;
        const attackRate = context.critical ? 1.2 : 1.0;
        this.audioManager.playSoundEffect("attack", attackVolume, attackRate);
        break;

      case "damage":
        const damageVolume = Math.min(1.0, context.damage / 100);
        this.audioManager.playSoundEffect("damage", damageVolume);
        break;

      case "achievement":
        this.audioManager.playSoundEffect("achievement", 1.0);
        break;
    }
  }
}
```

### **3. Integration with Achievement System**

```javascript
class GameWithAchievements {
  constructor() {
    this.setupAudioAndAchievements();
  }

  setupAudioAndAchievements() {
    // Initialize audio first
    this.audioManager = new AudioManager();
    this.audioUI = new AudioManagerUI(this.audioManager);

    // Initialize achievement system
    this.achievementManager = new AchievementManager(this, {
      enableDebugLogs: true,
    });

    // Connect audio to achievements
    this.connectAudioToAchievements();
  }

  connectAudioToAchievements() {
    // Override achievement unlock to play sound
    const originalUnlock = this.achievementManager.unlockAchievement.bind(
      this.achievementManager
    );
    this.achievementManager.unlockAchievement = (achievementId) => {
      const result = originalUnlock(achievementId);
      if (result) {
        // Play achievement sound with slight delay for better UX
        setTimeout(() => {
          this.audioManager.playSoundEffect("achievement", 0.9);
        }, 100);
      }
      return result;
    };

    // Play progress sounds
    const originalUpdateProgress =
      this.achievementManager.updateAchievementProgress.bind(
        this.achievementManager
      );
    this.achievementManager.updateAchievementProgress = (
      achievementId,
      value
    ) => {
      const achievement =
        this.achievementManager.achievements.achievements[achievementId];
      const oldProgress = achievement?.progress?.current || 0;

      originalUpdateProgress(achievementId, value);

      // Play progress sound for significant milestones
      if (achievement && achievement.progress) {
        const progressPercent = (value / achievement.progress.target) * 100;
        const oldProgressPercent =
          (oldProgress / achievement.progress.target) * 100;

        // Play sound at 25%, 50%, 75% milestones
        [25, 50, 75].forEach((milestone) => {
          if (oldProgressPercent < milestone && progressPercent >= milestone) {
            this.audioManager.playSoundEffect("select", 0.5);
          }
        });
      }
    };
  }
}
```

### **4. Drawer System Integration**

```javascript
class GameWithDrawersAndAudio {
  constructor() {
    this.setupSystems();
  }

  setupSystems() {
    // Initialize all systems
    this.audioManager = new AudioManager();
    this.audioUI = new AudioManagerUI(this.audioManager);
    this.drawerManager = new DrawerManager();

    this.setupAudioDrawer();
    this.connectDrawerAudio();
  }

  setupAudioDrawer() {
    // Create dedicated audio settings drawer
    this.audioDrawerId = this.drawerManager.createDrawer(
      "right",
      { x: 20, y: 150 },
      {
        size: 500,
        icon: "🎵",
        title: "Audio Settings",
      }
    );

    // Hide default floating button since we're using drawer
    this.audioUI.options.floatingButton = false;

    // Get drawer container and move audio UI there
    const drawerContainer = this.drawerManager.getDrawerContainer(
      this.audioDrawerId
    );
    const audioPanel = document.querySelector(".audio-settings-panel");

    // Custom integration logic here
    this.integrateAudioWithDrawer(drawerContainer);
  }

  connectDrawerAudio() {
    // Play sound when drawers open/close
    const originalToggle = this.drawerManager.toggleDrawer.bind(
      this.drawerManager
    );
    this.drawerManager.toggleDrawer = (drawerId) => {
      const wasOpen = this.drawerManager.getDrawerState(drawerId)?.isOpen;
      const result = originalToggle(drawerId);

      if (result !== wasOpen) {
        const soundEffect = result ? "select" : "click";
        this.audioManager.playSoundEffect(soundEffect, 0.4);
      }

      return result;
    };
  }
}
```

---

## ⚙️ **Configuration Options**

### **Audio File Structure**

```javascript
const audioFiles = {
  backgroundMusic: {
    "track-key": "path/to/music.mp3",
    // Supported formats: mp3, ogg, wav, m4a
  },
  soundEffects: {
    "effect-key": "path/to/sound.mp3",
    // Shorter files recommended for sound effects
  },
};
```

### **Volume Levels**

- **Master Volume**: Controls overall audio output (0.0 - 1.0)
- **Background Volume**: Controls music volume (0.0 - 1.0)
- **SFX Volume**: Controls sound effects volume (0.0 - 1.0)
- **Individual Effect Volume**: Per-sound volume multiplier

### **Audio Context Settings**

```javascript
const audioManager = new AudioManager({
  // Enable Web Audio API features
  enableAudioContext: true,

  // Fade transition settings
  fadeTransitionDuration: 2000,

  // Loading behavior
  autoPreload: true,
  maxRetryAttempts: 3,
  loadTimeout: 10000,
});
```

---

## 🎨 **Styling & Themes**

### **CSS Custom Properties**

```css
:root {
  --audio-primary-color: #3498db;
  --audio-secondary-color: #2ecc71;
  --audio-danger-color: #e74c3c;
  --audio-background-primary: rgba(44, 62, 80, 0.95);
  --audio-text-primary: #ffffff;
  --audio-border-radius: 8px;
  --audio-transition-speed: 0.3s;
}
```

### **Custom Theme Example**

```css
/* Gaming Theme */
.audio-gaming-theme {
  --audio-primary-color: #ff6b35;
  --audio-secondary-color: #f7931e;
  --audio-background-primary: rgba(26, 26, 26, 0.98);
  --audio-border-radius: 12px;
}

/* Apply theme */
.audio-settings-panel.audio-gaming-theme {
  /* Custom theme applied */
}
```

### **Floating Button Positioning**

```javascript
// Position options
const audioUI = new AudioManagerUI(audioManager, {
  floatingButtonPosition: {
    bottom: "20px", // Distance from bottom
    right: "20px", // Distance from right
    // OR
    top: "20px", // Distance from top
    left: "20px", // Distance from left
  },
});
```

---

## 🔧 **Advanced Features**

### **Custom Audio Context Processing**

```javascript
class CustomAudioManager extends AudioManager {
  constructor(options) {
    super(options);
    this.setupCustomProcessing();
  }

  setupCustomProcessing() {
    if (this.audioContext) {
      // Add reverb effect
      this.reverbNode = this.audioContext.createConvolver();
      this.gainNode.connect(this.reverbNode);
      this.reverbNode.connect(this.audioContext.destination);

      // Add equalizer
      this.eqNode = this.audioContext.createBiquadFilter();
      this.eqNode.type = "peaking";
      this.eqNode.frequency.value = 1000;
      this.eqNode.gain.value = 5;
    }
  }
}
```

### **Dynamic Audio Loading**

```javascript
class DynamicAudioManager extends AudioManager {
  async loadAudioOnDemand(trackKey, path) {
    if (!this.backgroundMusic.has(trackKey)) {
      await this.loadBackgroundMusic(trackKey, path);
    }
    return this.playBackgroundMusic(trackKey);
  }

  unloadUnusedAudio() {
    // Remove audio that hasn't been used recently
    this.backgroundMusic.forEach((audio, key) => {
      if (this.shouldUnload(key)) {
        this.backgroundMusic.delete(key);
        this.log(`Unloaded unused audio: ${key}`);
      }
    });
  }
}
```

### **Audio Event System**

```javascript
class EventDrivenAudioManager extends AudioManager {
  constructor(options) {
    super(options);
    this.audioEvents = new EventTarget();
  }

  playBackgroundMusic(trackKey, fadeIn, stopCurrent) {
    const result = super.playBackgroundMusic(trackKey, fadeIn, stopCurrent);

    if (result) {
      this.audioEvents.dispatchEvent(
        new CustomEvent("backgroundMusicStarted", {
          detail: { trackKey, fadeIn },
        })
      );
    }

    return result;
  }

  onAudioEvent(eventType, callback) {
    this.audioEvents.addEventListener(eventType, callback);
  }
}

// Usage
const audioManager = new EventDrivenAudioManager();
audioManager.onAudioEvent("backgroundMusicStarted", (event) => {
  console.log(`Started playing: ${event.detail.trackKey}`);
});
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Audio not playing**

```javascript
// ❌ Problem: Audio context not resumed
// Browser blocks audio until user interaction

// ✅ Solution: Resume audio context on user interaction
document.addEventListener(
  "click",
  async () => {
    await audioManager.resumeAudioContext();
  },
  { once: true }
);
```

**Audio files not loading**

```javascript
// ❌ Problem: Incorrect file paths or unsupported formats

// ✅ Solution: Check file paths and use supported formats
audioManager.setAudioFiles({
  backgroundMusic: {
    level1: "audio/music/level1.mp3", // Correct path
    // level1: 'audio/level1.mp3', // Wrong path
  },
});

// Check loading results
const results = await audioManager.preloadAllAudio();
console.log(`Failed to load: ${results.failed} files`);
```

**Volume not working**

```javascript
// ❌ Problem: Volume set after audio is muted

// ✅ Solution: Check mute state first
if (audioManager.isMuted) {
  audioManager.toggleMute(); // Unmute first
}
audioManager.setMasterVolume(0.8);
```

**Settings not persisting**

```javascript
// ❌ Problem: Settings not being saved

// ✅ Solution: Enable auto-save or save manually
const audioUI = new AudioManagerUI(audioManager, {
  autoSave: true, // Enable auto-save
});

// Or save manually
audioManager.saveSettings();
```

**UI not updating**

```javascript
// ❌ Problem: UI controls out of sync

// ✅ Solution: Update UI controls after programmatic changes
audioManager.setMasterVolume(0.5);
audioUI.updateAllControls(); // Sync UI
```

### **Debug Mode**

```javascript
const audioManager = new AudioManager({
  enableDebugLogs: true, // Enable detailed logging
});

const audioUI = new AudioManagerUI(audioManager, {
  enableDebugLogs: true,
});

// Check audio statistics
console.log(audioManager.getStats());
```

### **Browser Compatibility Issues**

```javascript
// Check for audio support
if (!window.Audio) {
  console.warn("Audio not supported in this browser");
  // Provide fallback or disable audio features
}

// Check for Web Audio API support
if (!window.AudioContext && !window.webkitAudioContext) {
  console.warn("Web Audio API not supported");
  // Audio will work but without advanced features
}
```

### **Performance Issues**

```javascript
// Optimize for performance
const audioManager = new AudioManager({
  autoPreload: false, // Load audio on demand
  maxRetryAttempts: 1, // Reduce retry attempts
  loadTimeout: 5000, // Shorter timeout
});

// Unload unused audio
audioManager.backgroundMusic.clear();
audioManager.soundEffects.clear();
```

---

## 📱 **Browser Support**

- ✅ **Chrome 60+**
- ✅ **Firefox 55+**
- ✅ **Safari 12+**
- ✅ **Edge 79+**
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

**Features used:**

- HTML5 Audio API
- Web Audio API (optional, with fallback)
- ES6 Classes and Promises
- CSS Custom Properties
- localStorage for settings persistence

**Audio Format Support:**

- **MP3**: Universally supported
- **OGG**: Firefox, Chrome
- **WAV**: All browsers (larger files)
- **M4A/AAC**: Safari, Chrome, Edge

---

## 🚀 **Performance Tips**

### **Audio File Optimization**

```javascript
// Use appropriate formats and compression
const audioFiles = {
  backgroundMusic: {
    // Use MP3 128kbps for music (good quality, smaller size)
    level1: "audio/music/level1-128k.mp3",
  },
  soundEffects: {
    // Use MP3 64kbps for short effects (very small size)
    click: "audio/sfx/click-64k.mp3",
  },
};
```

### **Memory Management**

```javascript
// Unload audio when not needed
class OptimizedGame {
  changeLevel(newLevel) {
    // Stop current music
    this.audioManager.stopBackgroundMusic();

    // Unload previous level audio
    this.audioManager.backgroundMusic.delete(this.currentLevel);

    // Load new level audio
    this.audioManager.loadBackgroundMusic(newLevel, `audio/${newLevel}.mp3`);

    this.currentLevel = newLevel;
  }
}
```

### **Loading Strategy**

```javascript
// Progressive loading for better UX
class ProgressiveAudioLoader {
  async loadAudioProgressive() {
    // Load critical audio first
    await this.audioManager.loadSoundEffect("click", "audio/click.mp3");
    await this.audioManager.loadSoundEffect("error", "audio/error.mp3");

    // Load background music in background
    setTimeout(() => {
      this.audioManager.preloadAllAudio();
    }, 1000);
  }
}
```

---

## 🔮 **Future Enhancements**

### **Planned Features:**

- [ ] Audio visualization and spectrum analysis
- [ ] Spatial audio and 3D positioning
- [ ] Audio compression and format conversion
- [ ] Voice recording and playback
- [ ] Real-time audio effects (reverb, chorus, etc.)
- [ ] MIDI support for music generation
- [ ] Audio streaming for large files
- [ ] Advanced crossfading and mixing

### **Extending the System:**

```javascript
// Example: Add spatial audio
class SpatialAudioManager extends AudioManager {
  playSpatialSound(effectKey, x, y, z) {
    if (this.audioContext) {
      const panner = this.audioContext.createPanner();
      panner.setPosition(x, y, z);
      // Connect to audio graph
    }
  }
}

// Example: Add audio analysis
class AnalyzingAudioManager extends AudioManager {
  setupAudioAnalysis() {
    if (this.audioContext) {
      this.analyser = this.audioContext.createAnalyser();
      this.gainNode.connect(this.analyser);
    }
  }

  getAudioFrequencyData() {
    if (this.analyser) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      return dataArray;
    }
  }
}
```

---

## 📊 **API Reference Summary**

### **AudioManager Methods**

| Method                  | Parameters                    | Returns            | Description                 |
| ----------------------- | ----------------------------- | ------------------ | --------------------------- |
| `init()`                | none                          | Promise\<boolean\> | Initialize audio system     |
| `setAudioFiles()`       | audioFiles                    | void               | Set custom audio file paths |
| `preloadAllAudio()`     | none                          | Promise\<Object\>  | Preload all audio assets    |
| `playBackgroundMusic()` | trackKey, fadeIn, stopCurrent | boolean            | Play background music       |
| `stopBackgroundMusic()` | fadeOut                       | boolean            | Stop background music       |
| `playSoundEffect()`     | effectKey, volume, rate       | boolean            | Play sound effect           |
| `setMasterVolume()`     | volume                        | void               | Set master volume           |
| `setBackgroundVolume()` | volume                        | void               | Set background volume       |
| `setSfxVolume()`        | volume                        | void               | Set sound effects volume    |
| `toggleMute()`          | none                          | boolean            | Toggle mute state           |
| `getStats()`            | none                          | Object             | Get system statistics       |
| `saveSettings()`        | customKey                     | boolean            | Save settings to storage    |
| `loadSettings()`        | customKey                     | boolean            | Load settings from storage  |
| `destroy()`             | none                          | void               | Clean up resources          |

### **AudioManagerUI Methods**

| Method                  | Parameters | Returns | Description           |
| ----------------------- | ---------- | ------- | --------------------- |
| `toggleSettingsPanel()` | none       | void    | Toggle settings panel |
| `showSettingsPanel()`   | none       | void    | Show settings panel   |
| `hideSettingsPanel()`   | none       | void    | Hide settings panel   |
| `updateAllControls()`   | none       | void    | Update UI controls    |
| `getUISettings()`       | none       | Object  | Get UI settings       |
| `destroy()`             | none       | void    | Clean up UI resources |

---

## 📄 **License**

This audio management system is part of a personal game development toolkit. Use freely in your own projects.

---

## 🎮 **Example Games Using This System**

- **Ice Cream Fighter** - Turn-based combat with dynamic music
- **Achievement Hunter** - Audio feedback for unlocks
- **[Your Next Game]** - Ready for comprehensive audio!

---

**Built with ❤️ for immersive game audio experiences**

Perfect companion to the Achievement System, Drawer System, and any other game components!
