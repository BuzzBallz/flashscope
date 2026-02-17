import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEX_LIST, DEX_DISPLAY_NAMES, PAIRS, type DexId, type PairId } from '../shared/types';

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

// FeedTab Component
interface FeedTabProps {
  events: MobileEvent[];
  onSelectEvent: (event: MobileEvent) => void;
}

const FeedTab = ({ events, onSelectEvent }: FeedTabProps) => (
  <div className="h-full overflow-y-auto">
    {events.map((event) => (
      <div
        key={event.id}
        onClick={() => onSelectEvent(event)}
        className="flex items-center gap-3 px-4 py-4 border-b border-purple-600/10 active:bg-purple-600/10"
      >
        <span
          className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${
            event.type === 'ARB'
              ? 'bg-lime-900/50 text-lime-400'
              : event.type === 'MISS'
              ? 'bg-orange-900/50 text-orange-400'
              : 'bg-purple-900/50 text-purple-400'
          }`}
        >
          {event.type}
        </span>
        <span className="text-gray-300 text-sm flex-1 truncate">{event.message}</span>
        {event.profit && (
          <span className="text-lime-400 font-mono text-sm flex-shrink-0">{event.profit}</span>
        )}
      </div>
    ))}
  </div>
);

// PairCard Component
interface PairCardProps {
  pair: PairId;
}

const PairCard = ({ pair }: PairCardProps) => {
  const [expanded, setExpanded] = useState(false);

  // Mock prices for each DEX
  const basePrices: Record<PairId, number> = {
    'WMON/USDC': 22.0,
    'WETH/USDC': 2841.0,
    'WMON/WETH': 0.00036
  };

  const basePrice = basePrices[pair];
  const prices = DEX_LIST.map(dex => ({
    dex: DEX_DISPLAY_NAMES[dex],
    price: basePrice * (1 + (Math.random() - 0.5) * 0.01)
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
        <span className="text-white font-bold font-mono">{pair}</span>
        <span className="text-lime-400 text-sm font-mono">+{spread}%</span>
      </div>
      <div className="flex gap-4 mt-2 text-xs">
        <span className="text-gray-500">
          Buy: <span className="text-lime-400">{buyDex}</span>
        </span>
        <span className="text-gray-500">
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
            <div key={dex} className="flex justify-between text-xs">
              <span className="text-gray-500">{dex}</span>
              <span className="text-white font-mono">
                {pair === 'WMON/WETH' ? price.toFixed(6) : price.toFixed(4)}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

// MatrixTab Component
const MatrixTab = () => (
  <div className="h-full overflow-y-auto px-4 py-3 space-y-3">
    {PAIRS.map((pair) => (
      <PairCard key={pair} pair={pair} />
    ))}
  </div>
);

// RadarTab Component
const RadarTab = () => {
  const dexInfo: Record<string, { type: string; tvl: string }> = {
    uniswap_v4: { type: 'AMM', tvl: '$25-60M' },
    kuru: { type: 'CLOB+AMM', tvl: '$1.5M+' },
    curve: { type: 'StableSwap', tvl: '$1.5M+' },
    trader_joe: { type: 'Liquidity Book', tvl: '$900K' },
    clober: { type: 'CLOB', tvl: '$1M+' },
    ambient: { type: 'AMM', tvl: '$700K' }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <p className="text-purple-400 text-xs font-mono uppercase tracking-widest mb-3">
        Network Status
      </p>
      <div className="grid grid-cols-2 gap-3">
        {DEX_LIST.map((dex) => {
          const spread = Math.floor(Math.random() * 50) + 10;
          const color = spread < 20 ? 'bg-lime-400' : spread < 40 ? 'bg-cyan-400' : 'bg-orange-400';

          return (
            <div key={dex} className="bg-[#0D0D1F] border border-purple-600/30 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-white text-sm font-bold block">
                    {DEX_DISPLAY_NAMES[dex]}
                  </span>
                  <span className="text-gray-500 text-xs">{dexInfo[dex].type}</span>
                </div>
                <span className={`h-2 w-2 rounded-full ${color} mt-1`} />
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-xs">
                  <span className="text-gray-500">TVL: </span>
                  <span className="text-white font-mono">{dexInfo[dex].tvl}</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">Spread: </span>
                  <span className="text-cyan-400 font-mono">{spread} bps</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main MobileDashboard Component
export default function MobileDashboard() {
  const [activeTab, setActiveTab] = useState<'feed' | 'matrix' | 'radar'>('feed');
  const [events, setEvents] = useState<MobileEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MobileEvent | null>(null);
  const [totalProfit, setTotalProfit] = useState(0);

  // Generate mock events
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateMockEvent();
      setEvents((prev) => [newEvent, ...prev].slice(0, 100));

      if (newEvent.type === 'ARB' && newEvent.profit) {
        const profitNum = parseFloat(newEvent.profit.replace(/\+\$/, ''));
        setTotalProfit((prev) => prev + profitNum);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'feed' as const, label: 'Feed', icon: '⚡' },
    { id: 'matrix' as const, label: 'Matrix', icon: '⊞' },
    { id: 'radar' as const, label: 'Radar', icon: '◎' }
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0A1A] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-600/30 flex-shrink-0">
        <span
          className="font-bold text-white text-base"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
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
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            ${totalProfit.toFixed(2)}
          </span>
          {/* Status dot */}
          <span className="h-2 w-2 rounded-full bg-orange-400" />
        </div>
      </div>

      {/* Tab content — fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <FeedTab events={events} onSelectEvent={setSelectedEvent} />
            </motion.div>
          )}
          {activeTab === 'matrix' && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <MatrixTab />
            </motion.div>
          )}
          {activeTab === 'radar' && (
            <motion.div
              key="radar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
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
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs font-mono">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom sheet for event details */}
      <AnimatePresence>
        {selectedEvent && (
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
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    selectedEvent.type === 'ARB'
                      ? 'bg-lime-900/50 text-lime-400'
                      : selectedEvent.type === 'MISS'
                      ? 'bg-orange-900/50 text-orange-400'
                      : 'bg-purple-900/50 text-purple-400'
                  }`}
                >
                  {selectedEvent.type}
                </span>
                <span className="text-white font-bold">{selectedEvent.pair}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedEvent.profit && (
                  <div>
                    <p className="text-gray-500 text-xs">Profit</p>
                    <p className="text-lime-400 font-mono">{selectedEvent.profit}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 text-xs">Spread</p>
                  <p className="text-white font-mono">{selectedEvent.spread}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Buy on</p>
                  <p className="text-white font-mono">{selectedEvent.dexBuy}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Sell on</p>
                  <p className="text-white font-mono">{selectedEvent.dexSell}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Block</p>
                  <p className="text-white font-mono">#{selectedEvent.blockNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Gas</p>
                  <p className="text-yellow-400 font-mono">{selectedEvent.gas}</p>
                </div>
              </div>

              <a
                href={`https://testnet.monadexplorer.com/tx/${selectedEvent.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-purple-400 underline mt-2"
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
