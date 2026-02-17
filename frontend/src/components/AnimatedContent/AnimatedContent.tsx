import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedContentProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  reverse?: boolean;
  distance?: number;
  duration?: number;
  delay?: number;
  initialOpacity?: number;
  scale?: number;
  threshold?: number;
  disappearAfter?: number;
  disappearDuration?: number;
}

export default function AnimatedContent({
  children,
  direction = 'vertical',
  reverse = false,
  distance = 100,
  duration = 0.6,
  delay = 0,
  initialOpacity = 0,
  scale = 1,
  threshold = 0.1,
  disappearAfter = 0,
  disappearDuration = 0.5,
}: AnimatedContentProps) {
  const [isVisible, setIsVisible] = useState(true);
  const hasDisappeared = useRef(false);

  useEffect(() => {
    if (disappearAfter > 0 && !hasDisappeared.current) {
      const timer = setTimeout(() => {
        hasDisappeared.current = true;
        setIsVisible(false);
      }, disappearAfter * 1000);

      return () => clearTimeout(timer);
    }
  }, [disappearAfter]);

  const getInitialPosition = () => {
    if (direction === 'horizontal') {
      return { x: reverse ? distance : -distance, y: 0 };
    }
    return { x: 0, y: reverse ? distance : -distance };
  };

  const initialPosition = getInitialPosition();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            ...initialPosition,
            opacity: initialOpacity,
            scale,
          }}
          animate={{
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
          }}
          exit={{
            ...initialPosition,
            opacity: 0,
            scale: scale * 0.95,
          }}
          transition={{
            duration,
            delay,
            ease: 'easeOut',
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
