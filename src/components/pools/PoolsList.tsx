import { useState, useMemo } from "react";
import { TrendingUp, Droplets, Plus, RefreshCw, AlertCircle, Search, ArrowUpDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PoolCard from "./PoolCard";
import AddLiquidityModal from "./AddLiquidityModal";
import { useUniswapPools, Pool } from "@/hooks/useUniswapPools";
import { useChain } from "@/contexts/ChainContext";

const formatCurrency = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

type SortOption = 'tvl' | 'apr' | 'volume';

const PoolsList = () => {
  const { pools, loading, error, refetch } = useUniswapPools();
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('tvl');

  const filteredAndSortedPools = useMemo(() => {
    let result = [...pools];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(pool => 
        pool.token0.symbol.toLowerCase().includes(query) ||
        pool.token1.symbol.toLowerCase().includes(query)
      );
    }
    
    // Sort pools
    result.sort((a, b) => {
      switch (sortBy) {
        case 'apr':
          return b.apr - a.apr;
        case 'volume':
          return b.volume24h - a.volume24h;
        case 'tvl':
        default:
          return b.tvl - a.tvl;
      }
    });
    
    return result;
  }, [pools, searchQuery, sortBy]);

  const totalTVL = pools.reduce((acc, pool) => acc + pool.tvl, 0);
  const totalVolume = pools.reduce((acc, pool) => acc + pool.volume24h, 0);
  const avgAPR = pools.length > 0 ? pools.reduce((acc, pool) => acc + pool.apr, 0) / pools.length : 0;

  const handleAddLiquidity = (pool: Pool) => {
    setSelectedPool(pool);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Droplets className="w-4 h-4" />
            <span className="text-sm">Total Value Locked</span>
          </div>
          <p className="text-2xl font-bold text-gradient">
            {loading ? "Loading..." : formatCurrency(totalTVL)}
          </p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">24h Volume</span>
          </div>
          <p className="text-2xl font-bold">
            {loading ? "Loading..." : formatCurrency(totalVolume)}
          </p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <span className="text-sm">Average APR</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {loading ? "Loading..." : `${avgAPR.toFixed(1)}%`}
          </p>
        </div>
      </div>

      {/* Pools Header with Search and Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Liquidity Pools on Base</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={refetch}
            disabled={loading}
            className="h-8 w-8"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[200px] bg-secondary/50 border-border/50"
            />
          </div>
          
          {/* Sort Select */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-[140px] bg-secondary/50 border-border/50">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tvl">TVL</SelectItem>
              <SelectItem value="apr">APR</SelectItem>
              <SelectItem value="volume">Volume 24h</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="glow" 
            size="sm"
            onClick={() => {
              setSelectedPool(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Position
          </Button>
        </div>
      </div>

      {/* Results count */}
      {!loading && pools.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedPools.length} of {pools.length} pools
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card p-6 border-destructive/50 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Failed to load pools</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="ml-auto">
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="w-8 h-8 rounded-full bg-muted -ml-3" />
                <div className="h-5 w-24 bg-muted rounded" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-6 w-28 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && pools.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Droplets className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No pools found</h3>
          <p className="text-muted-foreground">Unable to fetch pool data from API</p>
        </div>
      )}

      {/* No Results from Search */}
      {!loading && pools.length > 0 && filteredAndSortedPools.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No matching pools</h3>
          <p className="text-muted-foreground">Try a different search term</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => setSearchQuery("")}
          >
            Clear search
          </Button>
        </div>
      )}

      {/* Pools Grid */}
      {!loading && filteredAndSortedPools.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedPools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onAddLiquidity={() => handleAddLiquidity(pool)}
            />
          ))}
        </div>
      )}

      {/* Add Liquidity Modal */}
      <AddLiquidityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pool={selectedPool}
      />
    </div>
  );
};

export default PoolsList;
