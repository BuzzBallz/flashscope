# WebSocket Integration Guide

## Overview

The frontend uses a WebSocket connection to `ws://localhost:8080` to receive real-time data from the backend bot. When disconnected, components automatically fall back to mock data.

## Architecture

```
Backend Bot (ws://localhost:8080)
    ↓
useWebSocket hook
    ↓
DataContext
    ↓
All Components (ProfitBanner, LiveFeed, PriceMatrix, NetworkRadar)
```

## Using Real Data in Components

### 1. Import the hook

```typescript
import { useData } from '../contexts/DataContext';
```

### 2. Access the data

```typescript
function MyComponent() {
  const {
    prices,           // DexPrice[]
    spreads,          // SpreadInfo[]
    lastOpportunity,  // Opportunity | null
    lastArbitrage,    // ArbitrageResult | null
    lastFailure,      // FailureInfo | null
    blockInfo,        // BlockInfo | null
    connectionStatus, // 'connected' | 'disconnected' | 'connecting'
    reconnect         // () => void
  } = useData();

  // Use connectionStatus to decide between real and mock data
  if (connectionStatus === 'disconnected') {
    // Use mock data
  } else {
    // Use real data from WebSocket
  }
}
```

## WebSocket Message Types

All messages follow the `WSMessage` type from `shared/types.ts`:

- `PRICES_UPDATE` - Array of prices for all DEX/pair combinations
- `SPREAD_UPDATE` - Array of spread info between DEX pairs
- `OPPORTUNITY_DETECTED` - New arbitrage opportunity detected
- `ARBITRAGE_EXECUTED` - Successful arbitrage execution with profit
- `ARBITRAGE_FAILED` - Failed arbitrage attempt with reason
- `BLOCK_UPDATE` - New block info (number, timestamp, avg time)

## Connection Status

The `connectionStatus` value indicates the WebSocket state:

- **`connected`** - WebSocket is open and receiving data (green dot)
- **`connecting`** - Attempting to connect (purple dot, pulsing)
- **`disconnected`** - Connection lost, using mock data (red dot)

## Auto-Reconnect

The WebSocket hook implements **exponential backoff**:
- Initial retry: 1 second
- Max retry delay: 10 seconds
- Backoff doubles on each failed attempt
- Resets to 1 second on successful connection

## Current Integration Status

### ✅ ProfitBanner
- Shows connection status (colored dot)
- Displays real block info when connected
- Shows cumulative profit from arbitrage events
- Falls back to mock profit counter when disconnected
- Click on status to manually reconnect

### 🔄 LiveFeed (TODO)
- Currently uses mock events
- Can integrate `lastOpportunity`, `lastArbitrage`, `lastFailure` to add to feed

### 🔄 PriceMatrix (TODO)
- Currently uses mock prices
- Can use `prices` array from WebSocket
- Can trigger arbitrage animation when `lastArbitrage` updates

### 🔄 NetworkRadar (TODO)
- Currently uses mock spreads
- Can use `spreads` array to color edges dynamically
- Can show particle animation when `lastArbitrage` updates

## Testing Without Backend

The frontend works standalone with mock data. To test:

```bash
npm run dev
```

Connection status will show "OFFLINE" (red dot), and all components will use mock data.

## Testing With Backend

1. Start the backend WebSocket server on port 8080
2. Start the frontend: `npm run dev`
3. Connection status should turn green
4. Components will automatically switch to real data

## Manual Reconnect

Click the connection status indicator in ProfitBanner to manually trigger a reconnect attempt.
