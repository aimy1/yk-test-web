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
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between z-30 select-none shadow-xs">
      {/* Brand Title & Logo */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white border border-slate-700/50 flex items-center justify-center shadow-xs overflow-hidden p-1.5 transition-transform hover:scale-105">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow-xs" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-blue-950 to-slate-800 bg-clip-text text-transparent">
              油库资产数据采集与管理系统
            </h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md border border-blue-200/80 text-[10px] hidden lg:inline-block">
              v2026.08
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls & User Profile */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Unit Code Isolation Badge */}
        <div className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-900 text-white rounded-xl border border-slate-800 font-medium shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] text-slate-400 font-sans">受控单位:</span>
          <span className="font-mono font-bold text-cyan-300">{currentUser ? `${currentUser.unit_code}` : currentUnit}</span>
        </div>

        {/* Refresh System Data Button */}
        <button
          onClick={onRefresh}
          className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/80 bg-white shadow-2xs flex items-center gap-1.5 font-semibold text-xs active:scale-95"
          title="刷新数据"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">刷新数据</span>
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-all border border-slate-200/80 bg-white shadow-2xs"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-xs font-mono shadow-2xs">
              {currentUser ? currentUser.name[0] : 'a'}
            </div>
            <div className="text-left hidden sm:block pr-1">
              <div className="font-bold text-slate-900 leading-tight text-xs">{currentUser ? currentUser.name : 'arch1'}</div>
              <div className="text-[10px] text-slate-500 font-semibold">{currentUser?.role.split(' ')[0]}</div>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-2.5 shadow-xl z-50 space-y-2 font-sans">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{currentUser?.name}</span>
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[9px]">
                    {currentUser?.role.split(' ')[0]}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  账号: {currentUser?.username}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  单位代码: {currentUser?.unit_code}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-all text-xs"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>安全退出登录</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
