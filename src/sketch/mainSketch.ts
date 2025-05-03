import p5 from "p5";
import {
  SceneConfig,
  SceneElement,
  ViewerElement,
  MirrorElement,
  ObjectElement,
  PointCoords,
  VirtualObjectElement,
  RayPath,
  StyleParams,
} from "@/lib/types";
import {
  calculateVirtualImagePosition,
  calculateVirtualObject,
  calculateSingleReflectionPath,
} from "@/lib/simulation";

// Define the props structure the sketch expects
interface SketchProps {
  sceneConfig: SceneConfig;
  onSceneUpdate?: (newConfig: SceneConfig) => void; // Add optional callback
}

// Helper to get style param or default
const getStyle = <K extends keyof StyleParams>(
  config: SceneConfig | null,
  key: K,
  defaultValue: NonNullable<StyleParams[K]>
): NonNullable<StyleParams[K]> => {
  return config?.styleParams?.[key] ?? defaultValue;
};

// Draws a viewer element
const drawViewer = (
  p: p5,
  element: ViewerElement,
  config: SceneConfig | null
) => {
  const color = getStyle(config, "viewerColor", [0, 0, 255]); // Default Blue
  const defaultRadius = getStyle(config, "defaultViewerRadius", 7.5);
  p.fill(color);
  p.noStroke();
  const radius = element.radius ?? defaultRadius; // Use element radius or default from style
  p.ellipse(element.position.x, element.position.y, radius * 2, radius * 2);
};

// Draws a mirror element
const drawMirror = (
  p: p5,
  element: MirrorElement,
  config: SceneConfig | null
) => {
  const color = getStyle(config, "mirrorColor", [100]); // Default Grey
  const defaultThickness = getStyle(config, "defaultMirrorThickness", 3);
  p.stroke(color);
  p.strokeWeight(element.thickness ?? defaultThickness); // Use element thickness or default from style
  p.line(element.start.x, element.start.y, element.end.x, element.end.y);
};

// Draws an object element as a triangle pointing right
const drawObject = (
  p: p5,
  element: ObjectElement,
  config: SceneConfig | null
) => {
  const color = getStyle(config, "objectColor", [255, 0, 0]); // Default Red
  const defaultRadius = getStyle(config, "defaultObjectRadius", 10);
  p.fill(color);
  p.noStroke();
  const radius = element.radius ?? defaultRadius; // Use element radius or default from style
  const x = element.position.x;
  const y = element.position.y;

  // Define triangle vertices relative to position
  const x1 = x + radius; // Pointy vertex (right)
  const y1 = y;
  const x2 = x - radius / 2; // Top-left vertex
  const y2 = y - radius;
  const x3 = x - radius / 2; // Bottom-left vertex
  const y3 = y + radius;

  p.triangle(x1, y1, x2, y2, x3, y3);
};

// Draws the virtual image of the viewer
const drawVirtualViewer = (
  p: p5,
  position: PointCoords,
  originalViewer: ViewerElement,
  config: SceneConfig | null
) => {
  const color = getStyle(config, "virtualViewerColor", [0, 0, 255, 150]); // Default Semi-transparent Blue
  const weight = getStyle(config, "virtualImageStrokeWeight", 1);
  const defaultRadius = getStyle(config, "defaultViewerRadius", 7.5);

  p.stroke(color);
  p.strokeWeight(weight);
  p.noFill();
  const radius = originalViewer.radius ?? defaultRadius; // Use original radius or default from style
  p.ellipse(position.x, position.y, radius * 2, radius * 2);
};

