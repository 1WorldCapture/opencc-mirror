export interface ModelOverrides {
  sonnet?: string;
  opus?: string;
  haiku?: string;
  small_fast?: string;
  default_model?: string;
  subagent_model?: string;
}

export interface InstanceRow {
  name: string;
  display_name: string | null;
  status: string;
  instance_dir: string;
  config_dir: string;
  wrapper_path: string;
  api_key: string | null;
  base_url: string | null;
  provider_key: string | null;
  model_overrides: ModelOverrides | null;
  created_at: number;
  updated_at: number | null;
  last_launched_at: number | null;
  error_message: string | null;
}

export interface CreateInstanceInput {
  name: string;
  display_name?: string;
  api_key?: string;
  base_url?: string;
  provider_key?: string;
  model_overrides?: ModelOverrides;
}

export interface ProviderPreset {
  key: string;
  label: string;
  description: string;
  base_url: string;
  env: Record<string, string>;
  api_key_label: string;
  auth_mode: string;
  requires_model_mapping: boolean;
  credential_optional: boolean;
  experimental: boolean;
  display_order: number;
}
