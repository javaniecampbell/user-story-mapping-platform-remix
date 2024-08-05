// app/components/PanelContainer.tsx
import React, { useState, useEffect } from 'react';
import { SidePanel } from './SidePanel';
import { BottomDrawer } from './BottomDrawer';

interface PanelContainerProps {
  children: React.ReactNode;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Adjust this breakpoint as needed
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const togglePanel = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        onClick={togglePanel}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      {isMobile ? (
        <BottomDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
          {children}
        </BottomDrawer>
      ) : (
        <SidePanel isOpen={isOpen} onClose={() => setIsOpen(false)}>
          {children}
        </SidePanel>
      )}
    </>
  );
};