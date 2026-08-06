import React, { useState, useEffect } from 'react';
import { GitCompare, Edit3, ShieldCheck, Tag, Filter, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Asset } from '../../types';

export const DataMigrationView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<Array<{ external: Asset; formal?: Asset; diff_type: string }>>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'NEW' | 'DIFF'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<Asset | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getExternalCompare();
      setComparison(res.items);
      setSelectedIds(res.items.map((i: any) => i.external.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async () => {
    if (selectedIds.length === 0) return alert('请选择要审核入库的数据');
    try {
      const res = await api.approveExternalImport(selectedIds);
      alert(res.message);
      loadData();
    } catch (err) {
      alert('入库失败');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await api.saveAsset(editingItem);
      alert('修正已保存！');
      setEditingItem(null);
      loadData();
    } catch (err) {
      alert('保存失败');
    }
  };

  const filteredComparison = comparison.filter(item => {
    if (activeTab === 'NEW') return item.diff_type === '新增';
    if (activeTab === 'DIFF') return item.diff_type === '变动' || item.diff_type === '变动异常';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-600" />
            外接库资产入库 (正式库对比)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            灵活对比正式库中现有的关联数据（横向/纵向），自动标记异常、变动和新增数据；支持修改异常数据，确认审核通过后更新至正式库。
          </p>
        </div>
        <button
          onClick={handleApprove}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all active:scale-95"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          审核选中的数据并更新至正式库 ({selectedIds.length} 条)
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            全部对比条目 ({comparison.length})
          </button>
          <button
            onClick={() => setActiveTab('NEW')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'NEW' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            新增设备 ({comparison.filter(i => i.diff_type === '新增').length})
          </button>
          <button
            onClick={() => setActiveTab('DIFF')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'DIFF' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            变动与差异 ({comparison.filter(i => i.diff_type !== '新增').length})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">横向/纵向对比: 外接库数据 vs 正式库关联记录</span>
      </div>

      {/* Comparison Grid */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="divide-y divide-slate-100">
          {filteredComparison.map(({ external, formal, diff_type }) => {
            const isSelected = selectedIds.includes(external.id);
            return (
              <div key={external.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, external.id]);
                        else setSelectedIds(selectedIds.filter(id => id !== external.id));
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-mono font-bold text-slate-900 text-xs">{external.code}</span>
                    <span className="text-xs font-bold text-slate-900">{external.name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      diff_type === '新增'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <Tag className="w-3 h-3 inline mr-1" />
                      {diff_type}
                    </span>
                  </div>

                  <button
                    onClick={() => setEditingItem(external)}
                    className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs border border-slate-200 flex items-center gap-1 shadow-2xs font-medium"
                  >
                    <Edit3 className="w-3 h-3 text-blue-600" />
                    修改异常数据
                  </button>
                </div>

                {/* Side-by-side Diff View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="space-y-1.5">
                    <div className="text-slate-500 font-sans text-[11px] mb-1.5 font-bold text-blue-600">【外接库 incoming 目标数据】</div>
                    <div>分类: <span className="text-slate-900 font-semibold">{external.category}</span></div>
                    <div>状态: <span className="text-slate-900 font-semibold">{external.status}</span></div>
                    <div>安装位置: <span className="text-slate-900 font-semibold">{external.install_position}</span></div>
                    <div>生产厂家: <span className="text-slate-900">{external.manufacturer}</span></div>
                  </div>

                  <div className="space-y-1.5 border-l border-slate-200 pl-4">
                    <div className="text-slate-500 font-sans text-[11px] mb-1.5 font-bold text-emerald-600">【正式库 current 现有记录】</div>
                    {formal ? (
                      <>
                        <div>分类: <span className={formal.category !== external.category ? 'text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded' : 'text-slate-900'}>{formal.category}</span></div>
                        <div>状态: <span className={formal.status !== external.status ? 'text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded' : 'text-slate-900'}>{formal.status}</span></div>
                        <div>安装位置: <span className={formal.install_position !== external.install_position ? 'text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded' : 'text-slate-900'}>{formal.install_position}</span></div>
                        <div>生产厂家: <span className="text-slate-900">{formal.manufacturer}</span></div>
                      </>
                    ) : (
                      <div className="text-slate-400 font-sans italic py-2">正式库无此编码记录（全新新增设备条目）</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">修改异常设备设施数据</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">编目编码</label>
                <input
                  type="text"
                  value={editingItem.code}
                  onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">资产名称</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">使用状态</label>
                <select
                  value={editingItem.status}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="在用">在用</option>
                  <option value="停用/检修">停用/检修</option>
                  <option value="待报废">待报废</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                确认修改并保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
