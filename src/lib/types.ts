export type PointCoords = {
  x: number;
  y: number;
};

// Specific element types
export interface ViewerElement {
  id: string;
  type: 'viewer';
  position: PointCoords;
  radius?: number; // Optional: for drawing size
}

export interface MirrorElement {
  id: string;
  type: 'mirror';
  start: PointCoords;
  end: PointCoords;
  thickness?: number; // Optional: for drawing thickness
}

export interface ObjectElement {
  id: string;
  type: "object";
  position: PointCoords; // Center position
  shape?: "point" | "triangle"; // Define the shape
  radius?: number; // Used for size (e.g., triangle height/base related)
}

export interface VirtualObjectElement {
  id: string;
  type: "virtualObject";
  shape: "point" | "triangle"; // Match original shape
  vertices: PointCoords[]; // Store the reflected vertices
  originalObjectId: string; // Keep track of the source
}

// NEW TYPE for Ray Path
export type RayPath = {
  objectPoint: PointCoords; // Starting point (object's position)
  mirrorPoint: PointCoords; // Reflection point on the mirror surface
  viewerPoint: PointCoords; // Ending point (viewer's position)
};

// Union type for any scene element
export type SceneElement = ViewerElement | MirrorElement | ObjectElement;

export type SceneConfig = {
  elements: SceneElement[];
  canvasSize?: { width: number; height: number }; // Optional canvas size hint
  // Add other scene-wide parameters later if needed
};
