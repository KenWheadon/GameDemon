// Slot Machine Configuration
const SLOT_CONFIG = {
  // Game Settings
  INITIAL_CREDITS: 500,
  INITIAL_JACKPOT: 1000,
  BASE_COST: 10,
  MAX_MULTIPLIER: 5,
  JACKPOT_CONTRIBUTION: 0.1, // 10% of each bet goes to jackpot

  // Luck Meter Settings
  LUCK_INCREMENT: 4, // How much luck increases per loss
  LUCK_DECREMENT: 10, // How much luck decreases per win
  MAX_LUCK: 100,
  LUCK_BONUS_MULTIPLIER: 0.1, // 0.1% bonus per luck point

  // Combo Settings
  MAX_COMBO_MULTIPLIER: 3,
  COMBO_BONUS_PER_WIN: 0.1,

  // Particle Settings
  MAX_PARTICLES: 1000,

  // Animation Timings
  REEL_SPIN_DELAY: 100,
  REEL_STOP_DELAY: 400,
  REEL_STOP_BASE_TIME: 800,
  RESULT_PROCESS_DELAY: 2000,
  AUTO_SPIN_DELAY: 1200,
  CELEBRATION_DURATION: 5000,
  COMBO_DISPLAY_DURATION: 2500,
  RESULT_MESSAGE_DURATION: 4000,
  WINNER_EFFECT_DURATION: 2500,

  // Symbols and their properties
  SYMBOLS: ["🍒", "🍋", "🍊", "🍇", "🍓", "💎", "🎰", "🌟"],

  // Symbol probability system (per 10,000 spins for precision)
  SYMBOL_PROBABILITIES: {
    "🍒": 800, // 8% - 10 coins (most common)
    "🍋": 500, // 5% - 25 coins
    "🍊": 300, // 3% - 50 coins
    "🍇": 150, // 1.5% - 80 coins
    "🍓": 80, // 0.8% - 200 coins
    "💎": 30, // 0.3% - 400 coins
    "🎰": 10, // 0.1% - 750 coins
    "🌟": 5, // 0.05% - 1000 + progressive (rarest)
  },

  // Total probability out of 10,000 (18.75% base win rate)
  TOTAL_BASE_WIN_PROBABILITY: 1875,

  // Symbol weights for reel display (cosmetic only)
  REEL_DISPLAY_WEIGHTS: {
    "🍒": 30,
    "🍋": 25,
    "🍊": 20,
    "🍇": 15,
    "🍓": 8,
    "💎": 4,
    "🎰": 2,
    "🌟": 1,
  },

  // Payout information for each symbol (base values before upgrades)
  PAYOUTS: {
    "🍒": { basePayout: 10, name: "Cherry Win!" },
    "🍋": { basePayout: 25, name: "Lemon Lucky!" },
    "🍊": { basePayout: 50, name: "Orange Crush!" },
    "🍇": { basePayout: 80, name: "Grape Great!" },
    "🍓": { basePayout: 200, name: "Strawberry Super!" },
    "💎": { basePayout: 400, name: "Diamond Delight!" },
    "🎰": { basePayout: 750, name: "Slot Machine Mania!" },
    "🌟": { basePayout: 1000, name: "MEGA JACKPOT!", isJackpot: true },
  },

  // Upgrade System Configuration
  UPGRADE_SYSTEM: {
    // Upgrade tiers for each symbol (multiplier and cost)
    SYMBOL_UPGRADES: {
      "🍒": {
        maxLevel: 10,
        baseCost: 50,
        costMultiplier: 1.5,
        payoutMultiplier: 1.2, // 20% increase per level
        description: "Increase Cherry payout",
      },
      "🍋": {
        maxLevel: 8,
        baseCost: 150,
        costMultiplier: 1.6,
        payoutMultiplier: 1.3,
        description: "Increase Lemon payout",
      },
      "🍊": {
        maxLevel: 6,
        baseCost: 400,
        costMultiplier: 1.7,
        payoutMultiplier: 1.4,
        description: "Increase Orange payout",
      },
      "🍇": {
        maxLevel: 5,
        baseCost: 800,
        costMultiplier: 1.8,
        payoutMultiplier: 1.5,
        description: "Increase Grape payout",
      },
      "🍓": {
        maxLevel: 4,
        baseCost: 2000,
        costMultiplier: 2.0,
        payoutMultiplier: 1.6,
        description: "Increase Strawberry payout",
      },
      "💎": {
        maxLevel: 3,
        baseCost: 5000,
        costMultiplier: 2.5,
        payoutMultiplier: 1.8,
        description: "Increase Diamond payout",
      },
      "🎰": {
        maxLevel: 2,
        baseCost: 15000,
        costMultiplier: 3.0,
        payoutMultiplier: 2.0,
        description: "Increase Slot Machine payout",
      },
      "🌟": {
        maxLevel: 1,
        baseCost: 50000,
        costMultiplier: 1.0,
        payoutMultiplier: 2.0,
        description: "Double Jackpot payout",
      },
    },

    // Luck meter upgrades
    LUCK_UPGRADES: {
      LUCK_GAIN: {
        maxLevel: 5,
        baseCost: 1000,
        costMultiplier: 2.0,
        effect: 1.0, // +1 luck per loss per level
        description: "Increase luck gained from losses",
      },
      LUCK_RETENTION: {
        maxLevel: 3,
        baseCost: 3000,
        costMultiplier: 2.5,
        effect: 0.8, // Reduce luck lost on win by 20% per level
        description: "Reduce luck lost on wins",
      },
      MAX_LUCK: {
        maxLevel: 2,
        baseCost: 10000,
        costMultiplier: 4.0,
        effect: 25, // +25 max luck per level
        description: "Increase maximum luck capacity",
      },
    },

    // Multiplier upgrades
    MULTIPLIER_UPGRADES: {
      COMBO_POWER: {
        maxLevel: 5,
        baseCost: 2000,
        costMultiplier: 2.2,
        effect: 0.05, // +5% combo bonus per level
        description: "Increase combo multiplier bonus",
      },
      MAX_MULTIPLIER: {
        maxLevel: 3,
        baseCost: 8000,
        costMultiplier: 3.0,
        effect: 2, // +2 max multiplier per level (5 -> 7 -> 9 -> 11)
        description: "Increase maximum bet multiplier",
      },
    },
  },

  // Paytable display configuration
  PAYTABLE_SYMBOLS: [
    { symbol: "🌟", name: "Mega Jackpot" },
    { symbol: "🎰", name: "Slot Mania" },
    { symbol: "💎", name: "Diamond" },
    { symbol: "🍓", name: "Strawberry" },
    { symbol: "🍇", name: "Grape" },
    { symbol: "🍊", name: "Orange" },
    { symbol: "🍋", name: "Lemon" },
    { symbol: "🍒", name: "Cherry" },
  ],

  // Audio settings
  AUDIO_SETTINGS: {
    SPIN_FREQUENCY: 220,
    SPIN_DURATION: 0.1,
    WIN_FREQUENCY: 440,
    WIN_DURATION: 0.3,
    TICK_FREQUENCY: 880,
    TICK_DURATION: 0.05,
    JACKPOT_FREQUENCIES: [440, 554, 659, 880, 1108],
    JACKPOT_DELAY: 80,
    BIG_WIN_FREQUENCIES: [330, 440, 550],
    BIG_WIN_DELAY: 100,
    COMBO_BASE_FREQUENCY: 660,
    COMBO_FREQUENCY_INCREMENT: 110,
    COMBO_DELAY: 50,
    VOLUME: 0.1,
  },

  // Particle colors for effects
  PARTICLE_COLORS: [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#f9ca24",
    "#f0932b",
    "#eb4d4b",
    "#6c5ce7",
    "#a29bfe",
    "#fd79a8",
    "#fdcb6e",
    "#e17055",
    "#00b894",
    "#00cec9",
    "#0984e3",
    "#6c5ce7",
  ],

  // Thresholds for different effects
  THRESHOLDS: {
    BIG_WIN_AMOUNT: 100,
    PULSE_SCREEN_AMOUNT: 50,
    LUCK_SOUND_TRIGGER: 40,
    HIGH_LUCK_THRESHOLD: 80,
    MEDIUM_LUCK_THRESHOLD: 60,
    LOW_LUCK_THRESHOLD: 40,
    BUILDING_LUCK_THRESHOLD: 20,
  },
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = SLOT_CONFIG;
}
