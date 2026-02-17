export type EventType = 'ARB' | 'SWAP' | 'MISS';

export interface FeedEvent {
  id: string;
  timestamp: number;
  type: EventType;
  description: string;
  profit?: number;
}

export interface PriceEntry {
  pair: string;
  dex: string;
  price: number;
}

export interface ArbitrageOpportunity {
  pair: string;
  buyDex: string;
  sellDex: string;
  spread: number;
  estimatedProfit: number;
}
