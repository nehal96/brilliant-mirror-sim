import {
  SceneElement,
  StyleParams,
  PointCoords,
  ControlParams,
} from "@/lib/types";

// Define the base elements, including the second mirror
export const baseElements: SceneElement[] = [
  {
    id: "viewer-1",
    type: "viewer",
    position: { x: 300, y: 300 }, // Position between mirrors
    radius: 10,
  },
  {
    id: "mirror-1",
    type: "mirror",
    start: { x: 400, y: 50 }, // Right mirror
    end: { x: 400, y: 350 },
    thickness: 5,
  },
  {
    id: "mirror-2", // The new parallel mirror
    type: "mirror",
    start: { x: 200, y: 50 }, // Left mirror
    end: { x: 200, y: 350 },
    thickness: 5,
  },
  {
    id: "object-1",
    type: "object",
    position: { x: 300, y: 100 }, // Position between mirrors
    shape: "triangle",
    radius: 8,
  },
];

export const defaultCanvasSize = { width: 600, height: 400 };

export const defaultStyleParams: StyleParams = {
  viewerColor: [0, 0, 255], // Blue
  objectColor: [255, 0, 0], // Red
  mirrorColor: [100], // Grey
  rayColor: [243, 198, 35], // Dark Yellow
  virtualRayColor: [260, 160, 0, 100], // Semi-transparent Dark Yellow
  virtualViewerColor: [0, 0, 255, 150], // Semi-transparent Blue
  virtualObjectColor: [255, 0, 0, 150], // Semi-transparent Red
  defaultViewerRadius: 7.5,
  defaultObjectRadius: 10,
  defaultMirrorThickness: 3,
  rayWeight: 1.5,
  arrowSize: 8,
  virtualImageStrokeWeight: 1,
};

export const defaultControls: ControlParams = {
  showRayPaths: true,
  showParallelMirrors: false, // Default to single mirror view
};

/**
 * Filters a list of base SceneElements based on the provided control parameters.
 * @param elements - The full list of base scene elements.
 * @param controls - The current control settings.
 * @returns A new array containing only the elements that should be visible.
 */
export function filterVisibleElements(
  elements: Readonly<SceneElement[]>, // Use Readonly to indicate we don't modify the original
  controls: ControlParams
): SceneElement[] {
  if (controls.showParallelMirrors) {
    // Show all base elements when parallel mirrors are enabled
    return [...elements]; // Return a shallow copy
  } else {
    // Show non-mirrors and only the first mirror ('mirror-1')
    return elements.filter((el) => {
      return el.type !== "mirror" || el.id === "mirror-1";
    });
  }
}

/**
 * Merges the state of currently displayed elements (preserving positions)
 * with a new list of elements that should be visible based on controls.
 * @param currentElements - Elements currently in the scene state (may have updated positions).
 * @param nextVisibleBaseElements - The list of elements determined by filterVisibleElements (using base definitions).
 * @returns A new array of SceneElements for the next state, preserving positions where possible.
 */
export function mergeAndPreservePositions(
  currentElements: Readonly<SceneElement[]>,
  nextVisibleBaseElements: Readonly<SceneElement[]>
): SceneElement[] {
  // Create a map of current elements by ID for quick lookup
  const currentElementMap = new Map(currentElements.map((el) => [el.id, el]));

  // Map over the elements that *should* be visible next
  return nextVisibleBaseElements.map((baseEl) => {
    // Check if this element exists in the current state
    const currentVersion = currentElementMap.get(baseEl.id);
    // If it exists, use the current version (which has updated positions),
    // otherwise use the base definition.
    return currentVersion ? currentVersion : baseEl;
  });
}
