import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Download, Search, CheckCircle2, Tag } from 'lucide-react';
import { api } from '../../services/api';
import { DictionaryItem } from '../../types';
import * as XLSX from 'xlsx';

export const DataDictView: React.FC = () => {
  const [dicts, setDicts] = useState<DictionaryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<DictionaryItem>({
    id: '',
    dict_type: '资产运行状态',
    label: '',
    value: '',
    status: '启用',
    remark: '',
  });

  const loadDicts = async () => {
    try {
      const data = await api.getDictionaries();
      setDicts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDicts();
  }, []);

  const handleSave = async () => {
    if (!formData.label || !formData.value) return alert('请填写字典标签和字典值');
    try {
      const id = formData.id || `DICT-${Date.now().toString().slice(-4)}`;
      await api.saveDictionary({ ...formData, id });
      alert('字典信息维护成功！');
      setShowModal(false);
      loadDicts();
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleDelete = async (item: DictionaryItem) => {
    if (!confirm(`确认要物理删除数据字典条目 [${item.dict_type}] -> [${item.label}] 吗？`)) return;
    try {
      await api.deleteDictionary(item.id);
      alert('字典条目已成功安全删除！');
      loadDicts();
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleExport = () => {
    const data = filtered.map(d => ({
      '字典ID': d.id,
      '字典类型': d.dict_type,
      '字典名称(标签)': d.label,
      '字典键值': d.value,
      '状态': d.status,
      '备注说明': d.remark,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "数据字典明细");
    XLSX.writeFile(wb, "油库系统数据字典.xlsx");
  };

  const categories = Array.from(new Set(dicts.map(d => d.dict_type)));

  const filtered = dicts.filter(d => {
    const matchKw = d.label.includes(searchTerm) || d.value.includes(searchTerm) || d.dict_type.includes(searchTerm);
    const matchType = typeFilter === 'ALL' || d.dict_type === typeFilter;
    return matchKw && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            数据字典
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            新建/修改/删除/查询字典、字典类型、状态、备注等信息，并支持检索导出为 EXCEL 文档。
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            导出 EXCEL
          </button>
          <button
            onClick={() => {
              setFormData({ id: '', dict_type: '资产运行状态', label: '', value: '', status: '启用', remark: '' });
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            新建字典
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            全部字典 ({dicts.length})
          </button>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setTypeFilter(cat)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === cat ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="通过字典名称、类型等具体查询..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Dicts Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold">字典ID</th>
              <th className="p-3.5 font-semibold">字典类型</th>
              <th className="p-3.5 font-semibold">字典名称 (标签)</th>
              <th className="p-3.5 font-semibold">字典键值</th>
              <th className="p-3.5 font-semibold">状态</th>
              <th className="p-3.5 font-semibold">备注</th>
              <th className="p-3.5 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-mono text-slate-400">{d.id}</td>
                <td className="p-3.5 font-bold text-blue-600">{d.dict_type}</td>
                <td className="p-3.5 font-bold text-slate-900">{d.label}</td>
                <td className="p-3.5 font-mono text-slate-800">{d.value}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" /> {d.status}
                  </span>
                </td>
                <td className="p-3.5 text-slate-500 text-[11px]">{d.remark}</td>
                <td className="p-3.5 text-right space-x-1.5">
                  <button
                    onClick={() => { setFormData(d); setShowModal(true); }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-medium shadow-2xs"
                  >
                    <Edit className="w-3 h-3 inline mr-1 text-blue-600" /> 修改
                  </button>
                  <button
                    onClick={() => handleDelete(d)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] font-medium shadow-2xs"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1 text-rose-600" /> 删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">维护数据字典条目</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">字典类型</label>
                <input
                  type="text"
                  value={formData.dict_type}
                  onChange={(e) => setFormData({ ...formData, dict_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">字典名称 (标签)</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">字典键值</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">备注说明</label>
                <input
                  type="text"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs">保存字典</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
