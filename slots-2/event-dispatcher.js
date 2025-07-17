// Event Dispatcher - Decoupled Communication System
class EventDispatcher {
  constructor() {
    this.listeners = {};
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (!this.listeners[event]) return;

    const index = this.listeners[event].indexOf(callback);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  // Emit an event
  emit(event, data) {
    if (!this.listeners[event]) return;

    // Create a copy of listeners to avoid issues if listeners are modified during emission
    const listeners = [...this.listeners[event]];

    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });
  }

  // One-time event listener
  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data);
      unsubscribe();
    });
    return unsubscribe;
  }

  // Clear all listeners for an event
  removeAllListeners(event) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }

  // Get listener count for an event
  getListenerCount(event) {
    return this.listeners[event] ? this.listeners[event].length : 0;
  }

  // Get all registered events
  getEvents() {
    return Object.keys(this.listeners);
  }
}

// Game Events - Centralized event definitions
const GAME_EVENTS = {
  // Core game events
  SPIN_STARTED: "spin_started",
  SPIN_COMPLETED: "spin_completed",
  SPIN_RESULT: "spin_result",

  // State changes
  STATE_CHANGED: "state_changed",
  CREDITS_CHANGED: "credits_changed",
  JACKPOT_CHANGED: "jackpot_changed",
  LUCK_CHANGED: "luck_changed",

  // Win/loss events
  WIN: "win",
  LOSS: "loss",
  JACKPOT_WIN: "jackpot_win",
  LUCK_JACKPOT: "luck_jackpot",
  COMBO_WIN: "combo_win",

  // Upgrade events
  UPGRADE_PURCHASED: "upgrade_purchased",
  UPGRADE_AVAILABLE: "upgrade_available",

  // UI events
  REEL_SPINNING: "reel_spinning",
  REEL_STOPPED: "reel_stopped",
  CELEBRATION_START: "celebration_start",
  CELEBRATION_END: "celebration_end",

  // Audio events
  PLAY_SOUND: "play_sound",

  // Effect events
  PARTICLE_EXPLOSION: "particle_explosion",
  SCREEN_SHAKE: "screen_shake",
  SCREEN_PULSE: "screen_pulse",

  // System events
  ERROR: "error",
  WARNING: "warning",
  DEBUG: "debug",
};

// Event data interfaces for documentation
const EVENT_DATA_INTERFACES = {
  [GAME_EVENTS.SPIN_RESULT]: {
    result: "object", // { type, symbols, winSymbol, payout }
    payout: "number",
    cost: "number",
  },

  [GAME_EVENTS.WIN]: {
    symbol: "string",
    payout: "number",
    isJackpot: "boolean",
    comboMultiplier: "number",
  },

  [GAME_EVENTS.LUCK_CHANGED]: {
    oldValue: "number",
    newValue: "number",
    maxValue: "number",
  },

  [GAME_EVENTS.UPGRADE_PURCHASED]: {
    category: "string",
    type: "string",
    level: "number",
    cost: "number",
  },

  [GAME_EVENTS.PLAY_SOUND]: {
    soundName: "string",
    volume: "number",
  },

  [GAME_EVENTS.PARTICLE_EXPLOSION]: {
    particleCount: "number",
    centerX: "number",
    centerY: "number",
    spread: "number",
  },
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { EventDispatcher, GAME_EVENTS, EVENT_DATA_INTERFACES };
}
