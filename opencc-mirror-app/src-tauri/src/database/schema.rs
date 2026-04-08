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

pub fn run_migrations(db: &Database) -> Result<(), AppError> {
    let conn = db.conn()?;

    // V1: base tables
    conn.execute_batch(SCHEMA_V1)?;

    // V2: provider_key + model_overrides
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

    // V3: MCP + Skills tables
    if !has_table(&conn, "mcp_servers") {
        conn.execute_batch(MIGRATION_V3)?;
    }

    Ok(())
}
