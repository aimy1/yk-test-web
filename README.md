# 油库资产数据采集系统 - PC 端 Web 管理控制台 (yk-test-web)

![React](https://img.shields.io/badge/Frontend-React_18-61DAFB)
![TypeScript](https://img.shields.io/badge/Language-TypeScript_5-3178C6)
![Vite](https://img.shields.io/badge/Build-Vite_6-646CFF)
![Tailwind](https://img.shields.io/badge/Style-Tailwind_CSS_3-06B6D4)
![ECharts](https://img.shields.io/badge/Charts-ECharts_5-AA0000)

`yk-test-web` 是油库资产数据采集与管理系统的 PC 端 Web 数据治理控制台。基于 **React 18**、**TypeScript**、**Vite 6** 与 **Tailwind CSS** 构建，采用工业极简高对比度美学架构，结合 ECharts 5 图表引擎，为管理员提供资产维护、异构 Excel 数据导入清洗、质量核查、3D 彩码生成与矢量标牌打印功能。

---

## 11 大核心功能视图模块

1. **`DataMaintenanceView` (资产维护)**: 资产全生命周期增删改查、多维条件筛选、点击列头交互式正逆序动态排序。
2. **`DataInspectionView` (数据检查与导入)**: 外部异构 Excel/JSON 数据解析，智能匹配列名，重复项 (`is_duplicate`) 与缺失格式 (`has_error`) 标色彩提示，勾选后提交后端事务入库。
3. **`CategoryManagementView` (分类与扩展模板)**: 资产大/中/小类树形管理，为设备小类配置专属扩展属性模板。
4. **`QualityCheckView` (数据质量核查)**: 评估全库数据的完整性、唯一性与规范性，输出质量诊断报告。
5. **`ColorCodeView` (3D 彩码与电子标签)**: 在线渲染 8x8 四色阵列三维彩码与符合 ISO/IEC 18004 规范的矢量二维码标牌，支持工业热敏打印。
6. **`DataExportApiView` (数据导出与 API 联调)**: 导出 YOUK 标准资产包与上级 API (Push/Pull) 联调测试控制台。
7. **`UnitIsolationView` (单位隔离管理)**: 多油库单位树形架构维护与多套代码映射 (`mappings`) 管理。
8. **`AuditLogView` (日志审计)**: 穿透式查询登录与操作审计日志，支持过滤导出。
9. **`AnalyticsDashboardView` (统计大屏)**: 可视化呈现油库资产总量、编码进度及运行状态分布。
10. **`MobileSyncView` (移动端同步)**: 查看 PDA 暂存的离线草稿队列并处理同步冲突。
11. **`SystemSettingsView` (系统设置)**: 数据库备份日志与 REST API 3001 端口服务健康度检测。

---

## 工程目录结构

```text
src/
├── App.tsx                   # 应用主入口、路由与全局状态
├── index.css                 # 全局设计 Token 与 Tailwind CSS 指令
├── components/
│   ├── Header.tsx            # 系统顶部导航栏
│   ├── Sidebar.tsx           # 侧边栏 11 大模块无障碍导航
│   └── views/                # 11 个独立业务视图组件
└── services/
    └── api.ts                # REST API 异步 Fetch 服务
```

---

## 开发与构建指南

### 1. 安装依赖
```bash
npm install
```

### 2. 本地开发
```bash
npm run dev
# 开发服务运行于 http://localhost:5173
```

### 3. 编译打包
```bash
npm run build
# 静态资源输出至 dist/ 目录
```
