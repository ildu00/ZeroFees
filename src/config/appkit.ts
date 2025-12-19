import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { base, mainnet } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

// WalletConnect Project ID (public identifier)
const projectId = '4a8f1f90250caf4cf14abd6c1d0fe873';

// Define networks
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [base, mainnet];

// Metadata for the app
const metadata = {
  name: 'ZeroFees',
  description: 'Zero-fee decentralized exchange on Base',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://zerofees.online',
  icons: ['https://zerofees.online/favicon.ico']
};

// Create ethers adapter
const ethersAdapter = new EthersAdapter();

// Create the AppKit instance
export const appkit = createAppKit({
  adapters: [ethersAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: false,
    email: false,
    socials: false,
    legalCheckbox: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#0052FF',
    '--w3m-border-radius-master': '2px'
  },
  enableWalletGuide: false,
});

// Hide branding elements via MutationObserver (for Shadow DOM)
if (typeof window !== 'undefined') {
  const hideReownBranding = () => {
    // Find the w3m-modal element
    const modal = document.querySelector('w3m-modal');
    if (!modal?.shadowRoot) return;

    // Function to hide elements recursively in shadow roots
    const hideInShadow = (root: ShadowRoot | Element) => {
      const selectors = [
        'w3m-legal-footer',
        'wui-legal-footer',
        'w3m-legal-checkbox',
        '[data-testid*="legal"]',
        'wui-flex:has(wui-text[data-testid*="legal"])',
      ];

      const hideEl = (el: Element | null) => {
        let node: Element | null = el;
        for (let i = 0; i < 3 && node; i++) {
          try {
            (node as HTMLElement).style.setProperty('display', 'none', 'important');
            (node as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
            (node as HTMLElement).style.setProperty('height', '0', 'important');
            (node as HTMLElement).style.setProperty('overflow', 'hidden', 'important');
            (node as HTMLElement).style.setProperty('opacity', '0', 'important');
            (node as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
          } catch {
            // ignore
          }
          node = node.parentElement;
        }
      };

      // Selector-based hiding
      selectors.forEach((selector) => {
        try {
          root.querySelectorAll(selector).forEach((el) => hideEl(el));
        } catch {
          // Ignore selector errors
        }
      });

      // Text-based hiding (handles "UX by Reown" / "Powered by Reown" variants)
      try {
        const all = root.querySelectorAll('*');
        all.forEach((el) => {
          const text = (el.textContent || '').trim().toLowerCase();
          if (!text) return;

          const isBrandLine =
            (text.includes('ux by') || text.includes('powered by')) && text.includes('reown');

          if (isBrandLine) hideEl(el);
        });

        // Check nested shadow roots
        all.forEach((el) => {
          const sr = (el as any).shadowRoot as ShadowRoot | undefined;
          if (sr) hideInShadow(sr);
        });
      } catch {
        // ignore
      }
    };

    hideInShadow(modal.shadowRoot);
  };

  // Observe DOM changes to catch when modal appears
  const observer = new MutationObserver(() => {
    hideReownBranding();
  });

  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Also run periodically for a short time after modal opens
  appkit.subscribeEvents((event: any) => {
    if (event.data?.event === 'MODAL_OPEN') {
      const interval = setInterval(hideReownBranding, 100);
      setTimeout(() => clearInterval(interval), 2000);
    }
  });
}

export { networks, projectId };
