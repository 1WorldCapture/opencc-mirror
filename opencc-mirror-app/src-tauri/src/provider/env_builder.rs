use std::collections::HashMap;

use serde_json::{Map, Value};

use super::presets::ProviderPreset;
use crate::error::AppError;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ModelOverrides {
    pub sonnet: Option<String>,
    pub opus: Option<String>,
    pub haiku: Option<String>,
    pub small_fast: Option<String>,
    pub default_model: Option<String>,
    pub subagent_model: Option<String>,
}

pub struct BuildEnvParams<'a> {
    pub preset: &'a ProviderPreset,
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub model_overrides: Option<ModelOverrides>,
    pub extra_env: Vec<String>,
}

/// Build the environment map for an instance, ported from cc-mirror buildEnv().
pub fn build_env(params: BuildEnvParams) -> Result<Map<String, Value>, AppError> {
    let preset = params.preset;
    let mut env: Map<String, Value> = Map::new();

    // 1. Start with provider preset env vars
    for (k, v) in &preset.env {
        env.insert(k.clone(), v.clone());
    }

    let auth_mode = preset.auth_mode.as_str();

    // 2. For 'none' authMode, only apply cosmetic env vars
    if auth_mode == "none" {
        apply_extra_env(&mut env, &params.extra_env);
        return Ok(env);
    }

    // 3. Standard env vars
    if !env.contains_key("DISABLE_AUTOUPDATER") {
        env.insert("DISABLE_AUTOUPDATER".into(), Value::String("1".into()));
    }
    if !env.contains_key("DISABLE_AUTO_MIGRATE_TO_NATIVE") {
        env.insert("DISABLE_AUTO_MIGRATE_TO_NATIVE".into(), Value::String("1".into()));
    }

    // 4. Base URL
    if let Some(ref url) = params.base_url {
        if !url.is_empty() {
            env.insert("ANTHROPIC_BASE_URL".into(), Value::String(url.clone()));
        }
    }

    // 5. Auth
    match auth_mode {
        "authToken" => {
            if let Some(ref key) = params.api_key {
                let trimmed = key.trim().to_string();
                if !trimmed.is_empty() {
                    env.insert("ANTHROPIC_AUTH_TOKEN".into(), Value::String(trimmed.clone()));
                    // Ollama-style: also set API key
                    if preset.key == "ollama" {
                        env.insert("ANTHROPIC_API_KEY".into(), Value::String(trimmed));
                    }
                } else if preset.key == "ccrouter" {
                    env.insert("ANTHROPIC_AUTH_TOKEN".into(), Value::String("ccrouter-proxy".into()));
                }
            }
            // Remove ANTHROPIC_API_KEY if not also set via authToken
            if preset.key != "ollama" && env.contains_key("ANTHROPIC_API_KEY") {
                env.remove("ANTHROPIC_API_KEY");
            }
        }
        "apiKey" => {
            if let Some(ref key) = params.api_key {
                let trimmed = key.trim().to_string();
                if !trimmed.is_empty() {
                    env.insert("ANTHROPIC_API_KEY".into(), Value::String(trimmed.clone()));
                    env.insert("CC_MIRROR_UNSET_AUTH_TOKEN".into(), Value::String("1".into()));
                    if preset.key == "zai" {
                        env.insert("Z_AI_API_KEY".into(), Value::String(trimmed));
                    }
                } else {
                    env.insert("CC_MIRROR_UNSET_AUTH_TOKEN".into(), Value::String("1".into()));
                }
            } else {
                env.insert("CC_MIRROR_UNSET_AUTH_TOKEN".into(), Value::String("1".into()));
            }
        }
        _ => {}
    }

    // 6. Model overrides
    if let Some(ref overrides) = params.model_overrides {
        apply_model_overrides(&mut env, overrides);
    }

    // 7. Sync compatibility model defaults
    sync_compatibility_model_defaults(&mut env, &params.model_overrides);

    // 8. Extra env
    apply_extra_env(&mut env, &params.extra_env);

    // 9. Clean up auth token/api key conflicts
    if auth_mode == "authToken" {
        if preset.key == "vercel" {
            env.insert("ANTHROPIC_API_KEY".into(), Value::String("".into()));
        } else if preset.key != "ollama" && env.contains_key("ANTHROPIC_API_KEY") {
            env.remove("ANTHROPIC_API_KEY");
        }
    }
    if auth_mode != "authToken" && env.contains_key("ANTHROPIC_AUTH_TOKEN") {
        env.remove("ANTHROPIC_AUTH_TOKEN");
    }

    Ok(env)
}

fn apply_model_overrides(env: &mut Map<String, Value>, overrides: &ModelOverrides) {
    let entries: &[(&str, &Option<String>)] = &[
        ("ANTHROPIC_DEFAULT_SONNET_MODEL", &overrides.sonnet),
        ("ANTHROPIC_DEFAULT_OPUS_MODEL", &overrides.opus),
        ("ANTHROPIC_DEFAULT_HAIKU_MODEL", &overrides.haiku),
        ("ANTHROPIC_SMALL_FAST_MODEL", &overrides.small_fast),
        ("ANTHROPIC_MODEL", &overrides.default_model),
        ("CLAUDE_CODE_SUBAGENT_MODEL", &overrides.subagent_model),
    ];
    for (key, value) in entries {
        if let Some(ref v) = value {
            let trimmed = v.trim().to_string();
            if !trimmed.is_empty() {
                env.insert((*key).into(), Value::String(trimmed));
            }
        }
    }
}

fn sync_compatibility_model_defaults(env: &mut Map<String, Value>, overrides: &Option<ModelOverrides>) {
    // Sync ANTHROPIC_MODEL with OPUS unless default_model is explicitly set
    let skip_default = overrides.as_ref()
        .and_then(|o| o.default_model.as_ref())
        .map(|v| !v.trim().is_empty())
        .unwrap_or(false);

    if !skip_default {
        if let Some(Value::String(opus)) = env.get("ANTHROPIC_DEFAULT_OPUS_MODEL") {
            env.insert("ANTHROPIC_MODEL".into(), Value::String(opus.clone()));
        }
    }

    // Sync ANTHROPIC_SMALL_FAST_MODEL with HAIKU unless small_fast is explicitly set
    let skip_small_fast = overrides.as_ref()
        .and_then(|o| o.small_fast.as_ref())
        .map(|v| !v.trim().is_empty())
        .unwrap_or(false);

    if !skip_small_fast {
        if let Some(Value::String(haiku)) = env.get("ANTHROPIC_DEFAULT_HAIKU_MODEL") {
            env.insert("ANTHROPIC_SMALL_FAST_MODEL".into(), Value::String(haiku.clone()));
        }
    }
}

fn apply_extra_env(env: &mut Map<String, Value>, extra_env: &[String]) {
    for entry in extra_env {
        if let Some(idx) = entry.find('=') {
            let key = entry[..idx].trim().to_string();
            let value = entry[idx + 1..].trim().to_string();
            if !key.is_empty() {
                env.insert(key, Value::String(value));
            }
        }
    }
}
