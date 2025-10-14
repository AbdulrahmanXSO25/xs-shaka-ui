# xs-shaka-ui

A simple, easy-to-use video player library built on top of Shaka Player with a clean UI.

## Installation

```bash
npm install xs-shaka-ui
```

## Usage

```typescript
import { VideoPlayer } from 'xs-shaka-ui';

const player = new VideoPlayer({
  container: document.getElementById('player-container')!,
  autoplay: false
});

await player.load('https://example.com/video/manifest.mpd');
```

## Features

- 🎥 DASH and HLS streaming support
- 🎨 Simple, clean UI
- 🔧 TypeScript support
- 📱 Responsive design

## Development

```bash
npm install
npm run build

# Watch mode for development
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## License

[AGPL-3.0](LICENSE)