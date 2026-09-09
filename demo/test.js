import { VideoPlayer } from '../dist/index.esm.js';

const player = new VideoPlayer({
  container: document.getElementById('video-container'),
  autoplay: true,
  muted: true,
  ui: {
    controlPanelElements: [
      'play_pause',
      'time_and_duration',
      'spacer',
      'volume',
      'chapter_selection',
      'fullscreen'
    ]
  },
  onReady: () => {
    console.log('Player ready');
    player.load({
      url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
      chapters: 'http://127.0.0.1:5500/demo/chapters.vtt'
    });
  }
});
