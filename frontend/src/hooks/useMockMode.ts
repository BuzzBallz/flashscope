import { useEffect, useState } from 'react';

export function useMockMode() {
  // Default to true since bot is always in DEMO_MODE
  const [isMockMode, setIsMockMode] = useState(true);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'r' || event.key === 'R') {
        setIsMockMode((prev) => {
          const newMode = !prev;
          console.log(`[Demo Mode] ${newMode ? 'ENABLED' : 'DISABLED'} - Press 'R' to toggle`);
          return newMode;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return isMockMode;
}
