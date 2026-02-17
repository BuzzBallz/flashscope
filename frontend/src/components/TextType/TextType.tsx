import { useState, useEffect } from 'react';

interface TextTypeProps {
  texts: string[];
  typingSpeed?: number;
  className?: string;
  onComplete?: () => void;
}

const TextType: React.FC<TextTypeProps> = ({
  texts,
  typingSpeed = 50,
  className = '',
  onComplete
}) => {
  const [displayedTexts, setDisplayedTexts] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    if (currentIndex >= texts.length) {
      onComplete?.();
      return;
    }

    const targetText = texts[currentIndex];

    if (currentText.length < targetText.length) {
      // Continue typing
      const timeout = setTimeout(() => {
        setCurrentText(targetText.slice(0, currentText.length + 1));
      }, typingSpeed);

      return () => clearTimeout(timeout);
    } else {
      // Finished typing current text, move to next
      const timeout = setTimeout(() => {
        setDisplayedTexts(prev => [...prev, currentText]);
        setCurrentIndex(prev => prev + 1);
        setCurrentText('');
      }, 400); // Pause before next line

      return () => clearTimeout(timeout);
    }
  }, [currentText, currentIndex, texts, typingSpeed, onComplete]);

  const isTyping = currentIndex < texts.length;

  return (
    <div className={className}>
      {displayedTexts.map((text, index) => (
        <div key={index} className="mb-2">
          <span className="text-white font-mono text-lg">
            <span className="text-success mr-2">›</span>
            {text}
          </span>
        </div>
      ))}
      {isTyping && (
        <div className="mb-2">
          <span className="text-white font-mono text-lg">
            <span className="text-success mr-2">›</span>
            {currentText}
            <span className="inline-block w-0.5 h-5 ml-1 bg-success animate-pulse" />
          </span>
        </div>
      )}
    </div>
  );
};

export default TextType;
