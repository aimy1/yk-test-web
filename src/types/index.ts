export interface Asset {
  id: string;
  asset_name: string;
  equipment_no: string;
  gather_no: string;
  plate_code: string;
  code: string;
  name: string;
  category: string;
  category_id: number;
  unit_code: string;
  unit_name: string;
  location_id: string;
  location_name: string;
  specification_model: string;
  quantity: number;
  unit_price: number;
  status: string;
  install_position: string;
  manufacturer: string;
  manager: string;
  factory_code: string;
  vendor_code: string;
  jd_code: string;
  military_asset_code: string;
  prod_date: string;
  summary: string;
  extend_record_json: string;
  is_duplicate: boolean;
  has_error: boolean;
  error_msg?: string;
  audit_status: number; // 0 草稿, 1 待审核, 2 通过, 3 退回
  auditor_name: string;
  audit_opinion: string;
  audit_time: string;
  sync_status: string; // synced, pending, failed, conflict
  source_type: string;
  source: string;
  security_level?: string; // 资产涉密/安全密级
  ex_level?: string;       // 防爆安全等级
}

export interface FieldTemplate {
  id: number;
  category_id: number;
  template_type: string; // base, status, extend
  field_name: string;
  field_label: string;
  data_type: string; // string, int, decimal, date
  component_type: string; // input, number, select
  required: boolean;
  unique_flag: boolean;
  default_value: string;
  unit: string;
  validation_json: string;
  enabled: boolean;
}

export interface AuditRecord {
  id: string;
  asset_id: string;
  action: string; // submit, approve, reject
  from_status: number;
  to_status: number;
  opinion: string;
  operator_name: string;
  operate_time: string;
}

export interface Unit {
  code: string;
  name: string;
  parent_code?: string;
  level?: number;
  level_name?: string;
  manager: string;
  phone: string;
  mappings: string[];
}

export interface LocationItem {
  id: string;
  name: string;
  code: string;
  location_type: string;
  parent_id?: string;
  unit_code: string;
  area_json: string;
  hazard_zone?: string;
  ex_requirement?: string;
}

export interface CodeRule {
  id: string;
  category: string;
  prefix: string;
  digits: number;
  example: string;
  description: string;
  rule_config_json: string;
}

export interface DictionaryItem {
  id: string;
  dict_type: string;
  label: string;
  value: string;
  status: string;
  remark: string;
}

export interface Terminal {
  id: string;
  brand: string;
  model: string;
  terminal_code: string;
  unit_code: string;
  purchase_date: string;
  status: string;
}

export interface SystemUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  unit_code: string;
  role: string;
  title: string;
  phone: string;
  allow_app_login: boolean;
  permissions?: string;
  deleted?: boolean;
}

export interface AuditLog {
  id: string;
  ip: string;
  operator: String;
  action: string;
  time: string;
  details: string;
}

export interface AnalyticsData {
  summary: {
    total_assets: number;
    coded_count: number;
    pending_count: number;
    code_rate: number;
  };
  histogram: Array<{ category: string; count: number }>;
  pie_chart: Array<{ status: string; count: number }>;
  line_chart: Array<{ date: string; coded: number; pending: number }>;
}

export interface AssetCategory {
  id: number;
  parent_id: number;
  class_name: string;
  class_code: string;
  full_class_code: string;
  level: number;
  number_rule_id?: string;
  status: number;
  deleted?: boolean;
}

