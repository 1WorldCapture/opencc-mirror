use serde::{Deserialize, Serialize};

use crate::database::Database;
use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelOverrides {
    pub sonnet: Option<String>,
    pub opus: Option<String>,
    pub haiku: Option<String>,
    pub small_fast: Option<String>,
    pub default_model: Option<String>,
    pub subagent_model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstanceRow {
    pub name: String,
    pub display_name: Option<String>,
    pub status: String,
    pub instance_dir: String,
    pub config_dir: String,
    pub wrapper_path: String,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub provider_id: Option<String>,
    pub provider_name: Option<String>,
    pub model_overrides: Option<ModelOverrides>,
    pub created_at: i64,
    pub updated_at: Option<i64>,
    pub last_launched_at: Option<i64>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateInstanceInput {
    pub name: String,
    pub display_name: Option<String>,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub provider_id: Option<String>,
    pub model_overrides: Option<ModelOverrides>,
    pub mcp_server_ids: Option<Vec<String>>,
    pub skill_ids: Option<Vec<String>>,
}

const BASE_COLUMNS: &str = r#"i.name, i.display_name, i.status, i.instance_dir, i.config_dir, i.wrapper_path, i.api_key, i.base_url, i.provider_id, p.name, i.model_overrides, i.created_at, i.updated_at, i.last_launched_at, i.error_message"#;

fn row_to_instance(row: &rusqlite::Row) -> rusqlite::Result<InstanceRow> {
    let model_overrides_str: Option<String> = row.get(10)?;
    let model_overrides = model_overrides_str
        .as_deref()
        .and_then(|s| serde_json::from_str(s).ok());

    Ok(InstanceRow {
        name: row.get(0)?,
        display_name: row.get(1)?,
        status: row.get(2)?,
        instance_dir: row.get(3)?,
        config_dir: row.get(4)?,
        wrapper_path: row.get(5)?,
        api_key: row.get(6)?,
        base_url: row.get(7)?,
        provider_id: row.get(8)?,
        provider_name: row.get(9)?,
        model_overrides,
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
        last_launched_at: row.get(13)?,
        error_message: row.get(14)?,
    })
}

const INSTANCE_INSERT_COLUMNS: &str = "name, display_name, status, instance_dir, config_dir, wrapper_path, api_key, base_url, provider_id, model_overrides, created_at";

pub fn insert_instance(
    db: &Database,
    input: &CreateInstanceInput,
    instance_dir: &str,
    config_dir: &str,
    wrapper_path: &str,
) -> Result<(), AppError> {
    let conn = db.conn()?;
    let now = chrono::Utc::now().timestamp();
    let provider_id = input.provider_id.clone().unwrap_or_default();
    let model_overrides_str = input.model_overrides.as_ref()
        .map(|m| serde_json::to_string(m).unwrap_or_default())
        .unwrap_or_else(|| "{}".into());

    conn.execute(
        &format!("INSERT INTO instances ({}) VALUES (?1, ?2, 'creating', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)", INSTANCE_INSERT_COLUMNS),
        rusqlite::params![
            input.name, input.display_name, instance_dir, config_dir,
            wrapper_path, input.api_key, input.base_url, provider_id,
            model_overrides_str, now,
        ],
    )?;
    Ok(())
}

pub fn update_instance_status(db: &Database, name: &str, status: &str, error_message: Option<&str>) -> Result<(), AppError> {
    let conn = db.conn()?;
    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "UPDATE instances SET status = ?1, updated_at = ?2, error_message = ?3 WHERE name = ?4",
        rusqlite::params![status, now, error_message, name],
    )?;
    Ok(())
}

pub fn list_instances(db: &Database) -> Result<Vec<InstanceRow>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM instances i LEFT JOIN providers p ON i.provider_id = p.id ORDER BY i.created_at DESC", BASE_COLUMNS
    ))?;
    let rows = stmt.query_map([], row_to_instance)?;
    let mut result = Vec::new();
    for row in rows { result.push(row?); }
    Ok(result)
}

pub fn get_instance(db: &Database, name: &str) -> Result<Option<InstanceRow>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare(&format!(
        "SELECT {} FROM instances i LEFT JOIN providers p ON i.provider_id = p.id WHERE i.name = ?1", BASE_COLUMNS
    ))?;
    let mut rows = stmt.query_map([name], row_to_instance)?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

pub fn delete_instance(db: &Database, name: &str) -> Result<(), AppError> {
    let conn = db.conn()?;
    conn.execute("DELETE FROM instances WHERE name = ?1", [name])?;
    Ok(())
}

pub fn update_last_launched(db: &Database, name: &str) -> Result<(), AppError> {
    let conn = db.conn()?;
    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "UPDATE instances SET last_launched_at = ?1 WHERE name = ?2",
        rusqlite::params![now, name],
    )?;
    Ok(())
}
