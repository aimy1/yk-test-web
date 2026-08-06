import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Search, ShieldCheck, Tag } from 'lucide-react';
import { api } from '../../services/api';
import { LocationItem } from '../../types';

export const LocationManagementView: React.FC = () => {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<LocationItem>({
    id: '',
    name: '',
    code: '',
    location_type: '罐区场所',
    parent_id: '',
    unit_code: 'UNIT-001',
    area_json: '{}',
  });

  const loadLocs = async () => {
    try {
      const data = await api.getLocations();
      setLocations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLocs();
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.code) return alert('请填写场所名称和编码');
    try {
      const id = formData.id || `LOC-${Date.now().toString().slice(-4)}`;
      await api.saveLocation({ ...formData, id });
      alert('场所维护成功！已建立油库内部场所从属关系。');
      setShowModal(false);
      loadLocs();
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.deleteLocation(id);
      if (res.status === 'error') {
        alert(res.message);
      } else {
        alert('安全验证通过，逻辑删除成功！');
        loadLocs();
      }
    } catch (err) {
      alert('删除失败');
    }
  };

  const filtered = locations.filter(l => l.name.includes(searchTerm) || l.code.includes(searchTerm) || l.location_type.includes(searchTerm));

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            场所管理 (内部场所从属关系与安全检测)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            管理油库内部场所信息，建立油库内部场所间从属关系；提供新增、修改、查询检索与无关联关系场所逻辑删除。
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ id: '', name: '', code: `LOC-AREA-${locations.length + 1}`, location_type: '罐区场所', parent_id: '', unit_code: 'UNIT-001', area_json: '{}' });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          新增油库场所
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="检索场所名称、类型、编码..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-slate-800 focus:outline-none w-full font-mono"
        />
      </div>

      {/* Locations Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold">场所编码</th>
              <th className="p-3.5 font-semibold">场所名称</th>
              <th className="p-3.5 font-semibold">场所类型</th>
              <th className="p-3.5 font-semibold">从属单位代码</th>
              <th className="p-3.5 font-semibold">关联设备安全删除检测</th>
              <th className="p-3.5 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {filtered.map(l => (
              <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-bold text-blue-600">{l.code}</td>
                <td className="p-3.5 font-sans font-bold text-slate-900">{l.name}</td>
                <td className="p-3.5 font-sans">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    <Tag className="w-3 h-3 inline mr-1" /> {l.location_type}
                  </span>
                </td>
                <td className="p-3.5 text-slate-500">{l.unit_code}</td>
                <td className="p-3.5 font-sans">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                    <ShieldCheck className="w-3 h-3 inline mr-1" /> 关联保护中
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-2">
                  <button
                    onClick={() => { setFormData(l); setShowModal(true); }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[11px]"
                  >
                    <Edit className="w-3 h-3 inline mr-1 text-blue-600" /> 修改
                  </button>
                  <button
                    onClick={() => handleDelete(l.id)}
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
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">维护油库场所信息</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">场所编码</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">场所名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">场所类型</label>
                <select
                  value={formData.location_type}
                  onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="罐区场所">罐区场所</option>
                  <option value="泵房场所">泵房场所</option>
                  <option value="发油控制台">发油控制台</option>
                  <option value="计量间">计量间</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs">保存场所</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
