// app/components/BottomDrawer.tsx
import React from 'react';

interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomDrawer: React.FC<BottomDrawerProps> = ({ isOpen, onClose, children }) => {
  return (
    <div 
      className={`fixed inset-x-0 bottom-0 h-2/3 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="absolute top-0 left-0 right-0 h-6 flex justify-center items-center">
        <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="p-6 mt-6">
        {children}
      </div>
    </div>
  );
};