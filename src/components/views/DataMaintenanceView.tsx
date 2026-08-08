import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit, Trash2, ShieldCheck, AlertCircle, Upload, Search, Download, Filter, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Asset } from '../../types';
import { Pagination } from '../common/Pagination';
import * as XLSX from 'xlsx';

export const DataMaintenanceView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DUP' | 'ERR' | 'APPROVED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

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
      const res = await api.analyzeDedupAndErrors();
      alert(res.message);
      loadAssets();
    } catch (err) {
      alert('分析操作失败！');
    }
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

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            数据维护 (排重与纠错)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            提供设备设施数据的增删改查及 EXCEL 批量导入；根据排重和纠错规则进行数据检查，对重复和存在问题的条目在界面进行标红提示，确认无误后入库。
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleExportFullAssetsExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            导出 Excel 报表
          </button>

          <label className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 cursor-pointer flex items-center gap-2 shadow-2xs">
            <Upload className="w-4 h-4 text-blue-600" />
            批量导入 Excel
            <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
          </label>

          <button
            onClick={handleRunAnalyze}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs"
          >
            <AlertCircle className="w-4 h-4" />
            排重与纠错检测
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
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            新增设备设施
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
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

        <div className="flex items-center space-x-3 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="检索资产编码、名称、分类、生产厂家..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main Asset Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3.5 font-semibold">校验状态</th>
                <th className="p-3.5 font-semibold">生产厂家</th>
                <th className="p-3.5 font-semibold">出厂编码</th>
                <th className="p-3.5 font-semibold">数据来源</th>
                <th className="p-3.5 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((asset) => {
                const isFlagged = asset.is_duplicate || asset.has_error;
                return (
                  <tr
                    key={asset.id}
                    className={`transition-colors ${
                      isFlagged
                        ? 'bg-rose-50/80 border-l-4 border-l-rose-500 text-rose-900 font-medium'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
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
                    <td className="p-3.5 font-mono">{asset.status}</td>
                    <td className="p-3.5 font-sans">{asset.manufacturer}</td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{asset.factory_code}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                        {asset.source_type || asset.source}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingAsset(asset);
                          setFormData(asset);
                          setShowModal(true);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-medium shadow-2xs"
                      >
                        <Edit className="w-3 h-3 inline mr-1 text-blue-600" />
                        修改
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] font-medium"
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
    </div>
  );
};
