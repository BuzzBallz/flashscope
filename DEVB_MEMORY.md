# Dev B — Frontend Memory & Checkpoints

## Your Identity
You are Dev B — "The Face". You build the cinematic dashboard that wins the hackathon.
The demo is peer-judged by other devs. Visual impact and polish win votes.

## Your Deliverables (by hour)

### H0-H1: Foundation ✅ when:
- [ ] Vite + React + TS project runs (`npm run dev`)
- [ ] Tailwind configured with custom color palette
- [ ] Google Fonts (JetBrains Mono + Inter) loaded
- [ ] Base grid layout renders in dark mode (#0A0A1A background)
- [ ] shared/types.ts copied to src/shared/

### H1-H2: Banner + Feed ✅ when:
- [ ] ProfitBanner shows logo, block info placeholder, animated profit counter
- [ ] Profit counter animates with rolling digits (Framer Motion)
- [ ] LiveFeed scrolls with mock events, color-coded, auto-scroll
- [ ] LiveFeed pauses on hover

### H2-H3: PriceMatrix ✅ when: (⚠️ CRITICAL — must look good with mock data)
- [ ] Table renders 3 rows (pairs) × 6 columns (DEXs)
- [ ] Lowest price per row highlighted green
- [ ] Highest price per row highlighted red
- [ ] Prices update with mock data every 2 seconds
- [ ] Purple glow flash animation on arbitrage cells

### H3-H4: NetworkRadar ✅ when:
- [ ] 6 DEX nodes visible in force graph
- [ ] Edges between nodes, colored by spread intensity
- [ ] Nodes have labels and subtle pulse animation
- [ ] (Stretch) Particle animation on arbitrage events

### H4-H5: WebSocket ✅ when: (⚠️ CRITICAL — integration point)
- [ ] useWebSocket hook connects to ws://localhost:8080
- [ ] Auto-reconnect with exponential backoff works
- [ ] Connection status indicator in ProfitBanner (green/red dot)
- [ ] Data flows from WebSocket → all 4 components
- [ ] Falls back to mock data when disconnected

### H5-H7: Polish ✅ when:
- [ ] Glow effects on profit events (CSS box-shadow)
- [ ] Smooth transitions on all data updates
- [ ] No visual glitches at 1920x1080
- [ ] Particle animation on NetworkRadar works
- [ ] 'R' key toggles mock/live mode
- [ ] Dashboard runs 3+ minutes without crash

## Component Priority (if running out of time)
1. 🔴 ProfitBanner — simple, high impact (rolling profit counter is the money shot)
2. 🔴 PriceMatrix — immediately readable, shows the data clearly
3. 🔴 LiveFeed — terminal aesthetic, creates sense of live activity
4. 🟡 NetworkRadar — hardest component, okay if simplified to static graph
5. 🟢 Particle animation — cherry on top, skip if pressed for time

## Fallback Decisions

| Situation | Trigger | Action |
|-----------|---------|--------|
| react-force-graph-2d not working | H3.5 and graph broken | Replace with simple CSS grid of 6 DEX cards with colored borders |
| Particle animation too complex | H4 and can't get it working | Skip particles, use glow pulse on nodes instead |
| WebSocket won't connect | H5 and backend not ready | Stay on mock data — it looks identical to the audience |
| Framer Motion fighting Tailwind | Any time | Use CSS @keyframes as fallback for animations |
| Performance issues with 400ms updates | Any time | Throttle updates to every 1-2 seconds client-side |

## Animation Cheat Sheet
```tsx
// Rolling number (profit counter)
<motion.span
  key={value}
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: -20, opacity: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  ${value.toLocaleString()}
</motion.span>

// Fade-in slide-up (new feed entry)
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
/>

// Glow pulse (arbitrage event)
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(131, 110, 249, 0.3); }
  50% { box-shadow: 0 0 20px rgba(131, 110, 249, 0.8); }
}
```

## Testing the Integration
```bash
# 1. Start the frontend (you)
cd frontend && npm run dev
# Opens http://localhost:5173 — should show mock data

# 2. Start the backend (Dev A)
cd bot && npm start
# WebSocket server starts on ws://localhost:8080

# 3. Frontend auto-detects connection
# Green dot appears in ProfitBanner
# Mock data replaced by real Monad data
# That's it — if types.ts matches, it just works
```
