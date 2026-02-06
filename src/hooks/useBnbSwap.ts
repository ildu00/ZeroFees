import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { toast } from 'sonner';

// BSC chain config
const BSC_CHAIN_CONFIG = {
  chainId: '0x38',
  chainName: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: ['https://bsc-dataseed.binance.org'],
  blockExplorerUrls: ['https://bscscan.com'],
};

// BEP-20 Token Configuration
export const BNB_TOKENS: Record<string, { symbol: string; name: string; address: string; decimals: number; icon: string }> = {
  BNB:    { symbol: 'BNB',   name: 'BNB',              address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '🟡' },
  WBNB:   { symbol: 'WBNB',  name: 'Wrapped BNB',      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, icon: '🟡' },
  USDT:   { symbol: 'USDT',  name: 'Tether USD',       address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, icon: '💲' },
  USDC:   { symbol: 'USDC',  name: 'USD Coin',         address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18, icon: '💵' },
  BUSD:   { symbol: 'BUSD',  name: 'Binance USD',      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18, icon: '💵' },
  CAKE:   { symbol: 'CAKE',  name: 'PancakeSwap',      address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18, icon: '🥞' },
  ETH:    { symbol: 'ETH',   name: 'Ethereum',         address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18, icon: '⟠' },
  BTCB:   { symbol: 'BTCB',  name: 'Bitcoin BEP2',     address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', decimals: 18, icon: '₿' },
  XRP:    { symbol: 'XRP',   name: 'XRP',              address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', decimals: 18, icon: '💧' },
  ADA:    { symbol: 'ADA',   name: 'Cardano',          address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', decimals: 18, icon: '🔵' },
  DOT:    { symbol: 'DOT',   name: 'Polkadot',         address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402', decimals: 18, icon: '⬛' },
  LINK:   { symbol: 'LINK',  name: 'Chainlink',        address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', decimals: 18, icon: '🔗' },
  UNI:    { symbol: 'UNI',   name: 'Uniswap',          address: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1', decimals: 18, icon: '🦄' },
  DOGE:   { symbol: 'DOGE',  name: 'Dogecoin',         address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', decimals: 8,  icon: '🐕' },
  SHIB:   { symbol: 'SHIB',  name: 'Shiba Inu',        address: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D', decimals: 18, icon: '🐶' },
  MATIC:  { symbol: 'MATIC', name: 'Polygon',          address: '0xCC42724C6683B7E57334c4E856f4c9965ED682bD', decimals: 18, icon: '💜' },
  AVAX:   { symbol: 'AVAX',  name: 'Avalanche',        address: '0x1CE0c2827e2eF14D5C4f29a091d735A204794041', decimals: 18, icon: '🔺' },
  DAI:    { symbol: 'DAI',   name: 'Dai Stablecoin',   address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18, icon: '🔶' },
  XVS:    { symbol: 'XVS',   name: 'Venus',            address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63', decimals: 18, icon: '🪐' },
  TWT:    { symbol: 'TWT',   name: 'Trust Wallet',     address: '0x4B0F1812e5Df2A09796481Ff14017e6005508003', decimals: 18, icon: '🛡️' },
};

// PancakeSwap V2 Router
const PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';

// ReGraph fee config
const REGRAPH_FEE_PERCENT = 0.3;
const REGRAPH_FEE_WALLET = '0x320b6a1080d6c2abbbff1a6e1d105812e4fb2716';

// ERC20 ABI selectors
const ERC20_ABI = {
  approve: '0x095ea7b3',
  balanceOf: '0x70a08231',
};

export interface BnbSwapQuote {
  amountOut: string;
  fee: number;
  route: string;
  priceImpact?: number;
  decimalsOut?: number;
  source?: string;
}

export interface TokenPrices {
  [key: string]: number;
}

export interface TokenBalances {
  [key: string]: string;
}

interface ProviderRequest {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export const useBnbSwap = () => {
  const { address, isConnected, walletProvider } = useWalletContext();
  const [prices, setPrices] = useState<TokenPrices>({});
  const [balances, setBalances] = useState<TokenBalances>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isWalletActionPending, setIsWalletActionPending] = useState(false);
  const walletActionDepthRef = useRef(0);
  const [quote, setQuote] = useState<BnbSwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const getProvider = useCallback((): ProviderRequest | null => {
    if (walletProvider) return walletProvider as unknown as ProviderRequest;
    if (typeof window !== 'undefined' && window.ethereum) return window.ethereum as unknown as ProviderRequest;
    return null;
  }, [walletProvider]);

  const beginWalletAction = useCallback(() => {
    walletActionDepthRef.current += 1;
    setIsWalletActionPending(true);
  }, []);

  const endWalletAction = useCallback(() => {
    walletActionDepthRef.current = Math.max(0, walletActionDepthRef.current - 1);
    if (walletActionDepthRef.current === 0) setIsWalletActionPending(false);
  }, []);

  // Fetch token prices
  const fetchPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-pancakeswap-quote', {
        body: { action: 'prices' },
      });
      if (error) throw error;
      setPrices(data.prices);
    } catch (error) {
      console.error('Error fetching BNB prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, []);

  // Fetch token balances
  const fetchBalances = useCallback(async () => {
    if (isWalletActionPending) return;
    const provider = getProvider();
    if (!address || !provider) { setBalances({}); return; }

    setIsLoadingBalances(true);
    try {
      const newBalances: TokenBalances = {};

      const chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== BSC_CHAIN_CONFIG.chainId) { setBalances({}); setIsLoadingBalances(false); return; }

      // BNB native balance
      const bnbBalance = (await provider.request({ method: 'eth_getBalance', params: [address, 'latest'] })) as string;
      newBalances['BNB'] = (Number(BigInt(bnbBalance)) / 1e18).toFixed(6);

      // BEP-20 balances
      const tokens = Object.entries(BNB_TOKENS).filter(([s]) => s !== 'BNB');
      await Promise.all(
        tokens.map(async ([symbol, token]) => {
          try {
            const paddedAddress = address.toLowerCase().replace('0x', '').padStart(64, '0');
            const data = `${ERC20_ABI.balanceOf}${paddedAddress}`;
            const result = (await provider.request({ method: 'eth_call', params: [{ to: token.address, data }, 'latest'] })) as string;
            if (result && result !== '0x') {
              newBalances[symbol] = (Number(BigInt(result)) / Math.pow(10, token.decimals)).toFixed(6);
            } else {
              newBalances[symbol] = '0';
            }
          } catch { newBalances[symbol] = '0'; }
        })
      );
      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching BNB balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address, getProvider, isWalletActionPending]);

  // Fetch quote
  const fetchQuote = useCallback(async (
    tokenIn: string, tokenOut: string, amountIn: string, decimalsIn: number, decimalsOut: number
  ) => {
    if (!amountIn || parseFloat(amountIn) === 0) { setQuote(null); return null; }

    setIsLoadingQuote(true);
    try {
      const amountInWei = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, decimalsIn))).toString();
      const { data, error } = await supabase.functions.invoke('get-pancakeswap-quote', {
        body: { action: 'quote', tokenIn, tokenOut, amountIn: amountInWei },
      });
      if (error) throw error;
      setQuote({ ...data, decimalsOut });
      return data;
    } catch (error) {
      console.error('Error fetching BNB quote:', error);
      return null;
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  // Switch to BSC
  const switchToBsc = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return false;
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_CHAIN_CONFIG.chainId }] });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await provider.request({ method: 'wallet_addEthereumChain', params: [BSC_CHAIN_CONFIG] });
          return true;
        } catch { return false; }
      }
      return false;
    }
  }, [getProvider]);

  // Approve token
  const approveToken = useCallback(async (tokenAddress: string, amount: string) => {
    const provider = getProvider();
    if (!provider || !address) return false;
    if (tokenAddress === BNB_TOKENS.BNB.address) return true;

    try {
      beginWalletAction();
      const spender = PANCAKE_ROUTER.toLowerCase().replace('0x', '').padStart(64, '0');
      const value = BigInt(amount).toString(16).padStart(64, '0');
      const data = `${ERC20_ABI.approve}${spender}${value}`;

      const txHash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: tokenAddress, data }],
      })) as string;

      toast.success('Approval sent!', { description: 'Waiting for confirmation...' });

      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
        if (receipt) return true;
      }
      return true;
    } catch (error: any) {
      if (error.code === 4001) toast.error('Approval rejected');
      else toast.error('Approval failed');
      return false;
    } finally {
      endWalletAction();
    }
  }, [address, getProvider, beginWalletAction, endWalletAction]);

  // Send ReGraph fee
  const sendReGraphFee = useCallback(async (
    tokenAddress: string, feeAmount: string
  ): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || !address) return false;

    try {
      if (tokenAddress === BNB_TOKENS.BNB.address) {
        const value = '0x' + BigInt(feeAmount).toString(16);
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from: address, to: REGRAPH_FEE_WALLET, value }],
        }) as string;
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
          if (receipt) return true;
        }
        return true;
      } else {
        const recipient = REGRAPH_FEE_WALLET.toLowerCase().replace('0x', '').padStart(64, '0');
        const amount = BigInt(feeAmount).toString(16).padStart(64, '0');
        const transferData = `0xa9059cbb${recipient}${amount}`;
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from: address, to: tokenAddress, data: transferData }],
        }) as string;
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
          if (receipt) return true;
        }
        return true;
      }
    } catch (error: any) {
      if (error.code === 4001) toast.error('Fee transfer rejected');
      return false;
    }
  }, [address, getProvider]);

  // Execute swap via PancakeSwap V2 Router
  const executeSwap = useCallback(async (
    tokenIn: { symbol: string; address: string; decimals: number },
    tokenOut: { symbol: string; address: string; decimals: number },
    amountIn: string,
    amountOutMin: string,
    slippage: number = 0.5
  ) => {
    const provider = getProvider();
    if (!provider || !address || !quote) return null;

    setIsSwapping(true);
    try {
      beginWalletAction();

      // Switch to BSC if needed
      const chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== BSC_CHAIN_CONFIG.chainId) {
        const switched = await switchToBsc();
        if (!switched) { toast.error('Please switch to BNB Smart Chain'); return null; }
      }

      // Calculate ReGraph fee (0.3%)
      const totalAmountWei = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, tokenIn.decimals)));
      const feeAmountWei = (totalAmountWei * BigInt(3)) / BigInt(1000);
      const swapAmountWei = totalAmountWei - feeAmountWei;

      // Send fee
      toast.info('Sending ReGraph fee (0.3%)...', { id: 'regraph-fee' });
      const feeSent = await sendReGraphFee(tokenIn.address, feeAmountWei.toString());
      toast.dismiss('regraph-fee');
      if (!feeSent) { toast.error('Fee transfer failed'); return null; }
      toast.success('ReGraph fee sent!');

      const amountInWei = swapAmountWei.toString();
      const minOut = (BigInt(quote.amountOut) * BigInt(100 - Math.floor(slippage * 10)) / BigInt(1000)).toString();
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      // Approve if not BNB
      if (tokenIn.address !== BNB_TOKENS.BNB.address) {
        const approved = await approveToken(tokenIn.address, amountInWei);
        if (!approved) return null;
      }

      // Build PancakeSwap V2 swap transaction
      // PancakeSwap V2 uses Uniswap V2 style router with path array
      const WBNB = BNB_TOKENS.WBNB.address;
      const path = tokenIn.address === BNB_TOKENS.BNB.address
        ? [WBNB, tokenOut.address]
        : tokenOut.address === BNB_TOKENS.BNB.address
          ? [tokenIn.address, WBNB]
          : [tokenIn.address, WBNB, tokenOut.address];

      let txData: string;
      let value = '0x0';

      // Encode the path for ABI
      const encodePath = (p: string[]): string => {
        // offset + length + addresses
        const offset = '0000000000000000000000000000000000000000000000000000000000000080'; // offset to path array
        const deadlineHex = BigInt(deadline).toString(16).padStart(64, '0');
        const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const recipientPadded = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const pathLength = BigInt(p.length).toString(16).padStart(64, '0');
        const pathEncoded = p.map(a => a.toLowerCase().replace('0x', '').padStart(64, '0')).join('');

        return `${amountInHex}${amountOutMinHex}${recipientPadded}${deadlineHex}${offset.replace('80', (BigInt(128).toString(16)).padStart(64, '0'))}${pathLength}${pathEncoded}`;
      };

      if (tokenIn.address === BNB_TOKENS.BNB.address) {
        // swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)
        value = '0x' + BigInt(amountInWei).toString(16);
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const recipientPadded = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = BigInt(deadline).toString(16).padStart(64, '0');
        const pathOffset = BigInt(128).toString(16).padStart(64, '0'); // 4 * 32 = 128 bytes
        const pathLength = BigInt(path.length).toString(16).padStart(64, '0');
        const pathEncoded = path.map(a => a.toLowerCase().replace('0x', '').padStart(64, '0')).join('');
        
        // swapExactETHForTokens selector: 0x7ff36ab5
        txData = `0x7ff36ab5${amountOutMinHex}${pathOffset}${recipientPadded}${deadlineHex}${pathLength}${pathEncoded}`;
      } else if (tokenOut.address === BNB_TOKENS.BNB.address) {
        // swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)
        const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const recipientPadded = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = BigInt(deadline).toString(16).padStart(64, '0');
        const pathOffset = BigInt(160).toString(16).padStart(64, '0'); // 5 * 32 = 160 bytes
        const pathLength = BigInt(path.length).toString(16).padStart(64, '0');
        const pathEncoded = path.map(a => a.toLowerCase().replace('0x', '').padStart(64, '0')).join('');

        // swapExactTokensForETH selector: 0x18cbafe5
        txData = `0x18cbafe5${amountInHex}${amountOutMinHex}${pathOffset}${recipientPadded}${deadlineHex}${pathLength}${pathEncoded}`;
      } else {
        // swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)
        const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const recipientPadded = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = BigInt(deadline).toString(16).padStart(64, '0');
        const pathOffset = BigInt(160).toString(16).padStart(64, '0');
        const pathLength = BigInt(path.length).toString(16).padStart(64, '0');
        const pathEncoded = path.map(a => a.toLowerCase().replace('0x', '').padStart(64, '0')).join('');

        // swapExactTokensForTokens selector: 0x38ed1739
        txData = `0x38ed1739${amountInHex}${amountOutMinHex}${pathOffset}${recipientPadded}${deadlineHex}${pathLength}${pathEncoded}`;
      }

      toast.info('Please confirm the swap in your wallet');

      const txHash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: PANCAKE_ROUTER, data: txData, value }],
      })) as string;

      toast.success('Swap submitted!', {
        description: 'Waiting for confirmation...',
        action: {
          label: 'View',
          onClick: () => window.open(`https://bscscan.com/tx/${txHash}`, '_blank'),
        },
      });

      return txHash;
    } catch (error: any) {
      toast.dismiss('regraph-fee');
      if (error.code === 4001) toast.error('Swap rejected');
      else toast.error('Swap failed', { description: error.message });
      return null;
    } finally {
      endWalletAction();
      setIsSwapping(false);
    }
  }, [address, quote, switchToBsc, approveToken, getProvider, beginWalletAction, endWalletAction, sendReGraphFee]);

  // Auto-fetch prices
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Fetch balances
  useEffect(() => {
    if (isWalletActionPending) return;
    if (isConnected && address) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 15000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, fetchBalances, isWalletActionPending]);

  return {
    prices,
    balances,
    isLoadingPrices,
    isLoadingBalances,
    quote,
    isLoadingQuote,
    isSwapping,
    fetchQuote,
    fetchBalances,
    executeSwap,
    switchToBsc,
    BNB_TOKENS,
  };
};
