use tauri::State;

use crate::database::dao::*;
use crate::error::AppError;
use crate::instance::InstanceService;
use crate::provider::ProviderPreset;
use crate::store::AppState;

// --- Instance commands ---

#[tauri::command]
pub async fn create_instance(
    input: CreateInstanceInput,
    state: State<'_, AppState>,
) -> Result<InstanceRow, AppError> {
    let service = InstanceService::new(state.db.clone());
    service.create(input)
}

#[tauri::command]
pub async fn remove_instance(
    name: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let service = InstanceService::new(state.db.clone());
    service.remove(&name)
}

#[tauri::command]
pub async fn list_instances(
    state: State<'_, AppState>,
) -> Result<Vec<InstanceRow>, AppError> {
    let service = InstanceService::new(state.db.clone());
    service.list()
}

#[tauri::command]
pub async fn get_instance(
    name: String,
    state: State<'_, AppState>,
) -> Result<Option<InstanceRow>, AppError> {
    let service = InstanceService::new(state.db.clone());
    service.get(&name)
}

#[tauri::command]
pub async fn launch_instance(
    name: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let service = InstanceService::new(state.db.clone());
    service.launch(&name)
}

#[tauri::command]
pub async fn check_openclaude_installed() -> Result<bool, AppError> {
    Ok(crate::instance::find_openclaude_binary().is_some())
}

#[tauri::command]
pub async fn open_instance_folder(
    name: String,
    folder: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let service = InstanceService::new(state.db.clone());
    let instance = service.get(&name)?
        .ok_or(AppError::Instance(format!("Instance '{}' not found", name)))?;

    let path = match folder.as_str() {
        "config" => instance.config_dir,
        "root" => instance.instance_dir,
        _ => return Err(AppError::Validation("folder must be 'config' or 'root'".into())),
    };

    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg(&path).spawn()?;
    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open").arg(&path).spawn()?;
    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer").arg(&path).spawn()?;

    Ok(())
}

// --- Provider commands ---

#[tauri::command]
pub async fn list_provider_presets() -> Result<Vec<ProviderPreset>, AppError> {
    Ok(crate::provider::list_presets(false))
}

// --- MCP Server commands ---

#[tauri::command]
pub async fn list_mcp_servers(
    state: State<'_, AppState>,
) -> Result<Vec<McpServerRow>, AppError> {
    crate::database::dao::list_mcp_servers(&state.db)
}

#[tauri::command]
pub async fn upsert_mcp_server(
    input: McpServerInput,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    crate::database::dao::upsert_mcp_server(&state.db, &input)
}

#[tauri::command]
pub async fn delete_mcp_server(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    crate::database::dao::delete_mcp_server(&state.db, &id)
}

#[tauri::command]
pub async fn get_instance_mcp_servers(
    instance_name: String,
    state: State<'_, AppState>,
) -> Result<Vec<McpServerRowWithEnabled>, AppError> {
    let rows = crate::database::dao::get_mcp_servers_for_instance(&state.db, &instance_name)?;
    Ok(rows.into_iter().map(|(server, enabled)| McpServerRowWithEnabled {
        server,
        enabled,
    }).collect())
}

#[tauri::command]
pub async fn set_instance_mcp_servers(
    instance_name: String,
    servers: Vec<InstanceIdEnabled>,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let pairs: Vec<(String, bool)> = servers.iter()
        .map(|s| (s.id.clone(), s.enabled))
        .collect();
    crate::database::dao::set_instance_mcp_servers(&state.db, &instance_name, &pairs)
}

// --- Skill commands ---

#[tauri::command]
pub async fn list_skills(
    state: State<'_, AppState>,
) -> Result<Vec<SkillRow>, AppError> {
    crate::database::dao::list_skills(&state.db)
}

#[tauri::command]
pub async fn upsert_skill(
    input: SkillInput,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    crate::database::dao::upsert_skill(&state.db, &input)
}

#[tauri::command]
pub async fn delete_skill(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    crate::database::dao::delete_skill(&state.db, &id)
}

#[tauri::command]
pub async fn get_instance_skills(
    instance_name: String,
    state: State<'_, AppState>,
) -> Result<Vec<SkillRowWithEnabled>, AppError> {
    let rows = crate::database::dao::get_skills_for_instance(&state.db, &instance_name)?;
    Ok(rows.into_iter().map(|(skill, enabled)| SkillRowWithEnabled {
        skill,
        enabled,
    }).collect())
}

#[tauri::command]
pub async fn set_instance_skills(
    instance_name: String,
    skills: Vec<InstanceIdEnabled>,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let pairs: Vec<(String, bool)> = skills.iter()
        .map(|s| (s.id.clone(), s.enabled))
        .collect();
    crate::database::dao::set_instance_skills(&state.db, &instance_name, &pairs)
}

// --- Shared types for frontend ---

#[derive(serde::Serialize, serde::Deserialize)]
pub struct InstanceIdEnabled {
    pub id: String,
    pub enabled: bool,
}

#[derive(serde::Serialize)]
pub struct McpServerRowWithEnabled {
    pub server: McpServerRow,
    pub enabled: bool,
}

#[derive(serde::Serialize)]
pub struct SkillRowWithEnabled {
    pub skill: SkillRow,
    pub enabled: bool,
}
