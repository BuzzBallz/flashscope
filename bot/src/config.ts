import dotenv from "dotenv";
import type { DexId } from "./shared/types.js";
dotenv.config();

// --- Chain config (TESTNET) ---
export const CHAIN = {
  ID: 10143,
  NAME: "Monad Testnet",
  BLOCK_TIME_MS: 400,
} as const;

// --- Core Tokens (Testnet) ---
export const TOKENS = {
  WMON: "0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541" as const,
  USDC: "0xe8cc35BA27De935972d78348B9E43bF6F97c2444" as const, // MockUSDC, 6 decimals
} as const;

export const TOKEN_DECIMALS: Record<string, number> = {
  [TOKENS.WMON]: 18,
  [TOKENS.USDC]: 6,
};

// --- Pool configuration (6 custom pools on Testnet) ---
export interface PoolConfig {
  address: string;
  name: string;
  dexId: DexId;
  seedPrice: number;
}

export const POOLS: PoolConfig[] = [
  { address: "0x73E6160f14f73EC12067A72C4dC8657227b221FD", name: "Uniswap V4",   dexId: "uniswap_v4",   seedPrice: 22.00 },
  { address: "0x247922B879fee545F20c6eb619917f614522f6bF", name: "Curve",         dexId: "curve",        seedPrice: 22.15 },
  { address: "0x8f34BbEB87ebe6C475ac0d91A991a58ddE020956", name: "Trader Joe",    dexId: "trader_joe",   seedPrice: 22.30 },
  { address: "0xA3B9BfE1C1839239390ab5377B6FfF2fc4C41C72", name: "Kuru",          dexId: "kuru",         seedPrice: 21.85 },
  { address: "0x584de30E891d7346f8720951961e29b19E16d4fd", name: "Clober",        dexId: "clober",       seedPrice: 22.45 },
  { address: "0xB116AD842aaDaea5dcD6eef42BdFD66D78cFD789", name: "Ambient",       dexId: "ambient",      seedPrice: 22.10 },
];

// --- FlashArbitrageur (Testnet — deployed) ---
export const ARBITRAGEUR = "0xa23b2844Fc4fCF15104994b105F152682554aFbF" as const;

// --- Infrastructure ---
export const INFRA = {
  MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11" as const,
} as const;

// --- Environment config ---
export const ENV = {
  PRIVATE_KEY: process.env.PRIVATE_KEY || "",
  RPC_URL: process.env.RPC_URL || "https://testnet-rpc.monad.xyz",
  WSS_URL: process.env.WSS_URL || "wss://testnet-rpc.monad.xyz",
  WS_PORT: parseInt(process.env.WS_PORT || "8080", 10),
  MODE: (process.env.MODE || "live") as "live" | "replay",
  MIN_SPREAD_BPS: parseInt(process.env.MIN_SPREAD_BPS || "50", 10),
} as const;

// --- RPC fallbacks (Testnet) ---
export const RPC_URLS = [
  "https://testnet-rpc.monad.xyz",
] as const;

// --- ABI fragments for our SimplePool ---
export const SIMPLE_POOL_ABI = [
  {
    name: "getPrice",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getReserves",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "_reserve0", type: "uint256" },
      { name: "_reserve1", type: "uint256" },
    ],
  },
  {
    name: "getAmountOut",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "amountIn", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "token0",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "token1",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

// --- ABI for FlashArbitrageur (3-pool: borrow, sell, buy) ---
export const ARBITRAGEUR_ABI = [
  {
    name: "checkArbitrage",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "poolBorrow", type: "address" },
      { name: "poolSell", type: "address" },
      { name: "poolBuy", type: "address" },
      { name: "borrowToken", type: "address" },
      { name: "borrowAmount", type: "uint256" },
    ],
    outputs: [{ name: "expectedProfit", type: "int256" }],
  },
  {
    name: "executeArbitrage",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "poolBorrow", type: "address" },
      { name: "poolSell", type: "address" },
      { name: "poolBuy", type: "address" },
      { name: "borrowToken", type: "address" },
      { name: "borrowAmount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
