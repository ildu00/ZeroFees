const Footer = () => {
  return (
    <footer className="mt-24 text-center">
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <a href="/docs" className="hover:text-foreground transition-colors">Docs</a>
        <a href="/changelog" className="hover:text-foreground transition-colors">Changelog</a>
        <a href="https://github.com/ildu00/ZeroFees" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
      </div>
      <p className="mt-6 text-xs text-muted-foreground/50">
        © 2025-2026 zerofees.online — Decentralized Exchange Protocol
      </p>
    </footer>
  );
};

export default Footer;
