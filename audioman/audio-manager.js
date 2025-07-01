/**
 * AudioManager - Core Audio Management System
 * Handles background music, sound effects, volume controls, and settings persistence
 * Built for the Vanilla JavaScript Game Development Toolkit
 */
class AudioManager {
  constructor(options = {}) {
    // Configuration options with defaults
    this.options = {
      enableDebugLogs: false,
      autoPreload: true,
      fadeTransitionDuration: 2000,
      backgroundVolume: 0.3,
      sfxVolume: 0.7,
      masterVolume: 1.0,
      maxRetryAttempts: 3,
      loadTimeout: 10000,
      storageKey: "audio-manager-settings",
      ...options,
    };

    // Audio collections
    this.backgroundMusic = new Map();
    this.soundEffects = new Map();
    this.loadedAssets = new Set();
    this.failedAssets = new Set();
    this.retryAttempts = new Map();

    // Playback state
    this.currentBackgroundTrack = null;
    this.currentTrackKey = null;
    this.fadeInterval = null;
    this.isInitialized = false;

    // Volume and control settings
    this.masterVolume = this.options.masterVolume;
    this.backgroundVolume = this.options.backgroundVolume;
    this.sfxVolume = this.options.sfxVolume;
    this.isMuted = false;
    this.isBackgroundMusicEnabled = true;
    this.isSfxEnabled = true;

    // Audio file definitions - can be overridden
    this.audioFiles = {
      backgroundMusic: {
        level1: "level1_background.mp3",
        menu: "menu_background.mp3",
        victory: "victory.mp3",
        defeat: "defeat.mp3",
      },
      soundEffects: {
        click: "click.mp3",
        hover: "audio/effects/ui_hover.mp3",
        achievement: "audio/effects/achievement.mp3",
        error: "audio/effects/error.mp3",
        success: "audio/effects/success.mp3",
        notification: "audio/effects/notification.mp3",
        select: "audio/effects/select.mp3",
        confirm: "audio/effects/confirm.mp3",
      },
    };

    // Initialize the system
    this.init();
  }

