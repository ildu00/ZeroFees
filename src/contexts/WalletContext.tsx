import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAppKitWallet } from '@/hooks/useAppKitWallet';
import { useTronLink } from '@/hooks/useTronLink';
import { useChain } from '@/contexts/ChainContext';
import type { Eip1193Provider } from 'ethers';

interface WalletContextType {
  // Common wallet state
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  formattedAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  // EVM specific
  walletProvider: Eip1193Provider | undefined;
  // Chain info
  chainType: 'evm' | 'tron' | 'neo';
  nativeCurrencySymbol: string;
  blockExplorerUrl: string;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { currentChain } = useChain();
  const evmWallet = useAppKitWallet();
  const tronWallet = useTronLink();

  // Select the appropriate wallet based on current chain type
  const wallet = useMemo((): WalletContextType => {
    const chainType = currentChain.type;
    
    if (chainType === 'tron') {
      return {
        isConnected: tronWallet.isConnected,
        address: tronWallet.address,
        balance: tronWallet.balance,
        isConnecting: tronWallet.isConnecting,
        error: tronWallet.error,
        formattedAddress: tronWallet.formattedAddress,
        connect: tronWallet.connect,
        disconnect: tronWallet.disconnect,
        walletProvider: undefined,
        chainType: 'tron',
        nativeCurrencySymbol: currentChain.nativeCurrency.symbol,
        blockExplorerUrl: currentChain.blockExplorer,
      };
    }

    if (chainType === 'neo') {
      // NEO wallet integration placeholder
      // For now, return disconnected state
      return {
        isConnected: false,
        address: null,
        balance: null,
        isConnecting: false,
        error: 'NEO wallet support coming soon',
        formattedAddress: null,
        connect: async () => {
          window.open('https://neonwallet.com/', '_blank');
        },
        disconnect: async () => {},
        walletProvider: undefined,
        chainType: 'neo',
        nativeCurrencySymbol: currentChain.nativeCurrency.symbol,
        blockExplorerUrl: currentChain.blockExplorer,
      };
    }

    // Default: EVM chains
    return {
      isConnected: evmWallet.isConnected,
      address: evmWallet.address,
      balance: evmWallet.balance,
      isConnecting: evmWallet.isConnecting,
      error: evmWallet.error,
      formattedAddress: evmWallet.formattedAddress,
      connect: evmWallet.connect,
      disconnect: evmWallet.disconnect,
      walletProvider: evmWallet.walletProvider,
      chainType: 'evm',
      nativeCurrencySymbol: currentChain.nativeCurrency.symbol,
      blockExplorerUrl: currentChain.blockExplorer,
    };
  }, [currentChain, evmWallet, tronWallet]);

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
