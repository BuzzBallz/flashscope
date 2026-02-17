import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  formatUnits,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  ENV,
  CHAIN,
  TOKENS,
  INFRA,
  POOLS,
  ARBITRAGEUR,
  ARBITRAGEUR_ABI,
  type PoolConfig,
} from "./config.js";
import { broadcast } from "./ws-server.js";
import type { PairId } from "./shared/types.js";
import * as fs from "fs";
import * as path from "path";

// --- State ---
let isExecuting = false;
let lastExecutionTime = 0;
let cumulativeProfit = 0;
let tradeCount = 0;

const COOLDOWN_MS = 10_000; // 10s between executions
const BORROW_AMOUNT = 1n * 10n ** 18n; // 1 WMON per arb (low slippage for 500 WMON reserve pools)

// --- Chain + clients ---
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

const account = ENV.PRIVATE_KEY
  ? privateKeyToAccount(ENV.PRIVATE_KEY as `0x${string}`)
  : null;

const publicClient = createPublicClient({
  chain: monad,
  transport: http(ENV.RPC_URL),
});

const walletClient = account
  ? createWalletClient({
      account,
      chain: monad,
      transport: http(ENV.RPC_URL),
    })
  : null;

export interface ArbitrageOpportunity {
  cheapPool: PoolConfig;
  expensivePool: PoolConfig;
  spreadBps: number;
  priceLow: number;
  priceHigh: number;
}

/**
 * Called by scanner when a profitable spread is detected.
 * Non-blocking: if already executing or in cooldown, skips.
 */
export function tryExecuteArbitrage(opp: ArbitrageOpportunity): void {
  if (isExecuting) {
    return; // Already executing, skip
  }

  const now = Date.now();
  if (now - lastExecutionTime < COOLDOWN_MS) {
    return; // Cooldown active
  }

  // Fire and forget — don't block the scanner
  executeArbitrage(opp).catch((err) => {
    console.error("[EXEC] Unhandled error:", err.message);
  });
}

/**
 * Execute arbitrage: simulate via checkArbitrage, then send tx if profitable.
 */
async function executeArbitrage(opp: ArbitrageOpportunity): Promise<void> {
  if (!walletClient || !account) {
    console.error("[EXEC] No wallet configured — skipping execution");
    return;
  }

  isExecuting = true;
  const startTime = Date.now();

  try {
    // 3-pool approach: borrow from neutral pool, sell on expensive, buy on cheap
    const poolSell = opp.expensivePool.address as Address;
    const poolBuy = opp.cheapPool.address as Address;
    const borrowToken = TOKENS.WMON as Address;

    // Pick a borrow pool that is NOT the cheap or expensive pool
    const borrowPool = POOLS.find(
      (p) => p.address !== opp.cheapPool.address && p.address !== opp.expensivePool.address
    );
    if (!borrowPool) {
      console.error("[EXEC] No neutral borrow pool available");
      return;
    }
    const poolBorrow = borrowPool.address as Address;

    console.log(`[EXEC] 3-pool arb: borrow ${borrowPool.name}, sell ${opp.expensivePool.name} ($${opp.priceHigh.toFixed(4)}), buy ${opp.cheapPool.name} ($${opp.priceLow.toFixed(4)}) = ${opp.spreadBps}bps`);

    // Step 1: Simulate via checkArbitrage (free view call)
    const expectedProfit = await publicClient.readContract({
      address: ARBITRAGEUR as Address,
      abi: ARBITRAGEUR_ABI,
      functionName: "checkArbitrage",
      args: [poolBorrow, poolSell, poolBuy, borrowToken, BORROW_AMOUNT],
    });

    const profitBigInt = expectedProfit as bigint;

    if (profitBigInt <= 0n) {
      console.log(`[EXEC] Simulation says not profitable (${profitBigInt}), skipping`);
      isExecuting = false;
      return;
    }

    const profitWMON = Number(formatUnits(profitBigInt, 18));
    const profitUSD = profitWMON * opp.priceLow; // approximate USD value

    console.log(`[EXEC] Simulation profitable! Expected: ${profitWMON.toFixed(6)} WMON (~$${profitUSD.toFixed(4)}). Executing...`);

    // Step 2: Send transaction
    const txHash = await walletClient.writeContract({
      address: ARBITRAGEUR as Address,
      abi: ARBITRAGEUR_ABI,
      functionName: "executeArbitrage",
      args: [poolBorrow, poolSell, poolBuy, borrowToken, BORROW_AMOUNT],
    });

    console.log(`[EXEC] Tx sent: ${txHash}`);

    // Step 3: Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const executionTimeMs = Date.now() - startTime;
    lastExecutionTime = Date.now();

    if (receipt.status === "success") {
      tradeCount++;
      cumulativeProfit += profitUSD;

      const result = {
        pair: "WMON/USDC" as PairId,
        dexBuy: opp.cheapPool.dexId,
        dexSell: opp.expensivePool.dexId,
        amountBorrowed: Number(formatUnits(BORROW_AMOUNT, 18)),
        profit: profitUSD,
        txHash,
        blockNumber: Number(receipt.blockNumber),
        executionTimeMs,
        timestamp: Date.now(),
        cumulativeProfit,
        tradeCount,
      };

      broadcast({ type: "ARBITRAGE_EXECUTED", data: result });

      console.log(`[EXEC] ✅ SUCCESS — ${opp.cheapPool.name} → ${opp.expensivePool.name}, profit: ${profitWMON.toFixed(6)} WMON (~$${profitUSD.toFixed(4)}), tx: ${txHash}`);

      // Save to replay log
      appendToReplayLog({ type: "ARBITRAGE_EXECUTED", data: result });
    } else {
      const failure = {
        pair: "WMON/USDC" as PairId,
        dexBuy: opp.cheapPool.dexId,
        dexSell: opp.expensivePool.dexId,
        reason: "Transaction reverted",
        timestamp: Date.now(),
      };
      broadcast({ type: "ARBITRAGE_FAILED", data: failure });
      console.log(`[EXEC] ❌ FAILED — tx reverted: ${txHash}`);
      appendToReplayLog({ type: "ARBITRAGE_FAILED", data: failure });
    }
  } catch (err: any) {
    console.error(`[EXEC] Error:`, err.message);
    broadcast({
      type: "ARBITRAGE_FAILED",
      data: {
        pair: "WMON/USDC" as PairId,
        dexBuy: opp.cheapPool.dexId,
        dexSell: opp.expensivePool.dexId,
        reason: err.message,
        timestamp: Date.now(),
      },
    });
  } finally {
    isExecuting = false;
  }
}

/**
 * Append event to replay log for replay mode.
 */
function appendToReplayLog(event: any): void {
  try {
    const logDir = path.join(process.cwd(), "data");
    const logPath = path.join(logDir, "replay.json");

    let log: any[] = [];
    try {
      if (fs.existsSync(logPath)) {
        log = JSON.parse(fs.readFileSync(logPath, "utf-8"));
      }
    } catch {}

    log.push(event);
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  } catch (err: any) {
    console.error("[EXEC] Failed to write replay log:", err.message);
  }
}

export function getExecutorStats() {
  return { tradeCount, cumulativeProfit, isExecuting };
}
