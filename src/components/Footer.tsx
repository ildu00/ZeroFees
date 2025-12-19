const Footer = () => {
  return (
    <footer className="mt-24 text-center">
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <a href="/docs" className="hover:text-foreground transition-colors">Docs</a>
        <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
        <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
        <a href="#" className="hover:text-foreground transition-colors">Discord</a>
      </div>
      <p className="mt-6 text-xs text-muted-foreground/50">
        © 2025 zerofees.online — Decentralized Exchange Protocol
      </p>
    </footer>
  );
};

export default Footer;
