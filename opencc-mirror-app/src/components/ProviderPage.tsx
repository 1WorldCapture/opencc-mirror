import { useState } from "react";
import { useProviders, useAddProvider, useUpdateProvider, useDeleteProvider } from "../hooks/useInstances";
import type { ProviderRow, ProviderInput } from "../lib/api/types";
import { getPresetsByCategory, type ProviderPreset } from "../config/providerPresets";
import { Plus, Trash2, Pencil, X, ExternalLink, Key } from "lucide-react";

export default function ProviderPage() {
  const { data: providers, isLoading } = useProviders();
  const [showAdd, setShowAdd] = useState(false);
  const [editProvider, setEditProvider] = useState<ProviderRow | null>(null);

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Providers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your API providers and credentials</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          <Plus size={16} /> Add Provider
        </button>
      </div>

      {providers && providers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} onEdit={() => setEditProvider(p)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No providers yet. Add one to get started.</p>
        </div>
      )}

      {showAdd && <ProviderFormDialog onClose={() => setShowAdd(false)} />}
      {editProvider && (
        <ProviderFormDialog provider={editProvider} onClose={() => setEditProvider(null)} />
      )}
    </div>
  );
}

function ProviderCard({ provider, onEdit }: { provider: ProviderRow; onEdit: () => void }) {
  const deleteMutation = useDeleteProvider();
  const env: Record<string, string> = (() => {
    try { return JSON.parse(provider.settings_config)?.env || {}; } catch { return {}; }
  })();

  return (
    <div className="border rounded-lg p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {provider.icon_color && (
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: provider.icon_color }} />
          )}
          <h3 className="font-semibold text-sm">{provider.name}</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-accent"><Pencil size={13} /></button>
          <button onClick={() => { if (confirm(`Delete "${provider.name}"?`)) deleteMutation.mutate(provider.id); }}
            className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 size={13} /></button>
        </div>
      </div>
      {provider.base_url && (
        <p className="text-xs font-mono text-muted-foreground truncate">{provider.base_url}</p>
      )}
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        {env.ANTHROPIC_API_KEY && <span className="flex items-center gap-1"><Key size={10} /> API Key</span>}
        {env.ANTHROPIC_AUTH_TOKEN && <span className="flex items-center gap-1"><Key size={10} /> Token</span>}
        {provider.category && <span className="bg-muted px-1.5 py-0.5 rounded">{provider.category}</span>}
      </div>
    </div>
  );
}

