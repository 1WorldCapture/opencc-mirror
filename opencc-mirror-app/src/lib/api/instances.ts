import { invoke } from "@tauri-apps/api/core";
import type {
  CreateInstanceInput, InstanceRow,
  ProviderRow, ProviderInput,
  McpServerRow, McpServerInput,
  SkillRow, SkillInput, InstanceIdEnabled,
} from "./types";

// --- Instances ---
export const listInstances = () => invoke<InstanceRow[]>("list_instances");
export const createInstance = (input: CreateInstanceInput) => invoke<InstanceRow>("create_instance", { input });
export const removeInstance = (name: string) => invoke<void>("remove_instance", { name });
export const launchInstance = (name: string) => invoke<void>("launch_instance", { name });
export const checkOpenclaudeInstalled = () => invoke<boolean>("check_openclaude_installed");
export const openInstanceFolder = (name: string, folder: string) => invoke<void>("open_instance_folder", { name, folder });

// --- Providers ---
export const listProviders = () => invoke<ProviderRow[]>("list_providers");
export const getProvider = (id: string) => invoke<ProviderRow | null>("get_provider", { id });
export const addProvider = (input: ProviderInput) => invoke<ProviderRow>("add_provider", { input });
export const updateProvider = (id: string, input: ProviderInput) => invoke<ProviderRow>("update_provider", { id, input });
export const deleteProvider = (id: string) => invoke<void>("delete_provider", { id });

// --- MCP Servers ---
export const listMcpServers = () => invoke<McpServerRow[]>("list_mcp_servers");
export const upsertMcpServer = (input: McpServerInput) => invoke<void>("upsert_mcp_server", { input });
export const deleteMcpServer = (id: string) => invoke<void>("delete_mcp_server", { id });
export const setInstanceMcpServers = (instanceName: string, servers: InstanceIdEnabled[]) =>
  invoke<void>("set_instance_mcp_servers", { instanceName, servers });

// --- Skills ---
export const listSkills = () => invoke<SkillRow[]>("list_skills");
export const upsertSkill = (input: SkillInput) => invoke<void>("upsert_skill", { input });
export const deleteSkill = (id: string) => invoke<void>("delete_skill", { id });
export const setInstanceSkills = (instanceName: string, skills: InstanceIdEnabled[]) =>
  invoke<void>("set_instance_skills", { instanceName, skills });
