# Universal Dialogue System

A comprehensive, **game-ready** dialogue and conversation system for web-based games and applications. Features character interactions, branching conversations, choices with consequences, typewriter effects, and seamless game integration.

![Dialogue System Demo](dialogue-demo-screenshot.png)

## 🚀 **Quick Start**

```javascript
// 1. Include the files
<link rel="stylesheet" href="dialogue.css">
<script src="Dialogue.js"></script>
<script src="DialogueManager.js"></script>

// 2. Initialize the dialogue system
const dialogueManager = new DialogueManager(gameInstance, {
  enableDebugLogs: false,
  enableGameIntegration: true
});

// 3. Register characters
dialogueManager.registerCharacter("guard", {
  name: "Town Guard",
  avatar: "images/guard.png",
  textColor: "#ffffff",
  nameColor: "#3182ce"
});

// 4. Create conversations
dialogueManager.registerConversation("greeting", [
  {
    character: "guard",
    text: "Halt! State your business, traveler.",
    choices: [
      { text: "I'm just passing through.", next: 1 },
      { text: "I'm here on important business.", next: 2 }
    ]
  }
]);

// 5. Start dialogue
dialogueManager.startConversation("greeting", {}, "guard");
```

## 📁 **File Structure**

```
dialogue-system/
├── Dialogue.js              // Core dialogue management class
├── DialogueManager.js       // Game integration and state management
├── dialogue.css            // Complete styling system
├── README-dialogue.md       // This documentation
└── dialogue-test.html       // Standalone test environment
```

## 🏗️ **Perfect for Game Integration**

### **🎮 Game-Ready Features:**

- 🗣️ **Character-Based Dialogue** - Multi-character conversations with avatars
- 🌳 **Branching Conversations** - Complex choice trees and conditional dialogue
- ⌨️ **Typewriter Effects** - Animated text with character-specific speeds
- ⏭️ **Auto-Advance Options** - Timed progression for cutscenes
- 🎯 **Game State Integration** - Choices affect player stats, inventory, relationships
- 💾 **State Persistence** - NPC relationships and conversation history
- 🎪 **Dynamic Generation** - Runtime dialogue creation based on game state
- 📱 **Mobile Optimized** - Touch-friendly with responsive design

### **Integration Example:**

```javascript
// Create game with dialogue
class MyGame {
  constructor() {
    this.dialogueManager = new DialogueManager(this);
    this.setupGameDialogue();
  }

  setupGameDialogue() {
    // Register NPCs
    this.dialogueManager.registerCharacter("shopkeeper", {
      name: "Village Shopkeeper",
      avatar: "assets/npcs/shopkeeper.png",
    });

    // Create quest dialogue
    this.dialogueManager.registerConversation("shop_intro", [
      {
        character: "shopkeeper",
        text: "Welcome to my shop! What can I do for you?",
        choices: [
          {
            text: "I'd like to buy something.",
            action: () => this.openShop(),
            next: "end",
          },
          {
            text: "Do you have any quests?",
            gameEffects: {
              setFlags: { asked_about_quests: true },
            },
            next: 1,
          },
        ],
      },
      {
        character: "shopkeeper",
        text: "As a matter of fact, I do need help with something...",
        action: () => this.startQuest("find_rare_herbs"),
      },
    ]);
  }

  startNPCConversation(npcId) {
    // Simple integration - dialogue handles everything
    this.dialogueManager.startConversation(`${npcId}_intro`, {}, npcId);
  }
}
```

---

## 📖 **API Documentation**

## **Dialogue Class** (Core System)

### **Constructor**

```javascript
new Dialogue(containerSelector, (options = {}));
```

**Options:**

```javascript
{
  typewriterSpeed: 50,           // Characters per second
  autoAdvanceDelay: 3000,        // Auto-advance delay (ms)
  enableAutoAdvance: false,      // Auto-advance conversations
  enableTypewriter: true,        // Typewriter text effect
  showCharacterImages: true,     // Display character avatars
  enableSoundEffects: true,      // Play typing/advance sounds
  enableKeyboardShortcuts: true, // Space/Enter to advance
  maxChoiceTime: 0,             // Time limit for choices (0 = no limit)
  enableChoiceShuffling: false  // Randomize choice order
}
```

### **Core Methods**

#### **`registerCharacter(characterId, character)`**

Register a character with avatar and settings

```javascript
dialogue.registerCharacter("wizard", {
  name: "Ancient Wizard",
  avatar: "images/wizard.png",
  textColor: "#faf5ff",
  nameColor: "#805ad5",
  typingSpeed: 30,
  voice: "wizard_voice.mp3",
});
```

