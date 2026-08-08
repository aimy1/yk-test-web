import {
  Asset,
  Unit,
  LocationItem,
  CodeRule,
  DictionaryItem,
  Terminal,
  SystemUser,
  AuditLog,
  AnalyticsData,
  FieldTemplate,
  AuditRecord
} from '../types';

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '127.0.0.1';
    return `http://${host}:3001/api/v1`;
  }
  return 'http://127.0.0.1:3001/api/v1';
};

const API_BASE = getApiBase();

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let tokenStr = '';
  try {
    const saved = localStorage.getItem('youk_user_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      tokenStr = parsed.token || '';
    }
  } catch (e) {}

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(tokenStr ? { 'Authorization': `Bearer ${tokenStr}` } : {}),
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    let msg = `API Error: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.message) msg = data.message;
      else if (data.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export const api = {
  // Spec 3.1 PC Data Management
  checkTempData: (fileName?: string, unitCode?: string) =>
    fetchJson<any>('/check', {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName, unit_code: unitCode }),
    }),

  receiveExternalData: (sourceType: 'JD' | 'APP', payloadSummary?: string) =>
    fetchJson<any>('/receive', {
      method: 'POST',
      body: JSON.stringify({ source_type: sourceType, payload_summary: payloadSummary }),
    }),

  getExternalCompare: () => fetchJson<any>('/compare'),

  approveExternalImport: (itemIds: string[]) =>
    fetchJson<any>('/compare/approve', {
      method: 'POST',
      body: JSON.stringify(itemIds),
    }),

  getAssets: () => fetchJson<Asset[]>('/assets'),

  saveAsset: (asset: Partial<Asset>) =>
    fetchJson<Asset>('/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    }),

  deleteAsset: (id: string) =>
    fetchJson<any>(`/assets/${id}`, { method: 'DELETE' }),

  analyzeDedupAndErrors: () =>
    fetchJson<any>('/assets/analyze', { method: 'POST' }),

  // Spec 4.3 Extendable Attribute Field Template Engine
  getFieldTemplates: (categoryId: number) =>
    fetchJson<FieldTemplate[]>(`/field-template/category/${categoryId}`),

  saveFieldTemplate: (tpl: Partial<FieldTemplate>) =>
    fetchJson<FieldTemplate>('/field-template', {
      method: 'POST',
      body: JSON.stringify(tpl),
    }),

  // Spec 4.6 Single-Stage Audit Workflow
  submitAssetAudit: (req: { asset_id: string; opinion: string; operator_name: string }) =>
    fetchJson<any>('/asset/gather/submit', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  approveAssetAudit: (req: { asset_id: string; opinion: string; operator_name: string }) =>
    fetchJson<any>('/asset/gather/approve', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  rejectAssetAudit: (req: { asset_id: string; opinion: string; operator_name: string }) =>
    fetchJson<any>('/asset/gather/reject', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  getAuditRecords: (assetId: string) =>
    fetchJson<AuditRecord[]>(`/asset/gather/audit-record/${assetId}`),

  // Spec 3.4 & 5.8 App Capabilities (3D Color Code & Sync)
  encodeColorCode: (categoryCode: string, assetNo: string) =>
    fetchJson<any>('/app/color-code/encode', {
      method: 'POST',
      body: JSON.stringify({ category_code: categoryCode, asset_no: assetNo }),
    }),

  recognizeColorCode: (colorCodeRaw: string) =>
    fetchJson<any>('/app/color-code/recognize', {
      method: 'POST',
      body: JSON.stringify({ color_code_raw: colorCodeRaw }),
    }),

  generateCodeRule: (category: string, unitCode?: string) =>
    fetchJson<any>('/code-rules/generate', {
      method: 'POST',
      body: JSON.stringify({ category, unit_code: unitCode }),
    }),

  generateCpclPrint: (assetNo: string, assetName: string, exLevel?: string, unitName?: string) =>
    fetchJson<any>('/app/color-code/print-cpcl', {
      method: 'POST',
      body: JSON.stringify({ asset_no: assetNo, asset_name: assetName, ex_level: exLevel, unit_name: unitName }),
    }),


  // Spec 3.2 System Management
  getUnits: () => fetchJson<Unit[]>('/units'),

  getUnitsTree: () => fetchJson<any[]>('/units/tree'),

  saveUnit: (unit: Unit) =>
    fetchJson<Unit>('/units', {
      method: 'POST',
      body: JSON.stringify(unit),
    }),

  deleteUnit: (code: string) =>
    fetchJson<any>(`/units/${code}`, { method: 'DELETE' }),

  getLocations: () => fetchJson<LocationItem[]>('/locations'),

  saveLocation: (loc: LocationItem) =>
    fetchJson<LocationItem>('/locations', {
      method: 'POST',
      body: JSON.stringify(loc),
    }),

  deleteLocation: (id: string) =>
    fetchJson<any>(`/locations/${id}`, { method: 'DELETE' }),

  getCodeRules: () => fetchJson<CodeRule[]>('/code-rules'),

  previewCodeRule: (prefix: string, categoryCode?: string, siteCode?: string, digits?: number) =>
    fetchJson<any>('/code-rule/preview', {
      method: 'POST',
      body: JSON.stringify({ prefix, category_code: categoryCode, site_code: siteCode, digits }),
    }),

  getDictionaries: () => fetchJson<DictionaryItem[]>('/dictionaries'),

  saveDictionary: (item: DictionaryItem) =>
    fetchJson<DictionaryItem>('/dictionaries', {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  deleteDictionary: (id: string) =>
    fetchJson<any>(`/dictionaries/${id}`, { method: 'DELETE' }),

  login: (username: string, password?: string) =>
    fetchJson<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getQrcodes: (style?: string, qrType?: string) =>
    fetchJson<any>(`/qrcodes?style=${style || 'OIL_DEPOT'}&type=${qrType || 'asset'}`),

  getAnalytics: () => fetchJson<AnalyticsData>('/analytics'),

  getTerminals: () => fetchJson<Terminal[]>('/terminals'),

  saveTerminal: (term: Terminal) =>
    fetchJson<Terminal>('/terminals', {
      method: 'POST',
      body: JSON.stringify(term),
    }),

  deleteTerminal: (id: string) =>
    fetchJson<any>(`/terminals/${id}`, { method: 'DELETE' }),

  getUsers: () => fetchJson<SystemUser[]>('/users'),

  saveUser: (user: SystemUser) =>
    fetchJson<SystemUser>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),

  deleteUser: (id: string) =>
    fetchJson<any>(`/users/${id}`, { method: 'DELETE' }),

  changePassword: (username: string, newPassword: string, oldPassword?: string) =>
    fetchJson<any>('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ username, new_password: newPassword, old_password: oldPassword }),
    }),

  exportZipPackage: () => fetchJson<any>('/assets/export-zip'),

  batchImportAssets: (items: Partial<Asset>[]) =>
    fetchJson<any>('/assets/batch-import', {
      method: 'POST',
      body: JSON.stringify(items),
    }),

  editExternalAsset: (id: string, payload: any) =>
    fetchJson<any>(`/external/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  exportCheckErrors: (fileName?: string) =>
    fetchJson<any>('/check/export', {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName }),
    }),

  getCategories: () => fetchJson<any[]>('/categories'),

  saveCategory: (cat: any) =>
    fetchJson<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    }),

  deleteCategory: (id: number) =>
    fetchJson<any>(`/categories/${id}`, { method: 'DELETE' }),

  pushApiData: (systemName?: string) =>
    fetchJson<any>('/asset/api/push', {
      method: 'POST',
      body: JSON.stringify({ system_name: systemName || '上级JD资产管理平台' }),
    }),

  pullApiData: (systemName?: string) =>
    fetchJson<any>('/asset/api/pull', {
      method: 'POST',
      body: JSON.stringify({ system_name: systemName || '网格化管理平台' }),
    }),

  getLogs: () => fetchJson<AuditLog[]>('/logs'),

  deleteLog: (id: string) =>
    fetchJson<any>(`/logs/${id}`, { method: 'DELETE' }),

  clearLogs: () =>
    fetchJson<any>('/logs/clear', { method: 'DELETE' }),
};

