'use client';

import { Shield, Menu, Github, Twitter } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#27272a] bg-[#0a0a0f]/95 backdrop-blur-md">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-[#1a1a24] text-[#71717a] hover:text-[#f4f4f5] transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#00b894] flex items-center justify-center">
              <Shield size={20} className="text-[#0a0a0f]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-[#f4f4f5] tracking-tight">
                DNSIntel
              </h1>
              <p className="text-xs text-[#71717a] -mt-0.5">Security Debugging Suite</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md hover:bg-[#1a1a24] text-[#71717a] hover:text-[#f4f4f5] transition-colors"
          >
            <Github size={18} />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md hover:bg-[#1a1a24] text-[#71717a] hover:text-[#f4f4f5] transition-colors"
          >
            <Twitter size={18} />
          </a>
        </div>
      </div>
    </header>
  );
}
