import { useState } from "react";
import { useCreateInstance, useProviders, useMcpServers, useSkills } from "../hooks/useInstances";
import { setInstanceMcpServers, setInstanceSkills } from "../lib/api/instances";
import type { CreateInstanceInput } from "../lib/api/types";
import { X, Loader2, ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  onClose: () => void;
}

type Step = "provider" | "skills" | "configure";

export default function CreateInstanceDialog({ onClose }: Props) {
  const [step, setStep] = useState<Step>("provider");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedMcpIds, setSelectedMcpIds] = useState<Set<string>>(new Set());
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const createMutation = useCreateInstance();
  const { data: providers } = useProviders();
  const { data: mcpServers } = useMcpServers();
  const { data: skills } = useSkills();

  const isCreating = createMutation.isPending;
  const selectedProvider = providers?.find((p) => p.id === selectedProviderId);
  const canSubmit = name.trim().length > 0 && !isCreating;

  function toggleMcp(id: string) {
    const next = new Set(selectedMcpIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedMcpIds(next);
  }

  function toggleSkill(id: string) {
    const next = new Set(selectedSkillIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedSkillIds(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: CreateInstanceInput = {
      name: name.trim(),
      display_name: displayName.trim() || undefined,
      provider_id: selectedProviderId || undefined,
      mcp_server_ids: Array.from(selectedMcpIds),
      skill_ids: Array.from(selectedSkillIds),
    };
    try {
      const instance = await createMutation.mutateAsync(input);
      if (selectedMcpIds.size > 0) {
        await setInstanceMcpServers(instance.name, Array.from(selectedMcpIds).map(id => ({ id, enabled: true })));
      }
      if (selectedSkillIds.size > 0) {
        await setInstanceSkills(instance.name, Array.from(selectedSkillIds).map(id => ({ id, enabled: true })));
      }
      onClose();
    } catch { /* error shown via mutation state */ }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {step === "provider" && "1. Choose Provider"}
            {step === "skills" && "2. Select Skills"}
            {step === "configure" && "3. Configure Instance"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-4">
          {(["provider", "skills", "configure"] as Step[]).map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${
              step === s ? "bg-primary" : i < ["provider", "skills", "configure"].indexOf(step) ? "bg-primary/50" : "bg-muted"
            }`} />
          ))}
        </div>

        {/* Step 1: Provider */}
        {step === "provider" && (
          <div className="flex-1 overflow-auto">
            {providers && providers.length > 0 ? (
              <div className="space-y-2">
                {providers.map((p) => {
                  const env: Record<string, string> = (() => {
                    try { return JSON.parse(p.settings_config)?.env || {}; } catch { return {}; }
                  })();
                  return (
                    <button key={p.id} onClick={() => { setSelectedProviderId(p.id); if (!name) setName(p.name.toLowerCase().replace(/\s+/g, "-")); }}
                      className={`w-full text-left p-3 border rounded-lg transition-colors ${
                        selectedProviderId === p.id ? "border-primary bg-primary/5" : "hover:border-primary/30"
                      }`}>
                      <div className="flex items-center gap-2">
                        {p.icon_color && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.icon_color }} />}
                        <span className="font-medium text-sm">{p.name}</span>
                        {p.category && <span className="text-xs text-muted-foreground ml-auto">{p.category}</span>}
                      </div>
                      {p.base_url && <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{p.base_url}</p>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <p>No providers configured yet.</p>
                <p className="mt-1">Add one in the Providers page first.</p>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
              <button onClick={() => setStep("skills")} disabled={!selectedProviderId}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Skills */}
        {step === "skills" && (
          <div className="flex-1 overflow-auto space-y-4">
            {mcpServers && mcpServers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">MCP Servers</h3>
                <div className="space-y-1">
                  {mcpServers.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent/50 cursor-pointer">
                      <input type="checkbox" checked={selectedMcpIds.has(s.id)} onChange={() => toggleMcp(s.id)} className="rounded" />
                      <span className="text-sm">{s.name}</span>
                      {s.description && <span className="text-xs text-muted-foreground">{s.description}</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {skills && skills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Skills</h3>
                <div className="space-y-1">
                  {skills.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent/50 cursor-pointer">
                      <input type="checkbox" checked={selectedSkillIds.has(s.id)} onChange={() => toggleSkill(s.id)} className="rounded" />
                      <span className="text-sm">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {(!mcpServers?.length && !skills?.length) && (
              <p className="text-sm text-muted-foreground text-center py-8">No MCP servers or skills yet. Skip to next step.</p>
            )}
            <div className="flex justify-between gap-3 pt-4 border-t">
              <button onClick={() => setStep("provider")} className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm">
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={() => setStep("configure")} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Configure */}
        {step === "configure" && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-4">
            {selectedProvider && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm flex items-center gap-3">
                <strong>Provider:</strong> {selectedProvider.name}
                {(selectedMcpIds.size > 0 || selectedSkillIds.size > 0) && (
                  <span className="text-muted-foreground">
                    {selectedMcpIds.size > 0 && `${selectedMcpIds.size} MCP`}
                    {selectedMcpIds.size > 0 && selectedSkillIds.size > 0 && " + "}
                    {selectedSkillIds.size > 0 && `${selectedSkillIds.size} skill${selectedSkillIds.size > 1 ? "s" : ""}`}
                  </span>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Name <span className="text-destructive">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. work, zai-dev"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
              <p className="text-xs text-muted-foreground mt-1">Terminal command name</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Work Instance"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
            </div>
            {createMutation.isError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{String(createMutation.error)}</div>
            )}
            <div className="flex justify-between gap-3 pt-2 border-t">
              <button type="button" onClick={() => setStep("skills")} className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm">
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" disabled={!canSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
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
