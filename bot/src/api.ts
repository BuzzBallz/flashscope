import type { IncomingMessage, ServerResponse } from "http";
import {
  createPublicClient,
  createWalletClient,
  http as viemHttp,
  parseEther,
  parseUnits,
  defineChain,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ENV, TOKENS, POOLS, CHAIN } from "./config.js";

// --- Chain + clients (reused across requests) ---
const monad = defineChain({
  id: CHAIN.ID,
  name: CHAIN.NAME,
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [ENV.RPC_URL] } },
});

const account = ENV.PRIVATE_KEY
  ? privateKeyToAccount(ENV.PRIVATE_KEY as `0x${string}`)
  : null;

const publicClient = createPublicClient({
  chain: monad,
  transport: viemHttp(ENV.RPC_URL),
});

const walletClient =
  account
    ? createWalletClient({ account, chain: monad, transport: viemHttp(ENV.RPC_URL) })
    : null;

// --- ABI fragments (only what we need) ---
const ERC20_MINT_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const POOL_SWAP_ABI = [
  {
    name: "swap",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "minAmountOut", type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

// --- Helpers ---
function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function setCors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res: ServerResponse, status: number, data: any) {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// ============================================================
// POST /api/send-gas  — Send 0.5 MON to user wallet for gas
// Body: { address: "0x..." }
// ============================================================
async function handleSendGas(req: IncomingMessage, res: ServerResponse) {
  if (!walletClient || !account) return json(res, 500, { error: "No wallet configured" });

  const { address } = await parseBody(req);
  if (!address) return json(res, 400, { error: "Missing address" });

  try {
    const txHash = await walletClient.sendTransaction({
      to: address as Address,
      value: parseEther("0.5"),
    });
    console.log(`[API] Sent 0.5 MON to ${address}: ${txHash}`);
    json(res, 200, { txHash, amount: "0.5 MON" });
  } catch (err: any) {
    console.error("[API] send-gas error:", err.message);
    json(res, 500, { error: err.message });
  }
}

// ============================================================
// POST /api/mint-usdc  — Mint 10,000 MockUSDC to user wallet
// Body: { address: "0x..." }
// ============================================================
async function handleMintUsdc(req: IncomingMessage, res: ServerResponse) {
  if (!walletClient || !account) return json(res, 500, { error: "No wallet configured" });

  const { address } = await parseBody(req);
  if (!address) return json(res, 400, { error: "Missing address" });

  const amount = parseUnits("10000", 6); // 10,000 USDC (6 decimals)

  try {
    const txHash = await walletClient.writeContract({
      address: TOKENS.USDC as Address,
      abi: ERC20_MINT_ABI,
      functionName: "mint",
      args: [address as Address, amount],
    });
    console.log(`[API] Minted 10,000 USDC to ${address}: ${txHash}`);
    json(res, 200, { txHash, amount: "10000 USDC" });
  } catch (err: any) {
    console.error("[API] mint-usdc error:", err.message);
    json(res, 500, { error: err.message });
  }
}

// ============================================================
// POST /api/reset-prices  — Create price divergence for demo
// Swaps USDC→WMON on one pool to push its price up,
// creating a spread vs the other 5 pools for the scanner to detect.
// ============================================================
async function handleResetPrices(req: IncomingMessage, res: ServerResponse) {
  if (!walletClient || !account) return json(res, 500, { error: "No wallet configured" });

  try {
    // Pick Clober pool (highest seed price $22.45) — push it even higher
    const targetPool = POOLS.find((p) => p.dexId === "clober")!;
    const swapAmount = parseUnits("200", 6); // 200 USDC

    // 1. Mint USDC to deployer
    const mintTx = await walletClient.writeContract({
      address: TOKENS.USDC as Address,
      abi: ERC20_MINT_ABI,
      functionName: "mint",
      args: [account.address, swapAmount],
    });
    await publicClient.waitForTransactionReceipt({ hash: mintTx });
    console.log(`[API] Minted 200 USDC to deployer: ${mintTx}`);

    // 2. Approve USDC to target pool
    const approveTx = await walletClient.writeContract({
      address: TOKENS.USDC as Address,
      abi: ERC20_MINT_ABI,
      functionName: "approve",
      args: [targetPool.address as Address, swapAmount],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
    console.log(`[API] Approved USDC to ${targetPool.name}: ${approveTx}`);

    // 3. Swap USDC→WMON on target pool (pushes WMON price UP on that pool)
    const swapTx = await walletClient.writeContract({
      address: targetPool.address as Address,
      abi: POOL_SWAP_ABI,
      functionName: "swap",
      args: [TOKENS.USDC as Address, swapAmount, 0n],
    });
    await publicClient.waitForTransactionReceipt({ hash: swapTx });
    console.log(`[API] Swapped 200 USDC→WMON on ${targetPool.name}: ${swapTx}`);

    json(res, 200, {
      success: true,
      pool: targetPool.name,
      dexId: targetPool.dexId,
      action: "Swapped 200 USDC→WMON to create price divergence",
      txHash: swapTx,
    });
  } catch (err: any) {
    console.error("[API] reset-prices error:", err.message);
    json(res, 500, { error: err.message });
  }
}

// ============================================================
// Main HTTP router — called by the HTTP server in ws-server.ts
// ============================================================
export async function handleHttpRequest(
  req: IncomingMessage,
  res: ServerResponse
) {
  setCors(res);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || "";

  try {
    if (url === "/api/health" && req.method === "GET") {
      json(res, 200, { status: "ok", timestamp: Date.now() });
    } else if (url === "/api/send-gas" && req.method === "POST") {
      await handleSendGas(req, res);
    } else if (url === "/api/mint-usdc" && req.method === "POST") {
      await handleMintUsdc(req, res);
    } else if (url === "/api/reset-prices" && req.method === "POST") {
      await handleResetPrices(req, res);
    } else {
      json(res, 404, { error: "Not found" });
    }
  } catch (err: any) {
    console.error("[API] Unhandled error:", err.message);
    json(res, 500, { error: err.message });
  }
}
