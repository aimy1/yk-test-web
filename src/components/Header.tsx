import React, { useState } from 'react';
import { Shield, RefreshCw, LogOut, CheckCircle2, User } from 'lucide-react';

interface HeaderProps {
  currentUnit: string;
  onRefresh: () => void;
  currentUser?: {
    username: string;
    name: string;
    unit_code: string;
    unit_name: string;
    role: string;
  } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUnit, onRefresh, currentUser, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between z-30 select-none">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-white text-slate-900 border border-slate-200/80 flex items-center justify-center shadow-2xs overflow-hidden p-1">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">油库资产数据采集与管理系统</h1>
          <p className="text-[11px] text-slate-500 font-medium">油库设备资产编目 · 排重纠错 · 单位隔离控制台</p>
        </div>
      </div>

      {/* Action Controls & User Profile */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Unit Code Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-100/80 rounded-xl border border-slate-200/80 text-slate-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono">{currentUser ? `${currentUser.unit_code}` : currentUnit}</span>
        </div>

        {/* REST API Status */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200/60 font-semibold text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>API 正常在线</span>
        </div>

        {/* Refresh System Data Button */}
        <button
          onClick={onRefresh}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/80 bg-white shadow-2xs flex items-center gap-1.5 font-medium"
          title="刷新数据"
        >
          <RefreshCw className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">刷新</span>
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-all border border-slate-200/80 bg-white shadow-2xs"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-xs font-mono">
              {currentUser ? currentUser.name[0] : 'a'}
            </div>
            <div className="text-left hidden sm:block pr-1">
              <div className="font-bold text-slate-900 leading-tight">{currentUser ? currentUser.name : 'arch1'}</div>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl z-50 space-y-1 font-sans">
              <div className="p-2 border-b border-slate-100 text-xs">
                <div className="font-bold text-slate-900">{currentUser?.name}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{currentUser?.unit_code} ({currentUser?.unit_name})</div>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-all text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>退出登录</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
