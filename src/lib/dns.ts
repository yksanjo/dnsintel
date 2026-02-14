export type RecordType = 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME' | 'NS' | 'SOA' | 'PTR' | 'SRV';

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

export interface DNSLookupResult {
  domain: string;
  recordType: RecordType;
  records: DNSRecord[];
  responseTime: number;
  timestamp: Date;
  error?: string;
}

export interface IPIntelligenceData {
  ip: string;
  version: 4 | 6;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  org: string;
  asn: string;
  lat: number;
  lon: number;
  timezone: string;
  isMobile: boolean;
  isProxy: boolean;
  isHosting: boolean;
}

export interface AttackSurfaceIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface AttackSurfaceResult {
  domain: string;
  riskScore: number;
  issues: AttackSurfaceIssue[];
  checks: {
    spf: { present: boolean; valid: boolean; record?: string };
    dmarc: { present: boolean; valid: boolean; record?: string };
    dnssec: { present: boolean; signed: boolean };
    mx: { present: boolean; records: string[] };
    ns: { present: boolean; records: string[] };
  };
}

const DNS_OVER_HTTPS_SERVERS = [
  'https://dns.google/resolve',
  'https://cloudflare-dns.com/dns-query',
];

export async function lookupDNS(
  domain: string,
  recordType: RecordType = 'A'
): Promise<DNSLookupResult> {
  const startTime = performance.now();
  
  const typeCode: Record<RecordType, number> = {
    A: 1,
    AAAA: 28,
    MX: 15,
    TXT: 16,
    CNAME: 5,
    NS: 2,
    SOA: 6,
    PTR: 12,
    SRV: 33,
  };

  const params = new URLSearchParams({
    name: domain,
    type: typeCode[recordType].toString(),
  });

  const errors: string[] = [];

  for (const server of DNS_OVER_HTTPS_SERVERS) {
    try {
      const response = await fetch(`${server}?${params}`, {
        headers: {
          Accept: 'application/dns-json',
        },
      });

      if (!response.ok) {
        errors.push(`Server ${server} returned ${response.status}`);
        continue;
      }

      const data = await response.json();
      const responseTime = Math.round(performance.now() - startTime);

      if (data.Status === 0 && data.Answer) {
        const records: DNSRecord[] = data.Answer.map((answer: any) => ({
          type: answer.type === 1 ? 'A' : answer.type === 28 ? 'AAAA' : 
                answer.type === 15 ? 'MX' : answer.type === 16 ? 'TXT' :
                answer.type === 5 ? 'CNAME' : answer.type === 2 ? 'NS' :
                answer.type === 6 ? 'SOA' : answer.type === 12 ? 'PTR' :
                answer.type === 33 ? 'SRV' : 'UNKNOWN',
          name: answer.name,
          value: answer.data,
          ttl: answer.TTL,
          priority: answer.type === 15 ? parseInt(answer.data.split(' ')[0]) : undefined,
        }));

        return {
          domain,
          recordType,
          records,
          responseTime,
          timestamp: new Date(),
        };
      } else if (data.Status === 3) {
        return {
          domain,
          recordType,
          records: [],
          responseTime: Math.round(performance.now() - startTime),
          timestamp: new Date(),
          error: 'NXDOMAIN - Domain does not exist',
        };
      }
    } catch (error) {
      errors.push(`Server ${server} failed: ${error}`);
    }
  }

  return {
    domain,
    recordType,
    records: [],
    responseTime: Math.round(performance.now() - startTime),
    timestamp: new Date(),
    error: `All DNS servers failed: ${errors.join(', ')}`,
  };
}

