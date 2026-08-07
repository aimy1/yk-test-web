# 油库资产数据采集与管理系统 - PC 管理 Web 端 (yk-test-web)

本项目是油库资产数据采集与管理系统的 PC 端 Web 管理控制台，基于 **React 18**、**TypeScript**、**Vite 6** 与 **Tailwind CSS** 构建。系统提供 11 大核心功能模块，涵盖资产全生命周期维护、异构 Excel 导入清洗、数据质量核查大盘、3D 彩码可视化渲染与打印导出、编码规则配置、单位隔离与审计日志。

---

## 技术栈与依赖

- **前端框架**: React 18 (`react`, `react-dom`)
- **开发语言**: TypeScript 5
- **构建工具**: Vite 6 (支持极速 HMR 模块热替换)
- **样式与布局**: Tailwind CSS + Vanilla CSS Token 设计系统
- **图表组件**: ECharts 5 (渲染编码进度、合规率与类型占比直方图/饼图)
- **数据工具**: SheetJS (`xlsx`) 解析与导出 Excel 电子表格；`qrcode` 渲染 ISO/IEC 18004 矢量二维码

---

## 11 大核心功能视图模块

1. **资产全生命周期维护 (`DataMaintenanceView`)**:
   - 资产列表多维度筛选（关键字搜索、设备分类过滤、运行状态筛选、单位隔离切换）。
   - 交互式列头排序：点击属性列标头直接触发正序/倒序排列。
   - 资产新增与编辑 Modal 弹窗，支持 `unit_code` 校验与在线提交。
2. **分类与扩展属性管理 (`CategoryManagementView`)**:
   - 维护资产大类、中类、小类树。
   - 配置小类专属的扩展属性校验模板（如油罐容量、泵体扬程）。
3. **外部数据清洗与导入 (`DataInspectionView`)**:
   - 上传外部 Excel (.xlsx) / JSON 资产数据包。
   - 智能列名模糊匹配算法（兼容“设备名称/资产名称”、“设备编号/资产编号”等多种名称）。
   - 异常数据标注：对重复编号标记 `is_duplicate = true` 标红警告，对属性缺失标记 `has_error = true` 标黄提示。
   - 勾选记录确认修改后，通过后端数据库事务提交入库。
4. **数据质量核查与报告 (`QualityCheckView`)**:
   - 运行全库质量扫描引擎，评估资产完整性、唯一性与规范性。
   - 生成数据质量诊断分析大盘。
5. **3D 彩码与电子标签管理 (`ColorCodeView`)**:
   - 在线可视化渲染 8x8 四色阵列三维彩码。
   - 模拟摄像头取景解码与 Payload 逆向解析。
   - 矢量图导出与标签打印预览。
6. **数据导出与上级 API 接入 (`DataExportApiView`)**:
   - 一键打包导出 YOUK_ASSET_PACKAGE 标准格式数据包。
   - 上级系统（网格化平台/JD 管理系统）Push / Pull 数据对接测试控制台。
7. **单位隔离与权限管控 (`UnitIsolationView`)**:
   - 多油库单位树形架构管理（第一储运发油库区、第二管道输油车间等）。
   - 用户角色与单位归属强绑定，防止跨单位越权修改。
8. **操作审计与事件穿透 (`AuditLogView`)**:
   - 全量操作审计日志穿透查看。
   - 支持按操作人、操作动作（登录、采集、同步、导入）及 IP 地址筛选检索。
9. **系统综合控制大盘 (`DashboardView`)**:
   - 油库资产总量、在线设备数、待审核草稿数与数据合规率 KPI 卡片。
10. **移动端同步与冲突处理 (`MobileSyncView`)**:
    - 监控 PDA 暂存上传的草稿队列。
    - 解决离线草稿与云端数据冲突。
11. **系统设置与服务监控 (`SystemSettingsView`)**:
    - 数据库物理备份日志与后端 REST API 3001 端口健康监测。

---

## 项目目录结构说明

```text
src/
├── App.tsx                   # 应用主入口、路由切换与全局 State
├── main.tsx                  # React 挂载点
├── index.css                 # 全局样式与 Tailwind CSS 指令
├── components/
│   ├── Header.tsx            # 系统顶部导航栏 (账号切换与网络状态)
│   ├── Sidebar.tsx           # 侧边栏 11 大功能视图导航
│   └── views/                # 11 个业务视图组件
│       ├── DataMaintenanceView.tsx   # 资产全生命周期维护
│       ├── DataInspectionView.tsx    # 外部 Excel 导入与清洗
│       ├── CategoryManagementView.tsx# 分类与扩展属性模板
│       ├── ColorCodeView.tsx         # 3D 彩码与标签打印
│       ├── DataExportApiView.tsx     # 数据导出与上级 API
│       ├── UnitIsolationView.tsx     # 单位隔离与权限管理
│       ├── AuditLogView.tsx          # 系统操作审计日志
│       └── ...
└── services/
    └── api.ts                # REST API 通信模块 (对齐 3001 端口)
```

---

## 本地开发与运行指南

### 1. 安装依赖
需确保已安装 Node.js (v18+) 与 npm：
```bash
# 进入前端 Web 目录
cd yk-test-web-main

# 安装依赖项
npm install
```

### 2. 启动开发服务器
```bash
# 启动 Vite 开发服务器 (默认端口 5173)
npm run dev
```
打开浏览器访问 `http://localhost:5173` 即可进入 PC 管理控制台。

### 3. 构建生产打包产物
```bash
# 构建 release 静态资源包
npm run build
```
构建产物输出至 `dist/` 目录，可直接交由 Nginx 托管。
