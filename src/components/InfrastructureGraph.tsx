'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Network, ZoomIn, ZoomOut, Maximize2, Download, Loader2 } from 'lucide-react';
import * as d3 from 'd3';
import { cn, isValidDomain } from '@/lib/utils';
import { lookupDNS, type RecordType } from '@/lib/dns';

interface GraphNode {
  id: string;
  type: 'domain' | 'a' | 'aaaa' | 'mx' | 'ns' | 'cname';
  label: string;
  value?: string;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export function InfrastructureGraph() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    setGraphData(null);

    try {
      const nodes: GraphNode[] = [{ id: cleanDomain, type: 'domain', label: cleanDomain }];
      const links: GraphLink[] = [];

      const [aResult, aaaaResult, mxResult, nsResult, cnameResult] = await Promise.all([
        lookupDNS(cleanDomain, 'A'),
        lookupDNS(cleanDomain, 'AAAA'),
        lookupDNS(cleanDomain, 'MX'),
        lookupDNS(cleanDomain, 'NS'),
        lookupDNS(cleanDomain, 'CNAME'),
      ]);

      aResult.records.forEach((record) => {
        const nodeId = `a-${record.value}`;
        nodes.push({ id: nodeId, type: 'a', label: record.value, value: record.value });
        links.push({ source: cleanDomain, target: nodeId, type: 'A' });
      });

      aaaaResult.records.forEach((record) => {
        const nodeId = `aaaa-${record.value}`;
        nodes.push({ id: nodeId, type: 'aaaa', label: record.value, value: record.value });
        links.push({ source: cleanDomain, target: nodeId, type: 'AAAA' });
      });

      mxResult.records.forEach((record) => {
        const nodeId = `mx-${record.value}`;
        nodes.push({ id: nodeId, type: 'mx', label: record.value, value: record.value });
        links.push({ source: cleanDomain, target: nodeId, type: 'MX' });
      });

      nsResult.records.forEach((record) => {
        const nodeId = `ns-${record.value}`;
        nodes.push({ id: nodeId, type: 'ns', label: record.value, value: record.value });
        links.push({ source: cleanDomain, target: nodeId, type: 'NS' });
      });

      cnameResult.records.forEach((record) => {
        const nodeId = `cname-${record.value}`;
        nodes.push({ id: nodeId, type: 'cname', label: record.value, value: record.value });
        links.push({ source: cleanDomain, target: nodeId, type: 'CNAME' });
      });

      setGraphData({ nodes, links });
    } catch (err) {
      setError('Failed to analyze infrastructure');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAnalyze();
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'domain': return '#00d4aa';
      case 'a': return '#10b981';
      case 'aaaa': return '#10b981';
      case 'mx': return '#f59e0b';
      case 'ns': return '#7c3aed';
      case 'cname': return '#ec4899';
      default: return '#71717a';
    }
  };

  const renderGraph = useCallback(() => {
    if (!graphData || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 500;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force('link', d3.forceLink(graphData.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    const link = g.append('g')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', '#27272a')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .attr('class', 'cursor-pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);

    node.append('circle')
      .attr('r', (d) => d.type === 'domain' ? 20 : 12)
      .attr('fill', (d) => getNodeColor(d.type))
      .attr('stroke', '#0a0a0f')
      .attr('stroke-width', 2);

    node.append('text')
      .text((d) => d.type === 'domain' ? d.label : d.label.split('.').slice(0, 2).join('.'))
      .attr('x', 0)
      .attr('y', (d) => d.type === 'domain' ? 35 : 28)
      .attr('text-anchor', 'middle')
      .attr('fill', '#a1a1aa')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace');

    node.append('title')
      .text((d) => `${d.type.toUpperCase()}: ${d.value || d.label}`);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }, [graphData]);

  useEffect(() => {
    if (graphData) {
      renderGraph();
    }
  }, [graphData, renderGraph]);

  useEffect(() => {
    const handleResize = () => {
      if (graphData) renderGraph();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [graphData, renderGraph]);

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Network className="text-[#00d4aa]" size={20} />
          Infrastructure Graph
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
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Network size={16} />
                Visualize
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <p className="mt-2 text-xs text-[#71717a]">
          Press Ctrl+Enter to visualize • Shows DNS record relationships
        </p>
      </div>

      {graphData && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {domain} - {graphData.nodes.length} nodes, {graphData.links.length} connections
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00d4aa]"></span> Domain
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> A/AAAA
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> MX
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#7c3aed]"></span> NS
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#ec4899]"></span> CNAME
                </span>
              </div>
            </div>
          </div>

          <div ref={containerRef} className="w-full bg-[#1a1a24] rounded-lg overflow-hidden">
            <svg ref={svgRef} className="w-full"></svg>
          </div>
        </div>
      )}
    </div>
  );
}
