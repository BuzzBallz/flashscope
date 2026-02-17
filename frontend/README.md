# FlashScope Frontend

Real-time arbitrage dashboard for Monad blockchain flash loan monitoring.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Features

- **ProfitBanner** - Real-time profit counter with rolling digit animation
- **LiveFeed** - Terminal-style scrolling event log
- **NetworkRadar** - Force-directed graph of DEX spreads with particle effects
- **PriceMatrix** - Live price heatmap with arbitrage highlighting

## Keyboard Shortcuts

- **R** - Toggle mock mode (force mock data even when connected)

## Connection States

- 🟢 **LIVE** - Connected to backend WebSocket
- 🟣 **CONNECTING** - Attempting to connect
- 🔴 **OFFLINE** - Disconnected, using mock data

Click the status indicator to manually reconnect.

## Architecture

```
src/
├── components/          # React components
│   ├── ProfitBanner.tsx
│   ├── LiveFeed.tsx
│   ├── PriceMatrix.tsx
│   └── NetworkRadar.tsx
├── contexts/
│   └── DataContext.tsx  # Global WebSocket data state
├── hooks/
│   ├── useWebSocket.ts  # WebSocket connection with auto-reconnect
│   └── useMockMode.ts   # 'R' key toggle
├── shared/
│   └── types.ts         # Shared types with backend (DO NOT EDIT)
└── lib/
    └── constants.ts     # Color palette

```

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Dev server & build
- **Tailwind CSS v3** - Styling
- **Framer Motion** - Animations
- **react-force-graph-2d** - Network graph
- **Native WebSocket API** - Real-time data

## WebSocket Integration

See [WEBSOCKET_INTEGRATION.md](./WEBSOCKET_INTEGRATION.md) for details.

## Development

- Run `npm run dev` for local development
- Connect to backend at `ws://localhost:8080`
- Falls back to mock data when backend unavailable
- Press 'R' to force mock mode for UI testing

## Build

```bash
npm run build
npm run preview
```

Outputs to `dist/`

## Color Palette

```typescript
background: #0A0A1A  // Deep black
accent:     #836EF9  // Monad purple
success:    #00FF94  // Neon green
danger:     #FF4D4D  // Red
muted:      #3D3D5C  // Dark gray
```

## Target Resolution

Optimized for **1920x1080** (demo screen)
