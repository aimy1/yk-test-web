import React, { useState } from 'react';
import { FileCheck, AlertTriangle, Download, CheckCircle, Upload, Filter, Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Asset } from '../../types';
import * as XLSX from 'xlsx';

export const DataInspectionView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fileSelected, setFileSelected] = useState<string>('油库第1季度临时资产数据包.xlsx');
  const [unitCode, setUnitCode] = useState<string>('UNIT-001');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [result, setResult] = useState<{ total: number; passed: number; flagged_errors: number; items: Asset[] } | null>(null);
  const [inspectedItem, setInspectedItem] = useState<Asset | null>(null);

  const handleRunCheck = async () => {
    setLoading(true);
    setCurrentStep(2);
    try {
      const res = await api.checkTempData(fileSelected, unitCode);
      setResult(res);
      setCurrentStep(4);
    } catch (err) {
      alert('检查请求失败，请确保后端服务正常运行！');
    } finally {
      setLoading(false);
    }
  };

  const handleExportIssues = () => {
    if (!result) return;
    const issues = result.items.filter(i => i.has_error).map(i => ({
      '编目编码': i.code,
      '资产名称': i.name,
      '单位代码': i.unit_code,
      '使用状态': i.status,
      '错误原因/问题标记': i.error_msg || '格式异常',
    }));
    const worksheet = XLSX.utils.json_to_sheet(issues);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "异常问题数据");
    XLSX.writeFile(workbook, "临时库数据检查问题清单.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileSelected(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        
        let passed = 0;
        let flagged = 0;
        const parsedAssets: Asset[] = rows.map((r, idx) => {
          const eqNo = r['资产主编号'] || r['编目编码'] || `ZC-IMP-${idx + 1}`;
          const uCode = r['单位代码'] || unitCode;
          const isErr = uCode !== unitCode || !r['资产名称'];
          if (isErr) flagged++; else passed++;
          return {
            id: `TMP-${idx + 1}`,
            equipment_no: eqNo,
            gather_no: eqNo,
            plate_code: `Z$001@${eqNo}`,
            code: eqNo,
            name: r['资产名称'] || '未知资产',
            asset_name: r['资产名称'] || '未知资产',
            category: r['设备类型'] || '通用设备',
            category_id: 1001,
            unit_code: uCode,
            unit_name: r['管理单位'] || '外部单位',
            location_id: 'LOC-101',
            location_name: 'A区罐区',
            specification_model: r['规格型号'] || '',
            quantity: Number(r['数量']) || 1,
            unit_price: Number(r['单价']) || 0,
            status: r['使用状态'] || '在用',
            install_position: r['安装位置'] || '',
            manufacturer: r['生产厂家'] || '',
            manager: 'arch1',
            factory_code: r['出厂编码'] || '',
            vendor_code: '',
            jd_code: '',
            military_asset_code: '',
            prod_date: '2024-01-01',
            summary: '临时导入检核数据',
            extend_record_json: '{}',
            is_duplicate: false,
            has_error: isErr,
            error_msg: isErr ? (uCode !== unitCode ? '越权单位代码 (与当前允许代码不匹配)' : '缺失核心资产名称') : undefined,
            audit_status: 0,
            auditor_name: '',
            audit_opinion: '',
            audit_time: '',
            sync_status: 'pending',
            source_type: 'temp',
            source: '临时数据包',
          };
        });

        setResult({
          total: rows.length,
          passed,
          flagged_errors: flagged,
          items: parsedAssets,
        });
        setCurrentStep(4);
      } catch (err) {
        alert('文件解析失败，请确保上传标准的 Excel / 数据包文件');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            数据检查 (临时库)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            打开资产数据包或 Excel 文件，检查数据权属范围（按单位代码字段）、数据模板格式、关键数据字段及数据项，进行问题标记标识，并可导出。
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunCheck}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            {loading ? '自动校验中...' : '执行数据检查'}
          </button>
          {result && (
            <button
              onClick={handleExportIssues}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-2 shadow-2xs"
            >
              <Download className="w-4 h-4 text-blue-600" />
              导出问题记录 (Excel)
            </button>
          )}
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className={`p-3 rounded-xl border transition-all ${currentStep >= 1 ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            <div className="font-mono text-[10px] opacity-70">STEP 01</div>
            <div className="font-bold mt-0.5">选择数据包文件</div>
          </div>
          <div className={`p-3 rounded-xl border transition-all ${currentStep >= 2 ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            <div className="font-mono text-[10px] opacity-70">STEP 02</div>
            <div className="font-bold mt-0.5">权属代码范围匹配</div>
          </div>
          <div className={`p-3 rounded-xl border transition-all ${currentStep >= 3 ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            <div className="font-mono text-[10px] opacity-70">STEP 03</div>
            <div className="font-bold mt-0.5">关键字段与模板分析</div>
          </div>
          <div className={`p-3 rounded-xl border transition-all ${currentStep >= 4 ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            <div className="font-mono text-[10px] opacity-70">STEP 04</div>
            <div className="font-bold mt-0.5">问题标记标识与导出</div>
          </div>
        </div>
      </div>

      {/* Config Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <label className="text-xs font-semibold text-slate-700 block">资产数据包 / Excel 本地文件选择</label>
          <div className="relative flex items-center">
            <input
              type="text"
              readOnly
              value={fileSelected}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-16 py-2 text-xs text-slate-800 font-mono"
            />
            <label className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors">
              <Upload className="w-3 h-3" /> 选择
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <label className="text-xs font-semibold text-slate-700 block">权属单位校验代码</label>
          <select
            value={unitCode}
            onChange={(e) => setUnitCode(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="UNIT-001">UNIT-001 (第一储运发油库区)</option>
            <option value="UNIT-002">UNIT-002 (第二管道输油车间)</option>
            <option value="UNIT-999">UNIT-999 (外部非授权单位代码)</option>
          </select>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between px-6">
          {result ? (
            <div className="w-full flex justify-between text-center">
              <div>
                <div className="text-2xl font-bold text-slate-900 font-mono">{result.total}</div>
                <div className="text-xs text-slate-500">总数据项</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600 font-mono">{result.passed}</div>
                <div className="text-xs text-slate-500">校验通过</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-rose-600 font-mono">{result.flagged_errors}</div>
                <div className="text-xs text-slate-500">标记异常</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center w-full">点击右上角“执行数据检查”或上传 Excel</div>
          )}
        </div>
      </div>

      {/* Results Table */}
      {result && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              检查结果明细列表 (问题数据标红显示)
            </h3>
            <span className="text-[11px] text-slate-500">
              数据源: <span className="font-mono font-bold text-slate-700">{fileSelected}</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5 font-semibold">检查状态</th>
                  <th className="p-3.5 font-semibold">编目编码</th>
                  <th className="p-3.5 font-semibold">资产名称</th>
                  <th className="p-3.5 font-semibold">权属单位代码</th>
                  <th className="p-3.5 font-semibold">规格型号</th>
                  <th className="p-3.5 font-semibold">使用状态</th>
                  <th className="p-3.5 font-semibold">问题说明 / 标记标识</th>
                  <th className="p-3.5 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.items.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.has_error
                        ? 'bg-rose-50/80 border-l-4 border-l-rose-500 text-rose-900 font-medium'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <td className="p-3.5">
                      {item.has_error ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold border border-rose-200 flex items-center gap-1 w-fit text-[11px]">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> 问题标记 ⚠️
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1 w-fit text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 校验通过
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold">{item.code}</td>
                    <td className="p-3.5 font-semibold">{item.name}</td>
                    <td className="p-3.5 font-mono">{item.unit_code}</td>
                    <td className="p-3.5">{item.specification_model || '标准'}</td>
                    <td className="p-3.5">{item.status}</td>
                    <td className="p-3.5 font-medium">
                      {item.has_error ? (
                        <span className="text-rose-600 font-bold">{item.error_msg || '数据项不完整'}</span>
                      ) : (
                        <span className="text-slate-400">规则格式正常</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setInspectedItem(item)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-medium shadow-2xs"
                      >
                        <Eye className="w-3 h-3 inline mr-1 text-blue-600" /> 详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Item Modal */}
      {inspectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" /> 临时库数据项校验详情
            </h3>
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-mono text-slate-700">
              <div><span className="text-slate-400">编目编码:</span> {inspectedItem.code}</div>
              <div><span className="text-slate-400">资产名称:</span> {inspectedItem.name}</div>
              <div><span className="text-slate-400">权属单位代码:</span> {inspectedItem.unit_code}</div>
              <div><span className="text-slate-400">使用状态:</span> {inspectedItem.status}</div>
              <div><span className="text-slate-400">检查评估结果:</span> {inspectedItem.has_error ? inspectedItem.error_msg : '格式及权属匹配完全正确'}</div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setInspectedItem(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-xs"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
