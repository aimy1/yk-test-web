import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, LogOut, CheckCircle2, User, Bell, AlertTriangle, ArrowRight, CheckSquare } from 'lucide-react';

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
  onNavigateTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUnit, onRefresh, currentUser, onLogout, onNavigateTab }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchPendingNotifications = async () => {
    try {
      const res = await fetch('http://127.0.0.1:3001/api/v1/notifications/pending-audit');
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.pending_count || 0);
        setNotifications(data.items || []);
      } else {
        const res2 = await fetch('http://127.0.0.1:3001/api/v1/assets');
        if (res2.ok) {
          const assets = await res2.json();
          const pending = assets.filter((a: any) => a.audit_status === 1 || a.auditStatus === 1);
          setPendingCount(pending.length);
          setNotifications(pending.map((a: any) => ({
            id: a.id,
            equipment_no: a.equipment_no || a.equipmentNo,
            asset_name: a.asset_name || a.assetName,
            unit_name: a.unit_name || a.unitName || '第一储运发油库区',
            message: `收到来自 [${a.unit_name || '第一储运发油库区'}] 防爆终端采编的 [${a.equipment_no || a.equipmentNo}] ${a.asset_name || a.assetName} 单级审核申请`,
            time: '刚刚'
          })));
        }
      }
    } catch (_) {
      // Ignore network errors
    }
  };

  useEffect(() => {
    fetchPendingNotifications();
    const interval = setInterval(fetchPendingNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

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

        {/* Real-time Pending Audit Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowProfileMenu(false);
            }}
            className={`p-2 rounded-xl transition-all border shadow-2xs flex items-center gap-1.5 font-semibold text-xs active:scale-95 ${
              pendingCount > 0
                ? 'bg-amber-50 text-amber-700 border-amber-300/80 hover:bg-amber-100'
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200/80'
            }`}
            title="待审核通知提醒"
          >
            <div className="relative">
              <Bell className={`w-4 h-4 ${pendingCount > 0 ? 'text-amber-600 animate-bounce' : 'text-slate-600'}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-bold">待审查通知</span>
          </button>

          {/* Pending Audit Notifications Dropdown Panel */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-2xl z-50 space-y-3 font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="font-extrabold text-slate-900 text-xs">单级待审核申请提醒</span>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                  共 {pendingCount} 条待办
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 space-y-1">
                    <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold">暂无待审核申请，所有条目均已审查通过！</p>
                  </div>
                ) : (
                  notifications.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        setShowNotifMenu(false);
                        if (onNavigateTab) onNavigateTab('audit');
                      }}
                      className="p-2.5 bg-slate-50 hover:bg-amber-50/80 rounded-xl border border-slate-200/60 hover:border-amber-300 transition-all cursor-pointer space-y-1 text-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 group-hover:text-amber-900 font-mono">
                          [{item.equipment_no}]
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.time || '刚刚'}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-tight line-clamp-2">
                        {item.message || `收到 [${item.asset_name}] 单级审核申请，请防爆主管审查。`}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {pendingCount > 0 && (
                <button
                  onClick={() => {
                    setShowNotifMenu(false);
                    if (onNavigateTab) onNavigateTab('audit');
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold shadow-xs text-xs transition-all active:scale-95"
                >
                  <span>一键前往单级审核中心</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
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
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifMenu(false);
            }}
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
