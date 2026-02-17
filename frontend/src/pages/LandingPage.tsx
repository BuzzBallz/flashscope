import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Particles from '../components/Particles/Particles';
import TextType from '../components/TextType/TextType';
import SplitText from '../components/SplitText/SplitText';
import ShinyText from '../components/ShinyText/ShinyText';
import AnimatedContent from '../components/AnimatedContent/AnimatedContent';
import PixelTransition from '../components/PixelTransition/PixelTransition';
import MonadLogo from '../components/PixelTransition/MonadLogo';
import { Button } from '../components/ui/button';
import { Spinner } from '../components/ui/spinner';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { ArrowRightIcon, Info } from 'lucide-react';

type LoginState = 'idle' | 'loading' | 'error';

const TYPEWRITER_LINES = [
  'Scanning 6 Monad DEXs in real-time...',
  'Detecting arbitrage opportunities in 400ms...',
  'Executing flash loans with zero capital.',
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [titleDone, setTitleDone] = useState(false);
  const [subtitleDone, setSubtitleDone] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [loginState, setLoginState] = useState<LoginState>('idle');
  const modalOpenRef = useRef(false);

  const { openConnectModal } = useConnectModal();
  const { isConnected, isConnecting } = useAccount();

  useEffect(() => {
    if (titleDone) {
      setShowSubtitle(true);
    }
  }, [titleDone]);

  useEffect(() => {
    if (isConnected) {
      modalOpenRef.current = false;
      navigate('/dashboard', { state: { loginSuccess: true } });
    }
  }, [isConnected, navigate]);

  useEffect(() => {
    if (loginState === 'error') {
      const timer = setTimeout(() => {
        setLoginState('idle');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [loginState]);

  useEffect(() => {
    if (loginState !== 'loading') return;

    const interval = setInterval(() => {
      if (!isConnected && !isConnecting && modalOpenRef.current) {
        // Check if RainbowKit modal is still in the DOM
        const modalInDOM = !!document.querySelector('[data-rk] [role="dialog"]');
        if (!modalInDOM) {
          setLoginState('error');
          modalOpenRef.current = false;
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [loginState, isConnected, isConnecting]);

  const handleLogin = () => {
    setLoginState('loading');
    modalOpenRef.current = true;
    openConnectModal?.();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Particles Background */}
      <Particles
        particleCount={1000}
        particleColors={["#8c00ff"]}
        speed={0.4}
        particleSpread={10}
        alphaParticles={true}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        {/* Logo / Title */}
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance mb-4">
          {titleDone ? (
            <ShinyText
              text="FlashScope"
              speed={1.5}
              color="#ffffff"
              shineColor="#8c00ff"
              spread={120}
              className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance"
              style={{ textShadow: "0 0 30px rgba(140, 0, 255, 0.9)" }}
            />
          ) : (
            <SplitText
              text="FlashScope"
              delay={50}
              splitType="chars"
              className="text-white"
              style={{ textShadow: "0 0 30px rgba(140, 0, 255, 0.9)" }}
              onLetterAnimationComplete={() => setTitleDone(true)}
            />
          )}
        </h1>

        {/* Subtitle */}
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight text-gray-400 mb-12 text-center">
          {showSubtitle && (
            subtitleDone ? (
              <span className="scroll-m-20 text-xl font-semibold tracking-tight text-gray-400">
                The Bloomberg Terminal for Flash Loans on Monad
              </span>
            ) : (
              <SplitText
                text="The Bloomberg Terminal for Flash Loans on Monad"
                delay={30}
                splitType="chars"
                className="scroll-m-20 text-xl font-semibold tracking-tight text-gray-400"
                onLetterAnimationComplete={() => setSubtitleDone(true)}
              />
            )
          )}
        </h4>

        {/* TypeWriter Animation */}
        {subtitleDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-12 max-w-2xl"
          >
            <div className="scroll-m-20 text-xl font-semibold tracking-tight">
              <TextType
                texts={TYPEWRITER_LINES}
                typingSpeed={25}
                onComplete={() => setShowButton(true)}
              />
            </div>
          </motion.div>
        )}

        {/* CTA Button */}
        {subtitleDone && showButton && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div
              style={{ width: '80px', height: '80px', cursor: 'pointer' }}
              onClick={loginState === 'idle' ? handleLogin : undefined}
            >
              <PixelTransition
                key={loginState}
                firstContent={
                  <div className="flex items-center justify-center w-full h-full bg-[#0A0A1A] border border-purple-600/40 rounded-lg">
                    <MonadLogo />
                  </div>
                }
                secondContent={
                  <div className="flex flex-col items-center justify-center gap-3 w-full h-full bg-[#0A0A1A]/90 border border-purple-500 rounded-lg px-2 py-2">
                    <MonadLogo />
                    <span
                      className="font-mono uppercase tracking-widest"
                      style={{
                        fontSize: '10px',
                        color: '#c084fc',
                        letterSpacing: '0.2em',
                        lineHeight: 1,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Login
                    </span>
                  </div>
                }
                gridSize={15}
                animationStepDuration={0.3}
                pixelColor="#8c00ff"
                once={false}
                aspectRatio="0%"
                style={{ width: '80px', height: '80px' }}
              />
            </div>
          </motion.div>
        )}

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="absolute bottom-8 text-sm font-mono"
          style={{ color: '#606070' }}
        >
          Built for Monad Blitz @ ETHDenver 2026
        </motion.div>
      </div>

      {/* Error Notification */}
      {loginState === 'error' && (
        <div className="fixed top-4 right-4 z-50 w-80">
          <AnimatedContent
            direction="horizontal"
            reverse={true}
            distance={80}
            duration={0.3}
            initialOpacity={0}
            scale={1}
            threshold={0.3}
            disappearAfter={0}
            disappearDuration={0.5}
          >
            <Alert className="border-purple-600/40 bg-[#0A0A1A] text-white">
              <Info className="text-purple-400 h-4 w-4" />
              <AlertTitle className="text-white">Connection cancelled</AlertTitle>
              <AlertDescription className="text-gray-400">
                Wallet connection was aborted. Please try again.
              </AlertDescription>
            </Alert>
          </AnimatedContent>
        </div>
      )}

      {/* Dev Shortcut */}
      {import.meta.env.DEV && (
        <button
          onClick={() => navigate('/dashboard', { state: { loginSuccess: true } })}
          className="fixed bottom-4 right-4 z-50 text-xs text-purple-400/50 hover:text-purple-400 underline transition-colors"
        >
          [DEV] Skip to dashboard
        </button>
      )}
    </div>
  );
}
