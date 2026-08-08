import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, Terminal, Clock, Trash2, Smartphone } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { Pagination } from '../common/Pagination';
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
      const list = Array.isArray(data) ? data : (data?.logs || data?.items || []);
      setLogs(list);
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

  const isAppLog = (l: AuditLog) => {
    if (!l) return false;
    const act = l.action || '';
    const op = l.operator || '';
    const det = l.details || '';
    return act.startsWith('APP') || op.includes('APP') || det.includes('APP') || det.includes('移动') || det.includes('防爆') || det.includes('手持');
  };

  const filtered = logs.filter(l => {
    if (!l) return false;
    const appFlag = isAppLog(l);
    const kw = (searchTerm || '').trim().toLowerCase();
    const matchKw = !kw || 
      (l.operator || '').toLowerCase().includes(kw) || 
      (l.action || '').toLowerCase().includes(kw) || 
      (l.ip || '').toLowerCase().includes(kw) || 
      (l.details || '').toLowerCase().includes(kw);

    if (actionFilter === 'APP') return matchKw && appFlag;
    if (actionFilter === 'PC') return matchKw && !appFlag;
    const matchAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchKw && matchAction;
  });

  const appLogsCount = logs.filter(isAppLog).length;

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

        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>
    </div>
  );
};

