import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';
import { TopBar } from './TopBar';
import { RightPanel } from './RightPanel';

export const Layout = () => {
  const { darkMode } = useStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
      <Sidebar />
      <div className="flex-1 flex flex-col relative">
        <TopBar />
        <div className="flex-1 relative overflow-hidden">
          <Canvas />
        </div>
      </div>
      <RightPanel />
    </div>
  );
};
