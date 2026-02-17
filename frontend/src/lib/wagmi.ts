import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Monad mainnet
export const monad = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.monad.xyz'],
      webSocket: ['wss://rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'MonadVision', url: 'https://monadvision.com' },
  },
});

export const config = getDefaultConfig({
  appName: 'FlashScope',
  projectId: 'a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5', // Placeholder - get real one from https://cloud.walletconnect.com
  chains: [monad],
  ssr: false,
});
