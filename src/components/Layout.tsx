import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Sidebar } from './Sidebar';
import { BottomToolbar } from './BottomToolbar';
import { Canvas } from './Canvas';
import { TopBar } from './TopBar';
import { RightPanel } from './RightPanel';

export const Layout = () => {
  const { darkMode } = useStore();

  useEffect(() => {
    // Apply dark mode class on initial load and changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Also apply on first render
  useEffect(() => {
    const storedDarkMode = useStore.getState().darkMode;
    if (storedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Left Sidebar - Notebooks & Pages */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <TopBar />

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas />
          
          {/* Bottom Toolbar - FigJam Style */}
          <BottomToolbar />
        </div>
      </div>

      {/* Right Panel - Q&A, Polls, Notes */}
      <RightPanel />
    </div>
  );
};
