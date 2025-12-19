import { NavLink } from "./NavLink";
import WalletButton from "./WalletButton";
import logoImage from "@/assets/zero-fees-logo.png";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <img src={logoImage} alt="Zero Fees" className="w-8 h-8" />
            <span className="text-gradient">Zero</span>
            <span className="text-foreground">FEES</span>
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
        
        <WalletButton />
      </div>
    </header>
  );
};

export default Header;