#### **`registerConversation(conversationId, dialogueData)`**

Register a conversation with dialogue array

```javascript
dialogue.registerConversation("welcome", [
  {
    character: "wizard",
    text: "Welcome, young adventurer!",
    choices: [
      { text: "Thank you, wise one.", next: 1 },
      { text: "I seek knowledge.", next: 2 },
    ],
  },
  {
    character: "wizard",
    text: "Politeness will serve you well on your journey.",
  },
  {
    character: "wizard",
    text: "Knowledge is the greatest treasure. What would you learn?",
  },
]);
```

#### **`startConversation(conversationId, context)`**

Start a conversation with optional context

```javascript
const success = dialogue.startConversation("welcome", {
  playerLevel: 5,
  hasMetBefore: false,
});
```

#### **`endConversation()`**

End the current conversation

```javascript
dialogue.endConversation();
```

#### **`advanceDialogue()`**

Advance to the next dialogue entry

```javascript
dialogue.advanceDialogue();
```

### **Event Callbacks**

#### **`on(eventName, callback)`**

Set event callbacks for dialogue events

```javascript
dialogue.on("dialogueStart", (conversationId, context) => {
  console.log(`Started: ${conversationId}`);
});

dialogue.on("dialogueEnd", (conversation) => {
  console.log(`Ended: ${conversation.id}`);
});

dialogue.on("choiceSelected", (choiceIndex, choice, conversation) => {
  console.log(`Selected: ${choice.text}`);
});

dialogue.on("characterSpeak", (character, dialogue) => {
  console.log(`${character.name}: ${dialogue.text}`);
});
```

---

## **DialogueManager Class** (Game Integration)

### **Constructor**

```javascript
new DialogueManager(gameInstance, (options = {}));
```

**Options:**

```javascript
{
  containerSelector: '#dialogue-container',
  enableDebugLogs: false,
  enableGameIntegration: true,
  enableAutoSave: true,
  persistConversationState: true,
  storageKey: 'dialogue-manager-state'
}
```

### **Character Management**

#### **`registerCharacter(characterId, characterData)`**

Register a character with enhanced game features

```javascript
dialogueManager.registerCharacter("merchant", {
  name: "Traveling Merchant",
  avatar: "npcs/merchant.png",
  textColor: "#fffbf0",
  nameColor: "#d69e2e",
  personality: "friendly",
  relationship: 0, // Starting relationship
  typingSpeed: 80,
});
```

#### **`registerNPCWithConversations(npcData)`**

Register an NPC with multiple conversations

```javascript
dialogueManager.registerNPCWithConversations({
  id: "blacksmith",
  character: {
    name: "Master Blacksmith",
    avatar: "npcs/blacksmith.png",
  },
  conversations: {
    intro: [
      /* dialogue array */
    ],
    shop: [
      /* dialogue array */
    ],
    quest: [
      /* dialogue array */
    ],
  },
});
```

### **Conversation Management**

#### **`registerConversation(conversationId, dialogueData, metadata)`**

Register conversation with metadata and game integration

```javascript
dialogueManager.registerConversation("quest_start", dialogueData, {
  repeatable: false,
  category: "quest",
  requiredFlags: ["met_king"],
  requiredLevel: 5,
  oneTimeOnly: true,
});
```

#### **`startConversation(conversationId, context, npcId)`**

Start conversation with game integration

```javascript
dialogueManager.startConversation(
  "shop_greeting",
  {
    hasGold: player.gold > 100,
  },
  "merchant"
);
```

### **State Management**

#### **`setGlobalFlag(flag, value)` / `getGlobalFlag(flag)`**

Manage global game flags

```javascript
dialogueManager.setGlobalFlag("dragon_defeated", true);
const hasKey = dialogueManager.getGlobalFlag("has_castle_key", false);
```

#### **`getNPCState(npcId)` / `setNPCState(npcId, state)`**

Manage NPC-specific state

```javascript
const merchantState = dialogueManager.getNPCState("merchant");
// Returns: { metBefore: true, relationship: 15, lastConversation: "shop", ... }

dialogueManager.setNPCState("merchant", {
  relationship: 20,
  customFlags: { knows_secret: true },
});
```

#### **`saveConversationStates()` / `loadConversationStates()`**

Persist dialogue state

```javascript
dialogueManager.saveConversationStates();
const loaded = dialogueManager.loadConversationStates();
```

### **Dynamic Dialogue Generation**

#### **Generator Functions**

Create dynamic conversations based on game state

