mod commands;
mod config;
mod database;
mod error;
mod instance;
mod provider;
mod store;

use tauri::Manager;
use store::AppState;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            config::ensure_config_dir()
                .expect("Failed to create config directory");

            let db_path = config::get_db_path();
            let db = database::Database::open(&db_path)
                .expect("Failed to open database");

            app.manage(AppState::new(db));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_instance,
            commands::remove_instance,
            commands::list_instances,
            commands::get_instance,
            commands::launch_instance,
            commands::check_openclaude_installed,
            commands::open_instance_folder,
            commands::list_provider_presets,
            commands::list_all_provider_presets,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenCC Mirror");
}
