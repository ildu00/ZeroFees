import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useWalletContext } from '@/contexts/WalletContext';
import { useChain } from '@/contexts/ChainContext';

/**
 * Tracks page views and wallet connect/disconnect events automatically.
 * Place inside BrowserRouter + WalletProvider.
 */
const ActivityTracker = () => {
  const location = useLocation();
  const { logActivity } = useActivityLogger();
  const { isConnected, address, chainType } = useWalletContext();
  const { currentChain } = useChain();
  const prevConnected = useRef(isConnected);
  const prevAddress = useRef(address);

  // Log page views
  useEffect(() => {
    // Skip admin routes
    if (location.pathname.startsWith('/admin')) return;
    logActivity('page_view', { path: location.pathname }, undefined, currentChain.id);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Log wallet connect/disconnect
  useEffect(() => {
    if (isConnected && !prevConnected.current && address) {
      logActivity('wallet_connect', {}, address, currentChain.id);
    }
    if (!isConnected && prevConnected.current && prevAddress.current) {
      logActivity('wallet_disconnect', {}, prevAddress.current, currentChain.id);
    }
    prevConnected.current = isConnected;
    prevAddress.current = address;
  }, [isConnected, address]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default ActivityTracker;
