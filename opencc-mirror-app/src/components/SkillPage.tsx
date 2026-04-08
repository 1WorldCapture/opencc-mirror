import { useState } from "react";
import { useMcpServers, useSkills, useUpsertMcpServer, useDeleteMcpServer, useUpsertSkill, useDeleteSkill } from "../hooks/useInstances";
import type { McpServerInput, SkillInput } from "../lib/api/types";
import { Plus, Trash2, Server, Puzzle } from "lucide-react";

type Tab = "mcp" | "skills";

export default function SkillPage() {
  const [tab, setTab] = useState<Tab>("mcp");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Skills</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage MCP servers and skills for your instances
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setTab("mcp")}
          className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
            tab === "mcp"
              ? "border-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Server size={14} /> MCP Servers
        </button>
        <button
          onClick={() => setTab("skills")}
          className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
            tab === "skills"
              ? "border-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Puzzle size={14} /> Skills
        </button>
      </div>

      {tab === "mcp" && <McpTab />}
      {tab === "skills" && <SkillsTab />}
    </div>
  );
}

// --- MCP Tab ---

function McpTab() {
  const { data: servers, isLoading } = useMcpServers();
  const upsert = useUpsertMcpServer();
  const remove = useDeleteMcpServer();
  const [showAdd, setShowAdd] = useState(false);

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus size={14} /> Add MCP Server
        </button>
      </div>

      {servers && servers.length > 0 ? (
        <div className="space-y-2">
          {servers.map((server) => (
            <div key={server.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{server.name}</h3>
                {server.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{server.description}</p>
                )}
                <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                  {server.server_config}
                </p>
              </div>
              <button
                onClick={() => { if (confirm(`Delete "${server.name}"?`)) remove.mutate(server.id); }}
                className="text-destructive hover:bg-destructive/10 p-2 rounded ml-2"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No MCP servers. Add one to use it in your instances.
        </div>
      )}

      {showAdd && (
        <AddMcpDialog
          onSave={(input) => { upsert.mutate(input); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

function AddMcpDialog({ onSave, onClose }: { onSave: (input: McpServerInput) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [envJson, setEnvJson] = useState("{}");
  const [description, setDescription] = useState("");

  function handleSave() {
    const config: Record<string, any> = { command };
    if (args.trim()) {
      config.args = args.trim().split(/\s+/);
    }
    try {
      const env = JSON.parse(envJson);
      if (Object.keys(env).length > 0) config.env = env;
    } catch {}

    onSave({
      id: name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name,
      server_config: JSON.stringify(config),
      description: description || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4">Add MCP Server</h2>
        <div className="space-y-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. browser)" className="w-full px-3 py-2 border rounded-md bg-background text-sm" autoFocus />
          <input type="text" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Command (e.g. npx)" className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm" />
          <input type="text" value={args} onChange={(e) => setArgs(e.target.value)} placeholder="Args (e.g. @anthropic/mcp-browser)" className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm" />
          <textarea value={envJson} onChange={(e) => setEnvJson(e.target.value)} placeholder='{"KEY": "value"}' className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm h-20" />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          <button onClick={handleSave} disabled={!name || !command} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">Add</button>
        </div>
      </div>
    </div>
  );
}

// --- Skills Tab ---

function SkillsTab() {
  const { data: skills, isLoading } = useSkills();
  const upsert = useUpsertSkill();
  const remove = useDeleteSkill();
  const [showAdd, setShowAdd] = useState(false);

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus size={14} /> Add Skill
        </button>
      </div>

      {skills && skills.length > 0 ? (
        <div className="space-y-2">
          {skills.map((skill) => (
            <div key={skill.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{skill.name}</h3>
                {skill.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                )}
                <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                  {skill.directory}
                </p>
              </div>
              <button
                onClick={() => { if (confirm(`Delete "${skill.name}"?`)) remove.mutate(skill.id); }}
                className="text-destructive hover:bg-destructive/10 p-2 rounded ml-2"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No skills. Add one to install it in your instances.
        </div>
      )}

      {showAdd && (
        <AddSkillDialog
          onSave={(input) => { upsert.mutate(input); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

function AddSkillDialog({ onSave, onClose }: { onSave: (input: SkillInput) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [directory, setDirectory] = useState("");
  const [description, setDescription] = useState("");

  function handleSave() {
    onSave({
      id: name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name,
      directory,
      description: description || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4">Add Skill</h2>
        <div className="space-y-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. react-patterns)" className="w-full px-3 py-2 border rounded-md bg-background text-sm" autoFocus />
          <input type="text" value={directory} onChange={(e) => setDirectory(e.target.value)} placeholder="Directory path (absolute)" className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm" />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          <button onClick={handleSave} disabled={!name || !directory} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">Add</button>
        </div>
      </div>
    </div>
  );
}
