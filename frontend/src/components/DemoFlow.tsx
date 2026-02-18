import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useData } from '../contexts/DataContext';
import { BACKEND_URL, CONTRACTS, ARBITRAGEUR_ABI } from '../lib/config';
import { DEX_DISPLAY_NAMES, type Opportunity } from '../shared/types';

type Step = 'connect' | 'gas' | 'mint' | 'ready' | 'opportunity' | 'executing' | 'done';

interface StepConfig {
  label: string;
  description: string;
}

const STEPS: Record<Step, StepConfig> = {
  connect: { label: 'Connect', description: 'Connect your wallet' },
  gas: { label: 'Gas', description: 'Getting MON for gas fees...' },
  mint: { label: 'Mint', description: 'Minting USDC tokens...' },
  ready: { label: 'Ready', description: 'Waiting for arbitrage opportunity...' },
  opportunity: { label: 'Trade', description: 'Opportunity detected!' },
  executing: { label: 'Execute', description: 'Signing transaction...' },
  done: { label: 'Done', description: 'Arbitrage complete!' },
};

const STEP_ORDER: Step[] = ['connect', 'gas', 'mint', 'ready', 'opportunity', 'executing', 'done'];

interface DemoFlowProps {
  onArbitrageExecuted?: (profit: number) => void;
}

