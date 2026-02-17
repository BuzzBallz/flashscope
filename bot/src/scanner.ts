import {
  createPublicClient,
  http,
  defineChain,
  type PublicClient,
  type Address,
} from "viem";
import {
  ENV,
  CHAIN,
  POOLS,
  INFRA,
  SIMPLE_POOL_ABI,
} from "./config.js";
import { broadcast } from "./ws-server.js";
import { tryExecuteArbitrage } from "./executor.js";
import type {
  DexPrice,
  SpreadInfo,
  Opportunity,
  BlockInfo,
  PairId,
} from "./shared/types.js";

let client: PublicClient;
let scanInterval: ReturnType<typeof setInterval> | null = null;
let lastBlockNumber = 0n;
let blockTimes: number[] = [];

/**
 * Read getPrice() from all 6 custom SimplePool instances via multicall.
 * getPrice() = (reserve1 * 1e18) / reserve0
 * With USDC(6dec) as token1 and WMON(18dec) as token0:
 * Human price (USDC per WMON) = rawPrice / 1e6
 */
function rawPriceToHuman(rawPrice: bigint): number {
  return Number(rawPrice) / 1e6;
}

/**
 * Read prices from all 6 pools via a single multicall.
 */
async function readPoolPrices(): Promise<DexPrice[]> {
  const now = Date.now();
  const prices: DexPrice[] = [];

  const results = await client.multicall({
    contracts: POOLS.map((p) => ({
      address: p.address as Address,
      abi: SIMPLE_POOL_ABI,
      functionName: "getPrice",
    })),
    allowFailure: true,
  });

  for (let i = 0; i < POOLS.length; i++) {
    const pool = POOLS[i];
    const result = results[i];

    if (result.status === "failure") {
      console.error(`[SCAN] Failed to read ${pool.name}`);
      continue;
    }

    const rawPrice = result.result as bigint;
    if (rawPrice === 0n) continue;

    const price = rawPriceToHuman(rawPrice);

    prices.push({
      dex: pool.dexId,
      pair: "WMON/USDC" as PairId,
      price,
      timestamp: now,
    });
  }

  return prices;
}

/**
 * Compute the best spread across all pools.
 * Finds cheapest (buy) and most expensive (sell) pools.
 */
function computeSpreads(prices: DexPrice[]): SpreadInfo[] {
  if (prices.length < 2) return [];

  let low = prices[0];
  let high = prices[0];
  for (const p of prices) {
    if (p.price < low.price) low = p;
    if (p.price > high.price) high = p;
  }

  const spreadBps = Math.round(((high.price - low.price) / low.price) * 10000);
  return [{
    pair: "WMON/USDC" as PairId,
    dexLow: low.dex,
    dexHigh: high.dex,
    priceLow: low.price,
    priceHigh: high.price,
    spreadBps,
    profitable: spreadBps >= ENV.MIN_SPREAD_BPS,
  }];
}

/**
 * Track block updates.
 */
async function checkBlock(): Promise<void> {
  try {
    const block = await client.getBlock({ blockTag: "latest" });
    const blockNum = block.number;

    if (blockNum <= lastBlockNumber) return;

    if (lastBlockNumber > 0n) {
      blockTimes.push(Number(block.timestamp) * 1000);
      if (blockTimes.length > 20) blockTimes.shift();
    } else {
      blockTimes.push(Number(block.timestamp) * 1000);
    }

    lastBlockNumber = blockNum;

    let avgBlockTimeMs: number = CHAIN.BLOCK_TIME_MS;
    if (blockTimes.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < blockTimes.length; i++) {
        diffs.push(blockTimes[i] - blockTimes[i - 1]);
      }
      avgBlockTimeMs = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }

    const blockInfo: BlockInfo = {
      number: Number(blockNum),
      timestamp: Date.now(),
      txCount: block.transactions.length,
      avgBlockTimeMs,
    };

    broadcast({ type: "BLOCK_UPDATE", data: blockInfo });
  } catch {
    // Silently skip block errors
  }
}

/**
 * Single scan cycle: read prices from 6 pools, compute spreads, broadcast, trigger executor.
 */
async function scanCycle(): Promise<void> {
  try {
    const prices = await readPoolPrices();
    if (prices.length > 0) {
      broadcast({ type: "PRICES_UPDATE", data: prices });

      const spreads = computeSpreads(prices);
      if (spreads.length > 0) {
        broadcast({ type: "SPREAD_UPDATE", data: spreads });
      }

      // Log prices
      for (const p of prices) {
        const pool = POOLS.find((pp) => pp.dexId === p.dex);
        console.log(`[SCAN] ${p.pair} ${pool?.name || p.dex}: $${p.price.toFixed(4)}`);
      }

      // Log best spread
      for (const s of spreads) {
        const lowPool = POOLS.find((pp) => pp.dexId === s.dexLow);
        const highPool = POOLS.find((pp) => pp.dexId === s.dexHigh);
        console.log(
          `[SPREAD] Best: ${lowPool?.name} $${s.priceLow.toFixed(4)} → ${highPool?.name} $${s.priceHigh.toFixed(4)} = ${s.spreadBps}bps${s.profitable ? " *** PROFITABLE ***" : ""}`
        );

        // Broadcast opportunity + trigger executor if profitable
        if (s.profitable && lowPool && highPool) {
          const opp: Opportunity = {
            pair: "WMON/USDC" as PairId,
            dexBuy: lowPool.dexId,
            dexSell: highPool.dexId,
            priceBuy: s.priceLow,
            priceSell: s.priceHigh,
            spreadBps: s.spreadBps,
            estimatedProfit: 0, // estimated after simulation
            amountIn: 1, // 1 WMON borrow
          };
          broadcast({ type: "OPPORTUNITY_DETECTED", data: opp });

          tryExecuteArbitrage({
            cheapPool: lowPool,
            expensivePool: highPool,
            spreadBps: s.spreadBps,
            priceLow: s.priceLow,
            priceHigh: s.priceHigh,
          });
        }
      }
    }

    await checkBlock();
  } catch (err: any) {
    console.error("[SCAN] Error:", err.message);
  }
}

/**
 * Start the scanner loop.
 */
export function startScanner(intervalMs = 2000): void {
  const monad = defineChain({
    id: CHAIN.ID,
    name: CHAIN.NAME,
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: {
      default: {
        http: [ENV.RPC_URL],
        webSocket: [ENV.WSS_URL],
      },
    },
    contracts: {
      multicall3: {
        address: INFRA.MULTICALL3 as `0x${string}`,
      },
    },
  });

  client = createPublicClient({
    chain: monad,
    transport: http(ENV.RPC_URL),
    batch: { multicall: true },
  });

  console.log(`[SCAN] Starting scanner (interval: ${intervalMs}ms, pools: ${POOLS.length})`);
  for (const p of POOLS) {
    console.log(`[SCAN]   ${p.name}: ${p.address} (seed: $${p.seedPrice})`);
  }
  console.log(`[SCAN] Min spread threshold: ${ENV.MIN_SPREAD_BPS}bps`);

  scanCycle();
  scanInterval = setInterval(scanCycle, intervalMs);
}

/**
 * Stop the scanner.
 */
export function stopScanner(): void {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
    console.log("[SCAN] Scanner stopped");
  }
}
