'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { DNSLookupTool } from '@/components/DNSLookupTool';
import { IPIntelligenceTool } from '@/components/IPIntelligenceTool';
import { AttackSurfaceTool } from '@/components/AttackSurfaceTool';
import { InfrastructureGraph } from '@/components/InfrastructureGraph';
import { SubdomainTestTool } from '@/components/SubdomainTestTool';

export default function Home() {
  const [activeTool, setActiveTool] = useState('dns');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderTool = () => {
    switch (activeTool) {
      case 'dns':
        return <DNSLookupTool />;
      case 'ip':
        return <IPIntelligenceTool />;
      case 'attack':
        return <AttackSurfaceTool />;
      case 'graph':
        return <InfrastructureGraph />;
      case 'subdomain':
        return <SubdomainTestTool />;
      default:
        return <DNSLookupTool />;
    }
  };

  const getToolTitle = () => {
    switch (activeTool) {
      case 'dns':
        return 'DNS Lookup';
      case 'ip':
        return 'IP Intelligence';
      case 'attack':
        return 'Attack Surface Analysis';
      case 'graph':
        return 'Infrastructure Visualization';
      case 'subdomain':
        return 'Ephemeral Subdomain Testing';
      default:
        return 'DNS Lookup';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <Sidebar 
        activeTool={activeTool} 
        onToolChange={(tool) => {
          setActiveTool(tool);
          setSidebarOpen(false);
        }} 
      />

      <main className="pt-16 lg:pl-64 transition-all">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#f4f4f5] mb-1">
              {getToolTitle()}
            </h1>
            <p className="text-sm text-[#71717a]">
              Developer-focused DNS security and debugging suite
            </p>
          </div>

          {renderTool()}
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
