import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DEX_LIST, DEX_DISPLAY_NAMES, PAIRS, type DexId, type PairId } from '../shared/types';
import { useData } from '../contexts/DataContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Inline GlitchText component
const glitchStyles = `
.glitch {
  position: relative;
  display: inline-block;
}
.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.glitch::after {
  animation: glitch-after var(--after-duration) infinite;
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
  text-shadow: var(--after-shadow);
}
.glitch::before {
  animation: glitch-before var(--before-duration) infinite;
  clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
  text-shadow: var(--before-shadow);
}
.enable-on-hover::before,
.enable-on-hover::after { display: none; }
.enable-on-hover:hover::before,
.enable-on-hover:hover::after { display: block; }
@keyframes glitch-after {
  0%   { transform: translate(0); }
  20%  { transform: translate(-2px, 2px); }
  40%  { transform: translate(2px, -2px); }
  60%  { transform: translate(-1px, 1px); }
  80%  { transform: translate(1px, -1px); }
  100% { transform: translate(0); }
}
@keyframes glitch-before {
  0%   { transform: translate(0); }
  20%  { transform: translate(2px, -2px); }
  40%  { transform: translate(-2px, 2px); }
  60%  { transform: translate(1px, -1px); }
  80%  { transform: translate(-1px, 1px); }
  100% { transform: translate(0); }
}
`;

interface GlitchTextProps {
  children: string;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  className?: string;
}

interface CustomCSSProperties extends React.CSSProperties {
  '--after-duration': string;
  '--before-duration': string;
  '--after-shadow': string;
  '--before-shadow': string;
}

const GlitchText: React.FC<GlitchTextProps> = ({
  children,
  speed = 0.5,
  enableShadows = true,
  enableOnHover = false,
  className = ''
}) => {
  const inlineStyles: CustomCSSProperties = {
    '--after-duration': `${speed * 3}s`,
    '--before-duration': `${speed * 2}s`,
    '--after-shadow': enableShadows ? '-5px 0 red' : 'none',
    '--before-shadow': enableShadows ? '5px 0 cyan' : 'none'
  };
  const hoverClass = enableOnHover ? 'enable-on-hover' : '';
  return (
    <>
      <style>{glitchStyles}</style>
      <div className={`glitch ${hoverClass} ${className}`} style={inlineStyles} data-text={children}>
        {children}
      </div>
    </>
  );
};

interface PriceData {
  [key: string]: {
    [dex: string]: number;
  };
}

interface ArbitrageCell {
  pair: PairId;
  dex: DexId;
}

// Base prices for mock data — WMON/USDC matches real range for smooth transitions
const BASE_PRICES: Record<PairId, number> = {
  'WMON/USDC': 22.00,
  'WETH/USDC': 2841.2,
  'WMON/WETH': 0.000360,
};

const generateMockPrices = (): PriceData => {
  const prices: PriceData = {};
  PAIRS.forEach((pair) => {
    prices[pair] = {};
    const basePrice = BASE_PRICES[pair];
    DEX_LIST.forEach((dex) => {
      const variance = (Math.random() - 0.5) * 0.01 * basePrice;
      prices[pair][dex] = basePrice + variance;
    });
  });
  return prices;
};

