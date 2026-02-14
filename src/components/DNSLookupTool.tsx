'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Copy, Clock, History, Trash2, Check, AlertCircle } from 'lucide-react';
import { cn, copyToClipboard, formatRelativeTime, isValidDomain } from '@/lib/utils';
import { lookupDNS, type RecordType, type DNSLookupResult } from '@/lib/dns';

const RECORD_TYPES: RecordType[] = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SOA', 'PTR', 'SRV'];

interface HistoryItem {
  id: string;
  domain: string;
  recordType: RecordType;
  timestamp: Date;
}

export function DNSLookupTool() {
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState<RecordType>('A');
  const [result, setResult] = useState<DNSLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dns-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })));
      } catch {}
    }
  }, []);

  const saveHistory = useCallback((item: HistoryItem) => {
    const updated = [item, ...history.filter(h => h.domain !== item.domain || h.recordType !== item.recordType)].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('dns-history', JSON.stringify(updated));
  }, [history]);

  const handleLookup = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    const cleanDomain = domain.trim().toLowerCase();
    
    if (!isValidDomain(cleanDomain)) {
      setError('Please enter a valid domain (e.g., example.com)');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const lookupResult = await lookupDNS(cleanDomain, recordType);
      setResult(lookupResult);
      
      if (!lookupResult.error) {
        saveHistory({
          id: `${Date.now()}`,
          domain: cleanDomain,
          recordType,
          timestamp: new Date(),
        });
      }
    } catch (err) {
      setError('Failed to lookup DNS records');
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

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('dns-history');
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Search className="text-[#00d4aa]" size={20} />
          DNS Lookup
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter domain (e.g., example.com)"
            className="flex-1 px-4 py-2.5 bg-[#1a1a24] border border-[#27272a] rounded-lg text-[#f4f4f5] placeholder-[#71717a] font-mono text-sm focus:border-[#00d4aa] transition-colors"
          />
          
          <select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value as RecordType)}
            className="px-4 py-2.5 bg-[#1a1a24] border border-[#27272a] rounded-lg text-[#f4f4f5] font-mono text-sm focus:border-[#00d4aa] transition-colors"
          >
            {RECORD_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
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
                <Search size={16} />
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
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-[#f4f4f5]">{result.domain}</h3>
              <span className="px-2 py-0.5 bg-[#1a1a24] rounded text-xs font-mono text-[#00d4aa]">
                {result.recordType}
              </span>
              {result.error ? (
                <span className="px-2 py-0.5 bg-red-500/10 rounded text-xs text-red-400">
                  Error
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-green-500/10 rounded text-xs text-green-400">
                  {result.records.length} record{result.records.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#71717a]">
              <Clock size={14} />
              {result.responseTime}ms
            </div>
          </div>

          {result.error ? (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{result.error}</p>
            </div>
          ) : result.records.length > 0 ? (
            <div className="space-y-2">
              {result.records.map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg group"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-[#71717a] w-16">
                      {record.type}
                    </span>
                    <span className="font-mono text-sm text-[#f4f4f5] break-all">
                      {record.type === 'MX' ? `${record.priority} ${record.value}` : record.value}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#71717a]">
                      TTL: {record.ttl}
                    </span>
                    <button
                      onClick={() => handleCopy(record.value)}
                      className="p-1.5 rounded hover:bg-[#27272a] text-[#71717a] hover:text-[#f4f4f5] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-[#1a1a24] rounded-lg text-center text-[#71717a]">
              No {recordType} records found
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <History size={16} className="text-[#71717a]" />
              Recent Lookups
            </h3>
            <button
              onClick={clearHistory}
              className="p-1.5 rounded hover:bg-[#1a1a24] text-[#71717a] hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
          
          <div className="space-y-1">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setDomain(item.domain);
                  setRecordType(item.recordType);
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1a1a24] text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-[#f4f4f5]">{item.domain}</span>
                  <span className="px-1.5 py-0.5 bg-[#27272a] rounded text-xs font-mono text-[#00d4aa]">
                    {item.recordType}
                  </span>
                </div>
                <span className="text-xs text-[#71717a]">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
