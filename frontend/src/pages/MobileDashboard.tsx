import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { DEX_LIST, DEX_DISPLAY_NAMES, PAIRS, type PairId } from '../shared/types';
import CountUp from '../components/CountUp/CountUp';
import { gsap } from 'gsap';
import { BACKEND_URL } from '../lib/config';
import { useData } from '../contexts/DataContext';

const pixelFont: React.CSSProperties = { fontFamily: "'Press Start 2P', monospace" };

// Pixel art icon components
const PixelBolt = () => (
  <svg width="20" height="20" viewBox="0 0 7 7" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="0" width="3" height="1" fill="currentColor"/>
    <rect x="2" y="1" width="3" height="1" fill="currentColor"/>
    <rect x="1" y="2" width="5" height="1" fill="currentColor"/>
    <rect x="2" y="3" width="3" height="1" fill="currentColor"/>
    <rect x="1" y="4" width="3" height="1" fill="currentColor"/>
    <rect x="0" y="5" width="3" height="1" fill="currentColor"/>
    <rect x="0" y="6" width="2" height="1" fill="currentColor"/>
  </svg>
);

const PixelCircle = () => (
  <svg width="20" height="20" viewBox="0 0 7 7" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="0" width="3" height="1" fill="currentColor"/>
    <rect x="1" y="1" width="1" height="1" fill="currentColor"/>
    <rect x="5" y="1" width="1" height="1" fill="currentColor"/>
    <rect x="0" y="2" width="1" height="1" fill="currentColor"/>
    <rect x="6" y="2" width="1" height="1" fill="currentColor"/>
    <rect x="0" y="3" width="1" height="1" fill="currentColor"/>
    <rect x="3" y="3" width="1" height="1" fill="currentColor"/>
    <rect x="6" y="3" width="1" height="1" fill="currentColor"/>
    <rect x="0" y="4" width="1" height="1" fill="currentColor"/>
    <rect x="6" y="4" width="1" height="1" fill="currentColor"/>
    <rect x="1" y="5" width="1" height="1" fill="currentColor"/>
    <rect x="5" y="5" width="1" height="1" fill="currentColor"/>
    <rect x="2" y="6" width="3" height="1" fill="currentColor"/>
  </svg>
);

const PixelClock = () => (
  <svg width="20" height="20" viewBox="0 0 7 7" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="0" width="3" height="1" fill="currentColor"/>
    <rect x="1" y="1" width="1" height="1" fill="currentColor"/>
    <rect x="5" y="1" width="1" height="1" fill="currentColor"/>
    <rect x="0" y="2" width="1" height="1" fill="currentColor"/>
    <rect x="3" y="2" width="1" height="1" fill="currentColor"/>
    <rect x="6" y="2" width="1" height="1" fill="currentColor"/>
    <rect x="0" y="3" width="1" height="1" fill="currentColor"/>
    <rect x="3" y="3" width="2" height="1" fill="currentColor"/>
    <rect x="6" y="3" width="1" height="1" fill="currentColor"/>
    <rect x="0" y="4" width="1" height="1" fill="currentColor"/>
    <rect x="6" y="4" width="1" height="1" fill="currentColor"/>
    <rect x="1" y="5" width="1" height="1" fill="currentColor"/>
    <rect x="5" y="5" width="1" height="1" fill="currentColor"/>
    <rect x="2" y="6" width="3" height="1" fill="currentColor"/>
  </svg>
);

const PixelHome = () => (
  <svg width="20" height="20" viewBox="0 0 7 7" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="0" width="1" height="1" fill="currentColor"/>
    <rect x="2" y="1" width="3" height="1" fill="currentColor"/>
    <rect x="1" y="2" width="5" height="1" fill="currentColor"/>
    <rect x="0" y="3" width="7" height="1" fill="currentColor"/>
    <rect x="1" y="4" width="5" height="1" fill="currentColor"/>
    <rect x="1" y="5" width="2" height="1" fill="currentColor"/>
    <rect x="4" y="5" width="2" height="1" fill="currentColor"/>
    <rect x="1" y="6" width="2" height="1" fill="currentColor"/>
    <rect x="4" y="6" width="2" height="1" fill="currentColor"/>
  </svg>
);

