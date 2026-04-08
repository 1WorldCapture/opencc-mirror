use serde::{Deserialize, Serialize};

use crate::database::Database;
use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderRow {
    pub id: String,
    pub name: String,
    pub settings_config: String, // JSON: { "env": { ... } }
    pub base_url: Option<String>,
    pub api_key_field: Option<String>,
    pub website_url: Option<String>,
    pub category: Option<String>,
    pub icon: Option<String>,
    pub icon_color: Option<String>,
    pub preset_key: Option<String>,
    pub created_at: i64,
    pub updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderInput {
    pub id: Option<String>,       // None = auto-generate
    pub name: String,
    pub settings_config: String,
    pub base_url: Option<String>,
    pub api_key_field: Option<String>,
    pub website_url: Option<String>,
    pub category: Option<String>,
    pub icon: Option<String>,
    pub icon_color: Option<String>,
    pub preset_key: Option<String>,
}

const COLUMNS: &str = "id, name, settings_config, base_url, api_key_field, website_url, category, icon, icon_color, preset_key, created_at, updated_at";

fn row_to_provider(row: &rusqlite::Row) -> rusqlite::Result<ProviderRow> {
    Ok(ProviderRow {
        id: row.get(0)?,
        name: row.get(1)?,
        settings_config: row.get(2)?,
        base_url: row.get(3)?,
        api_key_field: row.get(4)?,
        website_url: row.get(5)?,
        category: row.get(6)?,
        icon: row.get(7)?,
        icon_color: row.get(8)?,
        preset_key: row.get(9)?,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

pub fn insert_provider(db: &Database, input: &ProviderInput) -> Result<ProviderRow, AppError> {
    let conn = db.conn()?;
    let now = chrono::Utc::now().timestamp();
    let id = input.id.clone().unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    conn.execute(
        &format!("INSERT INTO providers ({}) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, NULL)", COLUMNS),
        rusqlite::params![
            id, input.name, input.settings_config, input.base_url,
            input.api_key_field, input.website_url, input.category,
            input.icon, input.icon_color, input.preset_key, now
        ],
    )?;

    get_provider(db, &id)?.ok_or(AppError::Database("Provider not found after insert".into()))
}

pub fn update_provider(db: &Database, id: &str, input: &ProviderInput) -> Result<ProviderRow, AppError> {
    let conn = db.conn()?;
    let now = chrono::Utc::now().timestamp();

    conn.execute(
        "UPDATE providers SET name=?1, settings_config=?2, base_url=?3, api_key_field=?4, website_url=?5, category=?6, icon=?7, icon_color=?8, preset_key=?9, updated_at=?10 WHERE id=?11",
        rusqlite::params![
            input.name, input.settings_config, input.base_url,
            input.api_key_field, input.website_url, input.category,
            input.icon, input.icon_color, input.preset_key, now, id
        ],
    )?;

    get_provider(db, id)?.ok_or(AppError::Database("Provider not found after update".into()))
}

pub fn delete_provider(db: &Database, id: &str) -> Result<(), AppError> {
    let conn = db.conn()?;
    conn.execute("DELETE FROM providers WHERE id = ?1", [id])?;
    Ok(())
}

pub fn list_providers(db: &Database) -> Result<Vec<ProviderRow>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare(&format!("SELECT {} FROM providers ORDER BY created_at", COLUMNS))?;
    let rows = stmt.query_map([], row_to_provider)?;
    let mut result = Vec::new();
    for row in rows { result.push(row?); }
    Ok(result)
}

pub fn get_provider(db: &Database, id: &str) -> Result<Option<ProviderRow>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare(&format!("SELECT {} FROM providers WHERE id = ?1", COLUMNS))?;
    let mut rows = stmt.query_map([id], row_to_provider)?;
    match rows.next() {
        Some(row) => Ok(Some(row?)),
        None => Ok(None),
    }
}

/// Get instance names using a given provider
pub fn get_instances_for_provider(db: &Database, provider_id: &str) -> Result<Vec<String>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare("SELECT name FROM instances WHERE provider_id = ?1")?;
    let rows = stmt.query_map([provider_id], |row| row.get(0))?;
    let mut result = Vec::new();
    for row in rows { result.push(row?); }
    Ok(result)
}
