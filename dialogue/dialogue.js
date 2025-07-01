/**
 * Dialogue - Universal Dialogue/Conversation System Core Class
 * Handles conversations, character dialogue, choices, and narrative flow
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class Dialogue {
  constructor(containerSelector, options = {}) {
    this.containerSelector = containerSelector;
    this.container = document.querySelector(containerSelector);

    if (!this.container) {
      throw new Error(`Dialogue container not found: ${containerSelector}`);
    }

    // Configuration options with defaults
    this.options = {
      typewriterSpeed: 50, // Characters per second
      autoAdvanceDelay: 3000, // Auto-advance delay in ms
      enableAutoAdvance: false, // Auto-advance conversations
      enableTypewriter: true, // Typewriter text effect
      showCharacterImages: true, // Display character avatars
      enableSoundEffects: true, // Play typing/advance sounds
      enableKeyboardShortcuts: true, // Space/Enter to advance
      maxChoiceTime: 0, // Time limit for choices (0 = no limit)
      enableChoiceShuffling: false, // Randomize choice order
      ...options,
    };

    // Internal state
    this.conversations = new Map();
    this.currentConversation = null;
    this.currentDialogueIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.isTyping = false;
    this.typewriterTimeout = null;
    this.autoAdvanceTimeout = null;
    this.choiceTimeout = null;
    this.isInitialized = false;

    // Character registry
    this.characters = new Map();

    // Event callbacks
    this.callbacks = {
      onDialogueStart: null,
      onDialogueEnd: null,
      onDialogueAdvance: null,
      onChoiceSelected: null,
      onCharacterSpeak: null,
    };

    // Initialize the system
    this.init();
  }

  /**
   * Initialize the dialogue system
   */
  init() {
    try {
      this.createDialogueInterface();
      this.setupEventListeners();
      this.isInitialized = true;
      this.log("Dialogue system initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Dialogue system:", error);
    }
  }

  /**
   * Register a character with avatar and settings
   * @param {string} characterId - Character identifier
   * @param {Object} character - Character configuration
   */
  registerCharacter(characterId, character) {
    const characterConfig = {
      name: character.name || characterId,
      avatar: character.avatar || null,
      textColor: "#000000",
      nameColor: character.nameColor || "#2c3e50",
      typingSpeed: character.typingSpeed || this.options.typewriterSpeed,
      voice: character.voice || null, // Audio file for typing sound
      ...character,
    };

    this.characters.set(characterId, characterConfig);
    this.log(`Registered character: ${characterId} (${characterConfig.name})`);
  }

  /**
   * Register a conversation with dialogue data
   * @param {string} conversationId - Conversation identifier
   * @param {Array} dialogueData - Array of dialogue objects
   */
  registerConversation(conversationId, dialogueData) {
    if (!Array.isArray(dialogueData)) {
      throw new Error("Dialogue data must be an array");
    }

    // Validate dialogue data structure
    const validatedData = dialogueData.map((dialogue, index) => {
      return this.validateDialogueObject(dialogue, index);
    });

    this.conversations.set(conversationId, validatedData);
    this.log(
      `Registered conversation: ${conversationId} (${validatedData.length} dialogue entries)`
    );
  }

  /**
   * Validate and normalize dialogue object
   * @param {Object} dialogue - Dialogue object to validate
   * @param {number} index - Index in conversation
   * @returns {Object} - Validated dialogue object
   */
  validateDialogueObject(dialogue, index) {
    if (!dialogue || typeof dialogue !== "object") {
      throw new Error(`Invalid dialogue object at index ${index}`);
    }

    return {
      // Required fields
      character: dialogue.character || "narrator",
      text: dialogue.text || "",

      // Optional fields with defaults
      avatar: dialogue.avatar || null,
      choices: dialogue.choices || null,
      action: dialogue.action || null,
      condition: dialogue.condition || null,
      effects: dialogue.effects || null,

      // Display options
      autoAdvance: dialogue.autoAdvance ?? null,
      typewriterSpeed: dialogue.typewriterSpeed || null,
      showContinueButton: dialogue.showContinueButton ?? true,

      // Metadata
      id: dialogue.id || `dialogue_${index}`,
      tags: dialogue.tags || [],

      // Callbacks
      onStart: dialogue.onStart || null,
      onComplete: dialogue.onComplete || null,

      // Validated index
      _index: index,
    };
  }

  /**
   * Start a conversation
   * @param {string} conversationId - Conversation to start
   * @param {Object} context - Context data for the conversation
   * @returns {boolean} - Success status
   */
  startConversation(conversationId, context = {}) {
    if (!this.conversations.has(conversationId)) {
      this.log(`Conversation not found: ${conversationId}`, "error");
      return false;
    }

    if (this.isPlaying) {
      this.log(
        "Cannot start conversation - another is already playing",
        "warn"
      );
      return false;
    }

    try {
      this.currentConversation = {
        id: conversationId,
        data: this.conversations.get(conversationId),
        context: context,
        startTime: Date.now(),
        history: [],
      };

      this.currentDialogueIndex = 0;
      this.isPlaying = true;
      this.isPaused = false;

      // Show dialogue interface
      this.showDialogueInterface();

      // Fire start callback
      if (this.callbacks.onDialogueStart) {
        this.callbacks.onDialogueStart(conversationId, context);
      }

      // Start first dialogue
      this.displayCurrentDialogue();

      this.log(`Started conversation: ${conversationId}`);
      return true;
    } catch (error) {
      this.log(`Failed to start conversation: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * Display the current dialogue entry
   */
  async displayCurrentDialogue() {
    if (!this.currentConversation || !this.isPlaying) {
      return;
    }

    const dialogue = this.getCurrentDialogue();
    if (!dialogue) {
      return this.endConversation();
    }

    try {
      // Clear previous content
      this.clearDialogueDisplay();

      // Check condition if present
      if (dialogue.condition && !this.evaluateCondition(dialogue.condition)) {
        return this.advanceDialogue();
      }

      // Fire dialogue start callback
      if (dialogue.onStart) {
        dialogue.onStart(dialogue, this.currentConversation.context);
      }

      // Get character data
      const character = this.characters.get(dialogue.character) || {
        name: dialogue.character,
        avatar: null,
      };

      // Fire character speak callback
      if (this.callbacks.onCharacterSpeak) {
        this.callbacks.onCharacterSpeak(character, dialogue);
      }

      // Update character display
      this.updateCharacterDisplay(character, dialogue);

      // Display dialogue text
      await this.displayDialogueText(dialogue, character);

      // Handle dialogue completion
      this.onDialogueDisplayComplete(dialogue);
    } catch (error) {
      this.log(`Error displaying dialogue: ${error.message}`, "error");
      this.advanceDialogue(); // Skip on error
    }
  }

  /**
   * Update character display (name and avatar)
   * @param {Object} character - Character data
   * @param {Object} dialogue - Current dialogue
   */
  updateCharacterDisplay(character, dialogue) {
    const nameElement = this.container.querySelector(
      ".dialogue-character-name"
    );
    const avatarElement = this.container.querySelector(
      ".dialogue-character-avatar"
    );

    // Update character name
    if (nameElement) {
      nameElement.textContent = character.name;
      nameElement.style.color = character.nameColor || "#2c3e50";
    }

    // Update character avatar
    if (avatarElement && this.options.showCharacterImages) {
      const avatarSrc = dialogue.avatar || character.avatar;
      if (avatarSrc) {
        avatarElement.src = avatarSrc;
        avatarElement.style.display = "block";
        avatarElement.alt = `${character.name} avatar`;
      } else {
        avatarElement.style.display = "none";
      }
    }
  }

  /**
   * Display dialogue text with optional typewriter effect
   * @param {Object} dialogue - Dialogue object
   * @param {Object} character - Character data
   * @returns {Promise} - Resolves when text display is complete
   */
  displayDialogueText(dialogue, character) {
    return new Promise((resolve) => {
      const textElement = this.container.querySelector(".dialogue-text");
      if (!textElement) {
        return resolve();
      }

      const text = dialogue.text;
      const useTypewriter =
        this.options.enableTypewriter && dialogue.typewriterSpeed !== 0;

      if (useTypewriter) {
        this.displayTextWithTypewriter(textElement, text, character, resolve);
      } else {
        textElement.textContent = text;
        textElement.style.color = character.textColor || "#000000";
        resolve();
      }
    });
  }

  /**
   * Display text with typewriter effect
   * @param {HTMLElement} element - Text element
   * @param {string} text - Text to display
   * @param {Object} character - Character data
   * @param {Function} callback - Completion callback
   */
  displayTextWithTypewriter(element, text, character, callback) {
    element.textContent = "";
    element.style.color = character.textColor || "#333333";

    const speed = character.typingSpeed || this.options.typewriterSpeed;
    const delay = 1000 / speed; // Convert to milliseconds per character

    let currentIndex = 0;
    this.isTyping = true;

    const typeNextCharacter = () => {
      if (!this.isTyping || currentIndex >= text.length) {
        this.isTyping = false;
        if (callback) callback();
        return;
      }

      // Add next character
      element.textContent = text.substring(0, currentIndex + 1);
      currentIndex++;

      // Play typing sound if enabled
      if (this.options.enableSoundEffects && character.voice) {
        this.playTypingSound(character.voice);
      }

      // Schedule next character
      this.typewriterTimeout = setTimeout(typeNextCharacter, delay);
    };

    typeNextCharacter();
  }

  /**
   * Handle dialogue display completion
   * @param {Object} dialogue - Current dialogue
   */
  onDialogueDisplayComplete(dialogue) {
    // Fire dialogue complete callback
    if (dialogue.onComplete) {
      dialogue.onComplete(dialogue, this.currentConversation.context);
    }

    // Apply effects if present
    if (dialogue.effects) {
      this.applyDialogueEffects(dialogue.effects);
    }

    // Handle choices or continue
    if (dialogue.choices && dialogue.choices.length > 0) {
      this.displayChoices(dialogue.choices);
    } else {
      this.setupContinueAction(dialogue);
    }

    // Add to conversation history
    this.currentConversation.history.push({
      dialogue: dialogue,
      timestamp: Date.now(),
      index: this.currentDialogueIndex,
    });
  }

  /**
   * Display choices for the current dialogue
   * @param {Array} choices - Array of choice objects
   */
  displayChoices(choices) {
    const choicesContainer = this.container.querySelector(".dialogue-choices");
    if (!choicesContainer) {
      return;
    }

    // Clear previous choices
    choicesContainer.innerHTML = "";

    // Shuffle choices if enabled
    const displayChoices = this.options.enableChoiceShuffling
      ? this.shuffleArray([...choices])
      : choices;

    // Create choice buttons
    displayChoices.forEach((choice, index) => {
      const choiceButton = document.createElement("button");
      choiceButton.className = "dialogue-choice-button";
      choiceButton.textContent = choice.text;
      choiceButton.setAttribute("data-choice-index", choices.indexOf(choice));

      // Add choice metadata
      if (choice.disabled) {
        choiceButton.disabled = true;
        choiceButton.classList.add("disabled");
      }

      if (choice.highlighted) {
        choiceButton.classList.add("highlighted");
      }

      // Choice click handler
      choiceButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectChoice(choices.indexOf(choice), choice);
      });

      choicesContainer.appendChild(choiceButton);
    });

    // Show choices container
    choicesContainer.style.display = "block";

    // Setup choice timeout if enabled
    if (this.options.maxChoiceTime > 0) {
      this.setupChoiceTimeout(choices);
    }

    // Hide continue button during choices
    this.setContinueButtonVisibility(false);
  }

  /**
   * Handle choice selection
   * @param {number} choiceIndex - Index of selected choice
   * @param {Object} choice - Choice object
   */
  selectChoice(choiceIndex, choice) {
    // Clear choice timeout
    if (this.choiceTimeout) {
      clearTimeout(this.choiceTimeout);
      this.choiceTimeout = null;
    }

    // Hide choices
    const choicesContainer = this.container.querySelector(".dialogue-choices");
    if (choicesContainer) {
      choicesContainer.style.display = "none";
      choicesContainer.innerHTML = "";
    }

    // Fire choice callback
    if (this.callbacks.onChoiceSelected) {
      this.callbacks.onChoiceSelected(
        choiceIndex,
        choice,
        this.currentConversation
      );
    }

    // Execute choice action
    if (choice.action) {
      this.executeAction(choice.action, choice);
    }

    // Handle next dialogue
    if (choice.next !== undefined) {
      if (typeof choice.next === "number") {
        this.currentDialogueIndex = choice.next;
        this.displayCurrentDialogue();
      } else if (choice.next === "end") {
        this.endConversation();
      } else if (typeof choice.next === "string") {
        // Start new conversation
        this.endConversation();
        setTimeout(() => this.startConversation(choice.next), 100);
      }
    } else {
      this.advanceDialogue();
    }
  }

  /**
   * Setup continue action for non-choice dialogues
   * @param {Object} dialogue - Current dialogue
   */
  setupContinueAction(dialogue) {
    // Show continue button if enabled
    if (dialogue.showContinueButton !== false) {
      this.setContinueButtonVisibility(true);
    }

    // Setup auto-advance if enabled
    const autoAdvance = dialogue.autoAdvance ?? this.options.enableAutoAdvance;
    if (autoAdvance) {
      const delay =
        typeof autoAdvance === "number"
          ? autoAdvance
          : this.options.autoAdvanceDelay;
      this.autoAdvanceTimeout = setTimeout(() => {
        this.advanceDialogue();
      }, delay);
    }
  }

  /**
   * Advance to the next dialogue
   */
  advanceDialogue() {
    if (!this.isPlaying) {
      return;
    }

    // Clear any active timeouts
    this.clearTimeouts();

    // Fire advance callback
    if (this.callbacks.onDialogueAdvance) {
      this.callbacks.onDialogueAdvance(
        this.currentDialogueIndex,
        this.getCurrentDialogue()
      );
    }

    // Skip typewriter if currently typing
    if (this.isTyping) {
      this.skipTypewriter();
      return;
    }

    // Advance to next dialogue
    this.currentDialogueIndex++;
    this.displayCurrentDialogue();
  }

  /**
   * Skip typewriter effect and show full text immediately
   */
  skipTypewriter() {
    if (!this.isTyping) {
      return;
    }

    this.isTyping = false;

    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
      this.typewriterTimeout = null;
    }

    // Show full text immediately
    const dialogue = this.getCurrentDialogue();
    const textElement = this.container.querySelector(".dialogue-text");
    if (dialogue && textElement) {
      textElement.textContent = dialogue.text;
    }

    // Handle completion
    this.onDialogueDisplayComplete(dialogue);
  }

  /**
   * End the current conversation
   */
  endConversation() {
    if (!this.isPlaying) {
      return;
    }

    this.clearTimeouts();
    this.isPlaying = false;
    this.isPaused = false;
    this.isTyping = false;

    // Hide dialogue interface
    this.hideDialogueInterface();

    // Fire end callback
    if (this.callbacks.onDialogueEnd) {
      this.callbacks.onDialogueEnd(this.currentConversation);
    }

    this.log(`Ended conversation: ${this.currentConversation.id}`);
    this.currentConversation = null;
    this.currentDialogueIndex = 0;
  }

  /**
   * Get the current dialogue object
   * @returns {Object|null} - Current dialogue or null
   */
  getCurrentDialogue() {
    if (!this.currentConversation) {
      return null;
    }

    const data = this.currentConversation.data;
    if (this.currentDialogueIndex >= data.length) {
      return null;
    }

    return data[this.currentDialogueIndex];
  }

  /**
   * Create the dialogue interface HTML structure
   */
  createDialogueInterface() {
    this.container.innerHTML = `
      <div class="dialogue-panel" style="display: none;">
        <div class="dialogue-content">
          <div class="dialogue-character">
            <img class="dialogue-character-avatar" alt="Character avatar" style="display: none;">
            <div class="dialogue-character-name"></div>
          </div>
          
          <div class="dialogue-text-container">
            <div class="dialogue-text"></div>
          </div>
          
          <div class="dialogue-choices" style="display: none;"></div>
          
          <div class="dialogue-controls">
            <button class="dialogue-continue-button" style="display: none;">Continue</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for dialogue interaction
   */
  setupEventListeners() {
    // Continue button
    const continueButton = this.container.querySelector(
      ".dialogue-continue-button"
    );
    if (continueButton) {
      continueButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.advanceDialogue();
      });
    }

    // Keyboard shortcuts
    if (this.options.enableKeyboardShortcuts) {
      document.addEventListener("keydown", (e) => {
        if (!this.isPlaying) return;

        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          this.advanceDialogue();
        } else if (e.key === "Escape") {
          e.preventDefault();
          this.endConversation();
        }
      });
    }

    // Click to advance
    this.container.addEventListener("click", (e) => {
      if (!this.isPlaying) return;

      // Only advance if not clicking on a choice button
      if (!e.target.classList.contains("dialogue-choice-button")) {
        this.advanceDialogue();
      }
    });
  }

  /**
   * Show the dialogue interface
   */
  showDialogueInterface() {
    const panel = this.container.querySelector(".dialogue-panel");
    if (panel) {
      panel.style.display = "block";
      panel.classList.add("dialogue-visible");
    }
  }

  /**
   * Hide the dialogue interface
   */
  hideDialogueInterface() {
    const panel = this.container.querySelector(".dialogue-panel");
    if (panel) {
      panel.classList.remove("dialogue-visible");
      setTimeout(() => {
        panel.style.display = "none";
      }, 300); // Allow for CSS transition
    }
  }

  /**
   * Clear the dialogue display
   */
  clearDialogueDisplay() {
    const textElement = this.container.querySelector(".dialogue-text");
    const choicesContainer = this.container.querySelector(".dialogue-choices");

    if (textElement) {
      textElement.textContent = "";
    }

    if (choicesContainer) {
      choicesContainer.style.display = "none";
      choicesContainer.innerHTML = "";
    }

    this.setContinueButtonVisibility(false);
  }

  /**
   * Set continue button visibility
   * @param {boolean} visible - Whether button should be visible
   */
  setContinueButtonVisibility(visible) {
    const continueButton = this.container.querySelector(
      ".dialogue-continue-button"
    );
    if (continueButton) {
      continueButton.style.display = visible ? "block" : "none";
    }
  }

  /**
   * Clear all active timeouts
   */
  clearTimeouts() {
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
      this.typewriterTimeout = null;
    }

    if (this.autoAdvanceTimeout) {
      clearTimeout(this.autoAdvanceTimeout);
      this.autoAdvanceTimeout = null;
    }

    if (this.choiceTimeout) {
      clearTimeout(this.choiceTimeout);
      this.choiceTimeout = null;
    }
  }

  /**
   * Utility functions
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  evaluateCondition(condition) {
    // Simple condition evaluation - can be extended
    if (typeof condition === "function") {
      return condition(this.currentConversation.context);
    }
    return true;
  }

  executeAction(action, choice) {
    if (typeof action === "function") {
      action(choice, this.currentConversation.context);
    }
  }

  applyDialogueEffects(effects) {
    if (typeof effects === "function") {
      effects(this.currentConversation.context);
    }
  }

  setupChoiceTimeout(choices) {
    this.choiceTimeout = setTimeout(() => {
      // Auto-select first choice on timeout
      const defaultChoice = choices.find((c) => c.default) || choices[0];
      const defaultIndex = choices.indexOf(defaultChoice);
      this.selectChoice(defaultIndex, defaultChoice);
    }, this.options.maxChoiceTime);
  }

  playTypingSound(soundFile) {
    // Integration point for audio system
    if (window.audioManager && this.options.enableSoundEffects) {
      window.audioManager.playSoundEffect("typing", 0.3);
    }
  }

  /**
   * Set event callbacks
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  on(eventName, callback) {
    if (
      this.callbacks.hasOwnProperty(
        `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`
      )
    ) {
      this.callbacks[
        `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`
      ] = callback;
    }
  }

  /**
   * Debug logging
   * @param {string} message - Log message
   * @param {string} level - Log level
   */
  log(message, level = "info") {
    if (this.options.enableDebugLogs) {
      const logMethod =
        level === "error"
          ? console.error
          : level === "warn"
          ? console.warn
          : console.log;
      logMethod(`[Dialogue] ${message}`);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clearTimeouts();
    this.isPlaying = false;
    this.conversations.clear();
    this.characters.clear();

    if (this.container) {
      this.container.innerHTML = "";
    }

    this.log("Dialogue system destroyed");
  }
}
