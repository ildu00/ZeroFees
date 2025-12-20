import { useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react';
import { BrowserProvider, formatEther } from 'ethers';
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const hasAutoSwitched = useRef(false);

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

  // Check current chain and auto-switch to Base
  const checkAndSwitchToBase = useCallback(async () => {
    if (!walletProvider || hasAutoSwitched.current) return;
    
    try {
      const chainId = await (walletProvider as any).request({ method: 'eth_chainId' }) as string;
      const isOnBase = chainId === BASE_CHAIN_ID;
      setState(prev => ({ ...prev, chainId, isOnBase }));
      
      if (!isOnBase) {
        hasAutoSwitched.current = true;
        toast.info('Switching to Base network...', { id: 'switch-chain' });
        const switched = await switchToBase();
        if (switched) {
          toast.success('Connected to Base network', { id: 'switch-chain' });
        }
      }
    } catch (error) {
      console.error('Error checking chain:', error);
    }
  }, [walletProvider, switchToBase]);

  // Update state when connection status changes
  useEffect(() => {
    const isActuallyConnecting = status === 'connecting';

    setState(prev => ({
      ...prev,
      isConnected,
      address: address || null,
      isConnecting: isActuallyConnecting,
    }));

    // Reset auto-switch flag when disconnected
    if (!isConnected) {
      hasAutoSwitched.current = false;
    }

    // Auto-switch to Base and fetch balance when connected.
    // On mobile WalletConnect, doing RPC requests immediately can interrupt the wallet handshake
    // (shows blank/white sheet in some wallets). Delay slightly after connect.
    if (isConnected && address && walletProvider) {
      const t = window.setTimeout(() => {
        checkAndSwitchToBase();
        fetchBalance();
      }, 800);

      return () => window.clearTimeout(t);
    }

    return;
  }, [isConnected, address, status, walletProvider, fetchBalance, checkAndSwitchToBase]);

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
      
      // Listen for modal close to reset connecting state
      const unsubscribe = appkit.subscribeEvents((event: any) => {
        if (event.data?.event === 'MODAL_CLOSE') {
          setState(prev => ({ ...prev, isConnecting: false }));
          unsubscribe();
        }
      });
      
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
