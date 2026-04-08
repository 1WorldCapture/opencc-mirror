import { useState } from "react";
import { useCreateInstance, useProviderPresets, useMcpServers, useSkills } from "../hooks/useInstances";
import { setInstanceMcpServers, setInstanceSkills } from "../lib/api/instances";
import type { CreateInstanceInput } from "../lib/api/types";
import { X, Loader2, ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  onClose: () => void;
}

type Step = "provider" | "skills" | "configure";

export default function CreateInstanceDialog({ onClose }: Props) {
  const [step, setStep] = useState<Step>("provider");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedMcpIds, setSelectedMcpIds] = useState<Set<string>>(new Set());
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const createMutation = useCreateInstance();
  const { data: presets } = useProviderPresets();
  const { data: mcpServers } = useMcpServers();
  const { data: skills } = useSkills();

  const isCreating = createMutation.isPending;
  const preset = presets?.find((p) => p.key === selectedProvider);
  const canSubmit = name.trim().length > 0 && !isCreating;

  function handleProviderSelect(key: string) {
    setSelectedProvider(key);
    const p = presets?.find((pr) => pr.key === key);
    if (p && !baseUrl) setBaseUrl(p.base_url);
    if (p && name === "") setName(key.replace(/[^a-zA-Z0-9]/g, "-"));
  }

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
      api_key: apiKey.trim() || undefined,
      base_url: baseUrl.trim() || undefined,
      provider_key: selectedProvider || undefined,
      mcp_server_ids: Array.from(selectedMcpIds),
      skill_ids: Array.from(selectedSkillIds),
    };
    try {
      const instance = await createMutation.mutateAsync(input);

      // Set MCP servers for the instance
      if (selectedMcpIds.size > 0) {
        const servers = Array.from(selectedMcpIds).map(id => ({ id, enabled: true }));
        await setInstanceMcpServers(instance.name, servers);
      }

      // Set skills for the instance
      if (selectedSkillIds.size > 0) {
        const skillList = Array.from(selectedSkillIds).map(id => ({ id, enabled: true }));
        await setInstanceSkills(instance.name, skillList);
      }

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
            {step === "provider" && "1. Choose Provider"}
            {step === "skills" && "2. Select Skills"}
            {step === "configure" && "3. Configure Instance"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Step indicators */}
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
            <div className="grid grid-cols-2 gap-2">
              {presets?.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handleProviderSelect(p.key)}
                  className={`text-left p-3 border rounded-lg transition-colors ${
                    selectedProvider === p.key ? "border-primary bg-primary/5" : "hover:border-primary/30"
                  }`}
                >
                  <div className="font-medium text-sm">{p.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-accent">Cancel</button>
              <button onClick={() => setStep("skills")} disabled={!selectedProvider}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Skills */}
        {step === "skills" && (
          <div className="flex-1 overflow-auto space-y-4">
            {/* MCP Servers */}
            {mcpServers && mcpServers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">MCP Servers</h3>
                <div className="space-y-1">
                  {mcpServers.map((server) => (
                    <label key={server.id} className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent/50 cursor-pointer">
                      <input type="checkbox" checked={selectedMcpIds.has(server.id)} onChange={() => toggleMcp(server.id)} className="rounded" />
                      <div>
                        <span className="text-sm">{server.name}</span>
                        {server.description && <span className="text-xs text-muted-foreground ml-2">{server.description}</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills && skills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Skills</h3>
                <div className="space-y-1">
                  {skills.map((skill) => (
                    <label key={skill.id} className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent/50 cursor-pointer">
                      <input type="checkbox" checked={selectedSkillIds.has(skill.id)} onChange={() => toggleSkill(skill.id)} className="rounded" />
                      <div>
                        <span className="text-sm">{skill.name}</span>
                        {skill.description && <span className="text-xs text-muted-foreground ml-2">{skill.description}</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(!mcpServers?.length && !skills?.length) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No MCP servers or skills configured yet. You can add them in the Skills page later.
              </p>
            )}

            <div className="flex justify-between gap-3 pt-4 border-t">
              <button onClick={() => setStep("provider")} className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={() => setStep("configure")} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Configure */}
        {step === "configure" && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-4">
            {preset && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm flex items-center gap-4">
                <span><strong>Provider:</strong> {preset.label}</span>
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
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. work, zai-dev"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
              <p className="text-xs text-muted-foreground mt-1">Terminal command name</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Work Instance"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {preset && preset.auth_mode !== "none" && (
              <div>
                <label className="block text-sm font-medium mb-1">{preset.api_key_label || "API Key"}</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                  placeholder={preset.auth_mode === "apiKey" ? "sk-..." : "token..."}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Base URL</label>
              <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.anthropic.com"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm" />
            </div>

            {createMutation.isError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {String(createMutation.error)}
              </div>
            )}

            <div className="flex justify-between gap-3 pt-2 border-t">
              <button type="button" onClick={() => setStep("skills")}
                className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" disabled={!canSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
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
