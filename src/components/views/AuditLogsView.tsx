import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, Terminal, Clock, Trash2, Smartphone, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import * as XLSX from 'xlsx';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadLogs = async () => {
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, actionFilter]);

  const handleDeleteLog = async (id: string) => {
    if (!confirm(`确认物理删除编号为 [${id}] 的系统审计日志记录？`)) return;
    try {
      await api.deleteLog(id);
      loadLogs();
    } catch (err: any) {
      alert(err.message || '删除日志失败');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('🚨 高危提示：是否确认完全清空数据库中的所有系统审计日志记录？清空后将无法恢复！')) return;
    try {
      const res = await api.clearLogs();
      alert(res.message || '所有系统日志已成功清空！');
      loadLogs();
    } catch (err: any) {
      alert(err.message || '清空日志失败');
    }
  };

  const handleExport = () => {
    const data = filtered.map(l => ({
      '日志ID': l.id,
      '操作IP地址': l.ip,
      '操作用户': l.operator,
      '操作模块/动作': l.action,
      '操作时间': l.time,
      '操作详细内容说明': l.details,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "系统登录与操作日志");
    XLSX.writeFile(wb, "油库资产数据采集系统操作日志.xlsx");
  };

  const filtered = logs.filter(l => {
    const isAppLog = l.action.startsWith('APP') || l.operator.includes('APP') || l.details.includes('APP') || l.details.includes('移动') || l.details.includes('防爆');
    const matchKw = l.operator.includes(searchTerm) || l.action.includes(searchTerm) || l.ip.includes(searchTerm) || l.details.includes(searchTerm);

    if (actionFilter === 'APP') return matchKw && isAppLog;
    if (actionFilter === 'PC') return matchKw && !isAppLog;
    const matchAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchKw && matchAction;
  });

  const appLogsCount = logs.filter(l => l.action.startsWith('APP') || l.operator.includes('APP') || l.details.includes('APP') || l.details.includes('移动') || l.details.includes('防爆')).length;

  const totalLogs = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedLogs = filtered.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            系统日志审计管理 (含 APP 防爆手持终端日志)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            实时审计 PC 控制台与移动端防爆 APP 终端的全量登录、现场数据采集、规则生成、彩码扫码及离线同步日志。
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleClearAll}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            清空所有日志
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            导出日志 EXCEL
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => setActionFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              actionFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            全部日志 ({logs.length})
          </button>
          <button
            onClick={() => setActionFilter('APP')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              actionFilter === 'APP' ? 'bg-cyan-600 text-white shadow-2xs font-bold' : 'text-cyan-700 hover:text-cyan-900 bg-cyan-50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            📱 移动端 APP 日志 ({appLogsCount})
          </button>
          <button
            onClick={() => setActionFilter('PC')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              actionFilter === 'PC' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            PC 控制台日志 ({logs.length - appLogsCount})
          </button>
        </div>

        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="按操作地址IP、操作时间、APP防爆终端、操作用户检索日志..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs flex flex-col">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold">日志ID</th>
              <th className="p-3.5 font-semibold">操作地址 (IP)</th>
              <th className="p-3.5 font-semibold">操作用户</th>
              <th className="p-3.5 font-semibold">操作动作/模块</th>
              <th className="p-3.5 font-semibold">操作时间</th>
              <th className="p-3.5 font-semibold">操作详细内容说明</th>
              <th className="p-3.5 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {paginatedLogs.map(l => {
              const isApp = l.action.startsWith('APP') || l.operator.includes('APP') || l.details.includes('APP') || l.details.includes('移动') || l.details.includes('防爆');
              return (
                <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-slate-400">{l.id}</td>
                  <td className="p-3.5 text-blue-600 font-bold">{l.ip}</td>
                  <td className="p-3.5 font-sans font-bold text-slate-900">{l.operator}</td>
                  <td className="p-3.5 font-sans">
                    {isApp ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 font-bold border border-cyan-200 text-[11px] inline-flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-cyan-600" /> {l.action}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold border border-slate-200 text-[11px] inline-flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-blue-600" /> {l.action}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-300" /> {l.time}
                  </td>
                  <td className="p-3.5 font-sans text-slate-600">{l.details}</td>
                  <td className="p-3.5 text-right font-sans">
                    <button
                      onClick={() => handleDeleteLog(l.id)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1 text-rose-600" /> 删除
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginatedLogs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-sans">
                  暂无匹配的系统审计日志记录
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="bg-slate-50/90 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="text-slate-500 font-sans flex items-center gap-2">
            <span>
              {totalLogs > 0 ? (
                <>显示第 <strong className="text-slate-800 font-mono">{startIndex + 1}</strong> 至 <strong className="text-slate-800 font-mono">{Math.min(startIndex + pageSize, totalLogs)}</strong> 条，共 <strong className="text-slate-800 font-mono">{totalLogs}</strong> 条日志</>
              ) : (
                '共 0 条日志'
              )}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2 font-sans">
              <span className="text-slate-500">每页显示:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value={10}>10 条/页</option>
                <option value={20}>20 条/页</option>
                <option value={50}>50 条/页</option>
                <option value={100}>100 条/页</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage <= 1}
                title="首页"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage <= 1}
                title="上一页"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {getPageNumbers().map(num => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    num === safeCurrentPage
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage >= totalPages}
                title="下一页"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
                title="末页"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

