import React, { useState } from 'react';
import { Download, RefreshCcw, Smartphone, Database, CheckCircle2, History, ShieldCheck, Eye } from 'lucide-react';
import { api } from '../../services/api';

export const DataReceiveView: React.FC = () => {
  const [loadingJd, setLoadingJd] = useState(false);
  const [loadingApp, setLoadingApp] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; time: string; type: string; msg: string; count: number }>>([
    {
      id: 'init-1',
      time: '14:00:12',
      type: 'JD资产系统',
      msg: '系统已成功接收 JD 资产系统推送之第 1 批数据包 (包号: PKG-JD-8812)',
      count: 12,
    },
    {
      id: 'init-2',
      time: '14:15:30',
      type: 'APP移动端',
      msg: '通过 MySQL 跳板数据库完成 APP 现场采集设备增量同步',
      count: 8,
    },
  ]);

  const handleReceiveJd = async () => {
    setLoadingJd(true);
    try {
      const res = await api.receiveExternalData('JD', '接收上级已审核发码设备数据');
      setMessages((prev) => [
        {
          id: Math.random().toString(),
          time: new Date().toLocaleTimeString(),
          type: 'JD资产系统',
          msg: res.message,
          count: res.received_count || 1,
        },
        ...prev,
      ]);
    } catch (err) {
      alert('接收JD数据失败！');
    } finally {
      setLoadingJd(false);
    }
  };

  const handleSyncApp = async () => {
    setLoadingApp(true);
    try {
      const res = await api.receiveExternalData('APP', '接收APP现场采集跳板数据库数据');
      setMessages((prev) => [
        {
          id: Math.random().toString(),
          time: new Date().toLocaleTimeString(),
          type: 'APP移动端',
          msg: res.message,
          count: res.received_count || 1,
        },
        ...prev,
      ]);
    } catch (err) {
      alert('同步APP数据失败！');
    } finally {
      setLoadingApp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" />
          数据接收 (外接库)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          接收 JD 资产系统或 APP 现场采集的设备设施数据，存入档案数据库并生成系统操作日志。
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: JD Asset System */}
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 hover:shadow-md transition-all">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">接收 JD 资产系统数据</h3>
              <p className="text-xs text-slate-500">接收上级已审核或已赋码设备数据存入档案库</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-xs font-mono text-slate-600 border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between">
              <span>接口协议:</span>
              <span className="text-slate-900 font-bold">RESTful / JSON Interface</span>
            </div>
            <div className="flex justify-between">
              <span>通道状态:</span>
              <span className="text-emerald-600 font-bold">在线就绪</span>
            </div>
            <div className="flex justify-between">
              <span>安全校验:</span>
              <span className="text-slate-900 font-bold">单位代码自动判定匹配</span>
            </div>
          </div>

          <button
            onClick={handleReceiveJd}
            disabled={loadingJd}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            {loadingJd ? '接收处理中...' : '接收 JD 资产系统数据包'}
          </button>
        </div>

        {/* Card 2: APP Terminal Sync */}
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 hover:shadow-md transition-all">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-600">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">接收 APP 现场采集数据</h3>
              <p className="text-xs text-slate-500">通过 Mysql 跳板数据库将 APP 采集的设备数据同步至 PC 端档案库</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-xs font-mono text-slate-600 border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between">
              <span>跳板数据库:</span>
              <span className="text-slate-900 font-bold">MySQL Staging DB (Port: 3306)</span>
            </div>
            <div className="flex justify-between">
              <span>数据同步:</span>
              <span className="text-emerald-600 font-bold">同级单位数据隔离对接</span>
            </div>
            <div className="flex justify-between">
              <span>机制:</span>
              <span className="text-slate-900 font-bold">增量自动写入日志</span>
            </div>
          </div>

          <button
            onClick={handleSyncApp}
            disabled={loadingApp}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <RefreshCcw className="w-4 h-4 text-teal-400" />
            {loadingApp ? '同步中...' : '同步 APP 现场采集数据'}
          </button>
        </div>
      </div>

      {/* Operation Logs Feed */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-2xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            数据接收与同步日志明细
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">共 {messages.length} 条数据流操作记录</span>
        </div>

        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="px-2 py-0.5 rounded-md bg-white text-slate-800 font-bold border border-slate-200 text-[10px]">
                  {m.type}
                </span>
                <span className="text-slate-700 font-sans font-medium">{m.msg}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-slate-400">{m.time}</span>
                <button
                  onClick={() => setSelectedLog(m)}
                  className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 font-sans text-[11px]"
                >
                  <Eye className="w-3 h-3 inline mr-1 text-blue-600" />
                  日志详情
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              接口接收日志卡片明细
            </h3>

            <div className="space-y-2 font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>来源系统: <span className="font-bold text-slate-900">{selectedLog.type}</span></div>
              <div>触发时间: <span className="text-slate-800">{selectedLog.time}</span></div>
              <div>日志内容: <span className="text-slate-800 font-sans">{selectedLog.msg}</span></div>
              <div>数据条数: <span className="font-bold text-emerald-600">{selectedLog.count} 条设备条目存入档案库</span></div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
