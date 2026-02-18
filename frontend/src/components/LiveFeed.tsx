import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEX_DISPLAY_NAMES, type DexId } from '../shared/types';
import { useData } from '../contexts/DataContext';
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

type EventType = 'ARB' | 'OPPORTUNITY' | 'MISS';

type LiveEvent = {
  id: string;
  type: EventType;
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

const getEventColor = (type: EventType) => {
  switch (type) {
    case 'ARB':
      return 'bg-lime-600 text-black';
    case 'OPPORTUNITY':
      return 'bg-accent text-white';
    case 'MISS':
      return 'bg-orange-600 text-white';
  }
};

const getEventLabel = (type: EventType) => {
  switch (type) {
    case 'ARB': return 'ARB';
    case 'OPPORTUNITY': return 'OPP';
    case 'MISS': return 'MISS';
  }
};

const dexName = (dex: DexId | string) => DEX_DISPLAY_NAMES[dex as DexId] || dex;

const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('en-US', {
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

interface LiveFeedProps {
  isAutoMode: boolean;
  onArbitrageExecuted: (profit: number) => void;
}

export default function LiveFeed({ isAutoMode, onArbitrageExecuted }: LiveFeedProps) {
  const { lastArbitrage, lastOpportunity, lastFailure } = useData();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);
  const [pendingArb, setPendingArb] = useState<LiveEvent | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track previous values to detect new events
  const prevArbTimestamp = useRef(0);
  const prevOppTimestamp = useRef(0);
  const prevFailTimestamp = useRef(0);

  // Watch ARBITRAGE_EXECUTED
  useEffect(() => {
    if (!lastArbitrage) return;
    if (lastArbitrage.timestamp === prevArbTimestamp.current) return;
    prevArbTimestamp.current = lastArbitrage.timestamp;

    const event: LiveEvent = {
      id: `arb-${lastArbitrage.timestamp}-${Math.random()}`,
      type: 'ARB',
      pair: lastArbitrage.pair,
      dexBuy: dexName(lastArbitrage.dexBuy),
      dexSell: dexName(lastArbitrage.dexSell),
      spread: `${Math.round(lastArbitrage.profit * 100)} bps`,
      profit: `+$${lastArbitrage.profit.toFixed(2)}`,
      gas: `${lastArbitrage.executionTimeMs}ms`,
      txHash: lastArbitrage.txHash,
      blockNumber: lastArbitrage.blockNumber,
      timestamp: formatTime(lastArbitrage.timestamp),
      status: 'Confirmed',
      description: `Arbitrage executed: ${lastArbitrage.pair} (${dexName(lastArbitrage.dexBuy)} -> ${dexName(lastArbitrage.dexSell)})`,
    };

    setEvents(prev => [event, ...prev].slice(0, 50));
    onArbitrageExecuted(lastArbitrage.profit);
  }, [lastArbitrage, onArbitrageExecuted]);

  // Watch OPPORTUNITY_DETECTED
  useEffect(() => {
    if (!lastOpportunity) return;
    // Use a combination of fields as key since Opportunity doesn't have a timestamp field in some cases
    const oppKey = `${lastOpportunity.priceBuy}-${lastOpportunity.priceSell}-${lastOpportunity.spreadBps}`;
    const numKey = parseFloat(oppKey.replace(/-/g, ''));
    if (numKey === prevOppTimestamp.current) return;
    prevOppTimestamp.current = numKey;

    const event: LiveEvent = {
      id: `opp-${Date.now()}-${Math.random()}`,
      type: 'OPPORTUNITY',
      pair: lastOpportunity.pair,
      dexBuy: dexName(lastOpportunity.dexBuy),
      dexSell: dexName(lastOpportunity.dexSell),
      spread: `${lastOpportunity.spreadBps} bps`,
      profit: lastOpportunity.estimatedProfit > 0 ? `~$${lastOpportunity.estimatedProfit.toFixed(2)}` : 'TBD',
      gas: '',
      txHash: '',
      blockNumber: 0,
      timestamp: formatTime(Date.now()),
      status: 'Detected',
      description: `Opportunity: ${lastOpportunity.pair} spread ${lastOpportunity.spreadBps}bps (${dexName(lastOpportunity.dexBuy)} -> ${dexName(lastOpportunity.dexSell)})`,
    };

    // In manual mode, show confirmation for opportunities
    if (!isAutoMode) {
      setPendingArb(event);
    } else {
      setEvents(prev => [event, ...prev].slice(0, 50));
    }
  }, [lastOpportunity, isAutoMode]);

  // Watch ARBITRAGE_FAILED
  useEffect(() => {
    if (!lastFailure) return;
    if (lastFailure.timestamp === prevFailTimestamp.current) return;
    prevFailTimestamp.current = lastFailure.timestamp;

    const event: LiveEvent = {
      id: `fail-${lastFailure.timestamp}-${Math.random()}`,
      type: 'MISS',
      pair: lastFailure.pair,
      dexBuy: dexName(lastFailure.dexBuy),
      dexSell: dexName(lastFailure.dexSell),
      spread: '',
      profit: '$0',
      gas: '',
      txHash: '',
      blockNumber: 0,
      timestamp: formatTime(lastFailure.timestamp),
      status: 'Failed',
      description: `Failed: ${lastFailure.reason} (${dexName(lastFailure.dexBuy)} -> ${dexName(lastFailure.dexSell)})`,
    };

    setEvents(prev => [event, ...prev].slice(0, 50));
  }, [lastFailure]);

  // Auto-scroll
  useEffect(() => {
    if (pendingArb) return;
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

      {/* Empty state */}
      {events.length === 0 && !pendingArb && (
        <div className="flex flex-col items-center justify-center h-full text-center gap-3">
          <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
          <p className="text-muted font-mono text-sm">Scanning for arbitrage opportunities...</p>
          <p className="text-muted/50 font-mono text-xs">Events will appear here when the bot detects price discrepancies</p>
        </div>
      )}

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
              {getEventLabel(event.type)}
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
              {pendingArb.dexBuy} {'->'} {pendingArb.dexSell}
            </p>
            <p className="text-lime-400 text-xl font-mono mt-3">{pendingArb.spread}</p>
            <p className="text-gray-500 text-xs mt-1">Spread: {pendingArb.spread}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setEvents(prev => [pendingArb, ...prev].slice(0, 50));
                setPendingArb(null);
              }}
              className="px-6 py-2 bg-lime-600 hover:bg-lime-500 text-white rounded-lg font-bold transition-colors"
            >
              Acknowledge
            </button>
            <button
              onClick={() => setPendingArb(null)}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"
            >
              Dismiss
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
                selectedEvent.type === 'OPPORTUNITY' ? 'bg-purple-900/50 text-purple-400' :
                'bg-orange-900/50 text-orange-400'
              }`}>
                {getEventLabel(selectedEvent.type)}
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
            <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-white text-xl">&#x2715;</button>
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
                     selectedEvent.type === 'OPPORTUNITY' ? 'Opportunity detected by scanner' :
                     'Arbitrage attempt failed'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Pair</span><p className="text-white font-mono">{selectedEvent.pair}</p></div>
                  <div><span className="text-gray-500">Status</span><p className="text-white font-mono">{selectedEvent.status}</p></div>
                  <div><span className="text-gray-500">Spread</span><p className="text-lime-400 font-mono">{selectedEvent.spread}</p></div>
                  <div><span className="text-gray-500">Profit</span><p className="text-purple-400 font-mono">{selectedEvent.profit}</p></div>
                  <div><span className="text-gray-500">Timestamp</span><p className="text-white font-mono">{selectedEvent.timestamp}</p></div>
                  {selectedEvent.blockNumber > 0 && (
                    <div><span className="text-gray-500">Block</span><p className="text-white font-mono">#{selectedEvent.blockNumber}</p></div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="execution">
              <Card className="bg-[#0D0D1F] border-purple-600/30 text-white mt-2">
                <CardHeader>
                  <CardTitle className="text-white">Execution Details</CardTitle>
                  <CardDescription className="text-gray-400">DEX routing and execution info</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Buy on</span><p className="text-white font-mono">{selectedEvent.dexBuy}</p></div>
                  <div><span className="text-gray-500">Sell on</span><p className="text-white font-mono">{selectedEvent.dexSell}</p></div>
                  {selectedEvent.gas && <div><span className="text-gray-500">Execution time</span><p className="text-yellow-400 font-mono">{selectedEvent.gas}</p></div>}
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
                  {selectedEvent.txHash ? (
                    <>
                      <div>
                        <span className="text-gray-500">Tx Hash</span>
                        <p className="text-purple-400 font-mono text-xs break-all">{selectedEvent.txHash}</p>
                      </div>
                      {selectedEvent.blockNumber > 0 && (
                        <div>
                          <span className="text-gray-500">Block</span>
                          <p className="text-white font-mono">#{selectedEvent.blockNumber}</p>
                        </div>
                      )}
                      <a
                        href={`https://testnet.monadvision.com/tx/${selectedEvent.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs text-purple-400 underline hover:text-purple-300"
                      >
                        View on Monad Explorer {'→'}
                      </a>
                    </>
                  ) : (
                    <p className="text-gray-500">No on-chain data for this event type</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
