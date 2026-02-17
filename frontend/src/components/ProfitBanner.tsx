import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import CountUp from './CountUp/CountUp';
import { Toggle } from './ui/toggle';

interface ProfitBannerProps {
  isAutoMode: boolean;
  onModeChange: (value: boolean) => void;
  totalProfit: number;
}

export default function ProfitBanner({ isAutoMode, onModeChange, totalProfit }: ProfitBannerProps) {
  const { blockInfo, lastArbitrage, connectionStatus, reconnect, isMockMode } = useData();
  const [mockProfit, setMockProfit] = useState(0);
  const [prevBalance, setPrevBalance] = useState(0);

  // Fallback to mock profit when disconnected
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      const interval = setInterval(() => {
        const increment = Math.floor(Math.random() * 141) + 10;
        setMockProfit((prev) => prev + increment);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [connectionStatus]);

  // Update previous balance when totalProfit changes
  useEffect(() => {
    setPrevBalance(totalProfit);
  }, [totalProfit]);

  const profit = lastArbitrage?.cumulativeProfit ?? mockProfit;
  const tradeCount = lastArbitrage?.tradeCount ?? 0;
  const blockNumber = blockInfo?.number ?? null;
  const avgBlockTime = blockInfo?.avgBlockTimeMs ?? null;

  const formatProfit = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-lime-400';
      case 'connecting':
        return 'bg-accent';
      case 'disconnected':
        return 'bg-orange-500';
    }
  };

  const getConnectionLabel = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'LIVE';
      case 'connecting':
        return 'CONNECTING';
      case 'disconnected':
        return 'OFFLINE';
    }
  };

  return (
    <div className="w-full h-16 bg-background border-b border-muted flex items-center px-6 gap-4">
      {/* ARB/SCAN Logo */}
      <h1 className="font-mono font-bold text-xl text-accent">FlashScope</h1>

      {/* Balance counter */}
      <div className="flex flex-col items-start">
        <div className="font-mono text-3xl font-bold">
          $
          <CountUp
            from={prevBalance}
            to={totalProfit}
            duration={0.6}
            className="font-bold tabular-nums"
            style={{
              background: 'linear-gradient(90deg, #ffffff 0%, #8c00ff 60%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          />
        </div>
        <div className="font-mono text-xs text-muted">
          {tradeCount > 0 ? `${tradeCount} trades` : 'Total Profit'}
        </div>
      </div>

      {/* Block info */}
      <div className="font-mono text-sm text-muted">
        Block:{' '}
        <span className="text-white">
          {blockNumber ? `#${blockNumber.toLocaleString()}` : '#---'}
        </span>
      </div>

      {/* Block time */}
      {avgBlockTime && (
        <div className="font-mono text-xs text-muted">
          ⏱{' '}
          <span className={avgBlockTime < 500 ? 'text-lime-400' : 'text-white'}>
            {avgBlockTime}ms
          </span>{' '}
          avg
        </div>
      )}

      {/* Connection status + Mode toggle */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80"
          onClick={reconnect}
          title="Click to reconnect"
        >
          <div
            className={`w-2 h-2 rounded-full ${getConnectionColor()} ${
              connectionStatus === 'connected' ? 'animate-pulse' : ''
            }`}
          />
          <span className="text-xs text-muted">{getConnectionLabel()}</span>
        </div>

        <Toggle
          pressed={isAutoMode}
          onPressedChange={onModeChange}
          size="sm"
          variant="outline"
          className={`gap-2 border transition-colors ${
            isAutoMode
              ? 'border-lime-500 text-lime-400 hover:text-lime-300'
              : 'border-gray-600 text-gray-400 hover:text-gray-300'
          }`}
        >
          <CircleIcon
            className={`h-3 w-3 transition-all ${
              isAutoMode ? 'fill-lime-400 text-lime-400' : 'fill-transparent text-gray-400'
            }`}
          />
          {isAutoMode ? 'Auto' : 'Manual'}
        </Toggle>
      </div>

      {/* Mock mode indicator */}
      {isMockMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded text-xs font-mono text-accent"
        >
          <span>🎭</span>
          <span>MOCK MODE</span>
        </motion.div>
      )}
    </div>
  );
}
