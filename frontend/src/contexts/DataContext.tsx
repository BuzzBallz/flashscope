import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMockMode } from '../hooks/useMockMode';
import type {
  DexPrice,
  SpreadInfo,
  Opportunity,
  ArbitrageResult,
  FailureInfo,
  BlockInfo,
  WSMessage
} from '../shared/types';
import type { ConnectionStatus } from '../hooks/useWebSocket';

interface DataContextValue {
  prices: DexPrice[];
  spreads: SpreadInfo[];
  lastOpportunity: Opportunity | null;
  lastArbitrage: ArbitrageResult | null;
  lastFailure: FailureInfo | null;
  blockInfo: BlockInfo | null;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
  isMockMode: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<DexPrice[]>([]);
  const [spreads, setSpreads] = useState<SpreadInfo[]>([]);
  const [lastOpportunity, setLastOpportunity] = useState<Opportunity | null>(null);
  const [lastArbitrage, setLastArbitrage] = useState<ArbitrageResult | null>(null);
  const [lastFailure, setLastFailure] = useState<FailureInfo | null>(null);
  const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'PRICES_UPDATE':
        setPrices(message.data);
        break;
      case 'SPREAD_UPDATE':
        setSpreads(message.data);
        break;
      case 'OPPORTUNITY_DETECTED':
        setLastOpportunity(message.data);
        break;
      case 'ARBITRAGE_EXECUTED':
        setLastArbitrage(message.data);
        break;
      case 'ARBITRAGE_FAILED':
        setLastFailure(message.data);
        break;
      case 'BLOCK_UPDATE':
        setBlockInfo(message.data);
        break;
    }
  }, []);

  const { connectionStatus, reconnect } = useWebSocket(handleMessage);
  const isMockMode = useMockMode();

  return (
    <DataContext.Provider
      value={{
        prices,
        spreads,
        lastOpportunity,
        lastArbitrage,
        lastFailure,
        blockInfo,
        connectionStatus,
        reconnect,
        isMockMode,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
