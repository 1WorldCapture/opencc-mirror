import { useState } from "react";
import InstanceList from "./components/InstanceList";

export default function App() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-auto p-6">
        <InstanceList />
      </main>
    </div>
  );
}
