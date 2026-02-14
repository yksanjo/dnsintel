'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { cn, isValidDomain, getRiskScoreColor, getRiskScoreLabel } from '@/lib/utils';
import { analyzeAttackSurface, type AttackSurfaceResult } from '@/lib/dns';

const severityOrder = ['critical', 'high', 'medium', 'low'] as const;

export function AttackSurfaceTool() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<AttackSurfaceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
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
      const analysis = await analyzeAttackSurface(cleanDomain);
      setResult(analysis);
    } catch (err) {
      setError('Failed to analyze attack surface');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAnalyze();
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle size={16} className="text-red-500" />;
      case 'high':
        return <AlertTriangle size={16} className="text-orange-500" />;
      case 'medium':
        return <AlertCircle size={16} className="text-violet-500" />;
      case 'low':
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="text-[#00d4aa]" size={20} />
          Attack Surface Analysis
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
          
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={cn(
              'btn-primary flex items-center justify-center gap-2 min-w-[160px]',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loading ? (
              <div className="spinner" />
            ) : (
              <>
                <Shield size={16} />
                Analyze
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
          Press Ctrl+Enter to analyze • Checks SPF, DMARC, DNSSEC, MX, NS records
        </p>
      </div>

      {result && (
        <div className="space-y-6 animate-fade-in">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">{result.domain}</h3>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-[#71717a] uppercase tracking-wide">Risk Score</div>
                  <div className={cn('text-2xl font-bold', getRiskScoreColor(result.riskScore))}>
                    {result.riskScore}
                  </div>
                </div>
                <div className={cn(
                  'px-3 py-1 rounded-lg text-sm font-medium',
                  result.riskScore >= 80 ? 'bg-red-500/20 text-red-400' :
                  result.riskScore >= 60 ? 'bg-orange-500/20 text-orange-400' :
                  result.riskScore >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                  result.riskScore >= 20 ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                )}>
                  {getRiskScoreLabel(result.riskScore)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <CheckCheck
                label="SPF"
                status={result.checks.spf.present ? (result.checks.spf.valid ? 'valid' : 'invalid') : 'missing'}
              />
              <CheckCheck
                label="DMARC"
                status={result.checks.dmarc.present ? (result.checks.dmarc.valid ? 'valid' : 'invalid') : 'missing'}
              />
              <CheckCheck
                label="DNSSEC"
                status={result.checks.dnssec.present ? 'valid' : 'missing'}
              />
              <CheckCheck
                label="MX"
                status={result.checks.mx.present ? 'valid' : 'missing'}
              />
              <CheckCheck
                label="Nameservers"
                status={result.checks.ns.records.length >= 2 ? 'valid' : 'warning'}
              />
            </div>
          </div>

          {result.issues.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-500" />
                Security Issues ({result.issues.length})
              </h3>
              
              <div className="space-y-3">
                {[...result.issues].sort((a, b) => 
                  severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
                ).map((issue) => (
                  <div
                    key={issue.id}
                    className={cn(
                      'p-4 rounded-lg border',
                      issue.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                      issue.severity === 'high' ? 'bg-orange-500/5 border-orange-500/20' :
                      issue.severity === 'medium' ? 'bg-violet-500/5 border-violet-500/20' :
                      'bg-green-500/5 border-green-500/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[#f4f4f5]">{issue.title}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium uppercase',
                            issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            issue.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            issue.severity === 'medium' ? 'bg-violet-500/20 text-violet-400' :
                            'bg-green-500/20 text-green-400'
                          )}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-sm text-[#a1a1aa] mb-2">{issue.description}</p>
                        <div className="flex items-start gap-2 p-2 bg-[#1a1a24] rounded text-sm">
                          <ExternalLink size={14} className="text-[#00d4aa] mt-0.5 flex-shrink-0" />
                          <span className="text-[#71717a]">{issue.recommendation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.issues.length === 0 && (
            <div className="card bg-green-500/5 border-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-500" />
                <div>
                  <h3 className="font-semibold text-green-400">No Issues Found</h3>
                  <p className="text-sm text-[#a1a1aa]">
                    Your domain appears to be properly configured for basic security.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CheckCheck({ label, status }: { label: string; status: 'valid' | 'invalid' | 'missing' | 'warning' }) {
  return (
    <div className={cn(
      'p-3 rounded-lg text-center',
      status === 'valid' ? 'bg-green-500/10' :
      status === 'warning' ? 'bg-yellow-500/10' :
      'bg-red-500/10'
    )}>
      {status === 'valid' ? (
        <CheckCircle size={20} className="mx-auto text-green-500 mb-1" />
      ) : status === 'warning' ? (
        <AlertCircle size={20} className="mx-auto text-yellow-500 mb-1" />
      ) : (
        <XCircle size={20} className="mx-auto text-red-500 mb-1" />
      )}
      <div className={cn(
        'text-xs font-medium',
        status === 'valid' ? 'text-green-400' :
        status === 'warning' ? 'text-yellow-400' :
        'text-red-400'
      )}>
        {label}
      </div>
    </div>
  );
}
