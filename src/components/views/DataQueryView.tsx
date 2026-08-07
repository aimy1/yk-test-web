import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, Eye, CheckCircle2, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { Asset } from '../../types';
import * as XLSX from 'xlsx';

export const DataQueryView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    api.getAssets().then(setAssets);
  }, []);

  const [sortField, setSortField] = useState<keyof Asset>('code');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: keyof Asset) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filtered = assets
    .filter((a) => {
      const matchKw = a.name.includes(keyword) || a.code.includes(keyword) || a.manufacturer.includes(keyword);
      const matchCat = categoryFilter === 'ALL' || a.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchKw && matchCat && matchStatus;
    })
    .sort((a, b) => {
      const valA = String(a[sortField] || '');
      const valB = String(b[sortField] || '');
      return sortAsc ? valA.localeCompare(valB, 'zh-CN') : valB.localeCompare(valA, 'zh-CN');
    });

  const handleExportExcel = () => {
    const exportData = filtered.map((a) => ({
      '编目编码': a.code,
      '资产名称': a.name,
      '设备分类': a.category,
      '管理单位': a.unit_name,
      '安装位置': a.install_position,
      '使用状态': a.status,
      '生产厂家': a.manufacturer,
      '出厂编码': a.factory_code,
      '京东码': a.jd_code,
      '资产概要': a.summary,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "检索设备设施统计表");
    XLSX.writeFile(wb, "油库设备设施查询统计表.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            数据查询统计
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            通过关键字及资产分类等查询条件，查询设备设施的相关信息并形成统计表，支持列点击交互排序与一键导出 EXCEL。
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          导出检索列表 EXCEL
        </button>
      </div>

      {/* Query Filters */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">关键字查询 (编码/名称/厂家)</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="输入关键字搜索..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-mono"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">设备分类过滤</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
          >
            <option value="ALL">全部分类</option>
            <option value="输油泵类">输油泵类</option>
            <option value="阀门控制类">阀门控制类</option>
            <option value="油罐储存类">油罐储存类</option>
            <option value="计量仪表类">计量仪表类</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">使用状态过滤</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
          >
            <option value="ALL">全部状态</option>
            <option value="在用">在用</option>
            <option value="停用/检修">停用/检修</option>
            <option value="待报废">待报废</option>
          </select>
        </div>
      </div>

      {/* Statistics Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-800">检索统计结果 (点击表头列名称可切换升/降排序)</span>
          <span className="text-blue-600 font-mono font-bold">符合条件: {filtered.length} 条记录</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
              <tr>
                <th onClick={() => handleSort('code')} className="p-3.5 font-semibold cursor-pointer hover:text-slate-900 select-none">
                  编目编码 {sortField === 'code' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th onClick={() => handleSort('name')} className="p-3.5 font-semibold cursor-pointer hover:text-slate-900 select-none">
                  资产名称 {sortField === 'name' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th onClick={() => handleSort('category')} className="p-3.5 font-semibold cursor-pointer hover:text-slate-900 select-none">
                  分类 {sortField === 'category' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th onClick={() => handleSort('unit_name')} className="p-3.5 font-semibold cursor-pointer hover:text-slate-900 select-none">
                  管理单位 {sortField === 'unit_name' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th onClick={() => handleSort('install_position')} className="p-3.5 font-semibold cursor-pointer hover:text-slate-900 select-none">
                  安装位置 {sortField === 'install_position' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th onClick={() => handleSort('status')} className="p-3.5 font-semibold cursor-pointer hover:text-slate-900 select-none">
                  状态 {sortField === 'status' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th className="p-3.5 font-semibold">出厂/JD码</th>
                <th className="p-3.5 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-blue-600">{a.code}</td>
                  <td className="p-3.5 font-sans font-bold text-slate-900">{a.name}</td>
                  <td className="p-3.5 font-sans">{a.category}</td>
                  <td className="p-3.5 font-sans">{a.unit_name}</td>
                  <td className="p-3.5 font-sans">{a.install_position}</td>
                  <td className="p-3.5 text-slate-900">{a.status}</td>
                  <td className="p-3.5 text-slate-400 text-[11px]">{a.factory_code || a.jd_code || '-'}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedAsset(a)}
                      className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-200 font-sans text-[11px]"
                    >
                      <Eye className="w-3 h-3 inline mr-1 text-blue-600" />
                      卡片详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Card Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              设备设施详细卡片 [{selectedAsset.code}]
            </h3>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
              <div>名称: <span className="font-bold text-slate-900 font-sans">{selectedAsset.name}</span></div>
              <div>分类: <span className="text-slate-800 font-sans">{selectedAsset.category}</span></div>
              <div>管理单位: <span className="text-slate-800 font-sans">{selectedAsset.unit_name}</span></div>
              <div>使用状态: <span className="font-bold text-emerald-600 font-sans">{selectedAsset.status}</span></div>
              <div>安装位置: <span className="text-slate-800 font-sans">{selectedAsset.install_position}</span></div>
              <div>生产厂家: <span className="text-slate-800 font-sans">{selectedAsset.manufacturer}</span></div>
              <div>出厂编码: <span className="text-slate-800">{selectedAsset.factory_code}</span></div>
              <div>生产日期: <span className="text-slate-800">{selectedAsset.prod_date}</span></div>
            </div>

            <p className="text-slate-500 font-sans">{selectedAsset.summary}</p>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs"
              >
                关闭卡片
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
