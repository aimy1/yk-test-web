import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Edit, Trash2, CheckCircle2, ShieldAlert, Code2, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { FieldTemplate } from '../../types';

export const FieldTemplateView: React.FC = () => {
  const [selectedCatId, setSelectedCatId] = useState<number>(1001);
  const [templates, setTemplates] = useState<FieldTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FieldTemplate>({
    id: 0,
    category_id: 1001,
    template_type: 'extend',
    field_name: '',
    field_label: '',
    data_type: 'decimal',
    component_type: 'number',
    required: true,
    unique_flag: false,
    default_value: '',
    unit: 'm3',
    validation_json: '{"min": 0, "max": 100000}',
    enabled: true,
  });

  const loadTemplates = async (catId: number) => {
    try {
      const data = await api.getFieldTemplates(catId);
      setTemplates(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTemplates(selectedCatId);
  }, [selectedCatId]);

  const handleSave = async () => {
    if (!formData.field_name || !formData.field_label) return alert('请填写字段标识与字段名称');
    try {
      await api.saveFieldTemplate({ ...formData, category_id: selectedCatId });
      alert('字段模板配置成功！');
      setShowModal(false);
      loadTemplates(selectedCatId);
    } catch (err) {
      alert('保存失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            扩展属性配置
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            按资产小类配置基础属性、状态属性与扩展属性；支持数据类型、UI控件渲染类型、必填/唯一性约束与正则表达式校验规则。
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              id: 0,
              category_id: selectedCatId,
              template_type: 'extend',
              field_name: `param_${Date.now().toString().slice(-4)}`,
              field_label: '',
              data_type: 'string',
              component_type: 'input',
              required: true,
              unique_flag: false,
              default_value: '',
              unit: '',
              validation_json: '{}',
              enabled: true,
            });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          配置扩展字段
        </button>
      </div>

      {/* Category Selector Tabs */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-2">
        <span className="text-xs font-bold text-slate-700 ml-2 mr-2 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-600" /> 选择资产小类:
        </span>
        <button
          onClick={() => setSelectedCatId(1001)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedCatId === 1001 ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          油罐储存类 (Cat: 1001)
        </button>
        <button
          onClick={() => setSelectedCatId(1002)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedCatId === 1002 ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          输油泵类 (Cat: 1002)
        </button>
        <button
          onClick={() => setSelectedCatId(1003)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedCatId === 1003 ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          阀门控制类 (Cat: 1003)
        </button>
      </div>

      {/* Field Templates Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold">字段标识</th>
              <th className="p-3.5 font-semibold">字段显示名称</th>
              <th className="p-3.5 font-semibold">模板属性类型</th>
              <th className="p-3.5 font-semibold">数据类型</th>
              <th className="p-3.5 font-semibold">UI控件渲染类型</th>
              <th className="p-3.5 font-semibold">约束条件</th>
              <th className="p-3.5 font-semibold">单位</th>
              <th className="p-3.5 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
            {templates.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-bold text-blue-600">{t.field_name}</td>
                <td className="p-3.5 font-sans font-bold text-slate-900">{t.field_label}</td>
                <td className="p-3.5 font-sans">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                    {t.template_type}
                  </span>
                </td>
                <td className="p-3.5 text-slate-600">{t.data_type}</td>
                <td className="p-3.5 font-sans font-semibold text-teal-700">{t.component_type}</td>
                <td className="p-3.5 font-sans">
                  <div className="flex gap-1.5">
                    {t.required && <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">必填</span>}
                    {t.unique_flag && <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">唯一</span>}
                  </div>
                </td>
                <td className="p-3.5 text-slate-500">{t.unit || '-'}</td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => { setFormData(t); setShowModal(true); }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-medium shadow-2xs"
                  >
                    <Edit className="w-3 h-3 inline mr-1 text-blue-600" /> 编辑
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">配置小类扩展属性字段</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">字段标识 (Key)</label>
                  <input
                    type="text"
                    value={formData.field_name}
                    onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">显示名称 (Label)</label>
                  <input
                    type="text"
                    value={formData.field_label}
                    onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">数据类型</label>
                  <select
                    value={formData.data_type}
                    onChange={(e) => setFormData({ ...formData, data_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  >
                    <option value="string">string (字符串)</option>
                    <option value="int">int (整数)</option>
                    <option value="decimal">decimal (小数)</option>
                    <option value="date">date (日期)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">UI控件渲染类型</label>
                  <select
                    value={formData.component_type}
                    onChange={(e) => setFormData({ ...formData, component_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="input">单行输入框 (input)</option>
                    <option value="number">数值框 (number)</option>
                    <option value="select">下拉选择框 (select)</option>
                    <option value="textarea">多行文本域 (textarea)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-1.5 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>必填校验</span>
                </label>
                <label className="flex items-center space-x-1.5 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.unique_flag}
                    onChange={(e) => setFormData({ ...formData, unique_flag: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>唯一约束</span>
                </label>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">校验规则 JSON (Validation JSON)</label>
                <textarea
                  rows={2}
                  value={formData.validation_json}
                  onChange={(e) => setFormData({ ...formData, validation_json: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold shadow-2xs">保存模板设置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
