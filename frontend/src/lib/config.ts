// Runtime config — env vars or localhost defaults
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export const WS_URL =
  import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

// Contract addresses (Monad Testnet)
export const CONTRACTS = {
  ARBITRAGEUR: '0xa23b2844Fc4fCF15104994b105F152682554aFbF' as const,
  MOCK_USDC: '0xe8cc35BA27De935972d78348B9E43bF6F97c2444' as const,
  WMON: '0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541' as const,
};

// ABI for FlashArbitrageur.executeArbitrage
export const ARBITRAGEUR_ABI = [
  {
    name: 'executeArbitrage',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'poolBorrow', type: 'address' },
      { name: 'poolSell', type: 'address' },
      { name: 'poolBuy', type: 'address' },
      { name: 'borrowToken', type: 'address' },
      { name: 'borrowAmount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;
