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

// Hide branding elements in AppKit modal (Shadow DOM)
// Keep this conservative to avoid accidentally hiding the wallet list UI.
if (typeof window !== 'undefined') {
  const BRAND_LINE_PATTERNS = [
    /^\s*ux by\s+reown\s*$/i,
    /^\s*powered by\s+reown\s*$/i,
  ];

  const hideReownBrandingOnce = () => {
    const modal = document.querySelector('w3m-modal') as any;
    const root = modal?.shadowRoot as ShadowRoot | undefined;
    if (!root) return;

    const hideEl = (el: Element | null) => {
      if (!el) return;
      const h = el as HTMLElement;
      h.style.setProperty('display', 'none', 'important');
      h.style.setProperty('visibility', 'hidden', 'important');
      h.style.setProperty('opacity', '0', 'important');
      h.style.setProperty('pointer-events', 'none', 'important');
      h.style.setProperty('height', '0', 'important');
      h.style.setProperty('overflow', 'hidden', 'important');
    };

    const visit = (node: ShadowRoot | Element) => {
      // Component-based selectors (safe)
      const selectors = [
        'w3m-legal-footer',
        'wui-legal-footer',
        'w3m-legal-checkbox',
        '[data-testid*="legal"]',
      ];

      selectors.forEach((selector) => {
        try {
          node.querySelectorAll(selector).forEach((el) => hideEl(el));
        } catch {
          // ignore
        }
      });

      // Text-based: only hide an element whose *direct* text matches the brand line.
      // This prevents hiding parent containers that include wallet list text.
      try {
        node.querySelectorAll('*').forEach((el) => {
          const directText = Array.from(el.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent || '')
            .join('')
            .trim();

          if (directText && BRAND_LINE_PATTERNS.some((re) => re.test(directText))) {
            hideEl(el);
          }

          const sr = (el as any).shadowRoot as ShadowRoot | undefined;
          if (sr) visit(sr);
        });
      } catch {
        // ignore
      }
    };

    visit(root);
  };

  const runFor = (ms: number) => {
    const start = performance.now();
    const tick = () => {
      hideReownBrandingOnce();
      if (performance.now() - start < ms) requestAnimationFrame(tick);
    };
    tick();
  };

  // Only run on modal open; no global MutationObserver (it was hiding wallet list).
  appkit.subscribeEvents((event: any) => {
    if (event.data?.event === 'MODAL_OPEN') runFor(1500);
  });
}

export { networks, projectId };
