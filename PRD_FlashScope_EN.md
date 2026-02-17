# FlashScope — Product Requirements Document

**Project:** FlashScope — The Bloomberg Terminal for Flash Loans on Monad
**Hackathon:** Monad Blitz | ETHDenver 2026 — Tuesday, February 17, 2026
**Venue:** Temple, Denver, Colorado
**Duration:** 8-hour build
**Team:** 2 developers
**Prize Pool:** $10,000 (peer-judged)
**Version:** 1.0 — February 17, 2026

---

## 1. Executive Summary

### 1.1 Vision

FlashScope is a cinematic real-time dashboard that scans DEXs across the Monad ecosystem, detects arbitrage opportunities between protocols, executes atomic flash loans, and visualizes each operation as a spectacular on-screen event. It is a visual trading tool that transforms the invisible (micro price discrepancies between DEXs) into a captivating spectacle.

### 1.2 Why This Project

The Monad Blitz hackathon is **peer-judged** (voted by fellow builders) and has **zero thematic constraints**. The winning strategy therefore requires a project that:

- Produces an **immediate visual "wow"** during the 2-3 minute pitch
- **Concretely demonstrates** Monad's speed (400ms blocks, ~800ms finality)
- Is **technically solid** to impress a developer audience
- Runs **live** during the demo (no slides, no mockups)

FlashScope checks all these boxes: the visual spectacle of live flash loans, combined with a polished front-end, creates a memorable demo moment.

### 1.3 One-Line Pitch

> "We scan 6 Monad DEXs in real-time, detect price discrepancies, and execute flash loan arbitrage in 400ms — watch the money being made live."

---

## 2. Technical Context: Monad

### 2.1 What Is Monad

Monad is an independent **Layer 1** blockchain (not an L2), **EVM-compatible at the bytecode level**. This means Solidity smart contracts, Ethereum tools (Foundry, Hardhat, ethers.js, viem), and wallets (MetaMask, Backpack) work natively without modification.

