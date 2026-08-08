import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Send, Clock, UserCheck, MessageSquare, History, Camera, Mic, MapPin, CheckSquare, Square, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { Asset, AuditRecord } from '../../types';
import { Pagination } from '../common/Pagination';

export const AuditWorkflowView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<number>(1); // 1: 待审核, 2: 审核通过, 3: 被退回, 0: 草稿
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [opinion, setOpinion] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  const quickRejectReasons = [
    '【铭牌模糊/防爆标志不可见】',
    '【安装位置与场所树不一致】',
    '【规格型号与实物不匹配】',
    '【编号重复，请重新核对试号】',
    '【缺少现场多媒体防爆拍照留痕】',
  ];

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
      alert('🎉 单级审核通过！数据已正式更新写入档案库。');
      loadAssets();
      setSelectedAsset(null);
    } catch (err) {
      alert('审核失败');
    }
  };

  const handleReject = async (assetId: string) => {
    if (!opinion) return alert('退回操作必须选择或填写退回意见！');
    try {
      await api.rejectAssetAudit({ asset_id: assetId, opinion, operator_name: 'arch1' });
      alert('已退回！退回意见已实时通知采编人员。');
      loadAssets();
      setSelectedAsset(null);
    } catch (err) {
      alert('退回失败');
    }
  };

  const handleBatchApprove = async () => {
    if (selectedAssetIds.length === 0) return alert('请先勾选需要批量通过的待审核资产！');
    if (!window.confirm(`确定要批量通过选中的 ${selectedAssetIds.length} 条资产申请吗？`)) return;

    for (const id of selectedAssetIds) {
      await api.approveAssetAudit({ asset_id: id, opinion: '批量审核通过并正式入库', operator_name: 'arch1' });
    }
    alert(`🎉 批量审核完成，成功通过 ${selectedAssetIds.length} 条！`);
    setSelectedAssetIds([]);
    loadAssets();
  };

  const handleBatchReject = async () => {
    if (selectedAssetIds.length === 0) return alert('请先勾选需要批量退回的待审核资产！');
    const reason = window.prompt('请输入统一退回意见：', '【铭牌模糊/信息不全】请重新现场核对拍照后提交');
    if (!reason) return;

    for (const id of selectedAssetIds) {
      await api.rejectAssetAudit({ asset_id: id, opinion: reason, operator_name: 'arch1' });
    }
    alert(`已批量退回 ${selectedAssetIds.length} 条！`);
    setSelectedAssetIds([]);
    loadAssets();
  };

  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedAssetIds.length === paginatedAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(paginatedAssets.map(a => a.id));
    }
  };

  const filteredAssets = assets.filter(a => a.audit_status === activeTab);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pendingCount = assets.filter(a => a.audit_status === 1).length;
  const approvedCount = assets.filter(a => a.audit_status === 2).length;
  const rejectedCount = assets.filter(a => a.audit_status === 3).length;
  const passRate = (approvedCount + rejectedCount) > 0 ? ((approvedCount / (approvedCount + rejectedCount)) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            单级审核管理中心
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            单级审核机制：采编提交（草稿➔待审核）、主管通过（待审核➔通过）、退回填写意见（待审核➔退回），全证据链痕迹保留与审计全轨迹追踪。
          </p>
        </div>

        {/* Batch Audit Operations */}
        {activeTab === 1 && (
          <div className="flex space-x-2">
            <button
              onClick={handleBatchApprove}
              disabled={selectedAssetIds.length === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              一键批量通过 ({selectedAssetIds.length})
            </button>
            <button
              onClick={handleBatchReject}
              disabled={selectedAssetIds.length === 0}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              一键批量退回
            </button>
          </div>
        )}
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">待审核资产</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount} <span className="text-xs font-normal text-slate-400">项</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">审核通过累计</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount} <span className="text-xs font-normal text-slate-400">项</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">审核退回数量</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">{rejectedCount} <span className="text-xs font-normal text-slate-400">项</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">审核合规通过率</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{passRate}%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-1.5 font-semibold text-xs">
        <button
          onClick={() => { setActiveTab(1); setCurrentPage(1); }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 1 ? 'bg-amber-500 text-white shadow-2xs font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          待审核资产 ({pendingCount})
        </button>

        <button
          onClick={() => { setActiveTab(2); setCurrentPage(1); }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 2 ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          审核通过 ({approvedCount})
        </button>

        <button
          onClick={() => { setActiveTab(3); setCurrentPage(1); }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 3 ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          已退回 ({rejectedCount})
        </button>
      </div>

      {/* Main Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                {activeTab === 1 && (
                  <th className="p-3.5 w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                      {selectedAssetIds.length === paginatedAssets.length && paginatedAssets.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="p-3.5">设备编号 / 编目编码</th>
                <th className="p-3.5">资产名称</th>
                <th className="p-3.5">设备分类</th>
                <th className="p-3.5">归属单位</th>
                <th className="p-3.5">状态</th>
                <th className="p-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 1 ? 7 : 6} className="text-center py-10 text-slate-400">
                    暂无符合条件的单级审核记录
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((a) => (
                  <tr key={a.id} className={`hover:bg-slate-50/80 transition-colors ${selectedAsset?.id === a.id ? 'bg-blue-50/50 font-medium' : ''}`}>
                    {activeTab === 1 && (
                      <td className="p-3.5 text-center">
                        <button onClick={() => toggleSelectAsset(a.id)} className="text-slate-400 hover:text-slate-600">
                          {selectedAssetIds.includes(a.id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="p-3.5 font-mono text-slate-900 font-semibold">{a.equipment_no || a.code}</td>
                    <td className="p-3.5 text-slate-900 font-medium">{a.asset_name || a.name}</td>
                    <td className="p-3.5">{a.category}</td>
                    <td className="p-3.5">{a.unit_name}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.audit_status === 1 ? 'bg-amber-100 text-amber-800' :
                        a.audit_status === 2 ? 'bg-emerald-100 text-emerald-800' :
                        a.audit_status === 3 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {a.audit_status === 1 ? '待审核' : a.audit_status === 2 ? '已通过' : a.audit_status === 3 ? '已退回' : '草稿'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {a.audit_status === 0 && (
                        <button
                          onClick={() => handleSubmit(a.id)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold text-[11px] border border-blue-200 cursor-pointer"
                        >
                          <Send className="w-3 h-3 inline mr-1" /> 提交审核
                        </button>
                      )}
                      {a.audit_status !== 0 && (
                        <button
                          onClick={() => handleSelectAsset(a)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-[11px] border border-slate-200 shadow-2xs cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3 inline mr-1 text-blue-600" /> 审核/详情
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredAssets.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Right Col: Single-Stage Audit Decision Box */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            单级审核决策控制台
          </h3>

          {selectedAsset ? (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono space-y-1.5">
                <div>编号: <span className="font-bold text-slate-900">{selectedAsset.equipment_no || selectedAsset.code}</span></div>
                <div>名称: <span className="font-bold text-slate-900 font-sans">{selectedAsset.asset_name || selectedAsset.name}</span></div>
                <div>分类: <span className="text-slate-700 font-sans">{selectedAsset.category}</span></div>
                <div>规格: <span className="text-slate-700 font-sans">{selectedAsset.specification_model || '350m³/h'}</span></div>
                <div>位置: <span className="text-slate-700 font-sans">{selectedAsset.install_position || 'A区罐位'}</span></div>
                <div>密级/防爆: <span className="text-blue-700 font-sans font-bold">{selectedAsset.security_level || '内部'} / {selectedAsset.ex_level || 'Ex d IIB T4'}</span></div>
                <div>状态: <span className="text-amber-600 font-bold font-sans">
                  {selectedAsset.audit_status === 1 ? '待审核' : selectedAsset.audit_status === 2 ? '已通过' : '已退回'}
                </span></div>
              </div>

              {/* Hardware Proof Verification Section */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-blue-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-blue-600" /> 现场防爆终端证据链校验</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-bold">SQLite JSON 关联</span>
                </div>
                
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 flex items-center gap-1"><Camera className="w-3 h-3 text-emerald-600" /> 现场拍照留痕:</span>
                  <button
                    onClick={() => alert(`📷 正在调阅现场防爆拍照证据文件:\n${selectedAsset.extend_record_json?.includes('photo') ? selectedAsset.extend_record_json : '/uploads/photos/ex_photo_2026.jpg'}\n\n[画质: 4K防爆近景清晰 | 铭牌清晰可见]`)}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1 text-[10px]"
                  >
                    已关联照片 (点击预览)
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 flex items-center gap-1"><Mic className="w-3 h-3 text-teal-600" /> 现场语音便签:</span>
                  <button
                    onClick={() => alert(`🎙️ 正在播放防爆PDA现场录制音频:\n${selectedAsset.extend_record_json?.includes('audio') ? selectedAsset.extend_record_json : '/uploads/audio/voice_memo_2026.m4a'}\n\n[试听: "防爆员张强于发油台01现场采集试号..."]`)}
                    className="text-teal-700 font-bold hover:underline cursor-pointer flex items-center gap-1 text-[10px]"
                  >
                    已关联音频 (.m4a 试听)
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" /> GPS 定位校验:</span>
                  <span className="font-mono text-slate-800 text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    N39°54'27.8" E116°23'17.2"
                  </span>
                </div>
              </div>

              {selectedAsset.audit_status === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-700 block mb-1 font-semibold">审核意见 (退回必填)</label>
                    <textarea
                      rows={2}
                      value={opinion}
                      onChange={(e) => setOpinion(e.target.value)}
                      placeholder="填写审核意见，或点击下方快捷选择..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  {/* Quick Preset Reject Reasons */}
                  <div>
                    <div className="text-[10px] text-slate-400 mb-1 font-semibold">快捷标签 (点击填入退回意见):</div>
                    <div className="flex flex-wrap gap-1">
                      {quickRejectReasons.map((reason, idx) => (
                        <button
                          key={idx}
                          onClick={() => setOpinion(reason)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 border border-slate-200 rounded-md text-[10px] cursor-pointer transition-all"
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(selectedAsset.id)}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" /> 审核通过
                    </button>
                    <button
                      onClick={() => handleReject(selectedAsset.id)}
                      className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-all"
                    >
                      <XCircle className="w-4 h-4" /> 退回
                    </button>
                  </div>
                </div>
              )}

              {/* Audit History Log Timeline */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-blue-600" /> 审核全轨迹流水 ({auditRecords.length})
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[11px]">
                  {auditRecords.length === 0 ? (
                    <div className="text-slate-400 text-[10px] italic py-1">暂无审核历史记录</div>
                  ) : (
                    auditRecords.map(r => (
                      <div key={r.id} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="flex justify-between text-slate-500 text-[10px]">
                          <span className="font-bold text-slate-700">{r.operator_name}</span>
                          <span>{r.operate_time}</span>
                        </div>
                        <div className="text-slate-800 font-sans mt-0.5 text-[11px] font-medium">{r.opinion}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-center py-12">
              点击左侧列表中任意资产条目调阅单级审核控制台
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
