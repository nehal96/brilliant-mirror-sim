import React, { useState } from "react";
import SimulationCanvas from "@/components/SimulationCanvas";
import { SceneConfig } from "@/lib/types";

export default function Home() {
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>({
    elements: [],
  });

  return (
    <div
      className={`flex flex-col items-center justify-start min-h-screen p-8 pt-12`}
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center">Mirror Simulation</h1>
      </header>
      <main className="border border-gray-300 shadow-lg">
        <SimulationCanvas sceneConfig={sceneConfig} />
      </main>
      <aside className="mt-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Controls</h2>
        <div className="p-4 border border-dashed border-gray-400 rounded">
          <p className="text-gray-500">UI Controls will appear here.</p>
        </div>
      </aside>
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Phase 0 Complete: Basic Canvas Rendered.</p>
      </footer>
    </div>
  );
}