  /**
   * Initialize the audio management system
   */
  async init() {
    try {
      this.log("Initializing AudioManager...");

      // Setup audio context for better control
      this.setupAudioContext();

      // Load saved settings
      this.loadSettings();

      // Auto-preload if enabled
      if (this.options.autoPreload) {
        await this.preloadAllAudio();
      }

      this.isInitialized = true;
      this.log("AudioManager initialized successfully");

      return true;
    } catch (error) {
      console.error("Failed to initialize AudioManager:", error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Setup audio context for enhanced audio control
   */
  setupAudioContext() {
    try {
      // Create audio context if supported
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Create master gain node for global volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.masterVolume;

      this.log("Audio context created successfully");
    } catch (error) {
      this.log(
        "Audio context not supported, using basic audio controls",
        "warn"
      );
      this.audioContext = null;
      this.gainNode = null;
    }
  }

  /**
   * Set custom audio file definitions
   * @param {Object} audioFiles - Audio file definitions
   */
  setAudioFiles(audioFiles) {
    this.audioFiles = {
      backgroundMusic: {
        ...this.audioFiles.backgroundMusic,
        ...(audioFiles.backgroundMusic || {}),
      },
      soundEffects: {
        ...this.audioFiles.soundEffects,
        ...(audioFiles.soundEffects || {}),
      },
    };
    this.log("Audio files configuration updated");
  }

  /**
   * Preload all audio assets
   * @returns {Promise<Object>} - Loading results summary
   */
  async preloadAllAudio() {
    this.log("Starting audio asset preload...");

    const startTime = Date.now();
    const promises = [];

    // Load background music
    Object.entries(this.audioFiles.backgroundMusic).forEach(([key, path]) => {
      promises.push(this.loadBackgroundMusic(key, path));
    });

    // Load sound effects
    Object.entries(this.audioFiles.soundEffects).forEach(([key, path]) => {
      promises.push(this.loadSoundEffect(key, path));
    });

    try {
      const results = await Promise.allSettled(promises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      const loadTime = Date.now() - startTime;

      const summary = {
        successful,
        failed,
        total: results.length,
        loadTime,
        loadedAssets: this.loadedAssets.size,
        failedAssets: this.failedAssets.size,
      };

      this.log(
        `Audio preload complete: ${successful}/${results.length} successful in ${loadTime}ms`
      );
      return summary;
    } catch (error) {
      this.log("Error during audio preload:", "error");
      throw error;
    }
  }

  /**
   * Load background music track
   * @param {string} key - Track identifier
   * @param {string} path - Audio file path
   * @returns {Promise<HTMLAudioElement>} - Loaded audio element
   */
  async loadBackgroundMusic(key, path) {
    return this.loadAudioAsset(key, path, "backgroundMusic", {
      loop: true,
      volume: this.backgroundVolume * this.masterVolume,
    });
  }

  /**
   * Load sound effect
   * @param {string} key - Effect identifier
   * @param {string} path - Audio file path
   * @returns {Promise<HTMLAudioElement>} - Loaded audio element
   */
  async loadSoundEffect(key, path) {
    return this.loadAudioAsset(key, path, "soundEffects", {
      loop: false,
      volume: this.sfxVolume * this.masterVolume,
    });
  }

  /**
   * Generic audio asset loader with retry logic
   * @param {string} key - Asset identifier
   * @param {string} path - Audio file path
   * @param {string} type - Asset type ('backgroundMusic' or 'soundEffects')
   * @param {Object} options - Audio element options
   * @returns {Promise<HTMLAudioElement>} - Loaded audio element
   */
  async loadAudioAsset(key, path, type, options = {}) {
    const retryKey = `${type}-${key}`;
    const currentAttempt = (this.retryAttempts.get(retryKey) || 0) + 1;

    try {
      const audio = new Audio(path);

      // Apply options
      Object.entries(options).forEach(([prop, value]) => {
        if (prop in audio) {
          audio[prop] = value;
        }
      });

      audio.preload = "auto";

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.log(`Load timeout for ${type} ${key}: ${path}`, "warn");
          reject(new Error(`Load timeout: ${path}`));
        }, this.options.loadTimeout);

        const cleanup = () => {
          clearTimeout(timeout);
          audio.removeEventListener("canplaythrough", onLoad);
          audio.removeEventListener("error", onError);
        };

        const onLoad = () => {
          cleanup();
          this.log(`Loaded ${type} ${key} successfully`);

          // Store in appropriate collection
          if (type === "backgroundMusic") {
            this.backgroundMusic.set(key, audio);
          } else {
            this.soundEffects.set(key, audio);
          }

          this.loadedAssets.add(path);
          this.retryAttempts.delete(retryKey);
          resolve(audio);
        };

        const onError = (error) => {
          cleanup();
          this.log(`Failed to load ${type} ${key}: ${path}`, "error");

          // Retry logic
          if (currentAttempt < this.options.maxRetryAttempts) {
            this.retryAttempts.set(retryKey, currentAttempt);
            this.log(
              `Retrying ${type} ${key} (attempt ${currentAttempt + 1}/${
                this.options.maxRetryAttempts
              })`
            );

            setTimeout(() => {
              this.loadAudioAsset(key, path, type, options)
                .then(resolve)
                .catch(reject);
            }, 1000 * currentAttempt); // Exponential backoff
          } else {
            this.failedAssets.add(path);
            this.retryAttempts.delete(retryKey);
            reject(error);
          }
        };

        audio.addEventListener("canplaythrough", onLoad);
        audio.addEventListener("error", onError);
        audio.load();
      });
    } catch (error) {
      this.log(`Error loading ${type} ${key}:`, "error");
      this.failedAssets.add(path);
      throw error;
    }
  }

