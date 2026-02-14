'use client';

import { useState } from 'react';
import { Zap, Copy, Check, RefreshCw, AlertCircle, Globe, Lock, CheckCircle, XCircle } from 'lucide-react';
import { cn, isValidDomain, copyToClipboard } from '@/lib/utils';
import { generateTestSubdomain, lookupDNS } from '@/lib/dns';

interface TestResult {
  subdomain: string;
  status: 'pending' | 'checking' | 'found' | 'not_found' | 'error';
  ip?: string;
  error?: string;
}

export function SubdomainTestTool() {
  const [baseDomain, setBaseDomain] = useState('');
  const [testSubdomain, setTestSubdomain] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!baseDomain.trim()) {
      setError('Please enter a base domain');
      return;
    }

    const cleanDomain = baseDomain.trim().toLowerCase();
    
    if (!isValidDomain(cleanDomain)) {
      setError('Please enter a valid domain (e.g., example.com)');
      return;
    }

    const subdomain = generateTestSubdomain(cleanDomain);
    setTestSubdomain(subdomain);
    setError(null);
  };

  const handleCheckPropagation = async () => {
    if (!testSubdomain) return;

    setLoading(true);
    setResults([]);

    const dnsServers = [
      { name: 'Google', url: 'https://dns.google/resolve' },
      { name: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query' },
      { name: 'Quad9', url: 'https://dns.quad9.net:5053/dns-query' },
    ];

    const newResults: TestResult[] = [];

    for (const server of dnsServers) {
      newResults.push({ subdomain: server.name, status: 'checking' });
      setResults([...newResults]);

      try {
        const response = await fetch(`${server.url}?name=${testSubdomain}&type=A`, {
          headers: { Accept: 'application/dns-json' },
        });

        if (response.ok) {
          const data = await response.json();
          const idx = newResults.findIndex(r => r.subdomain === server.name);
          
          if (data.Answer && data.Answer.length > 0) {
            newResults[idx] = {
              subdomain: server.name,
              status: 'found',
              ip: data.Answer[0].data,
            };
          } else {
            newResults[idx] = {
              subdomain: server.name,
              status: 'not_found',
            };
          }
        } else {
          const idx = newResults.findIndex(r => r.subdomain === server.name);
          newResults[idx] = {
            subdomain: server.name,
            status: 'error',
            error: 'Request failed',
          };
        }
      } catch (err) {
        const idx = newResults.findIndex(r => r.subdomain === server.name);
        newResults[idx] = {
          subdomain: server.name,
          status: 'error',
          error: 'Connection failed',
        };
      }

      setResults([...newResults]);
    }

    setLoading(false);
  };

  const handleCopy = async () => {
    await copyToClipboard(testSubdomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleGenerate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="text-[#00d4aa]" size={20} />
          Ephemeral Subdomain Testing
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-2">Base Domain</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={baseDomain}
                onChange={(e) => setBaseDomain(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter base domain (e.g., example.com)"
                className="flex-1 px-4 py-2.5 bg-[#1a1a24] border border-[#27272a] rounded-lg text-[#f4f4f5] placeholder-[#71717a] font-mono text-sm focus:border-[#00d4aa] transition-colors"
              />
              
              <button
                onClick={handleGenerate}
                className="btn-secondary flex items-center justify-center gap-2 min-w-[140px]"
              >
                <RefreshCw size={16} />
                Generate
              </button>
            </div>
          </div>

          {testSubdomain && (
            <div className="p-4 bg-[#1a1a24] rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-[#00d4aa]" />
                <span className="font-mono text-[#f4f4f5]">{testSubdomain}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 rounded hover:bg-[#27272a] text-[#71717a] hover:text-[#f4f4f5] transition-colors"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
                <button
                  onClick={handleCheckPropagation}
                  disabled={loading}
                  className={cn(
                    'btn-primary flex items-center justify-center gap-2',
                    loading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {loading ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Zap size={16} />
                      Check Propagation
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-[#71717a]">
          Generate ephemeral test subdomains for debugging DNS propagation and testing DNS configurations.
        </p>
      </div>

      {results.length > 0 && (
        <div className="card animate-fade-in">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lock size={16} className="text-[#7c3aed]" />
            Propagation Status
          </h3>
          
          <div className="space-y-3">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-lg border flex items-center justify-between',
                  result.status === 'found' ? 'bg-green-500/5 border-green-500/20' :
                  result.status === 'not_found' ? 'bg-yellow-500/5 border-yellow-500/20' :
                  result.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                  result.status === 'checking' ? 'bg-blue-500/5 border-blue-500/20' :
                  'bg-[#1a1a24] border-[#27272a]'
                )}
              >
                <div className="flex items-center gap-3">
                  {result.status === 'pending' && <div className="w-4 h-4 rounded-full bg-[#27272a]" />}
                  {result.status === 'checking' && <RefreshCw size={16} className="text-blue-400 animate-spin" />}
                  {result.status === 'found' && <CheckCircle size={16} className="text-green-400" />}
                  {result.status === 'not_found' && <XCircle size={16} className="text-yellow-400" />}
                  {result.status === 'error' && <AlertCircle size={16} className="text-red-400" />}
                  
                  <span className="font-medium text-[#f4f4f5]">{result.subdomain}</span>
                </div>

                <div>
                  {result.status === 'found' && result.ip && (
                    <span className="font-mono text-sm text-green-400">{result.ip}</span>
                  )}
                  {result.status === 'not_found' && (
                    <span className="text-sm text-yellow-400">No records found</span>
                  )}
                  {result.status === 'error' && result.error && (
                    <span className="text-sm text-red-400">{result.error}</span>
                  )}
                  {result.status === 'checking' && (
                    <span className="text-sm text-blue-400">Checking...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