```javascript
dialogueManager.registerConversation(
  "dynamic_guard",
  (context, api) => {
    const relationship = api.getNPCState("guard").relationship;
    const playerLevel = context.playerLevel;

    let greeting;
    if (relationship > 50) {
      greeting = "My trusted friend! Welcome back!";
    } else if (playerLevel < 5) {
      greeting = "You look new around here. Be careful.";
    } else {
      greeting = "State your business, traveler.";
    }

    return [
      api.createDialogue("guard", greeting),
      // Generate more dialogue based on conditions...
    ];
  },
  { repeatable: true }
);
```

#### **API Object for Generators**

```javascript
const api = {
  // Flag management
  getFlag: (flag) => boolean,
  setFlag: (flag, value) => void,

  // NPC state
  getNPCState: (npcId) => object,
  setNPCState: (npcId, state) => void,

  // Game state
  getPlayerState: () => object,

  // Utilities
  random: (min, max) => number,
  choice: (array) => any,

  // Dialogue builders
  createChoice: (text, action, next) => choice,
  createDialogue: (character, text, options) => dialogue
};
```

---

## 🎮 **Usage Examples**

### **1. Basic RPG Dialogue**

```javascript
class RPGGame {
  constructor() {
    this.dialogueManager = new DialogueManager(this);
    this.setupNPCs();
  }

  setupNPCs() {
    // Register village NPCs
    this.dialogueManager.registerCharacter("innkeeper", {
      name: "Friendly Innkeeper",
      avatar: "npcs/innkeeper.png",
      personality: "welcoming",
    });

    // Create greeting conversation
    this.dialogueManager.registerConversation("inn_greeting", [
      {
        character: "innkeeper",
        text: "Welcome to the Prancing Pony! How can I help you tonight?",
        choices: [
          {
            text: "I need a room for the night.",
            gameEffects: {
              giveItems: [{ id: "room_key", quantity: 1 }],
              statChanges: { gold: -10 },
            },
            next: 1,
          },
          {
            text: "Just looking around.",
            next: 2,
          },
          {
            text: "Have you heard any interesting news?",
            gameEffects: {
              setFlags: { heard_rumors: true },
            },
            next: 3,
          },
        ],
      },
      {
        character: "innkeeper",
        text: "Here's your key! Room's upstairs, first door on the right. Sleep well!",
      },
      {
        character: "innkeeper",
        text: "Feel free to browse. We've got the finest ale in the kingdom!",
      },
      {
        character: "innkeeper",
        text: "Indeed I have! Strange creatures have been spotted near the old ruins...",
      },
    ]);
  }

  onPlayerInteractWithNPC(npcId) {
    // Simple NPC interaction
    this.dialogueManager.startConversation(
      `${npcId}_greeting`,
      {
        playerGold: this.player.gold,
        playerLevel: this.player.level,
      },
      npcId
    );
  }
}
```

### **2. Visual Novel Style**

```javascript
class VisualNovel {
  constructor() {
    this.dialogueManager = new DialogueManager(this, {
      enableAutoAdvance: true,
      autoAdvanceDelay: 4000,
    });
    this.setupStory();
  }

  setupStory() {
    // Register story characters
    this.dialogueManager.registerCharacter("protagonist", {
      name: "Alex",
      avatar: "characters/alex.png",
      textColor: "#e2e8f0",
    });

    this.dialogueManager.registerCharacter("mysterious_figure", {
      name: "???",
      avatar: "characters/shadow.png",
      textColor: "#a0aec0",
      typingSpeed: 25,
    });

    // Story chapter with auto-advance
    this.dialogueManager.registerConversation("chapter1_intro", [
      {
        character: "protagonist",
        text: "The old mansion loomed before me, its windows dark and empty.",
        autoAdvance: 3000,
        showContinueButton: false,
      },
      {
        character: "protagonist",
        text: "Something didn't feel right about this place...",
        autoAdvance: 2500,
        showContinueButton: false,
      },
      {
        character: "mysterious_figure",
        text: "You shouldn't have come here...",
        typewriterSpeed: 15,
        showContinueButton: true,
      },
      {
        character: "protagonist",
        text: "Who's there?! Show yourself!",
        choices: [
          { text: "Look around cautiously", next: 4 },
          { text: "Call out boldly", next: 5 },
          { text: "Try to leave", next: 6 },
        ],
      },
      // ... story continues based on choices
    ]);
  }

  startChapter(chapterNumber) {
    this.dialogueManager.startConversation(`chapter${chapterNumber}_intro`);
  }
}
```

### **3. Quest System Integration**

