import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import ProfitBanner from '../components/ProfitBanner';
import LiveFeed from '../components/LiveFeed';
import PriceMatrix from '../components/PriceMatrix';
import NetworkRadar from '../components/NetworkRadar';
import AnimatedContent from '../components/AnimatedContent/AnimatedContent';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import DemoFlow from '../components/DemoFlow';
import { useData } from '../contexts/DataContext';

export default function Dashboard() {
  const location = useLocation();
  const loginSuccess = location.state?.loginSuccess || false;
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [totalProfit, setTotalProfit] = useState(0);
  const [showHint, setShowHint] = useState(true);

  const { lastArbitrage, lastOpportunity } = useData();

  const handleArbitrageExecuted = (profit: number) => {
    console.log('[PROFIT] Manual execution - adding profit:', profit);
    setTotalProfit(prev => prev + profit);
  };

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-screen h-screen bg-background relative">
      <ResizablePanelGroup
        orientation="vertical"
        className="h-screen w-screen overflow-hidden"
        style={{ padding: 0, margin: 0 }}
      >

        {/* Top row — LiveFeed left, ProfitBanner + NetworkRadar right */}
        <ResizablePanel defaultSize={60} minSize={30}>
          <ResizablePanelGroup orientation="horizontal">

            <ResizablePanel defaultSize={50} minSize={20}>
              <LiveFeed isAutoMode={isAutoMode} onArbitrageExecuted={handleArbitrageExecuted} />
            </ResizablePanel>

            <ResizableHandle className="w-px cursor-col-resize bg-purple-600/40 hover:bg-purple-400 transition-colors duration-100" />

            <ResizablePanel defaultSize={50} minSize={20}>
              <ResizablePanelGroup orientation="vertical">
                <ResizablePanel defaultSize={30} minSize={15}>
                  <ProfitBanner isAutoMode={isAutoMode} onModeChange={setIsAutoMode} totalProfit={totalProfit} />
                </ResizablePanel>
                <ResizableHandle className="h-px cursor-row-resize bg-purple-600/40 hover:bg-purple-400 transition-colors duration-100" />
                <ResizablePanel defaultSize={70} minSize={30}>
                  <NetworkRadar />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle className="h-1 w-full bg-purple-600/50 hover:bg-purple-400 active:bg-purple-300 transition-colors cursor-row-resize" />

        {/* Bottom — PriceMatrix full width */}
        <ResizablePanel defaultSize={40} minSize={20}>
          <PriceMatrix />
        </ResizablePanel>

      </ResizablePanelGroup>

      {/* Success Notification */}
      {loginSuccess && (
        <div className="fixed top-4 right-4 z-50 w-80">
          <AnimatedContent
            direction="horizontal"
            reverse={true}
            distance={300}
            duration={1.2}
            initialOpacity={0}
            scale={1}
            threshold={0.3}
            disappearAfter={3}
            disappearDuration={0.5}
          >
            <Alert className="border-purple-600/40 bg-[#0A0A1A] text-white">
              <CheckCircle2 className="text-green-400 h-4 w-4" />
              <AlertTitle className="text-white">Login successful</AlertTitle>
              <AlertDescription className="text-gray-400">
                Welcome to FlashScope. Connected to Monad.
              </AlertDescription>
            </Alert>
          </AnimatedContent>
        </div>
      )}

      {/* Demo Flow overlay */}
      <DemoFlow onArbitrageExecuted={handleArbitrageExecuted} />

      {/* Resize Hint */}
      {showHint && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0D0D1F] border border-purple-600/40 text-gray-400 text-xs px-4 py-2 rounded-full pointer-events-none">
          Drag the purple handles to resize panels
        </div>
      )}
    </div>
  );
}
