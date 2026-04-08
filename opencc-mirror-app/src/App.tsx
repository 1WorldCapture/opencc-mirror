import { useState } from "react";
import { Box, Layers, Server } from "lucide-react";
import InstanceList from "./components/InstanceList";
import ProviderPage from "./components/ProviderPage";

type NavItem = "instances" | "providers";

const NAV_ITEMS: { key: NavItem; label: string; icon: typeof Box }[] = [
  { key: "instances", label: "Instances", icon: Box },
  { key: "providers", label: "Providers", icon: Layers },
];

export default function App() {
  const [activeNav, setActiveNav] = useState<NavItem>("instances");

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
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

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {activeNav === "instances" && <InstanceList />}
        {activeNav === "providers" && <ProviderPage />}
      </main>
    </div>
  );
}
