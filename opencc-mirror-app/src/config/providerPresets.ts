export type ProviderCategory =
  | "official"
  | "cn_official"
  | "cloud_provider"
  | "aggregator"
  | "third_party"
  | "custom";

export interface ProviderPreset {
  name: string;
  category: ProviderCategory;
  icon?: string;
  iconColor?: string;
  websiteUrl?: string;
  apiKeyUrl?: string;
  apiKeyField: "ANTHROPIC_AUTH_TOKEN" | "ANTHROPIC_API_KEY";
  /** Default settings_config.env to pre-fill */
  defaultEnv: Record<string, string>;
  /** Whether API key is required (default true) */
  credentialOptional?: boolean;
}

export const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  official: "Official",
  cn_official: "China",
  cloud_provider: "Cloud",
  aggregator: "Aggregator",
  third_party: "Third Party",
  custom: "Custom",
};

export const providerPresets: ProviderPreset[] = [
  // --- Official ---
  {
    name: "Claude Official",
    category: "official",
    icon: "anthropic",
    iconColor: "#D4915D",
    websiteUrl: "https://www.anthropic.com/claude-code",
    apiKeyField: "ANTHROPIC_API_KEY",
    credentialOptional: true,
    defaultEnv: {
      DISABLE_AUTOUPDATER: "1",
    },
  },

  // --- China Official ---
  {
    name: "DeepSeek",
    category: "cn_official",
    icon: "deepseek",
    iconColor: "#1E88E5",
    websiteUrl: "https://platform.deepseek.com",
    apiKeyField: "ANTHROPIC_AUTH_TOKEN",
    defaultEnv: {
      ANTHROPIC_BASE_URL: "https://api.deepseek.com/anthropic",
      ANTHROPIC_MODEL: "DeepSeek-V3.2",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "DeepSeek-V3.2",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "DeepSeek-V3.2",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "DeepSeek-V3.2",
    },
  },
  {
    name: "Zhipu GLM (智谱)",
    category: "cn_official",
    icon: "zhipu",
    iconColor: "#0F62FE",
    websiteUrl: "https://open.bigmodel.cn",
    apiKeyUrl: "https://www.bigmodel.cn/claude-code",
    apiKeyField: "ANTHROPIC_AUTH_TOKEN",
    defaultEnv: {
      ANTHROPIC_BASE_URL: "https://open.bigmodel.cn/api/anthropic",
      ANTHROPIC_MODEL: "glm-5",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "glm-4.5-air",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "glm-4.7",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "glm-5",
    },
  },
  {
    name: "Zai Cloud",
    category: "cn_official",
    icon: "zai",
    iconColor: "#6366F1",
    websiteUrl: "https://z.ai",
    apiKeyField: "ANTHROPIC_API_KEY",
    defaultEnv: {
      ANTHROPIC_BASE_URL: "https://api.z.ai/api/anthropic",
      API_TIMEOUT_MS: "3000000",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "glm-4.5-air",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "glm-4.7",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "glm-5",
    },
  },
  {
    name: "Kimi",
    category: "cn_official",
    icon: "kimi",
    iconColor: "#000000",
    websiteUrl: "https://platform.moonshot.cn",
    apiKeyField: "ANTHROPIC_API_KEY",
    defaultEnv: {
      ANTHROPIC_BASE_URL: "https://api.kimi.com/coding/",
      API_TIMEOUT_MS: "3000000",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-for-coding",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-for-coding",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-for-coding",
    },
  },
  {
    name: "MiniMax",
    category: "cn_official",
    icon: "minimax",
    iconColor: "#FF6B35",
    websiteUrl: "https://platform.minimaxi.com",
    apiKeyField: "ANTHROPIC_API_KEY",
    defaultEnv: {
      ANTHROPIC_BASE_URL: "https://api.minimax.io/anthropic",
      API_TIMEOUT_MS: "3000000",
      ANTHROPIC_MODEL: "MiniMax-M2.5",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "MiniMax-M2.5",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "MiniMax-M2.5",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "MiniMax-M2.5",
    },
  },

  // --- Aggregator ---
  {
    name: "OpenRouter",
    category: "aggregator",
    icon: "openrouter",
    iconColor: "#6C5CE7",
    websiteUrl: "https://openrouter.ai",
    apiKeyField: "ANTHROPIC_AUTH_TOKEN",
    defaultEnv: {
      ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
      API_TIMEOUT_MS: "3000000",
    },
  },
  {
    name: "SiliconFlow",
    category: "aggregator",
    icon: "siliconflow",
    iconColor: "#7C3AED",
    websiteUrl: "https://siliconflow.cn",
    apiKeyField: "ANTHROPIC_AUTH_TOKEN",
    defaultEnv: {
      ANTHROPIC_BASE_URL: "https://api.siliconflow.cn/v1",
      API_TIMEOUT_MS: "3000000",
    },
  },
  {
    name: "AiHubMix",
    category: "aggregator",
    icon: "aihubmix",
    iconColor: "#10B981",
    websiteUrl: "https://aihubmix.com",
    apiKeyField: "ANTHROPIC_AUTH_TOKEN",
    defaultEnv: {
      ANTHROPIC_BASE_URL: "https://aihubmix.com/v1",
      API_TIMEOUT_MS: "3000000",
    },
  },

  // --- Cloud Provider ---
  {
    name: "AWS Bedrock",
    category: "cloud_provider",
    icon: "aws",
    iconColor: "#FF9900",
    websiteUrl: "https://aws.amazon.com/bedrock",
    apiKeyField: "ANTHROPIC_AUTH_TOKEN",
    defaultEnv: {
      ANTHROPIC_BASE_URL: "https://bedrock-runtime.us-east-1.amazonaws.com",
      API_TIMEOUT_MS: "3000000",
    },
  },
  {
    name: "Ollama (Local)",
    category: "cloud_provider",
    icon: "ollama",
    iconColor: "#000000",
    websiteUrl: "https://ollama.com",
    apiKeyField: "ANTHROPIC_AUTH_TOKEN",
    credentialOptional: true,
    defaultEnv: {
      ANTHROPIC_BASE_URL: "http://localhost:11434",
      API_TIMEOUT_MS: "3000000",
      ANTHROPIC_AUTH_TOKEN: "ollama",
      ANTHROPIC_API_KEY: "ollama",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "qwen3-coder",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "qwen3-coder",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "qwen3-coder",
    },
  },

  // --- Custom ---
  {
    name: "Custom",
    category: "custom",
    apiKeyField: "ANTHROPIC_AUTH_TOKEN",
    defaultEnv: {
      API_TIMEOUT_MS: "3000000",
    },
  },
];

export function getPresetsByCategory(): { category: ProviderCategory; label: string; presets: ProviderPreset[] }[] {
  const groups = new Map<ProviderCategory, ProviderPreset[]>();
  for (const p of providerPresets) {
    const list = groups.get(p.category) || [];
    list.push(p);
    groups.set(p.category, list);
  }

  const order: ProviderCategory[] = ["official", "cn_official", "cloud_provider", "aggregator", "third_party", "custom"];
  return order
    .filter((c) => groups.has(c))
    .map((c) => ({ category: c, label: CATEGORY_LABELS[c], presets: groups.get(c)! }));
}