  /**
   * Play background music with optional fade transition
   * @param {string} trackKey - Track identifier
   * @param {boolean} fadeIn - Whether to fade in the track
   * @param {boolean} stopCurrent - Whether to stop current track
   * @returns {boolean} - Success status
   */
  playBackgroundMusic(trackKey, fadeIn = true, stopCurrent = true) {
    if (!this.isBackgroundMusicEnabled || this.isMuted) {
      this.log(`Background music disabled or muted for track: ${trackKey}`);
      return false;
    }

    const track = this.backgroundMusic.get(trackKey);
    if (!track) {
      this.log(`Background music track not found: ${trackKey}`, "warn");
      return false;
    }

    // Don't restart if same track is already playing
    if (this.currentTrackKey === trackKey && !track.paused) {
      this.log(`Background music already playing: ${trackKey}`);
      return true;
    }

    try {
      // Stop current track if requested
      if (stopCurrent && this.currentBackgroundTrack) {
        this.stopBackgroundMusic(true);
      }

      this.currentBackgroundTrack = track;
      this.currentTrackKey = trackKey;

      // Set up track for playback
      track.currentTime = 0;

      if (fadeIn) {
        track.volume = 0;
        track
          .play()
          .then(() => {
            this.fadeAudioIn(
              track,
              this.backgroundVolume * this.masterVolume,
              this.options.fadeTransitionDuration
            );
          })
          .catch((error) => {
            this.log(`Failed to play background music ${trackKey}:`, "error");
            this.handlePlaybackError(error);
          });
      } else {
        track.volume = this.backgroundVolume * this.masterVolume;
        track.play().catch((error) => {
          this.log(`Failed to play background music ${trackKey}:`, "error");
          this.handlePlaybackError(error);
        });
      }

      this.log(`Playing background music: ${trackKey}`);
      return true;
    } catch (error) {
      this.log(`Error playing background music ${trackKey}:`, "error");
      return false;
    }
  }

  /**
   * Stop background music with optional fade out
   * @param {boolean} fadeOut - Whether to fade out the track
   * @returns {boolean} - Success status
   */
  stopBackgroundMusic(fadeOut = true) {
    if (!this.currentBackgroundTrack) {
      return true;
    }

    try {
      if (fadeOut) {
        this.fadeAudioOut(this.currentBackgroundTrack, 1000, () => {
          if (this.currentBackgroundTrack) {
            this.currentBackgroundTrack.pause();
            this.currentBackgroundTrack.currentTime = 0;
            this.currentBackgroundTrack = null;
            this.currentTrackKey = null;
          }
        });
      } else {
        this.currentBackgroundTrack.pause();
        this.currentBackgroundTrack.currentTime = 0;
        this.currentBackgroundTrack = null;
        this.currentTrackKey = null;
      }

      this.log("Background music stopped");
      return true;
    } catch (error) {
      this.log("Error stopping background music:", "error");
      return false;
    }
  }

  /**
   * Play sound effect with volume control
   * @param {string} effectKey - Effect identifier
   * @param {number} volume - Volume multiplier (0-1)
   * @param {number} playbackRate - Playback speed (default: 1.0)
   * @returns {boolean} - Success status
   */
  playSoundEffect(effectKey, volume = 1.0, playbackRate = 1.0) {
    if (!this.isSfxEnabled || this.isMuted) {
      return false;
    }

    const effect = this.soundEffects.get(effectKey);
    if (!effect) {
      this.log(`Sound effect not found: ${effectKey}`, "warn");
      return false;
    }

    try {
      // Create a clone for overlapping sounds
      const effectClone = effect.cloneNode();
      effectClone.volume = Math.min(
        1.0,
        this.sfxVolume * volume * this.masterVolume
      );
      effectClone.playbackRate = Math.max(0.25, Math.min(4.0, playbackRate)); // Clamp playback rate
      effectClone.currentTime = 0;

      effectClone.play().catch((error) => {
        this.log(`Failed to play sound effect ${effectKey}:`, "error");
        this.handlePlaybackError(error);
      });

      // Clean up clone after playback
      effectClone.addEventListener("ended", () => {
        effectClone.remove();
      });

      this.log(
        `Playing sound effect: ${effectKey} (volume: ${effectClone.volume.toFixed(
          2
        )})`
      );
      return true;
    } catch (error) {
      this.log(`Error playing sound effect ${effectKey}:`, "error");
      return false;
    }
  }