const PixelGrid = () => (
  <svg width="20" height="20" viewBox="0 0 7 7" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="0"/>
    <rect x="0" y="0" width="2" height="2" fill="currentColor"/>
    <rect x="4" y="0" width="3" height="2" fill="currentColor"/>
    <rect x="0" y="4" width="2" height="3" fill="currentColor"/>
    <rect x="4" y="4" width="3" height="3" fill="currentColor"/>
    <rect x="0" y="3" width="7" height="1" fill="currentColor"/>
    <rect x="3" y="0" width="1" height="7" fill="currentColor"/>
  </svg>
);

const PixelRadar = () => (
  <svg width="20" height="20" viewBox="0 0 7 7" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="0" width="3" height="1" fill="currentColor"/>
    <rect x="1" y="1" width="1" height="1" fill="currentColor"/>
    <rect x="5" y="1" width="1" height="1" fill="currentColor"/>
    <rect x="0" y="2" width="1" height="3" fill="currentColor"/>
    <rect x="6" y="2" width="1" height="3" fill="currentColor"/>
    <rect x="2" y="2" width="1" height="1" fill="currentColor"/>
    <rect x="3" y="3" width="1" height="1" fill="currentColor"/>
    <rect x="1" y="5" width="1" height="1" fill="currentColor"/>
    <rect x="5" y="5" width="1" height="1" fill="currentColor"/>
    <rect x="2" y="6" width="3" height="1" fill="currentColor"/>
  </svg>
);

const FadeContent: React.FC<{
  children: React.ReactNode;
  duration?: number;
  blur?: boolean;
  delay?: number;
  className?: string;
  triggerKey?: string | number;
}> = ({ children, duration = 400, blur = false, delay = 0, className = '', triggerKey }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, {
      autoAlpha: 0,
      filter: blur ? 'blur(8px)' : 'blur(0px)'
    });
    gsap.to(el, {
      autoAlpha: 1,
      filter: 'blur(0px)',
      duration: duration / 1000,
      delay: delay / 1000,
      ease: 'power2.out'
    });
  }, [triggerKey, duration, blur, delay]);

  return (
    <div ref={ref} className={className} style={{ visibility: 'hidden' }}>
      {children}
    </div>
  );
};

interface MobileDashboardProps {
  isAutoMode: boolean;
  onModeChange: (auto: boolean) => void;
}

type EventType = 'ARB' | 'SWAP' | 'MISS';

interface MobileEvent {
  id: string;
  timestamp: string;
  type: EventType;
  message: string;
  profit?: string;
  pair: PairId;
  dexBuy: string;
  dexSell: string;
  spread: string;
  blockNumber: number;
  txHash: string;
  gas: string;
}

