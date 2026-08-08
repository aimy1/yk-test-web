import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Download, Search, GitBranch, RefreshCw, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Unit } from '../../types';
import { Pagination } from '../common/Pagination';
import * as XLSX from 'xlsx';

export const UnitManagementView: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [simOldCode, setSimOldCode] = useState('JD-DEPOT-01');
  const [simTargetUnit, setSimTargetUnit] = useState<Unit | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">架构单位总数</div>
          <div className="text-xl font-bold font-mono text-slate-900">{units.length} <span className="text-xs font-normal text-slate-400">个节点</span></div>
        </div>
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">根级集团总部</div>
          <div className="text-xl font-bold font-mono text-blue-600">{units.filter(u => !u.parent_code || u.parent_code === '').length} <span className="text-xs font-normal text-slate-400">个根节点</span></div>
        </div>
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">最高深度级别</div>
          <div className="text-xl font-bold font-mono text-emerald-600">Level {Math.max(1, ...units.map(u => u.level || 1))} <span className="text-xs font-normal text-slate-400">级架构</span></div>
        </div>
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">从级映射总数</div>
          <div className="text-xl font-bold font-mono text-purple-600">{units.reduce((acc, u) => acc + u.mappings.length, 0)} <span className="text-xs font-normal text-slate-400">套异构映射</span></div>
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

      {/* View Switcher & Filter */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="检索单位编码、单位名称、负责人姓名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none w-full font-mono"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            📋 列表明细视图
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'tree' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            🌳 层级架构树视图
          </button>
        </div>
      </div>

      {/* Tree Diagram View */}
      {viewMode === 'tree' && (
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-600" />
              单位多级组织架构树 (支持父子穿透审计)
            </h3>
            <span className="text-[11px] text-slate-500">共 {units.length} 个单位节点</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {units.filter((u) => !u.parent_code || u.parent_code.trim() === '').map((rootUnit) => {
              const childUnits = units.filter((c) => c.parent_code === rootUnit.code);
              return (
                <div key={rootUnit.code} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded-md text-[10px]">
                        L1 根层级
                      </span>
                      <span className="font-bold text-slate-900 font-sans">{rootUnit.name}</span>
                      <span className="text-slate-400">[{rootUnit.code}]</span>
                    </div>
                    <div className="text-slate-500 text-[11px] font-sans">
                      负责人: <span className="font-semibold text-slate-700">{rootUnit.manager}</span> ({rootUnit.phone})
                    </div>
                  </div>

                  {/* Level 2 Children */}
                  {childUnits.length > 0 && (
                    <div className="pl-6 border-l-2 border-blue-200 space-y-2.5 ml-2 pt-1">
                      {childUnits.map((child) => {
                        const grandChildren = units.filter((g) => g.parent_code === child.code);
                        return (
                          <div key={child.code} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 font-bold rounded-md text-[10px]">
                                  L2 储运库区/车间
                                </span>
                                <span className="font-bold text-slate-800 font-sans">{child.name}</span>
                                <span className="text-slate-400">[{child.code}]</span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-sans">负责人: {child.manager}</span>
                            </div>

                            {/* Level 3 Grandchildren */}
                            {grandChildren.length > 0 && (
                              <div className="pl-5 border-l-2 border-cyan-200 space-y-1.5 ml-2 pt-1">
                                {grandChildren.map((gc) => (
                                  <div key={gc.code} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200/60">
                                    <div className="flex items-center gap-2">
                                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 font-bold rounded text-[9px]">
                                        L3 作业组/班组
                                      </span>
                                      <span className="font-medium text-slate-800 font-sans">{gc.name}</span>
                                      <span className="text-slate-400">[{gc.code}]</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-sans">负责人: {gc.manager}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3.5 font-semibold">单位编码</th>
                <th className="p-3.5 font-semibold">单位名称</th>
                <th className="p-3.5 font-semibold">层级级别</th>
                <th className="p-3.5 font-semibold">从属层级关系 (上级)</th>
                <th className="p-3.5 font-semibold">负责人</th>
                <th className="p-3.5 font-semibold">联系电话</th>
                <th className="p-3.5 font-semibold">多套代码映射/替换</th>
                <th className="p-3.5 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((u) => {
                const parentUnit = units.find((p) => p.code === u.parent_code);
                const lvl = u.level || 1;
                return (
                  <tr key={u.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{u.code}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{u.name}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        lvl === 1 ? 'bg-blue-600 text-white' :
                        lvl === 2 ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
                        lvl === 3 ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        'bg-slate-200 text-slate-800'
                      }`}>
                        Level {lvl} - {u.level_name || (lvl === 1 ? '集团总部' : lvl === 2 ? '储运分公司' : lvl === 3 ? '基层油库' : '班组作业区')}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {u.parent_code ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md text-slate-700 w-fit">
                          <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                          <span>{parentUnit ? parentUnit.name : u.parent_code}</span>
                          <span className="text-[10px] text-slate-400">({u.parent_code})</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md font-sans text-[11px] border border-blue-200">
                          👑 根层级单位 (集团/总公司)
                        </span>
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
                );
              })}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">维护单位编码及层级关系</h3>

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
                <label className="text-slate-700 block mb-1 font-semibold">上级单位选择 (建立树形从属架构)</label>
                <select
                  value={formData.parent_code || ''}
                  onChange={(e) => setFormData({ ...formData, parent_code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold"
                >
                  <option value="">-- 无 (设置为根层级/集团总部单位) --</option>
                  {units
                    .filter((u) => u.code !== formData.code)
                    .map((u) => (
                      <option key={u.code} value={u.code}>
                        [{u.code}] {u.name} (Level {u.level || 1} - {u.level_name || '单位'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Dynamic Level Calculation Preview Banner */}
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-blue-900 flex items-center justify-between text-[11px]">
                <span className="font-semibold">计算生成层级 (Auto Level):</span>
                <span className="font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md">
                  Level {!formData.parent_code ? 1 : ((units.find(u => u.code === formData.parent_code)?.level || 1) + 1)} - 
                  {!formData.parent_code ? '集团总部' : ((units.find(u => u.code === formData.parent_code)?.level || 1) === 1 ? '储运分公司' : ((units.find(u => u.code === formData.parent_code)?.level || 1) === 2 ? '基层油库' : '班组作业区'))}
                </span>
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
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">
                取消
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs">
                保存单位层级架构
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
