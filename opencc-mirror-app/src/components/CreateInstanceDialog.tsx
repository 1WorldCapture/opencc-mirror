import { useState } from "react";
import { useCreateInstance, useProviderPresets } from "../hooks/useInstances";
import type { CreateInstanceInput, ProviderPreset } from "../lib/api/types";
import { X, Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";

interface Props {
  onClose: () => void;
}

type Step = "provider" | "configure" | "building";

export default function CreateInstanceDialog({ onClose }: Props) {
  const [step, setStep] = useState<Step>("provider");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const createMutation = useCreateInstance();
  const { data: presets } = useProviderPresets();

  const isCreating = createMutation.isPending;
  const preset = presets?.find((p) => p.key === selectedProvider);

  const canNextProvider = selectedProvider !== null;
  const canSubmit = name.trim().length > 0 && !isCreating;

  function handleProviderSelect(key: string) {
    setSelectedProvider(key);
    const p = presets?.find((pr) => pr.key === key);
    if (p && !baseUrl) {
      setBaseUrl(p.base_url);
    }
    if (p && name === "") {
      setName(key === "custom" ? "" : key.replace(/[^a-zA-Z0-9]/g, "-"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: CreateInstanceInput = {
      name: name.trim(),
      display_name: displayName.trim() || undefined,
      api_key: apiKey.trim() || undefined,
      base_url: baseUrl.trim() || undefined,
      provider_key: selectedProvider || undefined,
    };
    try {
      await createMutation.mutateAsync(input);
      onClose();
    } catch {
      // Error shown via mutation state
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {step === "provider" && "Choose Provider"}
            {step === "configure" && "Configure Instance"}
            {step === "building" && "Creating..."}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Step: Provider Selection */}
        {step === "provider" && (
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 gap-2">
              {presets?.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handleProviderSelect(p.key)}
                  className={`text-left p-3 border rounded-lg transition-colors ${
                    selectedProvider === p.key
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/30"
                  }`}
                >
                  <div className="font-medium text-sm">{p.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-accent">
                Cancel
              </button>
              <button
                onClick={() => setStep("configure")}
                disabled={!canNextProvider}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step: Configure */}
        {step === "configure" && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-4">
            {preset && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="font-medium">{preset.label}</span>
                <span className="text-muted-foreground"> — {preset.description}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. work, zai-dev"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">Terminal command name</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Work Instance"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {preset && preset.auth_mode !== "none" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {preset.api_key_label || "API Key"}
                  {!preset.credential_optional && <span className="text-destructive ml-1">*</span>}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={preset.auth_mode === "apiKey" ? "sk-..." : "token..."}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.anthropic.com"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
              />
            </div>

            {createMutation.isError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {String(createMutation.error)}
              </div>
            )}

            <div className="flex justify-between gap-3 pt-2 border-t">
              <button
                type="button"
                onClick={() => setStep("provider")}
                className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isCreating && <Loader2 size={16} className="animate-spin" />}
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
