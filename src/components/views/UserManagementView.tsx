import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Smartphone, ShieldCheck, Download, Lock, KeyRound } from 'lucide-react';
import { api } from '../../services/api';
import { SystemUser } from '../../types';
import * as XLSX from 'xlsx';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<SystemUser>({
    id: '',
    username: '',
    password: '',
    name: '',
    unit_code: 'UNIT-001',
    role: '库区操作员',
    title: '资产管理员',
    phone: '',
    allow_app_login: true,
  });

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSave = async () => {
    if (!formData.username || !formData.name) return alert('请填写用户名与姓名');
    try {
      const id = formData.id || `USR-${Date.now().toString().slice(-4)}`;
      const pass = formData.password || 'admin123';
      await api.saveUser({ ...formData, id, password: pass });
      alert('用户信息及密码保存成功！已更新至数据库。');
      setShowModal(false);
      loadUsers();
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleDelete = async (user: SystemUser) => {
    if (confirm(`危险操作：确定要逻辑删除用户账号 [${user.username}] (${user.name}) 吗？`)) {
      try {
        await api.deleteUser(user.id);
        alert(`系统账号 [${user.username}] 已成功逻辑删除！`);
        loadUsers();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const handleResetPassword = async (user: SystemUser) => {
    const newPass = prompt(`重置用户 [${user.username}] (${user.name}) 的密码：`, 'admin123');
    if (!newPass) return;
    try {
      const res = await api.changePassword(user.username, newPass);
      alert(res.message || `用户 [${user.username}] 密码重置成功！`);
      loadUsers();
    } catch (err: any) {
      alert('重置密码失败: ' + (err.message || '系统错误'));
    }
  };

  const handleExport = () => {
    const data = filtered.map(u => ({
      '用户ID': u.id,
      '账号用户名': u.username,
      '真实姓名': u.name,
      '绑定单位代码(隔离级别)': u.unit_code,
      '系统角色': u.role,
      '职务': u.title,
      '联系电话': u.phone,
      '移动端APP登录许可': u.allow_app_login ? '允许' : '禁止',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "系统用户权限管理表");
    XLSX.writeFile(wb, "油库系统用户与单位数据隔离表.xlsx");
  };

  const filtered = users.filter(u => u.username.includes(searchTerm) || u.name.includes(searchTerm) || u.role.includes(searchTerm));

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            用户与账号数据库管理 (真实密码与单位数据隔离)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            管理 SQLite 数据库中的真实系统账号、登录密码、单位绑定代码 (`unit_code`) 及 APP 移动采集登录许可。
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            导出用户列表
          </button>
          <button
            onClick={() => {
              setFormData({ id: '', username: `user_${users.length + 1}`, password: 'user123', name: '', unit_code: 'UNIT-001', role: '油库工程师', title: '设备专员', phone: '13800138000', allow_app_login: true });
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            新建系统用户
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="按用户名、真实姓名、角色等条件检索用户..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-slate-800 focus:outline-none w-full font-mono"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold">登录账号</th>
              <th className="p-3.5 font-semibold">真实姓名</th>
              <th className="p-3.5 font-semibold">绑定单位代码 (数据隔离)</th>
              <th className="p-3.5 font-semibold">系统角色</th>
              <th className="p-3.5 font-semibold">职务</th>
              <th className="p-3.5 font-semibold">联系电话</th>
              <th className="p-3.5 font-semibold">移动端 APP 登录许可</th>
              <th className="p-3.5 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-bold text-blue-600">{u.username}</td>
                <td className="p-3.5 font-sans font-bold text-slate-900">{u.name}</td>
                <td className="p-3.5 font-sans">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200 text-[11px]">
                    <ShieldCheck className="w-3 h-3 inline mr-1 text-blue-600" /> {u.unit_code}
                  </span>
                </td>
                <td className="p-3.5 font-sans font-semibold">{u.role}</td>
                <td className="p-3.5 font-sans text-slate-500">{u.title}</td>
                <td className="p-3.5 text-slate-400">{u.phone}</td>
                <td className="p-3.5 font-sans">
                  {u.allow_app_login ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1 w-fit">
                      <Smartphone className="w-3 h-3" /> 允许移动端登录
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-medium flex items-center gap-1 w-fit">
                      <Lock className="w-3 h-3 text-slate-400" /> 仅限 PC 端登录
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-right space-x-2">
                  <button onClick={() => handleResetPassword(u)} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 text-[11px] font-medium shadow-2xs">
                    <KeyRound className="w-3 h-3 inline mr-1 text-amber-600" /> 重置密码
                  </button>
                  <button onClick={() => { setFormData(u); setShowModal(true); }} className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-medium shadow-2xs">
                    <Edit className="w-3 h-3 inline mr-1 text-blue-600" /> 编辑
                  </button>
                  <button onClick={() => handleDelete(u)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] font-medium shadow-2xs">
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
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">维护系统用户账号与数据库密码</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">登录账号 (Username)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" /> 登录密码 (Password)
                </label>
                <input
                  type="text"
                  value={formData.password || ''}
                  placeholder="请输入登录密码（默认: admin123）"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">用户真实姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">绑定单位代码 (同级数据隔离)</label>
                <select
                  value={formData.unit_code}
                  onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                >
                  <option value="UNIT-001">UNIT-001 (第一储运发油库区)</option>
                  <option value="UNIT-002">UNIT-002 (第二管道输油车间)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">用户角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="超级管理员 (发油库主任)">超级管理员 (发油库主任)</option>
                  <option value="油库计量工程师">油库计量工程师</option>
                  <option value="安全防爆主管">安全防爆主管</option>
                  <option value="资产采集员">资产采集员</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">联系电话</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="allow_app"
                  checked={formData.allow_app_login}
                  onChange={(e) => setFormData({ ...formData, allow_app_login: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="allow_app" className="text-slate-700 font-semibold">允许登录手机端 APP 进行现场数据采集</label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs">保存账号及密码</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
