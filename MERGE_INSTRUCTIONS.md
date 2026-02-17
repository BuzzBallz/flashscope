# MERGE INSTRUCTIONS — Backend + Frontend

## Pre-requisites
- Dev A has completed H5-H6 prompt (all WS message formats fixed)
- Dev A's summary report says "READY FOR MERGE: YES"
- Both devs are on their respective branches

## Step 1 — Dev A pushes backend fixes
```bash
# Dev A (bot branch)
cd /path/to/flashscope
git add -A
git commit -m "fix: align all WS message formats with shared/types.ts for frontend merge"
git push origin dev/bot
```

## Step 2 — Dev A merges bot branch into main
```bash
# Dev A
git checkout main
git pull origin main
git merge dev/bot
# Resolve any conflicts (unlikely — bot/ and contracts/ are isolated)
git push origin main
```

## Step 3 — Dev B merges frontend branch into main
```bash
# Dev B (frontend branch)
git checkout main
git pull origin main
git merge dev/frontend
# Resolve any conflicts — most likely in shared/types.ts
# If conflict in shared/types.ts: KEEP THE VERSION FROM main (which came from dev/bot)
# because Dev A just aligned the backend to match it
git push origin main
```

## Step 4 — Verify the merge
```bash
# Both devs pull main
git checkout main
git pull origin main

# Terminal 1 — Start backend
cd bot
npm install   # in case new deps
npx tsx src/index.ts
# Should see: 6 prices, spreads, arb execution

# Terminal 2 — Start frontend
cd frontend
npm install   # in case new deps
npm run dev
# Opens http://localhost:5173

# Terminal 3 — Watch raw WS (sanity check)
node -e "const ws=new(require('ws'))('ws://localhost:8080');ws.on('message',d=>console.log(JSON.parse(d.toString()).type))"
# Should see: PRICES_UPDATE, SPREAD_UPDATE, BLOCK_UPDATE, OPPORTUNITY_DETECTED, ARBITRAGE_EXECUTED
```

## Step 5 — Verify frontend displays real data
Open http://localhost:5173 and check:
- [ ] ProfitBanner shows "connected" status and block number
- [ ] PriceMatrix shows 6 DEX prices (not mock data)
- [ ] NetworkRadar shows spread visualization
- [ ] LiveFeed shows arbitrage events
- [ ] When an arb executes, it appears in the feed with tx hash

## If something breaks
- Press R in the frontend to toggle mock mode (fallback)
- Check browser console for WebSocket errors
- Check that bot terminal shows no crash
- Verify DexId values in bot output match "uniswap_v4", "curve", etc.

## Conflict Resolution Guide
| File | Likely Conflict? | Resolution |
|------|-----------------|------------|
| shared/types.ts | POSSIBLE | Keep main (dev/bot) version — it's the aligned one |
| package.json (root) | UNLIKELY | Merge both |
| bot/* | NO | Only dev/bot touched these |
| frontend/* | NO | Only dev/frontend touched these |
| contracts/* | NO | Only dev/bot touched these |
