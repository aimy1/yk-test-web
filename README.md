# 油库资产数据采集与管理系统 — PC 管理控制台 (yk-test-web)

<p align="left">
  <img src="https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?style=for-the-badge&logo=react" alt="React 18"/>
  <img src="https://img.shields.io/badge/Language-TypeScript_5-3178C6.svg?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Build-Vite_6-646CFF.svg?style=for-the-badge&logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/Style-Tailwind_CSS_3-06B6D4.svg?style=for-the-badge&logo=tailwindcss" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Charts-ECharts_5-AA0000.svg?style=for-the-badge&logo=apacheecharts" alt="ECharts"/>
</p>

---

## 概述与视觉设计语言

本前端控制台是油库资产全生命周期数据清洗、质量诊断与编目管理的桌面级 Web 控制台。系统基于 **React 18**、**TypeScript** 与 **Vite 6** 打造，整体采用工业极简高对比度美学架构，融入毛玻璃拟物 Token 与平滑动画，配合 ECharts 5 工业级数据图表引擎，为管理员提供高效、精准、直观的数据治理体验。

---

## 核心功能组件划分 (11 大模块)

```text
src/components/views/
├── DataMaintenanceView.tsx    # 资产全生命周期维护 (多维过滤 / 列头交互式动态正逆序排列 / Modal 编辑)
├── DataInspectionView.tsx     # 异构 Excel 导入清洗 (getKey 列匹配 / 重复项与缺失格式高亮标记)
├── CategoryManagementView.tsx # 编目分类树与拓展属性校验模板引擎
├── QualityCheckView.tsx       # 全库质量扫描引擎与诊断报告
├── ColorCodeView.tsx          # 8x8 三维彩码在线渲染 / 摄像头解包 / 工业铭牌打印预览
├── DataExportApiView.tsx      # 标准 YOUK 资产包导出与上级 API Push/Pull 联调控制台
├── UnitIsolationView.tsx      # 单位多租户树形管理与代码映射 (mappings)
├── AuditLogView.tsx           # 全量操作审计日志穿透式查询与导出
├── AnalyticsDashboardView.tsx # 系统 KPI 资产总量 / 编码进度 / 状态占比诊断看板
├── MobileSyncView.tsx         # PDA 离线草稿同步监控与冲突处理
└── SystemSettingsView.tsx     # 数据库备份日志与 REST API 服务健康度监控
```

---

## 技术亮点与工程实践

1. **异构 Excel `getKey` 列头清洗算法**:
   内置列头智能模糊匹配规则，兼容外部导入 Excel 中“设备名称/资产名称”、“设备编号/资产编号”等多样字段；自动计算重复项标记 `is_duplicate` 与缺少校验项 `has_error`。
2. **交互式列头动态排序**:
   告别固定静态表格，点击标头实时触发内存级/后端级多维正逆序排列。
3. **ISO/IEC 18004 矢量标牌与打印排版**:
   基于 `qrcode` 渲染生成工业防爆铭牌 (Ex) 与 JD 标牌矢量图，针对 `@media print` 针对性优化打印输出布局。

---

## 本地开发与构建指南

### 1. 安装依赖
```bash
cd yk-test-web-main
npm install
```

### 2. 启动开发服务
```bash
npm run dev
# 访问 http://localhost:5173
```

### 3. 构建发布产物
```bash
npm run build
# 产物输出至 ./dist/
```
