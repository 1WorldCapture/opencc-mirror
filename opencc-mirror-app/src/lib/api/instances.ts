import { invoke } from "@tauri-apps/api/core";
import type {
  CreateInstanceInput, InstanceRow, ProviderPreset,
  McpServerRow, McpServerInput, McpServerWithEnabled,
  SkillRow, SkillInput, SkillWithEnabled, InstanceIdEnabled,
} from "./types";

// --- Instances ---

export async function listInstances(): Promise<InstanceRow[]> {
  return invoke("list_instances");
}

export async function createInstance(input: CreateInstanceInput): Promise<InstanceRow> {
  return invoke("create_instance", { input });
}

export async function removeInstance(name: string): Promise<void> {
  return invoke("remove_instance", { name });
}

export async function launchInstance(name: string): Promise<void> {
  return invoke("launch_instance", { name });
}

export async function checkOpenclaudeInstalled(): Promise<boolean> {
  return invoke("check_openclaude_installed");
}

export async function openInstanceFolder(name: string, folder: string): Promise<void> {
  return invoke("open_instance_folder", { name, folder });
}

// --- Providers ---

export async function listProviderPresets(): Promise<ProviderPreset[]> {
  return invoke("list_provider_presets");
}

// --- MCP Servers ---

export async function listMcpServers(): Promise<McpServerRow[]> {
  return invoke("list_mcp_servers");
}

export async function upsertMcpServer(input: McpServerInput): Promise<void> {
  return invoke("upsert_mcp_server", { input });
}

export async function deleteMcpServer(id: string): Promise<void> {
  return invoke("delete_mcp_server", { id });
}

export async function getInstanceMcpServers(instanceName: string): Promise<McpServerWithEnabled[]> {
  return invoke("get_instance_mcp_servers", { instanceName });
}

export async function setInstanceMcpServers(instanceName: string, servers: InstanceIdEnabled[]): Promise<void> {
  return invoke("set_instance_mcp_servers", { instanceName, servers });
}

// --- Skills ---

export async function listSkills(): Promise<SkillRow[]> {
  return invoke("list_skills");
}

export async function upsertSkill(input: SkillInput): Promise<void> {
  return invoke("upsert_skill", { input });
}

export async function deleteSkill(id: string): Promise<void> {
  return invoke("delete_skill", { id });
}

export async function getInstanceSkills(instanceName: string): Promise<SkillWithEnabled[]> {
  return invoke("get_instance_skills", { instanceName });
}

export async function setInstanceSkills(instanceName: string, skills: InstanceIdEnabled[]): Promise<void> {
  return invoke("set_instance_skills", { instanceName, skills });
}
