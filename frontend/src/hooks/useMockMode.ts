import { useEffect, useState } from 'react';

export function useMockMode() {
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'r' || event.key === 'R') {
        setIsMockMode((prev) => {
          const newMode = !prev;
          console.log(`[Mock Mode] ${newMode ? 'ENABLED' : 'DISABLED'} - Press 'R' to toggle`);
          return newMode;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return isMockMode;
}
