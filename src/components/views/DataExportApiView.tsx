import React, { useState } from 'react';
import { FileSpreadsheet, Code, Download, Play, CheckCircle2, Copy, Terminal as TerminalIcon, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export const DataExportApiView: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<string>('JD');
  const [activeTab, setActiveTab] = useState<'EXPORT' | 'API'>('EXPORT');
  const [apiEndpoint, setApiEndpoint] = useState<string>('/assets');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExportPackage = () => {
    const pkgContent = {
      export_time: new Date().toISOString(),
      target_system: selectedSystem,
      version: '2.6.0',
      data_format: 'YOUK_ASSET_PACKAGE_V2',
      security_checksum: 'SHA256-8A91F92B3C99F128A',
      total_items: 4,
      author: 'arch1',
      unit_code: 'UNIT-001',
    };
    const blob = new Blob([JSON.stringify(pkgContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `油库资产数据包_${selectedSystem}_${Date.now()}.json`;
    a.click();
  };

  const handleTestApi = async (endpoint: string) => {
    setApiEndpoint(endpoint);
    setLoading(true);
    const startTime = performance.now();
    try {
      let data: any;
      if (endpoint === '/assets') data = await api.getAssets();
      else if (endpoint === '/units') data = await api.getUnits();
      else if (endpoint === '/analytics') data = await api.getAnalytics();
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setApiStatus(200);
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setApiStatus(500);
      setApiResponse('API Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            数据导出与 REST API 接口
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            将设备设施数据导出成资产数据包文件，用于上报 JD 资产管理系统、油库综合信息系统、资产采集终端 APP；并提供数据接口 (API)。
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'EXPORT' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            文件数据包导出
          </button>
          <button
            onClick={() => setActiveTab('API')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'API' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            REST API 数据接口
          </button>
        </div>
      </div>

      {activeTab === 'EXPORT' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">资产数据包导出</h3>
                <p className="text-xs text-slate-500">打包生成结构化资产数据包文件</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">上报/输出目标系统</label>
                <select
                  value={selectedSystem}
                  onChange={(e) => setSelectedSystem(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold"
                >
                  <option value="JD">JD 资产管理系统</option>
                  <option value="YOUK_INTEGRATED">油库综合信息系统</option>
                  <option value="MOBILE_APP">资产采集终端 APP</option>
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 font-mono text-slate-600 text-[11px] space-y-1.5">
                <div className="flex justify-between">
                  <span>文件类型:</span>
                  <span className="text-slate-900 font-bold">JSON 数据包 / Excel</span>
                </div>
                <div className="flex justify-between">
                  <span>校验摘要:</span>
                  <span className="text-slate-900 font-bold">SHA256-8A91F92B3C</span>
                </div>
                <div className="flex justify-between">
                  <span>权属范围:</span>
                  <span className="text-emerald-600 font-bold">UNIT-001 绑定</span>
                </div>
              </div>

              <button
                onClick={handleExportPackage}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                导出资产数据包文件 (.json)
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              导出资产包 JSON 结构明细
            </h3>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              <pre>{JSON.stringify({
                export_time: new Date().toISOString(),
                target_system: selectedSystem,
                version: "2.6.0",
                data_format: "YOUK_ASSET_PACKAGE_V2",
                checksum: "SHA256-8A91F92B3C99F128A",
                unit_code: "UNIT-001",
                assets_count: 4
              }, null, 2)}</pre>
            </div>
          </div>
        </div>
      ) : (
        /* RESTful API Console */
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
                <TerminalIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">数据接口 (API) 端点</h3>
                <p className="text-xs text-slate-500">与油库综合信息系统、JD资产系统、APP数据接口</p>
              </div>
            </div>

            {apiStatus && (
              <div className="flex items-center space-x-3 font-mono text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  HTTP {apiStatus} OK
                </span>
                <span className="text-slate-500 font-bold">{latency} ms</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-xs text-slate-500 font-semibold">系统 API 端点列表:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTestApi('/assets')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold border transition-all ${
                  apiEndpoint === '/assets' ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                GET /api/v1/assets
              </button>
              <button
                onClick={() => handleTestApi('/units')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold border transition-all ${
                  apiEndpoint === '/units' ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                GET /api/v1/units
              </button>
              <button
                onClick={() => handleTestApi('/analytics')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold border transition-all ${
                  apiEndpoint === '/analytics' ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                GET /api/v1/analytics
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="text-slate-500">请求 API 端点中...</div>
              ) : apiResponse ? (
                <pre>{apiResponse}</pre>
              ) : (
                <div className="text-slate-600">点击 API 端点查看系统真实数据返回 JSON</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
