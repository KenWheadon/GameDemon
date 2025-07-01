/**
 * DialogueManager - Game Integration Class for Dialogue System
 * Handles game integration, conversation management, and NPC interactions
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class DialogueManager {
  constructor(gameInstance, options = {}) {
    this.game = gameInstance;
    this.dialogue = null;

    // Configuration options
    this.options = {
      containerSelector: '#dialogue-container',
      enableDebugLogs: false,
      enableGameIntegration: true,
      enableAutoSave: true,
      persistConversationState: true,
      storageKey: 'dialogue-manager-state',
      ...options
    };

    // State management
    this.conversationStates = new Map();
    this.npcStates = new Map();
    this.globalFlags = new Map();
    this.conversationHistory = [];

    // Game integration hooks
    this.gameHooks = {
      onStateChange: null,
      onItemGained: null,
      onQuestUpdate: null,
      onStatChange: null
    };

    // Initialize the system
    this.init();
  }

  /**
   * Initialize the dialogue manager
   */
  init() {
    try {
      this.log('Initializing DialogueManager...');

      // Create dialogue container if it doesn't exist
      this.ensureDialogueContainer();

      // Initialize core dialogue system
      this.dialogue = new Dialogue(this.options.containerSelector, {
        enableDebugLogs: this.options.enableDebugLogs,
        enableSoundEffects: true,
        enableKeyboardShortcuts: true,
        typewriterSpeed: 60,
        autoAdvanceDelay: 2500
      });

      // Set up game integration
      if (this.options.enableGameIntegration) {
        this.setupGameIntegration();
      }

      // Load saved state
      if (this.options.persistConversationState) {
        this.loadConversationStates();
      }

      // Set up dialogue event handlers
      this.setupDialogueCallbacks();

      this.log('DialogueManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DialogueManager:', error);
    }
  }

  /**
   * Ensure dialogue container exists in the DOM
   */
  ensureDialogueContainer() {
    let container = document.querySelector(this.options.containerSelector);
    if (!container) {
      container = document.createElement('div');
      container.id = this.options.containerSelector.replace('#', '');
      container.className = 'dialogue-manager-container';
      document.body.appendChild(container);
    }
  }

  /**
   * Set up game integration hooks
   */
  setupGameIntegration() {
    // Expose dialogue methods to game instance
    if (this.game) {
      this.game.startDialogue = this.startConversation.bind(this);
      this.game.registerCharacter = this.registerCharacter.bind(this);
      this.game.registerConversation = this.registerConversation.bind(this);
      this.game.setDialogueFlag = this.setGlobalFlag.bind(this);
      this.game.getDialogueFlag = this.getGlobalFlag.bind(this);
      this.game.getNPCState = this.getNPCState.bind(this);
      this.game.setNPCState = this.setNPCState.bind(this);
    }

    // Listen for game events if event system exists
    if (this.game && typeof this.game.on === 'function') {
      this.game.on('dialogue:start', (data) => this.handleGameDialogueEvent(data));
      this.game.on('dialogue:registerNPC', (data) => this.registerNPCWithConversations(data));
    }
  }

  /**
   * Set up dialogue event callbacks
   */
  setupDialogueCallbacks() {
    this.dialogue.on('dialogueStart', (conversationId, context) => {
      this.onConversationStart(conversationId, context);
    });

    this.dialogue.on('dialogueEnd', (conversation) => {
      this.onConversationEnd(conversation);
    });

    this.dialogue.on('choiceSelected', (choiceIndex, choice, conversation) => {
      this.onChoiceSelected(choiceIndex, choice, conversation);
    });

    this.dialogue.on('characterSpeak', (character, dialogue) => {
      this.onCharacterSpeak(character, dialogue);
    });
  }

  /**
   * Register a character with the dialogue system
   * @param {string} characterId - Character identifier
   * @param {Object} characterData - Character configuration
   */
  registerCharacter(characterId, characterData) {
    const character = {
      name: characterData.name || characterId,
      avatar: characterData.avatar || null,
      textColor: characterData.textColor || '#2c3e50',
      nameColor: characterData.nameColor || '#34495e',
      typingSpeed: characterData.typingSpeed || 60,
      voice: characterData.voice || null,
      personality: characterData.personality || 'neutral',
      relationship: characterData.relationship || 0,
      ...characterData
    };

    this.dialogue.registerCharacter(characterId, character);

    // Initialize NPC state if not exists
    if (!this.npcStates.has(characterId)) {
      this.npcStates.set(characterId, {
        metBefore: false,
        relationship: character.relationship,
        lastConversation: null,
        conversationCount: 0,
        customFlags: new Map()
      });
    }

    this.log(`Registered character: ${characterId}`);
  }

  /**
   * Register a conversation template
   * @param {string} conversationId - Conversation identifier
   * @param {Array|Function} dialogueData - Dialogue data or generator function
   * @param {Object} metadata - Conversation metadata
   */
  registerConversation(conversationId, dialogueData, metadata = {}) {
    // If dialogue data is a function, it's a generator
    const isGenerator = typeof dialogueData === 'function';
    
    const conversationMeta = {
      id: conversationId,
      isGenerator,
      metadata: {
        repeatable: metadata.repeatable ?? true,
        category: metadata.category || 'general',
        requiredFlags: metadata.requiredFlags || [],
        requiredLevel: metadata.requiredLevel || 0,
        oneTimeOnly: metadata.oneTimeOnly || false,
        ...metadata
      },
      data: dialogueData,
      timesPlayed: 0,
      lastPlayed: null
    };

    // Store conversation metadata
    this.conversationStates.set(conversationId, conversationMeta);

    // Register with dialogue system
    if (!isGenerator) {
      // Process static dialogue data
      const processedData = this.processDialogueData(dialogueData, conversationId);
      this.dialogue.registerConversation(conversationId, processedData);
    }

    this.log(`Registered conversation: ${conversationId} (${isGenerator ? 'dynamic' : 'static'})`);
  }

  /**
   * Process dialogue data to add game integration hooks
   * @param {Array} dialogueData - Raw dialogue data
   * @param {string} conversationId - Conversation ID
   * @returns {Array} - Processed dialogue data
   */
  processDialogueData(dialogueData, conversationId) {
    return dialogueData.map((dialogue, index) => {
      const processed = { ...dialogue };

      // Add conversation context
      processed._conversationId = conversationId;
      processed._originalIndex = index;

      // Wrap existing callbacks to add game integration
      if (processed.onStart) {
        const originalOnStart = processed.onStart;
        processed.onStart = (dialogue, context) => {
          this.triggerGameEvent('dialogueStart', { dialogue, context, conversationId });
          return originalOnStart(dialogue, context);
        };
      }

      if (processed.onComplete) {
        const originalOnComplete = processed.onComplete;
        processed.onComplete = (dialogue, context) => {
          this.triggerGameEvent('dialogueComplete', { dialogue, context, conversationId });
          return originalOnComplete(dialogue, context);
        };
      }

      // Process choices for game integration
      if (processed.choices) {
        processed.choices = processed.choices.map(choice => ({
          ...choice,
          action: this.wrapChoiceAction(choice.action, conversationId, index)
        }));
      }

      return processed;
    });
  }

  /**
   * Wrap choice actions to add game integration
   * @param {Function} originalAction - Original choice action
   * @param {string} conversationId - Conversation ID
   * @param {number} dialogueIndex - Dialogue index
   * @returns {Function} - Wrapped action
   */
  wrapChoiceAction(originalAction, conversationId, dialogueIndex) {
    return (choice, context) => {
      // Execute original action first
      if (originalAction && typeof originalAction === 'function') {
        originalAction(choice, context);
      }

      // Execute game integration hooks
      this.executeChoiceGameEffects(choice, context, conversationId, dialogueIndex);
    };
  }

  /**
   * Start a conversation with enhanced game integration
   * @param {string} conversationId - Conversation to start
   * @param {Object} context - Additional context data
   * @param {string} npcId - NPC initiating conversation (optional)
   * @returns {boolean} - Success status
   */
  startConversation(conversationId, context = {}, npcId = null) {
    // Check if conversation exists
    const conversationMeta = this.conversationStates.get(conversationId);
    if (!conversationMeta) {
      this.log(`Conversation not found: ${conversationId}`, 'error');
      return false;
    }

    // Check conversation requirements
    if (!this.checkConversationRequirements(conversationId, npcId)) {
      this.log(`Conversation requirements not met: ${conversationId}`, 'warn');
      return false;
    }

    try {
      // Prepare conversation context
      const enhancedContext = this.prepareConversationContext(context, npcId, conversationId);

      // Generate dynamic dialogue if needed
      if (conversationMeta.isGenerator) {
        const generatedDialogue = conversationMeta.data(enhancedContext, this.getDialogueAPI());
        const processedDialogue = this.processDialogueData(generatedDialogue, conversationId);
        this.dialogue.registerConversation(conversationId, processedDialogue);
      }

      // Update NPC state
      if (npcId) {
        this.updateNPCState(npcId, conversationId);
      }

      // Start the conversation
      const success = this.dialogue.startConversation(conversationId, enhancedContext);

      if (success) {
        // Update conversation metadata
        conversationMeta.timesPlayed++;
        conversationMeta.lastPlayed = Date.now();

        // Add to history
        this.conversationHistory.push({
          conversationId,
          npcId,
          context: enhancedContext,
          startTime: Date.now(),
          completed: false
        });

        // Trigger game events
        this.triggerGameEvent('conversationStarted', {
          conversationId,
          npcId,
          context: enhancedContext
        });
      }

      return success;
    } catch (error) {
      this.log(`Failed to start conversation: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Check if conversation requirements are met
   * @param {string} conversationId - Conversation ID
   * @param {string} npcId - NPC ID (optional)
   * @returns {boolean} - Requirements met
   */
  checkConversationRequirements(conversationId, npcId) {
    const conversationMeta = this.conversationStates.get(conversationId);
    if (!conversationMeta) return false;

    const { metadata } = conversationMeta;

    // Check if one-time only and already played
    if (metadata.oneTimeOnly && conversationMeta.timesPlayed > 0) {
      return false;
    }

    // Check required flags
    if (metadata.requiredFlags && metadata.requiredFlags.length > 0) {
      const hasAllFlags = metadata.requiredFlags.every(flag => this.getGlobalFlag(flag));
      if (!hasAllFlags) return false;
    }

    // Check required level (if game has levels)
    if (metadata.requiredLevel > 0 && this.game && this.game.getPlayerLevel) {
      if (this.game.getPlayerLevel() < metadata.requiredLevel) {
        return false;
      }
    }

    // Check NPC-specific requirements
    if (npcId && metadata.npcRequirements) {
      const npcState = this.getNPCState(npcId);
      if (metadata.npcRequirements.minRelationship && 
          npcState.relationship < metadata.npcRequirements.minRelationship) {
        return false;
      }
    }

    return true;
  }

  /**
   * Prepare enhanced conversation context
   * @param {Object} baseContext - Base context
   * @param {string} npcId - NPC ID
   * @param {string} conversationId - Conversation ID
   * @returns {Object} - Enhanced context
   */
  prepareConversationContext(baseContext, npcId, conversationId) {
    const context = {
      ...baseContext,
      conversationId,
      npcId,
      gameFlags: Object.fromEntries(this.globalFlags),
      npcState: npcId ? this.getNPCState(npcId) : null,
      playerState: this.game ? this.getPlayerState() : {},
      conversationMeta: this.conversationStates.get(conversationId)
    };

    return context;
  }

  /**
   * Get API object for dynamic dialogue generation
   * @returns {Object} - Dialogue generation API
   */
  getDialogueAPI() {
    return {
      // Flag management
      getFlag: (flag) => this.getGlobalFlag(flag),
      setFlag: (flag, value) => this.setGlobalFlag(flag, value),
      
      // NPC state management
      getNPCState: (npcId) => this.getNPCState(npcId),
      setNPCState: (npcId, state) => this.setNPCState(npcId, state),
      
      // Game state access
      getPlayerState: () => this.getPlayerState(),
      
      // Utility functions
      random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
      choice: (array) => array[Math.floor(Math.random() * array.length)],
      
      // Dialogue building helpers
      createChoice: (text, action, next) => ({ text, action, next }),
      createDialogue: (character, text, options = {}) => ({
        character,
        text,
        ...options
      })
    };
  }

  /**
   * Event handlers for dialogue callbacks
   */
  onConversationStart(conversationId, context) {
    this.log(`Conversation started: ${conversationId}`);
    
    // Play conversation start sound
    if (window.audioManager) {
      window.audioManager.playSoundEffect('dialogue_start', 0.7);
    }

    // Pause game if needed
    if (this.game && this.game.pause) {
      this.game.pause();
    }

    // Save state
    if (this.options.enableAutoSave) {
      this.saveConversationStates();
    }
  }

  onConversationEnd(conversation) {
    this.log(`Conversation ended: ${conversation.id}`);

    // Mark as completed in history
    const historyEntry = this.conversationHistory.find(h => 
      h.conversationId === conversation.id && !h.completed
    );
    if (historyEntry) {
      historyEntry.completed = true;
      historyEntry.endTime = Date.now();
    }

    // Resume game if needed
    if (this.game && this.game.resume) {
      this.game.resume();
    }

    // Trigger game events
    this.triggerGameEvent('conversationEnded', {
      conversationId: conversation.id,
      context: conversation.context,
      duration: Date.now() - conversation.startTime
    });

    // Save state
    if (this.options.enableAutoSave) {
      this.saveConversationStates();
    }
  }

  onChoiceSelected(choiceIndex, choice, conversation) {
    this.log(`Choice selected: ${choice.text} (index: ${choiceIndex})`);

    // Play choice selection sound
    if (window.audioManager) {
      window.audioManager.playSoundEffect('ui_select', 0.5);
    }

    // Trigger game events
    this.triggerGameEvent('choiceSelected', {
      choice,
      choiceIndex,
      conversationId: conversation.id,
      context: conversation.context
    });
  }

  onCharacterSpeak(character, dialogue) {
    // Play character-specific voice or typing sound
    if (window.audioManager && character.voice) {
      window.audioManager.playSoundEffect(character.voice, 0.4);
    }
  }

  /**
   * Execute game effects from choice selection
   * @param {Object} choice - Selected choice
   * @param {Object} context - Conversation context
   * @param {string} conversationId - Conversation ID
   * @param {number} dialogueIndex - Dialogue index
   */
  executeChoiceGameEffects(choice, context, conversationId, dialogueIndex) {
    // Handle game state changes
    if (choice.gameEffects) {
      const effects = choice.gameEffects;

      // Set flags
      if (effects.setFlags) {
        Object.entries(effects.setFlags).forEach(([flag, value]) => {
          this.setGlobalFlag(flag, value);
        });
      }

      // Modify NPC relationship
      if (effects.relationship && context.npcId) {
        const change = effects.relationship;
        const npcState = this.getNPCState(context.npcId);
        npcState.relationship = Math.max(-100, Math.min(100, npcState.relationship + change));
        this.setNPCState(context.npcId, npcState);
      }

      // Give items to player
      if (effects.giveItems && this.game && this.game.giveItem) {
        effects.giveItems.forEach(item => {
          this.game.giveItem(item.id, item.quantity || 1);
        });
      }

      // Update quest progress
      if (effects.questUpdates && this.game && this.game.updateQuest) {
        effects.questUpdates.forEach(update => {
          this.game.updateQuest(update.questId, update.progress);
        });
      }

      // Modify player stats
      if (effects.statChanges && this.game && this.game.modifyPlayerStat) {
        Object.entries(effects.statChanges).forEach(([stat, change]) => {
          this.game.modifyPlayerStat(stat, change);
        });
      }
    }
  }

  /**
   * Global flag management
   */
  setGlobalFlag(flag, value) {
    this.globalFlags.set(flag, value);
    this.log(`Set global flag: ${flag} = ${value}`);
  }

  getGlobalFlag(flag, defaultValue = false) {
    return this.globalFlags.get(flag) ?? defaultValue;
  }

  /**
   * NPC state management
   */
  getNPCState(npcId) {
    if (!this.npcStates.has(npcId)) {
      this.npcStates.set(npcId, {
        metBefore: false,
        relationship: 0,
        lastConversation: null,
        conversationCount: 0,
        customFlags: new Map()
      });
    }
    return this.npcStates.get(npcId);
  }

  setNPCState(npcId, state) {
    this.npcStates.set(npcId, { ...this.getNPCState(npcId), ...state });
  }

  updateNPCState(npcId, conversationId) {
    const state = this.getNPCState(npcId);
    state.metBefore = true;
    state.lastConversation = conversationId;
    state.conversationCount++;
    this.setNPCState(npcId, state);
  }

  /**
   * Get player state from game
   * @returns {Object} - Player state
   */
  getPlayerState() {
    if (!this.game) return {};

    return {
      level: this.game.getPlayerLevel ? this.game.getPlayerLevel() : 1,
      stats: this.game.getPlayerStats ? this.game.getPlayerStats() : {},
      inventory: this.game.getPlayerInventory ? this.game.getPlayerInventory() : [],
      position: this.game.getPlayerPosition ? this.game.getPlayerPosition() : { x: 0, y: 0 }
    };
  }

  /**
   * Register NPC with conversations
   * @param {Object} npcData - NPC data with conversations
   */
  registerNPCWithConversations(npcData) {
    const { id, character, conversations } = npcData;

    // Register character
    this.registerCharacter(id, character);

    // Register all conversations for this NPC
    Object.entries(conversations).forEach(([conversationId, dialogueData]) => {
      this.registerConversation(`${id}_${conversationId}`, dialogueData);
    });

    this.log(`Registered NPC with conversations: ${id}`);
  }

  /**
   * Trigger game events
   * @param {string} eventName - Event name
   * @param {Object} eventData - Event data
   */
  triggerGameEvent(eventName, eventData) {
    if (this.game && typeof this.game.emit === 'function') {
      this.game.emit(`dialogue:${eventName}`, eventData);
    }

    // Execute game hooks
    const hookName = `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`;
    if (this.gameHooks[hookName]) {
      this.gameHooks[hookName](eventData);
    }
  }

  /**
   * State persistence
   */
  saveConversationStates() {
    try {
      const stateData = {
        conversationStates: Array.from(this.conversationStates.entries()),
        npcStates: Array.from(this.npcStates.entries()),
        globalFlags: Array.from(this.globalFlags.entries()),
        conversationHistory: this.conversationHistory.slice(-50), // Keep last 50
        timestamp: Date.now()
      };

      localStorage.setItem(this.options.storageKey, JSON.stringify(stateData));
      this.log('Conversation states saved');
    } catch (error) {
      this.log(`Failed to save conversation states: ${error.message}`, 'error');
    }
  }

  loadConversationStates() {
    try {
      const saved = localStorage.getItem(this.options.storageKey);
      if (!saved) return false;

      const stateData = JSON.parse(saved);

      // Restore conversation states (metadata only)
      if (stateData.conversationStates) {
        stateData.conversationStates.forEach(([id, meta]) => {
          // Only restore metadata, not dialogue data
          this.conversationStates.set(id, {
            ...meta,
            data: null // Will be set when registering conversation
          });
        });
      }

      // Restore NPC states
      if (stateData.npcStates) {
        this.npcStates = new Map(stateData.npcStates);
      }

      // Restore global flags
      if (stateData.globalFlags) {
        this.globalFlags = new Map(stateData.globalFlags);
      }

      // Restore conversation history
      if (stateData.conversationHistory) {
        this.conversationHistory = stateData.conversationHistory;
      }

      this.log('Conversation states loaded');
      return true;
    } catch (error) {
      this.log(`Failed to load conversation states: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Handle game dialogue events
   * @param {Object} data - Event data
   */
  handleGameDialogueEvent(data) {
    const { action, conversationId, npcId, context } = data;

    switch (action) {
      case 'start':
        this.startConversation(conversationId, context, npcId);
        break;
      case 'register':
        if (data.character) this.registerCharacter(data.characterId, data.character);
        if (data.conversations) {
          Object.entries(data.conversations).forEach(([id, dialogue]) => {
            this.registerConversation(id, dialogue, data.metadata);
          });
        }
        break;
      default:
        this.log(`Unknown dialogue event action: ${action}`, 'warn');
    }
  }

  /**
   * Get conversation statistics
   * @returns {Object} - Statistics
   */
  getStats() {
    return {
      totalConversations: this.conversationStates.size,
      totalCharacters: this.dialogue ? this.dialogue.characters.size : 0,
      totalNPCs: this.npcStates.size,
      globalFlags: this.globalFlags.size,
      conversationHistory: this.conversationHistory.length,
      activeConversation: this.dialogue ? this.dialogue.isPlaying : false,
      completedConversations: this.conversationHistory.filter(h => h.completed).length
    };
  }

  /**
   * Set game hook callback
   * @param {string} hookName - Hook name
   * @param {Function} callback - Callback function
   */
  setGameHook(hookName, callback) {
    if (this.gameHooks.hasOwnProperty(hookName)) {
      this.gameHooks[hookName] = callback;
    }
  }

  /**
   * Debug logging
   * @param {string} message - Log message
   * @param {string} level - Log level
   */
  log(message, level = 'info') {
    if (this.options.enableDebugLogs) {
      const logMethod = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn : console.log;
      logMethod(`[DialogueManager] ${message}`);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.dialogue) {
      this.dialogue.destroy();
      this.dialogue = null;
    }

    // Save state before destroying
    if (this.options.enableAutoSave) {
      this.saveConversationStates();
    }

    // Clear game integration
    if (this.game) {
      delete this.game.startDialogue;
      delete this.game.registerCharacter;
      delete this.game.registerConversation;
      delete this.game.setDialogueFlag;
      delete this.game.getDialogueFlag;
      delete this.game.getNPCState;
      delete this.game.setNPCState;
    }

    // Clear state
    this.conversationStates.clear();
    this.npcStates.clear();
    this.globalFlags.clear();
    this.conversationHistory = [];

    this.log('DialogueManager destroyed');
  }
}