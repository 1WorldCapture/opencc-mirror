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
    use serde_json::{json, Map, Value};

    // Build env map
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

    // Disable auto-updater since we manage instances
    env.insert("DISABLE_AUTOUPDATER".into(), json!("1"));

    // Write settings.json
    let settings = json!({
        "env": Value::Object(env)
    });
    let settings_path = ctx.config_dir.join("settings.json");
    let settings_str = serde_json::to_string_pretty(&settings)?;
    std::fs::write(&settings_path, settings_str)?;

    // Write .claude.json (mark onboarding complete)
    let claude_json = json!({
        "hasCompletedOnboarding": true,
        "theme": "dark"
    });
    let claude_json_path = ctx.config_dir.join(".claude.json");
    let claude_json_str = serde_json::to_string_pretty(&claude_json)?;
    std::fs::write(&claude_json_path, claude_json_str)?;

    Ok(())
}

pub fn write_wrapper(ctx: &super::builder::BuildContext, openclaude_path: &str) -> Result<(), crate::error::AppError> {
    let config_dir = ctx.config_dir.to_string_lossy();
    let wrapper_dir = ctx.wrapper_path.parent().unwrap();
    std::fs::create_dir_all(wrapper_dir)?;

    let wrapper_content = format!(r#"#!/usr/bin/env bash
set -euo pipefail

export CLAUDE_CONFIG_DIR="{config_dir}"

# Load env from settings.json
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

    // Make executable (Unix)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = std::fs::Permissions::from_mode(0o755);
        std::fs::set_permissions(&ctx.wrapper_path, perms)?;
    }

    Ok(())
}
