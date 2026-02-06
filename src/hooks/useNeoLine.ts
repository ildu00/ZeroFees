import { useState, useEffect, useCallback, useRef } from 'react';

// NeoLine N3 types
interface NeoLineN3Provider {
  getAccount: () => Promise<{ address: string; label?: string }>;
  getBalance: (params: { address: string; contracts?: string[] }) => Promise<{ [contract: string]: string }>;
  getNetworks: () => Promise<{ chainId: number; networks: string[]; defaultNetwork: string }>;
  getProvider: () => Promise<{ name: string; version: string; website: string }>;
  invoke: (params: any) => Promise<any>;
  invokeRead: (params: any) => Promise<any>;
  signMessage: (params: { message: string }) => Promise<{ publicKey: string; data: string; salt: string; message: string }>;
}

interface NeoLineState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  formattedAddress: string | null;
  provider: NeoLineN3Provider | null;
}

// NEO N3 native GAS contract
const GAS_CONTRACT = '0xd2a4cff31913016155e38e474a2c06d08be276cf';

export const useNeoLine = () => {
  const [state, setState] = useState<NeoLineState>({
    isConnected: false,
    address: null,
    balance: null,
    isConnecting: false,
    error: null,
    formattedAddress: null,
    provider: null,
  });

  const providerRef = useRef<NeoLineN3Provider | null>(null);
  const isInitializedRef = useRef(false);

  // Format address for display
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Initialize NeoLine provider
  const initProvider = useCallback((): Promise<NeoLineN3Provider> => {
    return new Promise((resolve, reject) => {
      // Check if already initialized
      if (providerRef.current) {
        resolve(providerRef.current);
        return;
      }

      // Check if NeoLine is available
      const win = window as any;
      
      if (win.NEOLineN3) {
        try {
          const provider = new win.NEOLineN3.Init();
          providerRef.current = provider;
          resolve(provider);
        } catch (e) {
          reject(new Error('Failed to initialize NeoLine N3'));
        }
        return;
      }

      // Wait for NeoLine to be ready
      const timeout = setTimeout(() => {
        reject(new Error('NeoLine extension not detected. Please install NeoLine wallet.'));
      }, 5000);

      const handleReady = () => {
        clearTimeout(timeout);
        try {
          const provider = new (window as any).NEOLineN3.Init();
          providerRef.current = provider;
          resolve(provider);
        } catch (e) {
          reject(new Error('Failed to initialize NeoLine N3'));
        }
      };

      window.addEventListener('NEOLine.N3.EVENT.READY', handleReady, { once: true });
    });
  }, []);

  // Fetch balance
  const fetchBalance = useCallback(async (provider: NeoLineN3Provider, address: string) => {
    try {
      const balanceResult = await provider.getBalance({
        address,
        contracts: [GAS_CONTRACT],
      });
      
      // GAS has 8 decimals
      const gasBalance = balanceResult[GAS_CONTRACT] || '0';
      const formattedBalance = (parseFloat(gasBalance) / 1e8).toFixed(4);
      
      setState(prev => ({
        ...prev,
        balance: formattedBalance,
      }));
    } catch (error) {
      console.error('Error fetching NEO balance:', error);
      setState(prev => ({
        ...prev,
        balance: '0',
      }));
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      const provider = await initProvider();
      
      // Check network
      const networks = await provider.getNetworks();
      if (networks.chainId !== 3) {
        // Not on N3 MainNet
        console.warn('NeoLine is not on N3 MainNet, chainId:', networks.chainId);
      }

      // Get account
      const account = await provider.getAccount();
      
      if (!account || !account.address) {
        throw new Error('Failed to get NEO account');
      }

      setState(prev => ({
        ...prev,
        isConnected: true,
        address: account.address,
        formattedAddress: formatAddress(account.address),
        isConnecting: false,
        error: null,
        provider,
      }));

      // Fetch balance
      await fetchBalance(provider, account.address);

    } catch (error: any) {
      console.error('NeoLine connection error:', error);
      
      let errorMessage = 'Failed to connect NeoLine';
      
      if (error.message?.includes('not detected')) {
        errorMessage = 'NeoLine not installed. Please install the NeoLine extension.';
      } else if (error.type === 'CONNECTION_DENIED') {
        errorMessage = 'Connection denied by user';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        balance: null,
        formattedAddress: null,
        isConnecting: false,
        error: errorMessage,
        provider: null,
      }));
    }
  }, [initProvider, fetchBalance]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setState({
      isConnected: false,
      address: null,
      balance: null,
      isConnecting: false,
      error: null,
      formattedAddress: null,
      provider: null,
    });
    providerRef.current = null;
  }, []);

  // Listen for account changes
  useEffect(() => {
    const handleAccountChanged = (account: { address: string }) => {
      if (account && account.address) {
        setState(prev => ({
          ...prev,
          address: account.address,
          formattedAddress: formatAddress(account.address),
        }));
        
        if (providerRef.current) {
          fetchBalance(providerRef.current, account.address);
        }
      } else {
        // Account disconnected
        disconnect();
      }
    };

    window.addEventListener('NEOLine.NEO.EVENT.ACCOUNT_CHANGED', handleAccountChanged as any);
    
    return () => {
      window.removeEventListener('NEOLine.NEO.EVENT.ACCOUNT_CHANGED', handleAccountChanged as any);
    };
  }, [disconnect, fetchBalance]);

  // Listen for network changes
  useEffect(() => {
    const handleNetworkChanged = (result: { chainId: number; networks: string[]; defaultNetwork: string }) => {
      console.log('NEO network changed:', result);
      // Refresh balance on network change
      if (state.address && providerRef.current) {
        fetchBalance(providerRef.current, state.address);
      }
    };

    window.addEventListener('NEOLine.NEO.EVENT.NETWORK_CHANGED', handleNetworkChanged as any);
    
    return () => {
      window.removeEventListener('NEOLine.NEO.EVENT.NETWORK_CHANGED', handleNetworkChanged as any);
    };
  }, [state.address, fetchBalance]);

  // Check if already connected on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const checkConnection = async () => {
      const win = window as any;
      
      // Only check if NeoLine is available
      if (!win.NEOLineN3 && !win.NEOLine) {
        return;
      }

      try {
        const provider = await initProvider();
        const account = await provider.getAccount();
        
        if (account && account.address) {
          setState(prev => ({
            ...prev,
            isConnected: true,
            address: account.address,
            formattedAddress: formatAddress(account.address),
            provider,
          }));
          
          await fetchBalance(provider, account.address);
        }
      } catch (error) {
        // User not connected, that's fine
        console.log('NeoLine not connected on init');
      }
    };

    // Delay check to allow extension to inject
    const timeout = setTimeout(checkConnection, 1000);
    return () => clearTimeout(timeout);
  }, [initProvider, fetchBalance]);

  return {
    ...state,
    connect,
    disconnect,
  };
};
