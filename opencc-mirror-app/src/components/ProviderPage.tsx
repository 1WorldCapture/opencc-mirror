import { useProviderPresets } from "../hooks/useInstances";
import { Layers, Key, Globe, Zap } from "lucide-react";
import type { ProviderPreset } from "../lib/api/types";

export default function ProviderPage() {
  const { data: presets, isLoading } = useProviderPresets();

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Providers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Available model providers for your instances
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets?.map((preset) => (
          <ProviderCard key={preset.key} preset={preset} />
        ))}
      </div>
    </div>
  );
}

function ProviderCard({ preset }: { preset: ProviderPreset }) {
  const authIcon = preset.auth_mode === "apiKey"
    ? <Key size={14} className="text-blue-500" />
    : preset.auth_mode === "authToken"
    ? <Zap size={14} className="text-amber-500" />
    : <Globe size={14} className="text-green-500" />;

  const authLabel = preset.auth_mode === "apiKey"
    ? "API Key"
    : preset.auth_mode === "authToken"
    ? "Auth Token"
    : "No Auth";

  return (
    <div className="border rounded-lg p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Layers size={16} className="text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{preset.label}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {authIcon}
            <span>{authLabel}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{preset.description}</p>

      {preset.base_url && (
        <p className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded truncate">
          {preset.base_url}
        </p>
      )}

      {preset.requires_model_mapping && (
        <span className="inline-block mt-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
          Custom models
        </span>
      )}

      {preset.credential_optional && (
        <span className="inline-block mt-2 ml-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
          No key required
        </span>
      )}
    </div>
  );
}
