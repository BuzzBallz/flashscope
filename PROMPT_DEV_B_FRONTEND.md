# PROMPT FOR DEV B — FRONTEND

Copy-paste this entire message into Claude Code along with the two attached files:
- `PRD_FlashScope_EN.md` (the full PRD)
- `shared/types.ts` (the WebSocket interface contract)

---

## PROMPT START

You are the frontend developer for FlashScope, a cinematic real-time dashboard for flash loan arbitrage on Monad blockchain. This is an 8-hour hackathon project (Monad Blitz @ ETHDenver 2026, $10K peer-judged prize).

Read the attached PRD (`PRD_FlashScope_EN.md`) for full context. Read `shared/types.ts` for the exact WebSocket message interface.

## YOUR ROLE

You are **Dev B — "The Face"**. You own the entire frontend. Your teammate (Dev A) is building the backend bot + smart contracts separately and will connect via WebSocket at ~H5.

## CRITICAL RULES

1. **The frontend is the winning factor.** This is peer-judged by other devs. The visual demo wins the vote, not the smart contract.
2. **Build with mock data first.** Use the `MOCK_*` constants from `shared/types.ts`. The real WebSocket connection comes later.
3. **Never modify `shared/types.ts`** without explicit sync with Dev A. This is the integration contract.
4. **Dark mode, cinematic, information-dense.** Think Bloomberg Terminal meets cyberpunk. See PRD Section 7 for exact specs.
5. **All code in English.** Comments, variables, component names — everything in English.

## TECH STACK (mandatory)

- React 18 + TypeScript + Vite
- Tailwind CSS (dark mode)
- Framer Motion (animations)
- `react-force-graph-2d` (network radar) OR custom D3.js
- Google Fonts: JetBrains Mono + Inter
- Native WebSocket API for backend connection

## PROJECT STRUCTURE

```
frontend/
├── src/
│   ├── App.tsx                    # Main layout (grid)
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Tailwind + custom CSS + fonts
│   ├── components/
│   │   ├── ProfitBanner.tsx       # Top bar: logo, block info, profit counter
│   │   ├── NetworkRadar.tsx       # Zone 1: animated DEX network graph
│   │   ├── LiveFeed.tsx           # Zone 2: scrolling terminal feed
│   │   └── PriceMatrix.tsx        # Zone 3: price heatmap table
│   ├── hooks/
│   │   ├── useWebSocket.ts        # WebSocket connection + reconnect
│   │   └── useMockData.ts         # Mock data generator for dev
│   ├── lib/
│   │   └── constants.ts           # Colors, config
│   └── shared/
│       └── types.ts               # SHARED — copy from root shared/types.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## STEP-BY-STEP BUILD ORDER

### Step 1 (H0-H1): Project Setup
- Initialize Vite + React + TS project
- Install dependencies: tailwindcss, framer-motion, react-force-graph-2d
- Configure Tailwind with custom colors from PRD Section 7.2
- Add Google Fonts (JetBrains Mono + Inter)
- Create the base grid layout in App.tsx (see PRD Section 7.4 for the layout)
- Copy `shared/types.ts` into `src/shared/`

### Step 2 (H1-H2): ProfitBanner + LiveFeed
- Build `<ProfitBanner />` — top bar with:
  - FlashScope logo (left)
  - Block number + avg block time (center)
  - Animated profit counter (right) — use Framer Motion `animate` for rolling digits
  - Trade count (right, below profit)
- Build `<LiveFeed />` — scrolling terminal:
  - Auto-scroll div with max 200 entries
  - Color-coded lines by type (see PRD Section 7.6)
  - Fade-in + slide-up animation on new entries
  - Pause scroll on hover
- Wire both to mock data (use `useMockData` hook that generates fake events every 1-3 seconds)

### Step 3 (H2-H3): PriceMatrix
- Build `<PriceMatrix />` — heatmap table:
  - Rows = token pairs (WMON/USDC, WETH/USDC, WMON/WETH)
  - Columns = DEXs (Uniswap, Kuru, Curve, Trader Joe, Clober, Ambient)
  - Green highlight on lowest price cell per row
  - Red highlight on highest price cell per row
  - ↑/↓ arrows showing price direction
  - Purple glow pulse animation when an arbitrage hits a cell pair
- Wire to `MOCK_PRICES` data, update every 2 seconds with slight random variations

### Step 4 (H3-H4): NetworkRadar
- Build `<NetworkRadar />` — the centerpiece:
  - 6 nodes (one per DEX) in a force-directed graph
  - Edges between all nodes, colored by spread intensity (green→orange→red)
  - When an arbitrage event fires: animate a cyan particle traveling from dexBuy node to dexSell node with a luminous trail (800ms)
  - Subtle ambient pulsing on all nodes
- This is the hardest component — prioritize getting nodes + edges working first, particle animation second

### Step 5 (H4-H5): WebSocket Integration
- Build `useWebSocket` hook:
  - Connects to `ws://localhost:8080`
  - Auto-reconnect with exponential backoff (1s, 2s, 4s, max 10s)
  - Parses incoming `WSMessage` and dispatches to a React context or zustand store
  - Connection status indicator (green dot = connected, red = disconnected) in ProfitBanner
- Replace mock data sources with WebSocket data
- Keep mock data as fallback when WebSocket is not connected

### Step 6 (H5-H7): Polish
- Glow effects (CSS box-shadow with color matching)
- Smooth transitions on all data updates (Framer Motion `AnimatePresence`)
- Sound effect on profit (optional — use Web Audio API, short "cha-ching" beep)
- Test at different screen sizes (target: 1920x1080 for the demo screen)
- Keyboard shortcut: press 'R' to toggle mock/replay mode (safety net for demo)

## COLOR PALETTE (use these exact values)

```typescript
export const COLORS = {
  bgPrimary: "#0A0A1A",
  bgSecondary: "#12121F",
  accentPurple: "#836EF9",
  accentCyan: "#00E5FF",
  profit: "#00FF88",
  danger: "#FF3366",
  opportunity: "#FF9F43",
  textPrimary: "#FFFFFF",
  textSecondary: "#8892A0",
  border: "#1E1E32",
} as const;
```

## MOCK DATA STRATEGY

Create a `useMockData()` hook that:
1. On mount, starts generating fake `WSMessage` events at random intervals (1-4 seconds)
2. Prices randomly fluctuate ±0.1-0.5% from MOCK_PRICES baselines
3. Every 8-15 seconds, generates an `OPPORTUNITY_DETECTED` followed by `ARBITRAGE_EXECUTED` 2 seconds later
4. Maintains running `cumulativeProfit` and `tradeCount` state
5. Can be toggled on/off (for when the real WebSocket connects)

This makes the dashboard come alive immediately during development, even before the backend exists.

## INTEGRATION WITH BACKEND

At ~H5, Dev A will have a WebSocket server running on `ws://localhost:8080` broadcasting real data in the exact same `WSMessage` format from `shared/types.ts`. 

The integration is simple:
1. Start the backend bot (`cd bot && npm start`)
2. The frontend `useWebSocket` hook auto-connects
3. Mock data automatically disabled when WebSocket is connected
4. That's it. If the types match, everything works.

## DELIVERABLE

By H7, the frontend must:
- Run without crashes for 3+ minutes
- Look visually stunning in dark mode
- Show animated data (live or mock) across all 4 zones
- Have a working WebSocket connection (or graceful fallback to mock)
- Be ready for the 2-3 minute demo pitch

Start building now. Begin with Step 1.
