'use client';

import { useState } from 'react';
import { Globe, Copy, Check, AlertCircle, MapPin, Building, Wifi, Shield, Smartphone } from 'lucide-react';
import { cn, copyToClipboard, isValidIP } from '@/lib/utils';
import { getIPIntelligence, type IPIntelligenceData } from '@/lib/dns';

export function IPIntelligenceTool() {
  const [ip, setIP] = useState('');
  const [result, setResult] = useState<IPIntelligenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLookup = async () => {
    if (!ip.trim()) {
      setError('Please enter an IP address');
      return;
    }

    const cleanIP = ip.trim();
    
    if (!isValidIP(cleanIP)) {
      setError('Please enter a valid IP address');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await getIPIntelligence(cleanIP);
      if (data) {
        setResult(data);
      } else {
        setError('Failed to fetch IP intelligence data');
      }
    } catch (err) {
      setError('Failed to lookup IP address');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleLookup();
    }
  };

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Globe className="text-[#00d4aa]" size={20} />
          IP Intelligence
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={ip}
            onChange={(e) => setIP(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter IP address (e.g., 8.8.8.8)"
            className="flex-1 px-4 py-2.5 bg-[#1a1a24] border border-[#27272a] rounded-lg text-[#f4f4f5] placeholder-[#71717a] font-mono text-sm focus:border-[#00d4aa] transition-colors"
          />
          
          <button
            onClick={handleLookup}
            disabled={loading}
            className={cn(
              'btn-primary flex items-center justify-center gap-2 min-w-[120px]',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loading ? (
              <div className="spinner" />
            ) : (
              <>
                <Globe size={16} />
                Lookup
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <p className="mt-2 text-xs text-[#71717a]">
          Press Ctrl+Enter to lookup
        </p>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-[#7c3aed]" />
              Location
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a]">IP Address</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[#f4f4f5]">{result.ip}</span>
                  <button
                    onClick={() => handleCopy(result.ip)}
                    className="p-1 rounded hover:bg-[#27272a] text-[#71717a] hover:text-[#f4f4f5] transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a]">Version</span>
                <span className="font-mono text-sm text-[#00d4aa]">IPv{result.version}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a]">Country</span>
                <span className="text-sm text-[#f4f4f5]">{result.country} ({result.countryCode})</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a]">Region</span>
                <span className="text-sm text-[#f4f4f5]">{result.region}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a]">City</span>
                <span className="text-sm text-[#f4f4f5]">{result.city}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a]">Coordinates</span>
                <span className="font-mono text-sm text-[#f4f4f5]">{result.lat}, {result.lon}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a]">Timezone</span>
                <span className="text-sm text-[#f4f4f5]">{result.timezone}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building size={16} className="text-[#7c3aed]" />
              Network
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a]">ISP</span>
                <span className="text-sm text-[#f4f4f5] text-right max-w-[200px]">{result.isp}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a]">Organization</span>
                <span className="text-sm text-[#f4f4f5] text-right max-w-[200px]">{result.org}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a]">ASN</span>
                <span className="font-mono text-sm text-[#f4f4f5]">{result.asn}</span>
              </div>
            </div>

            <h3 className="font-semibold mt-6 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-[#7c3aed]" />
              Security Flags
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a] flex items-center gap-2">
                  <Smartphone size={14} />
                  Mobile Network
                </span>
                <span className={cn(
                  'text-sm font-medium',
                  result.isMobile ? 'text-green-400' : 'text-[#71717a]'
                )}>
                  {result.isMobile ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a] flex items-center gap-2">
                  <Wifi size={14} />
                  Proxy/VPN
                </span>
                <span className={cn(
                  'text-sm font-medium',
                  result.isProxy ? 'text-orange-400' : 'text-green-400'
                )}>
                  {result.isProxy ? 'Detected' : 'None'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg">
                <span className="text-sm text-[#71717a] flex items-center gap-2">
                  <Building size={14} />
                  Hosting Provider
                </span>
                <span className={cn(
                  'text-sm font-medium',
                  result.isHosting ? 'text-blue-400' : 'text-green-400'
                )}>
                  {result.isHosting ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
