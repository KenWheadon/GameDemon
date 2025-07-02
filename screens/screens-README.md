# Screen System - Game Development Toolkit

A comprehensive, reusable screen management system for vanilla JavaScript games. Create beautiful start screens, end screens, credits, help pages, and custom game interfaces with smooth transitions and professional styling.

## 🚀 Features

- **Multiple Screen Types**: Start, End, Credits, Help, and Custom screens
- **Smooth Animations**: CSS-powered transitions with performance optimizations
- **Button System**: Configurable buttons with callbacks and multiple variants
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **Accessibility**: Full keyboard navigation, screen reader support, high contrast mode
- **State Management**: Global and screen-specific state handling
- **Navigation History**: Back button functionality with state preservation
- **Integration Ready**: Works seamlessly with Achievement and Drawer systems
- **Error Resistant**: Graceful degradation and comprehensive error handling

## 📁 Files Required

```
screen.css                  # Complete styling system
Screen.js                   # Core reusable Screen class
ScreenManager.js           # Game integration manager class
README-screen.md           # This documentation
screen-test.html           # Independent test environment
```

## 🏗️ Architecture

### Core Classes

1. **Screen** - Individual screen instances with content and buttons
2. **ScreenManager** - Manages multiple screens, transitions, and state

### Design Pattern

- **Modular Game Controller Pattern** with Component-Based Game Screens
- **Template String UI Generation** for DOM manipulation
- **Configuration-Driven Design** with external data objects
- **Event-Driven Architecture** for component communication

## ⚡ Quick Start

### Basic Implementation

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="screen.css" />
  </head>
  <body>
    <script src="Screen.js"></script>
    <script src="ScreenManager.js"></script>
    <script>
      // Initialize Screen Manager
      const screenManager = new ScreenManager({
        defaultScreen: "start",
        screens: {
          start: {
            type: "start",
            title: "My Awesome Game",
            subtitle: "Ready to play?",
            buttons: [
              {
                label: "Start Game",
                primary: true,
                callback: () => screenManager.showScreen("game"),
              },
              {
                label: "Help",
                callback: () => screenManager.showScreen("help"),
              },
            ],
          },
        },
      });

      // Show default screen
      screenManager.showDefaultScreen();
    </script>
  </body>
</html>
```

## 📚 API Reference

### Screen Class

#### Constructor

```javascript
new Screen(config);
```

**Parameters:**

- `config.id` (string) - Unique identifier
- `config.type` (string) - Screen type: 'start', 'end', 'credits', 'help', 'custom'
- `config.title` (string, optional) - Main title text
- `config.subtitle` (string, optional) - Subtitle text
- `config.content` (string, optional) - Main content HTML
- `config.background` (object, optional) - Background configuration
- `config.buttons` (array, optional) - Button configurations
- `config.onShow` (function, optional) - Show callback
- `config.onHide` (function, optional) - Hide callback

#### Methods

##### show(options)

Display the screen with optional animation.

```javascript
await screen.show({
  animate: true, // Enable animation (default: true)
  callback: (screen) => console.log("Screen shown"),
});
```

##### hide(options)

Hide the screen with optional animation.

```javascript
await screen.hide({
  animate: true, // Enable animation (default: true)
  callback: (screen) => console.log("Screen hidden"),
});
```

##### update(updates)

Update screen content dynamically.

```javascript
screen.update({
  title: "New Title",
  buttons: [
    /* new button config */
  ],
});
```

##### getState()

Get current screen state information.

```javascript
const state = screen.getState();
// Returns: { id, type, isVisible, isAnimating, title, subtitle, content, buttonCount }
```

##### destroy()

Clean up resources and remove from DOM.

```javascript
screen.destroy();
```

### ScreenManager Class

#### Constructor

```javascript
new ScreenManager(config);
```

**Parameters:**

- `config.screens` (object, optional) - Screen configurations
- `config.defaultScreen` (string, optional) - Default screen ID
- `config.enableHistory` (boolean, optional) - Enable navigation history (default: true)
- `config.onScreenChange` (function, optional) - Screen change callback
- `config.integrations` (object, optional) - Integration configurations

#### Methods

##### registerScreen(screenId, screenConfig)

Register a new screen.

```javascript
const screen = screenManager.registerScreen("menu", {
  type: "custom",
  title: "Main Menu",
  buttons: [
    { label: "Play", navigate: "game" },
    { label: "Settings", navigate: "settings" },
  ],
});
```

##### registerScreens(screensConfig)

Register multiple screens from configuration object.

```javascript
screenManager.registerScreens({
  start: { type: "start", title: "Game Start" /* ... */ },
  end: { type: "end", title: "Game Over" /* ... */ },
});
```

##### showScreen(screenId, options)

Display a specific screen.

```javascript
await screenManager.showScreen("menu", {
  animate: true, // Enable animation
  data: { score: 1500 }, // Pass data to screen
  addToHistory: true, // Add to navigation history
});
```

##### goBack(options)

Navigate to previous screen in history.

```javascript
await screenManager.goBack({ animate: true });
```

##### restart(options)

Return to default screen and clear history.

```javascript
await screenManager.restart({ resetState: true });
```

##### quit(options)

Close all screens.

```javascript
await screenManager.quit({ animate: true });
```

##### State Management

```javascript
// Global state
screenManager.setGlobalState("playerName", "John");
const name = screenManager.getGlobalState("playerName");