```javascript
class QuestRPG {
  constructor() {
    this.dialogueManager = new DialogueManager(this);
    this.questManager = new QuestManager();
    this.setupQuestNPCs();
  }

  setupQuestNPCs() {
    // Quest giver NPC
    this.dialogueManager.registerCharacter("quest_master", {
      name: "Guild Master",
      avatar: "npcs/guild_master.png",
    });

    // Dynamic quest dialogue based on available quests
    this.dialogueManager.registerConversation(
      "guild_quests",
      (context, api) => {
        const availableQuests = this.questManager.getAvailableQuests(
          context.playerLevel
        );
        const activeQuests = this.questManager.getActiveQuests();

        if (activeQuests.length > 0) {
          return [
            api.createDialogue("quest_master", "How goes your current quest?"),
            {
              character: "quest_master",
              text: "Would you like to report progress or abandon your quest?",
              choices: [
                {
                  text: "Report progress",
                  action: () => this.showQuestProgress(),
                  next: "end",
                },
                {
                  text: "Abandon quest",
                  action: () => this.abandonQuest(),
                  next: "end",
                },
              ],
            },
          ];
        }

        if (availableQuests.length === 0) {
          return [
            api.createDialogue(
              "quest_master",
              "No quests available for your level right now. Come back later!"
            ),
          ];
        }

        // Generate quest options
        const questChoices = availableQuests.map((quest) => ({
          text: `${quest.title} (Level ${quest.minLevel})`,
          action: () => this.startQuest(quest.id),
          gameEffects: {
            setFlags: { [`quest_${quest.id}_active`]: true },
          },
          next: "end",
        }));

        return [
          api.createDialogue(
            "quest_master",
            "I have several quests available:"
          ),
          {
            character: "quest_master",
            text: "Which quest interests you?",
            choices: [...questChoices, { text: "Maybe later", next: "end" }],
          },
        ];
      },
      { repeatable: true }
    );
  }

  talkToQuestMaster() {
    this.dialogueManager.startConversation(
      "guild_quests",
      {
        playerLevel: this.player.level,
        completedQuests: this.questManager.getCompletedQuests(),
      },
      "quest_master"
    );
  }
}
```

### **4. Relationship System**

```javascript
class RelationshipGame {
  constructor() {
    this.dialogueManager = new DialogueManager(this);
    this.setupRelationshipSystem();
  }

  setupRelationshipSystem() {
    // Romance option NPC
    this.dialogueManager.registerCharacter("love_interest", {
      name: "Casey",
      avatar: "npcs/casey.png",
      relationship: 0,
    });

    // Relationship-dependent conversations
    this.dialogueManager.registerConversation(
      "romance_talk",
      (context, api) => {
        const npcState = api.getNPCState("love_interest");
        const relationship = npcState.relationship;

        let dialogue;

        if (relationship >= 80) {
          dialogue = [
            api.createDialogue(
              "love_interest",
              "I'm so glad we met. You mean everything to me."
            ),
            {
              character: "love_interest",
              text: "Would you like to make this official?",
              choices: [
                {
                  text: "Yes, I love you too!",
                  gameEffects: {
                    setFlags: { relationship_official: true },
                    relationship: 10,
                  },
                  next: 2,
                },
                {
                  text: "I need more time.",
                  gameEffects: { relationship: -5 },
                  next: 3,
                },
              ],
            },
            api.createDialogue(
              "love_interest",
              "This is the happiest day of my life!"
            ),
            api.createDialogue(
              "love_interest",
              "I understand. Take all the time you need."
            ),
          ];
        } else if (relationship >= 40) {
          dialogue = [
            api.createDialogue(
              "love_interest",
              "I really enjoy spending time with you."
            ),
            {
              character: "love_interest",
              text: "Would you like to go somewhere together?",
              choices: [
                {
                  text: "That sounds wonderful!",
                  gameEffects: { relationship: 5 },
                  action: () => this.startDateScene(),
                  next: "end",
                },
                {
                  text: "Maybe another time.",
                  gameEffects: { relationship: -2 },
                  next: "end",
                },
              ],
            },
          ];
        } else if (relationship < 0) {
          dialogue = [
            api.createDialogue(
              "love_interest",
              "I don't really want to talk right now."
            ),
            {
              character: "love_interest",
              text: "Maybe you should apologize for what you did.",
              choices: [
                {
                  text: "I'm sorry for hurting you.",
                  gameEffects: { relationship: 10 },
                  next: 2,
                },
                {
                  text: "I don't know what you mean.",
                  gameEffects: { relationship: -5 },
                  next: 3,
                },
              ],
            },
            api.createDialogue("love_interest", "Thank you. That means a lot."),
            api.createDialogue(
              "love_interest",
              "Fine. Just... leave me alone."
            ),
          ];
        } else {
          dialogue = [
            api.createDialogue("love_interest", "Hi there! How are you doing?"),
            {
              character: "love_interest",
              text: "Want to chat for a bit?",
              choices: [
                {
                  text: "I'd love to!",
                  gameEffects: { relationship: 2 },
                  next: 2,
                },
                {
                  text: "Sorry, I'm busy.",
                  next: 3,
                },
              ],
            },
            api.createDialogue(
              "love_interest",
              "Great! Tell me about your latest adventure."
            ),
            api.createDialogue(
              "love_interest",
              "No worries! Talk to you later."
            ),
          ];
        }

        return dialogue;
      },
      { repeatable: true }
    );
  }

  // Gift-giving mechanic
  giveGift(npcId, item) {
    const npcState = this.dialogueManager.getNPCState(npcId);
    const giftValue = this.getGiftValue(item, npcId);

    // Update relationship based on gift
    npcState.relationship += giftValue;
    this.dialogueManager.setNPCState(npcId, npcState);

    // Show reaction dialogue
    this.showGiftReaction(npcId, item, giftValue);
  }
}
```

