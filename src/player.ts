import { PlayerConfig, PlayerError, PlayerState, QualityLevel, VideoSource } from './types';
import { DEFAULT_CONFIG } from './config';

declare global {
  interface Window {
    shaka: any;
  }
}

export class VideoPlayer {
  private config: PlayerConfig;
  private player: any;
  private ui: any;
  private controls: any;
  private videoElement!: HTMLVideoElement;
  private currentState: PlayerState = PlayerState.IDLE;
  private initialized: boolean = false;

  constructor(config: PlayerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.validateConfig();
    this.init();
  }

  private validateConfig(): void {
    if (!this.config.container) {
      throw new Error('Container element is required');
    }
  }

  private async init(): Promise<void> {
    try {
      await this.loadShaka();
      this.setupVideoElement();
      this.setupPlayer();
      this.initialized = true;
      this.config.onReady?.();
    } catch (error) {
      this.handleError({
        code: -1,
        message: `Initialization failed: ${error}`
      });
    }
  }

  private async loadShaka(): Promise<void> {
    if (typeof window.shaka !== 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.9.6/shaka-player.compiled.min.js';
      script.onload = () => {
        const uiScript = document.createElement('script');
        uiScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.9.6/shaka-player.ui.js';
        uiScript.onload = () => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.9.6/controls.css';
          document.head.appendChild(link);
          resolve();
        };
        uiScript.onerror = reject;
        document.head.appendChild(uiScript);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private setupVideoElement(): void {
    if (this.config.videoElement) {
      this.videoElement = this.config.videoElement;
    } else {
      const container = document.createElement('div');
      container.setAttribute('data-shaka-player-container', '');
      container.style.maxWidth = '100%';

      this.videoElement = document.createElement('video');
      this.videoElement.setAttribute('data-shaka-player', '');
      this.videoElement.style.width = '100%';
      this.videoElement.style.height = '100%';
      
      if (this.config.muted) {
        this.videoElement.muted = true;
      }

      container.appendChild(this.videoElement);
      this.config.container.appendChild(container);
    }

    this.setupEventListeners();
  }

  private setupPlayer(): void {
    if (!window.shaka?.Player?.isBrowserSupported()) {
      throw new Error('Browser not supported');
    }

    const containerEl = this.videoElement.parentElement;
    
    this.ui = new window.shaka.ui.Overlay(
      this.player = new window.shaka.Player(this.videoElement),
      containerEl,
      this.videoElement
    );

    this.controls = this.ui.getControls();
    this.player = this.controls.getPlayer();

    this.configurePlayer();
    this.configureUI();

    this.setupQualityListeners();

    this.player.addEventListener('error', (event: any) => {
      this.handleError(this.parseError(event.detail));
    });
  }

  private configurePlayer(): void {
    const config: any = {};

    if (this.config.streaming) {
      config.streaming = this.config.streaming;
    }

    if (this.config.manifest) {
      config.manifest = this.config.manifest;
    }

    if (this.config.abr) {
      config.abr = this.config.abr;
    }

    this.player.configure(config);
  }

  private configureUI(): void {
    if (this.config.ui) {
      this.ui.configure(this.config.ui);
    }
  }

  private setupEventListeners(): void {
    this.videoElement.addEventListener('playing', () => this.updateState(PlayerState.PLAYING));
    this.videoElement.addEventListener('pause', () => this.updateState(PlayerState.PAUSED));
    this.videoElement.addEventListener('waiting', () => this.updateState(PlayerState.BUFFERING));
    this.videoElement.addEventListener('ended', () => this.updateState(PlayerState.ENDED));
  }

  private setupQualityListeners(): void {
    if (!this.player) return;
    const notify = () => this.notifyQualityChange();
    // Shaka fires 'adaptation' and 'variantchanged' on quality switch
    this.player.addEventListener('adaptation', notify);
    this.player.addEventListener('variantchanged', notify);
    // Also listen to trackschanged (manifest loaded)
    this.player.addEventListener('trackschanged', notify);
  }

  private notifyQualityChange(): void {
    if (!this.config.onQualityChange) return;
    const isAuto = this.isAutoQuality();
    const current = this.getCurrentQuality();
    this.config.onQualityChange(current, isAuto);
  }

  private trackToQualityLevel(track: any): QualityLevel {
    const height = track.height ?? null;
    const label = height ? `${height}p` : track.label || `${Math.round(track.bandwidth / 1000)} kbps`;
    return {
      id: track.id,
      height,
      width: track.width ?? null,
      bandwidth: track.bandwidth,
      label,
      active: !!track.active,
      originalTrack: track,
    };
  }

  private updateState(state: PlayerState): void {
    this.currentState = state;
    this.config.onStateChange?.(state);
  }

  private parseError(error: any): PlayerError {
    return {
      code: error.code || -1,
      message: error.message || 'Unknown error',
      category: error.category,
      data: error.data
    };
  }

  private handleError(error: PlayerError): void {
    this.updateState(PlayerState.ERROR);
    this.config.onError?.(error);
  }

  public async load(source: string | VideoSource): Promise<void> {
    if (!this.initialized) {
      throw new Error('Player not initialized');
    }

    try {
      this.updateState(PlayerState.LOADING);
      
      const url = typeof source === 'string' ? source : source.url;
      await this.player.load(url);

      if (this.config.autoplay) {
        await this.play();
      }

      if (typeof source !== 'string' && source.chaptersUrl) {
        await this.player.addChaptersTrack(source.chaptersUrl, 'en', 'text/vtt');
        console.log('✅ Chapters track added:', source.chaptersUrl);
      }

      // Emit initial quality (manifest-based levels now known)
      this.notifyQualityChange();

    } catch (error) {
      this.handleError({
        code: -1,
        message: `Failed to load video: ${error}`
      });
      throw error;
    }
  }

  public async play(): Promise<void> {
    try {
      await this.videoElement.play();
    } catch (error) {
      this.handleError({
        code: -1,
        message: `Failed to play: ${error}`
      });
      throw error;
    }
  }

  public pause(): void {
    this.videoElement.pause();
  }

  public async unload(): Promise<void> {
    if (this.player) {
      await this.player.unload();
      this.updateState(PlayerState.IDLE);
    }
  }

  public setVolume(volume: number): void {
    this.videoElement.volume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.videoElement.volume;
  }

  public setMuted(muted: boolean): void {
    this.videoElement.muted = muted;
  }

  public isMuted(): boolean {
    return this.videoElement.muted;
  }

  public seek(time: number): void {
    this.videoElement.currentTime = time;
  }

  public getCurrentTime(): number {
    return this.videoElement.currentTime;
  }

  public getDuration(): number {
    return this.videoElement.duration;
  }

  public getState(): PlayerState {
    return this.currentState;
  }

  // ──────────────────────────────────────────────────────────────
  // Quality handling – manifest-based manual switching (ABR override)
  // ──────────────────────────────────────────────────────────────

  /**
   * Raw Shaka variant tracks. Empty array if manifest not loaded yet.
   * Type `any` to avoid hard dependency on shaka-player types.
   */
  public getVariantTracks(): any[] {
    if (!this.player?.getVariantTracks) return [];
    try {
      return this.player.getVariantTracks() || [];
    } catch {
      return [];
    }
  }

  /**
   * Distinct quality levels derived from manifest.
   * Sorted high -> low (1080p -> 144p). Deduped by height, keeping
   * highest bandwidth per height (covers multi-bitrate same resolution).
   * Works with DASH SegmentBase byte-range (single mp4) manifests.
   */
  public getQualityLevels(): QualityLevel[] {
    const tracks = this.getVariantTracks().filter((t: any) => t.height != null);
    const byHeight = new Map<number, any>();
    for (const t of tracks) {
      const existing = byHeight.get(t.height);
      if (!existing || t.bandwidth > existing.bandwidth) {
        byHeight.set(t.height, t);
      }
    }
    return Array.from(byHeight.values())
      .map((t) => this.trackToQualityLevel(t))
      .sort((a, b) => (b.height! - a.height!));
  }

  /**
   * Currently active quality, or null if not loaded / audio-only.
   */
  public getCurrentQuality(): QualityLevel | null {
    const tracks = this.getVariantTracks();
    const active = tracks.find((t: any) => t.active);
    return active ? this.trackToQualityLevel(active) : null;
  }

  /**
   * True when ABR is enabled (Auto). False when a manual quality is locked.
   */
  public isAutoQuality(): boolean {
    try {
      return !!this.player?.getConfiguration?.()?.abr?.enabled;
    } catch {
      // fallback to config
      return !!this.config.abr?.enabled;
    }
  }

  /**
   * Enable automatic ABR (Auto) – re-enables adaptive switching.
   */
  public enableAutoQuality(): void {
    this.setQuality('auto');
  }

  /**
   * Switch quality based on manifest heights.
   * - `'auto'` → re-enable ABR.
   * - `number` (e.g. 1080, 720, 480, 360, 240, 144) → lock to that height.
   *
   * For single-mp4 DASH with byte-range (`SegmentBase` + `BaseURL`), each
   * `Representation` manifests as a variant track – selection triggers a
   * range request for the new initialization/segment.
   *
   * @param height Height in pixels or 'auto'
   * @param clearBuffer Whether to clear buffer on switch (default true)
   */
  public setQuality(height: number | 'auto', clearBuffer: boolean = true): void {
    if (!this.player) throw new Error('Player not initialized');

    if (height === 'auto') {
      this.player.configure({ abr: { enabled: true } });
      this.notifyQualityChange();
      return;
    }

    const tracks = this.getVariantTracks();
    if (tracks.length === 0) {
      throw new Error('No variant tracks available – load a manifest first');
    }

    // Prefer exact height; pick highest bandwidth for that height
    const candidates = tracks
      .filter((t: any) => t.height === height)
      .sort((a: any, b: any) => b.bandwidth - a.bandwidth);

    if (candidates.length === 0) {
      const available = this.getQualityLevels().map((q) => q.height).join(', ');
      throw new Error(`Quality ${height}p not found. Available: ${available || 'none'}`);
    }

    const track = candidates[0];

    // Disable ABR so manual choice persists, then select track
    this.player.configure({ abr: { enabled: false } });
    // Shaka API: selectVariantTrack(track, clearBuffer, safeMargin)
    if (typeof this.player.selectVariantTrack === 'function') {
      this.player.selectVariantTrack(track, clearBuffer);
    } else {
      // fallback: select via id if older API
      this.player.selectVariantTrack(track, clearBuffer);
    }
    this.notifyQualityChange();
  }

  /**
   * Direct variant selection by Shaka track id (advanced).
   */
  public setQualityById(trackId: number, clearBuffer: boolean = true): void {
    if (!this.player) throw new Error('Player not initialized');
    const track = this.getVariantTracks().find((t: any) => t.id === trackId);
    if (!track) throw new Error(`Track id ${trackId} not found`);
    this.player.configure({ abr: { enabled: false } });
    this.player.selectVariantTrack(track, clearBuffer);
    this.notifyQualityChange();
  }

  /**
   * Update ABR enabled flag without switching track.
   * Useful for toggling back to Auto via UI switch.
   */
  public setAbrEnabled(enabled: boolean): void {
    this.player?.configure({ abr: { enabled } });
    this.notifyQualityChange();
  }

  /** Escape hatch – direct Shaka Player instance */
  public getShakaPlayer(): any {
    return this.player;
  }

  /** Escape hatch – Shaka UI instance */
  public getShakaUI(): any {
    return this.ui;
  }

  public async destroy(): Promise<void> {
    if (this.player) {
      await this.player.destroy();
    }
    this.videoElement.remove();
    this.initialized = false;
  }
}
