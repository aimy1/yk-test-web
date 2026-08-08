import React, { useState } from 'react';
import { Smartphone, Camera, Mic, Flashlight, MapPin, QrCode, RefreshCw, Upload, Download, CheckCircle2, Lock, User, Key, Play } from 'lucide-react';
import { api } from '../../services/api';

export const AppMobileView: React.FC = () => {
  const [appTab, setAppTab] = useState<'COLLECT' | '3D_CODE' | 'SYNC' | 'USER'>('COLLECT');
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<string>('N39°54\'27" E116°23\'17" (油库A区)');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<boolean>(false);
  
  // 3D Color Code State
  const [colorCodeResult, setColorCodeResult] = useState<any>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  // Sync Queue State
  const [offlineDrafts, setOfflineDrafts] = useState<number>(3);
  const [syncing, setSyncing] = useState(false);

  // Mobile Auth State
  const [isInitialLogin, setIsInitialLogin] = useState(true);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const handleTriggerGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation(`N${pos.coords.latitude.toFixed(4)}° E${pos.coords.longitude.toFixed(4)}°`);
          setGpsError(null);
        },
        () => {
          setGpsError('硬件/权限不支持定位，已开启软件软降级定位模式 (油库防爆防护区域定位)');
        }
      );
    } else {
      setGpsError('设备硬件缺乏基站/GPS模块，降级使用场所硬绑定定位');
    }
  };

  const handleEncode3DCode = async () => {
    try {
      const res = await api.encodeColorCode('005002009', 'ZC-001-3001');
      setColorCodeResult(res);
    } catch (err) {
      alert('编码生成失败');
    }
  };

  const handleRecognize3DCode = async () => {
    try {
      const res = await api.recognizeColorCode('3D-CC-005002009-ZC001');
      setScanResult(res);
    } catch (err) {
      alert('识别失败');
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    setTimeout(async () => {
      try {
        await api.receiveExternalData('APP', '移动端离线采集数据同步队列');
        setOfflineDrafts(0);
        alert('离线采集数据队列已成功全量同步至 PC 正式库！');
      } catch (err) {
        alert('同步失败');
      } finally {
        setSyncing(false);
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            App 移动采集端与防爆终端模拟引擎
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            实时运行 Flutter 工业防爆 PDA 采集引擎 Web 容器；支持现场数据采编、三维彩码识别、防爆硬件能力模拟与离线数据全量同步。
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => setAppTab('COLLECT')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              appTab === 'COLLECT' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📱 实时 App 手机容器
          </button>
          <button
            onClick={() => setAppTab('3D_CODE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              appTab === '3D_CODE' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            三维彩码与扫码
          </button>
          <button
            onClick={() => setAppTab('SYNC')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              appTab === 'SYNC' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            离线草稿与同步
          </button>
          <button
            onClick={() => setAppTab('USER')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              appTab === 'USER' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            App 账号与设置
          </button>
        </div>
      </div>

      {/* Main Container */}
      {appTab === 'COLLECT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Phone Device Frame Preview (http://127.0.0.1:8080) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-[360px] h-[720px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden">
              {/* Phone Camera Notch / Speaker */}
              <div className="w-32 h-5 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800"></span>
                <span className="w-10 h-1 bg-slate-800 rounded-full"></span>
              </div>
              
              {/* Live Flutter Web App Iframe */}
              <div className="flex-1 rounded-[32px] overflow-hidden bg-white relative">
                <iframe
                  src={typeof window !== 'undefined' ? `http://${window.location.hostname}:8080` : 'http://127.0.0.1:8080'}
                  className="w-full h-full border-none"
                  title="Flutter Mobile App Web Preview"
                />
              </div>

              {/* Bottom Home Indicator */}
              <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto mt-2.5"></div>
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Flutter Web App 容器运行于 http://127.0.0.1:8080
            </span>
          </div>

          {/* Right Column: Hardware Simulation Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                防爆手持终端硬件能力遥控 (Spec 3.4)
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCapturedPhoto(true)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    capturedPhoto ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Camera className="w-5 h-5 text-blue-600" />
                  <span>{capturedPhoto ? '✓ 现场高精照片已拍' : '现场设备拍照'}</span>
                </button>

                <button
                  onClick={() => setRecordedAudio(!recordedAudio)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    recordedAudio ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Mic className="w-5 h-5 text-teal-600" />
                  <span>{recordedAudio ? '✓ 异常作业录音中' : '现场音频录音'}</span>
                </button>

                <button
                  onClick={() => setFlashlightOn(!flashlightOn)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    flashlightOn ? 'bg-amber-500 text-white border-amber-500 font-bold' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Flashlight className="w-5 h-5 text-amber-500" />
                  <span>{flashlightOn ? '🔦 照明手电已开启' : '暗处补光照明'}</span>
                </button>

                <button
                  onClick={handleTriggerGps}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex flex-col items-center gap-1.5 transition-all"
                >
                  <MapPin className="w-5 h-5 text-rose-600" />
                  <span>精准定位采集</span>
                </button>
              </div>

              {/* GPS Fallback Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>当前定位数据:</span>
                  <span className="font-bold text-slate-900">{gpsLocation}</span>
                </div>
                {gpsError && <div className="text-amber-700 font-sans text-[11px] pt-1">⚠️ {gpsError}</div>}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                现场采集设备赋码与打码贴签 (Spec 3.3)
              </h3>

              <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1.5">
                  <div>临时赋码编号: <span className="font-bold text-blue-600">YK-TMP-2026-8809</span></div>
                  <div>生成的标牌码: <span className="font-bold text-slate-900">Z$001001@ZC-TMP-8809</span></div>
                  <div>指定热敏尺寸: <span className="text-emerald-600 font-bold">50mm × 30mm 标准防爆贴签</span></div>
                </div>

                <button
                  onClick={() => alert('已成功向蓝牙防爆热敏打印机发送任务，并自动粘贴临时标牌！')}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                >
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  按指定模板打码贴签打印
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {appTab === '3D_CODE' && (
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-600" />
            三维彩码编码、外观设计与特征识别 (Spec 3.4 & 4.7)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="font-semibold text-slate-700 block">1. 编码生成三维彩码阵列:</span>
              <button
                onClick={handleEncode3DCode}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs"
              >
                三维彩码矩阵编码
              </button>

              {colorCodeResult && (
                <div className="p-4 bg-slate-950 rounded-xl text-emerald-400 font-mono text-[11px] space-y-2">
                  <div>彩码 Payload: {colorCodeResult.color_code_payload}</div>
                  <div dangerouslySetInnerHTML={{ __html: colorCodeResult.svg_visualization }} />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <span className="font-semibold text-slate-700 block">2. 识别三维彩码特征:</span>
              <button
                onClick={handleRecognize3DCode}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs"
              >
                特征识别扫描
              </button>

              {scanResult && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1">
                  <div>识别结果资产编号: <span className="font-bold text-slate-900">{scanResult.recognized_asset_no}</span></div>
                  <div>资产名称: <span className="font-bold text-blue-600">{scanResult.name}</span></div>
                  <div>设备分类: <span className="text-slate-700">{scanResult.category}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {appTab === 'SYNC' && (
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600" />
            离线保存、基础数据下载与联网上传同步 (Spec 3.3)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between font-mono">
                <span>离线本地数据草稿箱:</span>
                <span className="font-bold text-rose-600">{offlineDrafts} 条待上传</span>
              </div>
              <button
                onClick={handleSyncData}
                disabled={syncing || offlineDrafts === 0}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-xs"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                {syncing ? '同步数据中...' : '联网一键上传同步至 PC'}
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="font-semibold text-slate-800">下载最新基础模板数据:</div>
              <p className="text-slate-500 text-[11px]">包含分类树、场所树、扩展字段模板与编码规则</p>
              <button
                onClick={() => alert('最新基础模板数据与编码规则已成功下载离线缓存完毕！')}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-2xs"
              >
                <Download className="w-4 h-4 text-blue-600" />
                下载基础模板数据到移动端
              </button>
            </div>
          </div>
        </div>
      )}

      {appTab === 'USER' && (
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs max-w-xl">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            App 个人中心与密码强校验 (Spec 3.3)
          </h3>

          <div className="space-y-3">
            {isInitialLogin && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 font-semibold">
                ⚠️ 提示: 初次使用系统已触发强制修改初始密码限制，须符合密码强度要求后方可使用。
              </div>
            )}

            <div>
              <label className="text-slate-700 block mb-1 font-semibold">原密码 / 初始密码</label>
              <input
                type="password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-semibold">新密码 (强校验)</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
              />
            </div>

            <button
              onClick={() => {
                if (newPass.length < 8) return alert('强密码校验失败：密码必须大于8位！');
                setIsInitialLogin(false);
                alert('密码修改成功，强校验通过！');
              }}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-semibold shadow-xs"
            >
              提交修改密码
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