export default function DemoFlow({ onArbitrageExecuted }: DemoFlowProps) {
  const { address, isConnected } = useAccount();
  const { lastOpportunity, lastArbitrage, connectionStatus } = useData();
  const [step, setStep] = useState<Step>('connect');
  const [error, setError] = useState<string | null>(null);
  const [gasHash, setGasHash] = useState<string | null>(null);
  const [mintHash, setMintHash] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [currentOpp, setCurrentOpp] = useState<Opportunity | null>(null);

  // wagmi write contract hook for executeArbitrage
  const { writeContract, data: arbTxHash, isPending: isWriting } = useWriteContract();

  // Wait for arb tx receipt
  const { isSuccess: arbTxSuccess, isLoading: arbTxLoading } = useWaitForTransactionReceipt({
    hash: arbTxHash,
  });

  // Step 1: Move past connect when wallet connected
  useEffect(() => {
    if (isConnected && step === 'connect') {
      setStep('gas');
    }
  }, [isConnected, step]);

  // Step 2: Auto-send gas when entering gas step
  useEffect(() => {
    if (step !== 'gas' || !address) return;

    const sendGas = async () => {
      try {
        setError(null);
        const res = await fetch(`${BACKEND_URL}/api/send-gas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setGasHash(data.txHash);
        // Move to mint after short delay
        setTimeout(() => setStep('mint'), 1500);
      } catch (err: any) {
        setError(`Gas: ${err.message}`);
      }
    };

    sendGas();
  }, [step, address]);

  // Step 3: Auto-mint USDC when entering mint step
  useEffect(() => {
    if (step !== 'mint' || !address) return;

    const mintUsdc = async () => {
      try {
        setError(null);
        const res = await fetch(`${BACKEND_URL}/api/mint-usdc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMintHash(data.txHash);
        // Move to ready after short delay
        setTimeout(() => setStep('ready'), 1500);
      } catch (err: any) {
        setError(`Mint: ${err.message}`);
      }
    };

    mintUsdc();
  }, [step, address]);

  // Manual trigger: Press Space to generate and show fake opportunity
  useEffect(() => {
    if (step !== 'ready') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();

        // Generate fake opportunity
        const dexes = ['uniswap_v4', 'kuru', 'curve', 'traderjoe', 'clober', 'ambient'] as const;
        const randomDexBuy = dexes[Math.floor(Math.random() * dexes.length)];
        let randomDexSell = dexes[Math.floor(Math.random() * dexes.length)];
        // Ensure buy and sell are different
        while (randomDexSell === randomDexBuy) {
          randomDexSell = dexes[Math.floor(Math.random() * dexes.length)];
        }

        const priceBuy = 1.0 + Math.random() * 0.1;
        const spreadBps = 50 + Math.floor(Math.random() * 150); // 50-200 bps
        const priceSell = priceBuy * (1 + spreadBps / 10000);

        const fakeOpp: Opportunity = {
          pair: 'WMON/USDC',
          dexBuy: randomDexBuy,
          dexSell: randomDexSell,
          priceBuy,
          priceSell,
          spreadBps,
          estimatedProfit: 2 + Math.random() * 8,
          amountIn: 1,
          poolBuy: '0x1234567890123456789012345678901234567890',
          poolSell: '0x0987654321098765432109876543210987654321',
          poolBorrow: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          borrowToken: CONTRACTS.WMON,
          borrowAmount: '1000000000000000000',
        };

        setCurrentOpp(fakeOpp);
        setStep('opportunity');
        console.log('[DEMO] Generated fake opportunity');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [step]);

  // Step 6: Watch for arb tx success
  useEffect(() => {
    if (step === 'executing' && arbTxSuccess) {
      setStep('done');
      // Increment PnL with fake profit when tx succeeds
      const fakeProfit = 2 + Math.random() * 6;
      onArbitrageExecuted?.(fakeProfit);
    }
  }, [step, arbTxSuccess, onArbitrageExecuted]);

  // Execute the arbitrage via user's wallet
  const handleExecute = () => {
    if (!currentOpp?.poolBorrow || !currentOpp?.poolSell || !currentOpp?.poolBuy) return;

    setStep('executing');
    setError(null);

    writeContract({
      address: CONTRACTS.ARBITRAGEUR,
      abi: ARBITRAGEUR_ABI,
      functionName: 'executeArbitrage',
      args: [
        currentOpp.poolBorrow as `0x${string}`,
        currentOpp.poolSell as `0x${string}`,
        currentOpp.poolBuy as `0x${string}`,
        currentOpp.borrowToken as `0x${string}` || CONTRACTS.WMON,
        BigInt(currentOpp.borrowAmount || '1000000000000000000'), // 1 WMON default
      ],
    });
  };

  const stepIndex = STEP_ORDER.indexOf(step);

  // Don't render if not connected
  if (!isConnected) return null;

  // Minimized pill
  if (minimized && step !== 'opportunity') {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setMinimized(false)}
        className="fixed top-20 right-4 z-50 bg-[#0D0D1F] border border-purple-600/40 px-3 py-1.5 rounded-full font-mono text-xs text-purple-400 hover:border-purple-400 transition-colors"
      >
        Demo: {STEPS[step].label}
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="fixed top-16 right-4 z-50 w-80 bg-[#0D0D1F] border border-purple-600/40 rounded-lg shadow-xl shadow-purple-900/20 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-purple-600/20">
          <span className="font-mono text-xs text-purple-400 font-bold">Demo Setup</span>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' && (
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            )}
            <button
              onClick={() => setMinimized(true)}
              className="text-gray-500 hover:text-white text-xs"
            >
              _
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex px-4 py-2 gap-1">
          {STEP_ORDER.slice(0, 5).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-purple-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-4 pb-4 pt-1">
          {/* Gas step */}
          {step === 'gas' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center">
                  <span className="text-[10px]">1</span>
                </div>
                <span className="font-mono text-sm text-white">Sending gas...</span>
              </div>
              {gasHash ? (
                <div className="font-mono text-xs text-lime-400">Sent 0.1 MON for gas</div>
              ) : error ? (
                <div className="font-mono text-xs text-red-400">{error}</div>
              ) : (
                <div className="font-mono text-xs text-gray-400 animate-pulse">Broadcasting tx...</div>
              )}
            </div>
          )}

          {/* Mint step */}
          {step === 'mint' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center">
                  <span className="text-[10px]">2</span>
                </div>
                <span className="font-mono text-sm text-white">Minting USDC...</span>
              </div>
              {mintHash ? (
                <div className="font-mono text-xs text-lime-400">Minted 10,000 USDC</div>
              ) : error ? (
                <div className="font-mono text-xs text-red-400">{error}</div>
              ) : (
                <div className="font-mono text-xs text-gray-400 animate-pulse">Broadcasting tx...</div>
              )}
            </div>
          )}

          {/* Ready / Waiting step */}
          {step === 'ready' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-lime-600/30 flex items-center justify-center">
                  <span className="text-[10px] text-lime-400">&#10003;</span>
                </div>
                <span className="font-mono text-sm text-lime-400">Setup complete</span>
              </div>
              <div className="font-mono text-xs text-gray-400">
                Wallet funded. Waiting for arbitrage...
              </div>
              <div className="mt-3 p-2 bg-purple-900/20 border border-purple-600/30 rounded-md">
                <div className="font-mono text-[10px] text-gray-400 text-center">
                  Press <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-white">SPACE</kbd> to simulate opportunity
                </div>
              </div>
            </div>
          )}

          {/* Opportunity detected */}
          {step === 'opportunity' && currentOpp && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-orange-600/30 flex items-center justify-center animate-pulse">
                  <span className="text-[10px] text-orange-400">!</span>
                </div>
                <span className="font-mono text-sm text-orange-400 font-bold">
                  Opportunity Detected
                </span>
              </div>
              <div className="bg-[#0A0A1A] rounded-md p-3 space-y-2 border border-orange-600/20">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-gray-400">Pair</span>
                  <span className="text-white">{currentOpp.pair}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-gray-400">Buy on</span>
                  <span className="text-lime-400">
                    {DEX_DISPLAY_NAMES[currentOpp.dexBuy]} (${currentOpp.priceBuy.toFixed(4)})
                  </span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-gray-400">Sell on</span>
                  <span className="text-orange-400">
                    {DEX_DISPLAY_NAMES[currentOpp.dexSell]} (${currentOpp.priceSell.toFixed(4)})
                  </span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-gray-400">Spread</span>
                  <span className="text-white font-bold">{currentOpp.spreadBps} bps</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-gray-400">Est. Profit</span>
                  <span className="text-lime-400">
                    ~${currentOpp.estimatedProfit > 0 ? currentOpp.estimatedProfit.toFixed(4) : 'TBD'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleExecute}
                className="w-full py-2.5 rounded-md bg-lime-600 hover:bg-lime-500 text-white font-mono text-sm font-bold transition-colors shadow-lg shadow-lime-600/30"
              >
                Execute Arbitrage
              </button>
              <p className="font-mono text-[10px] text-gray-500 text-center">
                Signs a real tx on Monad Testnet via your wallet
              </p>
            </div>
          )}

          {/* Executing */}
          {step === 'executing' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center animate-spin">
                  <span className="text-[10px]">&#8635;</span>
                </div>
                <span className="font-mono text-sm text-purple-400">
                  {isWriting ? 'Sign in wallet...' : arbTxLoading ? 'Confirming on-chain...' : 'Processing...'}
                </span>
              </div>
              {arbTxHash && (
                <a
                  href={`https://testnet.monadvision.com/tx/${arbTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-mono text-xs text-purple-400 hover:underline truncate"
                >
                  Tx: {arbTxHash.slice(0, 10)}...{arbTxHash.slice(-8)}
                </a>
              )}
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-lime-600/30 flex items-center justify-center">
                  <span className="text-[10px] text-lime-400">&#10003;</span>
                </div>
                <span className="font-mono text-sm text-lime-400 font-bold">Arbitrage Complete!</span>
              </div>
              {lastArbitrage && (
                <div className="font-mono text-xs text-gray-400 space-y-1">
                  <div>Profit: <span className="text-lime-400">${lastArbitrage.profit.toFixed(4)}</span></div>
                  <div>Block: <span className="text-white">#{lastArbitrage.blockNumber}</span></div>
                </div>
              )}
              {arbTxHash && (
                <a
                  href={`https://testnet.monadvision.com/tx/${arbTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-mono text-xs text-purple-400 hover:underline"
                >
                  View on MonadVision {'->'}
                </a>
              )}
              <button
                onClick={() => {
                  setStep('ready');
                  setCurrentOpp(null);
                }}
                className="w-full py-2 rounded-md bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-mono text-xs transition-colors mt-2"
              >
                Wait for next opportunity
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
