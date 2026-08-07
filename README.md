# 油库资产数据采集系统 - PC 端 Web 管理控制台 (yk-test-web)

![React](https://img.shields.io/badge/Frontend-React_18-61DAFB)
![TypeScript](https://img.shields.io/badge/Language-TypeScript_5-3178C6)
![Vite](https://img.shields.io/badge/Build-Vite_6-646CFF)
![Tailwind](https://img.shields.io/badge/Style-Tailwind_CSS_3-06B6D4)
![ECharts](https://img.shields.io/badge/Charts-ECharts_5-AA0000)

PC 端 Web 管理控制台，使用 React 18 + TypeScript + Vite + Tailwind CSS 构建。

---

## 页面模块 (11 个视图)

- **`DataMaintenanceView` (数据维护)**: 资产增删改查、多维搜索筛选、点击列头动态排序。
- **`DataInspectionView` (数据检查与导入)**: 外部 Excel/JSON 数据导入，智能匹配列头，重复项 (`is_duplicate`) 和错项 (`has_error`) 高亮标识，确认后提交入库。
- **`CategoryManagementView` (分类与模板)**: 设备分类树管理，为分类配置扩展属性模板。
- **`QualityCheckView` (数据质量核查)**: 检查全库数据完整性与合规率。
- **`ColorCodeView` (3D 彩码与标签)**: 8x8 三维彩码在线生成与解包，生成二维码和防爆铭牌并支持打印。
- **`DataExportApiView` (数据导出与接口)**: 导出 YOUK 资产包及接口测试。
- **`UnitIsolationView` (单位管理)**: 维护油库单位树与代码映射。
- **`AuditLogView` (日志审计)**: 查看与导出系统操作日志。
- **`AnalyticsDashboardView` (统计大屏)**: 显示资产总量、编码进度及设备状态分布图表。
- **`MobileSyncView` (移动端同步)**: 查看 PDA 离线草稿箱并处理同步冲突。
- **`SystemSettingsView` (系统设置)**: 数据库备份日志与服务状态监测。

---

## 关键技术

- **React 18 + TypeScript**: 类型安全的前端开发。
- **Vite 6**: 快速构建与开发代理。
- **SheetJS (xlsx)**: 解析和生成 Excel 电子表格。
- **ECharts 5**: 绘制统计图表。
- **qrcode**: 渲染二维码。

---

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务 (默认 http://localhost:5173)
npm run dev

# 构建打包
npm run build
```
打包产物位于 `dist/` 目录。
