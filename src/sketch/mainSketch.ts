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

export const sketch = (p: p5) => {
  let currentSceneConfig: SceneConfig | null = null;
  let canvasWidth = 600; // Default width
  let canvasHeight = 400; // Default height

  // Function for React component to update sketch props
  p.updateWithProps = (props: SketchProps) => {
    if (props.sceneConfig) {
      currentSceneConfig = props.sceneConfig;
      // Update canvas size if provided in config
      if (props.sceneConfig.canvasSize) {
        canvasWidth = props.sceneConfig.canvasSize.width;
        canvasHeight = props.sceneConfig.canvasSize.height;
        // Check if canvas exists before resizing
        if (p.canvas) {
          p.resizeCanvas(canvasWidth, canvasHeight);
        }
      }
    }
  };

  p.setup = () => {
    p.createCanvas(canvasWidth, canvasHeight); // Use dynamic size
    p.background(230); // Light grey background
    console.log("p5 setup complete");
    // p.noLoop(); // Uncomment if the sketch should only draw once initially
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
        // Add cases for other element types here
        // default:
        //   console.warn("Unknown element type:", element.type);
      }
    });

    // --- Calculate and Draw Virtual Image ---
    if (viewer && mirror) {
      const virtualViewerPos = calculateVirtualImagePosition(
        viewer.position,
        mirror
      );

      if (virtualViewerPos) {
        // Draw the virtual viewer using the dedicated function
        drawVirtualViewer(p, virtualViewerPos, viewer);
      }
    }

    // Reset drawing styles for next frame if needed
    p.strokeWeight(1);
    p.noStroke();
    p.fill(255); // Reset fill to default (white)
  };

  // Add mousePressed, mouseDragged, mouseReleased later for Phase 3
};

// Extend p5 instance type definition to include our custom method
declare module "p5" {
  interface p5InstanceExtensions {
    updateWithProps: (props: SketchProps) => void;
  }
}
