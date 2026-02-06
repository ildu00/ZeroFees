import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ChainConfig, CHAINS, DEFAULT_CHAIN, getChainById } from '@/config/chains';
import { toast } from 'sonner';

interface ChainContextType {
  currentChain: ChainConfig;
  setChain: (chainId: string) => void;
  switchChain: (chainId: string) => Promise<boolean>;
  isChainSupported: (chainId: string) => boolean;
  availableChains: ChainConfig[];
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

const STORAGE_KEY = 'zerofees_selected_chain';

export const ChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentChain, setCurrentChain] = useState<ChainConfig>(() => {
    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && CHAINS[saved]) {
        return CHAINS[saved];
      }
    }
    return DEFAULT_CHAIN;
  });

  // Persist selection
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentChain.id);
  }, [currentChain]);

  const setChain = useCallback((chainId: string) => {
    const chain = getChainById(chainId);
    if (chain) {
      setCurrentChain(chain);
      toast.success(`Switched to ${chain.name}`);
    } else {
      toast.error('Unsupported network');
    }
  }, []);

  const switchChain = useCallback(async (chainId: string): Promise<boolean> => {
    const chain = getChainById(chainId);
    if (!chain) {
      toast.error('Unsupported network');
      return false;
    }

    // For EVM chains, we need to switch the wallet network
    if (chain.type === 'evm' && typeof window !== 'undefined') {
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        try {
          const hexChainId = `0x${(chain.chainId as number).toString(16)}`;
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexChainId }],
          });
        } catch (switchError: any) {
          // Chain not added, try to add it
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${(chain.chainId as number).toString(16)}`,
                  chainName: chain.name,
                  nativeCurrency: chain.nativeCurrency,
                  rpcUrls: [chain.rpcUrl],
                  blockExplorerUrls: [chain.blockExplorer],
                }],
              });
            } catch (addError) {
              console.error('Error adding chain:', addError);
              toast.error(`Failed to add ${chain.name} network`);
              return false;
            }
          } else {
            console.error('Error switching chain:', switchError);
            return false;
          }
        }
      }
    }

    // For non-EVM chains, just update the context
    // Wallet connection will be handled separately
    setCurrentChain(chain);
    toast.success(`Switched to ${chain.name}`);
    return true;
  }, []);

  const isChainSupported = useCallback((chainId: string): boolean => {
    return !!CHAINS[chainId];
  }, []);

  const availableChains = Object.values(CHAINS);

  return (
    <ChainContext.Provider value={{
      currentChain,
      setChain,
      switchChain,
      isChainSupported,
      availableChains,
    }}>
      {children}
    </ChainContext.Provider>
  );
};

export const useChain = (): ChainContextType => {
  const context = useContext(ChainContext);
  if (!context) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
};
