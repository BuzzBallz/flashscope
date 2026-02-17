# Dev A — Backend Memory & Checkpoints

## Your Identity
You are Dev A — "The Engine". You build the data pipeline that powers FlashScope.
Your output is the WebSocket server on port 8080 that broadcasts real Monad DEX data.

## Your Deliverables (by hour)

### H0-H1: Foundation ✅ when:
- [ ] Foundry project compiles (`forge build`)
- [ ] Bot project runs (`tsx src/index.ts` doesn't crash)
- [ ] Can read latest block number from Monad RPC
- [ ] FlashAggregator.sol has scaffold with events

### H1-H2: Smart Contract ✅ when:
- [ ] Uniswap V3 swap function works on fork test
- [ ] Flash loan callback implemented
- [ ] `forge test --fork-url https://rpc.monad.xyz` passes

### H2-H3: Deploy + Kuru ✅ when:
- [ ] Contract deployed to Monad Mainnet
- [ ] Kuru swap integration started
- [ ] At least one test tx on mainnet

### H3-H4: Bot Core ✅ when: (⚠️ CRITICAL MILESTONE)
- [ ] WebSocket server running on port 8080
- [ ] Price scanner reads from 2+ DEXs via Multicall
- [ ] Spread calculator outputs SpreadInfo[]
- [ ] Broadcasting PRICES_UPDATE, SPREAD_UPDATE, BLOCK_UPDATE

### H4-H5: Execution ✅ when:
- [ ] Bot detects opportunity → calls contract → broadcasts result
- [ ] ARBITRAGE_EXECUTED or ARBITRAGE_FAILED messages flowing
- [ ] Recording events to replay.json

### H5-H6: Integration ✅ when: (⚠️ CRITICAL MILESTONE)
- [ ] Frontend connects to ws://localhost:8080
- [ ] All 6 WSMessage types render correctly in frontend
- [ ] Replay mode works when MODE=replay

### H6-H7: Polish ✅ when:
- [ ] 3+ DEXs integrated
- [ ] replay.json has 3+ minutes of data with multiple arbitrage events
- [ ] No crashes in 5-minute continuous run

## Fallback Decisions

| Situation | Trigger | Action |
|-----------|---------|--------|
| Flash loan too complex | H2 and callback not working | Drop to simple swap (own capital) |
| Uniswap V3 contracts not found | H1 and can't find addresses | Use Uniswap V4 hooks or skip to Kuru only |
| Multicall failing | H3 and batched reads error | Fall back to sequential individual calls |
| No profitable spreads | H5 and spreads always < 5bps | Lower threshold for demo, or use replay mode |
| RPC rate limited | Any time, 429 errors | Rotate between rpc.monad.xyz, rpc2, rpc3 |
| Contract deployment fails | H3 and gas/nonce issues | Use cast with manual nonce, or run bot without contract (scanner-only mode) |

## Key Addresses to Discover
Before coding, you need to find these contract addresses on Monad (Chain ID 143):
- Uniswap V3/V4 Router, Quoter, Factory
- Kuru Market contracts for WMON/USDC pair
- USDC token address on Monad
- WETH token address on Monad

Use the Monad explorer (monadvision.com), Uniswap docs, and Kuru docs to find them.

## Testing Commands
```bash
# Test contract on Monad fork
cd contracts && forge test --fork-url https://rpc.monad.xyz -vvv

# Run bot in live mode
cd bot && MODE=live tsx src/index.ts

# Run bot in replay mode
cd bot && MODE=replay tsx src/index.ts

# Quick check: is WebSocket broadcasting?
websocat ws://localhost:8080
# OR in another terminal:
node -e "const ws = new (require('ws'))('ws://localhost:8080'); ws.on('message', d => console.log(JSON.parse(d.toString()).type))"
```
