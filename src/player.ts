import { PlayerConfig, PlayerError, PlayerState, VideoSource } from './types';
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

  public async destroy(): Promise<void> {
    if (this.player) {
      await this.player.destroy();
    }
    this.videoElement.remove();
    this.initialized = false;
  }
}
