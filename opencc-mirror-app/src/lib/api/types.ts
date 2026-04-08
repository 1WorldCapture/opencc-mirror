export interface InstanceRow {
  name: string;
  display_name: string | null;
  status: string;
  instance_dir: string;
  config_dir: string;
  wrapper_path: string;
  api_key: string | null;
  base_url: string | null;
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
}
