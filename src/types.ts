export interface QualityLevel {
  /** Shaka variant track id */
  id: number;
  /** Vertical resolution (e.g. 1080, 720, 144). Null for audio-only. */
  height: number | null;
  width: number | null;
  bandwidth: number;
  /** Human label like "1080p" or "Auto" */
  label: string;
  active: boolean;
  /** Underlying Shaka track object for advanced use */
  originalTrack?: any;
}

export interface PlayerConfig {
  container: HTMLElement;
  videoElement?: HTMLVideoElement;
  autoplay?: boolean;
  muted?: boolean;
  streaming?: ShakaStreamingConfig;
  manifest?: ShakaManifestConfig;
  abr?: ShakaABRConfig;
  ui?: PlayerUIConfig;
  onReady?: () => void;
  onError?: (error: PlayerError) => void;
  onStateChange?: (state: PlayerState) => void;
  onQualityChange?: (quality: QualityLevel | null, isAuto: boolean) => void;
}

export interface ShakaStreamingConfig {
  bufferingGoal?: number;
  rebufferingGoal?: number;
  bufferBehind?: number;
  retryParameters?: RetryParameters;
  stallEnabled?: boolean;
  stallThreshold?: number;
  lowLatencyMode?: boolean;
  segmentPrefetchLimit?: number;
}

export interface ShakaManifestConfig {
  retryParameters?: RetryParameters;
  dash?: {
    ignoreMinBufferTime?: boolean;
    autoCorrectDrift?: boolean;
    ignoreEmptyAdaptationSet?: boolean;
  };
}

export interface ShakaABRConfig {
  enabled?: boolean;
  defaultBandwidthEstimate?: number;
  switchInterval?: number;
  bandwidthUpgradeTarget?: number;
  bandwidthDowngradeTarget?: number;
}

export interface RetryParameters {
  timeout?: number;
  maxAttempts?: number;
  baseDelay?: number;
  backoffFactor?: number;
  fuzzFactor?: number;
}

export interface PlayerUIConfig {
  addSeekBar?: boolean;
  controlPanelElements?: string[];
  overflowMenuButtons?: string[];
  enableTooltips?: boolean;
  seekBarColors?: {
    base?: string;
    buffered?: string;
    played?: string;
  };
  keyboardSeekDistance?: number;
  keyboardLargeSeekDistance?: number;
}

export interface PlayerError {
  code: number;
  message: string;
  category?: number;
  data?: any[];
}

export enum PlayerState {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  BUFFERING = 'buffering',
  ENDED = 'ended',
  ERROR = 'error'
}

export interface VideoSource {
  url: string;
  type?: 'dash' | 'hls';
  chaptersUrl?: string;
}

export type QualitySelection = number | 'auto';