// Screen-specific data
const screenData = screenManager.getScreenData("end", "score");
```

## 🎨 Screen Configuration

### Button Configuration

```javascript
{
    label: 'Button Text',           // Required: Button text
    callback: (screen, button, index) => {}, // Button click handler
    navigate: 'screenId',           // Auto-navigation shortcut
    action: 'back|restart|quit',    // Common action shortcuts
    primary: true,                  // Primary button styling
    disabled: false,                // Disabled state
    class: 'custom-class',          // Additional CSS classes
    icon: '<svg>...</svg>',         // Icon HTML (optional)
    ariaLabel: 'Accessible label'   // Accessibility label
}
```

### Background Configuration

```javascript
{
    type: 'color|gradient|image',   // Background type
    value: '#1a1a2e'               // CSS color, gradient, or image URL
}

// Examples:
{ type: 'color', value: '#1a1a2e' }
{ type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
{ type: 'image', value: 'path/to/background.jpg' }
```

### Screen Types and Default Styling

- **start**: Game launch screen with accent title
- **end**: Game completion screen with gradient background
- **credits**: Scrollable content area for attributions
- **help**: Left-aligned content for instructions
- **custom**: Base styling for specialized screens

## 🎮 Integration Examples

### With Achievement System

```javascript
const screenManager = new ScreenManager({
  integrations: {
    achievements: achievementManager,
  },
  screens: {
    end: {
      type: "end",
      title: "Level Complete!",
      buttons: [
        {
          label: "View Achievements",
          callback: () => {
            achievementManager.showAchievements();
          },
        },
      ],
    },
  },
});
```

### Dynamic Content Updates

```javascript
// Update end screen with game results
screenManager.updateScreen("end", {
  title: `Score: ${finalScore}`,
  content: `
        <p>Time: ${gameTime}</p>
        <p>Best Score: ${bestScore}</p>
        ${newRecord ? "<p><strong>New Record!</strong></p>" : ""}
    `,
});
```

### Custom Screen Types

```javascript
// Create a settings screen
screenManager.registerScreen("settings", {
  type: "custom",
  title: "Game Settings",
  content: `
        <div class="settings-grid">
            <label>
                <input type="range" id="volume" min="0" max="100" value="50">
                Sound Volume
            </label>
            <label>
                <input type="checkbox" id="fullscreen">
                Fullscreen Mode
            </label>
        </div>
    `,
  buttons: [
    {
      label: "Save Settings",
      primary: true,
      callback: (screen) => {
        // Save settings logic
        const volume = document.getElementById("volume").value;
        const fullscreen = document.getElementById("fullscreen").checked;

        screenManager.setGlobalState("settings", { volume, fullscreen });
        screenManager.goBack();
      },
    },
    {
      label: "Cancel",
      action: "back",
    },
  ],
});
```

## 🎯 Advanced Usage

### Custom Transitions

```javascript
// Create screens with custom show/hide callbacks
const screen = new Screen({
  id: "custom-transition",
  title: "Custom Screen",
  onShow: (screen) => {
    // Custom show animation
    gsap.from(screen.element, {
      duration: 0.5,
      scale: 0.8,
      rotation: 180,
    });
  },
  onHide: (screen) => {
    // Custom hide animation
    return new Promise((resolve) => {
      gsap.to(screen.element, {
        duration: 0.3,
        scale: 0,
        onComplete: resolve,
      });
    });
  },
});
```

### Event Handling

```javascript
// Listen for screen events
document.addEventListener("screenManagerChange", (event) => {
  const { current, previous } = event.detail;
  console.log(`Changed from ${previous?.id} to ${current.id}`);
});

document.addEventListener("screenButtonClick", (event) => {
  const { screen, button, buttonIndex } = event.detail;
  console.log(`Button "${button.label}" clicked on screen "${screen.id}"`);
});
```

### Performance Optimization

```javascript
// Preload screens for faster transitions
const screens = ["start", "game", "end"];
screens.forEach((screenId) => {
  const screen = screenManager.getScreen(screenId);
  if (screen && !screen.element.parentNode) {
    document.body.appendChild(screen.element);
    screen.element.style.display = "none";
  }
});
```

## 🎨 CSS Customization

### Custom Color Themes

```css
:root {
  /* Override default colors */
  --screen-bg-primary: #your-color;
  --screen-text-primary: #your-color;
  --screen-button-bg: #your-color;
}

/* Custom screen type */
.game-screen--victory {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
}

.game-screen--victory .screen-title {
  color: #1a1a2e;
  text-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
}
```

### Custom Button Styles

```css
.screen-button--special {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border: none;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
}

.screen-button--special:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.6);
}
```

### Mobile Customization

```css
@media (max-width: 768px) {
  .game-screen--custom .screen-content {
    padding: 1rem;
  }

  .game-screen--custom .screen-buttons {
    position: fixed;
    bottom: 2rem;
    left: 1rem;
    right: 1rem;
  }
}
```

## 🔧 Troubleshooting

### Common Issues

**Screen not showing:**

- Verify CSS file is loaded: `<link rel="stylesheet" href="screen.css">`
- Check JavaScript files are loaded in correct order
- Ensure screen is registered: `screenManager.getScreen('screenId')`

**Buttons not responding:**

- Check callback functions are properly defined
- Verify button is not disabled
- Look for JavaScript console errors

**Animation issues:**

- Check `prefers-reduced-motion` setting
- Verify CSS custom properties are supported
- Test with `animate: false` option

**Mobile responsiveness:**

- Ensure viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Test touch interactions on actual devices
- Check button minimum size (44px for iOS)

### Debug Mode

```javascript
// Enable debug logging
const screenManager = new ScreenManager({
  debug: true, // Add this to constructor config
  screens: {
    /* ... */
  },
});

