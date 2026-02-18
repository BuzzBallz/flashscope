import { useEffect, useRef, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { DEX_LIST, DEX_DISPLAY_NAMES, type DexId } from '../shared/types';
import { useData } from '../contexts/DataContext';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { CircleFadingArrowUp } from 'lucide-react';
import { Button } from './ui/button';

interface GraphNode {
  id: string;
  name: string;
  val: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string;
  target: string;
  spreadBps: number;
  color: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const DEX_INFO: Record<string, {
  name: string
  type: string
  tvl: string
  volume24h: string
  fees: string
  model: string
  pairs: number
  description: string
}> = {
  uniswap_v4: {
    name: 'Uniswap V4',
    type: 'AMM Singleton',
    tvl: '$25-60M',
    volume24h: '$4.2M',
    fees: '0.05% / 0.3% / 1%',
    model: 'Concentrated Liquidity',
    pairs: 48,
    description: 'Largest DEX on Monad. Flash accounting via EIP-1153.'
  },
  kuru: {
    name: 'Kuru',
    type: 'Hybrid CLOB + AMM',
    tvl: '$1.5M+',
    volume24h: '$800K',
    fees: '0.1%',
    model: 'On-chain Order Book',
    pairs: 12,
    description: 'Monad-native DEX with exploitable bid/ask spreads.'
  },
  curve: {
    name: 'Curve Finance',
    type: 'StableSwap AMM',
    tvl: '$1.5M+',
    volume24h: '$600K',
    fees: '0.01% / 0.04%',
    model: 'Stablecoin-optimized curve',
    pairs: 8,
    description: 'Best for stable pairs: USDC/USDT/AUSD.'
  },
  trader_joe: {
    name: 'Trader Joe (LFJ)',
    type: 'Liquidity Book',
    tvl: '$900K',
    volume24h: '$450K',
    fees: '0.1% / 0.25%',
    model: 'Fixed-price bins',
    pairs: 15,
    description: 'Zero slippage intra-bin. Frequent discrepancies vs AMMs.'
  },
  clober: {
    name: 'Clober',
    type: 'On-chain CLOB',
    tvl: '$1M+',
    volume24h: '$300K',
    fees: '0.1%',
    model: 'Gas-efficient Order Book',
    pairs: 10,
    description: 'Second order book price source on Monad.'
  },
  ambient: {
    name: 'Ambient Finance',
    type: 'Optimized AMM',
    tvl: '$700K',
    volume24h: '$250K',
    fees: '0.05% / 0.3%',
    model: 'Single-contract AMM + limit orders',
    pairs: 9,
    description: 'Distinct price source with limit order support.'
  }
};

// Colors based on spread intensity
const getSpreadColor = (spreadBps: number, isFlashing: boolean = false): string => {
  if (isFlashing) return '#FFFFFF';
  if (spreadBps < 20) return '#65a30d'; // Lime-700
  if (spreadBps < 50) return '#06b6d4'; // Cyan
  return '#f97316'; // Orange
};

const generateMockSpreads = (): Map<string, number> => {
  const spreads = new Map<string, number>();
  DEX_LIST.forEach((dex1, i) => {
    DEX_LIST.forEach((dex2, j) => {
      if (i < j) {
        const key = `${dex1}-${dex2}`;
        spreads.set(key, Math.random() * 95 + 5);
      }
    });
  });
  return spreads;
};

// Compute real inter-DEX spreads from price data
const computeRealSpreads = (priceMap: Map<DexId, number>): Map<string, number> => {
  const spreads = new Map<string, number>();
  const dexes = [...DEX_LIST].filter(d => priceMap.has(d));

  dexes.forEach((dex1, i) => {
    dexes.forEach((dex2, j) => {
      if (i < j) {
        const p1 = priceMap.get(dex1)!;
        const p2 = priceMap.get(dex2)!;
        const spreadBps = Math.abs(p1 - p2) / Math.min(p1, p2) * 10000;
        const key = `${dex1}-${dex2}`;
        spreads.set(key, spreadBps);
      }
    });
  });

  return spreads;
};

const createGraphData = (spreads: Map<string, number>, flashingLinks: Set<string>): GraphData => {
  const nodes: GraphNode[] = DEX_LIST.map((dex) => ({
    id: dex,
    name: DEX_DISPLAY_NAMES[dex as DexId],
    val: 15,
  }));

  const links: GraphLink[] = [];
  DEX_LIST.forEach((dex1, i) => {
    DEX_LIST.forEach((dex2, j) => {
      if (i < j) {
        const key = `${dex1}-${dex2}`;
        const spreadBps = spreads.get(key) || 0;
        const isFlashing = flashingLinks.has(key);
        links.push({
          source: dex1,
          target: dex2,
          spreadBps,
          color: getSpreadColor(spreadBps, isFlashing),
        });
      }
    });
  });

  return { nodes, links };
};

export default function NetworkRadar() {
  const { prices: realPrices, isMockMode } = useData();
  const [spreads, setSpreads] = useState<Map<string, number>>(() => generateMockSpreads());
  const [pulsePhase, setPulsePhase] = useState(0);
  const [focusedDex, setFocusedDex] = useState<string | null>(null);
  const [flashingLinks, setFlashingLinks] = useState<Set<string>>(new Set());
  const [selectedDex, setSelectedDex] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const prevSpreadsRef = useRef<Map<string, number>>(new Map());
  const [size, setSize] = useState({ w: 300, h: 300 });
  const [tick, setTick] = useState(0);
  const [simRunning, setSimRunning] = useState(true);

  const graphData = useMemo(() => createGraphData(spreads, flashingLinks), [spreads, flashingLinks]);

  useEffect(() => setSimRunning(true), [graphData]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rafId = requestAnimationFrame(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    return () => cancelAnimationFrame(rafId);
  }, [selectedDex]);

  // Pulse animation
  useEffect(() => {
    const interval = setInterval(() => setPulsePhase(p => p + 0.1), 100);
    return () => clearInterval(interval);
  }, []);

  // Update spreads: real from prices when available, mock fallback
  useEffect(() => {
    const interval = setInterval(() => {
      let newSpreads: Map<string, number>;

      if (!isMockMode && realPrices.length >= DEX_LIST.length) {
        // Compute real spreads from actual WMON/USDC prices
        const priceMap = new Map<DexId, number>();
        realPrices
          .filter(p => p.pair === 'WMON/USDC')
          .forEach(p => priceMap.set(p.dex, p.price));

        if (priceMap.size >= DEX_LIST.length) {
          newSpreads = computeRealSpreads(priceMap);
        } else {
          newSpreads = generateMockSpreads();
        }
      } else {
        newSpreads = generateMockSpreads();
      }

      // Detect spread spikes > 10bps for flash effect
      const newFlashing = new Set<string>();
      newSpreads.forEach((spread, key) => {
        const prevSpread = prevSpreadsRef.current.get(key) || 0;
        if (spread - prevSpread > 10) {
          newFlashing.add(key);
        }
      });

      setSpreads(newSpreads);
      setFlashingLinks(newFlashing);
      prevSpreadsRef.current = newSpreads;

      if (newFlashing.size > 0) {
        setTimeout(() => setFlashingLinks(new Set()), 300);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [realPrices, isMockMode]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      {/* DEX info carousel */}
      {selectedDex && DEX_INFO[selectedDex] && (() => {
        const dex = DEX_INFO[selectedDex];

        // Compute real spread for selected DEX vs others
        const realSpreadEntries: { vs: string; spread: string }[] = [];
        if (!isMockMode && realPrices.length >= DEX_LIST.length) {
          const priceMap = new Map<DexId, number>();
          realPrices
            .filter(p => p.pair === 'WMON/USDC')
            .forEach(p => priceMap.set(p.dex, p.price));

          const selectedPrice = priceMap.get(selectedDex as DexId);
          if (selectedPrice) {
            DEX_LIST.filter(d => d !== selectedDex).forEach(otherDex => {
              const otherPrice = priceMap.get(otherDex);
              if (otherPrice) {
                const spreadPct = Math.abs(selectedPrice - otherPrice) / Math.min(selectedPrice, otherPrice) * 100;
                realSpreadEntries.push({
                  vs: DEX_DISPLAY_NAMES[otherDex],
                  spread: `${spreadPct.toFixed(2)}%`,
                });
              }
            });
          }
        }

        const slides = [
          {
            title: 'Overview',
            content: (
              <div className="space-y-2 text-sm">
                <p className="text-gray-400">{dex.description}</p>
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-white">{dex.type}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Model</span><span className="text-white">{dex.model}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Pairs</span><span className="text-white">{dex.pairs}</span></div>
              </div>
            )
          },
          {
            title: 'Liquidity',
            content: (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">TVL</span><span className="text-lime-400 font-mono">{dex.tvl}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">24h Volume</span><span className="text-purple-400 font-mono">{dex.volume24h}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Fees</span><span className="text-yellow-400 font-mono">{dex.fees}</span></div>
              </div>
            )
          },
          {
            title: 'Arbitrage',
            content: (
              <div className="space-y-2 text-sm">
                <p className="text-gray-400 text-xs">Current WMON/USDC spread vs other DEXes</p>
                {realSpreadEntries.length > 0 ? (
                  realSpreadEntries.map(entry => (
                    <div key={entry.vs} className="flex justify-between">
                      <span className="text-gray-500">vs {entry.vs}</span>
                      <span className="text-lime-400 font-mono">{entry.spread}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">vs Uniswap</span><span className="text-lime-400 font-mono">{(Math.random() * 0.8).toFixed(2)}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">vs Kuru</span><span className="text-lime-400 font-mono">{(Math.random() * 0.6).toFixed(2)}%</span></div>
                  </>
                )}
                <div className="flex justify-between"><span className="text-gray-500">Best pair</span><span className="text-white font-mono">WMON/USDC</span></div>
              </div>
            )
          }
        ];

        return (
          <div className="flex-shrink-0 p-2 z-20" style={{ animation: 'fadeSlideDown 0.15s ease-out forwards' }}>
            <style>{`
              @keyframes fadeSlideDown {
                from { opacity: 0; transform: translateY(-8px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div className="bg-[#0D0D1F] border border-purple-600/40 rounded-lg p-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white font-bold text-sm">{dex.name}</span>
                <button onClick={() => setSelectedDex(null)} className="text-gray-500 hover:text-white text-xs">&#x2715;</button>
              </div>
              <Carousel opts={{ duration: 8 }} className="w-full">
                <CarouselContent>
                  {slides.map((slide, i) => (
                    <CarouselItem key={i}>
                      <div className="space-y-2">
                        <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">{slide.title}</p>
                        {slide.content}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-center gap-2 mt-3">
                  <CarouselPrevious className="relative inset-auto h-6 w-6 bg-transparent border-purple-600/40 text-gray-400 hover:text-white hover:bg-purple-600/20" />
                  <CarouselNext className="relative inset-auto h-6 w-6 bg-transparent border-purple-600/40 text-gray-400 hover:text-white hover:bg-purple-600/20" />
                </div>
              </Carousel>
            </div>
          </div>
        );
      })()}

      {/* Graph + Legend */}
      <div className="flex flex-row flex-1">
        <div ref={wrapperRef} className="h-full" style={{ width: '60%' }}>
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            width={size.w}
            height={size.h}
            backgroundColor="#0A0A1A"
            nodeLabel="name"
            nodeColor={() => '#836EF9'}
            nodeRelSize={8}
            nodeCanvasObject={(node) => {
              const ctx = fgRef.current?.graph?.ctx();
              if (!ctx) return;
              ctx.beginPath();
              ctx.arc(node.x ?? 0, node.y ?? 0, 8, 0, 2 * Math.PI);
              ctx.fillStyle = 'transparent';
              ctx.fill();
            }}
            nodeCanvasObjectMode={() => 'replace'}
            onEngineTick={() => setTick(t => t + 1)}
            onEngineStop={() => setSimRunning(false)}
            linkLabel={(link) => {
              const spreadBps = (link as GraphLink).spreadBps;
              return spreadBps > 30 ? `${spreadBps.toFixed(1)} bps` : '';
            }}
            linkColor={(link) => (link as GraphLink).color}
            linkWidth={(link: any) => {
              const spread = (link as GraphLink).spreadBps;
              const source = typeof link.source === 'object' ? link.source.id : link.source;
              const target = typeof link.target === 'object' ? link.target.id : link.target;
              const isConnected = focusedDex && (source === focusedDex || target === focusedDex);
              const baseWidth = spread >= 50 ? 5 : spread >= 20 ? 3 : 1;
              return isConnected ? baseWidth + 2 : baseWidth;
            }}
            linkDirectionalParticles={(link) => {
              const spread = (link as GraphLink).spreadBps;
              return spread > 50 ? 2 : 0;
            }}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.002}
            linkDirectionalParticleColor={() => '#00E5FF'}
            cooldownTicks={50}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.6}
          />

          {/* HTML overlay for node icons */}
          <div
            className="absolute pointer-events-none z-10"
            style={{ left: 0, top: 0, width: size.w, height: size.h }}
          >
            {graphData.nodes.map((node: GraphNode) => {
              if (node.x === undefined || node.y === undefined) return null;
              const screenPos = fgRef.current?.graph2ScreenCoords(node.x, node.y);
              if (!screenPos) return null;

              return (
                <div
                  key={node.id as string}
                  className="absolute pointer-events-auto"
                  style={{
                    left: screenPos.x,
                    top: screenPos.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setFocusedDex(prev => prev === node.id ? null : node.id as string);
                      setSelectedDex(prev => prev === node.id ? null : node.id as string);
                    }}
                    className={`
                      h-8 w-8 rounded-full p-0 border transition-all duration-200
                      ${selectedDex === node.id
                        ? 'border-purple-400 bg-purple-600/30 text-purple-300'
                        : 'border-purple-600/50 bg-[#0A0A1A]/80 text-purple-500 hover:border-purple-400 hover:bg-purple-600/20 hover:text-purple-300'
                      }
                    `}
                    style={{ borderRadius: '50%' }}
                    title={node.id as string}
                  >
                    <CircleFadingArrowUp className="h-4 w-4" />
                  </Button>
                  <span className="absolute top-9 left-1/2 -translate-x-1/2 text-white text-[10px] font-mono whitespace-nowrap pointer-events-none">
                    {node.id as string}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 px-3 text-sm" style={{ width: '40%' }}>
          <h3 className="font-mono text-sm text-muted uppercase tracking-wide">
            Network Radar
          </h3>
          <div className="font-mono text-xs text-muted space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5" style={{ backgroundColor: '#65a30d' }} />
              <span>&lt;20 bps (calm)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5" style={{ backgroundColor: '#06b6d4' }} />
              <span>20-50 bps (active)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5" style={{ backgroundColor: '#f97316' }} />
              <span>&gt;50 bps (arbitrage)</span>
            </div>
            {focusedDex && (
              <div className="mt-2 text-accent">
                Focused: {DEX_DISPLAY_NAMES[focusedDex as DexId]}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