export default function PriceMatrix() {
  const { prices: realPrices, isMockMode, lastArbitrage } = useData();
  const [mockPrices, setMockPrices] = useState<PriceData>(() => generateMockPrices());
  const [arbCells, setArbCells] = useState<ArbitrageCell[] | null>(null);
  const [glitchingCells, setGlitchingCells] = useState<Set<string>>(new Set());
  const prevPricesRef = useRef<PriceData>({});
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{ time: string; price: number }[]>([]);
  const [yDomain, setYDomain] = useState<[number, number]>([0, 1]);

  // Build merged prices: real WMON/USDC when available, mock for everything else
  const prices = useMemo(() => {
    const merged: PriceData = {};

    PAIRS.forEach((pair) => {
      if (pair === 'WMON/USDC' && !isMockMode && realPrices.length > 0) {
        // Use real backend prices for WMON/USDC
        const realMap: { [dex: string]: number } = {};
        realPrices
          .filter(p => p.pair === 'WMON/USDC')
          .forEach(p => { realMap[p.dex] = p.price; });

        if (Object.keys(realMap).length >= DEX_LIST.length) {
          merged[pair] = realMap;
          return;
        }
      }
      // Fallback to mock for this pair
      merged[pair] = mockPrices[pair] || {};
    });

    return merged;
  }, [mockPrices, realPrices, isMockMode]);

  // Timer: update mock prices every 2 seconds (for WETH/USDC, WMON/WETH, and WMON/USDC fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      setMockPrices(generateMockPrices());

      // Random arbitrage highlight for mock pairs only
      if (Math.random() < 0.3) {
        const mockPairs: PairId[] = ['WETH/USDC', 'WMON/WETH'];
        if (isMockMode) mockPairs.push('WMON/USDC');
        const pair = mockPairs[Math.floor(Math.random() * mockPairs.length)];
        const dexes = [...DEX_LIST];
        const minDex = dexes[Math.floor(Math.random() * dexes.length)];
        const maxDex = dexes.filter(d => d !== minDex)[Math.floor(Math.random() * (dexes.length - 1))];
        setArbCells([{ pair, dex: minDex }, { pair, dex: maxDex }]);
        setTimeout(() => setArbCells(null), 1500);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isMockMode]);

  // Detect price changes for glitch effect
  useEffect(() => {
    const newGlitching = new Set<string>();
    PAIRS.forEach((pair) => {
      DEX_LIST.forEach((dex) => {
        const oldPrice = prevPricesRef.current[pair]?.[dex];
        const newPrice = prices[pair]?.[dex];
        if (oldPrice && newPrice && Math.abs(newPrice - oldPrice) > 0.0001) {
          newGlitching.add(`${pair}-${dex}`);
        }
      });
    });

    if (newGlitching.size > 0) {
      setGlitchingCells(newGlitching);
      const timer = setTimeout(() => setGlitchingCells(new Set()), 600);
      prevPricesRef.current = prices;
      return () => clearTimeout(timer);
    }
    prevPricesRef.current = prices;
  }, [prices]);

  // Real arbitrage highlight for WMON/USDC from backend
  const prevArbTimestamp = useRef(0);
  useEffect(() => {
    if (!lastArbitrage || isMockMode) return;
    if (lastArbitrage.timestamp === prevArbTimestamp.current) return;
    prevArbTimestamp.current = lastArbitrage.timestamp;

    setArbCells([
      { pair: lastArbitrage.pair, dex: lastArbitrage.dexBuy },
      { pair: lastArbitrage.pair, dex: lastArbitrage.dexSell },
    ]);
    setTimeout(() => setArbCells(null), 1500);
  }, [lastArbitrage, isMockMode]);

  // Live chart updates
  useEffect(() => {
    if (!selectedPair) return;
    const interval = setInterval(() => {
      setChartData(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1].price;
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          price: last * (1 + (Math.random() - 0.5) * 0.0004)
        };
        return [...prev.slice(-29), newPoint];
      });
    }, 200);
    return () => clearInterval(interval);
  }, [selectedPair]);

  // Update Y domain smoothly
  useEffect(() => {
    if (chartData.length < 2) return;
    const chartPrices = chartData.map(d => d.price);
    const min = Math.min(...chartPrices);
    const max = Math.max(...chartPrices);
    const padding = (max - min) * 0.3 || 0.001;
    setYDomain([min - padding, max + padding]);
  }, [chartData]);

  const formatPrice = (pair: PairId, price: number) => {
    if (pair === 'WMON/WETH') return price.toFixed(6);
    if (pair === 'WMON/USDC') return price.toFixed(4);
    return price.toFixed(4);
  };

  const findMinMaxForPair = (pair: PairId) => {
    const pairPrices = prices[pair];
    if (!pairPrices) return { minDex: null, maxDex: null };
    let minDex: DexId | null = null;
    let maxDex: DexId | null = null;
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    DEX_LIST.forEach((dex) => {
      const price = pairPrices[dex];
      if (price == null) return;
      if (price < minPrice) { minPrice = price; minDex = dex; }
      if (price > maxPrice) { maxPrice = price; maxDex = dex; }
    });

    return { minDex, maxDex };
  };

  const isCellInArbitrage = (pair: PairId, dex: DexId) => {
    return arbCells?.some((cell) => cell.pair === pair && cell.dex === dex) || false;
  };

  const handleRowClick = (pair: PairId) => {
    setSelectedPair(pair);
    // Initialize chart — use current price from the first DEX
    const currentPrice = prices[pair]?.[DEX_LIST[0]] || BASE_PRICES[pair];
    const initialData = Array.from({ length: 10 }, (_, i) => ({
      time: new Date(Date.now() - (9 - i) * 1000).toLocaleTimeString(),
      price: currentPrice * (1 + (Math.random() - 0.5) * 0.005)
    }));
    setChartData(initialData);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background relative">
      <div className="flex-1 overflow-auto p-4">
        <h3 className="font-mono text-sm text-muted mb-3 uppercase tracking-wide">
          Price Matrix — Real-time DEX Prices
        </h3>

        <table className="w-full table-fixed border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-purple-600/40">
              <th className="text-left py-3 px-3 text-muted font-semibold">PAIR</th>
              {DEX_LIST.map((dex) => (
                <th key={dex} className="text-center py-3 px-3 text-muted font-semibold uppercase">
                  {DEX_DISPLAY_NAMES[dex]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAIRS.map((pair) => {
              const { minDex, maxDex } = findMinMaxForPair(pair);
              const pairPrices = prices[pair];

              // Loading state for WMON/USDC when waiting for real data
              if (pair === 'WMON/USDC' && !isMockMode && realPrices.length === 0) {
                return (
                  <tr key={pair} className="h-12 border-b border-purple-600/20">
                    <td className="py-3 px-3 font-semibold text-white">{pair}</td>
                    {DEX_LIST.map((dex) => (
                      <td key={dex} className="text-center py-3 px-3 text-muted animate-pulse">
                        ---
                      </td>
                    ))}
                  </tr>
                );
              }

              return (
                <tr
                  key={pair}
                  className="h-12 border-b border-purple-600/20 last:border-0 hover:bg-muted/5 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(pair)}
                >
                  <td className="py-3 px-3 font-semibold text-white">{pair}</td>
                  {DEX_LIST.map((dex) => {
                    const price = pairPrices?.[dex];
                    if (price == null) return <td key={dex} className="text-center py-3 px-3 text-muted">---</td>;

                    const isMin = dex === minDex;
                    const isMax = dex === maxDex;
                    const isArb = isCellInArbitrage(pair, dex);
                    const isGlitching = glitchingCells.has(`${pair}-${dex}`);
                    const formattedPrice = formatPrice(pair, price);

                    return (
                      <motion.td
                        key={dex}
                        className={`text-center py-3 px-3 relative ${
                          isMin
                            ? 'bg-lime-900/30 text-lime-400 font-bold'
                            : isMax
                            ? 'bg-orange-900/30 text-orange-400 font-bold'
                            : 'text-white'
                        } ${isArb ? 'glow-pulse' : ''}`}
                        animate={
                          isArb
                            ? {
                                boxShadow: [
                                  '0 0 0px rgba(131, 110, 249, 0)',
                                  '0 0 15px rgba(131, 110, 249, 0.8)',
                                  '0 0 0px rgba(131, 110, 249, 0)',
                                ],
                              }
                            : {}
                        }
                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                      >
                        {isGlitching ? (
                          <GlitchText speed={0.15} enableShadows={true}>
                            {formattedPrice}
                          </GlitchText>
                        ) : (
                          formattedPrice
                        )}
                      </motion.td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 flex gap-6 text-xs font-mono text-muted">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-lime-900/30 border border-lime-500 rounded" />
            <span>Lowest price (buy here)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-900/30 border border-orange-500 rounded" />
            <span>Highest price (sell here)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent/20 border border-accent rounded animate-pulse" />
            <span>Arbitrage executed</span>
          </div>
        </div>
      </div>

      {/* Chart Modal */}
      {selectedPair && (
        <div className="absolute inset-0 bg-[#0A0A1A]/95 z-50 flex flex-col p-4" style={{ animation: 'fadeIn 0.15s ease-out forwards' }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            .recharts-area-area { transition: d 0.18s linear; }
            .recharts-area-curve { transition: d 0.18s linear; }
            .recharts-surface { overflow: visible; }
          `}</style>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold text-lg">{selectedPair}</h3>
            <button onClick={() => setSelectedPair(null)} className="text-gray-400 hover:text-white">&#x2715;</button>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8c00ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8c00ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis domain={yDomain} hide />
              <Tooltip
                contentStyle={{ background: '#0A0A1A', border: '1px solid #8c00ff', color: '#fff' }}
                formatter={(value: number | undefined) => [value !== undefined ? value.toFixed(4) : '', 'Price']}
              />
              <Area
                type="linear"
                dataKey="price"
                stroke="#8c00ff"
                fill="url(#priceGradient)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-gray-500 text-xs mt-2">Live price — updates every second</p>
        </div>
      )}
    </div>
  );
}
