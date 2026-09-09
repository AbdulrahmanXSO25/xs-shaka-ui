## Usage

### Vanilla JavaScript/TypeScript

```typescript
import { VideoPlayer, PlayerConfig } from 'xs-shaka-ui';

const config: PlayerConfig = {
  container: document.getElementById('player-container')!,
  autoplay: false,
  onReady: () => console.log('Player ready'),
  onError: (error) => console.error('Player error:', error),
  onStateChange: (state) => console.log('State:', state)
};

const player = new VideoPlayer(config);

// Load and play video
await player.load('https://example.com/video/manifest.mpd');
await player.play();

// Control playback
player.pause();
player.seek(30);
player.setVolume(0.5);

// Cleanup
await player.destroy();
```

### Manual Quality Switching (manifest-based, ABR override)

Works with DASH `SegmentBase` + byte-range single-`mp4` manifests (each `Representation` → variant track). Selection triggers range requests for new segments.

```typescript
import { VideoPlayer } from 'xs-shaka-ui';

const player = new VideoPlayer({
  container: document.getElementById('player-container')!,
  abr: { enabled: true }, // start Auto
  onQualityChange: (quality, isAuto) => {
    console.log(isAuto ? 'Auto' : quality?.label, quality);
  }
});

await player.load('https://example.com/video/manifest.mpd');

// After load, enumerate qualities from manifest (1080p → 144p)
const levels = player.getQualityLevels();
console.log(levels); // [{height:1080,label:'1080p',bandwidth:4800000,active:true}, ...]

// Pretty UI: render buttons
levels.forEach(l => {
  const btn = document.createElement('button');
  btn.textContent = l.label;
  btn.className = l.active && !player.isAutoQuality() ? 'active' : '';
  btn.onclick = () => player.setQuality(l.height!); // locks quality, disables ABR
  document.getElementById('quality-bar')!.appendChild(btn);
});
const autoBtn = document.createElement('button');
autoBtn.textContent = 'Auto';
autoBtn.className = player.isAutoQuality() ? 'active' : '';
autoBtn.onclick = () => player.setQuality('auto'); // re-enable ABR
document.getElementById('quality-bar')!.appendChild(autoBtn);

// Programmatic API
player.setQuality(720);          // lock 720p
player.setQuality(1080);         // lock 1080p
player.setQuality('auto');       // back to ABR
player.setQualityById(123);      // by Shaka track id
console.log(player.getCurrentQuality()); // {height:720,label:'720p',...}
console.log(player.isAutoQuality());     // false when locked
player.setAbrEnabled(true);      // toggle ABR without switching track
player.getVariantTracks();       // raw Shaka tracks
player.getShakaPlayer();         // escape hatch
```

### Angular

```typescript
// video-player.component.ts
import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { VideoPlayer, PlayerConfig } from 'xs-shaka-ui';

@Component({
  selector: 'app-video-player',
  template: '<div #playerContainer class="player-container"></div>'
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  @ViewChild('playerContainer', { static: true }) containerRef!: ElementRef;
  
  private player?: VideoPlayer;

  ngOnInit() {
    const config: PlayerConfig = {
      container: this.containerRef.nativeElement,
      onError: (error) => console.error(error)
    };
    
    this.player = new VideoPlayer(config);
    this.player.load('https://example.com/video.mpd');
  }

  ngOnDestroy() {
    this.player?.destroy();
  }
}
```

### React

```typescript
import { useEffect, useRef } from 'react';
import { VideoPlayer, PlayerConfig } from 'xs-shaka-ui';

export const VideoPlayerComponent = ({ src }: { src: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VideoPlayer>();

  useEffect(() => {
    if (!containerRef.current) return;

    const config: PlayerConfig = {
      container: containerRef.current,
      onError: (error) => console.error(error)
    };

    playerRef.current = new VideoPlayer(config);
    playerRef.current.load(src);

    return () => {
      playerRef.current?.destroy();
    };
  }, [src]);

  return <div ref={containerRef} className="player-container" />;
};
```

### Vue

```vue
<template>
  <div ref="playerContainer" class="player-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { VideoPlayer, PlayerConfig } from 'xs-shaka-ui';

const playerContainer = ref<HTMLDivElement>();
let player: VideoPlayer;

onMounted(() => {
  if (!playerContainer.value) return;

  const config: PlayerConfig = {
    container: playerContainer.value,
    onError: (error) => console.error(error)
  };

  player = new VideoPlayer(config);
  player.load('https://example.com/video.mpd');
});

onUnmounted(() => {
  player?.destroy();
});
</script>
```