  /**
   * Fade audio in to target volume
   * @param {HTMLAudioElement} audio - Audio element
   * @param {number} targetVolume - Target volume (0-1)
   * @param {number} duration - Fade duration in milliseconds
   */
  fadeAudioIn(audio, targetVolume, duration) {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const startVolume = 0;
    const volumeStep = targetVolume / (duration / 50);
    let currentVolume = startVolume;

    audio.volume = startVolume;

    this.fadeInterval = setInterval(() => {
      currentVolume += volumeStep;
      if (currentVolume >= targetVolume) {
        currentVolume = targetVolume;
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
      audio.volume = Math.min(1.0, currentVolume);
    }, 50);
  }

  /**
   * Fade audio out from current volume
   * @param {HTMLAudioElement} audio - Audio element
   * @param {number} duration - Fade duration in milliseconds
   * @param {Function} callback - Optional callback when fade completes
   */
  fadeAudioOut(audio, duration, callback = null) {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const startVolume = audio.volume;
    const volumeStep = startVolume / (duration / 50);
    let currentVolume = startVolume;

    this.fadeInterval = setInterval(() => {
      currentVolume -= volumeStep;
      if (currentVolume <= 0) {
        currentVolume = 0;
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        if (callback) callback();
      }
      audio.volume = Math.max(0, currentVolume);
    }, 50);
  }

  /**
   * Set master volume and update all audio
   * @param {number} volume - Volume level (0-1)
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    // Update gain node if available
    if (this.gainNode) {
      this.gainNode.gain.value = this.masterVolume;
    }

    this.updateAllVolumes();
    this.log(`Master volume set to: ${(this.masterVolume * 100).toFixed(0)}%`);
  }

  /**
   * Set background music volume
   * @param {number} volume - Volume level (0-1)
   */
  setBackgroundVolume(volume) {
    this.backgroundVolume = Math.max(0, Math.min(1, volume));

    if (this.currentBackgroundTrack && !this.isMuted) {
      this.currentBackgroundTrack.volume =
        this.backgroundVolume * this.masterVolume;
    }

    this.log(
      `Background volume set to: ${(this.backgroundVolume * 100).toFixed(0)}%`
    );
  }

  /**
   * Set sound effects volume
   * @param {number} volume - Volume level (0-1)
   */
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.log(`SFX volume set to: ${(this.sfxVolume * 100).toFixed(0)}%`);
  }

  /**
   * Update volumes for all currently playing audio
   */
  updateAllVolumes() {
    // Update background music
    if (this.currentBackgroundTrack && !this.isMuted) {
      this.currentBackgroundTrack.volume =
        this.backgroundVolume * this.masterVolume;
    }

    this.log("All audio volumes updated");
  }

  /**
   * Toggle master mute state
   * @returns {boolean} - New mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      // Mute all audio
      if (this.currentBackgroundTrack) {
        this.currentBackgroundTrack.volume = 0;
      }
      if (this.gainNode) {
        this.gainNode.gain.value = 0;
      }
    } else {
      // Restore volumes
      this.updateAllVolumes();
      if (this.gainNode) {
        this.gainNode.gain.value = this.masterVolume;
      }
    }

    this.log(`Audio ${this.isMuted ? "muted" : "unmuted"}`);
    return this.isMuted;
  }

  /**
   * Toggle background music enabled state
   * @returns {boolean} - New enabled state
   */
  toggleBackgroundMusic() {
    this.isBackgroundMusicEnabled = !this.isBackgroundMusicEnabled;

    if (!this.isBackgroundMusicEnabled && this.currentBackgroundTrack) {
      this.stopBackgroundMusic(true);
    }

    this.log(
      `Background music ${
        this.isBackgroundMusicEnabled ? "enabled" : "disabled"
      }`
    );
    return this.isBackgroundMusicEnabled;
  }

  /**
   * Toggle sound effects enabled state
   * @returns {boolean} - New enabled state
   */
  toggleSoundEffects() {
    this.isSfxEnabled = !this.isSfxEnabled;
    this.log(`Sound effects ${this.isSfxEnabled ? "enabled" : "disabled"}`);
    return this.isSfxEnabled;
  }

