import { invoke } from "@tauri-apps/api/core";
import type { CreateInstanceInput, InstanceRow, ProviderPreset } from "./types";

// --- Instances ---

export async function listInstances(): Promise<InstanceRow[]> {
  return invoke("list_instances");
}

export async function getInstance(name: string): Promise<InstanceRow | null> {
  return invoke("get_instance", { name });
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

export async function listAllProviderPresets(): Promise<ProviderPreset[]> {
  return invoke("list_all_provider_presets");
}
