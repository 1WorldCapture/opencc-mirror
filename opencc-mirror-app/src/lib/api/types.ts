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
  mcp_server_ids?: string[];
  skill_ids?: string[];
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

export interface McpServerRow {
  id: string;
  name: string;
  server_config: string;
  description: string | null;
  created_at: number;
}

export interface McpServerInput {
  id: string;
  name: string;
  server_config: string;
  description?: string;
}

export interface McpServerWithEnabled {
  server: McpServerRow;
  enabled: boolean;
}

export interface SkillRow {
  id: string;
  name: string;
  description: string | null;
  directory: string;
  created_at: number;
}

export interface SkillInput {
  id: string;
  name: string;
  description?: string;
  directory: string;
}

export interface SkillWithEnabled {
  skill: SkillRow;
  enabled: boolean;
}

export interface InstanceIdEnabled {
  id: string;
  enabled: boolean;
}
