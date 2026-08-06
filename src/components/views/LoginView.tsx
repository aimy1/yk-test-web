import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';

interface LoginViewProps {
  onLoginSuccess: (user: {
    username: string;
    name: string;
    unit_code: string;
    unit_name: string;
    role: string;
  }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !password) {
      setErrorMsg('请输入账号和密码');
      return;
    }

    setLoading(true);

    try {
      const res = await api.login(username, password);
      if (res && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg('登录失败：身份验证未通过');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '登录失败：未能查询到该账号或与服务器连接中断');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex items-center justify-center p-6 relative overflow-hidden select-none font-sans">
      {/* Ambient Background Gradients */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-50/60 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-teal-50/60 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Modern Minimalist Card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-8 shadow-xl shadow-slate-200/50 space-y-6 relative z-10">
        {/* System Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-slate-200/80 p-1.5 shadow-md shadow-slate-200/50 mb-1 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            油库资产数据采集与管理系统
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            油库设备资产编目 · 排重纠错 · 资产安全管理
          </p>
        </div>

        {/* Clean Real Login Form (Authentic DB Verification) */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Account Input */}
          <div>
            <label className="text-slate-700 block mb-1.5 font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              系统账号
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入系统账号"
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Password Input with Show/Hide Toggle */}
          <div>
            <label className="text-slate-700 block mb-1.5 font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              密码
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 pr-10 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-700 p-1 transition-colors"
                title={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span>安全鉴权验证中...</span>
            ) : (
              <>
                <span>安全登录系统</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer Note */}
        <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Rust Axum SQLite 真实数据库安全鉴权服务 (Port 3001)
          </div>
        </div>
      </div>
    </div>
  );
};
