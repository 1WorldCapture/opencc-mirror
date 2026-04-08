use std::path::PathBuf;

/// Get the application config directory: ~/.opencc-mirror/
pub fn get_app_config_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Cannot determine home directory");
    home.join(".opencc-mirror")
}

/// Get the database path
pub fn get_db_path() -> PathBuf {
    get_app_config_dir().join("opencc-mirror.db")
}

/// Get the instances root directory
pub fn get_instances_dir() -> PathBuf {
    get_app_config_dir().join("instances")
}

/// Get a specific instance directory
pub fn get_instance_dir(name: &str) -> PathBuf {
    get_instances_dir().join(name)
}

/// Get the wrapper script directory (~/.local/bin/)
pub fn get_wrapper_bin_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Cannot determine home directory");
    home.join(".local").join("bin")
}

/// Get the wrapper script path for an instance
pub fn get_wrapper_path(name: &str) -> PathBuf {
    get_wrapper_bin_dir().join(name)
}

/// Ensure the application config directory exists
pub fn ensure_config_dir() -> Result<(), std::io::Error> {
    let dir = get_app_config_dir();
    std::fs::create_dir_all(&dir)?;
    std::fs::create_dir_all(get_instances_dir())?;
    std::fs::create_dir_all(get_wrapper_bin_dir())?;
    Ok(())
}
