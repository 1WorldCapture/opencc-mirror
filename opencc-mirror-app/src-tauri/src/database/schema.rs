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

const MIGRATION_V3: &str = r#"
CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    server_config TEXT NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    directory TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS instance_mcp_servers (
    instance_name TEXT NOT NULL,
    mcp_server_id TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (instance_name, mcp_server_id),
    FOREIGN KEY (instance_name) REFERENCES instances(name) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS instance_skills (
    instance_name TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (instance_name, skill_id),
    FOREIGN KEY (instance_name) REFERENCES instances(name) ON DELETE CASCADE
);
"#;

const MIGRATION_V4: &str = r#"
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    settings_config TEXT NOT NULL DEFAULT '{}',
    base_url TEXT DEFAULT '',
    api_key_field TEXT DEFAULT 'ANTHROPIC_AUTH_TOKEN',
    website_url TEXT,
    category TEXT DEFAULT 'custom',
    icon TEXT,
    icon_color TEXT,
    preset_key TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
);
ALTER TABLE instances ADD COLUMN provider_id TEXT DEFAULT '' REFERENCES providers(id);
"#;

fn has_table(conn: &rusqlite::Connection, table: &str) -> bool {
    let count: i64 = conn
        .query_row(
            "SELECT count(*) FROM sqlite_master WHERE type='table' AND name=?1",
            [table],
            |row| row.get(0),
        )
        .unwrap_or(0);
    count > 0
}

fn has_column(conn: &rusqlite::Connection, table: &str, column: &str) -> bool {
    let Ok(mut stmt) = conn.prepare(&format!("PRAGMA table_info({})", table)) else { return false };
    let Ok(rows) = stmt.query_map([], |row| row.get::<_, String>(1)) else { return false };
    let cols: Vec<String> = rows.filter_map(|r| r.ok()).collect();
    cols.iter().any(|c| c == column)
}

pub fn run_migrations(db: &Database) -> Result<(), AppError> {
    let conn = db.conn()?;

    // V1
    conn.execute_batch(SCHEMA_V1)?;

    // V2
    if !has_column(&conn, "instances", "provider_key") {
        conn.execute_batch(MIGRATION_V2)?;
    }

    // V3
    if !has_table(&conn, "mcp_servers") {
        conn.execute_batch(MIGRATION_V3)?;
    }

    // V4
    if !has_table(&conn, "providers") {
        conn.execute_batch(MIGRATION_V4)?;
    }

    Ok(())
}
