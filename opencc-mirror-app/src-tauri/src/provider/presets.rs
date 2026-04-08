use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderPreset {
    pub key: String,
    pub label: String,
    pub description: String,
    pub base_url: String,
    pub env: HashMap<String, serde_json::Value>,
    pub api_key_label: String,
    pub auth_mode: String, // "apiKey" | "authToken" | "none"
    pub requires_model_mapping: bool,
    pub credential_optional: bool,
    pub experimental: bool,
    pub display_order: i32,
}

pub fn all_presets() -> Vec<ProviderPreset> {
    vec![
        ProviderPreset {
            key: "mirror".into(),
            label: "Mirror Claude".into(),
            description: "Pure Claude with isolated config and clean defaults".into(),
            base_url: "".into(),
            env: HashMap::new(),
            api_key_label: "".into(),
            auth_mode: "none".into(),
            requires_model_mapping: false,
            credential_optional: true,
            experimental: true,
            display_order: 9,
        },
        ProviderPreset {
            key: "kimi".into(),
            label: "Kimi Code".into(),
            description: "kimi-for-coding via Kimi Code (K2.5)".into(),
            base_url: "https://api.kimi.com/coding/".into(),
            env: serde_json::from_str(r#"{
                "API_TIMEOUT_MS": "3000000",
                "ANTHROPIC_DEFAULT_HAIKU_MODEL": "kimi-for-coding",
                "ANTHROPIC_DEFAULT_SONNET_MODEL": "kimi-for-coding",
                "ANTHROPIC_DEFAULT_OPUS_MODEL": "kimi-for-coding"
            }"#).unwrap(),
            api_key_label: "Kimi API key".into(),
            auth_mode: "apiKey".into(),
            requires_model_mapping: false,
            credential_optional: false,
            experimental: false,
            display_order: 0,
        },
        ProviderPreset {
            key: "minimax".into(),
            label: "MiniMax Cloud".into(),
            description: "MiniMax via MiniMax Cloud".into(),
            base_url: "https://api.minimax.io/anthropic".into(),
            env: serde_json::from_str(r#"{
                "API_TIMEOUT_MS": "3000000",
                "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
                "ANTHROPIC_MODEL": "MiniMax-M2.5",
                "ANTHROPIC_SMALL_FAST_MODEL": "MiniMax-M2.5",
                "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMax-M2.5",
                "ANTHROPIC_DEFAULT_OPUS_MODEL": "MiniMax-M2.5",
                "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMax-M2.5"
            }"#).unwrap(),
            api_key_label: "MiniMax API key".into(),
            auth_mode: "apiKey".into(),
            requires_model_mapping: false,
            credential_optional: false,
            experimental: false,
            display_order: 1,
        },
        ProviderPreset {
            key: "zai".into(),
            label: "Zai Cloud".into(),
            description: "GLM-5/4.7/4.5-Air via Z.ai Coding Plan".into(),
            base_url: "https://api.z.ai/api/anthropic".into(),
            env: serde_json::from_str(r#"{
                "API_TIMEOUT_MS": "3000000",
                "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
                "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
                "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5"
            }"#).unwrap(),
            api_key_label: "Zai API key".into(),
            auth_mode: "apiKey".into(),
            requires_model_mapping: false,
            credential_optional: false,
            experimental: false,
            display_order: 2,
        },
        ProviderPreset {
            key: "openrouter".into(),
            label: "OpenRouter".into(),
            description: "100+ models via OpenRouter gateway".into(),
            base_url: "https://openrouter.ai/api".into(),
            env: serde_json::from_str(r#"{"API_TIMEOUT_MS": "3000000"}"#).unwrap(),
            api_key_label: "OpenRouter API key".into(),
            auth_mode: "authToken".into(),
            requires_model_mapping: true,
            credential_optional: false,
            experimental: false,
            display_order: 3,
        },
        ProviderPreset {
            key: "vercel".into(),
            label: "Vercel AI Gateway".into(),
            description: "Vercel AI Gateway".into(),
            base_url: "https://ai-gateway.vercel.sh".into(),
            env: serde_json::from_str(r#"{"API_TIMEOUT_MS": "3000000"}"#).unwrap(),
            api_key_label: "Vercel AI Gateway API key".into(),
            auth_mode: "authToken".into(),
            requires_model_mapping: true,
            credential_optional: false,
            experimental: false,
            display_order: 4,
        },
        ProviderPreset {
            key: "ollama".into(),
            label: "Ollama".into(),
            description: "Local + cloud models via Ollama".into(),
            base_url: "http://localhost:11434".into(),
            env: serde_json::from_str(r#"{
                "API_TIMEOUT_MS": "3000000",
                "ANTHROPIC_AUTH_TOKEN": "ollama",
                "ANTHROPIC_API_KEY": "ollama",
                "ANTHROPIC_DEFAULT_SONNET_MODEL": "qwen3-coder",
                "ANTHROPIC_DEFAULT_OPUS_MODEL": "qwen3-coder",
                "ANTHROPIC_DEFAULT_HAIKU_MODEL": "qwen3-coder"
            }"#).unwrap(),
            api_key_label: "Ollama API key (use \"ollama\" for local)".into(),
            auth_mode: "authToken".into(),
            requires_model_mapping: true,
            credential_optional: false,
            experimental: false,
            display_order: 5,
        },
        ProviderPreset {
            key: "nanogpt".into(),
            label: "NanoGPT".into(),
            description: "400+ models via NanoGPT gateway".into(),
            base_url: "https://nano-gpt.com/api".into(),
            env: serde_json::from_str(r#"{
                "API_TIMEOUT_MS": "3000000",
                "ANTHROPIC_DEFAULT_SONNET_MODEL": "moonshotai/kimi-k2.5",
                "ANTHROPIC_DEFAULT_OPUS_MODEL": "moonshotai/kimi-k2.5",
                "ANTHROPIC_DEFAULT_HAIKU_MODEL": "moonshotai/kimi-k2.5"
            }"#).unwrap(),
            api_key_label: "NanoGPT API key".into(),
            auth_mode: "authToken".into(),
            requires_model_mapping: true,
            credential_optional: false,
            experimental: false,
            display_order: 6,
        },
        ProviderPreset {
            key: "ccrouter".into(),
            label: "CC Router".into(),
            description: "Local LLMs via CC Router".into(),
            base_url: "http://127.0.0.1:3456".into(),
            env: serde_json::from_str(r#"{"API_TIMEOUT_MS": "3000000"}"#).unwrap(),
            api_key_label: "Router URL".into(),
            auth_mode: "authToken".into(),
            requires_model_mapping: false,
            credential_optional: true,
            experimental: false,
            display_order: 7,
        },
        ProviderPreset {
            key: "gatewayz".into(),
            label: "GatewayZ".into(),
            description: "GatewayZ AI Gateway".into(),
            base_url: "https://api.gatewayz.ai".into(),
            env: serde_json::from_str(r#"{"API_TIMEOUT_MS": "3000000"}"#).unwrap(),
            api_key_label: "GatewayZ API key".into(),
            auth_mode: "authToken".into(),
            requires_model_mapping: true,
            credential_optional: false,
            experimental: false,
            display_order: 8,
        },
    ]
}

pub fn get_preset(key: &str) -> Option<ProviderPreset> {
    all_presets().into_iter().find(|p| p.key == key)
}

/// List non-experimental presets
pub fn list_presets(include_experimental: bool) -> Vec<ProviderPreset> {
    let mut presets: Vec<ProviderPreset> = all_presets()
        .into_iter()
        .filter(|p| include_experimental || !p.experimental)
        .collect();
    presets.sort_by_key(|p| p.display_order);
    presets
}
