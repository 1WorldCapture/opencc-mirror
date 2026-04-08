use serde::{Deserialize, Serialize};

use crate::database::Database;
use crate::error::AppError;

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
}

pub fn insert_instance(db: &Database, input: &CreateInstanceInput, instance_dir: &str, config_dir: &str, wrapper_path: &str) -> Result<(), AppError> {
    let conn = db.conn()?;
    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "INSERT INTO instances (name, display_name, status, instance_dir, config_dir, wrapper_path, api_key, base_url, created_at)
         VALUES (?1, ?2, 'creating', ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![
            input.name,
            input.display_name,
            instance_dir,
            config_dir,
            wrapper_path,
            input.api_key,
            input.base_url,
            now,
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
    let mut stmt = conn.prepare(
        "SELECT name, display_name, status, instance_dir, config_dir, wrapper_path, api_key, base_url, created_at, updated_at, last_launched_at, error_message FROM instances ORDER BY created_at DESC"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(InstanceRow {
            name: row.get(0)?,
            display_name: row.get(1)?,
            status: row.get(2)?,
            instance_dir: row.get(3)?,
            config_dir: row.get(4)?,
            wrapper_path: row.get(5)?,
            api_key: row.get(6)?,
            base_url: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
            last_launched_at: row.get(10)?,
            error_message: row.get(11)?,
        })
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}

pub fn get_instance(db: &Database, name: &str) -> Result<Option<InstanceRow>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare(
        "SELECT name, display_name, status, instance_dir, config_dir, wrapper_path, api_key, base_url, created_at, updated_at, last_launched_at, error_message FROM instances WHERE name = ?1"
    )?;
    let mut rows = stmt.query_map([name], |row| {
        Ok(InstanceRow {
            name: row.get(0)?,
            display_name: row.get(1)?,
            status: row.get(2)?,
            instance_dir: row.get(3)?,
            config_dir: row.get(4)?,
            wrapper_path: row.get(5)?,
            api_key: row.get(6)?,
            base_url: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
            last_launched_at: row.get(10)?,
            error_message: row.get(11)?,
        })
    })?;
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
