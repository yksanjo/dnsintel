'use client';

import { useState } from 'react';
import { 
  Search, 
  Globe, 
  Shield, 
  Network, 
  Terminal,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

const tools = [
  { id: 'dns', label: 'DNS Lookup', icon: Search },
  { id: 'ip', label: 'IP Intelligence', icon: Globe },
  { id: 'attack', label: 'Attack Surface', icon: Shield },
  { id: 'graph', label: 'Infrastructure', icon: Network },
  { id: 'subdomain', label: 'Subdomain Test', icon: Zap },
];

export function Sidebar({ activeTool, onToolChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 z-40 border-r border-[#27272a] bg-[#0a0a0f] transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
          {!collapsed && (
            <span className="text-sm font-medium text-[#a1a1aa]">Tools</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-[#1a1a24] text-[#71717a] hover:text-[#f4f4f5] transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;

            return (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#00d4aa]/10 text-[#00d4aa] border-l-2 border-[#00d4aa]'
                    : 'text-[#a1a1aa] hover:bg-[#1a1a24] hover:text-[#f4f4f5]'
                )}
              >
                <Icon size={18} className={isActive ? 'text-[#00d4aa]' : ''} />
                {!collapsed && <span>{tool.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#27272a]">
          {!collapsed ? (
            <div className="flex items-center gap-2 text-xs text-[#71717a]">
              <Terminal size={14} />
              <span>v1.0.0 MVP</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <Zap size={18} className="text-[#71717a]" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
