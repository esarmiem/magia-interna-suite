import React, { createContext, useContext, useState, useEffect } from 'react';

interface ChristmasContextType {
  isChristmasMode: boolean;
  toggleChristmasMode: () => void;
}

const ChristmasContext = createContext<ChristmasContextType | undefined>(undefined);

export function ChristmasProvider({ children }: { children: React.ReactNode }) {
  const [isChristmasMode, setIsChristmasMode] = useState(() => {
    const saved = localStorage.getItem('christmas-mode');
    return saved === 'true'; // Default to false if not set, or persist
  });

  useEffect(() => {
    localStorage.setItem('christmas-mode', String(isChristmasMode));
  }, [isChristmasMode]);

  const toggleChristmasMode = () => {
    setIsChristmasMode((prev) => !prev);
  };

  return (
    <ChristmasContext.Provider value={{ isChristmasMode, toggleChristmasMode }}>
      {children}
    </ChristmasContext.Provider>
  );
}

export const useChristmas = () => {
  const context = useContext(ChristmasContext);
  if (context === undefined) {
    throw new Error('useChristmas must be used within a ChristmasProvider');
  }
  return context;
};
