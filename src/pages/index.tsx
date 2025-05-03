import React, { useState, useCallback } from "react";
import SimulationCanvas from "@/components/SimulationCanvas";
import ControlPanel from "@/components/ControlPanel";
import { SceneConfig, ControlParams } from "@/lib/types";
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
        radius: 10, // Specific radius overrides default
      },
      {
        id: "mirror-1",
        type: "mirror",
        start: { x: 300, y: 50 },
        end: { x: 300, y: 350 },
        thickness: 5, // Specific thickness overrides default
      },
      {
        id: "object-1",
        type: "object",
        position: { x: 150, y: 100 },
        shape: "triangle",
        radius: 8, // Specific radius overrides default
      },
    ],
    canvasSize: { width: 600, height: 400 },
    // Add default style parameters
    styleParams: {
      viewerColor: [0, 0, 255], // Blue
      objectColor: [255, 0, 0], // Red
      mirrorColor: [100], // Grey
      rayColor: [243, 198, 35], // Dark Yellow
      virtualRayColor: [260, 160, 0, 100], // NEW: Semi-transparent Dark Yellow
      virtualViewerColor: [0, 0, 255, 150], // Semi-transparent Blue
      virtualObjectColor: [255, 0, 0, 150], // Semi-transparent Red
      defaultViewerRadius: 7.5,
      defaultObjectRadius: 10,
      defaultMirrorThickness: 3,
      rayWeight: 1.5,
      arrowSize: 8,
      virtualImageStrokeWeight: 1,
    },
    // Add default control parameters
    controls: {
      showRayPaths: true,
    },
  });

  // Define the callback function to update the state
  const handleSceneUpdate = useCallback((newConfig: SceneConfig) => {
    console.log("React updating sceneConfig state (drag)...");
    // Ensure controls are preserved during drag updates if not explicitly changed
    setSceneConfig((prevConfig) => ({
      ...newConfig,
      controls: prevConfig.controls, // Keep existing controls
      styleParams: prevConfig.styleParams, // Keep existing styles
    }));
  }, []); // Empty dependency array means the function reference is stable

  const handleControlChange = useCallback(
    (controlUpdates: Partial<ControlParams>) => {
      console.log("React updating controls state...");
      setSceneConfig((prevConfig) => ({
        ...prevConfig,
        controls: {
          ...(prevConfig.controls || {}), // Keep existing controls
          ...controlUpdates, // Apply updates
        },
      }));
    },
    []
  );

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex flex-col items-center justify-start min-h-screen p-8 pt-12`}
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center">Mirror Simulation</h1>
      </header>
      <main className="border border-gray-300 shadow-lg">
        <SimulationCanvas
          sceneConfig={sceneConfig}
          onSceneUpdate={handleSceneUpdate}
        />
      </main>
      <aside className="mt-8 w-full max-w-md">
        <ControlPanel
          controls={sceneConfig.controls}
          onControlChange={handleControlChange}
        />
        <pre className="text-xs mt-4 p-2 bg-gray-100 rounded overflow-auto max-h-60">
          {JSON.stringify(sceneConfig, null, 2)}
        </pre>
      </aside>
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Phase 8: UI Controls (Ray Path Toggle).</p>
      </footer>
    </div>
  );
}
