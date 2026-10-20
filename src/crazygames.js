/**
 * @fileoverview CrazyGames SDK v3 Integration Bridge for Cyber Arena: Neon Survival
 * Strictly complies with CrazyGames publishing guidelines:
 * - Asynchronous SDK initialization with resilient AdBlock handling
 * - Proper gameplayStart() / gameplayStop() lifecycle tracking
 * - Mandatory audio muting and physics freeze on adStarted; restore on adFinished / adError
 * - Rewarded Ad 1: Emergency Cyber-Revive (+3s invulnerability & full shield, 1x per match)
 * - Rewarded Ad 2: Double Cyber-Credits collected upon match victory
 * - Strictly NEVER grant reward on adError (AdBlock active)
 * - Midgame Ads: 180s cooldown, strictly on logical screens (victory / game over), never mid-gameplay
 * - Includes strict 2.5s Watchdog Timeout & environment check so local/custom domains NEVER freeze
 */

export class CrazyGamesBridge {
  constructor() {
    this.sdk = null;
    this.isInitialized = false;
    this.isLiveCrazyGamesHost = false;
    this.hasAdblock = false;
    this.inGameplay = false;
    this.lastMidgameTime = performance.now();
    this.levelsCompletedSinceLastAd = 0;
    this.onAdPauseCallback = null;
    this.onAdResumeCallback = null;
  }

  /**
   * Registers global callbacks to freeze physics and mute audio during ads.
   * @param {() => void} onPause
   * @param {() => void} onResume
   */
  setAdCallbacks(onPause, onResume) {
    this.onAdPauseCallback = onPause;
    this.onAdResumeCallback = onResume;
  }

  /**
   * Checks whether the SDK is running inside an active CrazyGames environment.
   * @returns {boolean}
   */
  _canRequestLiveAds() {
    if (!this.sdk || !this.sdk.ad || typeof this.sdk.ad.requestAd !== 'function') {
      return false;
    }
    const env = this.sdk.environment;
    if (env === 'disabled') {
      return false;
    }
    if (typeof window !== 'undefined' && window.location) {
      const host = (window.location.hostname || '').toLowerCase();
      const isCgHost = host.includes('crazygames') || host.includes('1001juegos');
      if (!isCgHost && env !== 'crazygames' && env !== 'local') {
        return false;
      }
      if (!isCgHost && env === 'local' && !window.location.search.includes('crazygames')) {
        return false;
      }
    }
    return true;
  }

  /**
   * Initializes the CrazyGames SDK v3 asynchronously.
   * @returns {Promise<boolean>}
   */
  async init() {
    if (this.isInitialized) return true;

    try {
      if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
        this.sdk = window.CrazyGames.SDK;
        if (typeof this.sdk.init === 'function') {
          await Promise.race([
            this.sdk.init(),
            new Promise((resolve) => setTimeout(resolve, 2000))
          ]);
        }
        if (this.sdk.ad && typeof this.sdk.ad.hasAdblock === 'function') {
          try {
            this.hasAdblock = await Promise.race([
              this.sdk.ad.hasAdblock(),
              new Promise((resolve) => setTimeout(() => resolve(false), 1200))
            ]);
          } catch (_) {
            this.hasAdblock = false;
          }
        }
        this.isInitialized = true;
        this.isLiveCrazyGamesHost = this._canRequestLiveAds();
        console.log(`[CrazyGames] SDK v3 initialized (env=${this.sdk.environment || 'unknown'}, liveAds=${this.isLiveCrazyGamesHost}).`);
        return true;
      } else {
        console.warn('[CrazyGames] SDK v3 not found on window (Fallback mode active).');
        this.isInitialized = false;
        return false;
      }
    } catch (err) {
      console.warn('[CrazyGames] SDK v3 init failed (AdBlock or offline):', err);
      this.hasAdblock = true;
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Signals that active gameplay has begun or resumed.
   */
  gameplayStart() {
    if (this.inGameplay) return;
    this.inGameplay = true;
    try {
      if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStart === 'function' && this.sdk.environment !== 'disabled') {
        this.sdk.game.gameplayStart();
        console.log('[CrazyGames] gameplayStart() triggered.');
      }
    } catch (err) {
      console.debug('[CrazyGames] gameplayStart error:', err);
    }
  }

  /**
   * Signals that active gameplay has paused, ended, or entered a menu.
   */
  gameplayStop() {
    if (!this.inGameplay) return;
    this.inGameplay = false;
    try {
      if (this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStop === 'function' && this.sdk.environment !== 'disabled') {
        this.sdk.game.gameplayStop();
        console.log('[CrazyGames] gameplayStop() triggered.');
      }
    } catch (err) {
      console.debug('[CrazyGames] gameplayStop error:', err);
    }
  }

