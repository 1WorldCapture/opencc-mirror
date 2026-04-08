pub mod builder;
pub mod steps;

use std::sync::Arc;

use crate::database::Database;
use crate::error::AppError;
use crate::database::dao::{CreateInstanceInput, InstanceRow, update_instance_status, delete_instance, list_instances, get_instance, update_last_launched};

pub struct InstanceService {
    db: Arc<Database>,
}

/// Find openclaude binary path.
/// macOS GUI apps don't inherit shell PATH, so we search common locations.
pub fn find_openclaude_binary() -> Option<String> {
    // 1. Try direct PATH resolution first
    if let Ok(output) = std::process::Command::new("/usr/bin/which")
        .arg("openclaude")
        .output()
    {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() && std::path::Path::new(&path).exists() {
                return Some(path);
            }
        }
    }

    // 2. Search common macOS/Homebrew/Linux paths
    let candidates = [
        "/opt/homebrew/bin/openclaude",
        "/usr/local/bin/openclaude",
        "/usr/bin/openclaude",
        "$HOME/.local/bin/openclaude",
        "$HOME/.npm-global/bin/openclaude",
    ];

    let home = dirs::home_dir().unwrap_or_default();
    for candidate in &candidates {
        let expanded = candidate.replace("$HOME", home.to_string_lossy().as_ref());
        if std::path::Path::new(&expanded).exists() {
            return Some(expanded);
        }
    }

    // 3. Try using login shell to resolve PATH
    if let Ok(output) = std::process::Command::new("/bin/zsh")
        .args(["-l", "-c", "which openclaude"])
        .output()
    {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() && std::path::Path::new(&path).exists() {
                return Some(path);
            }
        }
    }
    // Also try bash
    if let Ok(output) = std::process::Command::new("/bin/bash")
        .args(["-l", "-c", "which openclaude"])
        .output()
    {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() && std::path::Path::new(&path).exists() {
                return Some(path);
            }
        }
    }

    None
}

impl InstanceService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub fn create(&self, input: CreateInstanceInput) -> Result<InstanceRow, AppError> {
        // Validate name
        let re = regex::Regex::new(r"^[A-Za-z0-9_][A-Za-z0-9._-]*$").unwrap();
        if !re.is_match(&input.name) {
            return Err(AppError::Validation(
                "Instance name must start with a letter, digit, or underscore and contain only letters, digits, dots, hyphens, or underscores".into()
            ));
        }

        // Check uniqueness
        if get_instance(&self.db, &input.name)?.is_some() {
            return Err(AppError::Validation(format!("Instance '{}' already exists", input.name)));
        }

        // Build paths
        let instance_dir = crate::config::get_instance_dir(&input.name);
        let config_dir = instance_dir.join("config");
        let wrapper_path = crate::config::get_wrapper_path(&input.name);

        let instance_dir_str = instance_dir.to_string_lossy().to_string();
        let config_dir_str = config_dir.to_string_lossy().to_string();
        let wrapper_path_str = wrapper_path.to_string_lossy().to_string();

        // Insert DB row with 'creating' status
        crate::database::dao::insert_instance(
            &self.db,
            &input,
            &instance_dir_str,
            &config_dir_str,
            &wrapper_path_str,
        )?;

        // Run build pipeline
        let build_ctx = builder::BuildContext::new(
            &input,
            &instance_dir,
            &config_dir,
            &wrapper_path,
        );

        match builder::build(build_ctx) {
            Ok(()) => {
                update_instance_status(&self.db, &input.name, "ready", None)?;
            }
            Err(e) => {
                update_instance_status(&self.db, &input.name, "error", Some(&e.to_string()))?;
                return Err(e);
            }
        }

        get_instance(&self.db, &input.name)?.ok_or(AppError::Instance("Instance not found after creation".into()))
    }

    pub fn remove(&self, name: &str) -> Result<(), AppError> {
        let instance = get_instance(&self.db, name)?
            .ok_or(AppError::Instance(format!("Instance '{}' not found", name)))?;

        // Remove filesystem
        let instance_dir = std::path::Path::new(&instance.instance_dir);
        if instance_dir.exists() {
            std::fs::remove_dir_all(instance_dir)?;
        }
        let wrapper = std::path::Path::new(&instance.wrapper_path);
        if wrapper.exists() {
            std::fs::remove_file(wrapper)?;
        }

        // Remove from DB
        delete_instance(&self.db, name)?;
        Ok(())
    }

    pub fn list(&self) -> Result<Vec<InstanceRow>, AppError> {
        list_instances(&self.db)
    }

    pub fn get(&self, name: &str) -> Result<Option<InstanceRow>, AppError> {
        get_instance(&self.db, name)
    }

    pub fn launch(&self, name: &str) -> Result<(), AppError> {
        let instance = get_instance(&self.db, name)?
            .ok_or(AppError::Instance(format!("Instance '{}' not found", name)))?;

        if instance.status != "ready" {
            return Err(AppError::Instance(format!("Instance '{}' is not ready (status: {})", name, instance.status)));
        }

        update_last_launched(&self.db, name)?;

        // Open terminal with the wrapper script
        #[cfg(target_os = "macos")]
        {
            std::process::Command::new("open")
                .arg("-a")
                .arg("Terminal")
                .arg(&instance.wrapper_path)
                .spawn()?;
        }
        #[cfg(target_os = "linux")]
        {
            // Try common terminal emulators
            let terminals = ["gnome-terminal", "konsole", "xterm"];
            let mut launched = false;
            for term in &terminals {
                if std::process::Command::new("which")
                    .arg(term)
                    .output()
                    .map(|o| o.status.success())
                    .unwrap_or(false)
                {
                    std::process::Command::new(term)
                        .arg("-e")
                        .arg(&instance.wrapper_path)
                        .spawn()?;
                    launched = true;
                    break;
                }
            }
            if !launched {
                return Err(AppError::Instance("No terminal emulator found".into()));
            }
        }
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("cmd")
                .args(["/C", "start", &instance.wrapper_path])
                .spawn()?;
        }

        Ok(())
    }

    /// Check if openclaude is available in PATH
    pub fn check_openclaude_installed(&self) -> bool {
        find_openclaude_binary().is_some()
    }
}