// Check manager status
console.log(screenManager.getStatus());

// Monitor screen state
console.log(screen.getState());
```

### Performance Issues

```javascript
// Optimize for performance
const screenManager = new ScreenManager({
  screens: {
    /* ... */
  },
  transitions: {
    duration: 150, // Shorter animations
    easing: "ease-out",
  },
});

// Disable animations globally
document.documentElement.style.setProperty(
  "--screen-transition-duration",
  "0ms"
);
```

## 🌟 Best Practices

### Screen Design

1. **Keep titles concise** - Use 1-5 words for main titles
2. **Limit buttons** - 2-4 buttons per screen for clarity
3. **Consistent styling** - Use primary button for main action
4. **Mobile-first** - Design for touch interactions
5. **Accessibility** - Provide meaningful button labels

### Code Organization

```javascript
// Organize screen configurations
const SCREEN_CONFIGS = {
  start: {
    type: "start",
    title: "Game Title",
    buttons: [
      { label: "Play", navigate: "game", primary: true },
      { label: "Help", navigate: "help" },
    ],
  },
  // ... more screens
};

// Initialize with organized config
const screenManager = new ScreenManager({
  defaultScreen: "start",
  screens: SCREEN_CONFIGS,
});
```

### State Management

```javascript
// Use global state for persistent data
screenManager.setGlobalState("playerProgress", {
  level: 5,
  score: 2500,
  unlockedAchievements: ["first-win", "speed-demon"],
});

// Use screen data for temporary information
screenManager.showScreen("end", {
  data: {
    sessionScore: 1500,
    timeBonus: 200,
  },
});
```

### Error Handling

```javascript
// Graceful error handling
try {
  await screenManager.showScreen("nonexistent");
} catch (error) {
  console.error("Screen error:", error);
  // Fallback to safe screen
  screenManager.showScreen("start");
}
```

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- Full screen management system
- Button system with callbacks
- Animation and transition support
- Mobile responsive design
- Accessibility features
- Integration capabilities

## 🤝 Integration Compatibility

- ✅ **Achievement System** - Full integration support
- ✅ **Drawer System** - Compatible event handling
- ✅ **Custom Game Systems** - Event-driven architecture
- ✅ **Mobile Devices** - Touch-optimized interactions
- ✅ **Screen Readers** - Full accessibility support

## 📞 Support

For issues and feature requests:

1. Check the troubleshooting section above
2. Verify all files are included and loaded correctly
3. Test with the provided `screen-test.html` file
4. Review browser console for error messages

## 📄 License

Part of the Vanilla JavaScript Game Development Toolkit.
Use freely in your game projects with attribution.