function ProviderFormDialog({ provider, onClose }: { provider?: ProviderRow; onClose: () => void }) {
  const isEdit = !!provider;
  const addMutation = useAddProvider();
  const updateMutation = useUpdateProvider();

  const [mode, setMode] = useState<"preset" | "manual">(isEdit ? "manual" : "preset");
  const [name, setName] = useState(provider?.name || "");
  const [baseUrl, setBaseUrl] = useState(provider?.base_url || "");
  const [apiKeyField, setApiKeyField] = useState(provider?.api_key_field || "ANTHROPIC_AUTH_TOKEN");
  const [apiKey, setApiKey] = useState("");
  const [haikuModel, setHaikuModel] = useState("");
  const [sonnetModel, setSonnetModel] = useState("");
  const [opusModel, setOpusModel] = useState("");
  const [category, setCategory] = useState(provider?.category || "custom");

  // Parse existing env if editing
  const existingEnv: Record<string, string> = isEdit ? (() => {
    try { return JSON.parse(provider!.settings_config)?.env || {}; } catch { return {}; }
  })() : {};

  function applyPreset(preset: ProviderPreset) {
    setName(preset.name);
    setBaseUrl(preset.defaultEnv.ANTHROPIC_BASE_URL || "");
    setApiKeyField(preset.apiKeyField);
    setCategory(preset.category);
    setHaikuModel(preset.defaultEnv.ANTHROPIC_DEFAULT_HAIKU_MODEL || "");
    setSonnetModel(preset.defaultEnv.ANTHROPIC_DEFAULT_SONNET_MODEL || "");
    setOpusModel(preset.defaultEnv.ANTHROPIC_DEFAULT_OPUS_MODEL || "");
    setMode("manual");
  }

  function buildSettingsConfig(): string {
    const env: Record<string, string> = {};

    // Keep existing env keys that aren't being edited
    for (const [k, v] of Object.entries(existingEnv)) {
      if (!k.startsWith("ANTHROPIC_") && k !== "API_TIMEOUT_MS" && k !== "DISABLE_AUTOUPDATER") {
        env[k] = v;
      }
    }

    env.DISABLE_AUTOUPDATER = "1";
    if (baseUrl) env.ANTHROPIC_BASE_URL = baseUrl;

    // Auth
    if (apiKey) {
      env[apiKeyField] = apiKey;
      if (apiKeyField === "ANTHROPIC_API_KEY") {
        env.CC_MIRROR_UNSET_AUTH_TOKEN = "1";
      }
    } else if (isEdit && existingEnv[apiKeyField]) {
      env[apiKeyField] = existingEnv[apiKeyField]; // preserve existing key
    }

    // Models
    if (haikuModel) env.ANTHROPIC_DEFAULT_HAIKU_MODEL = haikuModel;
    if (sonnetModel) env.ANTHROPIC_DEFAULT_SONNET_MODEL = sonnetModel;
    if (opusModel) { env.ANTHROPIC_DEFAULT_OPUS_MODEL = opusModel; env.ANTHROPIC_MODEL = opusModel; }

    return JSON.stringify({ env });
  }

  async function handleSave() {
    const input: ProviderInput = {
      name,
      settings_config: buildSettingsConfig(),
      base_url: baseUrl || undefined,
      api_key_field: apiKeyField,
      category,
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: provider!.id, input });
    } else {
      await addMutation.mutateAsync(input);
    }
    onClose();
  }

  const isSaving = addMutation.isPending || updateMutation.isPending;
  const canSave = name.trim().length > 0;

  const presetGroups = getPresetsByCategory();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit Provider" : "Add Provider"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        {!isEdit && mode === "preset" ? (
          /* Preset selector */
          <div className="flex-1 overflow-auto space-y-4">
            {presetGroups.map((group) => (
              <div key={group.category}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2">{group.label}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.presets.map((preset) => (
                    <button key={preset.name} onClick={() => applyPreset(preset)}
                      className="text-left p-2.5 border rounded-lg hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2">
                        {preset.iconColor && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.iconColor }} />}
                        <span className="text-sm font-medium">{preset.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setMode("manual")}
              className="w-full text-center text-sm text-muted-foreground py-3 border border-dashed rounded-lg hover:border-primary/30">
              Or configure manually...
            </button>
          </div>
        ) : (
          /* Form */
          <div className="flex-1 overflow-auto space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm" autoFocus />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder={isEdit ? "Leave empty to keep existing" : "Enter API key"}
                className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Base URL</label>
              <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Auth Field</label>
              <select value={apiKeyField} onChange={(e) => setApiKeyField(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option value="ANTHROPIC_AUTH_TOKEN">ANTHROPIC_AUTH_TOKEN</option>
                <option value="ANTHROPIC_API_KEY">ANTHROPIC_API_KEY</option>
              </select>
            </div>

            <details className="border rounded-lg">
              <summary className="px-3 py-2 text-sm cursor-pointer hover:bg-accent/50 rounded-lg">Model Overrides</summary>
              <div className="p-3 space-y-2">
                <input type="text" value={opusModel} onChange={(e) => setOpusModel(e.target.value)}
                  placeholder="Opus model (e.g. glm-5)" className="w-full px-2 py-1.5 border rounded text-sm font-mono" />
                <input type="text" value={sonnetModel} onChange={(e) => setSonnetModel(e.target.value)}
                  placeholder="Sonnet model (e.g. glm-4.7)" className="w-full px-2 py-1.5 border rounded text-sm font-mono" />
                <input type="text" value={haikuModel} onChange={(e) => setHaikuModel(e.target.value)}
                  placeholder="Haiku model (e.g. glm-4.5-air)" className="w-full px-2 py-1.5 border rounded text-sm font-mono" />
              </div>
            </details>

            {(addMutation.isError || updateMutation.isError) && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {String(addMutation.error || updateMutation.error)}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          {!isEdit && mode === "manual" && (
            <button onClick={() => setMode("preset")} className="px-4 py-2 border rounded-md text-sm">Back to Presets</button>
          )}
          {mode === "manual" && (
            <button onClick={handleSave} disabled={!canSave || isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
              {isSaving ? "Saving..." : isEdit ? "Save" : "Add"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
