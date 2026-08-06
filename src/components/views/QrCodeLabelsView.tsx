import React, { useState, useEffect } from 'react';
import { QrCode as QrIcon, Printer, Download, Sparkles, Image as ImageIcon, Maximize2, Sliders, MapPin, Package, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';

interface QrCodeLabelsViewProps {
  onShowToast?: (type: 'success' | 'warning' | 'info' | 'error', title: string, desc?: string) => void;
}

export const QrCodeLabelsView: React.FC<QrCodeLabelsViewProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'ASSET' | 'LOCATION'>('ASSET');
  const [style, setStyle] = useState<'OIL_DEPOT' | 'JD'>('OIL_DEPOT');
  const [size, setSize] = useState<'STANDARD' | 'LARGE'>('STANDARD');
  const [qrcodes, setQrcodes] = useState<any[]>([]);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [selectedPreview, setSelectedPreview] = useState<any | null>(null);

  const loadQrs = async () => {
    try {
      const data = await api.getQrcodes(style, activeTab.toLowerCase());
      setQrcodes(data.qrcodes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadQrs();
  }, [style, activeTab]);

  // Generate ISO-18004 Standard Scannable QR Code Data URLs
  useEffect(() => {
    const generateAllQrDataUrls = async () => {
      const urls: Record<string, string> = {};
      const qrFn = QRCode.toDataURL || (QRCode as any).default?.toDataURL;

      for (const item of qrcodes) {
        if (item.qr_payload && typeof qrFn === 'function') {
          try {
            const dataUrl = await qrFn(item.qr_payload, {
              errorCorrectionLevel: 'H',
              margin: 2,
              width: 300,
              color: {
                dark: style === 'JD' ? '#E1251B' : '#0F172A',
                light: '#FFFFFF',
              },
            });
            urls[item.qr_payload] = dataUrl;
          } catch (err) {
            console.error('QR Generation failed:', err);
          }
        }
      }
      setQrDataUrls(urls);
    };

    if (qrcodes.length > 0) {
      generateAllQrDataUrls();
    }
  }, [qrcodes, style]);

  const handleExportExcel = () => {
    if (activeTab === 'ASSET') {
      const data = qrcodes.map((q) => ({
        '资产ID': q.asset_id,
        '资产编目编码': q.asset_code,
        '资产主编号': q.equipment_no,
        '标牌码': q.plate_code,
        '资产名称': q.asset_name,
        '设备分类': q.category,
        '管理单位': q.unit_name,
        '场所位置': q.location_name,
        '责任人': q.manager,
        '生产厂家': q.manufacturer,
        '二维码样式': q.style_name,
        '二维码标准解析数据(Payload)': q.qr_payload,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "资产二维码列表");
      XLSX.writeFile(wb, `油库设备资产二维码列表_${style}_${Date.now()}.xlsx`);
    } else {
      const data = qrcodes.map((q) => ({
        '场所ID': q.id,
        '场所编码': q.location_code,
        '场所名称': q.location_name,
        '场所类型': q.location_type,
        '所属单位代码': q.unit_code,
        '所属单位': q.unit_name,
        '二维码样式': q.style_name,
        '二维码标准解析数据(Payload)': q.qr_payload,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "场所二维码列表");
      XLSX.writeFile(wb, `油库场所二维码列表_${style}_${Date.now()}.xlsx`);
    }

    onShowToast?.('success', 'Excel 导出成功', `全量${activeTab === 'ASSET' ? '资产' : '场所'}二维码属性列表已导出！`);
  };

  const handlePrint = () => {
    onShowToast?.('info', '启动高精标签打印引擎', '格式化生成标准排版标贴，发送至打印机...');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Printable CSS style override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-label-area, .printable-label-area * {
            visibility: visible;
          }
          .printable-label-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 15px !important;
            padding: 10px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Title Header */}
      <div className="no-print bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <QrIcon className="w-5 h-5 text-blue-600" />
            标签标牌 (支持真实手机/手持防爆扫码设备扫码)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            生成标准 ISO/IEC 18004 规范真实二维码（支持手机相机、微信、手持 PDA 设备扫码解包）及 EX 防爆铭牌。
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            导出{activeTab === 'ASSET' ? '资产' : '场所'}二维码列表 EXCEL
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            在线打印标签高清图
          </button>
        </div>
      </div>

      {/* Mode & Style Controller */}
      <div className="no-print bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Row 1: Mode Switcher & Label Spec */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-800 whitespace-nowrap">标牌生成模式:</span>
            <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 space-x-1">
              <button
                onClick={() => setActiveTab('ASSET')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'ASSET'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-cyan-400" />
                <span>资产二维码标签 (Items 33, 34)</span>
              </button>
              <button
                onClick={() => setActiveTab('LOCATION')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'LOCATION'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>场所二维码标签 (Items 35, 36)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="font-semibold whitespace-nowrap">标贴规格尺寸:</span>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-slate-400"
            >
              <option value="STANDARD">标准工业标贴 (50mm × 30mm)</option>
              <option value="LARGE">罐区大号铭牌 (80mm × 50mm)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Template Style Switcher & ISO Badge */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
              <Sliders className="w-4 h-4 text-slate-400" />
              标签视觉模板:
            </span>
            <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 space-x-1">
              <button
                onClick={() => setStyle('OIL_DEPOT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  style === 'OIL_DEPOT'
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1.5 text-cyan-400" />
                油库综合管理系统防爆铭牌 (Ex 工业级)
              </button>
              <button
                onClick={() => setStyle('JD')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  style === 'JD'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 inline mr-1.5 text-rose-200" />
                JD 资产管理系统标准标签 (标准电商红)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/80 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>符合 ISO/IEC 18004 国际标准 (真实手机/扫描枪可直接扫码解包)</span>
          </div>
        </div>
      </div>

      {/* Label Grid - Responsive 4 Columns / 2 Columns */}
      <div className="printable-label-area grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {qrcodes.map((qr, idx) => {
          const isJd = style === 'JD';
          const qrSrc = qrDataUrls[qr.qr_payload];

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all duration-300 shadow-2xs relative overflow-hidden flex flex-col justify-between ${
                isJd
                  ? 'bg-white border-rose-200 hover:border-rose-400 hover:shadow-md'
                  : 'bg-white border-slate-200/90 hover:border-slate-400 hover:shadow-md'
              } ${size === 'LARGE' ? 'min-h-[240px]' : 'min-h-[210px]'}`}
            >
              {/* Card Top Banner */}
              <div className={`flex justify-between items-start border-b pb-2.5 mb-3 gap-2 ${
                isJd ? 'border-rose-100' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {isJd ? (
                    <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider shrink-0">
                      JD 资产
                    </span>
                  ) : (
                    <span className="bg-slate-900 text-cyan-400 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" /> EX 防爆铭牌
                    </span>
                  )}
                  <h4 className="font-bold text-xs text-slate-900 leading-tight truncate" title={activeTab === 'ASSET' ? qr.asset_name : qr.location_name}>
                    {activeTab === 'ASSET' ? qr.asset_name : qr.location_name}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">{qr.style_name}</span>
              </div>

              {/* Card Main Section (QR Image + Details) */}
              <div className="flex items-start space-x-3.5 flex-1">
                {/* Standard Scannable QR Code Image */}
                <div
                  onClick={() => setSelectedPreview(qr)}
                  className="w-24 h-24 bg-white border border-slate-200 rounded-xl p-1 flex flex-col items-center justify-center shrink-0 cursor-pointer hover:border-cyan-500 transition-colors shadow-2xs group relative"
                  title="点击查看放大高清扫码图"
                >
                  {qrSrc ? (
                    <img src={qrSrc} alt="QR Code" className="w-full h-full object-contain rounded" />
                  ) : (
                    <div className="text-[9px] text-slate-400 font-mono animate-pulse text-center">生成中...</div>
                  )}
                  <div className="no-print absolute inset-0 bg-slate-900/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-1 text-[11px] font-mono text-slate-700 flex-1 min-w-0">
                  {activeTab === 'ASSET' ? (
                    <>
                      <div className="font-bold text-slate-900 text-[11px] truncate" title={qr.equipment_no || qr.asset_code}>
                        <span className="text-slate-400 font-normal">编号:</span> {qr.equipment_no || qr.asset_code}
                      </div>
                      <div className="text-slate-600 font-sans truncate" title={qr.category}>
                        <span className="text-slate-400 font-normal font-mono">分类:</span> {qr.category}
                      </div>
                      <div className="text-slate-600 font-sans truncate" title={qr.location_name}>
                        <span className="text-slate-400 font-normal font-mono">场所:</span> {qr.location_name}
                      </div>
                      <div className="text-slate-500 font-sans truncate">
                        <span className="text-slate-400 font-normal font-mono">责任人:</span> {qr.manager || 'arch1'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-slate-900 text-[11px] truncate" title={qr.location_code}>
                        <span className="text-slate-400 font-normal">代码:</span> {qr.location_code}
                      </div>
                      <div className="text-slate-600 font-sans truncate" title={qr.location_name}>
                        <span className="text-slate-400 font-normal font-mono">名称:</span> {qr.location_name}
                      </div>
                      <div className="text-slate-600 font-sans truncate" title={qr.location_type}>
                        <span className="text-slate-400 font-normal font-mono">类型:</span> {qr.location_type}
                      </div>
                      <div className="text-slate-500 font-sans truncate" title={qr.unit_name}>
                        <span className="text-slate-400 font-normal font-mono">单位:</span> {qr.unit_name}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom Payload Raw String */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[9px] font-mono text-slate-400 truncate flex items-center justify-between">
                <span className="truncate">Payload: {qr.qr_payload}</span>
                <span className="text-emerald-600 font-bold shrink-0 ml-1">ISO-18004</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zoom Modal */}
      {selectedPreview && (
        <div className="no-print fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl text-center">
            <h3 className="text-sm font-bold text-slate-900">
              {activeTab === 'ASSET' ? selectedPreview.asset_name : selectedPreview.location_name} - 高清扫码预览
            </h3>
            <div className="w-56 h-56 mx-auto bg-white border border-slate-200 rounded-2xl p-2 flex flex-col items-center justify-center shadow-inner">
              {qrDataUrls[selectedPreview.qr_payload] ? (
                <img
                  src={qrDataUrls[selectedPreview.qr_payload]}
                  alt="Standard QR Code"
                  className="w-full h-full object-contain"
                />
              ) : null}
            </div>
            <div className="text-xs text-slate-700 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 break-all">
              {selectedPreview.qr_payload}
            </div>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 提示：可用手机微信或手持 PDA 扫描此二维码进行测试
            </p>
            <button
              onClick={() => setSelectedPreview(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              关闭预览
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
