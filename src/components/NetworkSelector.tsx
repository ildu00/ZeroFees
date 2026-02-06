import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useChain } from '@/contexts/ChainContext';
import { CHAIN_GROUPS, ChainConfig } from '@/config/chains';
import { cn } from '@/lib/utils';

const NetworkSelector = () => {
  const { currentChain, switchChain, availableChains } = useChain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChainSelect = async (chainId: string) => {
    await switchChain(chainId);
    setIsOpen(false);
  };

  const getChainsByGroup = (groupKey: string): ChainConfig[] => {
    const group = CHAIN_GROUPS[groupKey as keyof typeof CHAIN_GROUPS];
    if (!group) return [];
    return group.chains
      .map((id) => availableChains.find((c) => c.id === id))
      .filter((c): c is ChainConfig => !!c);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl",
          "bg-secondary/50 hover:bg-secondary/80 border border-border/30",
          "transition-all duration-200",
          "text-sm font-medium"
        )}
      >
        <span className="text-lg">{currentChain.icon}</span>
        <span className="hidden sm:inline text-foreground">{currentChain.shortName}</span>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          "absolute top-full right-0 mt-2 w-64",
          "bg-card border border-border/50 rounded-xl shadow-xl",
          "z-50 overflow-hidden animate-scale-in",
          "backdrop-blur-xl"
        )}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/30 bg-secondary/30">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Globe className="w-4 h-4 text-primary" />
              Select Network
            </div>
          </div>

          {/* Chain Groups */}
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(CHAIN_GROUPS).map(([groupKey, group]) => {
              const chains = getChainsByGroup(groupKey);
              if (chains.length === 0) return null;

              return (
                <div key={groupKey}>
                  {/* Group Label */}
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/20">
                    {group.label}
                  </div>

                  {/* Chains in Group */}
                  {chains.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => handleChainSelect(chain.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3",
                        "hover:bg-secondary/50 transition-colors",
                        currentChain.id === chain.id && "bg-primary/10"
                      )}
                    >
                      {/* Chain Icon */}
                      <span className="text-xl w-8 h-8 flex items-center justify-center rounded-full bg-secondary/50">
                        {chain.icon}
                      </span>

                      {/* Chain Info */}
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-foreground">
                          {chain.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {chain.dex.name}
                        </div>
                      </div>

                      {/* Selected Indicator */}
                      {currentChain.id === chain.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}

                      {/* Chain Type Badge */}
                      {chain.type !== 'evm' && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                          chain.type === 'tron' && "bg-destructive/20 text-destructive",
                          chain.type === 'neo' && "bg-primary/20 text-primary"
                        )}>
                          {chain.type}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2 border-t border-border/30 bg-secondary/20">
            <p className="text-[10px] text-muted-foreground text-center">
              Different networks require different wallets
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkSelector;
