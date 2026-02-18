// ============================================================
// shared/types.ts — SHARED INTERFACE CONTRACT
// ============================================================
// CRITICAL: This file is the ONLY dependency between frontend
// and backend. Both sides MUST implement against these types.
// DO NOT modify without syncing with your teammate.
// ============================================================

// --- DEX Registry ---
export const DEX_LIST = [
  "uniswap_v4",
  "curve",
  "trader_joe",
  "kuru",
  "clober",
  "ambient",
] as const;

export type DexId = (typeof DEX_LIST)[number];

export const DEX_DISPLAY_NAMES: Record<DexId, string> = {
  uniswap_v4: "Uniswap V4",
  curve: "Curve",
  trader_joe: "Trader Joe",
  kuru: "Kuru",
  clober: "Clober",
  ambient: "Ambient",
};

// --- Token Pairs ---
export const PAIRS = ["WMON/USDC", "WETH/USDC", "WMON/WETH"] as const;
export type PairId = (typeof PAIRS)[number];

// --- WebSocket Message Types ---

export interface DexPrice {
  dex: DexId;
  pair: PairId;
  price: number; // e.g. 22.00
  timestamp: number; // unix ms
}

export interface SpreadInfo {
  pair: PairId;
  dexLow: DexId;
  dexHigh: DexId;
  priceLow: number;
  priceHigh: number;
  spreadBps: number; // basis points (e.g. 76 = 0.76%)
  profitable: boolean;
}

export interface Opportunity {
  pair: PairId;
  dexBuy: DexId;
  dexSell: DexId;
  priceBuy: number;
  priceSell: number;
  spreadBps: number;
  estimatedProfit: number; // in USD
  amountIn: number; // borrowed amount
  // Pool addresses for frontend tx construction (demo mode)
  poolBuy?: string;
  poolSell?: string;
  poolBorrow?: string;
  borrowToken?: string;
  borrowAmount?: string; // hex-encoded bigint
}

export interface ArbitrageResult {
  pair: PairId;
  dexBuy: DexId;
  dexSell: DexId;
  amountBorrowed: number;
  profit: number; // in USD
  txHash: string;
  blockNumber: number;
  executionTimeMs: number;
  timestamp: number;
  cumulativeProfit: number; // running total
  tradeCount: number; // running total
}

export interface FailureInfo {
  pair: PairId;
  dexBuy: DexId;
  dexSell: DexId;
  reason: string;
  timestamp: number;
}

export interface BlockInfo {
  number: number;
  timestamp: number;
  txCount: number;
  avgBlockTimeMs: number;
}

// --- THE WebSocket Message Union ---
// This is the ONLY thing that flows between backend and frontend.

export type WSMessage =
  | { type: "PRICES_UPDATE"; data: DexPrice[] }
  | { type: "SPREAD_UPDATE"; data: SpreadInfo[] }
  | { type: "OPPORTUNITY_DETECTED"; data: Opportunity }
  | { type: "ARBITRAGE_EXECUTED"; data: ArbitrageResult }
  | { type: "ARBITRAGE_FAILED"; data: FailureInfo }
  | { type: "BLOCK_UPDATE"; data: BlockInfo };

// --- Connection Config ---
export const WS_PORT = 8080;
export const WS_URL = `ws://localhost:${WS_PORT}`;
export const BACKEND_URL = `http://localhost:${WS_PORT}`;

// --- Mock Data for Frontend Development ---
// Dev B: use these to build and test the UI before the backend is ready.

export const MOCK_PRICES: DexPrice[] = [
  { dex: "uniswap_v4", pair: "WMON/USDC", price: 22.00, timestamp: Date.now() },
  { dex: "curve", pair: "WMON/USDC", price: 22.15, timestamp: Date.now() },
  { dex: "trader_joe", pair: "WMON/USDC", price: 22.30, timestamp: Date.now() },
  { dex: "kuru", pair: "WMON/USDC", price: 21.85, timestamp: Date.now() },
  { dex: "clober", pair: "WMON/USDC", price: 22.45, timestamp: Date.now() },
  { dex: "ambient", pair: "WMON/USDC", price: 22.10, timestamp: Date.now() },
];

export const MOCK_SPREADS: SpreadInfo[] = [
  { pair: "WMON/USDC", dexLow: "kuru", dexHigh: "clober", priceLow: 21.85, priceHigh: 22.45, spreadBps: 274, profitable: true },
];

export const MOCK_ARBITRAGE: ArbitrageResult = {
  pair: "WMON/USDC",
  dexBuy: "kuru",
  dexSell: "clober",
  amountBorrowed: 100,
  profit: 0.55,
  txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  blockNumber: 13473500,
  executionTimeMs: 412,
  timestamp: Date.now(),
  cumulativeProfit: 4.218,
  tradeCount: 5,
};

export const MOCK_BLOCK: BlockInfo = {
  number: 13473500,
  timestamp: Date.now(),
  txCount: 847,
  avgBlockTimeMs: 402,
};
