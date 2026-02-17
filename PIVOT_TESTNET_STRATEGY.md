# PIVOT TESTNET — FlashScope Strategic Plan

## Architecture Decision: TESTNET CUSTOM INFRA

### Why testnet despite no DEX infrastructure?
1. **Guaranteed demo** — Controlled spreads, arbitrage succeeds every time
2. **Audience interaction** — Judges/voters use their phone to see/create opportunities
3. **WOW factor** — "You just earned 50 USDC testnet thanks to our bot" → guaranteed votes
4. **Zero risk** — No dependency on live market, no "sorry the spread is 0 right now"

### What already exists (H2-H3 completed on mainnet)
- ✅ `bot/src/ws-server.ts` — WebSocket server port 8080
- ✅ `bot/src/scanner.ts` — Multicall price scanner (needs adaptation for custom pools)
- ✅ `bot/src/index.ts` — Boots WS + scanner
- ✅ `bot/src/config.ts` — Structure in place (addresses need changing)
- ✅ `contracts/src/FlashAggregator.sol` — Flash loan arbitrage (5/5 tests pass)
- ✅ Frontend Dev B in progress

### What needs to be built
1. **MockUSDC.sol** — ERC20 mintable by anyone (for the audience)
2. **SimplePool.sol** — 2 instances with different prices (Pool A = 1.00, Pool B = 1.02+)
3. **Deploy script** — Deploys everything, seeds pools, configures bot
4. **Adapt scanner.ts** — Read our custom pools instead of Uniswap V3
5. **Adapt FlashAggregator.sol** — Swap on our custom AMM

### Estimated gas budget (5000 MON testnet)
| Action | Est. Gas | Est. MON |
|--------|----------|----------|
| Deploy MockUSDC | ~1M gas | ~0.001 MON |
| Deploy SimplePool x2 | ~2M gas | ~0.002 MON |
| Deploy FlashArbitrageur | ~2M gas | ~0.002 MON |
| Seed Pool A (100K USDC + MON) | ~200K gas | ~0.0002 MON |
| Seed Pool B (100K USDC + MON) | ~200K gas | ~0.0002 MON |
| 1000 arbitrages during demo | ~500K gas | ~0.5 MON |
| **TOTAL** | | **< 1 MON** |

→ We use < 0.1% of our budget. Massive margin.

### Audience experience during pitch
1. Connect MetaMask to Monad testnet (QR code on slide)
2. Get MON from faucet
3. See the FlashScope dashboard live
4. Bot executes arbitrages in front of them → profits visible
5. Optional: they can trade on one pool and CREATE arbitrage opportunities the bot captures
