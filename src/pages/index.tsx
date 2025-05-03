import React, { useState } from "react";
import SimulationCanvas from "@/components/SimulationCanvas";
import { SceneConfig, ViewerElement, MirrorElement } from "@/lib/types";
import { Geist, Geist_Mono } from "next/font/google";

// Keep font setup
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>({
    elements: [
      {
        id: "viewer-1",
        type: "viewer",
        position: { x: 150, y: 200 },
        radius: 10, // Example radius
      },
      {
        id: "mirror-1",
        type: "mirror",
        start: { x: 300, y: 50 },
        end: { x: 300, y: 350 },
        thickness: 5, // Example thickness
      },
      // Add more elements here if needed
    ],
    canvasSize: { width: 600, height: 400 }, // Pass canvas size if sketch needs it
  });

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex flex-col items-center justify-start min-h-screen p-8 pt-12`}
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
          <pre className="text-xs mt-4 p-2 bg-gray-100 rounded overflow-auto max-h-60">
            {JSON.stringify(sceneConfig, null, 2)}
          </pre>
        </div>
      </aside>
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Phase 1: Static Elements Rendered.</p>
      </footer>
    </div>
  );
}