  /**
   * Signals a celebratory moment (match victory or multi-kill).
   */
  happyTime() {
    try {
      if (this.sdk && this.sdk.game && typeof this.sdk.game.happyTime === 'function' && this.sdk.environment !== 'disabled') {
        this.sdk.game.happyTime();
        console.log('[CrazyGames] happyTime() triggered.');
      }
    } catch (err) {
      console.debug('[CrazyGames] happyTime error:', err);
    }
  }

  /**
   * Requests a Midgame / Interstitial ad with a strict 2.5s watchdog timer.
   * Guaranteed finally clause to resume physics and unmute audio.
   * @param {() => void} onComplete
   */
  requestMidgameAd(onComplete) {
    const elapsedSinceLastAd = (performance.now() - this.lastMidgameTime) / 1000;
    this.levelsCompletedSinceLastAd++;

    if (elapsedSinceLastAd < 180 && this.levelsCompletedSinceLastAd < 3) {
      console.log(`[CrazyGames] Midgame ad bypassed: cooldown active (${Math.round(elapsedSinceLastAd)}s/180s, levels=${this.levelsCompletedSinceLastAd}).`);
      if (onComplete) onComplete();
      return;
    }

    if (!this._canRequestLiveAds()) {
      console.log('[CrazyGames] Midgame ad bypassed: non-live environment or AdBlock detected.');
      this.lastMidgameTime = performance.now();
      this.levelsCompletedSinceLastAd = 0;
      if (onComplete) onComplete();
      return;
    }

    console.log('[CrazyGames] Requesting Midgame Ad...');
    let hasFinished = false;

    if (this.onAdPauseCallback) this.onAdPauseCallback();

    const finish = () => {
      if (!hasFinished) {
        hasFinished = true;
        clearTimeout(watchdogTimer);
        this.lastMidgameTime = performance.now();
        this.levelsCompletedSinceLastAd = 0;
        if (this.onAdResumeCallback) this.onAdResumeCallback();
        if (onComplete) onComplete();
      }
    };

    const watchdogTimer = setTimeout(() => {
      console.warn('[CrazyGames] Midgame Ad Watchdog triggered (2.5s timeout). Force resuming.');
      finish();
    }, 2500);

    try {
      this.sdk.ad.requestAd('midgame', {
        adStarted: () => {
          console.log('[CrazyGames] Midgame Ad started.');
          clearTimeout(watchdogTimer);
        },
        adFinished: () => {
          console.log('[CrazyGames] Midgame Ad finished.');
          finish();
        },
        adError: (err) => {
          console.warn('[CrazyGames] Midgame Ad error:', err);
          finish();
        }
      });
    } catch (err) {
      console.warn('[CrazyGames] Exception requesting midgame ad:', err);
      finish();
    }
  }

  /**
   * Requests a Rewarded Ad with a strict 2.5s watchdog timer.
   * @param {() => void} onRewarded - Callback ONLY if ad finishes legitimately.
   * @param {() => void} onDismiss - Callback if user closes or ad fails.
   */
  requestRewardedAd(onRewarded, onDismiss) {
    if (!this._canRequestLiveAds()) {
      console.log('[CrazyGames] Rewarded ad simulated: offline / non-CG host.');
      if (onRewarded) onRewarded();
      return;
    }

    console.log('[CrazyGames] Requesting Rewarded Ad...');
    let hasFinished = false;
    let earnedReward = false;

    if (this.onAdPauseCallback) this.onAdPauseCallback();

    const finish = () => {
      if (!hasFinished) {
        hasFinished = true;
        clearTimeout(watchdogTimer);
        if (this.onAdResumeCallback) this.onAdResumeCallback();
        if (earnedReward) {
          if (onRewarded) onRewarded();
        } else {
          if (onDismiss) onDismiss();
        }
      }
    };

    const watchdogTimer = setTimeout(() => {
      console.warn('[CrazyGames] Rewarded Ad Watchdog triggered (2.5s timeout). Ad aborted without reward.');
      earnedReward = false;
      finish();
    }, 2500);

    try {
      this.sdk.ad.requestAd('rewarded', {
        adStarted: () => {
          console.log('[CrazyGames] Rewarded Ad started.');
          clearTimeout(watchdogTimer);
        },
        adFinished: () => {
          console.log('[CrazyGames] Rewarded Ad successfully finished -> Granting reward!');
          earnedReward = true;
          finish();
        },
        adError: (err) => {
          console.warn('[CrazyGames] Rewarded Ad error (AdBlock or failed to load):', err);
          earnedReward = false; // Strictly NEVER reward on error
          finish();
        }
      });
    } catch (err) {
      console.warn('[CrazyGames] Exception requesting rewarded ad:', err);
      earnedReward = false;
      finish();
    }
  }
}

export const crazyGames = new CrazyGamesBridge();
