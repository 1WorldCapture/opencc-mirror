use crate::database::Database;
use crate::error::AppError;

const SCHEMA_V1: &str = r#"
-- Instance table
CREATE TABLE IF NOT EXISTS instances (
    name TEXT PRIMARY KEY,
    display_name TEXT,
    status TEXT NOT NULL DEFAULT 'creating',

    -- Paths (absolute)
    instance_dir TEXT NOT NULL,
    config_dir TEXT NOT NULL,
    wrapper_path TEXT NOT NULL,

    -- Provider config (simple key+base_url for MVP)
    api_key TEXT,
    base_url TEXT,

    -- Metadata
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    last_launched_at INTEGER,
    error_message TEXT
);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
"#;

pub fn run_migrations(db: &Database) -> Result<(), AppError> {
    let conn = db.conn()?;
    conn.execute_batch(SCHEMA_V1)?;
    Ok(())
}
