import { useState } from "react";
import { useCreateInstance } from "../hooks/useInstances";
import type { CreateInstanceInput } from "../lib/api/types";
import { X, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function CreateInstanceDialog({ onClose }: Props) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const createMutation = useCreateInstance();

  const isCreating = createMutation.isPending;
  const canSubmit = name.trim().length > 0 && !isCreating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: CreateInstanceInput = {
      name: name.trim(),
      display_name: displayName.trim() || undefined,
      api_key: apiKey.trim() || undefined,
      base_url: baseUrl.trim() || undefined,
    };
    try {
      await createMutation.mutateAsync(input);
      onClose();
    } catch {
      // Error is shown via mutation state
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create Instance</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Instance Name */}
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
              disabled={isCreating}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              This will be the command name in your terminal
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Work Instance"
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isCreating}
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
              disabled={isCreating}
            />
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium mb-1">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.anthropic.com (leave empty for default)"
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use the default Anthropic API endpoint
            </p>
          </div>

          {/* Error */}
          {createMutation.isError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {String(createMutation.error)}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-accent"
              disabled={isCreating}
            >
              Cancel
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
      </div>
    </div>
  );
}
