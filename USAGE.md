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