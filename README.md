# 油库资产数据采集与管理系统 - 前端控制台 (Web Console)

![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/Language-TypeScript_5-3178C6.svg?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Build_Tool-Vite_6-646CFF.svg?style=for-the-badge&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS_3-06B6D4.svg?style=for-the-badge&logo=tailwindcss)
![License](https://img.shields.io/badge/License-Proprietary-red.svg?style=for-the-badge)

本仓库为 **油库资产数据采集与管理系统** 的现代化 Web 控制台前端项目，基于 **React 18**、**TypeScript**、**Vite 6** 与 **TailwindCSS** 打造，提供 19 个独立且完整的功能视图模块，涵盖临时库校验、外接库对接比对、数据维护排重纠错、单级审核工作流、真实二维码生成与离线打印、以及多单位权限隔离。

---

## 核心视觉与交互特色

- **极致工业玻璃拟物美学 (Modern Industrial Glassmorphism)**：采用极简高对比度调色盘、毛玻璃背景模糊、平滑过渡动画与统一设计 Token。
- **真实 ISO/IEC 18004 二维码与铭牌排版引擎**：基于 `qrcode` 库在前端实时生成 100% 可扫码 ISO 标准二维码，支持 Ex 工业防爆铭牌与 JD 模式切换，完美适配 `@media print` 高清标签打印。
- **可视化统计大屏看板**：内置 ECharts 图表，实时呈现油库设备资产统计、自动编码率、分类占比与资产运行状态分布。
- **实时 Excel 导入与解析引擎**：集成 `xlsx` 库，支持批量导入资产文件、字段匹配与全量导出。
- **持久化 Session 机制 (`localStorage`)**：登录凭证自动加密留存，F5 刷新页面无感保持当前操作上下文与单位隔离。
- **扩展属性与编码规则引擎 Modal**：前端与后端属性模板同步，支持自定义设计容量、油品/介质类型等扩展字段编辑。

---

## 19 大核心功能视图模块

1. **数据检查 (临时库)**：支持拖拽上传真实 Excel 数据包，自动检测格式与权属代码并导出问题清单。
2. **数据接收 (外接库)**：模拟接收上级 JD 资产系统推送及 APP 现场采集设备增量同步。
3. **外接库资产入库**：外接数据与正式库横/纵向比对（变动高亮），支持勾选批量入库。
4. **数据维护 (排重纠错)**：全量资产表单、一键规则生成编号、重复/异常标红高亮与逻辑删除。
5. **单级审核管理**：草稿 -> 待审核 -> 通过/退回状态机流转与审计历史记录追踪。
6. **数据查询统计**：组合关键字、分类、使用状态高级检索与 Excel 导出。
7. **数据导出与接口**：资产数据包 JSON 格式导出与在线 REST API 测试控制台。
8. **单位管理**：油库从属关系树、电话检索、多套单位代码映射 (`mappings`) 绑定。
9. **场所管理**：油库内部场所从属树、安全阻断防护式删除（若存在依赖资产则拦截）。
10. **扩展属性配置**：按设备分类配置必填/类型/值域，与后端 `save_asset` Handler 强制校验联动。
11. **编码规则**：规则前缀一键测试生成、规则列表导出。
12. **数据字典**：字典类型、标签、键值 CRUD 维护。
13. **标签标牌 (二维码)**：真实 ISO/IEC 18004 扫码标贴，支持高清缩放预览与打印排版。
14. **统计大屏看板**：资产总数、编码率、直方图、饼图、折线图可视化呈现。
15. **移动终端管理**：防爆手持终端备案与单位绑定。
16. **用户管理**：系统账号 CRUD、真实密码展示、单位代码隔离。
17. **系统日志审计**：日志检索、按条删除、一键高危清空与 Excel 导出。
18. **App 移动采集端引擎**：3D 色彩码生成与识别解包模拟。
19. **系统登录页面**：真实 SQLite 数据库账号密码鉴权登录。

---

## 技术栈与依赖库

| 依赖库 (Package) | 版本 | 说明 |
| :--- | :--- | :--- |
| **`react` / `react-dom`** | `^18.3.1` | 前端UI核心框架 |
| **`typescript`** | `^5.6.3` | 全局类型安全保障 |
| **`vite`** | `^6.2.0` | 极速前端构建工具 |
| **`lucide-react`** | `^0.475.0` | 现代 Icon 图标库 |
| **`echarts`** | `^5.6.0` | 工业级可视化图表渲染 |
| **`qrcode`** | `^1.5.4` | 规范二维码 DataURL 渲染 |
| **`xlsx`** | `^0.18.5` | 电子表格解析与生成工具 |

---

## 项目结构说明

```text
web/
├── public/
│   ├── logo.png          # 系统专属 Logo (包含浏览器 Tab Favicon)
│   └── favicon.png       # 页面图标
├── src/
│   ├── main.tsx          # 前端应用入口
│   ├── App.tsx           # 主框架路由、全局 Session、Toast 提示管理
│   ├── index.css         # TailwindCSS 指令与全局设计 Token
│   ├── types/            # TypeScript 全局接口与数据结构定义
│   ├── services/
│   │   └── api.ts        # REST API 异步 Fetch 服务封装
│   └── components/
│       ├── Header.tsx    # 系统顶部导航栏 (包含用户 Profile 与数据刷新)
│       ├── Sidebar.tsx   # 侧边栏 19 大模块无障碍导航
│       └── views/        # 19 个独立视图组件
│           ├── DataInspectionView.tsx
│           ├── QrCodeLabelsView.tsx
│           ├── DataMaintenanceView.tsx
│           ├── AnalyticsDashboardView.tsx
│           ├── UserManagementView.tsx
│           └── ... (全量 19 个视图组件)
├── package.json          # 项目依赖与运行脚本
└── vite.config.ts        # Vite 开发服务器与代理配置
```

---

## 本地开发与构建

### 1. 安装依赖
```bash
cd web
npm install
```

### 2. 启动开发服务器
```bash
# 默认服务启动在 http://localhost:5173
npm run dev
```

### 3. 生产环境构建
```bash
# 执行 TypeScript 校验与 Vite 生产打包
npm run build
```

构建完成后，编译产物将存放在 `dist/` 目录中。

---

## 默认测试登录账号

- **账号**：`admin`
- **密码**：`admin123`
- **显示昵称**：`arch1`

---

## 版权与许可声明 (Proprietary)

本项目为 **私有专有软件 (Proprietary Software)**，不采用开源协议。未经版权所有者书面授权，禁止任何形式的商业分发、公开复制代码或二次开源。
