import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { base, mainnet } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

// WalletConnect Project ID (public identifier)
const projectId = '4a8f1f90250caf4cf14abd6c1d0fe873';

// Define networks
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [base, mainnet];

// Metadata for the app
// IMPORTANT:
// - Mobile WalletConnect relies heavily on metadata.url.
// - Some WalletConnect project settings may only allow the production domain.
const FALLBACK_PUBLIC_URL = 'https://zerofees.online';

const getMetadataUrl = () => {
  if (typeof window === 'undefined') return FALLBACK_PUBLIC_URL;

  const { hostname, origin } = window.location;
  const isPreviewHost =
    hostname.endsWith('lovableproject.com') ||
    hostname.endsWith('lovable.app') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1';

  return isPreviewHost ? FALLBACK_PUBLIC_URL : origin;
};

const metadata = {
  name: 'ZeroFees',
  description: 'Zero-fee decentralized exchange on Base',
  url: getMetadataUrl(),
  icons: [getMetadataUrl() + '/favicon.ico'],
};

// Create ethers adapter
const ethersAdapter = new EthersAdapter();

// Create the AppKit instance
export const appkit = createAppKit({
  adapters: [ethersAdapter],
  networks,
  defaultNetwork: base,
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
  // Enable injected wallets (MetaMask browser extension)
  enableInjected: true,
  // Enable EIP-6963 for better wallet detection
  enableEIP6963: true,
});

// Hide branding elements in AppKit modal (Shadow DOM)
// Keep this conservative to avoid accidentally hiding the wallet list UI.
if (typeof window !== 'undefined') {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const normalize = (t: string) =>
    t.toLowerCase().replace(/\s+/g, ' ').trim();

  const isBrandPrefixText = (t: string) => {
    const text = normalize(t);
    if (!text) return false;
    // Keep short to avoid matching whole modal sections.
    if (text.length > 120) return false;
    return text.includes('ux by') || text.includes('powered by');
  };

  const isBrandNameText = (t: string) => {
    const text = normalize(t);
    if (!text) return false;
    if (text.length > 40) return false;
    return text === 'reown' || text.endsWith(' reown');
  };

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

      // Text-based: find a small node that contains the branding line.
      // Heuristics are important to avoid hiding connector list containers.
      try {
        node.querySelectorAll('*').forEach((el) => {
          const directText = Array.from(el.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent || '')
            .join('')
            .trim();

          const fullText = (el.textContent || '').trim();
          const candidateText = directText || fullText;

          // Ignore any container-ish nodes.
          const descendantCount = el.querySelectorAll('*').length;
          const hasInteractive =
            el.querySelectorAll('button,a,input,select,textarea').length > 0;

          if (!hasInteractive && descendantCount < 12) {
            const parent = el.parentElement;

            // Case A: the element contains "UX by" / "Powered by" (sometimes "Reown" is in a sibling)
            if (isBrandPrefixText(candidateText)) {
              hideEl(el);

              if (parent) {
                const parentHasInteractive =
                  parent.querySelectorAll('button,a,input,select,textarea').length > 0;
                const children = Array.from(parent.children);

                if (!parentHasInteractive && children.length <= 6) {
                  children.forEach((ch) => {
                    if (isBrandNameText(ch.textContent || '')) hideEl(ch);
                  });
                }
              }
            }

            // Case B: "Reown" is separate; hide it only if its parent also includes the prefix text
            if (
              isBrandNameText(candidateText) &&
              parent &&
              isBrandPrefixText(parent.textContent || '')
            ) {
              const parentHasInteractive =
                parent.querySelectorAll('button,a,input,select,textarea').length > 0;
              const parentDesc = parent.querySelectorAll('*').length;

              if (!parentHasInteractive && parentDesc < 20) hideEl(el);
            }
          }

          const sr = (el as any).shadowRoot as ShadowRoot | undefined;
          if (sr) visit(sr);
        });

        // Fallback: scan text nodes (handles cases where "UX by" is not reflected in directText)
        try {
          const walker = document.createTreeWalker(
            node as any,
            NodeFilter.SHOW_TEXT
          );

          let t = walker.nextNode() as Text | null;
          while (t) {
            const txt = t.nodeValue || '';
            if (isBrandPrefixText(txt)) {
              const el = (t.parentElement as Element | null) ?? null;
              hideEl(el);

              const p = el?.parentElement ?? null;
              if (p) {
                const parentHasInteractive =
                  p.querySelectorAll('button,a,input,select,textarea').length > 0;
                const parentDesc = p.querySelectorAll('*').length;

                if (!parentHasInteractive && parentDesc < 20) {
                  p.querySelectorAll('*').forEach((x) => {
                    if (isBrandNameText(x.textContent || '')) hideEl(x);
                  });
                }
              }
            }
            t = walker.nextNode() as Text | null;
          }
        } catch {
          // ignore
        }
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

    // On iOS, do fewer delayed passes to minimize interference
    if (isIOS) {
      setTimeout(hideReownBrandingOnce, 2000);
      setTimeout(hideReownBrandingOnce, 5000);
    } else {
      setTimeout(hideReownBrandingOnce, 1500);
      setTimeout(hideReownBrandingOnce, 3500);
      setTimeout(hideReownBrandingOnce, 8000);
      setTimeout(hideReownBrandingOnce, 12000);
    }
  };

  // Only run on modal open; no global MutationObserver (it can hide wallet list).
  appkit.subscribeEvents((event: any) => {
    if (event.data?.event === 'MODAL_OPEN') {
      // On iOS, run for shorter time to avoid interfering with WalletConnect
      runFor(isIOS ? 8000 : 15000);
    }
  });
}

export { networks, projectId };
