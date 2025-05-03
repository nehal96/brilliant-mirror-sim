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

// Add other element types here later (e.g., ObjectElement)

// Union type for any scene element
export type SceneElement = ViewerElement | MirrorElement; // Add | ObjectElement later

export type SceneConfig = {
  elements: SceneElement[];
  canvasSize?: { width: number; height: number }; // Optional canvas size hint
  // Add other scene-wide parameters later if needed
};
