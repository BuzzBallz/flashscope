# FlashScope

**Real-time flash loan arbitrage dashboard on Monad.**

Built at [Monad Blitz @ ETHDenver 2026](https://www.ethdenver.com/) — an 8-hour hackathon.

FlashScope scans 6 pools on Monad testnet, detects price discrepancies between them, executes 3-pool flash loan arbitrage, and visualizes everything in a Bloomberg Terminal-style dashboard, at the pace of Monad's 400ms blocks.

> **Scope.** The 6 "DEXs" are `SimplePool` contracts we deployed on testnet, one per target venue, with seeded price differentials. No real DEX is called and no real funds are involved. It is a hackathon prototype of the detection and execution loop.

---

## Architecture

```
frontend/ (React + Vite)  ←— WebSocket —→  bot/ (Node.js + viem)  ←— RPC —→  contracts/ (Solidity + Foundry)
                                                                      ↕
                                                              Monad (Chain ID: 10143)
```

| Layer | Stack | Role |
|-------|-------|------|
| **Contracts** | Solidity, Foundry, OpenZeppelin | `SimplePool` AMM with flash loans + `FlashArbitrageur` for 3-pool arbitrage |
| **Bot** | TypeScript, viem, WebSocket | Scans pool prices via Multicall, detects spreads, executes arbitrage, broadcasts data |
| **Frontend** | React, Tailwind, Recharts, RainbowKit | 4-zone dashboard — ProfitBanner, LiveFeed, PriceMatrix, NetworkRadar |
| **Shared** | TypeScript | `shared/types.ts` — single interface contract between frontend and backend |

---

## Dashboard Zones

| Zone | Description |
|------|-------------|
| **ProfitBanner** | Running P&L, cumulative profit counter, trade count |
| **LiveFeed** | Real-time log of opportunities detected and arbitrage executions |
| **PriceMatrix** | 6-DEX price comparison grid with spread highlighting |
| **NetworkRadar** | Monad block info — block number, avg block time, tx count |

The frontend supports both desktop (resizable panels) and mobile layouts, with WalletConnect integration via RainbowKit.

---

## How It Works

1. **Scan** — The bot reads prices from 6 `SimplePool` contracts using Multicall3
2. **Detect** — Compares all price pairs to find spreads above a configurable threshold (default: 50 bps)
3. **Execute** — Calls `FlashArbitrageur.executeArbitrage()` which:
   - Flash-borrows from Pool A (neutral price)
   - Sells on Pool B (where the token is expensive)
   - Buys back on Pool C (where the token is cheap)
   - Repays the flash loan + keeps the profit
4. **Broadcast** — Results stream to the frontend over WebSocket on port 8080

---

## Target DEXs

| DEX | Type |
|-----|------|
| Uniswap V4 | Concentrated Liquidity AMM |
| Kuru | Hybrid CLOB + AMM |
| Curve | StableSwap AMM |
| Trader Joe (LFJ) | Liquidity Book |
| Clober | On-chain CLOB |
| Ambient | Single-contract AMM |

Each DEX is represented by a `SimplePool` instance deployed on Monad testnet with seeded price differentials.

---

## Quick Start

### Prerequisites

- Node.js >= 18
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Contracts

```bash
cd contracts
forge install
forge build
forge test
```

### Bot

```bash
cd bot
npm install
cp .env.example .env   # add your PRIVATE_KEY and RPC_URL
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — connect your wallet and enter the dashboard.

---

## Environment Variables

The bot requires a `.env` file:

```
PRIVATE_KEY=0x...
RPC_URL=https://testnet-rpc.monad.xyz
WSS_URL=wss://testnet-rpc.monad.xyz
WS_PORT=8080
MODE=live          # or "replay" for demo mode
MIN_SPREAD_BPS=50
```

---

## Tech Stack

- **Solidity** + Foundry + OpenZeppelin
- **TypeScript** + viem + ws
- **React 18** + Vite + Tailwind CSS
- **Recharts** for data visualization
- **RainbowKit + wagmi** for wallet connection
- **Framer Motion + GSAP** for animations

---

## License

MIT