### **5. Achievement Integration**

```javascript
class GameWithDialogueAchievements {
  constructor() {
    this.dialogueManager = new DialogueManager(this);
    this.achievementManager = new AchievementManager(this);
    this.connectDialogueToAchievements();
  }

  connectDialogueToAchievements() {
    // Track dialogue-related achievements
    this.dialogueManager.dialogue.on("conversationEnd", (conversation) => {
      // Achievement for completing conversations
      this.achievementManager.incrementGameStat("conversationsCompleted");

      // Special achievement for long conversations
      if (conversation.history && conversation.history.length >= 20) {
        this.achievementManager.unlockAchievement("chatterbox");
      }
    });

    this.dialogueManager.dialogue.on(
      "choiceSelected",
      (choiceIndex, choice, conversation) => {
        // Achievement for making choices
        this.achievementManager.incrementGameStat("choicesMade");

        // Achievement for always being polite
        if (
          choice.text.includes("please") ||
          choice.text.includes("thank you")
        ) {
          this.achievementManager.incrementGameStat("politeChoices");
        }
      }
    );

    // Register dialogue-specific achievements
    this.achievementManager.registerCustomChecker("smooth_talker", (stats) => {
      return stats.conversationsCompleted >= 50 && stats.politeChoices >= 25;
    });

    this.achievementManager.registerCustomChecker("silver_tongue", (stats) => {
      // Check if player has high relationships with multiple NPCs
      const highRelationships = Array.from(
        this.dialogueManager.npcStates.values()
      ).filter((npc) => npc.relationship >= 50).length;
      return highRelationships >= 5;
    });
  }

  // Show achievement unlock in dialogue
  showAchievementDialogue(achievementName) {
    this.dialogueManager.registerConversation("achievement_unlock", [
      {
        character: "narrator",
        text: `🏆 Achievement Unlocked: ${achievementName}!`,
        autoAdvance: 3000,
        showContinueButton: false,
      },
    ]);

    this.dialogueManager.startConversation("achievement_unlock");
  }
}
```

---

## ⚙️ **Dialogue Object Structure**

### **Basic Dialogue Object**

```javascript
{
  character: "character_id",        // Required: Character speaking
  text: "Hello, traveler!",         // Required: Dialogue text

  // Optional display options
  avatar: "custom_avatar.png",      // Override character avatar
  autoAdvance: 2000,               // Auto-advance after delay (ms)
  typewriterSpeed: 50,             // Override typing speed
  showContinueButton: true,        // Show continue button

  // Optional metadata
  id: "dialogue_1",                // Unique identifier
  tags: ["intro", "friendly"],     // Classification tags

  // Optional callbacks
  onStart: (dialogue, context) => {}, // When dialogue starts
  onComplete: (dialogue, context) => {}, // When dialogue completes

  // Optional conditions and effects
  condition: (context) => boolean,  // Show only if condition met
  effects: (context) => {},        // Apply effects when shown
  action: (dialogue, context) => {} // Execute action
}
```

### **Choice Object Structure**

```javascript
{
  text: "I accept your quest!",     // Required: Choice text

  // Navigation
  next: 2,                         // Next dialogue index
  // OR
  next: "end",                     // End conversation
  // OR
  next: "other_conversation",      // Start different conversation

  // Game integration
  gameEffects: {
    setFlags: {                    // Set global flags
      quest_active: true
    },
    relationship: 5,               // Modify NPC relationship
    giveItems: [                   // Give items to player
      { id: "quest_item", quantity: 1 }
    ],
    statChanges: {                 // Modify player stats
      experience: 100,
      gold: 50
    },
    questUpdates: [                // Update quest progress
      { questId: "main_quest", progress: "started" }
    ]
  },

  // Optional properties
  disabled: false,                 // Choice is disabled
  highlighted: false,              // Visually highlight choice
  default: false,                  // Default choice for timeouts

  // Callbacks
  action: (choice, context) => {}, // Execute when selected
  callback: (action, popup) => {} // Custom callback
}
```

