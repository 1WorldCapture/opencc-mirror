mod commands;
mod config;
mod database;
mod error;
mod instance;
mod provider;
mod store;
mod tray;

use tauri::{Manager, WindowEvent};
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

            // Maximize and show the main window on launch
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.maximize();
                let _ = window.show();
            }

            // On window close requested: hide to tray instead of quitting
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }

            // Setup system tray
            tray::setup_tray(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_instance,
            commands::remove_instance,
            commands::list_instances,
            commands::launch_instance,
            commands::check_openclaude_installed,
            commands::open_instance_folder,
            commands::list_providers,
            commands::get_provider,
            commands::add_provider,
            commands::update_provider,
            commands::delete_provider,
            commands::list_mcp_servers,
            commands::upsert_mcp_server,
            commands::delete_mcp_server,
            commands::set_instance_mcp_servers,
            commands::list_skills,
            commands::upsert_skill,
            commands::delete_skill,
            commands::set_instance_skills,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenCC Mirror");
}