export async function getIPIntelligence(ip: string): Promise<IPIntelligenceData | null> {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,isp,org,as,lat,lon,timezone,mobile,proxy,hosting`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch IP data');
    }

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(data.message || 'IP lookup failed');
    }

    return {
      ip: data.query,
      version: data.query.includes(':') ? 6 : 4,
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      isp: data.isp,
      org: data.org,
      asn: data.as,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isMobile: data.mobile,
      isProxy: data.proxy,
      isHosting: data.hosting,
    };
  } catch (error) {
    console.error('IP intelligence error:', error);
    return null;
  }
}

export async function analyzeAttackSurface(domain: string): Promise<AttackSurfaceResult> {
  const issues: AttackSurfaceIssue[] = [];
  let riskScore = 0;

  const [spfResult, dmarcResult, dnssecResult, mxResult, nsResult] = await Promise.all([
    lookupDNS(domain, 'TXT'),
    lookupDNS(domain, 'TXT'),
    lookupDNS(domain, 'SOA'),
    lookupDNS(domain, 'MX'),
    lookupDNS(domain, 'NS'),
  ]);

  const spfRecord = spfResult.records.find(r => r.value.startsWith('v=spf1'));
  const dmarcRecord = dmarcResult.records.find(r => r.value.startsWith('v=dmarc1'));

  const spf = {
    present: !!spfRecord,
    valid: spfRecord ? spfRecord.value.includes('v=spf1') : false,
    record: spfRecord?.value,
  };

  const dmarc = {
    present: !!dmarcRecord,
    valid: dmarcRecord ? dmarcRecord.value.includes('v=dmarc1') : false,
    record: dmarcRecord?.value,
  };

  const dnssec = {
    present: dnssecResult.records.length > 0,
    signed: false,
  };

  const mx = {
    present: mxResult.records.length > 0,
    records: mxResult.records.map(r => r.value),
  };

  const ns = {
    present: nsResult.records.length > 0,
    records: nsResult.records.map(r => r.value),
  };

  if (!spf.present) {
    issues.push({
      id: 'spf-missing',
      severity: 'high',
      category: 'Email Security',
      title: 'SPF Record Missing',
      description: 'No SPF record found for domain. This could allow email spoofing.',
      recommendation: 'Add an SPF record to specify authorized mail servers.',
    });
    riskScore += 25;
  } else if (!spf.valid) {
    issues.push({
      id: 'spf-invalid',
      severity: 'medium',
      category: 'Email Security',
      title: 'SPF Record Invalid',
      description: 'SPF record exists but may be misconfigured.',
      recommendation: 'Review SPF syntax and ensure it covers all authorized servers.',
    });
    riskScore += 15;
  }

  if (!dmarc.present) {
    issues.push({
      id: 'dmarc-missing',
      severity: 'high',
      category: 'Email Security',
      title: 'DMARC Record Missing',
      description: 'No DMARC record found. This leaves domain vulnerable to email spoofing.',
      recommendation: 'Implement DMARC policy to protect your domain from email spoofing.',
    });
    riskScore += 25;
  } else if (!dmarc.valid) {
    issues.push({
      id: 'dmarc-invalid',
      severity: 'medium',
      category: 'Email Security',
      title: 'DMARC Record Invalid',
      description: 'DMARC record exists but may be misconfigured.',
      recommendation: 'Review DMARC policy syntax and alignment settings.',
    });
    riskScore += 10;
  }

  if (!dnssec.present) {
    issues.push({
      id: 'dnssec-missing',
      severity: 'low',
      category: 'DNSSEC',
      title: 'DNSSEC Not Configured',
      description: 'Domain does not appear to have DNSSEC enabled.',
      recommendation: 'Consider enabling DNSSEC to protect against DNS spoofing attacks.',
    });
    riskScore += 10;
  }

  if (!mx.present) {
    issues.push({
      id: 'mx-missing',
      severity: 'medium',
      category: 'Email Delivery',
      title: 'MX Records Missing',
      description: 'No MX records found. Domain cannot receive emails.',
      recommendation: 'Add MX records if you expect to receive emails.',
    });
    riskScore += 15;
  }

  if (ns.records.length < 2) {
    issues.push({
      id: 'ns-insufficient',
      severity: 'low',
      category: 'Infrastructure',
      title: 'Insufficient Nameservers',
      description: 'Domain has fewer than 2 nameservers, which may affect redundancy.',
      recommendation: 'Use at least 2 nameservers for redundancy.',
    });
    riskScore += 5;
  }

  riskScore = Math.min(riskScore, 100);

  return {
    domain,
    riskScore,
    issues,
    checks: { spf, dmarc, dnssec, mx, ns },
  };
}

export function generateTestSubdomain(baseDomain: string): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${random}.${baseDomain}`;
}