**Source:** [docs.monad.xyz](https://docs.monad.xyz/) — "Monad is a Layer-1 blockchain delivering high performance, true decentralization, and EVM compatibility."

### 2.2 Key Performance Metrics

| Metric | Value | Source |
|---|---|---|
| Throughput | 10,000 TPS | docs.monad.xyz |
| Block time | 400ms | docs.monad.xyz/changelog (MONAD_EIGHT) |
| Finality | ~800ms (single-slot) | docs.monad.xyz |
| Gas fees | ~$0.004-$0.007 avg | CoinGecko / testnet data |
| Chain ID | 143 | docs.monad.xyz/network-information |
| Mainnet launch | November 24, 2025 | docs.monad.xyz |

### 2.3 Five Architectural Innovations

**1. MonadBFT** — BFT consensus derived from HotStuff, solving the "tail-forking" problem. Validators first agree on transaction ordering, then execution happens separately.

**2. Asynchronous Execution (Deferred Execution)** — Consensus and execution are decoupled: consensus orders transactions in one round, and execution happens in the following round. This frees up the time budget for execution.

**3. Parallel Execution (Optimistic Parallel Execution)** — Instead of processing transactions sequentially like Ethereum, Monad executes them in parallel across multiple cores, optimistically assuming they are independent. In case of state conflicts, only the conflicting transactions are re-executed.

**4. RaptorCast** — Optimized network protocol for fast block propagation between validators.

**5. MonadDB** — Custom database designed for fast random reads and parallelizable writes, making parallel execution practically performant.

**Sources:** docs.monad.xyz/monad-arch, imperator.co/resources/blog/monad-parallel-execution, figment.io/insights/monad-first-look

### 2.4 Essential Network Information

**Public RPC Endpoints (Mainnet):**

| URL | Provider | Rate Limit | Batch Limit |
|---|---|---|---|
| `https://rpc.monad.xyz` / `wss://rpc.monad.xyz` | QuickNode | 25 rps | 100 |
| `https://rpc1.monad.xyz` / `wss://rpc1.monad.xyz` | Alchemy | 15 rps | 100 |
| `https://rpc2.monad.xyz` / `wss://rpc2.monad.xyz` | Goldsky Edge | 300/10s | 10 |
| `https://rpc3.monad.xyz` / `wss://rpc3.monad.xyz` | Ankr | 300/10s | 10 |

**Source:** docs.monad.xyz/developer-essentials/network-information

**Important Canonical Contracts:**

| Contract | Address |
|---|---|
| Wrapped MON (WMON) | `0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A` |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |
| Permit2 (Uniswap) | `0x000000000022d473030f116ddee9f6b43ac78ba3` |

**Source:** docs.monad.xyz/developer-essentials/network-information (Canonical Contracts section)

### 2.5 Important Developer Specifics

- **No global mempool** — Each validator maintains a local mempool. RPCs forward transactions to upcoming leaders. This doesn't affect smart contracts but impacts the bot's transaction submission strategy.
- **Reserve Balance** — A Monad-specific mechanism that imposes light restrictions on transaction inclusion at consensus time. Should not impact our flash loan use case.
- **Multicall3** — Deployed at the standard address. Allows aggregating multiple `eth_call` reads into a single RPC call. Essential for scanning prices across multiple DEXs simultaneously.
- **Batch RPC** — RPC calls can be batched. viem automatically handles `Promise.all()` as a batch.
- **Block finality** — For most applications, the "Voted" status is sufficient (speculative finality reversion is extremely rare). No need to wait for "Verified" in our use case.

**Source:** docs.monad.xyz/developer-essentials/summary, docs.monad.xyz/developer-essentials/best-practices

---

## 3. DeFi Ecosystem on Monad — Target DEXs

### 3.1 Live DEX Overview

The Monad ecosystem already has multiple DEXs with real liquidity and distinct pricing models. This diversity naturally creates exploitable price discrepancies.

| DEX | Type | Pricing Model | Est. TVL | Arbitrage Interest |
|---|---|---|---|---|
| **Uniswap V4** | AMM Singleton (concentrated liquidity) | x*y=k concentrated curve + hooks | ~$25-60M | Largest pool, price reference. Flash accounting via EIP-1153 |
| **Kuru** | Hybrid CLOB + AMM | Discrete-price order book | ~$1.5M+ | Exploitable bid/ask spreads, SDK available |
| **Curve Finance** | StableSwap AMM | Stablecoin-optimized curve (low slippage) | ~$1.5M+ | Arbitrage on stable pairs (USDC/USDT/AUSD) |
| **Trader Joe (LFJ)** | Liquidity Book | Fixed-price bins (zero slippage intra-bin) | Active | Unique model = frequent discrepancies with classic AMMs |
| **Clober** | On-chain CLOB | Gas-efficient order book | ~$1M+ | Second order book price source |
| **Ambient Finance** | Optimized AMM | Single-contract AMM with limit orders | Active | Yet another distinct price source |

**Sources:** blockworks.co (Monad TVL analysis), monad.xyz/ecosystem, docs.kuru.io, docs.uniswap.org

### 3.2 Why These Price Discrepancies Exist

Discrepancies between DEXs are structural and constantly renew:

- **Different pricing models** — An AMM (Uniswap) prices along a mathematical curve, a CLOB (Kuru) prices based on orders placed by market makers. Both converge but with a delay.
- **Liquidity fragmentation** — Liquidity is spread across 6+ protocols. A large trade on one doesn't immediately affect the others.
- **Arbitrage latency** — Even at 400ms per block, arbitrageurs are not yet as sophisticated as on Ethereum L1. The network is young (launched ~3 months ago).
- **Different fees** — Each DEX has different fee tiers (0.01%, 0.05%, 0.3%, 1%), creating distinct effective prices.

### 3.3 Uniswap V4 on Monad — Technical Details

Uniswap V4 uses a **Singleton** architecture: all pools are managed by a single `PoolManager.sol` contract. Advantages for our use case:

- **Flash accounting** via EIP-1153 (Transient Storage) — Balance changes are recorded in transient storage and netted. You only pay the final delta.
- **Multi-hop swaps** — No intermediate token transfers. Swap through multiple pools in a single transaction.
- **Native token support** (MON) without wrapping.

Uniswap V3 is also deployed on Monad with separate contracts (Factory, Router, individual Pools).

**Source:** docs.uniswap.org/contracts/v4/overview, docs.uniswap.org/contracts/v3/reference/deployments/monad-deployments

### 3.4 Kuru — Monad-Native CLOB DEX

Kuru is a full on-chain order book with:

- A TypeScript SDK: `@kuru-labs/kuru-sdk`
- Functions to read the L2 book (aggregated orderbook): `orderbook.getL2Book()`
- A cost estimator: `CostEstimator.estimateRequiredBaseForSell()`
- WebSocket events for real-time monitoring

**Source:** docs.kuru.io, github.com/Kuru-Labs/kuru-sdk

---

## 4. Project Architecture

### 4.1 Three-Layer Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 3 — FRONTEND                        │
│   React + Vite + Tailwind + D3.js + Framer Motion            │
│   Real-time dashboard: Radar, Live Feed, Price Matrix,       │
│   Profit Counter, History Chart                              │
│                          ▲                                   │
│                          │ WebSocket (ws/socket.io)          │
├─────────────────────────────────────────────────────────────┤
│                    LAYER 2 — BOT BACKEND                     │
│   TypeScript + viem/ethers.js                                │
│   Price scanner → Spread calculation → Flash loan trigger    │
│   → Event emission to frontend                              │
│                          ▲                                   │
│                          │ JSON-RPC / WebSocket              │
├─────────────────────────────────────────────────────────────┤
│                    LAYER 1 — SMART CONTRACTS                 │
│   Solidity (Foundry)                                         │
│   FlashAggregator.sol: Flash loan + Swap DEX A → DEX B      │
│   Events: ArbitrageExecuted, OpportunityDetected             │
│                          ▲                                   │
│                          │                                   │
├─────────────────────────────────────────────────────────────┤
│              MONAD MAINNET (Chain ID: 143)                    │
│   Uniswap V4 | Kuru | Curve | Trader Joe | Clober | Ambient │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

1. The **Bot** polls prices on each DEX every ~400ms (at each new block) via batched `eth_call` (Multicall3) or WebSocket subscriptions.
2. **Raw prices** are sent to the Frontend via WebSocket for display in the Price Matrix.
3. The Bot calculates **spreads** between all DEX pairs.
4. When a spread exceeds the profitability threshold → the Bot calls the **smart contract** `FlashAggregator`.
5. The smart contract executes the atomic flash loan + arbitrage and emits an `ArbitrageExecuted` **event**.
6. The Bot captures the event and sends it to the Frontend → **spectacular animation** (light particle, profit counter, etc.).

---

## 5. Technical Specifications — Layer 1: Smart Contracts

### 5.1 Main Contract: FlashAggregator.sol

**Objective:** Borrow tokens via flash loan, buy on the cheapest DEX, sell on the most expensive DEX, repay the loan, keep the profit.

```
FlashAggregator.sol
├── executeArbitrage(params)    // Main entry point
├── _swapOnUniswapV3(...)       // Swap via Uniswap V3 Router
├── _swapOnKuru(...)            // Swap via Kuru orderbook
├── _swapOnCurve(...)           // Swap via Curve pools
├── uniswapV3FlashCallback(...) // Flash loan callback
├── withdrawProfits()           // Profit withdrawal by owner
└── Events:
    ├── ArbitrageExecuted(token, amountBorrowed, profit, dexBuy, dexSell, timestamp)
    └── ArbitrageFailed(token, reason, timestamp)
```

### 5.2 Flash Loan Mechanism

**Chosen strategy: Uniswap V3 Flash Swap.**

Uniswap V3 pools allow borrowing any token from the pool and repaying it (with a 0.01-1% fee) within the same block. The flow:

1. Call `flash()` on a Uniswap V3 pool (e.g., WMON/USDC pool)
2. Receive borrowed tokens in the `uniswapV3FlashCallback`
3. Inside the callback: buy on DEX A (cheaper), receive tokens
4. Verify that amount received > amount borrowed + fee
5. Repay the Uniswap V3 pool
6. Keep the difference as profit

**Alternative (fallback):** If the flash loan is too complex to implement in 8 hours, we can do a simple arbitrage with own capital (swap on DEX A, reverse swap on DEX B) without a flash loan. The frontend and concept remain identical.

### 5.3 Priority Target Pairs

| Pair | Why | DEXs with Liquidity |
|---|---|---|
| WMON/USDC | Most liquid pair on Monad | Uniswap, Kuru, Curve, Trader Joe |
| WETH/USDC | Cross-chain asset, strong liquidity | Uniswap, Kuru, Ambient |
| WMON/WETH | Native Monad pair | Uniswap, Kuru |

### 5.4 Solidity Events

```solidity
event ArbitrageExecuted(
    address indexed token0,
    address indexed token1,
    uint256 amountBorrowed,
    uint256 profit,
    string dexBuy,
    string dexSell,
    uint256 executionTimeMs,
    uint256 blockNumber,
    uint256 timestamp
);

event OpportunityDetected(
    address indexed token0,
    address indexed token1,
    uint256 spreadBps,
    string dexLow,
    string dexHigh,
    uint256 timestamp
);
```

### 5.5 Tooling

- **Foundry** (forge, cast, anvil) for compilation, testing, and deployment
- **Solidity ^0.8.20**
- Deployment via `forge create` or `forge script` to Monad Mainnet (RPC: `https://rpc.monad.xyz`, Chain ID: 143)

---

## 6. Technical Specifications — Layer 2: Bot Backend

### 6.1 Responsibilities

1. **Scan prices** on each DEX at every block (~400ms)
2. **Calculate spreads** between all DEX combinations
3. **Trigger arbitrage** when a spread is profitable
4. **Listen to events** on-chain (ArbitrageExecuted)
5. **Stream data** to frontend via WebSocket

### 6.2 Price Reading

**Method 1 — Multicall (recommended):**

Use Multicall3 (`0xcA11bde05977b3631167028862bE2a173976CA11`) to batch price read calls on each DEX into a single `eth_call`. This reduces latency and the number of RPC requests.

```typescript
// viem pseudo-code
const results = await multicall({
  contracts: [
    { address: UNISWAP_QUOTER, abi: quoterABI, functionName: 'quoteExactInputSingle', args: [...] },
    { address: KURU_MARKET, abi: kuruABI, functionName: 'getL2Book', args: [] },
    { address: CURVE_POOL, abi: curveABI, functionName: 'get_dy', args: [...] },
    // ... etc for each DEX
  ]
});
```

**Method 2 — WebSocket subscription:**

Subscribe to new blocks via `wss://rpc.monad.xyz` and trigger the scan on each block. Can be combined with Method 1.

```typescript
const unwatch = publicClient.watchBlocks({
  onBlock: async (block) => {
    const prices = await scanAllDexPrices();
    const spreads = calculateSpreads(prices);
    broadcastToFrontend(prices, spreads);
    if (hasArbitrageOpportunity(spreads)) {
      await executeFlashLoan(spreads.bestOpportunity);
    }
  }
});
```

### 6.3 Spread Calculation

For each pair (e.g., WMON/USDC), the bot maintains a price table:

```typescript
interface DexPrice {
  dex: string;           // "uniswap_v4" | "kuru" | "curve" | ...
  pair: string;          // "WMON/USDC"
  price: number;         // Price in quote token (e.g., 1.0234 USDC per WMON)
  timestamp: number;     // Block timestamp
  liquidity: number;     // Available liquidity (optional)
}

// Spread = (maxPrice - minPrice) / minPrice * 10000 (in basis points)
// Profitable if spread > (feeDEX_A + feeDEX_B + flashLoanFee + gasCost)
```

### 6.4 Profitability Threshold

```
Minimum threshold = buyDEX_fee + sellDEX_fee + flashLoanFee + gasCost

Where:
- buyDEX_fee: 0.01% - 0.3% (depending on pool)
- sellDEX_fee: 0.01% - 0.3%
- flashLoanFee: 0.01% - 0.05% (Uniswap V3 flash)
- gasCost: ~$0.005 (nearly negligible on Monad)

→ Typical threshold: ~0.05% - 0.65% (5-65 bps) depending on pools
```

### 6.5 WebSocket Server

The bot exposes a WebSocket server (port 8080) that broadcasts:

```typescript
// Messages sent to frontend
type WSMessage =
  | { type: 'PRICES_UPDATE', data: DexPrice[] }
  | { type: 'SPREAD_UPDATE', data: SpreadInfo[] }
  | { type: 'OPPORTUNITY_DETECTED', data: Opportunity }
  | { type: 'ARBITRAGE_EXECUTED', data: ArbitrageResult }
  | { type: 'ARBITRAGE_FAILED', data: FailureInfo }
  | { type: 'BLOCK_UPDATE', data: { number: number, timestamp: number } }
```

### 6.6 Tech Stack

- **Runtime:** Node.js / TypeScript
- **Blockchain:** `viem` (preferred for performance) or `ethers.js v6`
- **WebSocket server:** `ws` (lightweight) or `socket.io` (more features)
- **Config:** `.env` with private key, RPC URL, contract addresses

---

## 7. Technical Specifications — Layer 3: Frontend

### 7.1 Design Philosophy

The frontend is **the winning factor**. In a peer-judged hackathon, it's the visual demo that convinces. The design must be:

- **Dark mode** — Deep black/purple background (#0A0A1A), Monad purple accents (#836EF9)
- **Cinematic** — Smooth animations, particles, glow effects
- **Information-dense** — Lots of data displayed simultaneously (like a trading terminal)
- **Live** — Everything moves, everything pulses, nothing is static

### 7.2 Color Palette

| Element | Color | Hex |
|---|---|---|
| Primary background | Deep black | `#0A0A1A` |
| Secondary background | Dark purple | `#12121F` |
| Primary accent (Monad) | Purple | `#836EF9` |
| Secondary accent | Cyan | `#00E5FF` |
| Profit / Success | Neon green | `#00FF88` |
| Danger / Alert | Red | `#FF3366` |
| Opportunity | Orange | `#FF9F43` |
| Primary text | White | `#FFFFFF` |
| Secondary text | Light gray | `#8892A0` |
| Borders | Dark gray | `#1E1E32` |

### 7.3 Typography

- **Primary font:** `JetBrains Mono` (monospace, perfect for a trading terminal)
- **Heading font:** `Inter` (clean, modern)
- **Sizes:** 11px for data, 13px for text, 18-24px for headings

### 7.4 Screen Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  🟣 FlashScope              ⚡ Block #12,345,678  │  💰 $4,218.50  │
│                             🕐 400ms avg          │  ↑ 23 trades   │
├───────────────────────────────────┬─────────────────────────────────┤
│                                   │                                 │
│         ZONE 1 — RADAR            │       ZONE 2 — LIVE FEED       │
│     (Animated network graph)      │   (Real-time scrolling          │
│                                   │    event terminal)              │
│   [Uniswap]----[Kuru]            │                                 │
│       \       /    \              │   14:23:05 🔍 Scanning...      │
│        [Curve]    [Clober]        │   14:23:06 ⚡ Spread 0.76%     │
│       /       \    /              │   14:23:06 🚀 Flash loan!      │
│   [TJ/LFJ]---[Ambient]           │   14:23:06 ✅ +$380 profit     │
│                                   │                                 │
├───────────────────────────────────┴─────────────────────────────────┤
│                     ZONE 3 — PRICE MATRIX (Heatmap)                 │
│                                                                     │
│            │ Uniswap │  Kuru   │  Curve  │ Trader Joe │  Clober   │
│  WMON/USDC │ 1.0234  │ 1.0312↑ │ 1.0228  │  1.0241    │ 1.0298↑  │
│  WETH/USDC │ 2841.2  │ 2843.8↑ │ 2840.1↓ │  2845.2↑   │ 2842.0   │
│  WMON/WETH │ 0.000360│ 0.000362│ 0.000359│  0.000361  │ 0.000363↑│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.5 Zone 1 — Radar (Animated Network Graph)

**Component:** `<NetworkRadar />`
**Size:** ~50% of the left half of the screen
**Tech:** D3.js force-directed graph or `react-force-graph-2d`

**Description:**
A network graph showing DEXs as interconnected nodes. Each node represents a DEX, and connections represent tradable pairs between DEXs.

**Visual specifications:**

- **Nodes:** 40-60px diameter circles, with DEX logo/name in the center. Background: `#1E1E32`. Border: `#836EF9` (Monad purple). Subtle glow around each node (box-shadow).
- **Connections (edges):** Lines between nodes. Thickness and color change dynamically based on spread:
  - Spread < 0.05%: thin, dark green (`#1A3A2A`) — no opportunity
  - Spread 0.05-0.2%: medium, orange (`#FF9F43`) — interesting
  - Spread > 0.2%: thick, pulsing red (`#FF3366`) with glow animation — exploitable opportunity
- **Flash loan animation:** When an arbitrage is executed between two DEXs, a light particle (8px cyan circle `#00E5FF`) traverses the path from source DEX to destination DEX with a fading luminous trail. Animation duration: 800ms. On arrival, a mini radial burst.

### 7.6 Zone 2 — Live Feed (Terminal)

**Component:** `<LiveFeed />`
**Size:** ~50% of the right half of the screen
**Tech:** Div with overflow-y auto-scroll, CSS animations

**Description:**
A scrolling terminal-style feed that displays each bot action in real-time.

**Line format:**

```
[HH:MM:SS.mmm] [EMOJI] Message — Detail
```

**Line types:**

| Type | Emoji | Color | Example |
|---|---|---|---|
| Scan | 🔍 | `#8892A0` (gray) | `[14:23:05.412] 🔍 Scanning WMON/USDC across 6 DEXs...` |
| Spread detected | ⚡ | `#FF9F43` (orange) | `[14:23:05.814] ⚡ Spread: Uni $1.0234 → Kuru $1.0312 (0.76%)` |
| Flash loan launched | 🚀 | `#836EF9` (purple) | `[14:23:06.201] 🚀 Flash loan: Borrowed 50,000 USDC` |
| Success | ✅ | `#00FF88` (neon green) | `[14:23:06.412] ✅ +$380.00 profit — 1 block (400ms)` |
| Failure | ❌ | `#FF3366` (red) | `[14:23:07.100] ❌ Reverted: insufficient spread` |
| Block | 🟣 | `#836EF9` (dim purple) | `[14:23:06.000] 🟣 Block #12,345,679 — 847 txs` |

**Animations:**
- Each new line appears with a 200ms fade-in + slide-up
- Profit lines (✅) have a subtle green background flash that fades
- Auto-scrolls to bottom, but pauses scroll if user hovers the zone
- Maximum 200 lines in memory (oldest are removed)

### 7.7 Zone 3 — Price Matrix (Heatmap)

**Component:** `<PriceMatrix />`
**Size:** ~30% at the bottom of the screen (full width)
**Tech:** HTML/React table with conditional styling + CSS transitions

**Description:**
A real-time table showing prices for each token pair on each DEX, with heatmap color coding.

**Visual specifications:**

- **Headers:** Background `#12121F`, text `#8892A0`, font 11px uppercase
- **Cells:** Default background `#0A0A1A`, monospace font 13px
- **Dynamic heatmap:**
  - Cell with the LOWEST price for the row → subtle green background `rgba(0, 255, 136, 0.1)`, text `#00FF88`
  - Cell with the HIGHEST price for the row → subtle red background `rgba(255, 51, 102, 0.1)`, text `#FF3366`
  - Other cells → white text
- **Flash animation:** When an arbitrage is executed between two DEXs for a given pair, the two affected cells pulse with a purple glow for 1.5s (keyframe animation)
- **Arrows:** Small ↑/↓ arrow next to the price if the price increased/decreased compared to the previous scan

### 7.8 Top Banner — Profit Counter

**Component:** `<ProfitBanner />`
**Position:** Top bar, full width
**Tech:** react-countup or Framer Motion for counter animation

**Displayed elements:**

| Element | Position | Style |
|---|---|---|
| "FlashScope" logo + ⚡ icon | Left | Inter 20px bold, purple `#836EF9` |
| Current block number | Center-left | Mono 12px, gray, updates each block |
| Average block time | Center | Mono 12px, green if < 500ms |
| **Total cumulative profit** | **Right** | **Mono 28px bold, neon green `#00FF88`, rolling counter animation** |
| Number of arbitrages executed | Right (below profit) | Mono 12px, gray |

**Profit counter animation:**
When new profit arrives, the counter does an animated digit-by-digit "roll" (mechanical counter style), with a green flash and a slight scale-up (1.0 → 1.05 → 1.0) over 400ms.

### 7.9 Frontend Stack

- **Framework:** React 18 + Vite (fast HMR)
- **Styling:** Tailwind CSS (dark mode by default)
- **Animations:** Framer Motion (for transitions, counter, pulsations)
- **Network graph:** `react-force-graph-2d` or custom D3.js force simulation
- **Charts (optional):** recharts for mini spread sparkline
- **WebSocket client:** native `WebSocket` API or `socket.io-client`
- **Fonts:** Google Fonts — JetBrains Mono + Inter

---

## 8. Fallback Mode — Simulated Data

### 8.1 Why a Fallback

Risk #1 at the hackathon is the bot not finding an arbitrage opportunity live during the 2-3 minute pitch. Possible causes:

- Not enough liquidity on a DEX
- Spreads too thin at the moment of the pitch
- RPC issue / rate limit
- Bug in the smart contract

### 8.2 Implementation

The bot must be able to switch between two modes:

- **Live Mode** (`LIVE=true`) — Real blockchain data
- **Replay Mode** (`LIVE=false`) — Playback of pre-recorded data

In Replay Mode, the bot:
1. Reads a JSON file of historical data (recorded during testing phases)
2. Broadcasts it to the frontend via the same WebSocket, with the same message types
3. Simulates realistic delays (one event every 2-5 seconds)

The frontend doesn't know (and doesn't need to know) if the data is live or replay. It's transparent.

### 8.3 Data Recording

During development hours, the bot in Live Mode must log every event to a `data/replay.json` file:

```json
[
  { "time": 0, "type": "PRICES_UPDATE", "data": {} },
  { "time": 400, "type": "SPREAD_UPDATE", "data": {} },
  { "time": 2300, "type": "OPPORTUNITY_DETECTED", "data": {} },
  { "time": 2700, "type": "ARBITRAGE_EXECUTED", "data": {} }
]
```

---

## 9. Work Distribution (2 devs, 8 hours)

### 9.1 Roles

- **Dev A — "Backend/Blockchain"**: Smart contract + Bot + DEX integrations
- **Dev B — "Frontend/Design"**: React dashboard + animations + WebSocket client

### 9.2 Hour-by-Hour Schedule

| Hour | Dev A (Backend) | Dev B (Frontend) |
|---|---|---|
| **H0-H1** | Setup Foundry, scaffold FlashAggregator.sol, configure wallet + Monad RPC | Setup Vite + React + Tailwind, base layout, dark mode, component structure |
| **H1-H2** | Implement swap functions for Uniswap V3 (best documented), test via local fork | Implement `<ProfitBanner />` with animated counter, `<LiveFeed />` with auto-scroll and animations |
| **H2-H3** | Add flash loan callback, test full flow on fork, start Kuru integration | Implement `<PriceMatrix />` with dynamic heatmap, conditional styling, flash animations |
| **H3-H4** | Build the Bot: Multicall price scanner, spread calculation, WebSocket server | Implement `<NetworkRadar />` — D3/force-graph with DEX nodes, dynamic edges |
| **H4-H5** | Connect Bot → Smart Contract → Events. Test live on Monad Mainnet | Connect frontend to bot's WebSocket. Integrate live data into all components |
| **H5-H6** | Debug integration, add Replay mode, record test data | Add flash loan animations on Radar (particles), polish transitions |
| **H6-H7** | Optimize: add more DEXs, adjust thresholds, fix bugs | Final polish: responsive, glow effects, animation timing, sound effects (optional) |
| **H7-H8** | **TOGETHER**: Prepare the pitch. Test the end-to-end demo flow. Record solid replay data. Prepare the presentation script. |

### 9.3 Critical Milestones

| Hour | Milestone | Blocking? |
|---|---|---|
| H2 | Smart contract compiles and passes tests on local fork | Yes — without this, no flash loan. Fallback: simple swap without flash loan |
| H3 | Frontend has a complete layout with mocked data | Yes — this is the project's core |
| H5 | Bot + Frontend communicate via WebSocket with live data | Yes — without this, no live demo |
| H6 | Replay mode works with recorded data | Insurance — this is the safety net |
| H7 | End-to-end demo runs without crashes for 3 minutes | Yes — this is the pitch condition |

---

## 10. Pitch Script (2-3 minutes)

### 10.1 Structure

**[0:00-0:15] Hook**
"Monad has 6 live DEXs with completely different pricing models — AMMs, order books, stablecoin curves. Price discrepancies exist constantly. FlashScope finds them and exploits them in real-time."

**[0:15-0:45] Radar Demo**
Show the animated network graph. Point to connections changing color. "Look — this edge between Uniswap and Kuru just turned red. A 0.76% spread just appeared on WMON/USDC."

**[0:45-1:15] Flash Loan Demo**
The Live Feed scrolls. "Our bot detected it, it launches a flash loan — borrows 50,000 USDC, buys WMON on Uniswap where it's cheaper, sells on Kuru where it's more expensive, repays the loan. All in a single transaction."

**[1:15-1:35] The "Wow" Moment**
The profit counter increases. The particle traverses the Radar. "$380 profit. In 400 milliseconds. With zero initial capital."

**[1:35-2:00] Price Matrix**
"Here you can see prices diverging and converging in real-time. Green is the cheapest DEX, red is the most expensive. Our bot monitors these discrepancies 24/7."

**[2:00-2:30] Closing Statement**
"FlashScope is possible only because of Monad. On Ethereum, a block takes 12 seconds — this spread would have disappeared before it was even detected. On Monad, 400ms per block, near-zero gas — it's the perfect infrastructure for on-chain high-frequency trading. Thank you."

### 10.2 Pitch Tips

- Start the bot **before** beginning to speak — animations running in the background
- **Never** show code during the pitch — only the dashboard
- If a flash loan executes live during the pitch → react naturally, it's the best moment
- Keep Replay mode ready as a backup hotkey (e.g., press 'R' to switch)

---

## 11. Risks and Mitigations

| # | Risk | Impact | Probability | Mitigation |
|---|---|---|---|---|
| 1 | No profitable spread during pitch | Bot does nothing live, flat demo | Medium | Replay mode with pre-recorded data (Section 8) |
| 2 | Flash loan too complex to implement in 8h | No flash loan, "just" a classic arbitrager | Medium | Fallback: simple buy/sell swap with own capital. Frontend stays identical |
| 3 | RPC rate limit (25 rps on QuickNode) | Bot can't scan fast enough | Low | Use Multicall3 to batch reads. Alternate between the 4 public RPCs |
| 4 | Liquidity issue on a minor DEX | Slippage too high, trade not profitable | Low | Focus on Uniswap + Kuru (the 2 most liquid). Add others if time permits |
| 5 | Frontend bug crashing the demo | White screen in front of judges | Low | Test demo flow 3+ times before pitch. Have a static build backup |
| 6 | Not enough MON for gas | Unable to submit transactions | Medium | Prepare MON in advance. Last resort: demonstrate detection only (not execution) + Replay mode |
| 7 | WebSocket disconnection | Frontend freezes, no live data | Low | Auto-reconnect on client side with exponential backoff |

---

## 12. Success Criteria

### 12.1 Must Have (without these, no pitch)

- [ ] Frontend runs without crashes for 3+ minutes
- [ ] Data displayed in real-time (live or replay)
- [ ] At least 3 functional zones (Radar, Live Feed, Price Matrix)
- [ ] Visible and animated profit counter
- [ ] Polished dark mode, Monad palette respected

### 12.2 Should Have (significantly increases chances)

- [ ] Functional flash loan on Monad mainnet
- [ ] Live data (not just replay)
- [ ] Particle animation on Radar when flash loan executes
- [ ] At least 3 DEXs integrated in price scanner
- [ ] Replay mode as backup

### 12.3 Nice to Have (polish)

- [ ] Subtle sound effect on profit ("cha-ching" or electronic beep)
- [ ] Mini sparkline chart of historical spreads (last 5 min)
- [ ] 5+ DEXs integrated
- [ ] Advanced statistics (total blocks scanned, hit rate, ROI)

---

## 13. Resources and Links

### Official Monad Documentation
- Docs: https://docs.monad.xyz/
- Network Info: https://docs.monad.xyz/developer-essentials/network-information
- Deployment Summary: https://docs.monad.xyz/developer-essentials/summary
- Best Practices: https://docs.monad.xyz/developer-essentials/best-practices
- Changelog: https://docs.monad.xyz/developer-essentials/changelog/releases
- MonadVision Explorer: https://monadvision.com
- Monadscan Explorer: https://monadscan.com

### DEXs & Protocols
- Uniswap V4 Docs: https://docs.uniswap.org/contracts/v4/overview
- Uniswap V3 Monad Deployments: https://docs.uniswap.org/contracts/v3/reference/deployments/monad-deployments
- Kuru Docs: https://docs.kuru.io/
- Kuru SDK GitHub: https://github.com/Kuru-Labs/kuru-sdk
- Monad Ecosystem Directory: https://www.monad.xyz/ecosystem
- Monad Protocols Repo: https://github.com/monad-crypto/protocols

### Development Tools
- Foundry: https://getfoundry.sh
- viem: https://viem.sh
- Multicall3: https://www.multicall3.com/

### Hackathon
- Monad Blitz ETHDenver: https://luma.com/monad-blitz-ethdenver-2026
- Developer Discord: https://discord.gg/monaddev

---

*This document is the baseline for the FlashScope project at Monad Blitz ETHDenver 2026. All implementation decisions should reference it. Updated February 17, 2026.*
