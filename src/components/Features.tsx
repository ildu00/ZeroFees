import { Zap, Shield, RefreshCw, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Execute swaps in seconds with optimized routing",
  },
  {
    icon: Shield,
    title: "Secure & Trustless",
    description: "Non-custodial trades, you control your assets",
  },
  {
    icon: RefreshCw,
    title: "Best Rates",
    description: "Aggregated liquidity for optimal prices",
  },
  {
    icon: TrendingUp,
    title: "Low Slippage",
    description: "Deep liquidity pools minimize price impact",
  },
];

const Features = () => {
  return (
    <section className="mt-24 animate-fade-in" style={{ animationDelay: "0.5s" }}>
      <h3 className="text-center text-sm uppercase tracking-widest text-muted-foreground mb-12">
        Why Choose Us
      </h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div 
            key={feature.title}
            className="text-center group"
            style={{ animationDelay: `${0.1 * index}s` }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/50 border border-border/30 mb-4 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-300">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-medium mb-1">{feature.title}</h4>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
