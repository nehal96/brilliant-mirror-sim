import p5 from "p5";
import {
  SceneConfig,
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
  isPointProjectedOnSegment,
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
  const virtualRayColorValue = getStyle(
    config,
    "virtualRayColor",
    [260, 160, 0, 100]
  ); // Default Semi-transparent Dark Yellow
  const virtualRayColor = p.color(virtualRayColorValue);
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

  // --- Draw Dotted Virtual Ray Segment ---
  // Use p5's 2D drawing context to set line dash
  const ctx = p.drawingContext as CanvasRenderingContext2D;
  ctx.save(); // Save current context state (like line style)
  ctx.setLineDash([5, 5]); // Set dash pattern [dash length, gap length]
  p.stroke(virtualRayColor); // Use the virtual ray color
  p.strokeWeight(rayWeight * 0.8); // Optional: make dotted line slightly thinner

  // Draw line from mirror point to virtual object point
  p.line(
    rayPath.mirrorPoint.x,
    rayPath.mirrorPoint.y,
    rayPath.virtualObjectPoint.x,
    rayPath.virtualObjectPoint.y
  );

  // Restore context state (including solid line style)
  ctx.restore();

  p.pop(); // Restore previous p5 styles
};

export const sketch = (p: p5) => {
  let currentSceneConfig: SceneConfig | null = null;
  let canvasWidth = 600; // Default width
  let canvasHeight = 400; // Default height
  let onSceneUpdateCallback: ((newConfig: SceneConfig) => void) | null = null; // Store the callback

  // --- State for Dragging ---
  let draggedElementId: string | null = null;
  let dragOffset: PointCoords = { x: 0, y: 0 };
  let elementWasDragged = false;

  // Function for React component to update sketch props
  p.updateWithProps = (props: SketchProps) => {
    if (props.sceneConfig) {
      if (!draggedElementId) {
        currentSceneConfig = props.sceneConfig as SceneConfig;
      }
    }
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
      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Loading scene...", canvasWidth / 2, canvasHeight / 2);
      return;
    }

    // --- Find Core Elements ---
    const viewer = currentSceneConfig.elements.find(
      (el): el is ViewerElement => el.type === "viewer"
    );
    const object = currentSceneConfig.elements.find(
      (el): el is ObjectElement => el.type === "object"
    );
    // Find *all* mirrors
    const mirrors = currentSceneConfig.elements.filter(
      (el): el is MirrorElement => el.type === "mirror"
    );
    // Get the first mirror for potentially drawing ray lines
    const firstMirror = mirrors.length > 0 ? mirrors[0] : undefined;

    // --- Draw All Base Elements Present in Config ---
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

    // --- Calculate and Draw Virtual Viewers for ALL Mirrors ---
    // (Virtual viewer visibility depends only on viewer position relative to mirror)
    if (viewer) {
      mirrors.forEach((mirror) => {
        const virtualViewerPos = calculateVirtualImagePosition(
          viewer.position,
          mirror
        );
        const viewerSeesMirror = isPointProjectedOnSegment(
          viewer.position,
          mirror.start,
          mirror.end
        );
        if (virtualViewerPos && viewerSeesMirror) {
          drawVirtualViewer(p, virtualViewerPos, viewer, currentSceneConfig);
        }
      });
    }

    // --- Calculate Ray Paths and Conditionally Draw Virtual Objects & Ray Lines ---
    if (viewer && object) {
      const shouldShowRays = currentSceneConfig.controls?.showRayPaths ?? true;

      mirrors.forEach((mirror) => {
        // Calculate the potential ray path for this mirror
        const rayPath = calculateSingleReflectionPath(
          object.position,
          viewer.position,
          mirror // Use the current mirror in the loop
        );

        // If a valid path exists (meaning the viewer can see the virtual object via this mirror)
        if (rayPath) {
          // Calculate the virtual object for this mirror
          const virtualObject = calculateVirtualObject(object, mirror);
          if (virtualObject) {
            // Draw the virtual object because it's visible to the viewer via this mirror
            drawVirtualObject(p, virtualObject, currentSceneConfig);
          }

          // Additionally, if ray paths are enabled AND this is the first mirror, draw the path lines
          if (shouldShowRays && mirror.id === firstMirror?.id) {
            drawRayPath(p, rayPath, currentSceneConfig);
          }
        }
        // If rayPath is null, the viewer cannot see the virtual object formed by this mirror,
        // so we draw neither the virtual object nor the ray path for it.
      });
    }

    // Reset drawing styles for next frame if needed
    p.strokeWeight(1);
    p.noStroke();
    p.fill(255);
  };

  // --- Mouse Interaction Handlers ---

  p.mousePressed = () => {
    if (!currentSceneConfig) return;
    elementWasDragged = false;
    draggedElementId = null;

    for (const element of currentSceneConfig.elements) {
      if (element.type === "viewer" || element.type === "object") {
        const radius = element.radius || (element.type === "viewer" ? 7.5 : 10);
        const d = p.dist(
          p.mouseX,
          p.mouseY,
          element.position.x,
          element.position.y
        );

        if (d < radius) {
          draggedElementId = element.id;
          dragOffset.x = element.position.x - p.mouseX;
          dragOffset.y = element.position.y - p.mouseY;
          return;
        }
      }
    }
  };

  p.mouseDragged = () => {
    if (draggedElementId && currentSceneConfig) {
      const elementToDrag = currentSceneConfig.elements.find(
        (el) => el.id === draggedElementId
      );

      if (elementToDrag && "position" in elementToDrag) {
        let nextX = p.mouseX + dragOffset.x;
        let nextY = p.mouseY + dragOffset.y;

        nextX = p.constrain(nextX, 0, canvasWidth);
        nextY = p.constrain(nextY, 0, canvasHeight);

        elementToDrag.position.x = nextX;
        elementToDrag.position.y = nextY;
        elementWasDragged = true;
      }
    }
  };

  p.mouseReleased = () => {
    if (
      draggedElementId &&
      elementWasDragged &&
      onSceneUpdateCallback &&
      currentSceneConfig
    ) {
      const configToSend = JSON.parse(JSON.stringify(currentSceneConfig));
      onSceneUpdateCallback(configToSend);
    }
    draggedElementId = null;
    elementWasDragged = false;
  };
};

// Extend p5 instance type definition to include our custom method
declare module "p5" {
  interface p5InstanceExtensions {
    updateWithProps: (props: SketchProps) => void;
  }
}
