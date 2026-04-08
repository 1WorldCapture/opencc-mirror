use tauri::State;

use crate::database::dao::{CreateInstanceInput, InstanceRow};
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

#[tauri::command]
pub async fn list_all_provider_presets() -> Result<Vec<ProviderPreset>, AppError> {
    Ok(crate::provider::list_presets(true))
}
