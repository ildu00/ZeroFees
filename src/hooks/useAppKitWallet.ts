import { useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react';
import { BrowserProvider, formatEther } from 'ethers';
import { useState, useEffect, useCallback } from 'react';
import type { Eip1193Provider } from 'ethers';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
}

export const useAppKitWallet = () => {
  const { address, isConnected, status } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>('eip155');
  const { disconnect: appKitDisconnect } = useDisconnect();

  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isConnecting: false,
    error: null,
  });

  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Fetch balance when connected
  const fetchBalance = useCallback(async () => {
    if (!walletProvider || !address) return;
    
    try {
      const provider = new BrowserProvider(walletProvider);
      const balance = await provider.getBalance(address);
      const formattedBalance = parseFloat(formatEther(balance)).toFixed(4);
      setState(prev => ({ ...prev, balance: formattedBalance }));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, [walletProvider, address]);

  // Update state when connection status changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected,
      address: address || null,
      isConnecting: status === 'connecting',
    }));

    if (isConnected && address) {
      fetchBalance();
    }
  }, [isConnected, address, status, fetchBalance]);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      // Import appkit dynamically to avoid circular dependencies
      const { appkit } = await import('@/config/appkit');
      appkit.open();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Failed to open wallet modal',
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await appKitDisconnect();
      setState({
        isConnected: false,
        address: null,
        balance: null,
        isConnecting: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, [appKitDisconnect]);

  return {
    ...state,
    formattedAddress: state.address ? formatAddress(state.address) : null,
    connect,
    disconnect,
    walletProvider,
  };
};
