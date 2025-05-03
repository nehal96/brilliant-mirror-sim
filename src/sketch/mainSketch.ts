import p5 from "p5";
import {
  SceneConfig,
  SceneElement,
  ViewerElement,
  MirrorElement,
  PointCoords,
} from "@/lib/types";
import { calculateVirtualImagePosition } from "@/lib/simulation";

// Define the props structure the sketch expects
interface SketchProps {
  sceneConfig: SceneConfig;
  onSceneUpdate?: (newConfig: SceneConfig) => void; // Add optional callback
}

// Draws a viewer element
const drawViewer = (p: p5, element: ViewerElement) => {
  p.fill(0, 0, 255); // Blue for viewer
  p.noStroke();
  // Use radius from config if available later, default to 15 diameter
  const radius = element.radius || 7.5;
  p.ellipse(element.position.x, element.position.y, radius * 2, radius * 2);
};

// Draws a mirror element
const drawMirror = (p: p5, element: MirrorElement) => {
  p.stroke(100); // Grey for mirror
  p.strokeWeight(element.thickness || 3); // Use thickness from config or default
  p.line(element.start.x, element.start.y, element.end.x, element.end.y);
};

// Draws the virtual image of the viewer
const drawVirtualViewer = (
  p: p5,
  position: PointCoords,
  originalViewer: ViewerElement
) => {
  p.stroke(0, 0, 255, 150); // Semi-transparent blue stroke
  p.strokeWeight(1);
  p.noFill(); // No fill for virtual image
  const radius = originalViewer.radius || 7.5; // Match original viewer size
  p.ellipse(position.x, position.y, radius * 2, radius * 2);
};

// Helper function to get line equation Ax + By + C = 0 from two points
const getLineEquation = (
  start: PointCoords,
  end: PointCoords
): { A: number; B: number; C: number } => {
  const A = end.y - start.y;
  const B = start.x - end.x;
  const C = A * start.x + B * start.y;
  return { A, B, C };
};

export const sketch = (p: p5) => {
  let currentSceneConfig: SceneConfig | null = null;
  let canvasWidth = 600; // Default width
  let canvasHeight = 400; // Default height
  let onSceneUpdateCallback: ((newConfig: SceneConfig) => void) | null = null; // Store the callback

  // --- State for Dragging ---
  let isDraggingViewer = false;
  let dragOffset: PointCoords = { x: 0, y: 0 }; // Offset from mouse to viewer center
  let viewerWasDragged = false; // Flag to track if a drag actually happened

  // Function for React component to update sketch props
  p.updateWithProps = (props: SketchProps) => {
    if (props.sceneConfig) {
      // Only update if the incoming config is different (simple check)
      // This prevents overwriting the sketch's state during a drag
      if (!isDraggingViewer) {
        currentSceneConfig = props.sceneConfig;
      }
      // Update canvas size if provided
      if (props.sceneConfig.canvasSize) {
        canvasWidth = props.sceneConfig.canvasSize.width;
        canvasHeight = props.sceneConfig.canvasSize.height;
        if (
          p.canvas &&
          (p.width !== canvasWidth || p.height !== canvasHeight)
        ) {
          p.resizeCanvas(canvasWidth, canvasHeight);
        }
      }
    }
    // Store the callback function
    onSceneUpdateCallback = props.onSceneUpdate || null;
  };

  p.setup = () => {
    p.createCanvas(canvasWidth, canvasHeight);
    p.background(230);
    console.log("p5 setup complete");
  };

  p.draw = () => {
    p.background(240); // Light grey background

    if (!currentSceneConfig) {
      // Maybe draw a loading message or return
      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Loading scene...", canvasWidth / 2, canvasHeight / 2);
      return;
    }

    const viewer = currentSceneConfig.elements.find(
      (el): el is ViewerElement => el.type === "viewer"
    );
    const mirror = currentSceneConfig.elements.find(
      (el): el is MirrorElement => el.type === "mirror"
    );

    // --- Draw Static Elements ---
    currentSceneConfig.elements.forEach((element) => {
      switch (element.type) {
        case "viewer":
          drawViewer(p, element as ViewerElement);
          break;
        case "mirror":
          drawMirror(p, element as MirrorElement);
          break;
      }
    });

    // --- Calculate and Draw Virtual Image ---
    if (viewer && mirror) {
      const virtualViewerPos = calculateVirtualImagePosition(
        viewer.position,
        mirror
      );

      if (virtualViewerPos) {
        drawVirtualViewer(p, virtualViewerPos, viewer);
      }
    }

    // Reset drawing styles for next frame if needed
    p.strokeWeight(1);
    p.noStroke();
    p.fill(255);
  };

  // --- Mouse Interaction Handlers ---

  p.mousePressed = () => {
    if (!currentSceneConfig) return;
    viewerWasDragged = false; // Reset drag flag

    const viewer = currentSceneConfig.elements.find(
      (el): el is ViewerElement => el.type === "viewer"
    );

    if (viewer) {
      const radius = viewer.radius || 7.5;
      const d = p.dist(
        p.mouseX,
        p.mouseY,
        viewer.position.x,
        viewer.position.y
      );

      if (d < radius) {
        isDraggingViewer = true;
        dragOffset.x = viewer.position.x - p.mouseX;
        dragOffset.y = viewer.position.y - p.mouseY;
      }
    }
  };

  p.mouseDragged = () => {
    if (isDraggingViewer) {
      const viewer = currentSceneConfig?.elements.find(
        (el): el is ViewerElement => el.type === "viewer"
      );
      // No need to find the mirror for basic dragging

      if (viewer) {
        // 1. Calculate potential next position
        let nextX = p.mouseX + dragOffset.x;
        let nextY = p.mouseY + dragOffset.y;

        // 2. Apply canvas boundary constraints
        nextX = p.constrain(nextX, 0, canvasWidth);
        nextY = p.constrain(nextY, 0, canvasHeight);

        // 3. Update viewer position directly (no mirror check)
        viewer.position.x = nextX;
        viewer.position.y = nextY;
        viewerWasDragged = true; // Mark that a drag occurred
      }
    }
  };

  p.mouseReleased = () => {
    // If we were dragging the viewer and a drag actually happened,
    // notify the React component to update its state.
    if (
      isDraggingViewer &&
      viewerWasDragged &&
      onSceneUpdateCallback &&
      currentSceneConfig
    ) {
      // Pass a deep copy to avoid potential mutation issues if React holds onto the same object reference
      const configToSend = JSON.parse(JSON.stringify(currentSceneConfig));
      onSceneUpdateCallback(configToSend);
    }
    // Stop dragging
    isDraggingViewer = false;
    viewerWasDragged = false; // Reset flag
  };
};

// Extend p5 instance type definition to include our custom method
declare module "p5" {
  interface p5InstanceExtensions {
    updateWithProps: (props: SketchProps) => void;
  }
}
