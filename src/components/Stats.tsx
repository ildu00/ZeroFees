const stats = [
  {
    label: "Total Volume",
    value: "$2.4B+",
    change: "+12.5%",
  },
  {
    label: "Trades Today",
    value: "45.2K",
    change: "+8.3%",
  },
  {
    label: "Tokens Listed",
    value: "500+",
    change: "+5",
  },
  {
    label: "Lowest Fees",
    value: "0.05%",
    change: "Guaranteed",
  },
];

const Stats = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-20 animate-fade-in" style={{ animationDelay: "0.3s" }}>
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className="stat-card"
          style={{ animationDelay: `${0.1 * index}s` }}
        >
          <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-xs text-primary mt-1">{stat.change}</p>
        </div>
      ))}
    </div>
  );
};

export default Stats;
