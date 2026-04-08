use serde::{Deserialize, Serialize};

use crate::database::Database;
use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillRow {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub directory: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillInput {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub directory: String,
}

pub fn upsert_skill(db: &Database, input: &SkillInput) -> Result<(), AppError> {
    let conn = db.conn()?;
    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "INSERT INTO skills (id, name, description, directory, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(id) DO UPDATE SET name=?2, description=?3, directory=?4",
        rusqlite::params![input.id, input.name, input.description, input.directory, now],
    )?;
    Ok(())
}

pub fn list_skills(db: &Database) -> Result<Vec<SkillRow>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare(
        "SELECT id, name, description, directory, created_at FROM skills ORDER BY name"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(SkillRow {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            directory: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}

pub fn delete_skill(db: &Database, id: &str) -> Result<(), AppError> {
    let conn = db.conn()?;
    conn.execute("DELETE FROM skills WHERE id = ?1", [id])?;
    Ok(())
}

#[allow(dead_code)]
pub fn get_skills_for_instance(db: &Database, instance_name: &str) -> Result<Vec<(SkillRow, bool)>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare(
        "SELECT s.id, s.name, s.description, s.directory, s.created_at,
                COALESCE(isk.enabled, 0) as enabled
         FROM skills s
         LEFT JOIN instance_skills isk ON s.id = isk.skill_id AND isk.instance_name = ?1
         ORDER BY s.name"
    )?;
    let rows = stmt.query_map([instance_name], |row| {
        Ok((
            SkillRow {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                directory: row.get(3)?,
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

/// Set which skills are enabled for an instance.
pub fn set_instance_skills(db: &Database, instance_name: &str, skill_ids: &[(String, bool)]) -> Result<(), AppError> {
    let conn = db.conn()?;
    conn.execute("DELETE FROM instance_skills WHERE instance_name = ?1", [instance_name])?;
    for (skill_id, enabled) in skill_ids {
        if *enabled {
            conn.execute(
                "INSERT OR IGNORE INTO instance_skills (instance_name, skill_id, enabled) VALUES (?1, ?2, 1)",
                rusqlite::params![instance_name, skill_id],
            )?;
        }
    }
    Ok(())
}

/// Get enabled skill directories for an instance (for symlinking into config)
pub fn get_enabled_skill_dirs(db: &Database, instance_name: &str) -> Result<Vec<(String, String)>, AppError> {
    let conn = db.conn()?;
    let mut stmt = conn.prepare(
        "SELECT s.id, s.directory
         FROM skills s
         JOIN instance_skills isk ON s.id = isk.skill_id
         WHERE isk.instance_name = ?1 AND isk.enabled = 1"
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
