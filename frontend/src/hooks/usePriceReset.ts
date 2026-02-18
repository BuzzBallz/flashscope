import { useEffect, useRef, useState } from 'react';
import { BACKEND_URL } from '../lib/config';

/**
 * Hidden admin shortcut: Ctrl+Shift+P triggers price reset on the backend.
 * This creates price divergence across pools so the scanner detects
 * a profitable arbitrage opportunity for the demo.
 */
export function usePriceReset() {
  const [isResetting, setIsResetting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const cooldownRef = useRef(false);

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();

        if (cooldownRef.current) return;
        cooldownRef.current = true;
        setTimeout(() => { cooldownRef.current = false; }, 5000);

        setIsResetting(true);
        setLastResult(null);

        try {
          const res = await fetch(`${BACKEND_URL}/api/reset-prices`, {
            method: 'POST',
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setLastResult(`Price divergence created on ${data.pool}`);
          console.log('[RESET]', data);
        } catch (err: any) {
          setLastResult(`Reset failed: ${err.message}`);
          console.error('[RESET]', err);
        } finally {
          setIsResetting(false);
          // Auto-clear message after 3s
          setTimeout(() => setLastResult(null), 3000);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { isResetting, lastResult };
}
