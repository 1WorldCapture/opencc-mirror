import { useState } from "react";
import { Box, Layers, Wrench } from "lucide-react";
import InstanceList from "./components/InstanceList";
import ProviderPage from "./components/ProviderPage";
import SkillPage from "./components/SkillPage";

type NavItem = "instances" | "providers" | "skills";

const NAV_ITEMS: { key: NavItem; label: string; icon: typeof Box }[] = [
  { key: "instances", label: "Instances", icon: Box },
  { key: "providers", label: "Providers", icon: Layers },
  { key: "skills", label: "Skills", icon: Wrench },
];

export default function App() {
  const [activeNav, setActiveNav] = useState<NavItem>("instances");

  return (
    <div className="flex h-screen bg-background">
      <nav className="w-52 border-r flex flex-col py-4 px-3">
        <h1 className="text-sm font-bold px-3 mb-4 text-foreground">OpenCC Mirror</h1>
        <div className="space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveNav(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                activeNav === key
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </nav>
      <main className="flex-1 overflow-auto p-6">
        {activeNav === "instances" && <InstanceList />}
        {activeNav === "providers" && <ProviderPage />}
        {activeNav === "skills" && <SkillPage />}
      </main>
    </div>
  );
}
