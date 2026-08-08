import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Smartphone, ShieldCheck, Download, Lock, KeyRound, CheckSquare, Square } from 'lucide-react';
import { api } from '../../services/api';
import { SystemUser } from '../../types';
import { Pagination } from '../common/Pagination';
import * as XLSX from 'xlsx';

const ALL_MODULES = [
  { id: 'inspection', name: '数据检查(临时库)' },
  { id: 'receive', name: '数据接收(外接库)' },
  { id: 'compare', name: '外接库资产入库' },
  { id: 'maintenance', name: '数据维护(排重纠错)' },
  { id: 'audit_workflow', name: '单级审核管理' },
  { id: 'query', name: '数据查询统计' },
  { id: 'export', name: '数据导出与接口' },
  { id: 'unit', name: '单位管理' },
  { id: 'location', name: '场所与防爆区' },
  { id: 'category', name: '资产分类树' },
  { id: 'field_template', name: '扩展属性模板' },
  { id: 'rules', name: '编码规则引擎' },
  { id: 'dict', name: '数据字典' },
  { id: 'qrcode', name: '标签标牌' },
  { id: 'terminal', name: '移动终端管理' },
  { id: 'user', name: '用户管理' },
  { id: 'log', name: '系统日志审计' },
  { id: 'app_mobile', name: '移动防爆App' },
];

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [formData, setFormData] = useState<SystemUser>({
    id: '',
    username: '',
    password: '',
    name: '',
    unit_code: 'UNIT-001',
    role: '油库计量工程师',
    title: '计量班长',
    phone: '',
    allow_app_login: true,
    permissions: '*',
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
      const perms = formData.permissions || '*';
      await api.saveUser({ ...formData, id, password: pass, permissions: perms });

      // If updating currently logged-in user, update localStorage session and dispatch window event
      try {
        const savedSession = localStorage.getItem('youk_user_session');
        if (savedSession) {
          const sessUser = JSON.parse(savedSession);
          if (sessUser.username === formData.username) {
            sessUser.permissions = perms;
            sessUser.role = formData.role;
            localStorage.setItem('youk_user_session', JSON.stringify(sessUser));
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (e) {}

      alert('用户信息及模块访问权限保存成功！已同步存入数据库。');
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
    const newPass = prompt(`请输入用户 [${user.username}] 的新登录密码:`, 'admin123');
    if (!newPass) return;
    try {
      await api.saveUser({ ...user, password: newPass });
      alert(`用户 [${user.username}] 的密码已重置为 [${newPass}]！`);
      loadUsers();
    } catch (err) {
      alert('重置密码失败');
    }
  };

  const handleExport = () => {
    const data = users.map(u => ({
      '登录账号': u.username,
      '真实姓名': u.name,
      '绑定单位代码': u.unit_code,
      '系统角色': u.role,
      '职务': u.title,
      '联系电话': u.phone,
      '移动端登录许可': u.allow_app_login ? '允许' : '禁止',
      '模块访问权限': u.permissions === '*' ? '全量模块 (*)' : u.permissions,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "系统用户表");
    XLSX.writeFile(wb, "油库系统用户与角色权限表.xlsx");
  };

  const filtered = users.filter(u =>
    u.username.includes(searchTerm) || u.name.includes(searchTerm) || u.role.includes(searchTerm) || u.unit_code.includes(searchTerm)
  );

  const getModuleCountBadge = (perms?: string) => {
    if (!perms || perms === '*') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
          全量模块 (*)
        </span>
      );
    }
    try {
      const list = JSON.parse(perms);
      if (Array.isArray(list)) {
        return (
          <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-semibold">
            受控 ({list.length} 个模块)
          </span>
        );
      }
    } catch (e) {
      // Fallback
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
        全量模块 (*)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            用户与角色管理 (账号配置与模块访问授权)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            用户绑定归属单位（数据隔离控制）；配置姓名、角色、职务、联系电话；细粒度配置每个账号可访问的模块权限；支持密码重置与控制手机端登录。
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
              setFormData({
                id: '',
                username: `user_${Math.floor(Math.random() * 900 + 100)}`,
                password: 'user123',
                name: '',
                unit_code: 'UNIT-001',
                role: '油库计量工程师',
                title: '计量班员',
                phone: '13800138000',
                allow_app_login: true,
                permissions: '*',
              });
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            新建用户账号
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-2">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="按用户名、真实姓名、角色、单位代码检索用户..."
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
              <th className="p-3.5 font-semibold">绑定单位 (隔离)</th>
              <th className="p-3.5 font-semibold">系统角色</th>
              <th className="p-3.5 font-semibold">模块访问权限</th>
              <th className="p-3.5 font-semibold">联系电话</th>
              <th className="p-3.5 font-semibold">APP 登录</th>
              <th className="p-3.5 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-bold text-blue-600">{u.username}</td>
                <td className="p-3.5 font-sans font-bold text-slate-900">{u.name}</td>
                <td className="p-3.5 font-sans">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200 text-[11px]">
                    <ShieldCheck className="w-3 h-3 inline mr-1 text-blue-600" /> {u.unit_code}
                  </span>
                </td>
                <td className="p-3.5 font-sans font-semibold">{u.role}</td>
                <td className="p-3.5 font-sans">{getModuleCountBadge(u.permissions)}</td>
                <td className="p-3.5 text-slate-400">{u.phone}</td>
                <td className="p-3.5 font-sans">
                  {u.allow_app_login ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1 w-fit">
                      <Smartphone className="w-3 h-3" /> 允许移动端
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-medium flex items-center gap-1 w-fit">
                      <Lock className="w-3 h-3 text-slate-400" /> 仅限 PC 端
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-right space-x-1.5">
                  <button onClick={() => handleResetPassword(u)} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 text-[11px] font-medium shadow-2xs">
                    <KeyRound className="w-3 h-3 inline mr-1 text-amber-600" /> 重置密码
                  </button>
                  <button onClick={() => { setFormData(u); setShowModal(true); }} className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-medium shadow-2xs">
                    <Edit className="w-3 h-3 inline mr-1 text-blue-600" /> 权限/编辑
                  </button>
                  <button onClick={() => handleDelete(u)} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] font-medium shadow-2xs">
                    <Trash2 className="w-3 h-3 inline mr-1 text-rose-600" /> 删除
                  </button>
                </td>
              </tr>
            ))}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-xl text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>维护系统用户账号与模块授权</span>
              <span className="text-xs font-mono font-normal text-slate-400">{formData.id ? `ID: ${formData.id}` : '新建用户账号'}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
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
                  placeholder="登录密码（默认: admin123）"
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
                <label className="text-slate-700 block mb-1 font-semibold">绑定单位代码 (数据隔离)</label>
                <select
                  value={formData.unit_code}
                  onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                >
                  <option value="UNIT-ROOT">UNIT-ROOT (国家石油储运集团总公司)</option>
                  <option value="UNIT-001">UNIT-001 (第一储运发油库区)</option>
                  <option value="UNIT-002">UNIT-002 (第二管道输油车间)</option>
                  <option value="UNIT-003">UNIT-003 (西南航空燃料储运中心)</option>
                  <option value="UNIT-004">UNIT-004 (华东沿海成品油中转库)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">系统角色</label>
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
            </div>

            <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
              <input
                type="checkbox"
                id="allow_app"
                checked={formData.allow_app_login}
                onChange={(e) => setFormData({ ...formData, allow_app_login: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="allow_app" className="text-slate-700 font-semibold cursor-pointer">允许登录手机端防爆 APP 进行现场数据采集</label>
            </div>

            {/* Module Access Permission Matrix Section */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-900 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  账号可访问模块权限配置 (18 大功能模块)
                </label>
                <div className="flex space-x-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, permissions: '*' })}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    全选全部模块 (*)
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, permissions: '[]' })}
                    className="text-slate-500 hover:underline font-semibold"
                  >
                    清空选定
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 max-h-48 overflow-y-auto">
                {ALL_MODULES.map((m) => {
                  const isChecked = formData.permissions === '*' || (function() {
                    try {
                      const list = JSON.parse(formData.permissions || '[]');
                      return Array.isArray(list) && list.includes(m.id);
                    } catch(e) {
                      return false;
                    }
                  })();

                  return (
                    <label key={m.id} className={`flex items-center space-x-2 p-2 rounded-lg border text-[11px] cursor-pointer transition-all ${
                      isChecked ? 'bg-blue-50/90 border-blue-300 text-blue-900 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let currentList: string[] = [];
                          if (formData.permissions === '*') {
                            currentList = ALL_MODULES.map(item => item.id);
                          } else {
                            try { currentList = JSON.parse(formData.permissions || '[]'); } catch(err) { currentList = []; }
                          }
                          if (e.target.checked) {
                            if (!currentList.includes(m.id)) currentList.push(m.id);
                          } else {
                            currentList = currentList.filter(id => id !== m.id);
                          }
                          setFormData({ ...formData, permissions: JSON.stringify(currentList) });
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="truncate">{m.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs">保存账号及模块权限</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
