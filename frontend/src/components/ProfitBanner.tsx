import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CircleIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import CountUp from './CountUp/CountUp';

const starBorderStyles = `
@keyframes star-movement-bottom {
  0%   { transform: translateX(0%); }
  100% { transform: translateX(50%); }
}
@keyframes star-movement-top {
  0%   { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}
.star-border-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
  border-radius: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
}
.star-border-inner {
  position: relative;
  z-index: 1;
  border-radius: 7px;
  padding: 4px 12px;
}
.star-border-bottom {
  position: absolute;
  bottom: -20px;
  left: -50%;
  width: 200%;
  height: 40px;
  opacity: 0.7;
  border-radius: 50%;
}
.star-border-top {
  position: absolute;
  top: -20px;
  left: -50%;
  width: 200%;
  height: 40px;
  opacity: 0.7;
  border-radius: 50%;
}
`

const StarBorder = ({
  onClick,
  color = 'white',
  speed = '6s',
  children,
  className = ''
}: {
  onClick: () => void
  color?: string
  speed?: string
  children: React.ReactNode
  className?: string
}) => (
  <>
    <style>{starBorderStyles}</style>
    <button onClick={onClick} className={`star-border-container ${className}`} style={{ padding: '1px 0' }}>
      <div className="star-border-bottom" style={{
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
        animation: `star-movement-bottom ${speed} linear infinite`
      }} />
      <div className="star-border-top" style={{
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
        animation: `star-movement-top ${speed} linear infinite`
      }} />
      <div className="star-border-inner">{children}</div>
    </button>
  </>
)

interface ProfitBannerProps {
  isAutoMode: boolean;
  onModeChange: (value: boolean) => void;
  totalProfit: number;
}

export default function ProfitBanner({ isAutoMode, onModeChange, totalProfit }: ProfitBannerProps) {
  const { blockInfo, lastArbitrage, connectionStatus, reconnect, isMockMode } = useData();
  const [prevBalance, setPrevBalance] = useState(0);

  // Update previous balance when profit changes (for CountUp animation)
  useEffect(() => {
    setPrevBalance(totalProfit);
  }, [totalProfit]);
  const tradeCount = lastArbitrage?.tradeCount ?? 0;
  const blockNumber = blockInfo?.number ?? null;
  const avgBlockTime = blockInfo?.avgBlockTimeMs ?? null;

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

        <StarBorder
          onClick={() => onModeChange(!isAutoMode)}
          color={isAutoMode ? '#84cc16' : '#6b7280'}
          speed={isAutoMode ? '3s' : '8s'}
          className="text-xs font-mono"
        >
          <div className={`flex items-center gap-2 px-1 py-0.5 rounded transition-colors ${
            isAutoMode
              ? 'text-lime-400'
              : 'text-gray-500'
          }`}>
            <CircleIcon className={`h-2 w-2 transition-all ${
              isAutoMode ? 'fill-lime-400 text-lime-400' : 'fill-transparent text-gray-500'
            }`} />
            <span>{isAutoMode ? 'Auto' : 'Manual'}</span>
          </div>
        </StarBorder>
      </div>

      {/* Demo mode indicator */}
      {isMockMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded text-xs font-mono text-accent"
        >
          <span>🎭</span>
          <span>DEMO MODE</span>
        </motion.div>
      )}
    </div>
  );
}
