import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Download, Search, GitBranch, RefreshCw, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Unit } from '../../types';
import * as XLSX from 'xlsx';

export const UnitManagementView: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [simOldCode, setSimOldCode] = useState('JD-DEPOT-01');
  const [simTargetUnit, setSimTargetUnit] = useState<Unit | null>(null);

  const [formData, setFormData] = useState<Unit>({
    code: '',
    name: '',
    parent_code: '',
    manager: '',
    phone: '',
    mappings: [],
  });
  const [mappingInput, setMappingInput] = useState('');

  const loadUnits = async () => {
    try {
      const data = await api.getUnits();
      setUnits(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const handleSimulateReplace = () => {
    const found = units.find(u => u.mappings.includes(simOldCode));
    if (found) {
      setSimTargetUnit(found);
    } else {
      setSimTargetUnit(null);
      alert(`未检索到与代码 [${simOldCode}] 对应的单位！`);
    }
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) return alert('请填写单位编码和名称');
    try {
      const mappingsArr = mappingInput ? mappingInput.split(',').map(s => s.trim()).filter(Boolean) : formData.mappings;
      await api.saveUnit({ ...formData, mappings: mappingsArr });
      alert('保存成功！已建立单位信息与代码映射。');
      setShowModal(false);
      loadUnits();
    } catch (err: any) {
      alert(`保存失败: ${err.message || '系统异常'}`);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`确认逻辑删除单位代码 ${code} 及其关系？`)) return;
    try {
      await api.deleteUnit(code);
      loadUnits();
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleExport = () => {
    const data = units.map(u => ({
      '单位编码': u.code,
      '单位名称': u.name,
      '上级单位编码': u.parent_code || '无(顶级单位)',
      '负责人': u.manager,
      '联系电话': u.phone,
      '外部多套代码映射': u.mappings.join(' / '),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "单位编码管理表");
    XLSX.writeFile(wb, "单位编码与从属关系表.xlsx");
  };

  const filtered = units.filter(u => u.name.includes(searchTerm) || u.code.includes(searchTerm) || u.manager.includes(searchTerm));

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            单位管理 (编码从属关系与多套代码映射)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            建立单位间的从属关系；提供条件检索、修改、逻辑删除、EXCEL 导出，支持多套单位代码映射与替换。
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            导出 Excel
          </button>
          <button
            onClick={() => {
              setFormData({ code: `UNIT-00${units.length + 1}`, name: '', parent_code: '', manager: '', phone: '', mappings: [] });
              setMappingInput('');
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            新增单位编码
          </button>
        </div>
      </div>

      {/* Code Mapping & Replacement */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-blue-600" /> 多套单位代码映射/替换:
          </span>
          <input
            type="text"
            value={simOldCode}
            onChange={(e) => setSimOldCode(e.target.value)}
            placeholder="输入外部映射代码, 如: JD-DEPOT-01"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono w-56"
          />
          <button
            onClick={handleSimulateReplace}
            className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold border border-blue-200"
          >
            查询映射替换
          </button>
        </div>

        {simTargetUnit && (
          <div className="flex items-center space-x-2 text-xs font-mono bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-800">
            <span>映射代码: {simOldCode}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold">当前系统单位: [{simTargetUnit.code}] {simTargetUnit.name}</span>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="检索单位编码、负责人姓名、电话..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-slate-800 focus:outline-none w-full font-mono"
        />
      </div>

      {/* Units Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold">单位编码</th>
              <th className="p-3.5 font-semibold">单位名称</th>
              <th className="p-3.5 font-semibold">从属关系 (上级)</th>
              <th className="p-3.5 font-semibold">负责人</th>
              <th className="p-3.5 font-semibold">联系电话</th>
              <th className="p-3.5 font-semibold">多套代码映射/替换</th>
              <th className="p-3.5 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map(u => (
              <tr key={u.code} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-mono font-bold text-slate-900">{u.code}</td>
                <td className="p-3.5 font-semibold text-slate-900">{u.name}</td>
                <td className="p-3.5 font-mono text-slate-500">
                  {u.parent_code ? (
                    <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5 text-slate-400" /> {u.parent_code}</span>
                  ) : (
                    <span className="text-emerald-600 font-sans font-medium">根层级单位</span>
                  )}
                </td>
                <td className="p-3.5">{u.manager}</td>
                <td className="p-3.5 font-mono">{u.phone}</td>
                <td className="p-3.5">
                  <div className="flex flex-wrap gap-1.5">
                    {u.mappings.map((m, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">
                        {m}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3.5 text-right space-x-2">
                  <button
                    onClick={() => {
                      setFormData(u);
                      setMappingInput(u.mappings.join(', '));
                      setShowModal(true);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[11px]"
                  >
                    <Edit className="w-3 h-3 inline mr-1 text-blue-600" /> 修改
                  </button>
                  <button
                    onClick={() => handleDelete(u.code)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px]"
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
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">维护单位编码信息</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">单位编码</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">单位名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">上级单位编码 (建立从属关系)</label>
                <input
                  type="text"
                  placeholder="留空为顶级单位"
                  value={formData.parent_code || ''}
                  onChange={(e) => setFormData({ ...formData, parent_code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">负责人与联系电话</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="姓名"
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="电话"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">多套代码映射 (逗号隔开，如: JD-DEPOT-01, SYS-YK-A)</label>
                <input
                  type="text"
                  value={mappingInput}
                  onChange={(e) => setMappingInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs">保存单位信息</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