// Draws the virtual image of the object as a triangle
const drawVirtualObject = (
  p: p5,
  virtualObject: VirtualObjectElement,
  config: SceneConfig | null
) => {
  const color = getStyle(config, "virtualObjectColor", [255, 0, 0, 150]); // Default Semi-transparent Red
  const weight = getStyle(config, "virtualImageStrokeWeight", 1);

  p.stroke(color);
  p.strokeWeight(weight);
  p.noFill();

  if (
    virtualObject.shape === "triangle" &&
    virtualObject.vertices.length === 3
  ) {
    p.triangle(
      virtualObject.vertices[0].x,
      virtualObject.vertices[0].y,
      virtualObject.vertices[1].x,
      virtualObject.vertices[1].y,
      virtualObject.vertices[2].x,
      virtualObject.vertices[2].y
    );
  } else if (
    virtualObject.shape === "point" &&
    virtualObject.vertices.length === 1
  ) {
    const pos = virtualObject.vertices[0];
    const radius = 5; // Keep this small radius fixed for the point marker? Or make configurable? Let's keep it fixed for now.
    p.ellipse(pos.x, pos.y, radius * 2, radius * 2);
    p.line(pos.x - 3, pos.y, pos.x + 3, pos.y);
    p.line(pos.x, pos.y - 3, pos.x, pos.y + 3);
  } else {
    console.warn(
      "Cannot draw virtual object: Invalid shape or vertex count.",
      virtualObject
    );
  }
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

// Helper function to draw an arrow head at the end of a line segment
const drawArrow = (
  p: p5,
  start: PointCoords,
  end: PointCoords,
  color: p5.Color,
  size: number
) => {
  p.push(); // Isolate drawing styles
  p.stroke(color);
  p.fill(color);
  p.strokeWeight(1); // Use a fixed stroke weight for the arrowhead

  const angle = p.atan2(end.y - start.y, end.x - start.x); // Angle of the line segment
  p.translate(end.x, end.y); // Move the origin to the endpoint 'end'
  p.rotate(angle); // Rotate the coordinate system to align with the line

  // Draw the triangle shape for the arrowhead
  // Points are relative to the endpoint 'end' after translation and rotation
  // The triangle points back along the line direction
  p.triangle(-size, size / 2, -size, -size / 2, 0, 0);

  p.pop(); // Restore original drawing styles and coordinate system
};

// NEW: Function specifically for drawing the ray path
const drawRayPath = (p: p5, rayPath: RayPath, config: SceneConfig | null) => {
  const rayColorValue = getStyle(config, "rayColor", [243, 198, 35]); // Default Dark Yellow
  const rayColor = p.color(rayColorValue); // Ensure it's a p5.Color object
  const arrowSize = getStyle(config, "arrowSize", 8);
  const rayWeight = getStyle(config, "rayWeight", 1.5);

  p.push(); // Isolate styles for the ray path

  p.stroke(rayColor);
  p.strokeWeight(rayWeight);
  p.noFill(); // Don't fill the lines themselves

  // Draw line segment from object to mirror
  p.line(
    rayPath.objectPoint.x,
    rayPath.objectPoint.y,
    rayPath.mirrorPoint.x,
    rayPath.mirrorPoint.y
  );
  // Draw arrow pointing to the mirror reflection point
  drawArrow(p, rayPath.objectPoint, rayPath.mirrorPoint, rayColor, arrowSize);

  // Draw line segment from mirror to viewer
  p.line(
    rayPath.mirrorPoint.x,
    rayPath.mirrorPoint.y,
    rayPath.viewerPoint.x,
    rayPath.viewerPoint.y
  );
  // Draw arrow pointing to the viewer
  drawArrow(p, rayPath.mirrorPoint, rayPath.viewerPoint, rayColor, arrowSize);

  p.pop(); // Restore previous styles
};

export const sketch = (p: p5) => {
  let currentSceneConfig: SceneConfig | null = null;
  let canvasWidth = 600; // Default width
  let canvasHeight = 400; // Default height
  let onSceneUpdateCallback: ((newConfig: SceneConfig) => void) | null = null; // Store the callback

  // --- State for Dragging ---
  let draggedElementId: string | null = null; // NEW: Store ID of dragged element
  let dragOffset: PointCoords = { x: 0, y: 0 }; // Offset from mouse to element center
  let elementWasDragged = false; // NEW: Flag to track if a drag actually happened

  // Function for React component to update sketch props
  p.updateWithProps = (props: SketchProps) => {
    if (props.sceneConfig) {
      // Only update if the incoming config is different (simple check)
      // This prevents overwriting the sketch's state during a drag
      if (!draggedElementId) {
        // Check if *any* element is being dragged
        currentSceneConfig = props.sceneConfig as SceneConfig;
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

    // Pass currentSceneConfig to drawing functions
    const viewer = currentSceneConfig.elements.find(
      (el): el is ViewerElement => el.type === "viewer"
    );
    const mirror = currentSceneConfig.elements.find(
      (el): el is MirrorElement => el.type === "mirror"
    );
    const object = currentSceneConfig.elements.find(
      (el): el is ObjectElement => el.type === "object"
    );

    // --- Draw Static Elements ---
    currentSceneConfig.elements.forEach((element) => {
      switch (element.type) {
        case "viewer":
          drawViewer(p, element as ViewerElement, currentSceneConfig);
          break;
        case "mirror":
          drawMirror(p, element as MirrorElement, currentSceneConfig);
          break;
        case "object":
          drawObject(p, element as ObjectElement, currentSceneConfig);
          break;
      }
    });

    // --- Calculate and Draw Virtual Images ---
    if (mirror) {
      if (viewer) {
        const virtualViewerPos = calculateVirtualImagePosition(
          viewer.position,
          mirror
        );
        if (virtualViewerPos) {
          drawVirtualViewer(p, virtualViewerPos, viewer, currentSceneConfig);
        }
      }
      if (object) {
        const virtualObject = calculateVirtualObject(object, mirror);
        if (virtualObject) {
          drawVirtualObject(p, virtualObject, currentSceneConfig);
        }
      }
    }

    // --- Calculate and Draw Ray Path ---
    if (object && viewer && mirror) {
      const rayPath = calculateSingleReflectionPath(
        object.position,
        viewer.position,
        mirror
      );

      // Call the dedicated drawing function if a path exists
      if (rayPath) {
        drawRayPath(p, rayPath, currentSceneConfig); // Pass config
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
    elementWasDragged = false; // Reset drag flag
    draggedElementId = null; // Reset dragged element

    // Find which element (viewer or object) is clicked
    for (const element of currentSceneConfig.elements) {
      if (element.type === "viewer" || element.type === "object") {
        // Use radius for click detection (ensure object has a radius)
        const radius = element.radius || (element.type === "viewer" ? 7.5 : 10);
        const d = p.dist(
          p.mouseX,
          p.mouseY,
          element.position.x,
          element.position.y
        );

        if (d < radius) {
          draggedElementId = element.id; // Store the ID of the clicked element
          dragOffset.x = element.position.x - p.mouseX;
          dragOffset.y = element.position.y - p.mouseY;
          return; // Stop checking once an element is found
        }
      }
    }
  };

  p.mouseDragged = () => {
    // Check if we are dragging *any* element
    if (draggedElementId && currentSceneConfig) {
      // Find the element being dragged
      const elementToDrag = currentSceneConfig.elements.find(
        (el) => el.id === draggedElementId
      );

      // Check if the element exists and has a position (viewer or object)
      if (elementToDrag && "position" in elementToDrag) {
        // 1. Calculate potential next position
        let nextX = p.mouseX + dragOffset.x;
        let nextY = p.mouseY + dragOffset.y;

        // 2. Apply canvas boundary constraints
        nextX = p.constrain(nextX, 0, canvasWidth);
        nextY = p.constrain(nextY, 0, canvasHeight);

        // 3. Update the element's position directly
        elementToDrag.position.x = nextX;
        elementToDrag.position.y = nextY;
        elementWasDragged = true; // Mark that a drag occurred
      }
    }
  };

  p.mouseReleased = () => {
    // If we were dragging an element and a drag actually happened,
    // notify the React component to update its state.
    if (
      draggedElementId &&
      elementWasDragged &&
      onSceneUpdateCallback &&
      currentSceneConfig
    ) {
      // Pass a deep copy to avoid potential mutation issues if React holds onto the same object reference
      const configToSend = JSON.parse(JSON.stringify(currentSceneConfig));
      onSceneUpdateCallback(configToSend);
    }
    // Stop dragging
    draggedElementId = null;
    elementWasDragged = false; // Reset flag
  };
};

// Extend p5 instance type definition to include our custom method
declare module "p5" {
  interface p5InstanceExtensions {
    updateWithProps: (props: SketchProps) => void;
  }
}
