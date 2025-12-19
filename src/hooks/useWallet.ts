import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
}

const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const openMetaMaskDeepLink = () => {
  const currentUrl = window.location.href.replace(/^https?:\/\//, '');
  const deepLink = `https://metamask.app.link/dapp/${currentUrl}`;
  window.location.href = deepLink;
};

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isConnecting: false,
    error: null,
  });

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balanceWei: string): string => {
    const balanceEth = parseInt(balanceWei, 16) / 1e18;
    return balanceEth.toFixed(4);
  };

  const getBalance = useCallback(async (address: string) => {
    if (!window.ethereum) return null;
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      return formatBalance(balance as string);
    } catch {
      return null;
    }
  }, []);

  const connect = useCallback(async () => {
    // If no ethereum provider and on mobile, open MetaMask app
    if (!window.ethereum) {
      if (isMobile()) {
        openMetaMaskDeepLink();
        return;
      }
      setState(prev => ({ ...prev, error: 'Please install MetaMask' }));
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length > 0) {
        const address = accounts[0];
        const balance = await getBalance(address);
        setState({
          isConnected: true,
          address,
          balance,
          isConnecting: false,
          error: null,
        });
      }
    } catch (err: unknown) {
      const error = err as { code?: number; message?: string };
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.code === 4001 ? 'Connection rejected' : 'Failed to connect',
      }));
    }
  }, [getBalance]);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      balance: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: unknown) => {
      const accountList = accounts as string[];
      if (accountList.length === 0) {
        disconnect();
      } else if (state.isConnected) {
        const address = accountList[0];
        const balance = await getBalance(address);
        setState(prev => ({ ...prev, address, balance }));
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.isConnected, disconnect, getBalance]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        }) as string[];
        if (accounts.length > 0) {
          const address = accounts[0];
          const balance = await getBalance(address);
          setState({
            isConnected: true,
            address,
            balance,
            isConnecting: false,
            error: null,
          });
        }
      } catch {
        // Silent fail on initial check
      }
    };
    checkConnection();
  }, [getBalance]);

  return {
    ...state,
    formattedAddress: state.address ? formatAddress(state.address) : null,
    connect,
    disconnect,
  };
};
