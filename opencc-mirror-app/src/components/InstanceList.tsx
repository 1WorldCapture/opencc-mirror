import { useState } from "react";
import { useInstances, useRemoveInstance, useLaunchInstance, useCheckOpenclaude } from "../hooks/useInstances";
import CreateInstanceDialog from "./CreateInstanceDialog";
import { Plus, Trash2, Play, FolderOpen, Terminal, AlertCircle, Layers } from "lucide-react";
import type { InstanceRow } from "../lib/api/types";
import { openInstanceFolder } from "../lib/api/instances";

export default function InstanceList() {
  const { data: instances, isLoading } = useInstances();
  const { data: isOpenclaudeInstalled } = useCheckOpenclaude();
  const removeMutation = useRemoveInstance();
  const launchMutation = useLaunchInstance();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instances</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your isolated OpenClaude Code instances
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          New Instance
        </button>
      </div>

      {isOpenclaudeInstalled === false && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">OpenClaude not detected</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Install: <code className="bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono text-xs">npm install -g @gitlawb/openclaude</code>
            </p>
          </div>
        </div>
      )}

      {instances && instances.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.name}
              instance={instance}
              onLaunch={() => launchMutation.mutate(instance.name)}
              onRemove={() => {
                if (confirm(`Remove instance "${instance.name}"?`)) {
                  removeMutation.mutate(instance.name);
                }
              }}
              onOpenFolder={(folder) => openInstanceFolder(instance.name, folder)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Terminal size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No instances yet</p>
          <p className="text-sm mt-1">Create your first isolated OpenClaude Code instance</p>
        </div>
      )}

      {showCreate && <CreateInstanceDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function InstanceCard({ instance, onLaunch, onRemove, onOpenFolder }: {
  instance: InstanceRow;
  onLaunch: () => void;
  onRemove: () => void;
  onOpenFolder: (folder: string) => void;
}) {
  const statusColor = instance.status === "ready"
    ? "bg-green-500"
    : instance.status === "error"
    ? "bg-red-500"
    : "bg-yellow-500";

  const providerLabel = instance.provider_name || instance.provider_id || "Custom";

  return (
    <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <h3 className="font-semibold">{instance.display_name || instance.name}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{providerLabel}</span>
      </div>

      {instance.base_url && (
        <p className="text-xs text-muted-foreground font-mono truncate mb-3">
          {instance.base_url}
        </p>
      )}

      {instance.error_message && (
        <p className="text-xs text-red-500 mb-3">{instance.error_message}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onLaunch}
          disabled={instance.status !== "ready"}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={14} />
          Launch
        </button>
        <button
          onClick={() => onOpenFolder("config")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded hover:bg-accent"
          title="Open config folder"
        >
          <FolderOpen size={14} />
        </button>
        <button
          onClick={onRemove}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-destructive border border-destructive/30 rounded hover:bg-destructive/10 ml-auto"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
        Run: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{instance.name}</code>
      </div>
    </div>
  );
}
