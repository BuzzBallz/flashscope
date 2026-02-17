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
  "kuru",
  "curve",
  "trader_joe",
  "clober",
  "ambient",
] as const;

export type DexId = (typeof DEX_LIST)[number];

export const DEX_DISPLAY_NAMES: Record<DexId, string> = {
  uniswap_v4: "Uniswap",
  kuru: "Kuru",
  curve: "Curve",
  trader_joe: "Trader Joe",
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
  price: number; // e.g. 1.0234
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

// --- WebSocket Connection Config ---
export const WS_PORT = 8080;
export const WS_URL = `ws://localhost:${WS_PORT}`;

// --- Mock Data for Frontend Development ---
// Dev B: use these to build and test the UI before the backend is ready.

export const MOCK_PRICES: DexPrice[] = [
  { dex: "uniswap_v4", pair: "WMON/USDC", price: 1.0234, timestamp: Date.now() },
  { dex: "kuru", pair: "WMON/USDC", price: 1.0312, timestamp: Date.now() },
  { dex: "curve", pair: "WMON/USDC", price: 1.0228, timestamp: Date.now() },
  { dex: "trader_joe", pair: "WMON/USDC", price: 1.0241, timestamp: Date.now() },
  { dex: "clober", pair: "WMON/USDC", price: 1.0298, timestamp: Date.now() },
  { dex: "ambient", pair: "WMON/USDC", price: 1.0245, timestamp: Date.now() },
  { dex: "uniswap_v4", pair: "WETH/USDC", price: 2841.2, timestamp: Date.now() },
  { dex: "kuru", pair: "WETH/USDC", price: 2843.8, timestamp: Date.now() },
  { dex: "curve", pair: "WETH/USDC", price: 2840.1, timestamp: Date.now() },
  { dex: "trader_joe", pair: "WETH/USDC", price: 2845.2, timestamp: Date.now() },
  { dex: "clober", pair: "WETH/USDC", price: 2842.0, timestamp: Date.now() },
  { dex: "ambient", pair: "WETH/USDC", price: 2841.8, timestamp: Date.now() },
  { dex: "uniswap_v4", pair: "WMON/WETH", price: 0.000360, timestamp: Date.now() },
  { dex: "kuru", pair: "WMON/WETH", price: 0.000362, timestamp: Date.now() },
  { dex: "curve", pair: "WMON/WETH", price: 0.000359, timestamp: Date.now() },
  { dex: "trader_joe", pair: "WMON/WETH", price: 0.000361, timestamp: Date.now() },
  { dex: "clober", pair: "WMON/WETH", price: 0.000363, timestamp: Date.now() },
  { dex: "ambient", pair: "WMON/WETH", price: 0.000360, timestamp: Date.now() },
];

export const MOCK_SPREADS: SpreadInfo[] = [
  { pair: "WMON/USDC", dexLow: "curve", dexHigh: "kuru", priceLow: 1.0228, priceHigh: 1.0312, spreadBps: 82, profitable: true },
  { pair: "WETH/USDC", dexLow: "curve", dexHigh: "trader_joe", priceLow: 2840.1, priceHigh: 2845.2, spreadBps: 18, profitable: false },
  { pair: "WMON/WETH", dexLow: "curve", dexHigh: "clober", priceLow: 0.000359, priceHigh: 0.000363, spreadBps: 111, profitable: true },
];

export const MOCK_ARBITRAGE: ArbitrageResult = {
  pair: "WMON/USDC",
  dexBuy: "curve",
  dexSell: "kuru",
  amountBorrowed: 50000,
  profit: 380.5,
  txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  blockNumber: 12345678,
  executionTimeMs: 412,
  timestamp: Date.now(),
  cumulativeProfit: 4218.5,
  tradeCount: 23,
};

export const MOCK_BLOCK: BlockInfo = {
  number: 12345678,
  timestamp: Date.now(),
  txCount: 847,
  avgBlockTimeMs: 402,
};
