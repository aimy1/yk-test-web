import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit, Trash2, ShieldAlert, CheckCircle2, XCircle, Search, GitFork } from 'lucide-react';
import { api } from '../../services/api';
import { AssetCategory } from '../../types';

export const CategoryManagementView: React.FC = () => {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<AssetCategory>({
    id: 0,
    parent_id: 0,
    class_name: '',
    class_code: '',
    full_class_code: '',
    level: 1,
    number_rule_id: 'CR-01',
    status: 0,
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSave = async () => {
    if (!formData.class_name || !formData.class_code) {
      return alert('请填写分类名称和当前层级分类编码！');
    }
    try {
      const fullCode = formData.parent_id > 0
        ? `${categories.find(c => c.id === formData.parent_id)?.full_class_code || ''}${formData.class_code}`
        : formData.class_code;
      await api.saveCategory({ ...formData, full_class_code: fullCode });
      alert('资产分类信息保存成功！');
      setShowModal(false);
      loadCategories();
    } catch (err: any) {
      alert(err.message || '保存分类失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认逻辑删除该资产分类？如果存在关联资产或子分类将触发放空阻断。')) return;
    try {
      const res = await api.deleteCategory(id);
      alert(res.message || '删除成功');
      loadCategories();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.class_name.includes(searchTerm) ||
      c.class_code.includes(searchTerm) ||
      c.full_class_code.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            资产分类管理 (大/中/小类)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            统一维护油库资产的大类、中类和小类层级树，配置编目编码规则，提供启停控制与删除安全引用校验。
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              id: 0,
              parent_id: 0,
              class_name: '',
              class_code: '',
              full_class_code: '',
              level: 1,
              number_rule_id: 'CR-01',
              status: 0,
            });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          新增资产分类
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="搜索分类名称、分类编码..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">共 {filtered.length} 个编目分类层级条目</span>
      </div>

      {/* Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 font-semibold">
              <tr>
                <th className="p-4">分类 ID</th>
                <th className="p-4">分类层级</th>
                <th className="p-4">分类名称</th>
                <th className="p-4">当前层级编码</th>
                <th className="p-4">完整编目分类编码</th>
                <th className="p-4">绑定编号规则 ID</th>
                <th className="p-4">启用状态</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{cat.id}</td>
                  <td className="p-4 font-sans">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      cat.level === 1 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {cat.level === 1 ? '一 级 大 类' : cat.level === 2 ? '二 级 中 类' : '三 级 小 类'}
                    </span>
                  </td>
                  <td className="p-4 font-sans font-bold text-slate-800">{cat.class_name}</td>
                  <td className="p-4 font-bold text-slate-700">{cat.class_code}</td>
                  <td className="p-4 font-bold text-blue-600">{cat.full_class_code}</td>
                  <td className="p-4 text-slate-500">{cat.number_rule_id || '默认规则'}</td>
                  <td className="p-4 font-sans">
                    {cat.status === 0 ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 正常启用
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> 停用中
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right font-sans space-x-2">
                    <button
                      onClick={() => {
                        setFormData(cat);
                        setShowModal(true);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] border border-slate-200 font-medium shadow-2xs"
                    >
                      <Edit className="w-3 h-3 inline mr-1 text-blue-600" /> 编辑
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 rounded-lg text-[11px] border border-slate-200 font-medium shadow-2xs"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1 text-rose-600" /> 删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-blue-600" />
              {formData.id > 0 ? '编辑资产分类' : '新增资产分类'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">上级父分类</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => {
                    const pId = Number(e.target.value);
                    const parentCat = categories.find((c) => c.id === pId);
                    setFormData({
                      ...formData,
                      parent_id: pId,
                      level: parentCat ? parentCat.level + 1 : 1,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900"
                >
                  <option value={0}>无上级 (作为大类分类)</option>
                  {categories
                    .filter((c) => c.id !== formData.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.class_name} (编码: {c.full_class_code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">分类名称</label>
                <input
                  type="text"
                  placeholder="如: 油罐储存类, 离心发油泵..."
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">当前层级短编码</label>
                  <input
                    type="text"
                    placeholder="如: 005001"
                    value={formData.class_code}
                    onChange={(e) => setFormData({ ...formData, class_code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">绑定资产编号规则 ID</label>
                  <select
                    value={formData.number_rule_id || 'CR-01'}
                    onChange={(e) => setFormData({ ...formData, number_rule_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900"
                  >
                    <option value="CR-01">CR-01 (输油泵规则 YK-PUMP-)</option>
                    <option value="CR-02">CR-02 (阀门规则 YK-VALVE-)</option>
                    <option value="CR-03">CR-03 (油罐规则 YK-TANK-)</option>
                    <option value="CR-04">CR-04 (仪表规则 YK-METER-)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">启停状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900"
                >
                  <option value={0}>正常启用</option>
                  <option value={1}>停用</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                保存分类设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
