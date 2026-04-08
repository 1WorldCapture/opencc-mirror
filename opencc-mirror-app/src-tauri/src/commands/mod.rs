use std::path::Path;
use tauri::State;

use crate::database::dao::*;
use crate::error::AppError;
use crate::instance::{InstanceService, steps::sync_instance_config};
use crate::store::AppState;

// --- Instances ---

#[tauri::command]
pub async fn create_instance(
    input: CreateInstanceInput,
    state: State<'_, AppState>,
) -> Result<InstanceRow, AppError> {
    let service = InstanceService::new(state.db.clone());
    service.create(input)
}

#[tauri::command]
pub async fn remove_instance(name: String, state: State<'_, AppState>) -> Result<(), AppError> {
    InstanceService::new(state.db.clone()).remove(&name)
}

#[tauri::command]
pub async fn list_instances(state: State<'_, AppState>) -> Result<Vec<InstanceRow>, AppError> {
    InstanceService::new(state.db.clone()).list()
}

#[tauri::command]
pub async fn launch_instance(name: String, state: State<'_, AppState>) -> Result<(), AppError> {
    InstanceService::new(state.db.clone()).launch(&name)
}

#[tauri::command]
pub async fn check_openclaude_installed() -> Result<bool, AppError> {
    Ok(crate::instance::find_openclaude_binary().is_some())
}

#[tauri::command]
pub async fn open_instance_folder(name: String, folder: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let instance = get_instance(&state.db, &name)?
        .ok_or(AppError::Instance(format!("Instance '{}' not found", name)))?;
    let path = match folder.as_str() {
        "config" => instance.config_dir,
        "root" => instance.instance_dir,
        _ => return Err(AppError::Validation("folder must be 'config' or 'root'".into())),
    };
    #[cfg(target_os = "macos")] std::process::Command::new("open").arg(&path).spawn()?;
    #[cfg(target_os = "linux")] std::process::Command::new("xdg-open").arg(&path).spawn()?;
    #[cfg(target_os = "windows")] std::process::Command::new("explorer").arg(&path).spawn()?;
    Ok(())
}

// --- Providers ---

#[tauri::command]
pub async fn list_providers(state: State<'_, AppState>) -> Result<Vec<ProviderRow>, AppError> {
    crate::database::dao::list_providers(&state.db)
}

#[tauri::command]
pub async fn get_provider(id: String, state: State<'_, AppState>) -> Result<Option<ProviderRow>, AppError> {
    crate::database::dao::get_provider(&state.db, &id)
}

#[tauri::command]
pub async fn add_provider(input: ProviderInput, state: State<'_, AppState>) -> Result<ProviderRow, AppError> {
    crate::database::dao::insert_provider(&state.db, &input)
}

#[tauri::command]
pub async fn update_provider(id: String, input: ProviderInput, state: State<'_, AppState>) -> Result<ProviderRow, AppError> {
    let provider = crate::database::dao::update_provider(&state.db, &id, &input)?;

    // Sync all instances using this provider
    let instance_names = get_instances_for_provider(&state.db, &id)?;
    let mcp_configs_for = |inst: &str| -> Result<Vec<(String, String)>, AppError> {
        get_enabled_mcp_configs(&state.db, inst)
    };
    for inst_name in &instance_names {
        if let Ok(Some(inst)) = get_instance(&state.db, inst_name) {
            let mcp = mcp_configs_for(inst_name).unwrap_or_default();
            let config_dir = Path::new(&inst.config_dir);
            let _ = sync_instance_config(config_dir, &provider.settings_config, &mcp);
        }
    }

    Ok(provider)
}

#[tauri::command]
pub async fn delete_provider(id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let users = get_instances_for_provider(&state.db, &id)?;
    if !users.is_empty() {
        return Err(AppError::Provider(format!(
            "Cannot delete: used by {} instance(s): {}",
            users.len(),
            users.join(", ")
        )));
    }
    crate::database::dao::delete_provider(&state.db, &id)
}

// --- MCP Servers ---

#[tauri::command]
pub async fn list_mcp_servers(state: State<'_, AppState>) -> Result<Vec<McpServerRow>, AppError> {
    crate::database::dao::list_mcp_servers(&state.db)
}

#[tauri::command]
pub async fn upsert_mcp_server(input: McpServerInput, state: State<'_, AppState>) -> Result<(), AppError> {
    crate::database::dao::upsert_mcp_server(&state.db, &input)
}

#[tauri::command]
pub async fn delete_mcp_server(id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    crate::database::dao::delete_mcp_server(&state.db, &id)
}

#[tauri::command]
pub async fn set_instance_mcp_servers(
    instance_name: String, servers: Vec<InstanceIdEnabled>, state: State<'_, AppState>,
) -> Result<(), AppError> {
    let pairs: Vec<(String, bool)> = servers.iter().map(|s| (s.id.clone(), s.enabled)).collect();
    crate::database::dao::set_instance_mcp_servers(&state.db, &instance_name, &pairs)
}

// --- Skills ---

#[tauri::command]
pub async fn list_skills(state: State<'_, AppState>) -> Result<Vec<SkillRow>, AppError> {
    crate::database::dao::list_skills(&state.db)
}

#[tauri::command]
pub async fn upsert_skill(input: SkillInput, state: State<'_, AppState>) -> Result<(), AppError> {
    crate::database::dao::upsert_skill(&state.db, &input)
}

#[tauri::command]
pub async fn delete_skill(id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    crate::database::dao::delete_skill(&state.db, &id)
}

#[tauri::command]
pub async fn set_instance_skills(
    instance_name: String, skills: Vec<InstanceIdEnabled>, state: State<'_, AppState>,
) -> Result<(), AppError> {
    let pairs: Vec<(String, bool)> = skills.iter().map(|s| (s.id.clone(), s.enabled)).collect();
    crate::database::dao::set_instance_skills(&state.db, &instance_name, &pairs)
}

// --- Shared types ---

#[derive(serde::Serialize, serde::Deserialize)]
pub struct InstanceIdEnabled {
    pub id: String,
    pub enabled: bool,
}
