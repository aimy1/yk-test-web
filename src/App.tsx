import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar, ModuleId } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { LoginView } from './components/views/LoginView';
import { DataInspectionView } from './components/views/DataInspectionView';
import { DataReceiveView } from './components/views/DataReceiveView';
import { DataMigrationView } from './components/views/DataMigrationView';
import { DataMaintenanceView } from './components/views/DataMaintenanceView';
import { DataQueryView } from './components/views/DataQueryView';
import { DataExportApiView } from './components/views/DataExportApiView';
import { UnitManagementView } from './components/views/UnitManagementView';
import { LocationManagementView } from './components/views/LocationManagementView';
import { CodeRulesView } from './components/views/CodeRulesView';
import { DataDictView } from './components/views/DataDictView';
import { QrCodeLabelsView } from './components/views/QrCodeLabelsView';
import { AnalyticsDashboardView } from './components/views/AnalyticsDashboardView';
import { TerminalManagementView } from './components/views/TerminalManagementView';
import { UserManagementView } from './components/views/UserManagementView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { CategoryManagementView } from './components/views/CategoryManagementView';
import { FieldTemplateView } from './components/views/FieldTemplateView';
import { AuditWorkflowView } from './components/views/AuditWorkflowView';
import { AppMobileView } from './components/views/AppMobileView';

export interface UserSession {
  username: string;
  name: string;
  unit_code: string;
  unit_name: string;
  role: string;
}

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('youk_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeModule, setActiveModule] = useState<ModuleId>('inspection');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleShowToast = (type: 'success' | 'warning' | 'info' | 'error', title: string, description?: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    handleShowToast('info', '系统刷新', '已成功与后台 REST API 同步最新数据');
  };

  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('youk_user_session', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    handleShowToast('success', '登录成功', `欢迎回来，${user.name}（已自动安全隔离关联单位代码: ${user.unit_code}）`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('youk_user_session');
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveView = () => {
    switch (activeModule) {
      case 'inspection':
        return <DataInspectionView key={refreshKey} />;
      case 'receive':
        return <DataReceiveView key={refreshKey} />;
      case 'compare':
        return <DataMigrationView key={refreshKey} />;
      case 'maintenance':
        return <DataMaintenanceView key={refreshKey} />;
      case 'audit_workflow':
        return <AuditWorkflowView key={refreshKey} />;
      case 'query':
        return <DataQueryView key={refreshKey} />;
      case 'export':
        return <DataExportApiView key={refreshKey} />;
      case 'unit':
        return <UnitManagementView key={refreshKey} />;
      case 'location':
        return <LocationManagementView key={refreshKey} />;
      case 'category':
        return <CategoryManagementView key={refreshKey} />;
      case 'field_template':
        return <FieldTemplateView key={refreshKey} />;

      case 'rules':
        return <CodeRulesView key={refreshKey} />;
      case 'dict':
        return <DataDictView key={refreshKey} />;
      case 'qrcode':
        return <QrCodeLabelsView key={refreshKey} />;
      case 'analytics':
        return <AnalyticsDashboardView key={refreshKey} />;
      case 'terminal':
        return <TerminalManagementView key={refreshKey} />;
      case 'user':
        return <UserManagementView key={refreshKey} />;
      case 'log':
        return <AuditLogsView key={refreshKey} />;
      case 'app_mobile':
        return <AppMobileView key={refreshKey} />;
      default:
        return <DataInspectionView key={refreshKey} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        currentUnit={`${currentUser.unit_code} (${currentUser.unit_name})`}
        onRefresh={handleRefresh}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeModule={activeModule} onSelectModule={setActiveModule} currentUser={currentUser} />

        <main className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-6">{renderActiveView()}</div>
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};

export default App;
