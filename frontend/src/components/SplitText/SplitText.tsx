import { useEffect, useRef, memo } from 'react';
import { gsap } from 'gsap';

interface SplitTextProps {
  text: string;
  delay?: number;
  splitType?: 'chars' | 'words';
  className?: string;
  style?: React.CSSProperties;
  onLetterAnimationComplete?: () => void;
  onWordAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = memo(({
  text,
  delay = 100,
  splitType = 'chars',
  className = '',
  style,
  onLetterAnimationComplete,
  onWordAnimationComplete
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll('.split-char, .split-word');

    gsap.fromTo(
      elements,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: delay / 1000,
        onComplete: () => {
          if (splitType === 'chars' && onLetterAnimationComplete) {
            onLetterAnimationComplete();
          } else if (splitType === 'words' && onWordAnimationComplete) {
            onWordAnimationComplete();
          }
        }
      }
    );
  }, [text, delay, splitType, onLetterAnimationComplete, onWordAnimationComplete]);

  const splitContent = () => {
    if (splitType === 'chars') {
      return text.split('').map((char, index) => (
        <span
          key={index}
          className="split-char inline-block"
          style={{ opacity: 0 }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ));
    } else {
      return text.split(' ').map((word, index) => (
        <span key={index}>
          <span
            className="split-word inline-block"
            style={{ opacity: 0 }}
          >
            {word}
          </span>
          {index < text.split(' ').length - 1 && '\u00A0'}
        </span>
      ));
    }
  };

  return (
    <span ref={containerRef} className={className} style={style}>
      {splitContent()}
    </span>
  );
});

SplitText.displayName = 'SplitText';

export default SplitText;
