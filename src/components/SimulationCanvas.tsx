import React, { useRef, useEffect } from "react";
import type p5 from "p5"; // Import p5 types
import { SceneConfig } from "@/lib/types";

interface SimulationCanvasProps {
  sceneConfig: SceneConfig;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ sceneConfig }) => {
  const sketchContainerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null); // Use p5 type

  useEffect(() => {
    let p5Instance: p5 | null = null;

    // Dynamically import p5 only on the client-side
    import("p5")
      .then((p5Module) => {
        const p5 = p5Module.default;

        // Dynamically import the sketch function
        import("@/sketch/mainSketch")
          .then((sketchModule) => {
            const { sketch } = sketchModule;

            // Ensure the container exists and no instance is already running
            if (sketchContainerRef.current && !p5InstanceRef.current) {
              // Create the p5 instance
              p5Instance = new p5(sketch, sketchContainerRef.current);

              // Pass initial props using the custom update function
              if ("updateWithProps" in p5Instance) {
                (p5Instance as p5 & p5.p5InstanceExtensions).updateWithProps({
                  sceneConfig,
                });
              }

              // Store the instance reference
              p5InstanceRef.current = p5Instance;
            }
          })
          .catch((err) => console.error("Failed to load sketch:", err));
      })
      .catch((err) => console.error("Failed to load p5:", err));

    // Cleanup function: remove the p5 instance when the component unmounts
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
        // console.log("p5 instance removed");
      }
    };
  }, []); // Empty dependency array: runs only once on mount

  // Effect to update the sketch when sceneConfig prop changes
  useEffect(() => {
    if (p5InstanceRef.current && "updateWithProps" in p5InstanceRef.current) {
      // Pass updated props to the running p5 instance
      (p5InstanceRef.current as p5 & p5.p5InstanceExtensions).updateWithProps({
        sceneConfig,
      });
    }
  }, [sceneConfig]); // Re-run this effect if sceneConfig changes

  return (
    <div ref={sketchContainerRef} className="simulation-canvas-container" />
  );
};

export default SimulationCanvas;
