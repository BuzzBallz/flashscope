import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Monad Testnet — chain ID 10143
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
      webSocket: ['wss://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'MonadVision', url: 'https://testnet.monadvision.com' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'FlashScope',
  projectId: import.meta.env.VITE_WC_PROJECT_ID || 'a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5',
  chains: [monadTestnet],
  ssr: false,
});
