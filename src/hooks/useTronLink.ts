import { useState, useCallback, useEffect } from 'react';

// TronLink types
interface TronWeb {
  ready: boolean;
  defaultAddress: {
    base58: string;
    hex: string;
  };
  trx: {
    getBalance: (address: string) => Promise<number>;
    sign: (transaction: unknown) => Promise<unknown>;
    sendRawTransaction: (signedTransaction: unknown) => Promise<unknown>;
  };
  toSun: (amount: number) => number;
  fromSun: (amount: number) => number;
  contract: () => {
    at: (address: string) => Promise<unknown>;
  };
  transactionBuilder: {
    triggerSmartContract: (
      contractAddress: string,
      functionSelector: string,
      options: { feeLimit?: number; callValue?: number },
      parameters: unknown[],
      issuerAddress: string
    ) => Promise<{ transaction: unknown }>;
  };
}

interface TronLinkState {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  tronWeb: TronWeb | null;
}

declare global {
  interface Window {
    tronWeb?: TronWeb;
    tronLink?: {
      ready: boolean;
      request: (args: { method: string }) => Promise<unknown>;
    };
  }
}

const formatTronBalance = (sunBalance: number): string => {
  const trxBalance = sunBalance / 1_000_000;
  return trxBalance.toFixed(4);
};

const formatTronAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const useTronLink = () => {
  const [state, setState] = useState<TronLinkState>({
    isInstalled: false,
    isConnected: false,
    address: null,
    balance: null,
    isConnecting: false,
    error: null,
    tronWeb: null,
  });

  // Check if TronLink is installed
  const checkTronLink = useCallback(() => {
    const tronWeb = window.tronWeb;
    const tronLink = window.tronLink;

    if (tronWeb && tronLink) {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        tronWeb: tronWeb,
      }));

      // Check if already connected
      if (tronWeb.ready && tronWeb.defaultAddress?.base58) {
        fetchBalance(tronWeb.defaultAddress.base58, tronWeb);
        setState(prev => ({
          ...prev,
          isConnected: true,
          address: tronWeb.defaultAddress.base58,
        }));
      }

      return true;
    }
    return false;
  }, []);

  // Fetch balance
  const fetchBalance = async (address: string, tronWeb: TronWeb) => {
    try {
      const balanceInSun = await tronWeb.trx.getBalance(address);
      const balance = formatTronBalance(balanceInSun);
      setState(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error('Error fetching TRX balance:', error);
    }
  };

  // Connect to TronLink
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if TronLink is installed
      if (!window.tronLink || !window.tronWeb) {
        // TronLink not installed, open install page
        window.open('https://www.tronlink.org/', '_blank');
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'TronLink not installed. Please install TronLink wallet.',
        }));
        return;
      }

      // Request account access
      const result = await window.tronLink.request({ method: 'tron_requestAccounts' });
      
      if (result) {
        // Wait a bit for TronWeb to be ready
        await new Promise(resolve => setTimeout(resolve, 500));

        const tronWeb = window.tronWeb;
        if (tronWeb && tronWeb.ready && tronWeb.defaultAddress?.base58) {
          const address = tronWeb.defaultAddress.base58;
          await fetchBalance(address, tronWeb);
          
          setState(prev => ({
            ...prev,
            isConnected: true,
            address,
            tronWeb,
            isConnecting: false,
          }));
        } else {
          throw new Error('Failed to get TronLink address');
        }
      }
    } catch (error) {
      console.error('TronLink connection error:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect to TronLink',
      }));
    }
  }, []);

  // Disconnect (TronLink doesn't have native disconnect, so we just reset state)
  const disconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      address: null,
      balance: null,
    }));
  }, []);

  // Listen for account changes
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.message?.action === 'setAccount') {
        const address = e.data.message?.data?.address;
        if (address && window.tronWeb) {
          setState(prev => ({
            ...prev,
            address,
            isConnected: true,
          }));
          fetchBalance(address, window.tronWeb);
        }
      }

      if (e.data?.message?.action === 'disconnect') {
        setState(prev => ({
          ...prev,
          isConnected: false,
          address: null,
          balance: null,
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initial check
  useEffect(() => {
    // Give TronLink time to inject
    const timer = setTimeout(() => {
      checkTronLink();
    }, 100);

    return () => clearTimeout(timer);
  }, [checkTronLink]);

  return {
    ...state,
    formattedAddress: state.address ? formatTronAddress(state.address) : null,
    connect,
    disconnect,
  };
};

export default useTronLink;
