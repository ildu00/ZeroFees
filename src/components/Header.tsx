import { useState } from "react";
import { NavLink } from "./NavLink";
import WalletButton from "./WalletButton";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="text-xl font-bold tracking-tight">
            <span className="text-gradient">ZERO</span>
            <span className="text-muted-foreground"> FEES</span>
          </NavLink>
          
          <nav className="hidden md:flex items-center gap-6">
            <NavLink 
              to="/" 
              end
              className="nav-link"
              activeClassName="nav-link-active"
            >
              Swap
            </NavLink>
            <NavLink 
              to="/pools" 
              className="nav-link"
              activeClassName="nav-link-active"
            >
              Pools
            </NavLink>
            <NavLink 
              to="/positions" 
              className="nav-link"
              activeClassName="nav-link-active"
            >
              Positions
            </NavLink>
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <WalletButton />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden mt-4 pb-4 flex flex-col gap-2 glass-card rounded-lg p-4 mx-2">
          <NavLink 
            to="/" 
            end
            className="nav-link py-2"
            activeClassName="nav-link-active"
            onClick={() => setMobileMenuOpen(false)}
          >
            Swap
          </NavLink>
          <NavLink 
            to="/pools" 
            className="nav-link py-2"
            activeClassName="nav-link-active"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pools
          </NavLink>
          <NavLink 
            to="/positions" 
            className="nav-link py-2"
            activeClassName="nav-link-active"
            onClick={() => setMobileMenuOpen(false)}
          >
            Positions
          </NavLink>
        </nav>
      )}
    </header>
  );
};

export default Header;
