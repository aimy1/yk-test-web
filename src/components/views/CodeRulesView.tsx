import React, { useState, useEffect } from 'react';
import { Barcode, Download, Search, Sparkles, Copy, Check } from 'lucide-react';
import { api } from '../../services/api';
import { CodeRule } from '../../types';
import * as XLSX from 'xlsx';

export const CodeRulesView: React.FC = () => {
  const [rules, setRules] = useState<CodeRule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [testCat, setTestCat] = useState<string>('输油泵类');
  const [genPreviewCode, setGenPreviewCode] = useState<string>('YK-PUMP-2026-0005');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    api.getCodeRules().then(data => {
      setRules(data);
    });
  }, []);

  const handleTestGenerate = () => {
    const found = rules.find(r => r.category === testCat);
    if (found) {
      const num = Math.floor(Math.random() * 9000 + 1000);
      setGenPreviewCode(`${found.prefix}2026-${num}`);
    }
  };

  const handleCopyPrefix = (prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedId(prefix);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    const data = rules.map(r => ({
      '规则编号': r.id,
      '设备分类': r.category,
      '编码前缀': r.prefix,
      '流水号位数': r.digits,
      '标准示例': r.example,
      '规则说明': r.description,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "编码规则表");
    XLSX.writeFile(wb, "油库设备设施分类与编目编码规则表.xlsx");
  };

  const filtered = rules.filter(r => r.category.includes(searchTerm) || r.prefix.includes(searchTerm) || r.description.includes(searchTerm));

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Barcode className="w-5 h-5 text-blue-600" />
            编码规则管理 (统一编目编码规则)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            对油库设备设施分类进行统一编目编码，通过查询条件查询分类规则，并将规则导出成 EXCEL 文件。
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            导出规则 Excel
          </button>
          <button
            onClick={() => {
              const catName = prompt('请输入新建设备分类名称:', '消防安防类');
              if (!catName) return;
              const prefixStr = prompt('请输入统一编码前缀:', 'YK-FIRE-');
              if (!prefixStr) return;
              const newRule: CodeRule = {
                id: `CR-0${rules.length + 1}`,
                category: catName,
                prefix: prefixStr,
                digits: 4,
                example: `${prefixStr}2026-0001`,
                description: `${catName}统一编目编号规则`,
                rule_config_json: '{}',
              };
              setRules([...rules, newRule]);
              alert('编码规则新增成功！已自动生效于编码引擎。');
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            新增编码规则
          </button>
        </div>
      </div>

      {/* Code Rule Generator */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" /> 编码生成规则:
          </span>
          <select
            value={testCat}
            onChange={(e) => setTestCat(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold"
          >
            {rules.map(r => (
              <option key={r.id} value={r.category}>{r.category}</option>
            ))}
          </select>
          <button
            onClick={handleTestGenerate}
            className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold border border-blue-200"
          >
            生成编目编码示例
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900 text-white px-3.5 py-1.5 rounded-xl shadow-2xs">
          <span className="text-slate-400">编目编码示例:</span>
          <span className="font-bold text-cyan-400">{genPreviewCode}</span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="检索设备分类、编码前缀或规则描述..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-slate-800 focus:outline-none w-full font-mono"
        />
      </div>

      {/* Rules Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3.5 font-semibold">规则编号</th>
              <th className="p-3.5 font-semibold">设备分类</th>
              <th className="p-3.5 font-semibold">统一编码前缀</th>
              <th className="p-3.5 font-semibold">流水位数</th>
              <th className="p-3.5 font-semibold">编目生成示例</th>
              <th className="p-3.5 font-semibold">规则说明</th>
              <th className="p-3.5 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-mono text-slate-400">{r.id}</td>
                <td className="p-3.5 font-sans font-bold text-slate-900">{r.category}</td>
                <td className="p-3.5 font-mono font-bold text-blue-600">{r.prefix}</td>
                <td className="p-3.5 font-mono">{r.digits} 位数字</td>
                <td className="p-3.5 font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg w-fit border border-slate-200">
                  {r.example}
                </td>
                <td className="p-3.5 font-sans text-slate-500">{r.description}</td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleCopyPrefix(r.prefix)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-medium shadow-2xs"
                  >
                    {copiedId === r.prefix ? (
                      <span className="text-emerald-600 font-bold"><Check className="w-3 h-3 inline mr-1" /> 已复制</span>
                    ) : (
                      <span><Copy className="w-3 h-3 inline mr-1 text-slate-400" /> 复制前缀</span>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
