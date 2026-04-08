use serde::{Deserialize, Serialize};

use crate::database::Database;
use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerRow {
    pub id: String,
    pub name: String,
    pub server_config: String, // JSON: { command, args, env }
    pub description: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerInput {
    pub id: String,
    pub name: String,
    pub server_config: String, // JSON
    pub description: Option<String>,
}

pub fn upsert_mcp_server(db: &Database, input: &McpServerInput) -> Result<(), AppError> {
    let conn = db.conn()?;
    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "INSERT INTO mcp_servers (id, name, server_config, description, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(id) DO UPDATE SET name=?2, server_config=?3, description=?4",
        rusqlite::params![input.id, input.name, input.server_config, input.description, now],
    )?;
    Ok(())
}

pub fn list_mcp_servers(db: &Database) -> Result<Vec<McpServerRow>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare(
        "SELECT id, name, server_config, description, created_at FROM mcp_servers ORDER BY name"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(McpServerRow {
            id: row.get(0)?,
            name: row.get(1)?,
            server_config: row.get(2)?,
            description: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}

pub fn delete_mcp_server(db: &Database, id: &str) -> Result<(), AppError> {
    let conn = db.conn()?;
    conn.execute("DELETE FROM mcp_servers WHERE id = ?1", [id])?;
    Ok(())
}

#[allow(dead_code)]
pub fn get_mcp_servers_for_instance(db: &Database, instance_name: &str) -> Result<Vec<(McpServerRow, bool)>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare(
        "SELECT s.id, s.name, s.server_config, s.description, s.created_at,
                COALESCE(im.enabled, 0) as enabled
         FROM mcp_servers s
         LEFT JOIN instance_mcp_servers im ON s.id = im.mcp_server_id AND im.instance_name = ?1
         ORDER BY s.name"
    )?;
    let rows = stmt.query_map([instance_name], |row| {
        Ok((
            McpServerRow {
                id: row.get(0)?,
                name: row.get(1)?,
                server_config: row.get(2)?,
                description: row.get(3)?,
                created_at: row.get(4)?,
            },
            row.get::<_, i64>(5)? != 0,
        ))
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}

/// Set which MCP servers are enabled for an instance.
/// `server_ids` is a list of (mcp_server_id, enabled) pairs.
pub fn set_instance_mcp_servers(db: &Database, instance_name: &str, server_ids: &[(String, bool)]) -> Result<(), AppError> {
    let conn = db.conn()?;
    conn.execute("DELETE FROM instance_mcp_servers WHERE instance_name = ?1", [instance_name])?;
    for (server_id, enabled) in server_ids {
        if *enabled {
            conn.execute(
                "INSERT OR IGNORE INTO instance_mcp_servers (instance_name, mcp_server_id, enabled) VALUES (?1, ?2, 1)",
                rusqlite::params![instance_name, server_id],
            )?;
        }
    }
    Ok(())
}

/// Get enabled MCP server configs for an instance (for building .claude.json)
pub fn get_enabled_mcp_configs(db: &Database, instance_name: &str) -> Result<Vec<(String, String)>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare(
        "SELECT s.name, s.server_config
         FROM mcp_servers s
         JOIN instance_mcp_servers im ON s.id = im.mcp_server_id
         WHERE im.instance_name = ?1 AND im.enabled = 1"
    )?;
    let rows = stmt.query_map([instance_name], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}
