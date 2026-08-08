import React from 'react';
import {
  FileCheck,
  Download,
  GitCompare,
  Database,
  Search,
  FileSpreadsheet,
  Building2,
  MapPin,
  Barcode,
  BookOpen,
  QrCode,
  BarChart3,
  Smartphone,
  Users,
  FileText,
  Sliders,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export type ModuleId =
  | 'inspection'
  | 'receive'
  | 'compare'
  | 'maintenance'
  | 'query'
  | 'export'
  | 'unit'
  | 'location'
  | 'category'
  | 'field_template'
  | 'audit_workflow'
  | 'rules'
  | 'dict'
  | 'qrcode'
  | 'analytics'
  | 'terminal'
  | 'user'
  | 'log'
  | 'app_mobile';

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  currentUser?: {
    username: string;
    name: string;
    unit_code: string;
    unit_name: string;
    role: string;
  } | null;
}

export const hasModulePermission = (
  userOrRole?: string | { role?: string; permissions?: string } | null,
  moduleId?: ModuleId
): boolean => {
  if (!moduleId) return true;
  
  let role = '';
  let permissions: string | undefined = undefined;

  if (typeof userOrRole === 'string') {
    role = userOrRole;
  } else if (userOrRole) {
    role = userOrRole.role || '';
    permissions = userOrRole.permissions;
  }

  // 1. Explicit per-account module permissions take 100% priority over role defaults
  if (permissions !== undefined && permissions !== null && permissions !== '') {
    if (permissions === '*') return true;
    try {
      const allowedList: string[] = JSON.parse(permissions);
      if (Array.isArray(allowedList)) {
        return allowedList.includes(moduleId as string);
      }
    } catch (e) {
      // Ignore JSON parse error and fallback
    }
  }

  // 2. Fallback to role-based defaults only if permissions is not explicitly set
  if (role.includes('超级管理员')) return true;

  if (role.includes('防爆') || role.includes('安全')) {
    return ['query', 'audit_workflow', 'location', 'category', 'analytics', 'terminal', 'log', 'app_mobile'].includes(moduleId as string);
  }
  
  if (role.includes('计量') || role.includes('工程师')) {
    return ['inspection', 'receive', 'compare', 'maintenance', 'audit_workflow', 'query', 'export', 'location', 'category', 'field_template', 'rules', 'dict', 'qrcode', 'analytics', 'log', 'app_mobile'].includes(moduleId as string);
  }

  if (role.includes('采集员')) {
    return ['maintenance', 'query', 'qrcode', 'app_mobile'].includes(moduleId as string);
  }

  return !['unit', 'user'].includes(moduleId as string);
};

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule, currentUser }) => {
  const userRole = currentUser?.role || '超级管理员';

  const dataModules = [
    { id: 'inspection' as ModuleId, label: '数据检查 (临时库)', icon: FileCheck },
    { id: 'receive' as ModuleId, label: '数据接收 (外接库)', icon: Download },
    { id: 'compare' as ModuleId, label: '外接库资产入库', icon: GitCompare },
    { id: 'maintenance' as ModuleId, label: '数据维护 (排重纠错)', icon: Database },
    { id: 'audit_workflow' as ModuleId, label: '单级审核管理', icon: ShieldCheck },
    { id: 'query' as ModuleId, label: '数据查询统计', icon: Search },
    { id: 'export' as ModuleId, label: '数据导出与接口', icon: FileSpreadsheet },
  ].filter(m => hasModulePermission(userRole, m.id));

  const systemModules = [
    { id: 'unit' as ModuleId, label: '单位隔离管理', icon: Building2 },
    { id: 'location' as ModuleId, label: '场所与防爆区管理', icon: MapPin },
    { id: 'category' as ModuleId, label: '资产分类树管理', icon: Sliders },
    { id: 'field_template' as ModuleId, label: '扩展属性配置', icon: Sliders },
    { id: 'rules' as ModuleId, label: '编码规则', icon: Barcode },
    { id: 'dict' as ModuleId, label: '数据字典', icon: BookOpen },
    { id: 'qrcode' as ModuleId, label: '标签标牌 (二维码)', icon: QrCode },
    { id: 'analytics' as ModuleId, label: '统计大屏看板', icon: BarChart3 },
    { id: 'terminal' as ModuleId, label: '移动终端管理', icon: Smartphone },
    { id: 'user' as ModuleId, label: '用户与角色管理', icon: Users },
    { id: 'log' as ModuleId, label: '系统日志审计', icon: FileText },
    { id: 'app_mobile' as ModuleId, label: 'App 移动采集端引擎', icon: Smartphone },
  ].filter(m => hasModulePermission(userRole, m.id));


  return (
    <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/70 flex flex-col justify-between select-none shadow-xs">
      <div className="p-3.5 space-y-5 overflow-y-auto max-h-[calc(100vh-4rem)] custom-scrollbar">
        {/* Data Management Section */}
        <div>
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 px-3 flex items-center justify-between">
            <span>核心数据业务</span>
          </div>
          <nav className="space-y-1">
            {dataModules
              .filter((item) => hasModulePermission(currentUser, item.id))
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectModule(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-slate-900 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-700'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5 text-cyan-400' : 'opacity-0 group-hover:opacity-40'}`} />
                  </button>
                );
              })}
          </nav>
        </div>

        {/* System Management Section */}
        <div>
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 px-3 flex items-center justify-between">
            <span>系统与配置引擎</span>
          </div>
          <nav className="space-y-1">
            {systemModules
              .filter((item) => hasModulePermission(currentUser, item.id))
              .map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5 text-blue-400' : 'opacity-0 group-hover:opacity-40'}`} />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Profile Info Card */}
      <div className="p-3 border-t border-slate-200/70 bg-slate-50/60 backdrop-blur-md">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">{currentUser?.name || '管理员'}</span>
            <span className="px-1.5 py-0.5 bg-slate-900 text-cyan-300 font-mono font-bold rounded text-[10px]">
              {currentUser?.unit_code || 'UNIT-001'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 truncate font-medium">
            {currentUser?.role || '超级管理员'}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>隔离环境运行中</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
