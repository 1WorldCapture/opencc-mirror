use serde_json::{json, Map, Value};

use crate::database::dao::{get_enabled_mcp_configs, get_enabled_skill_dirs, get_provider};
use crate::instance::find_openclaude_binary;

pub fn prepare_dirs(ctx: &super::builder::BuildContext) -> Result<(), crate::error::AppError> {
    std::fs::create_dir_all(&ctx.instance_dir)?;
    std::fs::create_dir_all(&ctx.config_dir)?;
    Ok(())
}

pub fn check_openclaude() -> Result<String, crate::error::AppError> {
    find_openclaude_binary()
        .ok_or_else(|| crate::error::AppError::Instance(
            "openclaude is not installed. Run: npm install -g @gitlawb/openclaude".into()
        ))
}

pub fn write_config(ctx: &super::builder::BuildContext) -> Result<(), crate::error::AppError> {
    // Build env map: from provider's settings_config if available, otherwise from input fields
    let env = if let Some(ref provider_id) = ctx.input.provider_id {
        if let Some(provider) = get_provider(&ctx.db, provider_id)? {
            // Parse provider's settings_config as the env object
            let config: Value = serde_json::from_str(&provider.settings_config)
                .unwrap_or_else(|_| json!({}));
            if let Some(env_obj) = config.get("env").and_then(|e| e.as_object()) {
                let mut env = env_obj.clone();
                // Apply per-instance overrides
                if let Some(ref base_url) = ctx.input.base_url {
                    if !base_url.is_empty() {
                        env.insert("ANTHROPIC_BASE_URL".into(), Value::String(base_url.clone()));
                    }
                }
                env
            } else {
                build_simple_env(ctx)?
            }
        } else {
            build_simple_env(ctx)?
        }
    } else {
        build_simple_env(ctx)?
    };

    // Write settings.json
    let settings = json!({ "env": Value::Object(env) });
    let settings_path = ctx.config_dir.join("settings.json");
    std::fs::write(&settings_path, serde_json::to_string_pretty(&settings)?)?;

    // Build .claude.json with MCP servers
    let mut claude_json = json!({
        "hasCompletedOnboarding": true,
        "theme": "dark"
    });

    let instance_name = &ctx.input.name;
    let mcp_configs = get_enabled_mcp_configs(&ctx.db, instance_name)?;
    if !mcp_configs.is_empty() {
        let mut mcp_servers = serde_json::Map::new();
        for (name, config_str) in &mcp_configs {
            if let Ok(config_value) = serde_json::from_str::<Value>(config_str) {
                mcp_servers.insert(name.clone(), config_value);
            }
        }
        if !mcp_servers.is_empty() {
            claude_json.as_object_mut().unwrap()
                .insert("mcpServers".into(), Value::Object(mcp_servers));
        }
    }

    let claude_json_path = ctx.config_dir.join(".claude.json");
    std::fs::write(&claude_json_path, serde_json::to_string_pretty(&claude_json)?)?;

    Ok(())
}

pub fn install_skills(ctx: &super::builder::BuildContext) -> Result<(), crate::error::AppError> {
    let instance_name = &ctx.input.name;
    let skill_dirs = get_enabled_skill_dirs(&ctx.db, instance_name)?;
    if skill_dirs.is_empty() { return Ok(()); }

    let skills_dir = ctx.config_dir.join("skills");
    std::fs::create_dir_all(&skills_dir)?;

    for (skill_id, source_dir) in &skill_dirs {
        let source = std::path::Path::new(source_dir);
        if !source.exists() { continue; }
        let target = skills_dir.join(skill_id);
        if target.exists() || target.is_symlink() {
            if target.is_dir() && !target.is_symlink() {
                std::fs::remove_dir_all(&target)?;
            } else {
                std::fs::remove_file(&target)?;
            }
        }
        #[cfg(unix)]
        {
            if std::os::unix::fs::symlink(source, &target).is_err() {
                copy_dir_recursive(source, &target)?;
            }
        }
        #[cfg(not(unix))]
        { copy_dir_recursive(source, &target)?; }
    }
    Ok(())
}

fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> Result<(), crate::error::AppError> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            std::fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

fn build_simple_env(ctx: &super::builder::BuildContext) -> Result<Map<String, Value>, crate::error::AppError> {
    let mut env = Map::new();
    if let Some(ref base_url) = ctx.input.base_url {
        if !base_url.is_empty() {
            env.insert("ANTHROPIC_BASE_URL".into(), Value::String(base_url.clone()));
        }
    }
    if let Some(ref api_key) = ctx.input.api_key {
        if !api_key.is_empty() {
            env.insert("ANTHROPIC_API_KEY".into(), Value::String(api_key.clone()));
        }
    }
    env.insert("DISABLE_AUTOUPDATER".into(), json!("1"));
    Ok(env)
}

pub fn write_wrapper(ctx: &super::builder::BuildContext, openclaude_path: &str) -> Result<(), crate::error::AppError> {
    let config_dir = ctx.config_dir.to_string_lossy();
    let wrapper_dir = ctx.wrapper_path.parent().unwrap();
    std::fs::create_dir_all(wrapper_dir)?;

    let wrapper_content = format!(r#"#!/usr/bin/env bash
set -euo pipefail

export CLAUDE_CONFIG_DIR="{config_dir}"

if command -v node >/dev/null 2>&1; then
  __ocm_env_file="$(mktemp)"
  node - <<'NODE' > "$__ocm_env_file" 2>/dev/null || true
const fs = require('fs');
const path = require('path');
const dir = process.env.CLAUDE_CONFIG_DIR;
if (!dir) process.exit(0);
const file = path.join(dir, 'settings.json');
const escape = (v) => "'" + String(v).replace(/'/g, "'\\''") + "'";
try {{
  if (fs.existsSync(file)) {{
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const env = data && typeof data === 'object' ? data.env : null;
    if (env && typeof env === 'object') {{
      for (const [key, value] of Object.entries(env)) {{
        if (!key) continue;
        process.stdout.write('export ' + key + '=' + escape(value) + '\n');
      }}
    }}
  }}
}} catch {{}}
NODE
  if [[ -s "$__ocm_env_file" ]]; then
    source "$__ocm_env_file"
  fi
  rm -f "$__ocm_env_file" || true
fi

exec {openclaude_path} "$@"
"#,
        config_dir = config_dir,
        openclaude_path = openclaude_path,
    );

    std::fs::write(&ctx.wrapper_path, wrapper_content)?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&ctx.wrapper_path, std::fs::Permissions::from_mode(0o755))?;
    }

    Ok(())
}

/// Re-sync an instance's settings.json from its provider's settings_config
pub fn sync_instance_config(
    config_dir: &std::path::Path,
    provider_config: &str,
    mcp_configs: &[(String, String)],
) -> Result<(), crate::error::AppError> {
    let config: Value = serde_json::from_str(provider_config).unwrap_or_else(|_| json!({}));
    let env = config.get("env").and_then(|e| e.as_object()).cloned()
        .unwrap_or_default();

    let settings = json!({ "env": Value::Object(env) });
    std::fs::write(config_dir.join("settings.json"), serde_json::to_string_pretty(&settings)?)?;

    let mut claude_json: Value = if config_dir.join(".claude.json").exists() {
        let existing = std::fs::read_to_string(config_dir.join(".claude.json"))?;
        serde_json::from_str(&existing).unwrap_or_else(|_| json!({}))
    } else {
        json!({ "hasCompletedOnboarding": true, "theme": "dark" })
    };

    let mut mcp_servers = serde_json::Map::new();
    for (name, config_str) in mcp_configs {
        if let Ok(v) = serde_json::from_str::<Value>(config_str) {
            mcp_servers.insert(name.clone(), v);
        }
    }
    if !mcp_servers.is_empty() {
        claude_json.as_object_mut().unwrap()
            .insert("mcpServers".into(), Value::Object(mcp_servers));
    }

    std::fs::write(config_dir.join(".claude.json"), serde_json::to_string_pretty(&claude_json)?)?;
    Ok(())
}
