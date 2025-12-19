import React, { createContext, useContext, ReactNode } from 'react';
import { useAppKitWallet } from '@/hooks/useAppKitWallet';

type WalletContextType = ReturnType<typeof useAppKitWallet>;

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useAppKitWallet();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
