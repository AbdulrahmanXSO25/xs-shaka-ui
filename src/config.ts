import { PlayerConfig } from './types';

export const DEFAULT_CONFIG: Partial<PlayerConfig> = {
  autoplay: false,
  muted: false,
  streaming: {
    bufferingGoal: 30,
    rebufferingGoal: 2,
    bufferBehind: 30,
    retryParameters: {
      timeout: 60000,
      maxAttempts: 6,
      baseDelay: 500,
      backoffFactor: 2,
      fuzzFactor: 0.5
    },
    stallEnabled: true,
    stallThreshold: 2,
    lowLatencyMode: false,
    segmentPrefetchLimit: 4,
  },
  manifest: {
    retryParameters: {
      timeout: 60000,
      maxAttempts: 6,
      baseDelay: 500,
      backoffFactor: 2,
      fuzzFactor: 0.5
    },
    dash: {
      ignoreMinBufferTime: false,
      autoCorrectDrift: true,
      ignoreEmptyAdaptationSet: true
    }
  },
  abr: {
    enabled: true,
    defaultBandwidthEstimate: 5000000,
    switchInterval: 8,
    bandwidthUpgradeTarget: 0.85,
    bandwidthDowngradeTarget: 0.95,
  },
  ui: {
    addSeekBar: true,
    controlPanelElements: [
      'play_pause',
      'spacer',
      'time_and_duration',
      'mute',
      'volume',
      'overflow_menu',
      'picture_in_picture',
      'fullscreen',
    ],
    overflowMenuButtons: ['quality', 'playback_rate'],
    enableTooltips: true,
    seekBarColors: {
      base: 'rgba(255, 255, 255, 0.25)',
      buffered: 'rgba(255, 255, 255, 0.5)',
      played: '#667eea'
    },
    keyboardSeekDistance: 5,
    keyboardLargeSeekDistance: 60,
  }
};
