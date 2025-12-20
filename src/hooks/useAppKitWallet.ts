import { useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react';
import { BrowserProvider, formatEther } from 'ethers';
import { useState, useEffect, useCallback } from 'react';
import type { Eip1193Provider } from 'ethers';
import { toast } from 'sonner';

// Base chain config
const BASE_CHAIN_ID = '0x2105'; // 8453 in hex
const BASE_CHAIN_CONFIG = {
  chainId: BASE_CHAIN_ID,
  chainName: 'Base',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  chainId: string | null;
  isOnBase: boolean;
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
    chainId: null,
    isOnBase: false,
  });

  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Switch to Base network
  const switchToBase = useCallback(async () => {
    if (!walletProvider) return false;
    
    try {
      await (walletProvider as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_ID }],
      });
      setState(prev => ({ ...prev, chainId: BASE_CHAIN_ID, isOnBase: true }));
      return true;
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await (walletProvider as any).request({
            method: 'wallet_addEthereumChain',
            params: [BASE_CHAIN_CONFIG],
          });
          setState(prev => ({ ...prev, chainId: BASE_CHAIN_ID, isOnBase: true }));
          return true;
        } catch (addError) {
          console.error('Error adding Base chain:', addError);
          toast.error('Failed to add Base network');
          return false;
        }
      }
      console.error('Error switching to Base:', switchError);
      return false;
    }
  }, [walletProvider]);

  // Fetch balance
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

  // Sync current chain (no auto-switch on connect; WalletConnect + MetaMask iOS can be flaky)
  const syncChain = useCallback(async () => {
    if (!walletProvider) return;

    try {
      const chainId = (await (walletProvider as any).request({ method: 'eth_chainId' })) as string;
      const isOnBase = chainId === BASE_CHAIN_ID;
      setState(prev => ({ ...prev, chainId, isOnBase }));
    } catch (error) {
      console.error('Error checking chain:', error);
    }
  }, [walletProvider]);

  // Update state when connection status changes
  useEffect(() => {
    const isActuallyConnecting = status === 'connecting';

    setState(prev => ({
      ...prev,
      isConnected,
      address: address || null,
      // Ensure we stop showing "connecting" once connected
      isConnecting: isConnected ? false : isActuallyConnecting,
    }));

    // After connect, delay all RPC calls (chain/balance) to avoid breaking the mobile handshake.
    if (isConnected && address && walletProvider) {
      const t = window.setTimeout(() => {
        syncChain();
        fetchBalance();
      }, 5000);

      return () => window.clearTimeout(t);
    }

    return;
  }, [isConnected, address, status, walletProvider, fetchBalance, syncChain]);
  // Listen for chain changes
  useEffect(() => {
    if (!walletProvider) return;

    const handleChainChanged = (chainId: string) => {
      const isOnBase = chainId === BASE_CHAIN_ID;
      setState(prev => ({ ...prev, chainId, isOnBase }));
      
      if (!isOnBase && isConnected) {
        toast.warning('Please switch to Base network for best experience', {
          action: {
            label: 'Switch',
            onClick: () => switchToBase(),
          },
        });
      } else if (isOnBase) {
        fetchBalance();
      }
    };

    const provider = walletProvider as any;
    if (provider.on) {
      provider.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (provider.removeListener) {
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [walletProvider, switchToBase, fetchBalance, isConnected]);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      const { appkit } = await import('@/config/appkit');

      // Debug: helps diagnose flaky iOS WalletConnect/MetaMask handshakes
      const unsubscribe = appkit.subscribeEvents((event: any) => {
        const evt = event?.data?.event;
        if (evt) console.log('[WC]', evt, event?.data);

        // Always stop the local "connecting" spinner once the modal closes
        if (evt === 'MODAL_CLOSE') {
          setState(prev => ({ ...prev, isConnecting: false }));
          unsubscribe();
        }
      });

      await appkit.open({ view: 'Connect' });
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
        chainId: null,
        isOnBase: false,
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
    switchToBase,
    walletProvider,
  };
};