### **Character Object Structure**

```javascript
{
  name: "Character Name",          // Required: Display name
  avatar: "path/to/avatar.png",    // Character image
  textColor: "#ffffff",            // Text color
  nameColor: "#48dbfb",           // Name color
  typingSpeed: 50,                // Characters per second
  voice: "character_voice.mp3",    // Typing sound file

  // Game integration
  personality: "friendly",         // Character personality
  relationship: 0,                // Starting relationship (-100 to 100)

  // Advanced options
  defaultEmotion: "neutral",       // Default emotional state
  emotions: {                      // Emotion-specific settings
    happy: { textColor: "#90EE90" },
    angry: { textColor: "#FF6B6B" }
  }
}
```

---

## 🎨 **Styling & Themes**

### **CSS Custom Properties**

```css
:root {
  --dialogue-background: rgba(26, 32, 44, 0.98);
  --dialogue-border: rgba(255, 255, 255, 0.2);
  --dialogue-character-name: #48dbfb;
  --dialogue-button-primary: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
  --dialogue-choice-background: rgba(255, 255, 255, 0.05);
  --dialogue-avatar-size: 80px;
  --dialogue-border-radius: 12px;
  --dialogue-transition-speed: 0.3s;
}
```

### **Pre-built Theme Classes**

```css
/* Fantasy Theme */
.dialogue-theme-fantasy {
  --dialogue-background: rgba(75, 54, 124, 0.98);
  --dialogue-character-name: #ffd700;
  --dialogue-button-primary: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
}

/* Sci-Fi Theme */
.dialogue-theme-scifi {
  --dialogue-background: rgba(13, 42, 58, 0.98);
  --dialogue-character-name: #00ffff;
  --dialogue-button-primary: linear-gradient(135deg, #00ffff 0%, #0080ff 100%);
}

/* Horror Theme */
.dialogue-theme-horror {
  --dialogue-background: rgba(40, 20, 20, 0.98);
  --dialogue-character-name: #ff4444;
  --dialogue-button-primary: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
}
```

### **Apply Themes**

```javascript
// Change theme programmatically
function setDialogueTheme(themeName) {
  const panel = document.querySelector(".dialogue-panel");

  // Remove existing theme classes
  panel.classList.remove(
    "dialogue-theme-fantasy",
    "dialogue-theme-scifi",
    "dialogue-theme-horror"
  );

  // Add new theme
  if (themeName !== "default") {
    panel.classList.add(`dialogue-theme-${themeName}`);
  }
}
```

---

## 🔧 **Advanced Features**

### **Conditional Dialogue**

```javascript
// Show different dialogue based on game state
{
  character: "guard",
  text: "Welcome back, hero!",
  condition: (context) => context.playerLevel >= 10 && context.gameFlags.hero_status === true
},
{
  character: "guard",
  text: "State your business, stranger.",
  condition: (context) => !context.gameFlags.met_guard_before
}
```

### **Dynamic Content Generation**

```javascript
// Generate dialogue content at runtime
{
  character: "merchant",
  text: (context) => {
    const gold = context.playerGold;
    if (gold > 1000) {
      return "I see you're quite wealthy! I have some rare items you might enjoy.";
    } else if (gold > 100) {
      return "Welcome! I have affordable wares for the discerning adventurer.";
    } else {
      return "Hmm, not much coin, eh? Perhaps some basic supplies?";
    }
  }
}
```

### **Dialogue Validation**

```javascript
// Validate dialogue data structure
function validateDialogue(dialogueArray) {
  return dialogueArray.every((dialogue, index) => {
    // Required fields
    if (!dialogue.character || !dialogue.text) {
      console.error(`Dialogue ${index}: Missing required character or text`);
      return false;
    }

    // Validate choices
    if (dialogue.choices) {
      return dialogue.choices.every((choice) => {
        if (!choice.text) {
          console.error(`Dialogue ${index}: Choice missing text`);
          return false;
        }
        return true;
      });
    }

    return true;
  });
}
```

### **Audio Integration**

