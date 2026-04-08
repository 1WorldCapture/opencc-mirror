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
  provider_id: string | null;
  provider_name: string | null;
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
  provider_id?: string;
  model_overrides?: ModelOverrides;
  mcp_server_ids?: string[];
  skill_ids?: string[];
}

export interface ProviderRow {
  id: string;
  name: string;
  settings_config: string;
  base_url: string | null;
  api_key_field: string | null;
  website_url: string | null;
  category: string | null;
  icon: string | null;
  icon_color: string | null;
  preset_key: string | null;
  created_at: number;
  updated_at: number | null;
}

export interface ProviderInput {
  id?: string;
  name: string;
  settings_config: string;
  base_url?: string;
  api_key_field?: string;
  website_url?: string;
  category?: string;
  icon?: string;
  icon_color?: string;
  preset_key?: string;
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

export interface InstanceIdEnabled {
  id: string;
  enabled: boolean;
}