  /**
   * Resume audio context (required for some browsers after user interaction)
   * @returns {Promise<boolean>} - Success status
   */
  async resumeAudioContext() {
    if (!this.audioContext) {
      return false;
    }

    try {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
        this.log("Audio context resumed");
        return true;
      }
      return true;
    } catch (error) {
      this.log("Failed to resume audio context:", "error");
      return false;
    }
  }

  /**
   * Handle audio playback errors
   * @param {Error} error - Playback error
   */
  handlePlaybackError(error) {
    if (error.name === "NotAllowedError") {
      this.log(
        "Audio playback blocked by browser - user interaction required",
        "warn"
      );
    } else if (error.name === "NotSupportedError") {
      this.log("Audio format not supported by browser", "warn");
    } else {
      this.log(`Audio playback error: ${error.message}`, "error");
    }
  }

  /**
   * Get comprehensive audio system statistics
   * @returns {Object} - Audio system stats
   */
  getStats() {
    return {
      // Asset loading stats
      loadedAssets: this.loadedAssets.size,
      failedAssets: this.failedAssets.size,
      backgroundMusicTracks: this.backgroundMusic.size,
      soundEffects: this.soundEffects.size,

      // Playback state
      currentlyPlaying: this.currentTrackKey || null,
      isPlaying:
        this.currentBackgroundTrack && !this.currentBackgroundTrack.paused,

      // Volume settings
      volumes: {
        master: this.masterVolume,
        background: this.backgroundVolume,
        sfx: this.sfxVolume,
      },

      // Control settings
      settings: {
        isMuted: this.isMuted,
        backgroundMusicEnabled: this.isBackgroundMusicEnabled,
        sfxEnabled: this.isSfxEnabled,
      },

      // System info
      audioContextSupported: !!this.audioContext,
      audioContextState: this.audioContext
        ? this.audioContext.state
        : "not-supported",
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Save audio settings to localStorage
   * @param {string} customKey - Optional custom storage key
   * @returns {boolean} - Success status
   */
  saveSettings(customKey = null) {
    const key = customKey || this.options.storageKey;

    const settings = {
      masterVolume: this.masterVolume,
      backgroundVolume: this.backgroundVolume,
      sfxVolume: this.sfxVolume,
      isMuted: this.isMuted,
      isBackgroundMusicEnabled: this.isBackgroundMusicEnabled,
      isSfxEnabled: this.isSfxEnabled,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(key, JSON.stringify(settings));
      this.log("Audio settings saved to localStorage");
      return true;
    } catch (error) {
      this.log("Failed to save audio settings:", "error");
      return false;
    }
  }

  /**
   * Load audio settings from localStorage
   * @param {string} customKey - Optional custom storage key
   * @returns {boolean} - Success status
   */
  loadSettings(customKey = null) {
    const key = customKey || this.options.storageKey;

    try {
      const settings = localStorage.getItem(key);
      if (!settings) {
        this.log("No saved audio settings found");
        return false;
      }

      const parsed = JSON.parse(settings);

      // Apply loaded settings with fallbacks
      this.masterVolume = parsed.masterVolume ?? this.options.masterVolume;
      this.backgroundVolume =
        parsed.backgroundVolume ?? this.options.backgroundVolume;
      this.sfxVolume = parsed.sfxVolume ?? this.options.sfxVolume;
      this.isMuted = parsed.isMuted ?? false;
      this.isBackgroundMusicEnabled = parsed.isBackgroundMusicEnabled ?? true;
      this.isSfxEnabled = parsed.isSfxEnabled ?? true;

      // Update audio volumes
      this.updateAllVolumes();

      this.log("Audio settings loaded from localStorage");
      return true;
    } catch (error) {
      this.log("Failed to load audio settings:", "error");
      return false;
    }
  }

  /**
   * Reset all settings to defaults
   */
  resetSettings() {
    this.masterVolume = this.options.masterVolume;
    this.backgroundVolume = this.options.backgroundVolume;
    this.sfxVolume = this.options.sfxVolume;
    this.isMuted = false;
    this.isBackgroundMusicEnabled = true;
    this.isSfxEnabled = true;

    this.updateAllVolumes();
    this.log("Audio settings reset to defaults");
  }

  /**
   * Clean up and dispose of resources
   */
  destroy() {
    this.log("Destroying AudioManager...");

    // Stop all audio
    this.stopBackgroundMusic(false);

    // Clear fade intervals
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // Save current settings
    this.saveSettings();

    // Close audio context
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }

    // Clear collections
    this.backgroundMusic.clear();
    this.soundEffects.clear();
    this.loadedAssets.clear();
    this.failedAssets.clear();
    this.retryAttempts.clear();

    // Reset state
    this.isInitialized = false;
    this.currentBackgroundTrack = null;
    this.currentTrackKey = null;

    this.log("AudioManager destroyed");
  }

  /**
   * Debug logging helper
   * @param {string} message - Log message
   * @param {string} level - Log level ('info', 'warn', 'error')
   */
  log(message, level = "info") {
    if (this.options.enableDebugLogs) {
      const logMethod =
        level === "error"
          ? console.error
          : level === "warn"
          ? console.warn
          : console.log;
      logMethod(`[AudioManager] ${message}`);
    }
  }
}
