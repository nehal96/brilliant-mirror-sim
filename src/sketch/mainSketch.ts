import p5 from "p5";
import {
  SceneConfig,
  SceneElement,
  ViewerElement,
  MirrorElement,
} from "@/lib/types";

// Define the props structure the sketch expects
interface SketchProps {
  sceneConfig: SceneConfig;
}

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
    p.background(230); // Clear background on each frame

    // Draw elements if config exists
    if (currentSceneConfig) {
      currentSceneConfig.elements.forEach((element) => {
        drawElement(p, element); // Call helper function to draw each element
      });
    } else {
      // Fallback text if no config yet
      p.fill(50);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text("Loading Scene...", p.width / 2, p.height / 2);
    }
  };

  // Helper function to draw different element types
  const drawElement = (p: p5, element: SceneElement) => {
    switch (element.type) {
      case "viewer":
        drawViewer(p, element);
        break;
      case "mirror":
        drawMirror(p, element);
        break;
      // Add cases for other element types later
      default:
        console.warn(`Unknown element type: ${(element as any).type}`);
    }
  };

  // Function to draw a ViewerElement
  const drawViewer = (p: p5, viewer: ViewerElement) => {
    const radius = viewer.radius ?? 10; // Default radius if not provided
    p.push(); // Isolate drawing styles
    p.fill(0, 0, 255); // Blue color for viewer
    p.noStroke();
    p.ellipse(viewer.position.x, viewer.position.y, radius * 2, radius * 2); // Draw circle
    // Optional: Draw an 'eye' direction indicator if needed later
    p.pop(); // Restore previous styles
  };

  // Function to draw a MirrorElement
  const drawMirror = (p: p5, mirror: MirrorElement) => {
    const thickness = mirror.thickness ?? 2; // Default thickness
    p.push(); // Isolate drawing styles
    p.stroke(100, 100, 100); // Grey color for mirror
    p.strokeWeight(thickness);
    p.line(mirror.start.x, mirror.start.y, mirror.end.x, mirror.end.y); // Draw line
    // Optional: Add visual cue for reflective side later if needed
    p.pop(); // Restore previous styles
  };

  // ... (optional windowResized) ...
};

// Extend p5 instance type definition to include our custom method
declare module "p5" {
  interface p5InstanceExtensions {
    updateWithProps: (props: SketchProps) => void;
  }
}