```javascript
// Connect with audio system
class AudioIntegratedDialogue extends DialogueManager {
  constructor(game, audioManager) {
    super(game);
    this.audioManager = audioManager;
    this.setupAudioIntegration();
  }

  setupAudioIntegration() {
    this.dialogue.on("characterSpeak", (character, dialogue) => {
      // Play character voice
      if (character.voice) {
        this.audioManager.playSoundEffect(character.voice, 0.3);
      } else {
        this.audioManager.playSoundEffect("dialogue_text", 0.2);
      }
    });

    this.dialogue.on("choiceSelected", () => {
      this.audioManager.playSoundEffect("ui_select", 0.5);
    });

    this.dialogue.on("dialogueStart", () => {
      this.audioManager.playSoundEffect("dialogue_start", 0.4);
    });
  }
}
```

### **Save/Load Integration**

```javascript
// Custom save data handling
class PersistentDialogue extends DialogueManager {
  saveGameState() {
    const dialogueState = {
      globalFlags: Object.fromEntries(this.globalFlags),
      npcStates: Object.fromEntries(this.npcStates),
      conversationHistory: this.conversationHistory.slice(-20), // Last 20
      currentConversation: this.dialogue.currentConversation?.id || null,
    };

    // Save to your game's save system
    this.game.saveData.dialogueState = dialogueState;
  }

  loadGameState(saveData) {
    if (saveData.dialogueState) {
      const state = saveData.dialogueState;

      this.globalFlags = new Map(Object.entries(state.globalFlags || {}));
      this.npcStates = new Map(Object.entries(state.npcStates || {}));
      this.conversationHistory = state.conversationHistory || [];

      // Resume conversation if there was one active
      if (state.currentConversation) {
        setTimeout(() => {
          this.startConversation(state.currentConversation);
        }, 100);
      }
    }
  }
}
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Dialogue not appearing**

```javascript
// ❌ Problem: Container not found
new Dialogue("#wrong-selector"); // Throws error

// ✅ Solution: Ensure container exists
const container = document.querySelector("#dialogue-container");
if (!container) {
  const newContainer = document.createElement("div");
  newContainer.id = "dialogue-container";
  document.body.appendChild(newContainer);
}
```

**Characters not registered**

```javascript
// ❌ Problem: Starting conversation before registering character
dialogueManager.startConversation("greeting"); // Character not found

// ✅ Solution: Register characters first
dialogueManager.registerCharacter("guard", { name: "Guard" });
dialogueManager.registerConversation("greeting", [
  { character: "guard", text: "Hello!" },
]);
dialogueManager.startConversation("greeting");
```

**Choices not working**

```javascript
// ❌ Problem: Invalid next index
{
  text: "Go to next dialogue",
  next: 999 // Index doesn't exist
}

// ✅ Solution: Use valid indices or 'end'
{
  text: "Go to next dialogue",
  next: 1 // Valid index
}
{
  text: "End conversation",
  next: "end"
}
```

**Game effects not applying**

```javascript
// ❌ Problem: Missing game integration methods
choice.gameEffects = { giveItems: [{ id: "sword" }] };
// But game.giveItem() doesn't exist

// ✅ Solution: Implement required game methods
class MyGame {
  giveItem(itemId, quantity = 1) {
    this.player.inventory.push({ id: itemId, quantity });
  }

  modifyPlayerStat(stat, change) {
    this.player.stats[stat] = (this.player.stats[stat] || 0) + change;
  }
}
```

**Typewriter effect not working**

```javascript
// ❌ Problem: Typewriter disabled
const dialogue = new Dialogue("#container", {
  enableTypewriter: false, // Disabled
});

// ✅ Solution: Enable typewriter
const dialogue = new Dialogue("#container", {
  enableTypewriter: true,
  typewriterSpeed: 50,
});
```

**State not persisting**

```javascript
// ❌ Problem: Auto-save disabled
const dialogueManager = new DialogueManager(game, {
  enableAutoSave: false,
  persistConversationState: false,
});

// ✅ Solution: Enable persistence
const dialogueManager = new DialogueManager(game, {
  enableAutoSave: true,
  persistConversationState: true,
});
```

### **Debug Mode**

```javascript
const dialogueManager = new DialogueManager(game, {
  enableDebugLogs: true, // Enable detailed logging
});

// Check system state
console.log("Dialogue Stats:", dialogueManager.getStats());
console.log("Global Flags:", dialogueManager.globalFlags);
console.log("NPC States:", dialogueManager.npcStates);
```

### **Performance Issues**

```javascript
// Optimize for performance
const dialogue = new Dialogue("#container", {
  enableTypewriter: false, // Disable for performance
  enableSoundEffects: false, // Reduce audio calls
  autoAdvanceDelay: 1000, // Faster transitions
});