const generateRandomHash = () => {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

const generateMockEvent = (): MobileEvent => {
  const type: EventType = ['ARB', 'SWAP', 'MISS'][Math.floor(Math.random() * 3)] as EventType;
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  const dexBuy = DEX_DISPLAY_NAMES[DEX_LIST[Math.floor(Math.random() * DEX_LIST.length)]];
  const dexSell = DEX_DISPLAY_NAMES[DEX_LIST[Math.floor(Math.random() * DEX_LIST.length)]];
  const spreadBps = Math.floor(Math.random() * 100) + 20;
  const profitAmount = type === 'ARB' ? Math.floor(Math.random() * 500) + 50 : 0;

  const messages = {
    ARB: [`Arbitrage: ${pair} (${dexBuy} → ${dexSell})`, `Profit captured: ${pair}`, `Flash loan completed: ${pair}`],
    SWAP: [`Swap: ${pair}`, `Large trade: ${pair}`, `Pool rebalance: ${pair}`],
    MISS: ['Opportunity missed: low liquidity', 'Execution failed: high slippage', 'Gas spike: tx reverted']
  };

  return {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    type,
    message: messages[type][Math.floor(Math.random() * messages[type].length)],
    profit: type === 'ARB' ? `+$${profitAmount}` : undefined,
    pair,
    dexBuy,
    dexSell,
    spread: `${spreadBps} bps`,
    blockNumber: Math.floor(Math.random() * 100000) + 13400000,
    txHash: generateRandomHash(),
    gas: `${(Math.random() * 0.5 + 0.1).toFixed(4)} WMON`
  };
};

// HomeTab Component — Revolut style
interface HomeTabProps {
  totalProfit: number;
  prevProfit: number;
  events: MobileEvent[];
  onSelectEvent: (event: MobileEvent) => void;
  isAutoMode: boolean;
  onModeChange: (auto: boolean) => void;
  stats: { arb: number; missed: number; avg: number };
  statsTick: number;
}

const HomeTab = ({ totalProfit, prevProfit, events, onSelectEvent, isAutoMode, onModeChange, stats, statsTick }: HomeTabProps) => {
  const [showProfit, setShowProfit] = useState(true);

  const todayProfit = events
    .filter(e => e.type === 'ARB' && e.profit)
    .slice(0, 10)
    .reduce((sum, e) => sum + parseFloat(e.profit!.replace(/\+\$/, '')), 0);

  return (
    <div className="h-full flex flex-col bg-[#0A0A1A] overflow-y-auto">
      {/* Hero balance card */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        <p className="text-gray-500 text-[7px] uppercase tracking-widest mb-2" style={pixelFont}>Total Profit</p>
        <span
          className="text-3xl font-bold tabular-nums mb-1 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #8c00ff 50%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: "'Press Start 2P', monospace"
          }}
          onClick={() => setShowProfit(!showProfit)}
        >
          {showProfit ? (
            <>$<CountUp from={prevProfit} to={totalProfit} duration={0.6} separator="," /></>
          ) : '••••••'}
        </span>
        <p className="text-lime-400 text-[8px]" style={pixelFont}>+${todayProfit.toFixed(2)} today</p>

        {/* Quick stats row */}
        <div className="flex gap-4 mt-10 w-full">
          {[
            { label: 'ARB executed', value: stats.arb.toString(), color: 'text-lime-400' },
            { label: 'Missed', value: stats.missed.toString(), color: 'text-orange-400' },
            { label: 'Avg profit', value: `$${stats.avg}`, color: 'text-purple-400' }
          ].map((stat, i) => (
            <div key={stat.label} className="flex-1 bg-[#0D0D1F] border border-purple-600/20 rounded-2xl p-4 text-center">
              <FadeContent
                triggerKey={`${stat.label}-${statsTick}`}
                duration={300}
                blur={true}
                delay={i * 80}
              >
                <p className={`text-sm font-bold ${stat.color}`} style={pixelFont}>{stat.value}</p>
              </FadeContent>
              <p className="text-gray-600 text-[7px] mt-1" style={pixelFont}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons — Revolut style */}
        <div className="flex gap-6 mt-10">
          {[
            { label: 'Auto', icon: <PixelBolt />, active: isAutoMode, action: () => onModeChange(true) },
            { label: 'Manual', icon: <PixelCircle />, active: !isAutoMode, action: () => onModeChange(false) },
            { label: 'Replay', icon: <PixelClock />, active: false, action: () => {} }
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                btn.active
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40'
                  : 'bg-[#1A1A2E] text-gray-500'
              }`}>
                {btn.icon}
              </div>
              <span className={`text-[7px] ${btn.active ? 'text-purple-400' : 'text-gray-600'}`} style={pixelFont}>
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity — last 3 events only */}
      <div className="flex-1 px-6 pb-6">
        <p className="text-gray-600 text-[7px] uppercase tracking-widest mb-3" style={pixelFont}>Recent</p>
        <div className="space-y-2">
          {events.slice(0, 3).map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between bg-[#0D0D1F] rounded-xl px-4 py-3"
              onClick={() => onSelectEvent(event)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[7px] font-bold ${
                  event.type === 'ARB' ? 'bg-lime-900/50 text-lime-400' :
                  event.type === 'MISS' ? 'bg-orange-900/50 text-orange-400' :
                  'bg-purple-900/50 text-purple-400'
                }`} style={pixelFont}>{event.type}</div>
                <div>
                  <p className="text-white text-[8px]" style={pixelFont}>{event.pair}</p>
                  <p className="text-gray-600 text-[7px]" style={pixelFont}>{event.timestamp}</p>
                </div>
              </div>
              {event.profit && (
                <span className="text-lime-400 text-[8px] font-bold" style={pixelFont}>{event.profit}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// PairCard Component
interface PairCardProps {
  pair: PairId;
  realPrices?: Array<{ dex: string; price: number; }>;
}

const PairCard = ({ pair, realPrices }: PairCardProps) => {
  const [expanded, setExpanded] = useState(false);

  // Use real prices if available, otherwise fallback to mock
  const prices = realPrices && realPrices.length > 0 ? realPrices : DEX_LIST.map(dex => ({
    dex: DEX_DISPLAY_NAMES[dex],
    price: pair === 'WMON/USDC' ? 22.0 : pair === 'WETH/USDC' ? 2841.0 : 0.00036
  }));

  const minPrice = Math.min(...prices.map(p => p.price));
  const maxPrice = Math.max(...prices.map(p => p.price));
  const spread = ((maxPrice - minPrice) / minPrice * 100).toFixed(2);
  const buyDex = prices.find(p => p.price === minPrice)?.dex || 'Uniswap V4';
  const sellDex = prices.find(p => p.price === maxPrice)?.dex || 'Kuru';

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="bg-[#0D0D1F] border border-purple-600/30 rounded-lg p-4"
    >
      <div className="flex justify-between items-center">
        <span className="text-white font-bold text-[8px]" style={pixelFont}>{pair}</span>
        <span className="text-lime-400 text-[8px]" style={pixelFont}>+{spread}%</span>
      </div>
      <div className="flex gap-4 mt-2 text-[7px]">
        <span className="text-gray-500" style={pixelFont}>
          Buy: <span className="text-lime-400">{buyDex}</span>
        </span>
        <span className="text-gray-500" style={pixelFont}>
          Sell: <span className="text-orange-400">{sellDex}</span>
        </span>
      </div>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-3 space-y-1 border-t border-purple-600/20 pt-3"
        >
          {prices.map(({ dex, price }) => (
            <div key={dex} className="flex justify-between text-[7px]">
              <span className="text-gray-500" style={pixelFont}>{dex}</span>
              <span className="text-white" style={pixelFont}>
                {pair === 'WMON/WETH' ? price.toFixed(6) : price.toFixed(4)}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

// MatrixTab Component — card style with real backend prices
interface MatrixTabProps {
  backendPrices: any[];
}

const MatrixTab = ({ backendPrices }: MatrixTabProps) => {
  // Convert backend price format to PairCard format
  const getPricesForPair = (pair: PairId) => {
    if (!backendPrices || backendPrices.length === 0) return undefined;

    // Filter prices for this specific pair
    const pairPrices = backendPrices
      .filter(p => p.pair === pair)
      .map(p => ({
        dex: DEX_DISPLAY_NAMES[p.dex as keyof typeof DEX_DISPLAY_NAMES] || p.dex,
        price: p.price
      }));

    return pairPrices.length > 0 ? pairPrices : undefined;
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-3">
      <p className="text-gray-600 text-[7px] uppercase tracking-widest mb-2" style={pixelFont}>
        Live Prices {backendPrices && backendPrices.length > 0 && <span className="text-lime-400">● LIVE</span>}
      </p>
      {PAIRS.map((pair) => (
        <PairCard key={pair} pair={pair} realPrices={getPricesForPair(pair)} />
      ))}
    </div>
  );
};

// RadarTab Component — DEX health cards
const RadarTab = () => {
  const dexData = [
    { name: 'Uniswap V4', spread: 12, tvl: '$42M', status: 'calm' },
    { name: 'Kuru', spread: 67, tvl: '$1.5M', status: 'arb' },
    { name: 'Curve', spread: 8, tvl: '$1.5M', status: 'calm' },
    { name: 'Trader Joe', spread: 34, tvl: '$900K', status: 'active' },
    { name: 'Clober', spread: 21, tvl: '$1M', status: 'active' },
    { name: 'Ambient', spread: 5, tvl: '$700K', status: 'calm' }
  ];

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <p className="text-gray-600 text-[7px] uppercase tracking-widest mb-3" style={pixelFont}>DEX Network</p>
      <div className="grid grid-cols-2 gap-3">
        {dexData.map(dex => (
          <motion.div
            key={dex.name}
            whileTap={{ scale: 0.97 }}
            className="bg-[#0D0D1F] border border-purple-600/20 rounded-2xl p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-white text-[8px] font-bold" style={pixelFont}>{dex.name}</span>
              <span className={`h-2 w-2 rounded-full ${
                dex.status === 'arb' ? 'bg-orange-400' :
                dex.status === 'active' ? 'bg-cyan-400' :
                'bg-lime-400'
              }`} />
            </div>
            <p className="text-gray-600 text-[7px]" style={pixelFont}>Spread</p>
            <p className={`text-sm font-bold ${
              dex.spread > 50 ? 'text-orange-400' :
              dex.spread > 20 ? 'text-cyan-400' :
              'text-lime-400'
            }`} style={pixelFont}>{dex.spread} bps</p>
            <p className="text-gray-600 text-[7px] mt-1" style={pixelFont}>TVL <span className="text-gray-400">{dex.tvl}</span></p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Main MobileDashboard Component
export default function MobileDashboard({ isAutoMode, onModeChange }: MobileDashboardProps) {
  const { address, isConnected } = useAccount();
  const { prices, connectionStatus, lastArbitrage } = useData();
  const [activeTab, setActiveTab] = useState<'home' | 'matrix' | 'radar'>('home');
  const [events, setEvents] = useState<MobileEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MobileEvent | null>(null);
  const [pendingArb, setPendingArb] = useState<MobileEvent | null>(null);
  const [totalProfit, setTotalProfit] = useState(0);
  const [prevProfit, setPrevProfit] = useState(0);
  const [stats, setStats] = useState({ arb: 0, missed: 0, avg: 0 });
  const [statsTick, setStatsTick] = useState(0);
  const [_totalProfitSum, setTotalProfitSum] = useState(0);
  const [gasSent, setGasSent] = useState(false);

  useEffect(() => {
    setPrevProfit(totalProfit);
  }, [totalProfit]);

  // Auto-send gas when wallet connects (once per address, persisted in localStorage)
  useEffect(() => {
    if (!isConnected || !address) return;

    // Check localStorage to prevent duplicate sends across refreshes
    const gasReceivedKey = `gas_received_${address.toLowerCase()}`;
    const alreadyReceived = localStorage.getItem(gasReceivedKey);

    if (alreadyReceived || gasSent) {
      console.log('[GAS] Already sent to this address, skipping');
      setGasSent(true);
      return;
    }

    const sendGas = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/send-gas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
        const data = await res.json();
        if (res.ok) {
          console.log('[GAS] Sent 0.5 MON:', data.txHash);
          setGasSent(true);
          // Mark this address as received in localStorage
          localStorage.setItem(gasReceivedKey, Date.now().toString());
        } else {
          console.error('[GAS] Error:', data.error);
        }
      } catch (err) {
        console.error('[GAS] Failed:', err);
      }
    };

    sendGas();
  }, [isConnected, address, gasSent]);

  // Update PnL when real arbitrage executes (fake profits for demo)
  useEffect(() => {
    if (!lastArbitrage) return;

    // Generate fake profit between $2-$8 for visual effect
    const fakeProfit = 2 + Math.random() * 6;

    console.log('[PROFIT] Real arb executed, adding fake profit:', fakeProfit);
    setTotalProfit((prev) => prev + fakeProfit);

    // Increment arb count
    setStats((prev) => ({
      ...prev,
      arb: prev.arb + 1,
      avg: prev.arb > 0 ? (prev.avg + fakeProfit) / 2 : fakeProfit
    }));

    // Add visual event to feed
    const arbEvent: MobileEvent = {
      id: Date.now().toString(),
      type: 'ARB',
      timestamp: new Date().toLocaleTimeString(),
      message: `Executed ${lastArbitrage.pair} arbitrage`,
      dexBuy: DEX_DISPLAY_NAMES[lastArbitrage.dexBuy] || 'Unknown',
      dexSell: DEX_DISPLAY_NAMES[lastArbitrage.dexSell] || 'Unknown',
      pair: lastArbitrage.pair,
      profit: `+$${fakeProfit.toFixed(2)}`,
      spread: '150bps',
      blockNumber: lastArbitrage.blockNumber,
      txHash: lastArbitrage.txHash,
      gas: '0.002 MON'
    };
    setEvents((prev) => [arbEvent, ...prev].slice(0, 100));
  }, [lastArbitrage]);

  // DISABLED: Stats interval (using real backend data instead)
  // useEffect(() => {
  //   if (!isAutoMode) return; // hard stop — no stat changes from interval in manual
  //   const interval = setInterval(() => {
  //     setStats(prev => ({
  //       ...prev,
  //       missed: prev.missed + (Math.random() > 0.7 ? 1 : 0),
  //       avg: prev.arb > 0 ? Math.floor(prev.avg * (1 + (Math.random() - 0.5) * 0.05)) : 0
  //     }));
  //     setStatsTick(t => t + 1);
  //   }, 3000);
  //   return () => clearInterval(interval);
  // }, [isAutoMode]);

  const _executeArbitrage = (event: MobileEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 100));
    if (event.profit) {
      const profitNum = parseFloat(event.profit.replace(/\+\$/, ''));
      setTotalProfit((prev) => prev + profitNum);
    }
    setPendingArb(null);
  };

  // Generate mock SWAP events for visual activity (no profit auto-increment)
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateMockEvent();

      // Only show SWAP events for visual activity
      // Profits will only update from real backend or manual triggers
      if (newEvent.type === 'SWAP') {
        setEvents((prev) => [newEvent, ...prev].slice(0, 100));
      }
    }, 3000); // Every 3 seconds for visual activity

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'home' as const, label: 'Home', icon: <PixelHome /> },
    { id: 'matrix' as const, label: 'Matrix', icon: <PixelGrid /> },
    { id: 'radar' as const, label: 'Radar', icon: <PixelRadar /> }
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0A1A] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-600/30 flex-shrink-0">
        <span className="font-bold text-white text-[8px]" style={pixelFont}>
          FlashScope
        </span>
        <div className="flex items-center gap-3">
          {/* Balance */}
          <span
            style={{
              background: 'linear-gradient(90deg, #ffffff 0%, #8c00ff 60%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: "'Press Start 2P', monospace",
              fontWeight: 'bold',
              fontSize: '10px'
            }}
          >
            ${totalProfit.toFixed(2)}
          </span>
          {/* Status dot */}
          <span className={`h-2 w-2 rounded-full ${isAutoMode ? 'bg-lime-400' : 'bg-orange-400'}`} />
        </div>
      </div>

      {/* Manual Mode Banner */}
      {!isAutoMode && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-900/20 border-b border-orange-600/30 flex-shrink-0">
          <span className="text-orange-400 text-[8px]" style={pixelFont}>
            MANUAL MODE — feed paused
          </span>
        </div>
      )}

      {/* Tab content — fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <HomeTab
                totalProfit={totalProfit}
                prevProfit={prevProfit}
                events={events}
                onSelectEvent={setSelectedEvent}
                isAutoMode={isAutoMode}
                onModeChange={onModeChange}
                stats={stats}
                statsTick={statsTick}
              />
            </motion.div>
          )}
          {activeTab === 'matrix' && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <MatrixTab backendPrices={prices} />
            </motion.div>
          )}
          {activeTab === 'radar' && (
            <motion.div
              key="radar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <RadarTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom tab bar */}
      <div className="flex-shrink-0 border-t border-purple-600/30 bg-[#0D0D1F]">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-t-2 border-purple-500'
                  : 'text-gray-600 border-t-2 border-transparent'
              }`}
            >
              {tab.icon}
              <span className="text-[6px]" style={pixelFont}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ARB Confirmation Bottom Sheet (Manual Mode) */}
      <AnimatePresence>
        {pendingArb && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-[#0D0D1F] border-t border-orange-600/40 rounded-t-2xl p-4"
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-orange-400 text-[8px] font-bold mb-2" style={pixelFont}>ARB Opportunity Detected</p>
                <p className="text-white text-[10px] font-bold" style={pixelFont}>{pendingArb.pair}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[8px]">
                <div>
                  <p className="text-gray-500 text-[7px]" style={pixelFont}>Profit</p>
                  <p className="text-lime-400 font-bold" style={pixelFont}>{pendingArb.profit}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[7px]" style={pixelFont}>Spread</p>
                  <p className="text-white" style={pixelFont}>{pendingArb.spread}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[7px]" style={pixelFont}>Buy on</p>
                  <p className="text-white" style={pixelFont}>{pendingArb.dexBuy}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[7px]" style={pixelFont}>Sell on</p>
                  <p className="text-white" style={pixelFont}>{pendingArb.dexSell}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStats(prev => ({ ...prev, missed: prev.missed + 1 }));
                    setStatsTick(t => t + 1);
                    setPendingArb(null);
                  }}
                  className="flex-1 bg-[#1A1A2E] text-gray-400 py-3 rounded-lg text-[7px] font-bold"
                  style={pixelFont}
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    // Add to feed
                    setEvents(prev => [pendingArb, ...prev].slice(0, 100));
                    // Update total profit
                    if (pendingArb.profit) {
                      const profitNum = parseFloat(pendingArb.profit.replace(/\+\$/, ''));
                      setTotalProfit(prev => prev + profitNum);
                    }
                    // Update stats with proper running average
                    const profit = parseFloat(pendingArb.profit?.replace(/[^0-9.]/g, '') || '0');
                    setTotalProfitSum(prev => {
                      const newTotal = prev + profit;
                      setStats(s => ({
                        ...s,
                        arb: s.arb + 1,
                        avg: Math.floor(newTotal / (s.arb + 1))
                      }));
                      setStatsTick(t => t + 1);
                      return newTotal;
                    });
                    setPendingArb(null);
                  }}
                  className="flex-1 bg-lime-600 text-white py-3 rounded-lg text-[7px] font-bold shadow-lg shadow-lime-600/40"
                  style={pixelFont}
                >
                  Execute
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom sheet for event details */}
      <AnimatePresence>
        {selectedEvent && !pendingArb && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-[#0D0D1F] border-t border-purple-600/40 rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto"
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

            {/* Close */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-gray-500 text-xl"
            >
              ✕
            </button>

            {/* Event details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[7px] font-bold px-2 py-1 rounded ${
                    selectedEvent.type === 'ARB'
                      ? 'bg-lime-900/50 text-lime-400'
                      : selectedEvent.type === 'MISS'
                      ? 'bg-orange-900/50 text-orange-400'
                      : 'bg-purple-900/50 text-purple-400'
                  }`}
                  style={pixelFont}
                >
                  {selectedEvent.type}
                </span>
                <span className="text-white font-bold text-[8px]" style={pixelFont}>{selectedEvent.pair}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[8px]">
                {selectedEvent.profit && (
                  <div>
                    <p className="text-gray-500 text-[7px]" style={pixelFont}>Profit</p>
                    <p className="text-lime-400" style={pixelFont}>{selectedEvent.profit}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 text-[7px]" style={pixelFont}>Spread</p>
                  <p className="text-white" style={pixelFont}>{selectedEvent.spread}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[7px]" style={pixelFont}>Buy on</p>
                  <p className="text-white" style={pixelFont}>{selectedEvent.dexBuy}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[7px]" style={pixelFont}>Sell on</p>
                  <p className="text-white" style={pixelFont}>{selectedEvent.dexSell}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[7px]" style={pixelFont}>Block</p>
                  <p className="text-white" style={pixelFont}>#{selectedEvent.blockNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[7px]" style={pixelFont}>Gas</p>
                  <p className="text-yellow-400" style={pixelFont}>{selectedEvent.gas}</p>
                </div>
              </div>

              <a
                href={`https://testnet.monadexplorer.com/tx/${selectedEvent.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-[7px] text-purple-400 underline mt-2"
                style={pixelFont}
              >
                View on MonadExplorer →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
