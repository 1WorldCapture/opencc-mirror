use crate::database::Database;
use crate::error::AppError;

const SCHEMA_V1: &str = r#"
CREATE TABLE IF NOT EXISTS instances (
    name TEXT PRIMARY KEY,
    display_name TEXT,
    status TEXT NOT NULL DEFAULT 'creating',
    instance_dir TEXT NOT NULL,
    config_dir TEXT NOT NULL,
    wrapper_path TEXT NOT NULL,
    api_key TEXT,
    base_url TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    last_launched_at INTEGER,
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
"#;

const MIGRATION_V2: &str = r#"
ALTER TABLE instances ADD COLUMN provider_key TEXT DEFAULT '';
ALTER TABLE instances ADD COLUMN model_overrides TEXT DEFAULT '{}';
"#;

pub fn run_migrations(db: &Database) -> Result<(), AppError> {
    let conn = db.conn()?;

    // Create tables if not exist
    conn.execute_batch(SCHEMA_V1)?;

    // Check if provider_key column exists (v2 migration)
    let has_provider_key: bool = {
        let mut stmt = conn.prepare("PRAGMA table_info(instances)")?;
        let cols: Vec<String> = stmt.query_map([], |row| row.get(1))?
            .filter_map(|r| r.ok())
            .collect();
        cols.iter().any(|c| c == "provider_key")
    };

    if !has_provider_key {
        conn.execute_batch(MIGRATION_V2)?;
    }

    Ok(())
}
