import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { toast } from 'sonner';

// Base chain config
const BASE_CHAIN_ID = 8453;
const BASE_CHAIN_CONFIG = {
  chainId: '0x2105',
  chainName: 'Base',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

// Token addresses on Base
export const BASE_TOKENS = {
  ETH: { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '⟠' },
  WETH: { symbol: 'WETH', name: 'Wrapped Ethereum', address: '0x4200000000000000000000000000000000000006', decimals: 18, icon: '⟠' },
  USDC: { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, icon: '💲' },
  USDbC: { symbol: 'USDbC', name: 'USD Base Coin', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', decimals: 6, icon: '💲' },
  DAI: { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18, icon: '◈' },
  cbETH: { symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18, icon: '🔵' },
  AERO: { symbol: 'AERO', name: 'Aerodrome', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18, icon: '✈️' },
};

// Uniswap V3 SwapRouter02 on Base
const SWAP_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';

// ERC20 approve ABI
const ERC20_ABI = {
  approve: '0x095ea7b3',
  allowance: '0xdd62ed3e',
};

export interface SwapQuote {
  amountOut: string;
  fee: number;
  route: string;
  priceImpact?: number;
  decimalsOut?: number;
}

export interface TokenPrices {
  [key: string]: number;
}

export const useSwap = () => {
  const { address, isConnected } = useWalletContext();
  const [prices, setPrices] = useState<TokenPrices>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Fetch token prices
  const fetchPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-swap-quote', {
        body: { action: 'prices' },
      });
      
      if (error) throw error;
      setPrices(data.prices);
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, []);

  // Fetch quote
  const fetchQuote = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    decimalsIn: number,
    decimalsOut: number
  ) => {
    if (!amountIn || parseFloat(amountIn) === 0) {
      setQuote(null);
      return null;
    }

    setIsLoadingQuote(true);
    try {
      // Convert to wei based on input token decimals
      const amountInWei = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, decimalsIn))).toString();
      
      const { data, error } = await supabase.functions.invoke('get-swap-quote', {
        body: { action: 'quote', tokenIn, tokenOut, amountIn: amountInWei },
      });
      
      if (error) throw error;
      
      // Store decimalsOut in quote for later use
      setQuote({ ...data, decimalsOut });
      return data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      setQuote(null);
      return null;
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  // Switch to Base network
  const switchToBase = useCallback(async () => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_CONFIG.chainId }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_CHAIN_CONFIG],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Base chain:', addError);
          return false;
        }
      }
      console.error('Error switching to Base:', switchError);
      return false;
    }
  }, []);

  // Check and approve token
  const approveToken = useCallback(async (
    tokenAddress: string,
    amount: string
  ) => {
    if (!window.ethereum || !address) return false;
    if (tokenAddress === BASE_TOKENS.ETH.address) return true; // No approval needed for ETH

    try {
      // Encode approve call
      const spender = SWAP_ROUTER.toLowerCase().replace('0x', '').padStart(64, '0');
      const value = BigInt(amount).toString(16).padStart(64, '0');
      const data = `${ERC20_ABI.approve}${spender}${value}`;

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: tokenAddress,
          data,
        }],
      });

      toast.success('Approval sent!', { description: 'Waiting for confirmation...' });
      
      // Wait for confirmation
      let confirmed = false;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        if (receipt) {
          confirmed = true;
          break;
        }
      }

      return confirmed;
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error('Approval rejected');
      } else {
        toast.error('Approval failed');
      }
      return false;
    }
  }, [address]);

  // Execute swap
  const executeSwap = useCallback(async (
    tokenIn: { symbol: string; address: string; decimals: number },
    tokenOut: { symbol: string; address: string; decimals: number },
    amountIn: string,
    amountOutMin: string,
    slippage: number = 0.5
  ) => {
    if (!window.ethereum || !address || !quote) return null;

    setIsSwapping(true);
    try {
      // Switch to Base if needed
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== BASE_CHAIN_CONFIG.chainId) {
        const switched = await switchToBase();
        if (!switched) {
          toast.error('Please switch to Base network');
          return null;
        }
      }

      const amountInWei = (parseFloat(amountIn) * Math.pow(10, tokenIn.decimals)).toFixed(0);
      const minOut = (BigInt(quote.amountOut) * BigInt(100 - Math.floor(slippage * 10)) / BigInt(1000)).toString();
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

      // Approve if not ETH
      if (tokenIn.address !== BASE_TOKENS.ETH.address) {
        const approved = await approveToken(tokenIn.address, amountInWei);
        if (!approved) return null;
      }

      // Build swap transaction
      let txData: string;
      let value = '0x0';

      if (tokenIn.address === BASE_TOKENS.ETH.address) {
        // ETH -> Token: exactInputSingle with value
        value = '0x' + BigInt(amountInWei).toString(16);
        const tokenInAddr = BASE_TOKENS.WETH.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const tokenOutAddr = tokenOut.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const fee = quote.fee.toString(16).padStart(64, '0');
        const recipient = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = deadline.toString(16).padStart(64, '0');
        const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const sqrtPrice = '0'.padStart(64, '0');

        txData = `0x414bf389${tokenInAddr}${tokenOutAddr}${fee}${recipient}${deadlineHex}${amountInHex}${amountOutMinHex}${sqrtPrice}`;
      } else if (tokenOut.address === BASE_TOKENS.ETH.address) {
        // Token -> ETH
        const tokenInAddr = tokenIn.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const tokenOutAddr = BASE_TOKENS.WETH.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const fee = quote.fee.toString(16).padStart(64, '0');
        const recipient = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = deadline.toString(16).padStart(64, '0');
        const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const sqrtPrice = '0'.padStart(64, '0');

        txData = `0x414bf389${tokenInAddr}${tokenOutAddr}${fee}${recipient}${deadlineHex}${amountInHex}${amountOutMinHex}${sqrtPrice}`;
      } else {
        // Token -> Token
        const tokenInAddr = tokenIn.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const tokenOutAddr = tokenOut.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const fee = quote.fee.toString(16).padStart(64, '0');
        const recipient = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = deadline.toString(16).padStart(64, '0');
        const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const sqrtPrice = '0'.padStart(64, '0');

        txData = `0x414bf389${tokenInAddr}${tokenOutAddr}${fee}${recipient}${deadlineHex}${amountInHex}${amountOutMinHex}${sqrtPrice}`;
      }

      toast.info('Please confirm the swap in your wallet');

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: SWAP_ROUTER,
          data: txData,
          value,
        }],
      });

      toast.success('Swap submitted!', {
        description: 'Waiting for confirmation...',
        action: {
          label: 'View',
          onClick: () => window.open(`https://basescan.org/tx/${txHash}`, '_blank'),
        },
      });

      return txHash as string;
    } catch (error: any) {
      console.error('Swap error:', error);
      if (error.code === 4001) {
        toast.error('Swap rejected');
      } else {
        toast.error('Swap failed', { description: error.message });
      }
      return null;
    } finally {
      setIsSwapping(false);
    }
  }, [address, quote, switchToBase, approveToken]);

  // Fetch prices on mount
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    prices,
    isLoadingPrices,
    quote,
    isLoadingQuote,
    isSwapping,
    fetchQuote,
    executeSwap,
    switchToBase,
    BASE_TOKENS,
  };
};