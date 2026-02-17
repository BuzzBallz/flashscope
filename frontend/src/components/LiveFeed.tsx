import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EventType } from '../types/local';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

// Inline DecryptedText component
interface DecryptedTextProps {
  text: string;
  animateOn?: 'view' | 'hover';
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  speed?: number;
  className?: string;
  encryptedClassName?: string;
}

const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  animateOn = 'view',
  sequential = true,
  revealDirection = 'start',
  speed = 40,
  className = '',
  encryptedClassName = 'text-purple-400',
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const chars = '!@#$%^&*()_+-={}[]|:;<>?,./~`';

  const decrypt = () => {
    if (isDecrypting) return;
    setIsDecrypting(true);

    const iterations = Math.ceil(text.length * 1.5);
    let iteration = 0;

    const interval = setInterval(() => {
      setDisplayText(() =>
        text
          .split('')
          .map((char, index) => {
            if (iteration > index) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      iteration += 1;

      if (iteration > text.length) {
        clearInterval(interval);
        setDisplayText(text);
        setIsDecrypting(false);
      }
    }, speed);

    timeoutRef.current.push(interval);
  };

  useEffect(() => {
    if (animateOn === 'view') {
      decrypt();
    }

    return () => {
      timeoutRef.current.forEach(clearTimeout);
    };
  }, [text]);

  const handleHover = () => {
    if (animateOn === 'hover') {
      decrypt();
    }
  };

  return (
    <span
      className={`${isDecrypting ? encryptedClassName : ''} ${className}`}
      onMouseEnter={handleHover}
    >
      {displayText || text}
    </span>
  );
};

type LiveEvent = {
  id: string;
  type: 'ARB' | 'SWAP' | 'MISS';
  pair: string;
  dexBuy: string;
  dexSell: string;
  spread: string;
  profit: string;
  gas: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  status: string;
  description: string;
};

const fadeInStyle: React.CSSProperties = {
  animation: 'fadeInBlur 0.4s ease-out forwards'
};

const EVENT_TYPES: EventType[] = ['ARB', 'SWAP', 'MISS'];
const DEX_NAMES = ['Uniswap V4', 'Kuru', 'Curve', 'Trader Joe', 'Clober', 'Ambient'];
const PAIRS = ['WMON/USDC', 'WETH/USDC', 'WMON/WETH'];

const getEventColor = (type: EventType) => {
  switch (type) {
    case 'ARB':
      return 'bg-lime-600 text-black';
    case 'SWAP':
      return 'bg-accent text-white';
    case 'MISS':
      return 'bg-orange-600 text-white';
  }
};

const generateRandomHash = () => {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

const generateMockEvent = (): LiveEvent => {
  const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const now = Date.now();
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  const dexBuy = DEX_NAMES[Math.floor(Math.random() * DEX_NAMES.length)];
  const dexSell = DEX_NAMES.filter(d => d !== dexBuy)[Math.floor(Math.random() * (DEX_NAMES.length - 1))];

  const spreadBps = type === 'ARB' ? Math.floor(Math.random() * 100) + 20 : Math.floor(Math.random() * 15) + 5;
  const profitAmount = type === 'ARB' ? Math.floor(Math.random() * 500) + 50 : Math.floor(Math.random() * 20);
  const gasAmount = (Math.random() * 0.5 + 0.1).toFixed(4);

  const descriptions = {
    ARB: [
      `Arbitrage executed: ${pair} (${dexBuy} → ${dexSell})`,
      `Profit captured: ${pair} spread`,
      `Flash loan completed: ${(spreadBps / 100).toFixed(1)}% spread on ${pair}`,
    ],
    SWAP: [
      `Swap detected: 50k USDC → WMON`,
      `Large trade: 100 WETH → USDC`,
      `Pool rebalance: ${dexBuy} ${pair}`,
    ],
    MISS: [
      'Opportunity missed: insufficient liquidity',
      'Execution failed: slippage too high',
      'Gas spike: transaction reverted',
    ],
  };

  const description = descriptions[type][Math.floor(Math.random() * descriptions[type].length)];

  const statuses = {
    ARB: ['Confirmed', 'Pending', 'Executed'],
    SWAP: ['Confirmed', 'Pending'],
    MISS: ['Failed', 'Reverted', 'Skipped'],
  };

  return {
    id: `${now}-${Math.random()}`,
    type,
    pair,
    dexBuy,
    dexSell,
    spread: `${spreadBps} bps`,
    profit: type === 'ARB' ? `+$${profitAmount}` : type === 'SWAP' ? `$${profitAmount}` : '$0',
    gas: `${gasAmount} WMON`,
    txHash: generateRandomHash(),
    blockNumber: Math.floor(Math.random() * 100000) + 1000000,
    timestamp: new Date(now).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    status: statuses[type][Math.floor(Math.random() * statuses[type].length)],
    description,
  };
};

interface LiveFeedProps {
  isAutoMode: boolean;
  onArbitrageExecuted: (profit: number) => void;
}

export default function LiveFeed({ isAutoMode, onArbitrageExecuted }: LiveFeedProps) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);
  const [pendingArb, setPendingArb] = useState<LiveEvent | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to parse profit from string (e.g., "+$150" -> 150)
  const parseProfit = (profitStr: string): number => {
    const match = profitStr.match(/\+?\$?(\d+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  useEffect(() => {
    // Pause generation while waiting for ARB confirmation in manual mode
    if (!isAutoMode && pendingArb) return;

    // Generate a new mock event every 1.5 seconds
    const interval = setInterval(() => {
      const newEvent = generateMockEvent();

      // In manual mode, ARB events require confirmation
      if (newEvent.type === 'ARB' && !isAutoMode) {
        setPendingArb(newEvent);
      } else {
        setEvents((prev) => [newEvent, ...prev].slice(0, 100)); // Keep max 100 events

        // Call callback when ARB is auto-executed in auto mode
        if (newEvent.type === 'ARB') {
          onArbitrageExecuted(parseProfit(newEvent.profit));
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isAutoMode, pendingArb, onArbitrageExecuted]);

  useEffect(() => {
    // Don't scroll while waiting for ARB confirmation
    if (pendingArb) return;

    // Auto-scroll to top when new events arrive (unless paused)
    if (!isPaused && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [events, isPaused, pendingArb]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto bg-background p-4 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <style>{`
        @keyframes fadeInBlur {
          from { opacity: 0; filter: blur(6px); }
          to   { opacity: 1; filter: blur(0px); }
        }
      `}</style>
      <div className={`space-y-0 ${pendingArb ? 'pointer-events-none' : ''}`}>
        {events.map((event, index) => (
          <div
            key={event.id}
            style={fadeInStyle}
            className={`font-mono text-xs flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/20 transition-colors cursor-pointer border-b border-purple-600/20 last:border-0 ${index % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
            onClick={() => setSelectedEvent(event)}
          >
            <span className="text-muted">[{event.timestamp}]</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getEventColor(event.type)}`}>
              {event.type}
            </span>
            <span className="text-white flex-1">{event.description}</span>
            {event.type === 'ARB' && (
              <span className="text-lime-400 font-bold">{event.profit}</span>
            )}
          </div>
        ))}
      </div>

      {/* Manual Mode Confirmation Modal */}
      {pendingArb && !isAutoMode && (
        <div className="absolute inset-0 z-50 bg-[#0A0A1A]/95 flex flex-col items-center justify-center gap-6 p-6">
          <div className="text-center">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">Arbitrage Detected</p>
            <p className="text-white text-2xl font-bold font-mono">{pendingArb.pair}</p>
            <p className="text-gray-400 text-sm mt-1">
              {pendingArb.dexBuy} → {pendingArb.dexSell}
            </p>
            <p className="text-lime-400 text-xl font-mono mt-3">{pendingArb.profit} profit</p>
            <p className="text-gray-500 text-xs mt-1">Spread: {pendingArb.spread} • Gas: {pendingArb.gas}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setEvents(prev => [pendingArb, ...prev])
                onArbitrageExecuted(parseProfit(pendingArb.profit))
                setPendingArb(null)
              }}
              className="px-6 py-2 bg-lime-600 hover:bg-lime-500 text-white rounded-lg font-bold transition-colors"
            >
              Execute
            </button>
            <button
              onClick={() => setPendingArb(null)}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="absolute inset-0 z-50 bg-[#0A0A1A]/95 flex flex-col p-4 overflow-auto" style={{ animation: 'fadeIn 0.15s ease-out forwards' }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                selectedEvent.type === 'ARB' ? 'bg-lime-900/50 text-lime-400' :
                selectedEvent.type === 'SWAP' ? 'bg-yellow-900 text-yellow-400' :
                'bg-orange-900/50 text-orange-400'
              }`}>
                {selectedEvent.type}
              </span>
              <DecryptedText
                text={selectedEvent.pair}
                animateOn="view"
                sequential={true}
                revealDirection="start"
                speed={40}
                className="text-white font-bold text-lg"
                encryptedClassName="text-purple-400"
              />
            </div>
            <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="flex-1">
            <TabsList className="bg-[#1A1A2E] border border-purple-600/30">
              <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-white text-gray-400">Overview</TabsTrigger>
              <TabsTrigger value="execution" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-white text-gray-400">Execution</TabsTrigger>
              <TabsTrigger value="chain" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-white text-gray-400">On-Chain</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="bg-[#0D0D1F] border-purple-600/30 text-white mt-2">
                <CardHeader>
                  <CardTitle className="text-white">Transaction Overview</CardTitle>
                  <CardDescription className="text-gray-400">
                    {selectedEvent.type === 'ARB' ? 'Arbitrage opportunity detected and executed' :
                     selectedEvent.type === 'SWAP' ? 'Swap detected on Monad' :
                     'Opportunity missed — spread too low'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Pair</span><p className="text-white font-mono">{selectedEvent.pair}</p></div>
                  <div><span className="text-gray-500">Status</span><p className="text-white font-mono">{selectedEvent.status}</p></div>
                  <div><span className="text-gray-500">Spread</span><p className="text-lime-400 font-mono">{selectedEvent.spread}</p></div>
                  <div><span className="text-gray-500">Profit</span><p className="text-purple-400 font-mono">{selectedEvent.profit}</p></div>
                  <div><span className="text-gray-500">Timestamp</span><p className="text-white font-mono">{selectedEvent.timestamp}</p></div>
                  <div><span className="text-gray-500">Block</span><p className="text-white font-mono">#{selectedEvent.blockNumber}</p></div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="execution">
              <Card className="bg-[#0D0D1F] border-purple-600/30 text-white mt-2">
                <CardHeader>
                  <CardTitle className="text-white">Execution Details</CardTitle>
                  <CardDescription className="text-gray-400">DEX routing and gas information</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Buy on</span><p className="text-white font-mono">{selectedEvent.dexBuy}</p></div>
                  <div><span className="text-gray-500">Sell on</span><p className="text-white font-mono">{selectedEvent.dexSell}</p></div>
                  <div><span className="text-gray-500">Gas used</span><p className="text-yellow-400 font-mono">{selectedEvent.gas}</p></div>
                  <div><span className="text-gray-500">Net profit</span><p className="text-lime-400 font-mono">{selectedEvent.profit}</p></div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chain">
              <Card className="bg-[#0D0D1F] border-purple-600/30 text-white mt-2">
                <CardHeader>
                  <CardTitle className="text-white">On-Chain Data</CardTitle>
                  <CardDescription className="text-gray-400">Monad transaction details</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <div>
                    <span className="text-gray-500">Tx Hash</span>
                    <p className="text-purple-400 font-mono text-xs break-all">{selectedEvent.txHash}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Block</span>
                    <p className="text-white font-mono">#{selectedEvent.blockNumber}</p>
                  </div>
                  <a
                    href={`https://monadscan.com/tx/${selectedEvent.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs text-purple-400 underline hover:text-purple-300"
                  >
                    View on MonadScan →
                  </a>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
