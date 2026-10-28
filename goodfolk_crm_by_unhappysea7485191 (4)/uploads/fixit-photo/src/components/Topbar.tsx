import React from 'react';
import { Business } from '../types';
import { Bell, ShieldCheck, Sparkles } from 'lucide-react';

interface Props {
  currentBiz: Business;
  currentView: string;
}

export const Topbar: React.FC<Props> = ({ currentBiz, currentView }) => {
  const viewTitles: Record<string, string> = {
    overview: 'Overview',
    businesses: 'Businesses & Subaccounts',
    studio: 'Creative Studio',
    content: 'Content Calendar',
    workflows: 'Workflows',
    agents: 'Bot Team & Task Queue',
    chat: 'Team Chat',
    learning: 'Review & Learning',
    settings: 'Settings',
  };

  return (
    <header className="h-16 px-6 sm:px-8 border-b border-[#e8e2d8] bg-[#fffdf9]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-10 sticky top-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#85867c] font-medium">{currentBiz.name}</span>
        <span className="text-[#ded8cc]">/</span>
        <strong className="text-[#1d211b] font-bold">{viewTitles[currentView] || 'Overview'}</strong>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eef4e9] text-[#527247] border border-[#d6e3ce]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#527247] animate-pulse" />
          <span>Owner account active</span>
        </span>

        <div className="w-8 h-8 rounded-full bg-[#f1e194] text-[#5b0e14] font-bold text-xs flex items-center justify-center border border-[#e8dd9b] shadow-xs">
          DB
        </div>
      </div>
    </header>
  );
};
