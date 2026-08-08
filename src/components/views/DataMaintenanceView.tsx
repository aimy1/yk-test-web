import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit, Trash2, ShieldCheck, AlertCircle, Upload, Search, Download, Filter, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Asset } from '../../types';
import { Pagination } from '../common/Pagination';
import * as XLSX from 'xlsx';

export const DataMaintenanceView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DUP' | 'ERR' | 'APPROVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  // Selection & Batch Operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Maintenance Logs Modal
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedAssetForMaint, setSelectedAssetForMaint] = useState<Asset | null>(null);
  const [maintLogs, setMaintLogs] = useState<Array<{ id: string; date: string; type: string; engineer: string; cost: number; details: string }>>([]);
  const [newMaintType, setNewMaintType] = useState('例行检修与防爆测试');
  const [newMaintEngineer, setNewMaintEngineer] = useState('arch1');
  const [newMaintCost, setNewMaintCost] = useState('500');
  const [newMaintDetails, setNewMaintDetails] = useState('完成轴承润滑、防爆接线盒密封胶圈更换及接地电阻测试 (符合 GB3836 标准)');

  const [formData, setFormData] = useState<Partial<Asset>>({
    id: '',
    code: '',
    name: '',
    equipment_no: '',
    gather_no: '',
    plate_code: '',
    asset_name: '',
    category: '输油泵类',
    category_id: 1002,
    unit_code: 'UNIT-001',
    unit_name: '第一储运发油库区',
    location_id: 'LOC-101',
    location_name: 'A区立式拱顶储罐组',
    specification_model: '350m³/h',
    quantity: 1,
    unit_price: 25000,
    status: '在用',
    install_position: '泵房1号基座',
    manufacturer: '沈阳水泵工业集团',
    manager: 'arch1',
    factory_code: 'SY-2024-8890',
    vendor_code: 'VD-88219',
    jd_code: 'JD-ASSET-77812',
    military_asset_code: 'MIL-88219',
    prod_date: '2024-05-15',
    summary: '离心发油主泵，额定流量 350m³/h',
    extend_record_json: '{}',
    is_duplicate: false,
    has_error: false,
    error_msg: undefined,
    audit_status: 2,
    auditor_name: 'arch1',
    audit_opinion: '合格入库',
    audit_time: '2026-08-01',
    sync_status: 'synced',
    source_type: 'pc',
    source: 'PC新增',
  });

  // Diagnostic Workbench Modal
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [analyzeSummary, setAnalyzeSummary] = useState({ total: 0, dups: 0, errs: 0 });

  const loadAssets = async () => {
    try {
      const data = await api.getAssets();
      setAssets(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleRunAnalyze = async () => {
    try {
      await api.analyzeDedupAndErrors();
      const freshData = await api.getAssets();
      setAssets(freshData);
      
      const dups = freshData.filter(a => a.is_duplicate).length;
      const errs = freshData.filter(a => a.has_error).length;
      setAnalyzeSummary({ total: freshData.length, dups, errs });
      setShowAnalyzeModal(true);
    } catch (err) {
      alert('分析操作失败！');
    }
  };

  const handleBatchFixErrors = async () => {
    const errList = assets.filter(a => a.has_error);
    if (errList.length === 0) return alert('当前没有需要纠错修复的异常记录！');

    if (!confirm(`🛠️ 属性纠错修复引擎：确定要为 ${errList.length} 条异常资产自动补全缺省安装位置与合规属性吗？`)) return;

    let fixedCount = 0;
    for (const item of errList) {
      const updated: Partial<Asset> = {
        ...item,
        install_position: item.install_position || '第一发油库区 A 区泵房',
        manufacturer: item.manufacturer || '通用油库设备制造厂',
        has_error: false,
        error_msg: '属性已由纠错引擎自动补全',
      };
      await api.saveAsset(updated);
      fixedCount++;
    }

    alert(`🎉 成功为您自动修复补全 ${fixedCount} 条异常资产属性！`);
    const freshData = await api.getAssets();
    setAssets(freshData);
    setAnalyzeSummary({ total: freshData.length, dups: freshData.filter(a => a.is_duplicate).length, errs: 0 });
  };

  const handleAutoFixDuplicates = async () => {
    const dupList = assets.filter(a => a.is_duplicate);
    if (dupList.length === 0) return alert('当前没有重复标红的资产记录！');
    
    if (!confirm(`🤖 自动重编消错引擎：确定要为 ${dupList.length} 条重复资产重编防重编号并消除重复标记吗？`)) return;

    let fixedCount = 0;
    for (let i = 0; i < dupList.length; i++) {
      const item = dupList[i];
      const newEqNo = `${item.equipment_no || item.code}-R${i + 1}`;
      const updated: Partial<Asset> = {
        ...item,
        equipment_no: newEqNo,
        code: newEqNo,
        is_duplicate: false,
        has_error: false,
        error_msg: '排重引擎已自动纠正重号',
      };
      await api.saveAsset(updated);
      fixedCount++;
    }

    alert(`🎉 成功为您自动批量修正并合流 ${fixedCount} 条重复资产编号！`);
    loadAssets();
  };

  const handleOpenMaintenance = (asset: Asset) => {
    setSelectedAssetForMaint(asset);
    setMaintLogs([
      { id: 'M-101', date: '2026-06-15', type: '季度例行维护', engineer: '张强 (计量工程师)', cost: 1200, details: '机械密封压盖紧固、叶轮动平衡校验、润滑油更换' },
      { id: 'M-102', date: '2026-07-20', type: '防爆专项检测', engineer: '李伟 (防爆主管)', cost: 600, details: '防爆接合面间隙测量合格 (0.12mm < 0.20mm)，隔爆外壳接地可靠' },
    ]);
    setShowMaintenanceModal(true);
  };

  const handleAddMaintenanceLog = () => {
    if (!newMaintDetails.trim()) return alert('请输入维保记录详细说明');
    const newLog = {
      id: `M-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      type: newMaintType,
      engineer: newMaintEngineer,
      cost: Number(newMaintCost) || 0,
      details: newMaintDetails,
    };
    setMaintLogs([newLog, ...maintLogs]);
    setNewMaintDetails('');
    alert('✅ 维保履历条目添加成功，已关联归档存库！');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAssets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssets.map(a => a.id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return alert('请先勾选需要批量删除的资产记录');
    if (!confirm(`⚠️ 高危操作：是否确认物理/逻辑删除选中的 ${selectedIds.length} 条资产记录？`)) return;

    for (const id of selectedIds) {
      await api.deleteAsset(id);
    }
    alert(`已批量删除 ${selectedIds.length} 条记录！`);
    setSelectedIds([]);
    loadAssets();
  };

  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return alert('请先勾选需要批量修改状态的资产');
    
    for (const id of selectedIds) {
      const asset = assets.find(a => a.id === id);
      if (asset) {
        await api.saveAsset({ ...asset, status: newStatus });
      }
    }
    alert(`已为选中的 ${selectedIds.length} 条资产批量更新状态为: [${newStatus}]`);
    setSelectedIds([]);
    loadAssets();
  };

  const handleAutoCode = async () => {
    try {
      const res = await api.generateCodeRule(formData.category || '输油泵类', formData.unit_code);
      if (res.code) {
        setFormData((prev) => ({
          ...prev,
          code: res.code,
          equipment_no: res.code,
          gather_no: res.code.replace(/-/g, ''),
          plate_code: `Z$001@${res.code}`,
        }));
      }
    } catch (err: any) {
      alert(err.message || '服务端规则引擎生成试号失败');
    }
  };

  const handleSave = async () => {
    if (!formData.code && !formData.equipment_no) return alert('请填写编目编码');
    try {
      await api.saveAsset(formData);
      alert('设备设施保存成功！后端排重与属性约束校验通过。');
      setShowModal(false);
      setEditingAsset(null);
      loadAssets();
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认逻辑删除该设备设施资产条目？')) return;
    try {
      const res = await api.deleteAsset(id);
      alert(res.message || '逻辑删除成功！');
      loadAssets();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<{
    fileName: string;
    total: number;
    passed: number;
    errors: number;
    items: Array<{ rowNum: number; asset: Partial<Asset>; isValid: boolean; errorMsg: string }>;
  } | null>(null);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawRows = XLSX.utils.sheet_to_json(ws) as any[];

        const reportItems: Array<{ rowNum: number; asset: Partial<Asset>; isValid: boolean; errorMsg: string }> = [];
        let passedCount = 0;
        let errorCount = 0;

        rawRows.forEach((item, idx) => {
          const rowNum = idx + 2;
          const eqNo = item['资产主编号'] || item['编目编码'] || item['设备编号'] || '';
          const name = item['资产名称'] || item['设备名称'] || '';
          const category = item['设备类型'] || item['资产分类'] || '输油泵类';
          
          let isValid = true;
          const errors: string[] = [];

          if (!eqNo) {
            isValid = false;
            errors.push('缺失【资产主编号/编目编码】');
          } else if (assets.some((a) => a.equipment_no === eqNo || a.code === eqNo)) {
            isValid = false;
            errors.push('防重校验机制提示: 该设备编号与正式库现有编号重复');
          }

          if (!name) {
            isValid = false;
            errors.push('缺失【资产名称】关键必填属性');
          }

          if (isValid) passedCount++;
          else errorCount++;

          reportItems.push({
            rowNum,
            isValid,
            errorMsg: errors.join('; ') || '格式校验合格',
            asset: {
              id: `AST-IMP-${Math.random().toString().slice(-4)}`,
              equipment_no: eqNo || `ZC-PUMP-ERR-${rowNum}`,
              code: eqNo || `YK-ERR-${rowNum}`,
              name: name || '未命名设备',
              asset_name: name || '未命名设备',
              category: category,
              category_id: 1002,
              unit_code: 'UNIT-001',
              unit_name: '第一储运发油库区',
              location_id: 'LOC-101',
              location_name: 'A区立式拱顶储罐组',
              quantity: Number(item['数量']) || 1,
              unit_price: Number(item['单价']) || 10000,
              status: item['使用状态'] || '在用',
              install_position: item['安装位置'] || '现场库区',
              manufacturer: item['生产厂家'] || '未指定',
              manager: 'arch1',
              factory_code: item['出厂编码'] || 'FC-IMP',
              vendor_code: 'VD-IMP',
              jd_code: 'JD-IMP',
              military_asset_code: 'MIL-IMP',
              prod_date: '2024-01-01',
              summary: '批量校验导入数据',
              extend_record_json: '{}',
              is_duplicate: !isValid,
              has_error: !isValid,
              error_msg: errors.join('; '),
              audit_status: 2,
              auditor_name: 'arch1',
              audit_opinion: '文件校验自动核验完成',
              audit_time: '2026-08-01',
              sync_status: 'synced',
              source_type: 'import',
              source: 'Excel文件导入',
            },
          });
        });

        setReportData({
          fileName: file.name,
          total: rawRows.length,
          passed: passedCount,
          errors: errorCount,
          items: reportItems,
        });
        setShowReportModal(true);
      } catch (err) {
        alert('读取 Excel 文件格式错误或读取失败！');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSyncReportData = async () => {
    if (!reportData) return;
    const validItems = reportData.items.filter((i) => i.isValid);
    if (validItems.length === 0) return alert('当前校验结果中无合格记录可同步入库！');

    let synced = 0;
    for (const item of validItems) {
      await api.saveAsset(item.asset);
      synced++;
    }

    alert(`🎉 校验通过！成功将 ${synced} 条合格资产数据一键同步入库！`);
    setShowReportModal(false);
    loadAssets();
  };

  const handleExportValidationReport = () => {
    if (!reportData) return;
    const exportRows = reportData.items.map((i) => ({
      'Excel行号': i.rowNum,
      '资产主编号': i.asset.equipment_no,
      '资产名称': i.asset.asset_name,
      '设备分类': i.asset.category,
      '校验结果': i.isValid ? '通过' : '未通过',
      '详细校验意见与错误原因': i.errorMsg,
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "数据校验报告");
    XLSX.writeFile(wb, `数据校验报告_${reportData.fileName}_${Date.now()}.xlsx`);
  };

  const filteredAssets = assets.filter((a) => {
    const matchSearch =
      (a.asset_name || a.name || '').includes(searchTerm) ||
      (a.equipment_no || a.code || '').includes(searchTerm) ||
      (a.category || '').includes(searchTerm) ||
      (a.manufacturer || '').includes(searchTerm);

    if (!matchSearch) return false;

    if (activeTab === 'DUP') return a.is_duplicate;
    if (activeTab === 'ERR') return a.has_error;
    if (activeTab === 'APPROVED') return a.audit_status === 2;
    return true;
  });

  const dupCount = assets.filter((a) => a.is_duplicate).length;
  const errCount = assets.filter((a) => a.has_error).length;

  const handleExportFullAssetsExcel = () => {
    if (filteredAssets.length === 0) {
      alert('当前列表暂无资产数据可导出！');
      return;
    }
    const exportRows = filteredAssets.map((a, index) => ({
      '序号': index + 1,
      '设备编号': a.equipment_no || a.code || '',
      '编目编码': a.code || a.equipment_no || '',
      '资产名称': a.asset_name || a.name || '',
      '设备分类': a.category || '',
      '规格型号': a.specification_model || '350m³/h',
      '运行状态': a.status || '在用',
      '归属单位': a.unit_name || '第一储运发油库区',
      '具体安装位置': a.install_position || '',
      '生产厂家': a.manufacturer || '',
      '出厂日期': a.prod_date || '',
      '数量': a.quantity || 1,
      '资产单价(元)': a.unit_price || 0,
      '资产总额(元)': (a.quantity || 1) * (a.unit_price || 0),
      '安全密级': a.security_level || '内部',
      '防爆等级': a.ex_level || 'Ex d IIB T4',
      '排重标记': a.is_duplicate ? '⚠️ 重复标红' : '正常',
      '纠错标记': a.has_error ? '⚠️ 错误标红' : '正常',
      '审核状态': a.audit_status === 2 ? '已通过' : (a.audit_status === 1 ? '待审核' : (a.audit_status === 3 ? '已退回' : '草稿')),
      '摘要备注': a.summary || '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "油库资产档案报表");
    XLSX.writeFile(wb, `油库全量资产档案明细表_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const complianceRate = assets.length > 0
    ? Math.round(((assets.length - dupCount - errCount) / assets.length) * 100)
    : 100;

  return (
    <div className="space-y-5">
      {/* Title Header */}
      <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/70 shadow-xs flex flex-wrap justify-between items-center gap-3 transition-all">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
            <Database className="w-5 h-5 text-blue-600" />
            数据维护与设备维保中心
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            提供油库设备设施数据的全属性维护、维保履历归档、批量操作及 Excel 导入导出；规则引擎全库排重纠错并对重复重号支持一键自动打补丁修正。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportFullAssetsExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            导出 Excel 报表
          </button>

          <label className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/80 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-all active:scale-95">
            <Upload className="w-4 h-4 text-blue-600" />
            批量导入 Excel
            <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
          </label>

          <button
            onClick={handleRunAnalyze}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
          >
            <AlertCircle className="w-4 h-4" />
            排重与纠错检测
          </button>

          <button
            onClick={handleAutoFixDuplicates}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            title="一键自动为所有重复资产重编编号并消除重复标红"
          >
            <CheckCircle2 className="w-4 h-4 text-indigo-200" />
            一键自动重编消错
          </button>

          <button
            onClick={() => {
              setEditingAsset(null);
              setFormData({
                id: '',
                equipment_no: `ZC-PUMP-${Math.floor(Math.random() * 9000 + 1000)}`,
                code: `YK-PUMP-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
                name: '',
                asset_name: '',
                category: '输油泵类',
                category_id: 1002,
                unit_code: 'UNIT-001',
                unit_name: '第一储运发油库区',
                location_id: 'LOC-101',
                location_name: 'A区立式拱顶储罐组',
                quantity: 1,
                unit_price: 15000,
                status: '在用',
                install_position: '泵房1号基座',
                manufacturer: '沈阳水泵工业集团',
                manager: 'arch1',
                factory_code: 'SY-2024-8890',
                vendor_code: 'VD-88219',
                jd_code: 'JD-ASSET-77812',
                military_asset_code: 'MIL-88219',
                prod_date: '2024-05-15',
                summary: '离心发油主泵',
                extend_record_json: '{}',
                is_duplicate: false,
                has_error: false,
                error_msg: undefined,
                audit_status: 2,
                auditor_name: 'arch1',
                audit_opinion: '通过',
                audit_time: '2026-08-01',
                sync_status: 'synced',
                source_type: 'pc',
                source: 'PC新增',
              });
              setShowModal(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            新增设备设施
          </button>
        </div>
      </div>

      {/* Modern Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">全量台账设备</span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5 block">{assets.length} <span className="text-xs font-normal text-slate-400">台/套</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">重复与异常标红</span>
            <span className="text-2xl font-extrabold text-rose-600 font-mono mt-0.5 block">{dupCount + errCount} <span className="text-xs font-normal text-slate-400">需修正</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">合格入库资产</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{assets.filter(a => a.audit_status === 2).length} <span className="text-xs font-normal text-slate-400">合格</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">数据合规通过率</span>
            <span className="text-2xl font-extrabold text-indigo-600 font-mono mt-0.5 block">{complianceRate}%</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-xs font-mono">
            {complianceRate}%
          </div>
        </div>
      </div>

      {/* Filter Tabs, Category Dropdown & Search Bar */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              全部资产 ({assets.length})
            </button>

            <button
              onClick={() => setActiveTab('DUP')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'DUP' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              重复标红 ⚠️ ({dupCount})
            </button>

            <button
              onClick={() => setActiveTab('ERR')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'ERR' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              纠错标红 ⚠️ ({errCount})
            </button>

            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'APPROVED' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              已入库 ✓ ({assets.filter((a) => a.audit_status === 2).length})
            </button>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">全部分类筛选</option>
            <option value="输油泵类">输油泵类</option>
            <option value="阀门控制类">阀门控制类</option>
            <option value="油罐储存类">油罐储存类</option>
            <option value="计量仪表类">计量仪表类</option>
          </select>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="按资产主编号、名称、分类、生产厂家模糊搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Batch Actions Bar (when checkboxes selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between animate-fade-in text-xs">
          <div className="flex items-center space-x-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>已勾选 <span className="text-cyan-300 font-mono text-sm">{selectedIds.length}</span> 项设备设施条目</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBatchStatusChange('在用')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-xs"
            >
              一键设为【在用】
            </button>
            <button
              onClick={() => handleBatchStatusChange('停用/检修')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all shadow-xs"
            >
              一键设为【检修】
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-all shadow-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              一键批量删除
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all"
            >
              取消勾选
            </button>
          </div>
        </div>
      )}

      {/* Main Asset Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredAssets.length && filteredAssets.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-3.5 font-semibold">校验状态</th>
                <th className="p-3.5 font-semibold">设备主编号</th>
                <th className="p-3.5 font-semibold">资产名称</th>
                <th className="p-3.5 font-semibold">设备分类</th>
                <th className="p-3.5 font-semibold">安装位置</th>
                <th className="p-3.5 font-semibold">使用状态</th>
                <th className="p-3.5 font-semibold">生产厂家</th>
                <th className="p-3.5 font-semibold">出厂编码</th>
                <th className="p-3.5 font-semibold">数据来源</th>
                <th className="p-3.5 font-semibold text-right">维保与操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets
                .filter(a => categoryFilter === 'ALL' || a.category === categoryFilter)
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((asset) => {
                  const isFlagged = asset.is_duplicate || asset.has_error;
                  const isSelected = selectedIds.includes(asset.id);
                  return (
                    <tr
                      key={asset.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 font-medium'
                          : isFlagged
                          ? 'bg-rose-50/80 border-l-4 border-l-rose-500 text-rose-900 font-medium'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectId(asset.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3.5">
                        {isFlagged ? (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 w-fit font-bold text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            {asset.is_duplicate ? '重复标红 ⚠️' : '纠错标红 ⚠️'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 w-fit font-semibold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            合格/已审核
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">{asset.equipment_no || asset.code}</td>
                      <td className="p-3.5 font-medium text-slate-900">{asset.asset_name || asset.name}</td>
                      <td className="p-3.5">{asset.category}</td>
                      <td className="p-3.5">{asset.install_position}</td>
                      <td className="p-3.5 font-mono">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          asset.status === '在用' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-sans">{asset.manufacturer}</td>
                      <td className="p-3.5 font-mono text-slate-500 text-[11px]">{asset.factory_code}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                          {asset.source_type || asset.source}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenMaintenance(asset)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 text-[11px] font-semibold transition-all"
                          title="查看与归档设备设施维保履历"
                        >
                          🛠️ 维保履历
                        </button>
                        <button
                          onClick={() => {
                            setEditingAsset(asset);
                            setFormData(asset);
                            setShowModal(true);
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-medium shadow-2xs"
                        >
                          <Edit className="w-3 h-3 inline mr-1 text-blue-600" />
                          修改
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] font-medium"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1 text-rose-600" />
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredAssets.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              {editingAsset ? '修改设备设施信息' : '新增设备设施条目'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 font-semibold">编目编码 (格式: YK-前缀)</label>
                  <button
                    type="button"
                    onClick={handleAutoCode}
                    className="text-[10px] text-blue-600 font-semibold hover:underline"
                  >
                    ⚡ 规则引擎生成
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.code || formData.equipment_no || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value, equipment_no: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">资产名称</label>
                <input
                  type="text"
                  value={formData.name || formData.asset_name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, asset_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">设备分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="输油泵类">输油泵类</option>
                  <option value="阀门控制类">阀门控制类</option>
                  <option value="油罐储存类">油罐储存类</option>
                  <option value="计量仪表类">计量仪表类</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">使用状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="在用">在用</option>
                  <option value="停用/检修">停用/检修</option>
                  <option value="待报废">待报废</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">安装位置</label>
                <input
                  type="text"
                  value={formData.install_position}
                  onChange={(e) => setFormData({ ...formData, install_position: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">权属单位代码</label>
                <input
                  type="text"
                  value={formData.unit_code || 'UNIT-001'}
                  onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
                  placeholder="如: UNIT-001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">生产厂家</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            {/* Extended Attributes Fields */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">设备分类扩展属性 (与属性模板联调)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block text-[11px] font-semibold mb-1">设计容量 (m³)</label>
                  <input
                    type="text"
                    value={(() => {
                      try { return JSON.parse(formData.extend_record_json || '{}').designCapacity || '1000'; }
                      catch { return '1000'; }
                    })()}
                    onChange={(e) => {
                      let cur: any = {};
                      try { cur = JSON.parse(formData.extend_record_json || '{}'); } catch {}
                      setFormData({ ...formData, extend_record_json: JSON.stringify({ ...cur, designCapacity: e.target.value }) });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block text-[11px] font-semibold mb-1">油品/介质类型</label>
                  <input
                    type="text"
                    value={(() => {
                      try { return JSON.parse(formData.extend_record_json || '{}').oilType || '0#柴油'; }
                      catch { return '0#柴油'; }
                    })()}
                    onChange={(e) => {
                      let cur: any = {};
                      try { cur = JSON.parse(formData.extend_record_json || '{}'); } catch {}
                      setFormData({ ...formData, extend_record_json: JSON.stringify({ ...cur, oilType: e.target.value }) });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-semibold">资产概要说明</label>
              <textarea
                rows={2}
                value={formData.summary || ''}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold"
              >
                取消
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-2xs"
              >
                保存资产
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Report Modal */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full border border-slate-200 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Excel 资产数据校验报告 ({reportData.fileName})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  全量校验规则引擎已对文件数据检索比对：总数 {reportData.total} 条，校验通过 {reportData.passed} 条，异常记录 {reportData.errors} 条。
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            {/* Validation Metrics Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                <span className="text-xs text-slate-500 font-semibold block">总读取数据数</span>
                <span className="text-lg font-bold text-slate-900 font-mono">{reportData.total} 条</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-center">
                <span className="text-xs text-emerald-600 font-semibold block">合格通过可入库</span>
                <span className="text-lg font-bold text-emerald-700 font-mono">{reportData.passed} 条</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-center">
                <span className="text-xs text-rose-600 font-semibold block">拦截异常记录数</span>
                <span className="text-lg font-bold text-rose-700 font-mono">{reportData.errors} 条</span>
              </div>
            </div>

            {/* Validation Detailed Items Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-semibold w-16">行号</th>
                    <th className="p-3 font-semibold">设备主编号</th>
                    <th className="p-3 font-semibold">资产名称</th>
                    <th className="p-3 font-semibold">分类</th>
                    <th className="p-3 font-semibold">校验结论</th>
                    <th className="p-3 font-semibold">校验说明与建议</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {reportData.items.map((item) => (
                    <tr key={item.rowNum} className={item.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50/80'}>
                      <td className="p-3 font-bold text-slate-500">#{item.rowNum}</td>
                      <td className="p-3 font-bold text-slate-900">{item.asset.equipment_no || '-'}</td>
                      <td className="p-3 font-sans font-semibold text-slate-800">{item.asset.asset_name || '-'}</td>
                      <td className="p-3 font-sans text-slate-600">{item.asset.category}</td>
                      <td className="p-3 font-sans">
                        {item.isValid ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            ✅ 校验通过
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px]">
                            ❌ 格式/防重异常
                          </span>
                        )}
                      </td>
                      <td className={`p-3 font-sans ${item.isValid ? 'text-slate-500' : 'text-rose-700 font-semibold'}`}>
                        {item.errorMsg}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={handleExportValidationReport}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-2 shadow-2xs"
              >
                <Download className="w-4 h-4 text-blue-600" />
                导出校验报告 (.xlsx)
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  关闭
                </button>
                <button
                  onClick={handleSyncReportData}
                  disabled={reportData.passed === 0}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  一键同步合格数据到正式库 ({reportData.passed} 条)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Maintenance & Repair Logs Modal */}
      {showMaintenanceModal && selectedAssetForMaint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  🛠️ 设备设施维保履历与保养日志
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  记录资产编号 <strong className="font-mono text-slate-900">[{selectedAssetForMaint.equipment_no || selectedAssetForMaint.code}]</strong> 对应全生命周期的维护、保养及防爆检修档案。
                </p>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            {/* Asset Info Summary Card */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-3 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px]">资产名称:</span>
                <span className="font-bold text-slate-900 text-xs">{selectedAssetForMaint.asset_name || selectedAssetForMaint.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">设备分类与位置:</span>
                <span className="font-semibold text-slate-700 text-xs">{selectedAssetForMaint.category} · {selectedAssetForMaint.install_position}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">运行状态与防爆等级:</span>
                <span className="font-bold text-emerald-700 text-xs">{selectedAssetForMaint.status} ({selectedAssetForMaint.ex_level || 'Ex d IIB T4'})</span>
              </div>
            </div>

            {/* Maintenance History Timeline List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-3 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                历史维保档案时间线 ({maintLogs.length} 条)
              </h4>
              {maintLogs.map((log) => (
                <div key={log.id} className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-mono">{log.type}</span>
                      <span className="text-slate-600 text-xs font-sans">{log.engineer}</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{log.date} · 费用: ¥{log.cost}</span>
                  </div>
                  <p className="text-slate-600 text-xs font-sans pl-2 border-l-2 border-amber-400 mt-1">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Form to Add New Maintenance Record */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block text-xs">新增维保/检修记录填报</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-600 block text-[10px] font-semibold mb-1">维保事项类型</label>
                  <select
                    value={newMaintType}
                    onChange={(e) => setNewMaintType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                  >
                    <option value="例行检修与防爆测试">例行检修与防爆测试</option>
                    <option value="定期保养与油品更换">定期保养与油品更换</option>
                    <option value="故障大修与部件更换">故障大修与部件更换</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 block text-[10px] font-semibold mb-1">责任工程师/技术员</label>
                  <input
                    type="text"
                    value={newMaintEngineer}
                    onChange={(e) => setNewMaintEngineer(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-slate-600 block text-[10px] font-semibold mb-1">维保花费金额 (元)</label>
                  <input
                    type="number"
                    value={newMaintCost}
                    onChange={(e) => setNewMaintCost(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 block text-[10px] font-semibold mb-1">详细保养/检修说明</label>
                <input
                  type="text"
                  value={newMaintDetails}
                  onChange={(e) => setNewMaintDetails(e.target.value)}
                  placeholder="填写具体的维保更换零部件或检测数据说明..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleAddMaintenanceLog}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-all active:scale-95"
                >
                  登记并归档维保履历
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-2xs"
              >
                完成关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Deduplication & Error Diagnostic Workbench Modal */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-xs">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  🔍 油库全库数据排重与纠错诊断工作台
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  规则引擎对 <strong className="font-mono text-slate-900">{analyzeSummary.total}</strong> 条在册资产进行了逻辑交叉比对与重号碰撞分析。
                </p>
              </div>
              <button
                onClick={() => setShowAnalyzeModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Diagnostic Metric Cards */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-medium block">扫描分析样本</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{analyzeSummary.total} 条</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-[10px] text-rose-600 font-bold block">重号标红记录 ⚠️</span>
                <span className="text-lg font-bold text-rose-700 font-mono mt-0.5 block">{analyzeSummary.dups} 项冲突</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-amber-700 font-bold block">属性缺失/纠错标红 ⚠️</span>
                <span className="text-lg font-bold text-amber-800 font-mono mt-0.5 block">{analyzeSummary.errs} 项问题</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-700 font-bold block">可一键自动修正</span>
                <span className="text-lg font-bold text-emerald-800 font-mono mt-0.5 block">{analyzeSummary.dups + analyzeSummary.errs} 项</span>
              </div>
            </div>

            {/* Dual Column Diagnostic Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
              {/* Left Column: Duplicate Items */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col space-y-2 overflow-hidden">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    重号冲突记录 ({assets.filter(a => a.is_duplicate).length})
                  </span>
                  <button
                    onClick={handleAutoFixDuplicates}
                    disabled={analyzeSummary.dups === 0}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-semibold transition-all shadow-2xs"
                  >
                    一键批量重编消错
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {assets.filter(a => a.is_duplicate).length === 0 ? (
                    <div className="text-center text-slate-400 py-8 font-medium">✓ 未检测到编号重复冲突资产</div>
                  ) : (
                    assets.filter(a => a.is_duplicate).map(item => (
                      <div key={item.id} className="p-2.5 bg-white border border-rose-200 rounded-xl space-y-1 shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-rose-700">{item.equipment_no || item.code}</span>
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">重号标红</span>
                        </div>
                        <div className="text-slate-700 font-medium text-[11px]">{item.asset_name || item.name} · {item.category}</div>
                        <div className="text-slate-400 text-[10px]">生产厂家: {item.manufacturer || '未填'}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Attribute Error Items */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col space-y-2 overflow-hidden">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    属性缺省/问题记录 ({assets.filter(a => a.has_error).length})
                  </span>
                  <button
                    onClick={handleBatchFixErrors}
                    disabled={analyzeSummary.errs === 0}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-semibold transition-all shadow-2xs"
                  >
                    一键智能补全属性
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {assets.filter(a => a.has_error).length === 0 ? (
                    <div className="text-center text-slate-400 py-8 font-medium">✓ 未检测到属性缺失异常资产</div>
                  ) : (
                    assets.filter(a => a.has_error).map(item => (
                      <div key={item.id} className="p-2.5 bg-white border border-amber-200 rounded-xl space-y-1 shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-slate-900">{item.equipment_no || item.code}</span>
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">纠错标红</span>
                        </div>
                        <div className="text-slate-700 font-medium text-[11px]">{item.asset_name || item.name}</div>
                        <div className="text-rose-600 text-[10px] font-semibold">⚠️ 错误原因: {item.error_msg || '位置或关键字段缺省'}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={handleExportFullAssetsExcel}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold border border-slate-200 flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-4 h-4 text-blue-600" />
                导出排重诊断报告 (.xlsx)
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAnalyzeModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-2xs hover:bg-slate-800"
                >
                  关闭诊断工作台
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
