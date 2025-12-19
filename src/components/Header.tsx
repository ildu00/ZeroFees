import WalletButton from "./WalletButton";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-gradient">SWAP</span>
            <span className="text-muted-foreground">.fi</span>
          </h1>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="nav-link nav-link-active">Swap</a>
            <a href="#" className="nav-link">Pools</a>
            <a href="#" className="nav-link">Explore</a>
          </nav>
        </div>
        
        <WalletButton />
      </div>
    </header>
  );
};

export default Header;
