export type PointCoords = {
  x: number;
  y: number;
};

// Basic placeholder types for now
export type SceneElement = {
  id: string;
  type: string; // e.g., 'viewer', 'mirror', 'object'
  // Specific element properties will be added in later phases
};

export type SceneConfig = {
  elements: SceneElement[];
  // Add other scene-wide parameters later if needed
  // e.g., canvasSize: { width: number; height: number; }
};
