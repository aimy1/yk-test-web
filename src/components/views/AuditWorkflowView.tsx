import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Send, Clock, UserCheck, MessageSquare, History } from 'lucide-react';
import { api } from '../../services/api';
import { Asset, AuditRecord } from '../../types';

export const AuditWorkflowView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<number>(1); // 1: 待审核, 2: 审核通过, 3: 被退回, 0: 草稿
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [opinion, setOpinion] = useState<string>('');

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

  const handleSelectAsset = async (asset: Asset) => {
    setSelectedAsset(asset);
    setOpinion('');
    try {
      const recs = await api.getAuditRecords(asset.id);
      setAuditRecords(recs);
    } catch (err) {
      setAuditRecords([]);
    }
  };

  const handleSubmit = async (assetId: string) => {
    try {
      await api.submitAssetAudit({ asset_id: assetId, opinion: '提交单级审核', operator_name: 'arch1' });
      alert('已成功提交审核！');
      loadAssets();
      setSelectedAsset(null);
    } catch (err) {
      alert('提交失败');
    }
  };

  const handleApprove = async (assetId: string) => {
    try {
      await api.approveAssetAudit({ asset_id: assetId, opinion: opinion || '符合油库规范，审核通过并更新正式库', operator_name: 'arch1' });
      alert('单级审核通过！数据正式更新写入档案库。');
      loadAssets();
      setSelectedAsset(null);
    } catch (err) {
      alert('审核失败');
    }
  };

  const handleReject = async (assetId: string) => {
    if (!opinion) return alert('退回操作必须填写审核意见！');
    try {
      await api.rejectAssetAudit({ asset_id: assetId, opinion, operator_name: 'arch1' });
      alert('已退回！退回意见已通知提交人。');
      loadAssets();
      setSelectedAsset(null);
    } catch (err) {
      alert('退回失败');
    }
  };

  const filteredAssets = assets.filter(a => a.audit_status === activeTab);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            单级审核管理
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            单级审核机制：提交审核（草稿➔待审核）、审核通过（待审核➔通过）、退回填写意见（待审核➔退回），全程保留审核轨迹。
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-1.5 font-semibold text-xs">
        <button
          onClick={() => setActiveTab(1)}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 1 ? 'bg-amber-500 text-white shadow-2xs font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          待审核资产 ({assets.filter(a => a.audit_status === 1).length})
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 2 ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          已审核通过 ({assets.filter(a => a.audit_status === 2).length})
        </button>
        <button
          onClick={() => setActiveTab(3)}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 3 ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          已退回件 ({assets.filter(a => a.audit_status === 3).length})
        </button>
        <button
          onClick={() => setActiveTab(0)}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 0 ? 'bg-slate-900 text-white shadow-2xs font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          草稿箱 ({assets.filter(a => a.audit_status === 0).length})
        </button>
      </div>

      {/* Main List & Audit Action Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Table */}
        <div className="md:col-span-2 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3.5 font-semibold">资产主编号</th>
                <th className="p-3.5 font-semibold">资产名称</th>
                <th className="p-3.5 font-semibold">分类</th>
                <th className="p-3.5 font-semibold">提交/来源</th>
                <th className="p-3.5 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {filteredAssets.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-blue-600">{a.equipment_no || a.code}</td>
                  <td className="p-3.5 font-sans font-bold text-slate-900">{a.asset_name || a.name}</td>
                  <td className="p-3.5 font-sans">{a.category}</td>
                  <td className="p-3.5 text-slate-500">{a.source_type}</td>
                  <td className="p-3.5 text-right">
                    {a.audit_status === 0 && (
                      <button
                        onClick={() => handleSubmit(a.id)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-sans font-semibold text-[11px] border border-blue-200"
                      >
                        <Send className="w-3 h-3 inline mr-1" /> 提交审核
                      </button>
                    )}
                    {a.audit_status !== 0 && (
                      <button
                        onClick={() => handleSelectAsset(a)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-sans font-semibold text-[11px] border border-slate-200 shadow-2xs"
                      >
                        <UserCheck className="w-3 h-3 inline mr-1 text-blue-600" /> 审核/详情
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Col: Single-Stage Audit Decision Box */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            单级审核决策控制台
          </h3>

          {selectedAsset ? (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono space-y-1">
                <div>编号: <span className="font-bold text-slate-900">{selectedAsset.equipment_no || selectedAsset.code}</span></div>
                <div>名称: <span className="font-bold text-slate-900 font-sans">{selectedAsset.asset_name || selectedAsset.name}</span></div>
                <div>状态: <span className="text-amber-600 font-bold font-sans">
                  {selectedAsset.audit_status === 1 ? '待审核' : selectedAsset.audit_status === 2 ? '已通过' : '已退回'}
                </span></div>
              </div>

              {selectedAsset.audit_status === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">审核意见 (退回必填)</label>
                    <textarea
                      rows={3}
                      value={opinion}
                      onChange={(e) => setOpinion(e.target.value)}
                      placeholder="填写审核意见..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(selectedAsset.id)}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4" /> 审核通过
                    </button>
                    <button
                      onClick={() => handleReject(selectedAsset.id)}
                      className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <XCircle className="w-4 h-4" /> 退回
                    </button>
                  </div>
                </div>
              )}

              {/* Audit History Log */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-blue-600" /> 审核轨迹流水 ({auditRecords.length})
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[11px]">
                  {auditRecords.map(r => (
                    <div key={r.id} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="flex justify-between text-slate-500">
                        <span>{r.operator_name}</span>
                        <span>{r.operate_time}</span>
                      </div>
                      <div className="text-slate-800 font-sans mt-0.5">{r.opinion}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-center py-8">
              点击左侧列表中任意待审核资产条目进行单级审核操作
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