// Limit conversation history
const dialogueManager = new DialogueManager(game, {
  maxHistorySize: 10, // Keep only last 10 conversations
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

- ES6 Classes and Maps
- CSS Custom Properties
- CSS Transforms and Transitions
- localStorage for state persistence
- Modern DOM APIs

---

## 🚀 **Performance Tips**

### **Optimize Large Conversations**

```javascript
// ❌ Avoid: Huge single conversations
const hugeTalk = new Array(500).fill().map((_, i) => ({
  character: "narrator",
  text: `This is line ${i} of a very long conversation...`,
}));

// ✅ Better: Break into chapters
const chapter1 = conversations.slice(0, 50);
const chapter2 = conversations.slice(50, 100);

dialogueManager.registerConversation("story_ch1", chapter1);
dialogueManager.registerConversation("story_ch2", chapter2);
```

### **Efficient State Management**

```javascript
// ❌ Avoid: Storing large objects in flags
dialogueManager.setGlobalFlag("entire_game_state", hugObject);

// ✅ Better: Store only necessary data
dialogueManager.setGlobalFlag("quest_dragon_defeated", true);
dialogueManager.setGlobalFlag("relationship_wizard", 50);
```

### **Memory Management**

```javascript
// Clean up old conversation history
class OptimizedDialogueManager extends DialogueManager {
  cleanupHistory() {
    // Keep only last 20 conversations
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  endConversation() {
    super.endConversation();
    this.cleanupHistory();
  }
}
```

---

## 🔮 **Future Enhancements**

### **Planned Features:**

- [ ] Voice synthesis integration (text-to-speech)
- [ ] Lip-sync animation support
- [ ] Rich text formatting (bold, italic, colors)
- [ ] Dialogue tree visual editor
- [ ] Multi-language localization system
- [ ] Advanced emotion system
- [ ] Gesture and animation triggers
- [ ] Dialogue recording and playback

### **Extending the System:**

```javascript
// Example: Add emotion system
class EmotionalDialogue extends Dialogue {
  setCharacterEmotion(characterId, emotion) {
    const character = this.characters.get(characterId);
    if (character && character.emotions && character.emotions[emotion]) {
      // Apply emotion-specific styling
      Object.assign(character, character.emotions[emotion]);
    }
  }
}

// Example: Add rich text support
class RichTextDialogue extends Dialogue {
  processRichText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<span class="dialogue-link" data-action="$2">$1</span>'
      );
  }
}
```

---

## 📊 **API Reference Summary**

### **Dialogue Core Methods**

| Method                   | Parameters                   | Returns | Description                    |
| ------------------------ | ---------------------------- | ------- | ------------------------------ |
| `registerCharacter()`    | characterId, character       | void    | Register character with avatar |
| `registerConversation()` | conversationId, dialogueData | void    | Register conversation          |
| `startConversation()`    | conversationId, context      | boolean | Start conversation             |
| `endConversation()`      | none                         | void    | End current conversation       |
| `advanceDialogue()`      | none                         | void    | Advance to next dialogue       |
| `on()`                   | eventName, callback          | void    | Set event callback             |

### **DialogueManager Methods**

| Method                     | Parameters                             | Returns | Description                              |
| -------------------------- | -------------------------------------- | ------- | ---------------------------------------- |
| `registerCharacter()`      | characterId, characterData             | void    | Register character with game features    |
| `registerConversation()`   | conversationId, dialogueData, metadata | void    | Register conversation with metadata      |
| `startConversation()`      | conversationId, context, npcId         | boolean | Start conversation with game integration |
| `setGlobalFlag()`          | flag, value                            | void    | Set global game flag                     |
| `getGlobalFlag()`          | flag, defaultValue                     | any     | Get global game flag                     |
| `getNPCState()`            | npcId                                  | object  | Get NPC state                            |
| `setNPCState()`            | npcId, state                           | void    | Update NPC state                         |
| `saveConversationStates()` | customKey                              | boolean | Save state to storage                    |
| `loadConversationStates()` | customKey                              | boolean | Load state from storage                  |
| `getStats()`               | none                                   | object  | Get system statistics                    |

---

## 📄 **License**

This dialogue system is part of a personal game development toolkit. Use freely in your own projects.

---

## 🎮 **Example Games Using This System**

- **Fantasy RPG** - NPC conversations with relationship tracking
- **Visual Novel** - Story-driven dialogue with branching narratives
- **Quest Adventure** - Dynamic quest dialogue based on player progress
- **[Your Next Game]** - Ready for any conversation needs!

---

**Built with ❤️ for engaging narrative experiences**

Perfect companion to the Achievement System, Audio Manager, and all other GameDemon toolkit components!
