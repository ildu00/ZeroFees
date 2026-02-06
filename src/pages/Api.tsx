import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Code, Copy, Check, ExternalLink, List, Key, Send, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Highlight, themes } from "prism-react-renderer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const apiKeyRequestSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  company: z.string().trim().max(100).optional(),
  use_case: z.string().trim().min(20, "Please describe your use case in at least 20 characters").max(1000),
});

const tocItems = [
  { id: "base-url", label: "Base URL" },
  { id: "authentication", label: "Authentication" },
  { id: "supported-chains", label: "Supported Chains" },
  { id: "swap-api", label: "Swap API" },
  { id: "pools-api", label: "Pools API" },
  { id: "wallet-api", label: "Wallet API" },
  { id: "supported-tokens", label: "Supported Tokens" },
  { id: "rate-limits", label: "Rate Limits" },
  { id: "sdk-example", label: "SDK Example" },
  { id: "contract-addresses", label: "Contract Addresses" },
  { id: "request-api-key", label: "Request API Key" },
];

const TableOfContents = () => {
  const [activeSection, setActiveSection] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -70% 0px", threshold: 0 }
    );

    tocItems.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile TOC Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
        aria-label="Table of contents"
      >
        <List className="w-5 h-5" />
      </button>

      {/* Mobile TOC Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* TOC Sidebar */}
      <nav
        className={cn(
          "fixed z-50 transition-all duration-300 ease-in-out",
          "lg:sticky lg:top-24 lg:z-10 lg:h-fit lg:max-h-[calc(100vh-8rem)] lg:w-56 lg:shrink-0",
          isOpen
            ? "bottom-20 right-6 left-6 rounded-xl bg-background border border-border shadow-xl p-4"
            : "hidden lg:block"
        )}
      >
        <div className="lg:glass-card lg:p-4 lg:rounded-xl">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            On this page
          </h3>
          <ul className="space-y-1">
            {tocItems.map(({ id, label }) => (
              <li key={id}>
                <button
                  onClick={() => scrollToSection(id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                    activeSection === id
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
};

const ApiKeyRequestForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    use_case: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = apiKeyRequestSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("api_key_requests").insert({
        name: result.data.name,
        email: result.data.email,
        company: result.data.company || null,
        use_case: result.data.use_case,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Request submitted successfully!");
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Request Submitted!</h3>
        <p className="text-muted-foreground">
          Thank you for your interest. We'll review your request and get back to you within 24-48 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Key className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold mb-1">Get Your API Key</h3>
          <p className="text-sm text-muted-foreground">
            Fill out the form below to request access to our API. We'll review your application and send you an API key via email.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company (Optional)</Label>
          <Input
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Your company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="use_case">How will you use the API? *</Label>
          <Textarea
            id="use_case"
            name="use_case"
            value={formData.use_case}
            onChange={handleChange}
            placeholder="Describe your project and how you plan to integrate with our API..."
            rows={4}
            className={errors.use_case ? "border-red-500" : ""}
          />
          {errors.use_case && <p className="text-xs text-red-500">{errors.use_case}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Request
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

const CodeBlock = ({ code, language = "json" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="relative group">
      <Highlight theme={themes.nightOwl} code={code.trim()} language={language as any}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre 
            className="rounded-lg p-4 overflow-x-auto text-sm border border-border/30" 
            style={{ ...style, background: 'hsl(var(--secondary) / 0.5)' }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} className="table-row">
                <span className="table-cell pr-4 text-muted-foreground/50 select-none text-right" style={{ minWidth: '2rem' }}>
                  {i + 1}
                </span>
                <span className="table-cell">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-background/80 border border-border/30 opacity-0 group-hover:opacity-100 transition-all hover:bg-secondary"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
};

const ContractAddressRow = ({ name, address, isLast }: { name: string; address: string; isLast: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div 
      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-3 ${
        !isLast ? "border-b border-border/20" : ""
      }`}
    >
      <span className="text-sm font-medium">{name}</span>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-secondary/50 px-2 py-1.5 rounded font-mono truncate max-w-[200px] sm:max-w-[240px] md:max-w-none">
          {address}
        </code>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md bg-secondary/50 hover:bg-secondary border border-border/30 transition-colors"
            title="Copy address"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
          <a
            href={`https://basescan.org/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md bg-secondary/50 hover:bg-secondary border border-border/30 transition-colors"
            title="View on BaseScan"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>
    </div>
  );
};

const ApiSection = ({
  title, 
  method, 
  endpoint, 
  description, 
  requestBody, 
  responseBody,
  parameters 
}: { 
  title: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  description: string;
  requestBody?: string;
  responseBody: string;
  parameters?: { name: string; type: string; description: string; required: boolean }[];
}) => {
  const methodColors = {
    GET: "bg-green-500/20 text-green-400 border-green-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PUT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-mono font-bold border ${methodColors[method]}`}>
            {method}
          </span>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-lg p-3 font-mono text-sm break-all">
        <span className="text-muted-foreground">{endpoint}</span>
      </div>

      {parameters && parameters.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Parameters</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Required</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((param) => (
                  <tr key={param.name} className="border-b border-border/20">
                    <td className="py-2 px-3 font-mono text-primary">{param.name}</td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">{param.type}</td>
                    <td className="py-2 px-3">
                      {param.required ? (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Yes</span>
                      ) : (
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">No</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{param.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {requestBody && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Request Body</h4>
          <CodeBlock code={requestBody} />
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold mb-2">Response</h4>
        <CodeBlock code={responseBody} />
      </div>
    </div>
  );
};

const Api = () => {
  const baseUrl = "https://hkvmvhrwwvpjiypqvjyv.supabase.co/functions/v1";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Code className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Developer API</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">API Reference</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Complete API documentation for integrating with ZERO FEES DeFi services across 9 blockchain networks.
            </p>
          </div>

          {/* Layout with TOC */}
          <div className="flex gap-8">
            {/* Sidebar */}
            <TableOfContents />

            {/* Main Content */}
            <div className="flex-1 min-w-0 max-w-4xl">
              {/* Base URL */}
              <div id="base-url" className="glass-card p-6 mb-8 scroll-mt-28">
                <h2 className="text-lg font-semibold mb-2">Base URL</h2>
                <div className="bg-secondary/30 rounded-lg p-3 font-mono text-sm break-all">
                  {baseUrl}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  All API endpoints are served over HTTPS. Authentication is handled via Supabase API keys.
                </p>
              </div>

              {/* Authentication */}
              <div id="authentication" className="glass-card p-6 mb-8 scroll-mt-28">
                <h2 className="text-lg font-semibold mb-4">Authentication</h2>
                <p className="text-muted-foreground mb-4">
                  All requests must include the following headers:
                </p>
                <CodeBlock code={`{
  "apikey": "YOUR_SUPABASE_ANON_KEY",
  "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY",
  "Content-Type": "application/json"
}`} />
              </div>

              {/* Supported Chains */}
              <div id="supported-chains" className="glass-card p-6 mb-8 scroll-mt-28">
                <h2 className="text-lg font-semibold mb-4">Supported Chains</h2>
                <p className="text-muted-foreground mb-4">
                  All endpoints accept an optional <code className="text-primary font-mono text-sm bg-secondary/50 px-1.5 py-0.5 rounded">chain</code> parameter to target a specific blockchain. Default: <code className="text-primary font-mono text-sm bg-secondary/50 px-1.5 py-0.5 rounded">base</code>.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Chain ID</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Network</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">DEX</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Swaps</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Pools</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: "base", name: "Base", icon: "🔵", dex: "Uniswap V3", swaps: true, pools: true },
                        { id: "ethereum", name: "Ethereum", icon: "⟠", dex: "Uniswap V3", swaps: false, pools: true },
                        { id: "arbitrum", name: "Arbitrum One", icon: "🔷", dex: "Uniswap V3", swaps: false, pools: true },
                        { id: "polygon", name: "Polygon", icon: "💜", dex: "Uniswap V3", swaps: false, pools: true },
                        { id: "optimism", name: "Optimism", icon: "🔴", dex: "Uniswap V3", swaps: false, pools: true },
                        { id: "bsc", name: "BNB Smart Chain", icon: "🟡", dex: "PancakeSwap", swaps: true, pools: true },
                        { id: "avalanche", name: "Avalanche", icon: "🔺", dex: "Trader Joe", swaps: true, pools: true },
                        { id: "tron", name: "TRON", icon: "♦️", dex: "SunSwap", swaps: true, pools: true },
                        { id: "neo", name: "NEO N3", icon: "💚", dex: "Flamingo", swaps: true, pools: true },
                      ].map((chain) => (
                        <tr key={chain.id} className="border-b border-border/20">
                          <td className="py-2 px-3 font-mono text-primary">{chain.id}</td>
                          <td className="py-2 px-3">
                            <span className="mr-1.5">{chain.icon}</span>{chain.name}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">{chain.dex}</td>
                          <td className="py-2 px-3">
                            {chain.swaps ? (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">✓</span>
                            ) : (
                              <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">Soon</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {chain.pools ? (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">✓</span>
                            ) : (
                              <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* API Sections */}
              <div className="space-y-8">
                {/* Section: Swap */}
                <div id="swap-api" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Swap API
                  </h2>

              <div className="space-y-6">
                <ApiSection
                  title="Get Token Prices"
                  method="POST"
                  endpoint={`${baseUrl}/get-swap-quote`}
                  description="Fetches current USD prices for all supported tokens. Use chain-specific quote endpoints for non-Base networks (e.g. get-pancakeswap-quote for BSC, get-traderjoe-quote for Avalanche, get-sunswap-quote for TRON, get-neo-quote for NEO)."
                  parameters={[
                    { name: "action", type: "string", required: true, description: 'Must be "prices"' },
                  ]}
                  requestBody={`{
  "action": "prices"
}`}
                  responseBody={`{
  "prices": {
    "ETH": 2986.65,
    "WETH": 2986.65,
    "USDC": 0.999845,
    "BRETT": 0.00018221,
    // ... chain-specific tokens
  },
  "tokens": {
    "ETH": "0x0000000000000000000000000000000000000000",
    "WETH": "0x4200000000000000000000000000000000000006",
    // ... token addresses
  }
}`}
                />

                <ApiSection
                  title="Get Swap Quote"
                  method="POST"
                  endpoint={`${baseUrl}/get-swap-quote`}
                  description="Calculates the expected output amount for a token swap. For non-Base chains, use the chain-specific endpoint: get-pancakeswap-quote (BSC), get-traderjoe-quote (Avalanche), get-sunswap-quote (TRON), get-neo-quote (NEO)."
                  parameters={[
                    { name: "action", type: "string", required: true, description: 'Must be "quote"' },
                    { name: "tokenIn", type: "string", required: true, description: "Input token symbol (e.g., ETH, USDC, BNB)" },
                    { name: "tokenOut", type: "string", required: true, description: "Output token symbol" },
                    { name: "amountIn", type: "string", required: true, description: "Input amount in smallest unit (wei for EVM, sun for TRON)" },
                  ]}
                  requestBody={`{
  "action": "quote",
  "tokenIn": "ETH",
  "tokenOut": "USDC",
  "amountIn": "1000000000000000000"  // 1 ETH in wei
}`}
                  responseBody={`{
  "amountOut": "2980123456",  // Output in smallest unit (6 decimals for USDC)
  "fee": 3000,                 // 0.3% fee (3000 = 0.3%)
  "route": "ETH -> USDC",
  "decimalsOut": 6
}`}
                />

                <div className="glass-card p-6">
                  <h4 className="text-sm font-semibold mb-3">Chain-Specific Quote Endpoints</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/30">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Chain</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Endpoint</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { chain: "Base", endpoint: "get-swap-quote" },
                          { chain: "BNB Smart Chain", endpoint: "get-pancakeswap-quote" },
                          { chain: "Avalanche", endpoint: "get-traderjoe-quote" },
                          { chain: "TRON", endpoint: "get-sunswap-quote" },
                          { chain: "NEO N3", endpoint: "get-neo-quote" },
                        ].map((item) => (
                          <tr key={item.chain} className="border-b border-border/20">
                            <td className="py-2 px-3 font-medium">{item.chain}</td>
                            <td className="py-2 px-3 font-mono text-primary text-xs">{`${baseUrl}/${item.endpoint}`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

                {/* Section: Pools */}
                <div id="pools-api" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Pools API
                  </h2>

              <div className="space-y-6">
                <ApiSection
                  title="Get Liquidity Pools"
                  method="POST"
                  endpoint={`${baseUrl}/get-uniswap-pools`}
                  description="Fetches top liquidity pools for any supported chain, including TVL, volume, APR, and fee tier information. Data is sourced from GeckoTerminal and DeFiLlama."
                  requestBody={`{
  "chain": "base"  // or: ethereum, arbitrum, polygon, optimism, bsc, avalanche, tron, neo
}`}
                  responseBody={`{
  "pools": [
    {
      "id": "base_0x...",
      "token0": { "symbol": "WETH", "icon": "https://..." },
      "token1": { "symbol": "USDC", "icon": "https://..." },
      "tvl": 45000000,
      "apr": 12.5,
      "volume24h": 8500000,
      "fees24h": 25500,
      "feeTier": 0.3
    }
  ],
  "chain": "base"
}`}
                  parameters={[
                    { name: "chain", type: "string", required: false, description: "Chain ID: base, ethereum, arbitrum, polygon, optimism, bsc, avalanche, tron, neo (default: base)" },
                  ]}
                />
              </div>
            </div>

                {/* Section: Wallet */}
                <div id="wallet-api" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Wallet API
                  </h2>

              <div className="space-y-6">
                <ApiSection
                  title="Get Wallet Transactions"
                  method="POST"
                  endpoint={`${baseUrl}/get-wallet-transactions`}
                  description="Retrieves transaction history for a specific wallet address. Currently supports Base network via BaseScan API. Multi-chain wallet history coming soon."
                  parameters={[
                    { name: "address", type: "string", required: true, description: "Wallet address (0x...)" },
                    { name: "page", type: "number", required: false, description: "Page number for pagination (default: 1)" },
                    { name: "limit", type: "number", required: false, description: "Transactions per page (default: 50)" },
                  ]}
                  requestBody={`{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE23",
  "page": 1,
  "limit": 50
}`}
                  responseBody={`{
  "transactions": [
    {
      "hash": "0x...",
      "from": "0x...",
      "to": "0x...",
      "value": "1000000000000000000",
      "timestamp": "1703001234",
      "gasUsed": "21000",
      "gasPrice": "1000000000",
      "isError": "0",
      "methodId": "0xa9059cbb"
    }
  ],
  "total": 150
}`}
                />
              </div>
            </div>

                {/* Supported Tokens */}
                <div id="supported-tokens" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Supported Tokens
                  </h2>

              <div className="glass-card p-6">
                <p className="text-muted-foreground mb-4">
                  The following tokens are supported for swaps on Base network. Each chain has its own set of native tokens — refer to the Supported Chains table above.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                  {[
                    { symbol: "ETH", icon: "⟠", category: "native" },
                    { symbol: "WETH", icon: "⟠", category: "native" },
                    { symbol: "USDC", icon: "💲", category: "stable" },
                    { symbol: "USDT", icon: "💵", category: "stable" },
                    { symbol: "DAI", icon: "◈", category: "stable" },
                    { symbol: "USDbC", icon: "💲", category: "stable" },
                    { symbol: "EURC", icon: "💶", category: "stable" },
                    { symbol: "crvUSD", icon: "📈", category: "stable" },
                    { symbol: "cbETH", icon: "🔵", category: "lst" },
                    { symbol: "wstETH", icon: "🔷", category: "lst" },
                    { symbol: "rETH", icon: "🚀", category: "lst" },
                    { symbol: "ezETH", icon: "🔶", category: "lst" },
                    { symbol: "weETH", icon: "🟢", category: "lst" },
                    { symbol: "AERO", icon: "✈️", category: "defi" },
                    { symbol: "WELL", icon: "🌙", category: "defi" },
                    { symbol: "MORPHO", icon: "🦋", category: "defi" },
                    { symbol: "SEAM", icon: "🧵", category: "defi" },
                    { symbol: "EXTRA", icon: "➕", category: "defi" },
                    { symbol: "BSWAP", icon: "🔄", category: "defi" },
                    { symbol: "ALB", icon: "👽", category: "defi" },
                    { symbol: "BRETT", icon: "🐸", category: "meme" },
                    { symbol: "DEGEN", icon: "🎩", category: "meme" },
                    { symbol: "TOSHI", icon: "🐱", category: "meme" },
                    { symbol: "HIGHER", icon: "⬆️", category: "meme" },
                    { symbol: "NORMIE", icon: "😐", category: "meme" },
                    { symbol: "MOCHI", icon: "🍡", category: "meme" },
                    { symbol: "KEYCAT", icon: "🐈", category: "meme" },
                    { symbol: "TYBG", icon: "🙏", category: "meme" },
                    { symbol: "DOGINME", icon: "🐕", category: "meme" },
                    { symbol: "BENJI", icon: "🐶", category: "meme" },
                    { symbol: "MFER", icon: "😎", category: "meme" },
                    { symbol: "BASED", icon: "🔵", category: "meme" },
                    { symbol: "BALD", icon: "👨‍🦲", category: "meme" },
                    { symbol: "DINO", icon: "🦖", category: "meme" },
                    { symbol: "CHOMP", icon: "🦈", category: "meme" },
                    { symbol: "SKI", icon: "🎿", category: "meme" },
                    { symbol: "WEIRDO", icon: "🤪", category: "meme" },
                    { symbol: "VIRTUAL", icon: "🎮", category: "gaming" },
                    { symbol: "FRIEND", icon: "🤝", category: "gaming" },
                    { symbol: "SNX", icon: "⚡", category: "defi" },
                    { symbol: "COMP", icon: "🏦", category: "defi" },
                    { symbol: "YFI", icon: "🔵", category: "defi" },
                    { symbol: "UNI", icon: "🦄", category: "defi" },
                    { symbol: "LINK", icon: "🔗", category: "defi" },
                    { symbol: "CRV", icon: "📉", category: "defi" },
                    { symbol: "BAL", icon: "⚖️", category: "defi" },
                    { symbol: "LDO", icon: "🌊", category: "defi" },
                    { symbol: "PENDLE", icon: "🔮", category: "defi" },
                  ].map((token) => (
                    <div 
                      key={token.symbol} 
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all hover:scale-105 cursor-default ${
                        token.category === "native" ? "bg-primary/10 border-primary/30" :
                        token.category === "stable" ? "bg-green-500/10 border-green-500/30" :
                        token.category === "lst" ? "bg-blue-500/10 border-blue-500/30" :
                        token.category === "defi" ? "bg-purple-500/10 border-purple-500/30" :
                        token.category === "meme" ? "bg-orange-500/10 border-orange-500/30" :
                        "bg-cyan-500/10 border-cyan-500/30"
                      }`}
                    >
                      <span className="text-lg">{token.icon}</span>
                      <span className="text-sm font-mono font-medium">{token.symbol}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded bg-primary/30" /> Native
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded bg-green-500/30" /> Stablecoins
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded bg-blue-500/30" /> LST/LRT
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded bg-purple-500/30" /> DeFi
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded bg-orange-500/30" /> Memecoins
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded bg-cyan-500/30" /> Gaming
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-4">
                  Custom tokens can be imported by contract address using the frontend interface.
                </p>
              </div>
            </div>

                {/* Rate Limits */}
                <div id="rate-limits" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Rate Limits & Best Practices
                  </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Rate Limits Cards */}
                <div className="glass-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <span className="text-orange-400 text-sm">⚡</span>
                    </span>
                    Rate Limits
                  </h3>
                  <div className="space-y-3">
                    {[
                      { endpoint: "Price API", limit: "100", unit: "req/min", color: "bg-green-500" },
                      { endpoint: "Quote API", limit: "60", unit: "req/min", color: "bg-blue-500" },
                      { endpoint: "Pools API", limit: "30", unit: "req/min", color: "bg-yellow-500" },
                      { endpoint: "Transactions API", limit: "20", unit: "req/min", color: "bg-red-500" },
                    ].map((item) => (
                      <div key={item.endpoint} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-sm font-medium">{item.endpoint}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">{item.limit}</span>
                          <span className="text-xs text-muted-foreground">{item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best Practices */}
                <div className="glass-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-sm">✓</span>
                    </span>
                    Best Practices
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: "💾", text: "Cache price responses for at least 30 seconds" },
                      { icon: "🔌", text: "Use WebSocket for real-time price updates" },
                      { icon: "✅", text: "Validate token addresses before swaps" },
                      { icon: "🛡️", text: "Implement proper error handling" },
                      { icon: "📊", text: "Use 0.5-1% slippage for stable pairs" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                        <span className="text-base">{item.icon}</span>
                        <span className="text-sm text-muted-foreground">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error Codes */}
              <div className="glass-card p-6 mt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 text-sm">!</span>
                  </span>
                  Error Codes
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { code: "400", title: "Bad Request", description: "Invalid request parameters", color: "yellow" },
                    { code: "401", title: "Unauthorized", description: "Missing or invalid API key", color: "orange" },
                    { code: "429", title: "Too Many Requests", description: "Rate limit exceeded", color: "red" },
                    { code: "500", title: "Server Error", description: "Internal server error", color: "purple" },
                  ].map((error) => (
                    <div 
                      key={error.code} 
                      className={`relative overflow-hidden rounded-xl border p-4 transition-all hover:scale-[1.02] ${
                        error.color === "yellow" ? "border-yellow-500/30 bg-yellow-500/5" :
                        error.color === "orange" ? "border-orange-500/30 bg-orange-500/5" :
                        error.color === "red" ? "border-red-500/30 bg-red-500/5" :
                        "border-purple-500/30 bg-purple-500/5"
                      }`}
                    >
                      <div className={`absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 rounded-full blur-2xl opacity-30 ${
                        error.color === "yellow" ? "bg-yellow-500" :
                        error.color === "orange" ? "bg-orange-500" :
                        error.color === "red" ? "bg-red-500" :
                        "bg-purple-500"
                      }`} />
                      <div className="relative">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-2 ${
                          error.color === "yellow" ? "bg-yellow-500/20 text-yellow-400" :
                          error.color === "orange" ? "bg-orange-500/20 text-orange-400" :
                          error.color === "red" ? "bg-red-500/20 text-red-400" :
                          "bg-purple-500/20 text-purple-400"
                        }`}>
                          {error.code}
                        </span>
                        <h4 className="font-semibold text-sm mb-1">{error.title}</h4>
                        <p className="text-xs text-muted-foreground">{error.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

                {/* SDK */}
                <div id="sdk-example" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    JavaScript SDK Example
                  </h2>

              <div className="glass-card p-6">
                <p className="text-muted-foreground mb-4">
                  Example integration using the Supabase JavaScript client:
                </p>

                <CodeBlock code={`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hkvmvhrwwvpjiypqvjyv.supabase.co',
  'YOUR_ANON_KEY'
);

// Get token prices (Base)
async function getTokenPrices() {
  const { data, error } = await supabase.functions.invoke('get-swap-quote', {
    body: { action: 'prices' }
  });
  if (error) throw error;
  return data.prices;
}

// Get swap quote (Base)
async function getSwapQuote(tokenIn, tokenOut, amountInWei) {
  const { data, error } = await supabase.functions.invoke('get-swap-quote', {
    body: { action: 'quote', tokenIn, tokenOut, amountIn: amountInWei }
  });
  if (error) throw error;
  return data;
}

// Get pools for any chain
async function getPools(chain = 'base') {
  const { data, error } = await supabase.functions.invoke('get-uniswap-pools', {
    body: { chain }  // 'base' | 'ethereum' | 'bsc' | 'avalanche' | 'tron' | 'neo' ...
  });
  if (error) throw error;
  return data.pools;
}

// Usage
const basePools = await getPools('base');
const tronPools = await getPools('tron');
const avaxPools = await getPools('avalanche');
console.log('Base pools:', basePools.length);
console.log('TRON pools:', tronPools.length);`} language="javascript" />
              </div>
            </div>

                {/* Contract Addresses */}
                <div id="contract-addresses" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Contract Addresses
                  </h2>

              <div className="glass-card p-6 overflow-hidden">
                <p className="text-muted-foreground mb-4">
                  Key contract addresses per chain:
                </p>

                {[
                  {
                    chain: "🔵 Base",
                    explorer: "https://basescan.org",
                    explorerName: "BaseScan",
                    contracts: [
                      { name: "SwapRouter02", address: "0x2626664c2603336E57B271c5C0b26F421741e481" },
                      { name: "Pool Factory", address: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD" },
                      { name: "Position Manager", address: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1" },
                    ],
                  },
                  {
                    chain: "⟠ Ethereum",
                    explorer: "https://etherscan.io",
                    explorerName: "Etherscan",
                    contracts: [
                      { name: "SwapRouter", address: "0xE592427A0AEce92De3Edee1F18E0157C05861564" },
                      { name: "Pool Factory", address: "0x1F98431c8aD98523631AE4a59f267346ea31F984" },
                      { name: "Position Manager", address: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88" },
                    ],
                  },
                  {
                    chain: "🟡 BNB Smart Chain",
                    explorer: "https://bscscan.com",
                    explorerName: "BscScan",
                    contracts: [
                      { name: "PancakeSwap Router", address: "0x10ED43C718714eb63d5aA57B78B54704E256024E" },
                      { name: "Pool Factory", address: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73" },
                      { name: "Position Manager", address: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364" },
                    ],
                  },
                  {
                    chain: "🔺 Avalanche",
                    explorer: "https://snowtrace.io",
                    explorerName: "Snowtrace",
                    contracts: [
                      { name: "Trader Joe Router", address: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4" },
                      { name: "LB Factory", address: "0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10" },
                      { name: "LB Position Manager", address: "0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30" },
                    ],
                  },
                  {
                    chain: "♦️ TRON",
                    explorer: "https://tronscan.org",
                    explorerName: "TronScan",
                    contracts: [
                      { name: "SunSwap Router", address: "TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax" },
                      { name: "Position Manager", address: "TLSWrv7eC1AZCXkRjpqMZUmvgd99cj7pPF" },
                    ],
                  },
                  {
                    chain: "💚 NEO N3",
                    explorer: "https://explorer.onegate.space",
                    explorerName: "OneGate",
                    contracts: [
                      { name: "Flamingo DEX", address: "0xde3a4b093abbd07e9a69cdec88a54d9a1fe14975" },
                    ],
                  },
                ].map((chainGroup) => (
                  <div key={chainGroup.chain} className="mb-6 last:mb-0">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      {chainGroup.chain}
                    </h4>
                    <div className="space-y-1">
                      {chainGroup.contracts.map((contract, i) => (
                        <ContractAddressRow
                          key={`${chainGroup.chain}-${contract.name}`}
                          name={contract.name}
                          address={contract.address}
                          isLast={i === chainGroup.contracts.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

                {/* Request API Key Form */}
                <div id="request-api-key" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Request API Key
                  </h2>

                  <ApiKeyRequestForm />
                </div>
              </div>

              <Footer />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Api;
