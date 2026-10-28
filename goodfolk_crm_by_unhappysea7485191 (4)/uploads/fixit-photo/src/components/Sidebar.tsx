import React from 'react';
import { Business } from '../types';
import {
  LayoutDashboard,
  Building2,
  Palette,
  Calendar,
  GitBranch,
  Bot,
  MessageSquare,
  BookOpen,
  Settings,
  ChevronDown,
  Plus,
} from 'lucide-react';

interface Props {
  currentView: string;
  onSelectView: (view: string) => void;
  businesses: Business[];
  currentBiz: Business;
  onSelectBusiness: (biz: Business) => void;
  onOpenAddBusiness: () => void;
  todayCount: number;
  dailyGoal: number;
}

export const Sidebar: React.FC<Props> = ({
  currentView,
  onSelectView,
  businesses,
  currentBiz,
  onSelectBusiness,
  onOpenAddBusiness,
  todayCount,
  dailyGoal,
}) => {
  const [isSwitcherOpen, setIsSwitcherOpen] = React.useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'businesses', label: 'Businesses', icon: Building2, count: businesses.length },
    { id: 'studio', label: 'Creative studio', icon: Palette },
    { id: 'content', label: 'Content calendar', icon: Calendar },
    { id: 'workflows', label: 'Workflows', icon: GitBranch },
    { id: 'agents', label: 'Bot team', icon: Bot, hasDot: true },
    { id: 'chat', label: 'Team chat', icon: MessageSquare },
    { id: 'learning', label: 'Review & learning', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const goalProgress = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

  return (
    <aside className="w-64 bg-gradient-to-b from-[#421017] to-[#2d191d] text-[#fff8ed] flex flex-col shrink-0 border-r-0 select-none min-h-screen">
      {/* Brand Header */}
      <div className="px-5 pt-6 pb-4">
        <a href="#overview" onClick={() => onSelectView('overview')} className="flex items-center gap-2.5 text-white no-underline">
          <div className="w-8 h-8 rounded-lg bg-black/40 border border-[#f1e194]/30 flex items-center justify-center p-1 shadow-inner">
            <img src="/goodfolk-mark.svg" alt="Goodfolk" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#fff8ed]">
            Goodfolk<span className="text-[#f1e194]">.</span>
          </span>
        </a>
      </div>

      {/* Subaccount Switcher */}
      <div className="px-4 mb-4 relative">
        <div className="text-[9px] font-bold tracking-widest text-[#d4b9a9] uppercase mb-1.5 px-2">
          OWNER ACCOUNT
        </div>

        <button
          onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#5b0e14] text-[#f1e194] border border-[#f1e194]/40 flex items-center justify-center font-bold text-xs shrink-0">
              {currentBiz.initial}
            </div>
            <div className="min-w-0">
              <strong className="block text-xs font-bold text-white truncate">{currentBiz.name}</strong>
              <small className="block text-[9px] text-[#d4b9a9] truncate">Subaccount · owner managed</small>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[#d4b9a9] shrink-0" />
        </button>

        {/* Dropdown Menu */}
        {isSwitcherOpen && (
          <div className="absolute top-full left-4 right-4 mt-1.5 bg-[#2a1317] border border-white/20 rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden animate-fade-in">
            {businesses.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  onSelectBusiness(b);
                  setIsSwitcherOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/10 transition-colors ${
                  b.id === currentBiz.id ? 'bg-white/15' : ''
                }`}
              >
                <span className="w-6 h-6 rounded bg-[#5b0e14] text-[#f1e194] text-[10px] font-bold flex items-center justify-center shrink-0">
                  {b.initial}
                </span>
                <span className="text-xs font-medium text-white truncate flex-1">{b.name}</span>
                {b.id === currentBiz.id && <span className="w-1.5 h-1.5 rounded-full bg-[#f1e194]" />}
              </button>
            ))}

            <div className="p-1.5 mt-1 border-t border-white/10">
              <button
                onClick={() => {
                  setIsSwitcherOpen(false);
                  onOpenAddBusiness();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#f1e194]/20 hover:bg-[#f1e194]/30 text-[#f1e194] text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Business</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="px-3 flex-1 space-y-0.5 overflow-y-auto">
        <div className="text-[9px] font-bold tracking-widest text-[#d4b9a9] uppercase mb-1.5 px-3">
          WORKSPACE
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#f1e194] text-[#421017] font-bold shadow-md'
                  : 'text-[#e1d1c7] hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#5b0e14]' : 'text-[#d4b9a9]'}`} />
              <span className="truncate flex-1 text-left">{item.label}</span>

              {item.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                    isActive ? 'bg-[#421017]/20 text-[#421017]' : 'bg-white/15 text-[#f1e194]'
                  }`}
                >
                  {item.count}
                </span>
              )}

              {item.hasDot && (
                <span className="w-2 h-2 rounded-full bg-[#acc8a2] shadow-[0_0_8px_#acc8a2]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer: Daily publishing goal & Owner profile */}
      <div className="p-4 mt-auto border-t border-white/15 space-y-3.5">
        <div className="p-3 rounded-xl bg-white/10 border border-white/10">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-[#e1d1c7]">Daily publishing goal</span>
            <span className="text-[#f1e194]">
              {todayCount} / {dailyGoal}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/20 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#f1e194] transition-all duration-300"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="text-[9px] text-[#d4b9a9] mt-1.5">Posts prepared today</p>
        </div>

        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-full bg-[#f1e194] text-[#421017] font-bold text-xs flex items-center justify-center shrink-0">
            DB
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-xs font-bold text-white truncate">Dan B Clarks</strong>
            <small className="block text-[9px] text-[#d4b9a9] truncate">Workspace owner</small>
          </div>
        </div>
      </div>
    </aside>
  );
};
