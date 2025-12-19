import React, { createContext, useContext, ReactNode } from 'react';
import { useAppKitWallet } from '@/hooks/useAppKitWallet';
import type { Eip1193Provider } from 'ethers';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  formattedAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  walletProvider: Eip1193Provider | undefined;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useAppKitWallet();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
