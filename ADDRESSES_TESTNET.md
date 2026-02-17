# ADDRESSES_TESTNET.md — Monad Testnet (Chain 10143)
# ⚠️ TESTNET WAS RESET ON 2025-12-16 — ALL ADDRESSES REDEPLOYED

> This file replaces ADDRESSES.md for testnet development.
> Testnet reset info: https://docs.monad.xyz/developer-essentials/changelog/testnet#v0125-2025-12-16

## Network Config
| Parameter       | Value                                  |
|-----------------|----------------------------------------|
| Chain ID        | `10143`                                |
| Network Name    | Monad Testnet                          |
| Currency        | MON                                    |
| RPC (HTTP)      | `https://testnet-rpc.monad.xyz` (25 rps) |
| RPC (WSS)       | `wss://testnet-rpc.monad.xyz`          |
| RPC Alt 1       | `https://rpc.ankr.com/monad_testnet` (300/10s) |
| RPC Alt 2       | `https://rpc-testnet.monadinfra.com` (20 rps) |
| Block Explorer  | `https://testnet.monadvision.com`      |
| Explorer Alt    | `https://monad-testnet.socialscan.io`  |
| Faucet          | `https://faucet.monad.xyz`             |

## Tokens — VERIFIED ✅

| Token | Address (Testnet)                                | Decimals | Source |
|-------|--------------------------------------------------|----------|--------|
| WMON  | `0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541`    | 18       | Monad official docs (post-reset) |
| USDC  | `0xf817257fed379853cDe0fa4F97AB987181B1E5Ea`    | 6        | Socialscan (2M+ holders), Nabla |
| WETH  | `0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37`    | 18       | Nabla testnet contracts, Monadvision |

## Canonical Infrastructure — VERIFIED ✅

| Contract         | Address (Testnet)                                | Source |
|------------------|--------------------------------------------------|--------|
| Multicall3       | `0xcA11bde05977b3631167028862bE2a173976CA11`    | Monad official docs |
| Permit2          | `0x000000000022d473030f116ddee9f6b43ac78ba3`    | Monad official docs |

## Uniswap V3 — ⚠️ ADDRESSES NEED DISCOVERY

Uniswap V2 + V3 are confirmed live on Monad testnet (via Uniswap blog + GeckoTerminal pools).
However, **Uniswap docs only list mainnet addresses** (chain 143).
After the testnet reset (Dec 2025), V3 contracts were redeployed but addresses are NOT in official docs.

**Discovery strategy for H2-H3 prompt:**
1. Try the MAINNET V3 Factory address on testnet — it MAY be the same (CREATE2 deterministic deployment)
   - Mainnet Factory: `0x204faca1764b154221e35c0d20abb3c525710498`
2. If not, search testnet explorer for "UniswapV3Factory" verified contracts
3. Once factory is found, call `getPool(WMON, USDC, fee)` to discover pools

| Contract (V3)       | Mainnet Address (try on testnet)                  | Status |
|---------------------|---------------------------------------------------|--------|
| UniswapV3Factory    | `0x204faca1764b154221e35c0d20abb3c525710498`      | ❓ UNVERIFIED on testnet |
| QuoterV2            | `0x661e93cca42afacb172121ef892830ca3b70f08d`      | ❓ UNVERIFIED on testnet |
| SwapRouter02        | `0xfe31f71c1b106eac32f1a19239c9a9a72ddfb900`      | ❓ UNVERIFIED on testnet |

**IMPORTANT:** The prompt includes a verification script to check these on testnet RPC.

## LFJ / Trader Joe (Liquidity Book) — VERIFIED ✅

Source: https://developers.lfj.gg/deployment-addresses/monad_testnet

| Contract              | Address (Testnet)                                |
|-----------------------|--------------------------------------------------|
| Joe Aggregator        | `0x45A62B090DF48243F12A21897e7ed91863E2c86b`    |
| RouterLogic           | `0xB35033d71cF5E13cAB5eB8618260F94363Dff9Cf`    |
| LBFactory             | `0xb43120c4745967fa9b93E79C149E66B0f2D6Fe0c`    |
| LBRouter              | `0x18556DA13313f3532c54711497A8FedAC273220E`    |
| LBQuoter              | `0x9A550a522BBaDFB69019b0432800Ed17855A51C3`    |
| LBHooksLens           | `0x6124086b90ab910038e607aa1bdd67b284c31c98`    |
| LiquidityHelper       | `0xA5c68C9E55Dde3505e60c4B5eAe411e2977dfB35`    |

## Kuru — ⚠️ NEEDS DISCOVERY

Kuru is live on testnet (confirmed by multiple sources).
Contract addresses are NOT publicly documented in their docs.
**Discovery: visit https://kuru.io, open DevTools, inspect API calls for market contract addresses.**

## Pools — ❓ NEED DISCOVERY ON TESTNET

Unlike mainnet where we found WMON/USDC pools in fork tests, testnet pools must be rediscovered:

```solidity
// Discovery script — run in forge test with --fork-url https://testnet-rpc.monad.xyz
IUniswapV3Factory factory = IUniswapV3Factory(FACTORY_ADDRESS);
address pool500 = factory.getPool(WMON, USDC, 500);
address pool3000 = factory.getPool(WMON, USDC, 3000);
address pool10000 = factory.getPool(WMON, USDC, 10000);
```

## Comparison: Mainnet vs Testnet Addresses

| Item              | Mainnet (143)                                     | Testnet (10143)                                   |
|-------------------|---------------------------------------------------|---------------------------------------------------|
| WMON              | 0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A       | 0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541       |
| USDC              | 0x754704Bc059F8C67012fEd69BC8A327a5aafb603       | 0xf817257fed379853cDe0fa4F97AB987181B1E5Ea       |
| WETH              | 0xee8c0e9f1bffb4eb878d8f15f368a02a35481242       | 0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37       |
| Multicall3        | Same                                              | 0xcA11bde05977b3631167028862bE2a173976CA11       |
| Permit2           | Same                                              | 0x000000000022d473030f116ddee9f6b43ac78ba3       |
| V3 Factory        | 0x204faca1764b154221e35c0d20abb3c525710498       | ❓ Try same, needs verification                   |
