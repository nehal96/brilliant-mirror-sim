import React, { useState, useCallback } from "react";
import SimulationCanvas from "@/components/SimulationCanvas";
import ControlPanel from "@/components/ControlPanel";
import { SceneConfig, ControlParams, SceneElement } from "@/lib/types";
import { Geist, Geist_Mono } from "next/font/google";
import {
  baseElements,
  defaultCanvasSize,
  defaultStyleParams,
  defaultControls,
  filterVisibleElements,
  mergeAndPreservePositions,
} from "@/config/sceneDefaults"; // Import defaults and helpers

// Keep font setup
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// No need to define baseElements, etc. here anymore

export default function Home() {
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>(() => {
    // Use the helper function for initial filtering
    const initialElements = filterVisibleElements(
      baseElements,
      defaultControls
    );

    return {
      elements: initialElements,
      canvasSize: defaultCanvasSize,
      styleParams: defaultStyleParams,
      controls: defaultControls,
    };
  });

  // Callback for drag updates from p5 sketch
  const handleSceneUpdate = useCallback((newConfig: SceneConfig) => {
    console.log("React updating sceneConfig state (drag)...");
    // Preserve controls and styles when elements are updated by dragging
    setSceneConfig((prevConfig) => ({
      ...newConfig, // Takes the updated elements array from the sketch
      controls: prevConfig.controls, // Keep existing controls
      styleParams: prevConfig.styleParams, // Keep existing styles
    }));
  }, []);

  // Callback for control panel updates (now much simpler)
  const handleControlChange = useCallback(
    (controlUpdates: Partial<ControlParams>) => {
      console.log("React updating controls state...");
      setSceneConfig((prevConfig) => {
        // 1. Determine the next control state
        const newControls = {
          ...(prevConfig.controls || defaultControls), // Start with previous or default
          ...controlUpdates, // Apply updates
        };

        // 2. Determine which elements should be visible based on *new* controls
        const nextVisibleBaseElements = filterVisibleElements(
          baseElements,
          newControls
        );

        // 3. Merge the next visible elements with current state to preserve positions
        const finalElements = mergeAndPreservePositions(
          prevConfig.elements,
          nextVisibleBaseElements
        );

        // 4. Return the new state
        return {
          ...prevConfig, // Keep canvasSize, styleParams
          elements: finalElements,
          controls: newControls,
        };
      });
    },
    [] // No dependencies needed as helpers are pure and baseElements is constant
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
        <p>Phase 9: Parallel Mirrors Toggle.</p>
      </footer>
    </div>
  );
}
