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

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule, currentUser }) => {
  const isSuperAdmin = currentUser?.role.includes('超级管理员');

  const dataModules = [
    { id: 'inspection' as ModuleId, label: '数据检查(临时库)', icon: FileCheck },
    { id: 'receive' as ModuleId, label: '数据接收(外接库)', icon: Download },
    { id: 'compare' as ModuleId, label: '外接库资产入库', icon: GitCompare },
    { id: 'maintenance' as ModuleId, label: '数据维护(排重纠错)', icon: Database },
    { id: 'audit_workflow' as ModuleId, label: '单级审核管理', icon: ShieldCheck },
    { id: 'query' as ModuleId, label: '数据查询统计', icon: Search },
    { id: 'export' as ModuleId, label: '数据导出与接口', icon: FileSpreadsheet },
  ];

  const systemModules = [
    { id: 'unit' as ModuleId, label: '单位管理', icon: Building2, adminOnly: true },
    { id: 'location' as ModuleId, label: '场所管理', icon: MapPin },
    { id: 'field_template' as ModuleId, label: '扩展属性配置', icon: Sliders },
    { id: 'rules' as ModuleId, label: '编码规则', icon: Barcode },
    { id: 'dict' as ModuleId, label: '数据字典', icon: BookOpen },
    { id: 'qrcode' as ModuleId, label: '标签标牌(二维码)', icon: QrCode },
    { id: 'analytics' as ModuleId, label: '统计大屏看板', icon: BarChart3 },
    { id: 'terminal' as ModuleId, label: '移动终端管理', icon: Smartphone },
    { id: 'user' as ModuleId, label: '用户管理', icon: Users, adminOnly: true },
    { id: 'log' as ModuleId, label: '系统日志审计', icon: FileText },
    { id: 'app_mobile' as ModuleId, label: 'App 移动采集端引擎', icon: Smartphone },
  ];

  return (
    <aside className="w-64 bg-white/90 backdrop-blur-md border-r border-slate-200/80 flex flex-col justify-between select-none">
      <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        {/* Data Management Section */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-2 flex items-center justify-between">
            <span>数据管理模块</span>
          </div>
          <nav className="space-y-0.5">
            {dataModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5 text-cyan-400' : 'opacity-0'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Management Section */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-2 flex items-center justify-between">
            <span>系统管理模块</span>
          </div>
          <nav className="space-y-0.5">
            {systemModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5 text-teal-400' : 'opacity-0'}`} />
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};
