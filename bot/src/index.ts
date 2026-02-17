import { createPublicClient, http, defineChain, formatEther } from "viem";
import { ENV, TOKENS, POOLS, ARBITRAGEUR, INFRA, CHAIN } from "./config.js";
import { startWSServer, stopWSServer } from "./ws-server.js";
import { startScanner, stopScanner } from "./scanner.js";

// Define Monad Testnet chain
const monadTestnet = defineChain({
  id: CHAIN.ID,
  name: CHAIN.NAME,
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [ENV.RPC_URL],
      webSocket: [ENV.WSS_URL],
    },
  },
  blockExplorers: {
    default: { name: "MonadVision", url: "https://testnet.monadvision.com" },
  },
});

async function main() {
  console.log("=== FlashScope Bot (TESTNET) ===");
  console.log(`Chain: ${CHAIN.NAME} (${CHAIN.ID})`);
  console.log(`Mode: ${ENV.MODE}`);
  console.log(`WS Port: ${ENV.WS_PORT}`);
  console.log(`RPC: ${ENV.RPC_URL}`);
  console.log("");

  console.log("--- Deployed Contracts ---");
  console.log(`WMON:            ${TOKENS.WMON}`);
  console.log(`MockUSDC:        ${TOKENS.USDC}`);
  console.log(`Arbitrageur:     ${ARBITRAGEUR}`);
  console.log(`Multicall3:      ${INFRA.MULTICALL3}`);
  console.log("");

  console.log("--- 6 DEX Pools ---");
  for (const pool of POOLS) {
    console.log(`  ${pool.name.padEnd(12)} ${pool.address} (seed: $${pool.seedPrice})`);
  }
  console.log("");

  // 1. Verify RPC connectivity
  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(ENV.RPC_URL),
  });

  try {
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`Connected to Monad Testnet! Latest block: ${blockNumber}`);
  } catch (err) {
    console.error("Failed to connect to Monad Testnet RPC:", err);
    process.exit(1);
  }

  // 2. Start WebSocket server
  startWSServer();

  // 3. Start price scanner (reads 6 pools every 2s, triggers executor when profitable)
  startScanner(2000);

  console.log("");
  console.log("FlashScope bot is running. Press Ctrl+C to stop.");
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  stopScanner();
  await stopWSServer();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  stopScanner();
  await stopWSServer();
  process.exit(0);
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
