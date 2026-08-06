import React, { useState, useEffect } from 'react';
import { BarChart3, Download, ArrowUpDown } from 'lucide-react';
import { api } from '../../services/api';
import { AnalyticsData, Asset } from '../../types';
import ReactECharts from 'echarts-for-react';
import * as XLSX from 'xlsx';

export const AnalyticsDashboardView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sortField, setSortField] = useState<keyof Asset>('code');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(setData);
    api.getAssets().then(setAssets);
  }, []);

  const handleSort = (field: keyof Asset) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedAssets = [...assets].sort((a, b) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleExport = () => {
    const exportData = sortedAssets.map(a => ({
      '编目编码': a.code,
      '资产名称': a.name,
      '设备类型': a.category,
      '安装位置': a.install_position,
      '使用状态': a.status,
      '审核状态': a.audit_status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "设备设施编码统计表");
    XLSX.writeFile(wb, "油库资产编码数量统计表.xlsx");
  };

  if (!data) return <div className="text-slate-500 text-xs p-6">加载统计数据中...</div>;

  // ECharts Minimalist Light Theme Options
  const pieOption = {
    backgroundColor: 'transparent',
    title: { text: '设备设施使用状态分布 (饼图 - Item 40)', left: 'center', textStyle: { color: '#0f172a', fontSize: 13, fontWeight: 'bold' } },
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '状态数量',
        type: 'pie',
        radius: ['40%', '70%'],
        itemStyle: { borderRadius: 8, borderColor: '#ffffff', borderWidth: 2 },
        label: { color: '#334155', fontSize: 11 },
        data: data.pie_chart.map(p => ({ value: p.count, name: p.status })),
      },
    ],
  };

  const barOption = {
    backgroundColor: 'transparent',
    title: { text: '各设备类型编码数量 (直方图 - Item 40)', left: 'center', textStyle: { color: '#0f172a', fontSize: 13, fontWeight: 'bold' } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.histogram.map(h => h.category), axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' } },
    series: [
      {
        data: data.histogram.map(h => h.count),
        type: 'bar',
        itemStyle: { color: '#2563eb', borderRadius: [6, 6, 0, 0] },
      },
    ],
  };

  const lineOption = {
    backgroundColor: 'transparent',
    title: { text: '已编码与待编码趋势 (折线图 - Item 40)', left: 'center', textStyle: { color: '#0f172a', fontSize: 13, fontWeight: 'bold' } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.line_chart.map(l => l.date), axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' } },
    series: [
      { name: '已编码数量', data: data.line_chart.map(l => l.coded), type: 'line', smooth: true, itemStyle: { color: '#059669' } },
      { name: '待编码数量', data: data.line_chart.map(l => l.pending), type: 'line', smooth: true, itemStyle: { color: '#d97706' } },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            查询统计大屏 (Items 37-40: 属性排序 / 导出 / 饼直折图大屏)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            按设备类型、设备状态等条件检索，以饼图、直方图、折线图等形式展示设备设施编码数量、待编码数量等统计信息。
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          导出统计数据 EXCEL (Item 39)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
          <div className="text-xs text-slate-500 font-medium">总设备设施条目</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{data.summary.total_assets}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
          <div className="text-xs text-slate-500 font-medium">已统一编目编码数</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{data.summary.coded_count}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
          <div className="text-xs text-slate-500 font-medium">待编码设备数</div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{data.summary.pending_count}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
          <div className="text-xs text-slate-500 font-medium">赋码完成率</div>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">{data.summary.code_rate}%</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-80">
          <ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-80">
          <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-80">
          <ReactECharts option={lineOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* Dynamic Column Sortable Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-800 flex justify-between items-center">
          <span>列表排序分析 (点击表头字段按属性列排序 - Item 38)</span>
          <span className="text-[11px] text-slate-500 font-mono">当前排序: {String(sortField)} ({sortAsc ? '升序' : '降序'})</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold cursor-pointer hover:text-blue-600" onClick={() => handleSort('code')}>
                编目编码 <ArrowUpDown className="w-3 h-3 inline" />
              </th>
              <th className="p-3.5 font-semibold cursor-pointer hover:text-blue-600" onClick={() => handleSort('name')}>
                资产名称 <ArrowUpDown className="w-3 h-3 inline" />
              </th>
              <th className="p-3.5 font-semibold cursor-pointer hover:text-blue-600" onClick={() => handleSort('category')}>
                设备分类 <ArrowUpDown className="w-3 h-3 inline" />
              </th>
              <th className="p-3.5 font-semibold cursor-pointer hover:text-blue-600" onClick={() => handleSort('install_position')}>
                安装位置 <ArrowUpDown className="w-3 h-3 inline" />
              </th>
              <th className="p-3.5 font-semibold cursor-pointer hover:text-blue-600" onClick={() => handleSort('status')}>
                状态 <ArrowUpDown className="w-3 h-3 inline" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {sortedAssets.map(a => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="p-3.5 text-blue-600 font-bold">{a.code}</td>
                <td className="p-3.5 font-sans font-medium text-slate-900">{a.name}</td>
                <td className="p-3.5 font-sans text-slate-600">{a.category}</td>
                <td className="p-3.5 font-sans text-slate-600">{a.install_position}</td>
                <td className="p-3.5 text-slate-700">{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
