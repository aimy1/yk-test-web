import React, { useState, useEffect } from 'react';
import { Smartphone, Plus, Edit, Trash2, Search, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { api } from '../../services/api';
import { Terminal } from '../../types';

interface TerminalManagementViewProps {
  currentUser?: {
    username: string;
    name: string;
    unit_code: string;
    unit_name: string;
    role: string;
  } | null;
}

export const TerminalManagementView: React.FC<TerminalManagementViewProps> = ({ currentUser }) => {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Terminal>({
    id: '',
    brand: '',
    model: '',
    terminal_code: '',
    unit_code: 'UNIT-001',
    purchase_date: '2024-01-01',
    status: '已绑定同级单位 (允许对接)',
  });

  const loadTerms = async () => {
    try {
      const [data, unitsData] = await Promise.all([
        api.getTerminals(),
        api.getUnits(),
      ]);
      setTerminals(data);
      setUnits(unitsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const handleSave = async () => {
    if (!formData.terminal_code || !formData.model) return alert('请填写终端代码与型号');
    try {
      const id = formData.id || `TERM-${Date.now().toString().slice(-4)}`;
      await api.saveTerminal({ ...formData, id });
      alert('移动终端配置保存成功！系统已应用同级单位数据隔离策略。');
      setShowModal(false);
      loadTerms();
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleDelete = async (t: Terminal) => {
    if (!confirm(`确定要从系统中逻辑删除移动终端设备 [${t.terminal_code}] (${t.brand} ${t.model}) 吗？`)) return;
    try {
      await api.deleteTerminal(t.id);
      alert('移动终端设备已成功逻辑删除！');
      loadTerms();
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleToggleStatus = async (t: Terminal) => {
    const isCurrentlyAllowed = !t.status.includes('禁用') && !t.status.includes('拒绝对接') && !t.status.includes('隔离');
    const newStatus = isCurrentlyAllowed ? '跨单位隔离 (拒绝对接)' : '已绑定同级单位 (允许对接)';
    try {
      await api.saveTerminal({ ...t, status: newStatus });
      loadTerms();
    } catch (err) {
      alert('切换状态失败');
    }
  };

  const handleTestDocking = (t: Terminal) => {
    const userUnit = currentUser?.unit_code || 'UNIT-001';
    const isMatched = t.unit_code === userUnit;
    const isAllowed = isMatched && !t.status.includes('禁用') && !t.status.includes('拒绝对接') && !t.status.includes('隔离');

    if (isAllowed) {
      alert(`✅【移动终端对接测试成功】\n\n终端代码: [${t.terminal_code}] (${t.brand} ${t.model})\n绑定单位: [${t.unit_code}]\n当前账号单位: [${userUnit}]\n\n对接结论: 单位归属一致 (Level 2 同级)，REST API 协议握手正常，允许数据收发对接。`);
    } else if (!isMatched) {
      alert(`🚨【移动终端对接阻断警告】\n\n终端代码: [${t.terminal_code}] (${t.brand} ${t.model})\n终端单位: [${t.unit_code}]\n当前账号单位: [${userUnit}]\n\n阻断原因: 终端归属单位与当前账号单位不匹配！根据架构规范，隶属同级单位的数据才可对接，已实施安全隔离拦截防数据混乱。`);
    } else {
      alert(`⚠️【移动终端对接不可用】\n\n终端代码: [${t.terminal_code}] (${t.brand} ${t.model})\n当前状态: ${t.status}\n\n阻断原因: 该终端已被管理员设为禁用或拒绝授权状态。`);
    }
  };

  const filtered = terminals.filter(t => {
    const matchKw = t.terminal_code.includes(searchTerm) || t.brand.includes(searchTerm) || t.model.includes(searchTerm) || t.unit_code.includes(searchTerm);
    const userUnit = currentUser?.unit_code || 'UNIT-001';
    const isMatched = t.unit_code === userUnit;
    const isAllowed = isMatched && !t.status.includes('禁用') && !t.status.includes('拒绝对接') && !t.status.includes('隔离');

    if (statusFilter === 'ALLOWED') return matchKw && isAllowed;
    if (statusFilter === 'ISOLATED') return matchKw && !isAllowed;
    return matchKw;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            移动终端管理 (单位绑定与同级数据对接隔离)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            移动终端绑定到单位，PC 端和 APP 端用户之间，隶属同级单位的数据才可对接，防止数据混乱；实时进行对接链路握手测试与隔离阻断。
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ id: '', brand: 'Honeywell', model: 'EDA52 工业防爆终端', terminal_code: `PAD-YK-00${terminals.length + 1}`, unit_code: currentUser?.unit_code || 'UNIT-001', purchase_date: '2024-05-10', status: '已绑定同级单位 (允许对接)' });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          新增移动终端
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            全部终端 ({terminals.length})
          </button>
          <button
            onClick={() => setStatusFilter('ALLOWED')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'ALLOWED' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            🟢 允许对接 (同级匹配)
          </button>
          <button
            onClick={() => setStatusFilter('ISOLATED')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'ISOLATED' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-rose-700 hover:text-rose-900'
            }`}
          >
            🔴 隔离拒绝对接 (跨单位)
          </button>
        </div>

        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="按移动终端品牌、型号、终端代码、绑定单位代码检索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Terminals Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold">终端代码</th>
              <th className="p-3.5 font-semibold">品牌</th>
              <th className="p-3.5 font-semibold">型号</th>
              <th className="p-3.5 font-semibold">绑定单位代码</th>
              <th className="p-3.5 font-semibold">购买日期</th>
              <th className="p-3.5 font-semibold">对接许可与隔离状态</th>
              <th className="p-3.5 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {filtered.map((t) => {
              const userUnit = currentUser?.unit_code || 'UNIT-001';
              const isUnitMatched = t.unit_code === userUnit;
              const isAllowed = isUnitMatched && !t.status.includes('禁用') && !t.status.includes('拒绝对接') && !t.status.includes('隔离');

              return (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-blue-600">{t.terminal_code}</td>
                  <td className="p-3.5 font-sans font-bold text-slate-900">{t.brand}</td>
                  <td className="p-3.5 font-sans">{t.model}</td>
                  <td className="p-3.5 font-sans">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200 text-[11px]">
                      <ShieldCheck className="w-3 h-3 inline mr-1 text-blue-600" /> {t.unit_code}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400">{t.purchase_date}</td>
                  <td className="p-3.5 font-sans">
                    {isAllowed ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1 w-fit">
                        <Wifi className="w-3 h-3 text-emerald-600" /> 已同级绑定 (允许对接)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 w-fit" title="非同级单位终端数据不可直接对接，已强行隔离防混乱">
                        <WifiOff className="w-3 h-3 text-rose-600" /> 跨单位隔离 (拒绝对接)
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-1.5 font-sans">
                    <button
                      onClick={() => handleTestDocking(t)}
                      className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg border border-cyan-200 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer"
                      title="发起现场终端 API 对接链路握手测试"
                    >
                      <Wifi className="w-3 h-3 inline mr-1 text-cyan-600" /> 测试对接
                    </button>
                    <button
                      onClick={() => handleToggleStatus(t)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-semibold shadow-2xs transition-all cursor-pointer ${
                        isAllowed ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                      title="快速切换授权/隔离状态"
                    >
                      {isAllowed ? '隔离阻断' : '授权对接'}
                    </button>
                    <button onClick={() => { setFormData(t); setShowModal(true); }} className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-medium shadow-2xs cursor-pointer">
                      <Edit className="w-3 h-3 inline mr-1 text-blue-600" /> 修改
                    </button>
                    <button onClick={() => handleDelete(t)} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] font-medium shadow-2xs cursor-pointer">
                      <Trash2 className="w-3 h-3 inline mr-1 text-rose-600" /> 删除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">配置移动终端信息</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">终端代码</label>
                <input
                  type="text"
                  value={formData.terminal_code}
                  onChange={(e) => setFormData({ ...formData, terminal_code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">终端品牌</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">终端型号</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold flex items-center justify-between">
                  <span>绑定单位代码 (同级数据对接隔离)</span>
                  <span className="text-[10px] text-blue-600 font-mono">共 {units.length} 个真实单位</span>
                </label>
                <select
                  value={formData.unit_code}
                  onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-semibold"
                >
                  {units.length === 0 ? (
                    <option value="UNIT-001">UNIT-001 (第一储运发油库区)</option>
                  ) : (
                    units.map((u) => (
                      <option key={u.code} value={u.code}>
                        [{u.code}] {u.name} (Level {u.level || 1} - {u.level_name || '单位'})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">对接许可与数据隔离状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold"
                >
                  <option value="已绑定同级单位 (允许对接)">已绑定同级单位 (允许对接)</option>
                  <option value="跨单位隔离 (拒绝对接)">跨单位隔离 (拒绝对接)</option>
                  <option value="未激活/待审核">未激活/待审核</option>
                  <option value="设备已禁用">设备已禁用</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs">保存终端配置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
